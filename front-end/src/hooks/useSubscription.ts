import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import { getGoogleIdToken } from "../auth/token";

interface SubscriptionStatus {
  is_subscriber: boolean;
  subscription_status: "active" | "expired" | "not_subscribed";
  subscription_type: "one_time" | "recurring" | null;
  expires_at: string | null;
  current_payment_id: string | null;
}

const CACHE_KEY = "sub_status";

function readCache(): SubscriptionStatus | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as SubscriptionStatus) : null;
  } catch {
    return null;
  }
}

function writeCache(data: SubscriptionStatus | null): void {
  if (data) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } else {
    localStorage.removeItem(CACHE_KEY);
  }
}

export function useSubscription() {
  const cached = readCache();
  const [isSubscribed, setIsSubscribed] = useState(cached?.is_subscriber ?? false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionStatus | null>(cached);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const token = getGoogleIdToken();
      if (!token) {
        setIsSubscribed(false);
        setSubscriptionDetails(null);
        writeCache(null);
        return;
      }
      const res = await api.get<SubscriptionStatus>("/payments/subscription-status");
      const data = res.data ?? null;
      setIsSubscribed(Boolean(data?.is_subscriber));
      setSubscriptionDetails(data);
      writeCache(data);
    } catch {
      setIsSubscribed(false);
      setSubscriptionDetails(null);
      writeCache(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { isSubscribed, subscriptionDetails, loading, refresh };
}
