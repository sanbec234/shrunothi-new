import { useState, useEffect, useCallback } from "react";
import { api } from "../../../api/client";

export type Banner = { id: string; image_url: string; order: number };

// Portrait banners for mobile — 750 × 1334 px (9:16)
export const REQUIRED_WIDTH = 750;
export const REQUIRED_HEIGHT = 1334;

const validateImageDimensions = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(
        Math.abs(img.width - REQUIRED_WIDTH) <= 10 &&
          Math.abs(img.height - REQUIRED_HEIGHT) <= 10,
      );
    };
    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(file);
  });
};

export function useMobileCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);

  const fetchBanners = useCallback(() => {
    api
      .get<Banner[]>("/admin/carousel-mobile")
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : [];
        list.sort((a, b) => a.order - b.order);
        setBanners(list);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const createBanner = useCallback(
    async (file: File) => {
      const valid = await validateImageDimensions(file);
      if (!valid) {
        throw new Error(`Mobile banner must be ${REQUIRED_WIDTH}×${REQUIRED_HEIGHT}px (9:16 portrait). Resize your image before uploading.`);
      }

      const { data: presign } = await api.post("/admin/uploads/carousel-mobile-presign", {
        filename: file.name,
        contentType: file.type,
      });

      await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      await api.post("/admin/carousel-mobile", {
        image_url: presign.fileUrl,
        s3_key: presign.s3Key,
      });
      fetchBanners();
    },
    [fetchBanners],
  );

  const deleteBanner = useCallback(
    async (id: string) => {
      await api.delete(`/admin/carousel-mobile/${id}`);
      fetchBanners();
    },
    [fetchBanners],
  );

  return { banners, createBanner, deleteBanner, fetchBanners };
}
