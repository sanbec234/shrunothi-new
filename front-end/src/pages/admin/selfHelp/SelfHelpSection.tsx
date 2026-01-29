import type { SelfHelp } from "../admin.types";

interface SelfHelpSectionProps {
  selfHelps: SelfHelp[];
  isOpen: boolean;
  onToggle: () => void;
  onAddClick: () => void;
  onEditClick: (selfHelp: SelfHelp) => void;
  onDeleteClick: (id: string) => void;
}

export default function SelfHelpSection({
  selfHelps,
  isOpen,
  onToggle,
  onAddClick,
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
          <button onClick={onAddClick}>+ Add Self-Help</button>
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
                        <button onClick={() => onEditClick(s)}>Edit</button>
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