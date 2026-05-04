import { useState } from "react";
import { api } from "../api/client";

export type PlanKey = "monthly" | "annual";

interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  email: string;
  payment_type: "one_time" | "recurring";
  plan: PlanKey;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: { email: string };
  theme: { color: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal: { ondismiss: () => void };
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export type PaymentStatus =
  | "idle"
  | "loading"
  | "checkout_open"
  | "verifying"
  | "active"
  | "pending_capture"
  | "failed"
  | "cancelled";

export function usePayment() {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const startPayment = async (
    plan: PlanKey,
    onActive: () => void,
    onFailure?: () => void
  ) => {
    setError(null);
    setStatus("loading");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Payment SDK failed to load. Check your connection.");
        setStatus("failed");
        onFailure?.();
        return;
      }

      const { data } = await api.post<CreateOrderResponse>(
        "/payments/create-order",
        { plan }
      );

      setStatus("checkout_open");

      const options: RazorpayOptions = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: "Shrunothi",
        description:
          plan === "annual"
            ? "Annual Premium (₹999)"
            : "Monthly Premium (₹99)",
        prefill: { email: data.email },
        theme: { color: "#6366f1" },
        handler: async (response: RazorpaySuccessResponse) => {
          // Backend webhook is the source of truth, but verify-payment gives
          // us a fast path to confirm capture without polling.
          setStatus("verifying");
          try {
            const verify = await api.post<{ status: string }>(
              "/payments/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            );
            if (
              verify.data.status === "active" ||
              verify.data.status === "already_active"
            ) {
              setStatus("active");
              onActive();
            } else {
              // Razorpay says authorized but not captured yet — webhook will
              // eventually flip it. Keep user on a waiting screen.
              setStatus("pending_capture");
            }
          } catch (e) {
            console.error("verify-payment failed", e);
            setStatus("pending_capture");
          }
        },
        modal: {
          ondismiss: () => {
            setStatus("cancelled");
            onFailure?.();
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Payment initiation failed";
      setError(msg);
      setStatus("failed");
      onFailure?.();
    }
  };

  return { startPayment, status, error };
}
