import { useState, useEffect } from "react";
import { api } from "../../../api/client";
import type { AdminEmail } from "../admin.types";

export function useAdminEmails() {
  const [adminEmails, setAdminEmails] = useState<AdminEmail[]>([]);

  useEffect(() => {
    loadAdminEmails();
  }, []);

  async function loadAdminEmails() {
    try {
      const res = await api.get("/admin/admin-emails");
      setAdminEmails(res.data);
    } catch (err) {
      console.error("Failed to load admin emails", err);
    }
  }

  async function createAdminEmail(email: string) {
    await api.post("/admin/admin-emails", { email: email.trim() });
    await loadAdminEmails();
  }

  async function deleteAdminEmail(id: string) {
    await api.delete(`/admin/admin-emails/${id}`);
    await loadAdminEmails();
  }

  return {
    adminEmails,
    loadAdminEmails,
    createAdminEmail,
    deleteAdminEmail,
  };
}