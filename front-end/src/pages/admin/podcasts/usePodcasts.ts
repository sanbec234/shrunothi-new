import { useState, useEffect } from "react";
import { api } from "../../../api/client";
import type { Podcast } from "../admin.types";
import { DEFAULT_PODCAST_LANGUAGE } from "../../../constants/podcastLanguages";

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
    language?: string;
  }) {
    await api.post("/admin/podcasts", {
      ...data,
      language: data.language || DEFAULT_PODCAST_LANGUAGE,
    });
    await loadPodcasts();
  }

  async function updatePodcast(
    id: string,
    data: { title: string; spotifyUrl: string; genreId: string; language?: string }
  ) {
    const payload = {
      ...data,
      language: data.language || DEFAULT_PODCAST_LANGUAGE,
    };
    await api.put(`/admin/podcasts/${id}`, payload);
    setPodcasts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...payload } : p))
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
