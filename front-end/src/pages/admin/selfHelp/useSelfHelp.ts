import { useState, useEffect } from "react";
import { api } from "../../../api/client";
import type { SelfHelp } from "../admin.types";

type CreatePayload = {
  title: string;
  author: string;
  content: string;
  subscriberOnly?: boolean;
  thumbnailUrl: string;
};

type UpdatePayload = {
  title: string;
  author: string;
  content: string;
  subscriberOnly?: boolean;
  thumbnailUrl?: string;
};

type GoogleDocPayload = {
  title: string;
  author: string;
  google_doc_url: string;
  subscriberOnly?: boolean;
  thumbnailUrl: string;
};

export function useSelfHelp() {
  const [selfHelps, setSelfHelps] = useState<SelfHelp[]>([]);

  useEffect(() => {
    loadSelfHelp();
  }, []);

  async function loadSelfHelp() {
    try {
      const res = await api.get("/self-help");
      setSelfHelps(res.data);
    } catch (err) {
      console.error("Failed to load self-help", err);
    }
  }

  async function createSelfHelp(data: CreatePayload) {
    await api.post("/admin/self-help", data);
    await loadSelfHelp();
  }

  async function syncGoogleDocSelfHelp(data: GoogleDocPayload) {
    await api.post("/admin/self-help/sync-google-doc", data);
    await loadSelfHelp();
  }

  async function updateSelfHelp(id: string, data: UpdatePayload) {
    await api.put(`/admin/self-help/${id}`, data);
    await loadSelfHelp();
  }

  async function deleteSelfHelp(id: string) {
    await api.delete(`/admin/self-help/${id}`);
    await loadSelfHelp();
  }

  async function fetchSelfHelpContent(id: string): Promise<string> {
    const res = await api.get(`/material/${id}`);
    return res.data.content;
  }

  return {
    selfHelps,
    loadSelfHelp,
    createSelfHelp,
    syncGoogleDocSelfHelp,
    updateSelfHelp,
    deleteSelfHelp,
    fetchSelfHelpContent,
  };
}
