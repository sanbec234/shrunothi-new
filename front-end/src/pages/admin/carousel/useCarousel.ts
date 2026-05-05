import { useState, useEffect, useCallback } from "react";
import { api } from "../../../api/client";

export type Banner = { id: string; image_url: string; order: number };

const REQUIRED_WIDTH = 1440;
const REQUIRED_HEIGHT = 500;

const validateImageDimensions = (
  file: File,
  requiredWidth: number,
  requiredHeight: number,
): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img.width === requiredWidth && img.height === requiredHeight);
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
      const valid = await validateImageDimensions(file, REQUIRED_WIDTH, REQUIRED_HEIGHT);
      if (!valid) {
        throw new Error(`Image must be exactly ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}px`);
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
