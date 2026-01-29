import { useState, useEffect } from "react";
import { api } from "../../../api/client";
import type { SelfHelp } from "../admin.types";

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

  async function createSelfHelp(data: {
    title: string;
    author: string;
    content: string;
  }) {
    await api.post("/admin/self-help", data);
    await loadSelfHelp();
  }

  async function updateSelfHelp(
    id: string,
    data: { title: string; author: string; content: string }
  ) {
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
    updateSelfHelp,
    deleteSelfHelp,
    fetchSelfHelpContent,
  };
}