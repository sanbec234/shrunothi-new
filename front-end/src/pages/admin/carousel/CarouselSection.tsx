import { useRef, useState } from "react";
import type { Banner } from "./useCarousel";

interface CarouselSectionProps {
  banners: Banner[];
  isOpen: boolean;
  onToggle: () => void;
  onAdd: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function CarouselSection({
  banners,
  isOpen,
  onToggle,
  onAdd,
  onDelete,
}: CarouselSectionProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    try {
      await onDelete(id);
    } catch {
      alert("Failed to delete banner");
    }
  };

  return (
    <section>
      <div className="section-header" onClick={onToggle}>
        <span>{isOpen ? "▲" : "▼"}</span>
        <h3 style={{ margin: 0, fontSize: "inherit" }}>Carousel Banners</h3>
      </div>

      {isOpen && (
        <div className="section-body">
          <div style={{ marginBottom: 12 }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading…" : "+ Add Banner"}
            </button>
            <span style={{ marginLeft: 12, fontSize: 13, color: "#6b7280" }}>
              (Recommended: 1440x500px)
            </span>
          </div>

          {error && (
            <div style={{ color: "#dc2626", marginBottom: 12, fontSize: 14 }}>{error}</div>
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
                      <img
                        src={b.image_url}
                        alt="Banner"
                        style={{ width: 200, height: "auto", borderRadius: 6 }}
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
        </div>
      )}
    </section>
  );
}
