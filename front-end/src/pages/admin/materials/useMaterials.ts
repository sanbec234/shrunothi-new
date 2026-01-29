import { useState, useEffect } from "react";
import { api } from "../../../api/client";
import type { Material } from "../admin.types";

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    loadMaterials();
  }, []);

  async function loadMaterials() {
    try {
      const res = await api.get("/materials");
      setMaterials(res.data);
    } catch (err) {
      console.error("Failed to load materials", err);
    }
  }

  async function createMaterial(data: {
    title: string;
    author: string;
    content: string;
    genreId: string;
  }) {
    await api.post("/admin/materials", data);
    await loadMaterials();
  }

  async function updateMaterial(
    id: string,
    data: { title: string; author: string; content: string; genreId: string }
  ) {
    await api.put(`/admin/materials/${id}`, data);
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...data } : m))
    );
  }

  async function deleteMaterial(id: string) {
    await api.delete(`/admin/materials/${id}`);
    await loadMaterials();
  }

  async function fetchMaterialContent(id: string): Promise<string> {
    const res = await api.get(`/material/${id}`);
    return res.data.content;
  }

  return {
    materials,
    loadMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    fetchMaterialContent,
  };
}