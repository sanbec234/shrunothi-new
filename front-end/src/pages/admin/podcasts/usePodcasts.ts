import { useState, useEffect } from "react";
import { api } from "../../../api/client";
import type { Podcast } from "../admin.types";

export function usePodcasts() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);

  useEffect(() => {
    loadPodcasts();
  }, []);

  async function loadPodcasts() {
    try {
      const res = await api.get("/podcasts");
      setPodcasts(res.data);
    } catch (err) {
      console.error("Failed to load podcasts", err);
    }
  }

  async function createPodcast(data: {
    title: string;
    spotifyUrl: string;
    genreId: string;
  }) {
    await api.post("/admin/podcasts", data);
    await loadPodcasts();
  }

  async function updatePodcast(
    id: string,
    data: { title: string; spotifyUrl: string; genreId: string }
  ) {
    await api.put(`/admin/podcasts/${id}`, data);
    setPodcasts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
  }

  async function deletePodcast(id: string) {
    await api.delete(`/admin/podcasts/${id}`);
    await loadPodcasts();
  }

  return {
    podcasts,
    loadPodcasts,
    createPodcast,
    updatePodcast,
    deletePodcast,
  };
}