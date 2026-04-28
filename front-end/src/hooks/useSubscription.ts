import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";

/**
 * Returns whether the currently logged-in user is a paid subscriber.
 * Anonymous → false. Logged-in users today are treated as subscribers
 * (server-side flag in db.models.subscriber.is_subscriber). When real
 * payments wire in, only the backend changes.
 */
export function useSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("google_id_token");
      if (!token) {
        setIsSubscribed(false);
        return;
      }
      const res = await api.get<{ isSubscribed: boolean }>("/auth/me/subscription");
      setIsSubscribed(Boolean(res.data?.isSubscribed));
    } catch {
      setIsSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { isSubscribed, loading, refresh };
}
