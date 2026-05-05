import { useRef, useState } from "react";
import type { Coach } from "./useCoaches";

interface CoachesSectionProps {
  coaches: Coach[];
  isOpen: boolean;
  onToggle: () => void;
  onAdd: (data: { name: string; title: string; photo: File }) => Promise<void>;
  onUpdate: (id: string, data: { name: string; title: string; photo?: File }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function CoachesSection({
  coaches,
  isOpen,
  onToggle,
  onAdd,
  onUpdate,
  onDelete,
}: CoachesSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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
        if (!photo) {
          setError("Photo is required for new coaches");
          setSaving(false);
          return;
        }
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
    try {
      await onDelete(id);
    } catch {
      alert("Failed to delete coach");
    }
  };

  return (
    <section>
      <div className="section-header" onClick={onToggle}>
        <span>{isOpen ? "▲" : "▼"}</span>
        <h3 style={{ margin: 0, fontSize: "inherit" }}>Coaches</h3>
      </div>

      {isOpen && (
        <div className="section-body">
          {!showForm && (
            <button onClick={() => { resetForm(); setShowForm(true); }} style={{ marginBottom: 12 }}>
              + Add Coach
            </button>
          )}

          {showForm && (
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <h4 style={{ margin: "0 0 12px" }}>
                {editingId ? "Edit Coach" : "Add Coach"}
              </h4>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Coach name"
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                  Title / Role
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Executive Coach"
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                  Photo {editingId ? "(optional — leave empty to keep current)" : ""}
                </label>
                <input ref={photoRef} type="file" accept="image/*" />
                <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>
                  (Required: 284x288px)
                </span>
              </div>

              {error && (
                <div style={{ color: "#dc2626", marginBottom: 10, fontSize: 14 }}>{error}</div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleSubmit} disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Update" : "Create"}
                </button>
                <button className="secondary" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {coaches.length === 0 ? (
            <p className="empty">No coaches yet</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Title</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coaches.map((c) => (
                  <tr key={c.id}>
                    <td data-label="Photo">
                      <img
                        src={c.image_url}
                        alt={c.name}
                        style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }}
                      />
                    </td>
                    <td data-label="Name">{c.name}</td>
                    <td data-label="Title">{c.title}</td>
                    <td data-label="Actions">
                      <div className="action-group">
                        <button onClick={() => startEdit(c)}>Edit</button>
                        <button className="danger" onClick={() => handleDelete(c.id)}>
                          Delete
                        </button>
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
