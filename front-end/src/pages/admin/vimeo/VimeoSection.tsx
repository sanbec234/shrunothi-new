import { useEffect, useState } from "react";
import { api } from "../../../api/client";
import AdminTableModal from "../AdminTableModal";

type VimeoVideo = {
  id: string;
  title: string;
  vimeo_id: string;
  thumbnail_url?: string | null;
  is_locked: boolean;
};

interface VimeoSectionProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function VimeoSection(_props: VimeoSectionProps) {
  const [open, setOpen] = useState(false);
  const [videos, setVideos] = useState<VimeoVideo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [vimeoUrl, setVimeoUrl] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

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
    if (open) fetchVideos();
  }, [open]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setVimeoUrl("");
    setIsLocked(true);
    setError(null);
  };

  const startEdit = (v: VimeoVideo) => {
    setEditingId(v.id);
    setTitle(v.title);
    setVimeoUrl("");
    setIsLocked(v.is_locked);
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
          is_locked: isLocked,
        });
      } else {
        await api.post("/admin/vimeo-videos", {
          title: title.trim(),
          vimeo_url: vimeoUrl.trim(),
          is_locked: isLocked,
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

  const visible = search
    ? videos.filter((v) => v.title.toLowerCase().includes(search.toLowerCase()))
    : videos;

  return (
    <>
      <section>
        <div className="section-header" onClick={() => setOpen(true)} style={{ marginBottom: 0 }}>
          <span>▶</span>
          <span>Vimeo Videos</span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-muted)", fontWeight: 400 }}>
            {videos.length > 0 ? `${videos.length} total · ` : ""}click to manage
          </span>
        </div>
      </section>

      <AdminTableModal
        isOpen={open}
        title="Vimeo Videos"
        count={visible.length}
        onClose={() => { setOpen(false); resetForm(); }}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title…"
        actions={
          !showForm
            ? <button onClick={() => { resetForm(); setShowForm(true); }}>+ Add Video</button>
            : undefined
        }
      >
        {/* Inline add/edit form */}
        {showForm && (
          <div style={{
            background: "#fff",
            border: "1px solid var(--border-light)",
            borderRadius: 10,
            padding: 20,
            marginBottom: 20,
            maxWidth: 560,
          }}>
            <h4 style={{ margin: "0 0 14px", fontSize: 16 }}>
              {editingId ? "Edit Video" : "Add Vimeo Video"}
            </h4>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Video title shown on the card"
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
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
                Thumbnail is auto-fetched. Make sure the video is set to "embeddable anywhere" in Vimeo.
              </span>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={isLocked}
                  onChange={(e) => setIsLocked(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#6366f1", cursor: "pointer" }}
                />
                Require subscription to watch (locked)
              </label>
              <span style={{ display: "block", fontSize: 12, color: "#6b7280", marginTop: 3, paddingLeft: 24 }}>
                Uncheck to make this video freely available as an intro video for all visitors.
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
        ) : visible.length === 0 ? (
          <p className="empty">{videos.length === 0 ? "No videos yet" : "No videos match your search"}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Thumbnail</th>
                <th>Title</th>
                <th>Vimeo ID</th>
                <th>Access</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((v) => (
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
                  <td data-label="Access">
                    <span style={{
                      display: "inline-block",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: v.is_locked ? "#fef3c7" : "#dcfce7",
                      color: v.is_locked ? "#92400e" : "#166534",
                    }}>
                      {v.is_locked ? "Subscribers only" : "Free (intro)"}
                    </span>
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
      </AdminTableModal>
    </>
  );
}
