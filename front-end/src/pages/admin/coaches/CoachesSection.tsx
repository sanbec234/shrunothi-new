import { useRef, useState } from "react";
import type { Coach } from "./useCoaches";
import AdminTableModal from "../AdminTableModal";

interface CoachesSectionProps {
  coaches: Coach[];
  isOpen?: boolean;
  onToggle?: () => void;
  onAdd: (data: { name: string; title: string; photo: File }) => Promise<void>;
  onUpdate: (id: string, data: { name: string; title: string; photo?: File }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function CoachesSection({
  coaches,
  onAdd,
  onUpdate,
  onDelete,
}: CoachesSectionProps) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setTitle("");
    setError(null);
    if (photoRef.current) photoRef.current.value = "";
  };

  const startEdit = (coach: Coach) => {
    setEditingId(coach.id);
    setName(coach.name);
    setTitle(coach.title);
    setShowForm(true);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !title.trim()) {
      setError("Name and title are required");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (editingId) {
        const photo = photoRef.current?.files?.[0];
        await onUpdate(editingId, { name: name.trim(), title: title.trim(), photo });
      } else {
        const photo = photoRef.current?.files?.[0];
        if (!photo) { setError("Photo is required for new coaches"); setSaving(false); return; }
        await onAdd({ name: name.trim(), title: title.trim(), photo });
      }
      resetForm();
    } catch (err: any) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coach?")) return;
    try { await onDelete(id); }
    catch { alert("Failed to delete coach"); }
  };

  const visible = search
    ? coaches.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase())
      )
    : coaches;

  return (
    <>
      <section>
        <div className="section-header" onClick={() => setOpen(true)} style={{ marginBottom: 0 }}>
          <span>▶</span>
          <span>Coaches</span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-muted)", fontWeight: 400 }}>
            {coaches.length > 0 ? `${coaches.length} total · ` : ""}click to manage
          </span>
        </div>
      </section>

      <AdminTableModal
        isOpen={open}
        title="Coaches"
        count={visible.length}
        onClose={() => { setOpen(false); resetForm(); }}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or role…"
        actions={
          !showForm
            ? <button onClick={() => { resetForm(); setShowForm(true); }}>+ Add Coach</button>
            : undefined
        }
      >
        {showForm && (
          <div style={{
            background: "#fff",
            border: "1px solid var(--border-light)",
            borderRadius: 10,
            padding: 20,
            marginBottom: 20,
            maxWidth: 480,
          }}>
            <h4 style={{ margin: "0 0 14px", fontSize: 16 }}>
              {editingId ? "Edit Coach" : "Add Coach"}
            </h4>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Coach name" style={{ width: "100%" }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Title / Role</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Executive Coach" style={{ width: "100%" }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                Photo {editingId ? "(optional — leave empty to keep current)" : ""}
              </label>
              <input ref={photoRef} type="file" accept="image/*" />
              <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>(Required: 284x288px)</span>
            </div>

            {error && <div style={{ color: "#dc2626", marginBottom: 10, fontSize: 14 }}>{error}</div>}

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleSubmit} disabled={saving}>{saving ? "Saving…" : editingId ? "Update" : "Create"}</button>
              <button className="secondary" onClick={resetForm}>Cancel</button>
            </div>
          </div>
        )}

        {visible.length === 0 ? (
          <p className="empty">{coaches.length === 0 ? "No coaches yet" : "No coaches match your search"}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Title / Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id}>
                  <td data-label="Photo">
                    <img src={c.image_url} alt={c.name} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />
                  </td>
                  <td data-label="Name">{c.name}</td>
                  <td data-label="Title">{c.title}</td>
                  <td data-label="Actions">
                    <div className="action-group">
                      <button onClick={() => startEdit(c)}>Edit</button>
                      <button className="danger" onClick={() => handleDelete(c.id)}>Delete</button>
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
