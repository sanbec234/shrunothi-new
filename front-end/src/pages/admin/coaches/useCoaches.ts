import { useState, useEffect, useCallback } from "react";
import { api } from "../../../api/client";

export type Coach = {
  id: string;
  name: string;
  title: string;
  image_url: string;
};

const REQUIRED_WIDTH = 284;
const REQUIRED_HEIGHT = 288;

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

export function useCoaches() {
  const [coaches, setCoaches] = useState<Coach[]>([]);

  const fetchCoaches = useCallback(() => {
    api
      .get<Coach[]>("/admin/coaches")
      .then((r) => {
        setCoaches(Array.isArray(r.data) ? r.data : []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

  const createCoach = useCallback(
    async (data: { name: string; title: string; photo: File }) => {
      const valid = await validateImageDimensions(data.photo, REQUIRED_WIDTH, REQUIRED_HEIGHT);
      if (!valid) {
        throw new Error(`Photo must be exactly ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}px`);
      }

      // Get presigned URL
      const { data: presign } = await api.post("/admin/uploads/coach-presign", {
        filename: data.photo.name,
        contentType: data.photo.type,
      });

      // Upload to S3
      await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": data.photo.type },
        body: data.photo,
      });

      // Create coach record
      await api.post("/admin/coaches", {
        name: data.name,
        title: data.title,
        image_url: presign.fileUrl,
        s3_key: presign.s3Key,
      });
      fetchCoaches();
    },
    [fetchCoaches],
  );

  const updateCoach = useCallback(
    async (id: string, data: { name: string; title: string; photo?: File }) => {
      let image_url: string | undefined;
      let s3_key: string | undefined;

      if (data.photo) {
        const valid = await validateImageDimensions(data.photo, REQUIRED_WIDTH, REQUIRED_HEIGHT);
        if (!valid) {
          throw new Error(`Photo must be exactly ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}px`);
        }

        const { data: presign } = await api.post("/admin/uploads/coach-presign", {
          filename: data.photo.name,
          contentType: data.photo.type,
        });

        await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": data.photo.type },
          body: data.photo,
        });

        image_url = presign.fileUrl;
        s3_key = presign.s3Key;
      }

      const updatePayload: Record<string, string> = {
        name: data.name,
        title: data.title,
      };
      if (image_url) updatePayload.image_url = image_url;
      if (s3_key) updatePayload.s3_key = s3_key;

      await api.put(`/admin/coaches/${id}`, updatePayload);
      fetchCoaches();
    },
    [fetchCoaches],
  );

  const deleteCoach = useCallback(
    async (id: string) => {
      await api.delete(`/admin/coaches/${id}`);
      fetchCoaches();
    },
    [fetchCoaches],
  );

  return { coaches, createCoach, updateCoach, deleteCoach, fetchCoaches };
}
