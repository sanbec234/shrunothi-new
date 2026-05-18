import { useState } from "react";
import type { Genre, Material } from "../admin.types";
import AdminTableModal from "../AdminTableModal";

interface MaterialsSectionProps {
  materials: Material[];
  genres: Genre[];
  genreFilter: string;
  onFilterChange: (genreId: string) => void;
  onAddClick: () => void;
  onAddGoogleDocClick: () => void;
  onEditClick: (material: Material) => void;
  onDeleteClick: (id: string) => void;
}

export default function MaterialsSection({
  materials,
  genres,
  genreFilter,
  onFilterChange,
  onAddClick,
  onAddGoogleDocClick,
  onEditClick,
  onDeleteClick,
}: MaterialsSectionProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const visible = materials.filter((m) => {
    if (genreFilter !== "all" && m.genreId !== genreFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        (m.author || "").toLowerCase().includes(q) ||
        (genres.find((g) => g.id === m.genreId)?.name || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <>
      <section>
        <div className="section-header" onClick={() => setOpen(true)} style={{ marginBottom: 0 }}>
          <span>▶</span>
          <span>Materials</span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-muted)", fontWeight: 400 }}>
            {materials.length} total · click to manage
          </span>
        </div>
      </section>

      <AdminTableModal
        isOpen={open}
        title="Materials"
        count={visible.length}
        onClose={() => setOpen(false)}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title, author, genre…"
        genres={genres}
        genreFilter={genreFilter}
        onGenreFilterChange={onFilterChange}
        actions={
          <>
            <button className="secondary" onClick={() => { setOpen(false); onAddGoogleDocClick(); }}>
              + Sync Google Doc
            </button>
            <button onClick={() => { setOpen(false); onAddClick(); }}>+ Add Material</button>
          </>
        }
      >
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Genre</th>
              <th>Subscriber Only</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((m) => (
              <tr key={m.id}>
                <td data-label="Title">{m.title}</td>
                <td data-label="Author">{m.author || "—"}</td>
                <td data-label="Genre">
                  {genres.find((g) => g.id === m.genreId)?.name || "Unassigned"}
                </td>
                <td data-label="Subscriber Only">
                  <span style={{
                    display: "inline-block",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: m.subscriberOnly ? "#fef3c7" : "#f3f4f6",
                    color: m.subscriberOnly ? "#92400e" : "#6b7280",
                  }}>
                    {m.subscriberOnly ? "Premium" : "Free"}
                  </span>
                </td>
                <td data-label="Source" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {m.source === "google_docs" ? "Google Doc" : "Direct"}
                </td>
                <td data-label="Actions">
                  <div className="action-group">
                    <button
                      onClick={() => onEditClick(m)}
                      title={m.source === "google_docs" ? "Edit metadata / update thumbnail (content re-syncs from Google)" : undefined}
                    >
                      Edit
                    </button>
                    <button className="danger" onClick={() => onDeleteClick(m.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">No materials match the current filters</td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableModal>
    </>
  );
}
