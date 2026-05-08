import { useEffect, useState } from "react";
import { api } from "../../../api/client";

type VimeoVideo = {
  id: string;
  title: string;
  vimeo_id: string;
  thumbnail_url?: string | null;
};

interface VimeoSectionProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function VimeoSection({ isOpen, onToggle }: VimeoSectionProps) {
  const [videos, setVideos] = useState<VimeoVideo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [vimeoUrl, setVimeoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/vimeo-videos");
      setVideos(Array.isArray(res.data) ? res.data : []);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchVideos();
  }, [isOpen]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setVimeoUrl("");
    setError(null);
  };

  const startEdit = (v: VimeoVideo) => {
    setEditingId(v.id);
    setTitle(v.title);
    setVimeoUrl("");
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!editingId && !vimeoUrl.trim()) { setError("Vimeo URL is required"); return; }

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await api.put(`/admin/vimeo-videos/${editingId}`, {
          title: title.trim(),
          vimeo_url: vimeoUrl.trim() || undefined,
        });
      } else {
        await api.post("/admin/vimeo-videos", {
          title: title.trim(),
          vimeo_url: vimeoUrl.trim(),
        });
      }
      await fetchVideos();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    try {
      await api.delete(`/admin/vimeo-videos/${id}`);
      setVideos((v) => v.filter((x) => x.id !== id));
    } catch {
      alert("Failed to delete video");
    }
  };

  return (
    <section>
      <div className="section-header" onClick={onToggle}>
        <span>{isOpen ? "▲" : "▼"}</span>
        <h3 style={{ margin: 0, fontSize: "inherit" }}>Vimeo Videos</h3>
      </div>

      {isOpen && (
        <div className="section-body">
          {!showForm && (
            <button onClick={() => { resetForm(); setShowForm(true); }} style={{ marginBottom: 12 }}>
              + Add Video
            </button>
          )}

          {showForm && (
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <h4 style={{ margin: "0 0 12px" }}>{editingId ? "Edit Video" : "Add Vimeo Video"}</h4>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Video title shown on the card"
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                  Vimeo URL {editingId ? "(leave blank to keep current)" : ""}
                </label>
                <input
                  type="text"
                  value={vimeoUrl}
                  onChange={(e) => setVimeoUrl(e.target.value)}
                  placeholder="https://vimeo.com/1189829941"
                  style={{ width: "100%" }}
                />
                <span style={{ fontSize: 12, color: "#6b7280" }}>
                  Thumbnail is auto-fetched from Vimeo. Make sure the video is set to "embeddable anywhere" in Vimeo.
                </span>
              </div>

              {error && <div style={{ color: "#dc2626", marginBottom: 10, fontSize: 14 }}>{error}</div>}

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleSubmit} disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Update" : "Add Video"}
                </button>
                <button className="secondary" onClick={resetForm}>Cancel</button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="empty">Loading…</p>
          ) : videos.length === 0 ? (
            <p className="empty">No videos yet</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Thumbnail</th>
                  <th>Title</th>
                  <th>Vimeo ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => (
                  <tr key={v.id}>
                    <td data-label="Thumbnail">
                      {v.thumbnail_url ? (
                        <img src={v.thumbnail_url} alt={v.title} style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4 }} />
                      ) : (
                        <div style={{ width: 80, height: 60, background: "#e5e7eb", borderRadius: 4 }} />
                      )}
                    </td>
                    <td data-label="Title">{v.title}</td>
                    <td data-label="Vimeo ID">
                      <a href={`https://vimeo.com/${v.vimeo_id}`} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                        {v.vimeo_id}
                      </a>
                    </td>
                    <td data-label="Actions">
                      <div className="action-group">
                        <button onClick={() => startEdit(v)}>Edit</button>
                        <button className="danger" onClick={() => handleDelete(v.id)}>Delete</button>
                      </div>
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
