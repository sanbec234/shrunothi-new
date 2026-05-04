import { useState, type JSX } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./plans.css";
import { usePayment } from "../../hooks/usePayment";
import { useSubscription } from "../../hooks/useSubscription";
import LoginPopup from "../../components/GoogleAuthPopup";

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
  const { startPayment, status: paymentStatus } = usePayment();
  const { isSubscribed, refresh } = useSubscription();
  const navigate = useNavigate();

  const isLoggedIn = Boolean(localStorage.getItem("google_id_token"));

  const handleGetPremium = () => {
    // Must be logged in — the create-order endpoint requires auth.
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    startPayment(
      billing,
      async () => {
        // Subscription confirmed active — refresh and redirect.
        await refresh();
        navigate("/home2");
      }
    );
  };

  const premiumPriceDisplay = billing === "annual" ? "₹999" : "₹99";
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
              <div className="plans-card__cta plans-card__cta--filled" style={{ textAlign: "center", pointerEvents: "none", opacity: 0.85 }}>
                ✓ You're subscribed
              </div>
            ) : (
              <button
                className="plans-card__cta plans-card__cta--filled"
                onClick={handleGetPremium}
                disabled={buttonDisabled}
              >
                {buttonLabel}
              </button>
            )}
            {paymentStatus === "pending_capture" && (
              <p style={{ color: "#6366f1", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                Your bank is taking longer than usual. We'll activate your subscription as soon as the payment captures — you can safely close this page.
              </p>
            )}
            <p className="plans-card__no-commit">Secure payment via Razorpay</p>

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
            // Proceed straight to payment after login
            startPayment(billing, async () => {
              await refresh();
              navigate("/home2");
            });
          }}
          onClose={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}