import { useState, useEffect } from "react";
import { api } from "../../../api/client";

export type PaidUser = {
  email: string;
  name: string;
  subscription_tier: string;
  payment_type: string;
  started_at: string | null;
  expires_at: string | null;
};

export function usePaidUsers() {
  const [paidUsers, setPaidUsers] = useState<PaidUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/admin/paid-users");
      const data = res.data;
      setPaidUsers(Array.isArray(data?.paid_users) ? data.paid_users : []);
    } catch {
      setPaidUsers([]);
    } finally {
      setLoading(false);
    }
  }

  return { paidUsers, loading, reload: load };
}
