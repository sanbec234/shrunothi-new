import { useState, useEffect } from "react";
import { api } from "../../../api/client";
import type { Genre } from "../admin.types";

export function useGenres() {
  const [genres, setGenres] = useState<Genre[]>([]);

  useEffect(() => {
    loadGenres();
  }, []);

  async function loadGenres() {
    const res = await api.get("/genres");
    setGenres(res.data);
  }

  async function createGenre(name: string) {
    const res = await api.post("/admin/genres", { name });
    await loadGenres();
    return res.data.id;
  }

  async function updateGenre(id: string, name: string) {
    await api.put(`/admin/genres/${id}`, { name });
    await loadGenres();
  }

  async function deleteGenre(id: string) {
    await api.delete(`/admin/genres/${id}`);
    await loadGenres();
  }

  return {
    genres,
    loadGenres,
    createGenre,
    updateGenre,
    deleteGenre,
  };
}