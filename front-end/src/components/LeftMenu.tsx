import { type JSX } from "react";
import type { Genre } from "../types/index";
import "../components/leftmenu.css";

type User = {
  name: string;
  email: string;
  picture?: string;
};

export default function LeftMenu({
  genres,
  onSelect,
  selected,
  user
}: {
  genres: Genre[];
  onSelect: (g: Genre) => void;
  selected: Genre | null;
  user?: User | null;
}): JSX.Element {

  function handleLogout() {
    localStorage.removeItem("authUser");
    window.location.href = "/";
  }

  function handlePrivacyPolicy() {
    window.location.href = "/privacy-policy";
  }

  return (
    <aside className="left-menu">
      {/* -------- Logo -------- */}
      <div className="logo">
        <img src="/logo.png" alt="Shrunothi" className="logo-img" />
      </div>

      {/* -------- Genres -------- */}
      <div className="genre-list">
        {genres.map((g) => (
          <button
            key={g.id}
            className={`genre-btn ${selected?.id === g.id ? "selected" : ""}`}
            onClick={() => onSelect(g)}
          >
            {g.name}
          </button>
        ))}
      </div>

      <div>
        <button onClick={handlePrivacyPolicy}
        className="privacy-policy-btn">
          Privacy Policy
        </button>
      </div>

      {/* -------- User footer -------- */}
      {user && (
        <div className="leftmenu-user">
          <div className="username" title={user.name}>
            {user.name}
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}