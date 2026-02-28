import type { Genre, Material } from "../admin.types";

interface MaterialsSectionProps {
  materials: Material[];
  genres: Genre[];
  isOpen: boolean;
  genreFilter: string;
  onToggle: () => void;
  onFilterChange: (genreId: string) => void;
  onAddClick: () => void;
  onAddGoogleDocClick: () => void;
  onEditClick: (material: Material) => void;
  onDeleteClick: (id: string) => void;
}

export default function MaterialsSection({
  materials,
  genres,
  isOpen,
  genreFilter,
  onToggle,
  onFilterChange,
  onAddClick,
  onAddGoogleDocClick,
  onEditClick,
  onDeleteClick,
}: MaterialsSectionProps) {
  const visibleMaterials =
    genreFilter === "all"
      ? materials
      : materials.filter((m) => m.genreId === genreFilter);

  return (
    <section>
      <div className="section-header" onClick={onToggle}>
        <span className={isOpen ? "open" : ""}>▶</span>
        <span>Materials</span>
      </div>

      {isOpen && (
        <>
          <div className="section-controls">
            <button onClick={onAddClick}>+ Add Material</button>
            <button className="secondary" onClick={onAddGoogleDocClick}>
              + Sync Google Doc
            </button>
            <div className="form-field">
              <select value={genreFilter} onChange={(e) => onFilterChange(e.target.value)}>
                <option value="all">All genres</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="section-body">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Genre</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleMaterials.map((m) => (
                  <tr key={m.id}>
                    <td data-label="Title">{m.title}</td>
                    <td data-label="Author">{m.author || "-"}</td>
                    <td data-label="Genre">
                      {genres.find((g) => g.id === m.genreId)?.name || "Unassigned"}
                    </td>
                    <td data-label="Actions">
                      <div className="action-group">
                        <button
                          onClick={() => onEditClick(m)}
                          disabled={m.source === "google_docs"}
                          title={m.source === "google_docs" ? "Edit disabled for Google-synced materials" : undefined}
                        >
                          Edit
                        </button>
                        <button className="danger" onClick={() => onDeleteClick(m.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {visibleMaterials.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">
                      No materials for this genre
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
