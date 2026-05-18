import { useState, useEffect, useCallback } from "react";
import { api } from "../../../api/client";

export type Banner = { id: string; image_url: string; order: number };

export const REQUIRED_WIDTH = 1920;
export const REQUIRED_HEIGHT = 1080;

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

export function useCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);

  const fetchBanners = useCallback(() => {
    api
      .get<Banner[]>("/admin/carousel")
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
        throw new Error(`Desktop banner must be ${REQUIRED_WIDTH}×${REQUIRED_HEIGHT}px (16:9). Resize your image before uploading.`);
      }

      // Get presigned URL
      const { data: presign } = await api.post("/admin/uploads/carousel-presign", {
        filename: file.name,
        contentType: file.type,
      });

      // Upload to S3
      await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      // Create banner record
      await api.post("/admin/carousel", { image_url: presign.fileUrl, s3_key: presign.s3Key });
      fetchBanners();
    },
    [fetchBanners],
  );

  const deleteBanner = useCallback(
    async (id: string) => {
      await api.delete(`/admin/carousel/${id}`);
      fetchBanners();
    },
    [fetchBanners],
  );

  return { banners, createBanner, deleteBanner, fetchBanners };
}
