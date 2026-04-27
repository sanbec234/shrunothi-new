import type { SelfHelp } from "../admin.types";

interface SelfHelpSectionProps {
  selfHelps: SelfHelp[];
  isOpen: boolean;
  onToggle: () => void;
  onAddClick: () => void;
  onAddGoogleDocClick: () => void;
  onEditClick: (selfHelp: SelfHelp) => void;
  onDeleteClick: (id: string) => void;
}

export default function SelfHelpSection({
  selfHelps,
  isOpen,
  onToggle,
  onAddClick,
  onAddGoogleDocClick,
  onEditClick,
  onDeleteClick,
}: SelfHelpSectionProps) {
  return (
    <section>
      <div className="section-header" onClick={onToggle}>
        <span>▶</span> Self-Help Guides
      </div>

      {isOpen && (
        <>
          <div className="section-controls">
            <button onClick={onAddClick}>+ Add Self-Help</button>
            <button className="secondary" onClick={onAddGoogleDocClick}>
              + Sync Google Doc
            </button>
          </div>
          <div className="section-body">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {selfHelps.map((s) => (
                  <tr key={s.id}>
                    <td data-label="title">{s.title}</td>
                    <td data-label="author">{s.author}</td>
                    <td data-label="actions">
                      <div className="action-group">
                        <button
                          onClick={() => onEditClick(s)}
                          disabled={s.source === "google_docs"}
                          title={s.source === "google_docs" ? "Edit disabled for Google-synced self-help" : undefined}
                        >
                          Edit
                        </button>
                        <button className="danger" onClick={() => onDeleteClick(s.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {selfHelps.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty">
                      No self-help guides yet
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
