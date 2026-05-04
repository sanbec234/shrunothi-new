"""
Verification harness for the payment security hardening.

Mocks out Razorpay client and DB-backing collections so we can exercise:
  C1: amount whitelist
  C2: webhook idempotency
  C3: payment.authorized does NOT activate subscription, captured does
  H1: rate limit triggers 429 after threshold
  H2: webhook returns 200 (not 4xx) on unknown order
  H3: webhook rejects non-JSON content-type
  M2: /payment-history hides razorpay_signature and metadata

Run from backend directory:
    python -m scripts.verify_payment_security
"""
import sys
import json
import hmac
import hashlib
from pathlib import Path
from unittest.mock import MagicMock, patch

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Provide env so razorpay_config doesn't warn-fail (we'll mock the client anyway).
import os
os.environ.setdefault("RAZORPAY_KEY_ID", "rzp_test_dummy")
os.environ.setdefault("RAZORPAY_SECRET_KEY", "secret_dummy")
os.environ.setdefault("RAZORPAY_WEBHOOK_SECRET", "webhook_secret_dummy")

# Stub out Mongo client BEFORE app loads so create_app's index calls don't crash.
from db import client as db_client
_fake_db = MagicMock()
db_client._db = _fake_db
db_client._client = MagicMock()
db_client.get_db = lambda: _fake_db

# In-memory "collections"
class FakeColl:
    def __init__(self):
        self.docs = []

    def insert_one(self, doc):
        self.docs.append(dict(doc))
        rv = MagicMock()
        rv.inserted_id = f"id_{len(self.docs)}"
        return rv

    def find_one(self, q):
        for d in self.docs:
            if all(d.get(k) == v for k, v in q.items() if not isinstance(v, dict)):
                return dict(d)
        return None

    def find(self, q=None):
        q = q or {}
        results = [d for d in self.docs
                   if all(d.get(k) == v for k, v in q.items())]
        cursor = MagicMock()
        cursor._results = sorted(results, key=lambda x: x.get("created_at", 0), reverse=True)
        cursor.sort = lambda *a, **k: cursor
        cursor.skip = lambda n: cursor
        cursor.limit = lambda n: cursor
        cursor.__iter__ = lambda self_: iter(self._results)
        return cursor

    def update_one(self, q, update, upsert=False):
        for d in self.docs:
            if all(d.get(k) == v for k, v in q.items()):
                if "$set" in update:
                    d.update(update["$set"])
                rv = MagicMock(); rv.modified_count = 1; return rv
        if upsert:
            new = dict(q)
            if "$setOnInsert" in update:
                new.update(update["$setOnInsert"])
            if "$set" in update:
                new.update(update["$set"])
            self.docs.append(new)
        rv = MagicMock(); rv.modified_count = 0; rv.upserted_id = "id_x"; return rv

    def count_documents(self, q):
        return sum(1 for d in self.docs if all(d.get(k) == v for k, v in q.items()))

    def create_index(self, *a, **k):
        return None


payments_coll = FakeColl()
subs_coll = FakeColl()
admins_coll = FakeColl()

_fake_db.payments = payments_coll
_fake_db.subscribers = subs_coll
_fake_db.admin_emails = admins_coll
_fake_db.command = lambda *a, **k: {"ok": 1}

# Patch get_db consistently across modules that already imported it.
import db.client
db.client.get_db = lambda: _fake_db
import db.models.payment as pmod
pmod.get_db = lambda: _fake_db

# Mock Google token verification so @require_user lets us in.
from auth import auth_guard
def fake_verify(*args, **kwargs):
    return None  # bypass verification, we'll inject user via auth_guard
def fake_bearer():
    auth = auth_guard.request.headers.get("Authorization", "")
    if auth.startswith("Bearer test:"):
        return {"email": auth.split(":", 1)[1], "sub": "sub_123"}
    return None
auth_guard._verify_bearer_token = fake_bearer

# Mock Razorpay client.
from config import razorpay_config
fake_rp = MagicMock()
fake_rp.order.create = lambda data: {"id": f"order_test_{len(payments_coll.docs) + 1}",
                                      "amount": data["amount"], "currency": "INR"}
razorpay_config._client = fake_rp
razorpay_config.get_razorpay_client = lambda: fake_rp
razorpay_config.RAZORPAY_WEBHOOK_SECRET = "webhook_secret_dummy"

# Patch the import already loaded inside payments route.
from public_api.routes import payments as payments_route
payments_route.get_razorpay_client = lambda: fake_rp
payments_route.RAZORPAY_WEBHOOK_SECRET = "webhook_secret_dummy"

# Build app
from app import create_app
app = create_app()
app.config["TESTING"] = True
client = app.test_client()

PASS = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"
results = []

def check(name, cond, detail=""):
    mark = PASS if cond else FAIL
    print(f"  {mark} {name}" + (f" — {detail}" if detail else ""))
    results.append(cond)


def auth_headers(email="alice@example.com"):
    return {"Authorization": f"Bearer test:{email}", "Content-Type": "application/json"}


def sign(body: bytes) -> str:
    return hmac.new(b"webhook_secret_dummy", body, hashlib.sha256).hexdigest()


# ─── C1: amount tampering rejected ───────────────────────────────────────────
print("\n[C1] Server-side amount whitelist")
r = client.post("/payments/create-order", headers=auth_headers(),
                json={"amount": 1, "payment_type": "one_time"})
check("Legacy {amount: 1} payload returns 400", r.status_code == 400,
      f"got {r.status_code}")

r = client.post("/payments/create-order", headers=auth_headers(),
                json={"plan": "evil_plan"})
check("Unknown plan returns 400", r.status_code == 400)

r = client.post("/payments/create-order", headers=auth_headers(),
                json={"plan": "monthly"})
check("Valid plan='monthly' returns 201", r.status_code == 201,
      f"got {r.status_code} body={r.data[:120]}")
if r.status_code == 201:
    body = r.get_json()
    check("Server set canonical amount=9900", body["amount"] == 9900)
    check("Server set payment_type=recurring", body["payment_type"] == "recurring")


# ─── C3: only payment.captured activates subscription ────────────────────────
print("\n[C3] payment.authorized does NOT activate; payment.captured does")
# Reset state
subs_coll.docs.clear()
payments_coll.docs.clear()

# Create an order first
r = client.post("/payments/create-order", headers=auth_headers("bob@example.com"),
                json={"plan": "monthly"})
order_id = r.get_json()["order_id"]

# Send authorized webhook
auth_payload = json.dumps({
    "event": "payment.authorized",
    "payload": {"payment": {"entity": {"id": "pay_1", "order_id": order_id}}},
}).encode()
r = client.post("/payments/webhook", data=auth_payload,
                headers={"Content-Type": "application/json",
                         "X-Razorpay-Signature": sign(auth_payload)})
check("Authorized webhook returns 200", r.status_code == 200)
check("After authorized: NO subscriber record",
      not any(s.get("subscription_status") == "active" for s in subs_coll.docs))

# Now send captured webhook
cap_payload = json.dumps({
    "event": "payment.captured",
    "payload": {"payment": {"entity": {"id": "pay_1", "order_id": order_id}}},
}).encode()
r = client.post("/payments/webhook", data=cap_payload,
                headers={"Content-Type": "application/json",
                         "X-Razorpay-Signature": sign(cap_payload)})
check("Captured webhook returns 200", r.status_code == 200)
check("After captured: subscriber record exists & active",
      any(s.get("subscription_status") == "active" for s in subs_coll.docs))


# ─── C2: webhook idempotency ─────────────────────────────────────────────────
print("\n[C2] Webhook idempotency")
# Replay the same captured event
sub_before = next(s for s in subs_coll.docs if s.get("subscription_status") == "active")
expires_before = sub_before.get("expires_at")
r = client.post("/payments/webhook", data=cap_payload,
                headers={"Content-Type": "application/json",
                         "X-Razorpay-Signature": sign(cap_payload)})
check("Replay returns 200", r.status_code == 200)
sub_after = next(s for s in subs_coll.docs if s.get("subscription_status") == "active")
check("expires_at not extended on replay", sub_after.get("expires_at") == expires_before,
      f"before={expires_before} after={sub_after.get('expires_at')}")


# ─── H2: unknown order returns 200, not 404 ──────────────────────────────────
print("\n[H2] Webhook returns 200 on unknown order")
unknown_payload = json.dumps({
    "event": "payment.captured",
    "payload": {"payment": {"entity": {"id": "pay_x", "order_id": "order_does_not_exist"}}},
}).encode()
r = client.post("/payments/webhook", data=unknown_payload,
                headers={"Content-Type": "application/json",
                         "X-Razorpay-Signature": sign(unknown_payload)})
check("Unknown order webhook returns 200 (not 404)", r.status_code == 200,
      f"got {r.status_code}")


# ─── H3: Content-Type validation ─────────────────────────────────────────────
print("\n[H3] Webhook rejects non-JSON content-type")
r = client.post("/payments/webhook", data=b"plain text",
                headers={"Content-Type": "text/plain",
                         "X-Razorpay-Signature": "x"})
check("text/plain webhook returns 400", r.status_code == 400)


# ─── Webhook signature verification ──────────────────────────────────────────
print("\n[Webhook signature]")
r = client.post("/payments/webhook", data=b"{}",
                headers={"Content-Type": "application/json",
                         "X-Razorpay-Signature": "wrong_signature"})
check("Bad signature returns 401", r.status_code == 401)


# ─── M2: payment-history hides sensitive fields ──────────────────────────────
print("\n[M2] payment-history sanitizes response")
r = client.get("/payments/payment-history", headers=auth_headers("bob@example.com"))
check("payment-history returns 200", r.status_code == 200)
body = r.get_json() or {}
payments_list = body.get("payments", [])
all_clean = all(
    "razorpay_signature" not in p and "metadata" not in p and "razorpay_payment_id" not in p
    for p in payments_list
)
check(f"No razorpay_signature/metadata/payment_id leaked ({len(payments_list)} record(s))", all_clean)


# ─── H1: rate limit ──────────────────────────────────────────────────────────
print("\n[H1] Rate limit on /create-order (5 per minute)")
# We've already called create-order twice (once C1 'monthly', once C3 'monthly').
# Hit the same endpoint until rate-limited.
hits = []
for i in range(10):
    r = client.post("/payments/create-order", headers=auth_headers("bob@example.com"),
                    json={"plan": "monthly"})
    hits.append(r.status_code)
    if r.status_code == 429:
        break
check("429 returned within 10 attempts", 429 in hits, f"sequence={hits}")


# ─── M3: subscription-status hides expired details ───────────────────────────
print("\n[M3] subscription-status hides details when not active")
r = client.get("/payments/subscription-status", headers=auth_headers("nobody@example.com"))
body = r.get_json()
check("Non-subscriber returns is_subscriber=false",
      body.get("is_subscriber") is False)
check("Non-subscriber: no subscription_type leaked",
      body.get("subscription_type") is None)
check("Non-subscriber: no expires_at leaked",
      body.get("expires_at") is None)


# ─── L4: security headers present ────────────────────────────────────────────
print("\n[L4] Security headers")
r = client.get("/health")
check("CSP header present", "Content-Security-Policy" in r.headers)
check("X-Frame-Options=DENY", r.headers.get("X-Frame-Options") == "DENY")
check("X-Content-Type-Options=nosniff",
      r.headers.get("X-Content-Type-Options") == "nosniff")


# ─── Summary ─────────────────────────────────────────────────────────────────
total = len(results)
passed = sum(results)
print(f"\n{'='*60}")
print(f"  {passed}/{total} checks passed")
print(f"{'='*60}")
sys.exit(0 if passed == total else 1)
