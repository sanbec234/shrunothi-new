import { useState, type JSX } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./plans.css";
import { usePayment } from "../../hooks/usePayment";
import { useSubscription } from "../../hooks/useSubscription";
import LoginPopup from "../../components/GoogleAuthPopup";
import { getGoogleIdToken } from "../../auth/token";

const CHECK = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LEAF_ICON = (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M24 8C16 8 10 16 10 24c0 6 3 11 8 14M24 8c8 0 14 8 14 16 0 6-3 11-8 14M24 8v32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 20c2-2 5-3 8-3M32 20c-2-2-5-3-8-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const STAR_ICON = (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M24 8C16 8 10 16 10 24c0 6 3 11 8 14M24 8c8 0 14 8 14 16 0 6-3 11-8 14M24 8v32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 20c2-2 5-3 8-3M32 20c-2-2-5-3-8-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const BASIC_FEATURES = [
  "Access to curated podcast library",
  "Reading materials across all genres",
  "New content added weekly",
  "Mobile-friendly experience",
  "Community discussion access",
];

const PREMIUM_FEATURES = [
  "Everything in Basic, plus:",
  "Full self-help guide library",
  "Exclusive premium materials",
  "Early access to new content",
  "Priority support from coaches",
  "Downloadable resources",
  "Live session recordings",
];

export default function Plans(): JSX.Element {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [showLogin, setShowLogin] = useState(false);
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const { startPayment, status: paymentStatus } = usePayment();
  const { isSubscribed, refresh } = useSubscription();
  const navigate = useNavigate();

  const isLoggedIn = Boolean(getGoogleIdToken());

  const handleGetPremium = () => {
    // Must be logged in — the create-order endpoint requires auth.
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    startPayment(
      billing,
      async () => {
        await refresh();
        setSubscribeSuccess(true);
        setTimeout(() => navigate("/#exclusive"), 2500);
      }
    );
  };

  const premiumPriceDisplay = billing === "annual" ? "₹2,499" : "₹299";
  const premiumPricePeriod  = billing === "annual" ? "year" : "month";

  const buttonDisabled = paymentStatus === "loading"
    || paymentStatus === "checkout_open"
    || paymentStatus === "verifying";

  const buttonLabel =
    !isLoggedIn                         ? "Sign in to subscribe"
    : paymentStatus === "loading"        ? "Opening payment…"
    : paymentStatus === "checkout_open"  ? "Complete payment in Razorpay"
    : paymentStatus === "verifying"      ? "Verifying payment…"
    : paymentStatus === "pending_capture" ? "Confirming with bank…"
    : "Get Premium plan";

  return (
    <div className="plans-root">
      {/* Back arrow */}
      <Link to="/" className="plans-back" aria-label="Back to home">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      <div className="plans-content">
        <h1 className="plans-heading">Plans that grow with you</h1>

        {/* Billing toggle */}
        <div className="plans-toggle" role="group" aria-label="Billing period">
          <button
            className={`plans-toggle__btn${billing === "monthly" ? " plans-toggle__btn--active" : ""}`}
            onClick={() => setBilling("monthly")}
          >
            Monthly
          </button>
          <button
            className={`plans-toggle__btn${billing === "annual" ? " plans-toggle__btn--active" : ""}`}
            onClick={() => setBilling("annual")}
          >
            Annual
          </button>
        </div>

        {/* Cards */}
        <div className="plans-cards">
          {/* Basic */}
          <div className="plans-card">
            <div className="plans-card__icon">{LEAF_ICON}</div>
            <h2 className="plans-card__name">Basic</h2>
            <p className="plans-card__tagline">Explore and grow</p>

            <div className="plans-card__price">
              <span className="plans-card__amount">Free</span>
              <span className="plans-card__period"> forever</span>
            </div>
            <p className="plans-card__billing-note">no credit card required</p>

            <button className="plans-card__cta plans-card__cta--outline" onClick={() => navigate("/")}>
              Get started free
            </button>

            <ul className="plans-card__features">
              {BASIC_FEATURES.map((f) => (
                <li key={f}>
                  <span className="plans-card__check">{CHECK}</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Premium */}
          <div className="plans-card plans-card--premium">
            <div className="plans-card__icon">{STAR_ICON}</div>
            <h2 className="plans-card__name">Premium</h2>
            <p className="plans-card__tagline">Full access, priority support</p>

            <div className="plans-card__price">
              <span className="plans-card__amount">{premiumPriceDisplay}</span>
              <span className="plans-card__period"> / {premiumPricePeriod}</span>
            </div>
            <p className="plans-card__billing-note">
              {billing === "annual" ? "billed annually" : "billed monthly"}
            </p>

            {isSubscribed ? (
              <>
                <div
                  className="plans-card__cta plans-card__cta--filled"
                  style={{
                    textAlign: "center",
                    pointerEvents: "none",
                    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                    color: "#fff",
                  }}
                >
                  ✓ You're already subscribed
                </div>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.85rem", marginTop: "0.5rem", textAlign: "center" }}>
                  You have full access to all premium content.
                </p>
                <button
                  className="plans-card__cta plans-card__cta--outline"
                  style={{ marginTop: "0.75rem" }}
                  onClick={() => navigate("/#exclusive")}
                >
                  Browse exclusive content
                </button>
              </>
            ) : (
              <>
                <button
                  className="plans-card__cta plans-card__cta--filled"
                  onClick={handleGetPremium}
                  disabled={buttonDisabled}
                >
                  {buttonLabel}
                </button>
                {paymentStatus === "pending_capture" && (
                  <p style={{ color: "#209ae5", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                    Your bank is taking longer than usual. We'll activate your subscription as soon as the payment captures — you can safely close this page.
                  </p>
                )}
                <p className="plans-card__no-commit">Secure payment via Razorpay</p>
              </>
            )}

            <ul className="plans-card__features">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f}>
                  <span className="plans-card__check">{CHECK}</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="plans-footnote">
          *Prices shown don't include applicable tax. Plans are subject to change at Shrunothi's discretion.
        </p>
      </div>

      {/* Login gate — shown when unauthenticated user tries to subscribe */}
      {showLogin && (
        <LoginPopup
          onSuccess={() => {
            setShowLogin(false);
            startPayment(billing, async () => {
              await refresh();
              setSubscribeSuccess(true);
              setTimeout(() => navigate("/#exclusive"), 2500);
            });
          }}
          onClose={() => setShowLogin(false)}
        />
      )}

      {/* Payment success overlay */}
      {subscribeSuccess && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: "#0d1117",
              border: "1px solid rgba(32,154,229,0.35)",
              borderRadius: 16,
              padding: "2.5rem 2.75rem",
              maxWidth: 420, width: "90%",
              textAlign: "center",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🎉</div>
            <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>
              You're subscribed!
            </h2>
            <p style={{ margin: "0.85rem 0 1.5rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
              Welcome to Premium. Taking you to your exclusive content…
            </p>
            <div
              style={{
                height: 4, borderRadius: 4,
                background: "rgba(255,255,255,0.1)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #fff 0%, #209ae5 100%)",
                  animation: "plans-progress 2.5s linear forwards",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}