import type { User } from "../admin.types";

interface UsersSectionProps {
  users: User[];
}

export default function UsersSection({ users }: UsersSectionProps) {
  return (
    <section>
      <h2>Users</h2>
      <div className="section-body">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>First Login</th>
              <th>Last Login</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty">
                  No users yet
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td data-label="Name">{u.name || "—"}</td>
                  <td data-label="Email">{u.email}</td>
                  <td data-label="Role">{u.role}</td>
                  <td data-label="First Login">
                    {u.created_at ? new Date(u.created_at).toLocaleString() : "—"}
                  </td>
                  <td data-label="Last Login">
                    {u.last_login ? new Date(u.last_login).toLocaleString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}