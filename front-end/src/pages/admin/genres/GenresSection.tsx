import type { Genre, Podcast, Material } from "../admin.types";
import "./genres.css";

interface GenresSectionProps {
  genres: Genre[];
  podcasts: Podcast[];
  materials: Material[];
  isOpen: boolean;
  onToggle: () => void;
  onAddClick: () => void;
  onEditClick: (genre: Genre) => void;
  onDeleteClick: (id: string) => void;
}

export default function GenresSection({
  genres,
  podcasts,
  materials,
  isOpen,
  onToggle,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: GenresSectionProps) {
  const podcastCount = (id: string) => podcasts.filter((p) => p.genreId === id).length;
  const materialCount = (id: string) => materials.filter((m) => m.genreId === id).length;

  return (
    <section>
      <div className="section-header open" onClick={onToggle}>
        <span>▶</span>
        Genres
      </div>

      {isOpen && (
        <>
          <button onClick={onAddClick}>+ Add Genre</button>
          <div className="section-body">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Podcasts</th>
                  <th>Materials</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {genres.map((g) => (
                  <tr key={g.id}>
                    <td data-label="Name">{g.name}</td>
                    <td data-label="Podcasts">{podcastCount(g.id)}</td>
                    <td data-label="Materials">{materialCount(g.id)}</td>
                    <td data-label="Actions">
                      <div className="action-group">
                        <button onClick={() => onEditClick(g)}>Edit</button>
                        <button className="danger" onClick={() => onDeleteClick(g.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {genres.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">
                      No genres yet
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