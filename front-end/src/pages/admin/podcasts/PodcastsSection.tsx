import type { Genre, Podcast } from "../admin.types";

interface PodcastsSectionProps {
  podcasts: Podcast[];
  genres: Genre[];
  isOpen: boolean;
  genreFilter: string;
  onToggle: () => void;
  onFilterChange: (genreId: string) => void;
  onAddClick: () => void;
  onEditClick: (podcast: Podcast) => void;
  onDeleteClick: (id: string) => void;
}

export default function PodcastsSection({
  podcasts,
  genres,
  isOpen,
  genreFilter,
  onToggle,
  onFilterChange,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: PodcastsSectionProps) {
  const visiblePodcasts =
    genreFilter === "all"
      ? podcasts
      : podcasts.filter((p) => p.genreId === genreFilter);

  return (
    <section>
      <div className="section-header" onClick={onToggle}>
        <span className={isOpen ? "open" : ""}>▶</span>
        <span>Podcasts</span>
      </div>

      {isOpen && (
        <>
          <div className="section-controls">
            <button onClick={onAddClick}>+ Add Podcast</button>
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
                {visiblePodcasts.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Title">{p.title}</td>
                    <td data-label="Author">{p.author}</td>
                    <td data-label="Genre">
                      {genres.find((g) => g.id === p.genreId)?.name}
                    </td>
                    <td data-label="Actions">
                      <div className="action-group">
                        <button onClick={() => onEditClick(p)}>Edit</button>
                        <button className="danger" onClick={() => onDeleteClick(p.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {visiblePodcasts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">
                      No podcasts for this genre
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