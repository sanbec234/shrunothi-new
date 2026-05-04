import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";

interface SubscriptionStatus {
  is_subscriber: boolean;
  subscription_status: "active" | "expired" | "not_subscribed";
  subscription_type: "one_time" | "recurring" | null;
  expires_at: string | null;
  current_payment_id: string | null;
}

export function useSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("google_id_token");
      if (!token) {
        setIsSubscribed(false);
        setSubscriptionDetails(null);
        return;
      }
      const res = await api.get<SubscriptionStatus>("/payments/subscription-status");
      setIsSubscribed(Boolean(res.data?.is_subscriber));
      setSubscriptionDetails(res.data ?? null);
    } catch {
      setIsSubscribed(false);
      setSubscriptionDetails(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { isSubscribed, subscriptionDetails, loading, refresh };
}
