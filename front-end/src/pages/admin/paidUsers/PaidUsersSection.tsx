import { useState } from "react";
import type { PaidUser } from "./usePaidUsers";
import AdminTableModal from "../AdminTableModal";

interface PaidUsersSectionProps {
  paidUsers: PaidUser[];
  loading: boolean;
  onReload: () => void;
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function PaidUsersSection({ paidUsers, loading, onReload }: PaidUsersSectionProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const visible = search
    ? paidUsers.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : paidUsers;

  return (
    <>
      <section>
        <div
          className="section-header"
          onClick={() => setOpen(true)}
          style={{ marginBottom: 0 }}
        >
          <span>▶</span>
          <span>Paid Subscribers</span>
          <span
            style={{
              marginLeft: 8,
              background: "#22c55e",
              color: "#fff",
              borderRadius: "999px",
              fontSize: "0.7rem",
              fontWeight: 700,
              padding: "0.1rem 0.55rem",
            }}
          >
            {paidUsers.length}
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 13,
              color: "var(--text-muted)",
              fontWeight: 400,
            }}
          >
            click to manage
          </span>
        </div>
      </section>

      <AdminTableModal
        isOpen={open}
        title="Paid Subscribers"
        count={visible.length}
        onClose={() => setOpen(false)}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or email…"
        actions={
          <button className="secondary" onClick={onReload} disabled={loading}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        }
      >
        {loading ? (
          <p style={{ padding: "1.5rem", opacity: 0.6 }}>Loading…</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Tier</th>
                <th>Plan</th>
                <th>Subscribed On</th>
                <th>Expires On</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">
                    {paidUsers.length === 0
                      ? "No active paid subscribers"
                      : "No subscribers match your search"}
                  </td>
                </tr>
              ) : (
                visible.map((u) => (
                  <tr key={u.email}>
                    <td data-label="Name">{u.name || "—"}</td>
                    <td data-label="Email">{u.email}</td>
                    <td data-label="Tier" style={{ textTransform: "capitalize" }}>
                      {u.subscription_tier || "standard"}
                    </td>
                    <td data-label="Plan" style={{ textTransform: "capitalize" }}>
                      {u.payment_type || "—"}
                    </td>
                    <td data-label="Subscribed On">{fmt(u.started_at)}</td>
                    <td data-label="Expires On">
                      {u.expires_at ? (
                        <span
                          style={{
                            color:
                              new Date(u.expires_at) < new Date() ? "#ef4444" : "#22c55e",
                          }}
                        >
                          {fmt(u.expires_at)}
                        </span>
                      ) : (
                        <span style={{ color: "#22c55e" }}>Lifetime</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </AdminTableModal>
    </>
  );
}
