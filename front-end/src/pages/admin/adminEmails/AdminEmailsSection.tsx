import { useState } from "react";
import type { AdminEmail } from "../admin.types";

interface AdminEmailsSectionProps {
  adminEmails: AdminEmail[];
  currentUserEmail?: string;
  onAdd: (email: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function AdminEmailsSection({
  adminEmails,
  currentUserEmail,
  onAdd,
  onDelete,
}: AdminEmailsSectionProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const handleAdd = async () => {
    if (!newEmail.trim()) return;

    try {
      await onAdd(newEmail);
      setNewEmail("");
      setShowAddModal(false);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add admin");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to remove this admin?");
    if (!confirmDelete) return;

    try {
      await onDelete(id);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete admin");
    }
  };

  return (
    <section>
      <h2>Admin Emails</h2>

      <button onClick={() => setShowAddModal(true)}>+ Add Admin Email</button>

      <div className="section-body">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {adminEmails.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty">
                  No admin emails added
                </td>
              </tr>
            ) : (
              adminEmails.map((a) => (
                <tr key={a.id}>
                  <td data-label="mail">{a.email}</td>
                  <td data-label="role">Admin</td>
                  <td>
                    <button
                      className="secondary"
                      onClick={() => handleDelete(a.id)}
                      disabled={a.email === currentUserEmail}
                      title={
                        a.email === currentUserEmail
                          ? "You cannot remove yourself"
                          : "Remove admin"
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddModal(false)}>
              ✕
            </button>

            <h3>Add Admin Email</h3>

            <input
              placeholder="admin@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <button onClick={handleAdd}>Add</button>
          </div>
        </div>
      )}
    </section>
  );
}