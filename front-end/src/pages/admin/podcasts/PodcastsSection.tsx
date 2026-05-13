import { useState } from "react";
import type { Genre, Podcast } from "../admin.types";
import AdminTableModal from "../AdminTableModal";
import { INDIAN_PODCAST_LANGUAGES } from "../../../constants/podcastLanguages";

const ALL_LANGUAGES: string[] = [...INDIAN_PODCAST_LANGUAGES];

interface PodcastsSectionProps {
  podcasts: Podcast[];
  genres: Genre[];
  genreFilter: string;
  onFilterChange: (genreId: string) => void;
  onAddClick: () => void;
  onEditClick: (podcast: Podcast) => void;
  onDeleteClick: (id: string) => void;
}

export default function PodcastsSection({
  podcasts,
  genres,
  genreFilter,
  onFilterChange,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: PodcastsSectionProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState("all");

  const visible = podcasts.filter((p) => {
    if (genreFilter !== "all" && p.genreId !== genreFilter) return false;
    if (langFilter !== "all" && (p.language || "English") !== langFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.language || "").toLowerCase().includes(q) ||
        (genres.find((g) => g.id === p.genreId)?.name || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <>
      <section>
        <div className="section-header" onClick={() => setOpen(true)} style={{ marginBottom: 0 }}>
          <span>▶</span>
          <span>Podcasts</span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-muted)", fontWeight: 400 }}>
            {podcasts.length} total · click to manage
          </span>
        </div>
      </section>

      <AdminTableModal
        isOpen={open}
        title="Podcasts"
        count={visible.length}
        onClose={() => setOpen(false)}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title, genre, language…"
        genres={genres}
        genreFilter={genreFilter}
        onGenreFilterChange={onFilterChange}
        languages={ALL_LANGUAGES}
        languageFilter={langFilter}
        onLanguageFilterChange={setLangFilter}
        actions={
          <button onClick={() => { setOpen(false); onAddClick(); }}>+ Add Podcast</button>
        }
      >
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Genre</th>
              <th>Language</th>
              <th>What's New</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id}>
                <td data-label="Title">{p.title}</td>
                <td data-label="Genre">{genres.find((g) => g.id === p.genreId)?.name || "—"}</td>
                <td data-label="Language">{p.language || "English"}</td>
                <td data-label="What's New">
                  <span style={{
                    display: "inline-block",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: p.showInWhatsNew ? "#dcfce7" : "#f3f4f6",
                    color: p.showInWhatsNew ? "#166534" : "#6b7280",
                  }}>
                    {p.showInWhatsNew ? "Yes" : "No"}
                  </span>
                </td>
                <td data-label="Actions">
                  <div className="action-group">
                    <button onClick={() => onEditClick(p)}>Edit</button>
                    <button className="danger" onClick={() => onDeleteClick(p.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="empty">No podcasts match the current filters</td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableModal>
    </>
  );
}
