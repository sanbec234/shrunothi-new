import { useRef, useState } from "react";
import type { Banner } from "./useMobileCarousel";
import AdminTableModal from "../AdminTableModal";

interface MobileCarouselSectionProps {
  banners: Banner[];
  onAdd: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function MobileCarouselSection({
  banners,
  onAdd,
  onDelete,
}: MobileCarouselSectionProps) {
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
    if (!confirm("Delete this mobile banner?")) return;
    try { await onDelete(id); }
    catch { alert("Failed to delete banner"); }
  };

  return (
    <>
      <section>
        <div
          className="section-header"
          onClick={() => setOpen(true)}
          style={{ marginBottom: 0 }}
        >
          <span>▶</span>
          <span>Carousel Banners · Mobile</span>
          <span
            style={{
              marginLeft: 8,
              background: "#3b82f6",
              color: "#fff",
              borderRadius: "999px",
              fontSize: "0.7rem",
              fontWeight: 700,
              padding: "0.1rem 0.55rem",
            }}
          >
            📱
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 13,
              color: "var(--text-muted)",
              fontWeight: 400,
            }}
          >
            {banners.length > 0 ? `${banners.length} banners · ` : ""}click to manage
          </span>
        </div>
      </section>

      <AdminTableModal
        isOpen={open}
        title="Carousel Banners · Mobile"
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
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Required: 750×1334px (portrait)
            </span>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading…" : "+ Add Mobile Banner"}
            </button>
          </>
        }
      >
        {error && (
          <div style={{ color: "#dc2626", marginBottom: 14, fontSize: 14 }}>{error}</div>
        )}

        {banners.length === 0 ? (
          <p className="empty">No mobile banners yet</p>
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
                    <img
                      src={b.image_url}
                      alt="Mobile Banner"
                      style={{
                        width: 60,
                        height: 107,       /* maintains 750:1334 ratio */
                        borderRadius: 6,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </td>
                  <td data-label="Order">{b.order}</td>
                  <td data-label="Actions">
                    <button className="danger" onClick={() => handleDelete(b.id)}>
                      Delete
                    </button>
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
