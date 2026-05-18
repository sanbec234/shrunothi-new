import { useRef, useState } from "react";
import type { Banner } from "./useCarousel";
import AdminTableModal from "../AdminTableModal";

interface CarouselSectionProps {
  banners: Banner[];
  isOpen?: boolean;
  onToggle?: () => void;
  onAdd: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function CarouselSection({
  banners,
  onAdd,
  onDelete,
}: CarouselSectionProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      await onAdd(file);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    try { await onDelete(id); }
    catch { alert("Failed to delete banner"); }
  };

  return (
    <>
      <section>
        <div className="section-header" onClick={() => setOpen(true)} style={{ marginBottom: 0 }}>
          <span>▶</span>
          <span>Carousel Banners</span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-muted)", fontWeight: 400 }}>
            {banners.length > 0 ? `${banners.length} banners · ` : ""}click to manage
          </span>
        </div>
      </section>

      <AdminTableModal
        isOpen={open}
        title="Carousel Banners"
        count={banners.length}
        onClose={() => setOpen(false)}
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <span style={{ fontSize: 12, color: "#6b7280" }}>Required: 1920×1080px (16:9)</span>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading…" : "+ Add Banner"}
            </button>
          </>
        }
      >
        {error && (
          <div style={{ color: "#dc2626", marginBottom: 14, fontSize: 14 }}>{error}</div>
        )}

        {banners.length === 0 ? (
          <p className="empty">No banners yet</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Preview</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id}>
                  <td data-label="Preview">
                    <img src={b.image_url} alt="Banner" style={{ width: 220, height: "auto", borderRadius: 6, maxHeight: 80, objectFit: "cover" }} />
                  </td>
                  <td data-label="Order">{b.order}</td>
                  <td data-label="Actions">
                    <button className="danger" onClick={() => handleDelete(b.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminTableModal>
    </>
  );
}
