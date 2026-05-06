import { useState, useEffect, useRef } from "react";
import type { JSX } from "react";
import "./userProfileBubble.css";

interface SubscriptionStatus {
  is_subscriber: boolean;
  subscription_type: "one_time" | "recurring" | null;
  expires_at: string | null;
}

interface Props {
  email: string;
  subscription: SubscriptionStatus | null;
}

function formatExpiry(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function daysLeft(isoDate: string): number {
  const diff = new Date(isoDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function UserProfileBubble({ email, subscription }: Props): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const initial = email.charAt(0).toUpperCase();
  const isSubscribed = subscription?.is_subscriber ?? false;
  const planLabel =
    subscription?.subscription_type === "one_time" ? "Annual" :
    subscription?.subscription_type === "recurring" ? "Monthly" : null;

  return (
    <div className="upb" ref={ref}>
      {/* Sticky avatar icon */}
      <button
        className={`upb__trigger ${isSubscribed ? "upb__trigger--pro" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Your profile"
        aria-expanded={open}
      >
        {initial}
      </button>

      {/* Popup card */}
      {open && (
        <div className="upb__card" role="dialog" aria-label="Account details">
          {/* Plan badge */}
          <div className={`upb__badge ${isSubscribed ? "upb__badge--pro" : "upb__badge--free"}`}>
            {isSubscribed ? `✦ ${planLabel ?? "Premium"} Member` : "Free Member"}
          </div>

          {/* Email */}
          <p className="upb__email">{email}</p>

          {/* Subscription detail */}
          {isSubscribed && subscription?.expires_at ? (
            <div className="upb__detail">
              <span className="upb__detail-label">Plan renews / expires</span>
              <span className="upb__detail-value">{formatExpiry(subscription.expires_at)}</span>
              <span className="upb__days-left">
                {daysLeft(subscription.expires_at)} days remaining
              </span>
            </div>
          ) : isSubscribed ? (
            <div className="upb__detail">
              <span className="upb__detail-value">Lifetime access</span>
            </div>
          ) : (
            <div className="upb__detail upb__detail--free">
              <span className="upb__detail-label">Upgrade to unlock all content</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
