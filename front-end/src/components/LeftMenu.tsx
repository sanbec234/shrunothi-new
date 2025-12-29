// import { type JSX } from "react";
// import type { Genre } from "../types/index";
// import "../components/leftmenu.css";
// type User = {
//   name: string;
//   email: string;
//   picture?: string;
// };

// export default function LeftMenu({
//   genres,
//   onSelect,
//   selected,
//   user
// }: {
//   genres: Genre[];
//   onSelect: (g: Genre) => void;
//   selected: Genre | null;
//   user?: User | null;
// }): JSX.Element {
//   return (
//     <aside className="left-menu">
//       {/* -------- Logo -------- */}
//       <div className="logo">
//         <img
//           src="/logo.png"
//           alt="Shrunothi"
//           className="logo-img"
//         />
//       </div>

//       {/* -------- Genres -------- */}
//       <div className="genre-list">
//         {genres.map((g) => (
//           <button
//             key={g.id}
//             className={`genre-btn ${
//               selected?.id === g.id ? "selected" : ""
//             }`}
//             onClick={() => onSelect(g)}
//           >
//             {g.name}
//           </button>
//         ))}
//       </div>

//       {/* -------- Logged-in User -------- */}
//       {user && (
//         <div className="user-box">
//           {user.picture && (
//             <img
//               src={user.picture}
//               alt={user.name}
//               className="user-avatar"
//             />
//           )}

//           <div className="user-meta">
//             <div className="user-name">{user.name}</div>
//           </div>
//         </div>
//       )}
//     </aside>
//   );
// }

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