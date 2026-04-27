import { useState, useEffect, useRef } from "react";
import "./mobileHeader.css";

type User = {
  name: string;
  email: string;
  picture?: string;
};

export default function MobileHeader({ user }: { user?: User | null }) {
  const [open, setOpen] = useState(false);
  const userRef = useRef<HTMLDivElement | null>(null);

  function handleLogout() {
    localStorage.removeItem("authUser");
    window.location.href = "/";
  }

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (open && userRef.current && !userRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <header className="mobile-header">
      <div className="mobile-logo">
        <img src="/logo.png" alt="Shrunothi" />
      </div>

      {user && (
        <div className="mobile-user" ref={userRef}>
          <button
            className="mobile-user-btn"
            onClick={() => setOpen((v) => !v)}
            title={user.name}
          >
            Welcome, {user.name.split(" ")[0] || "User"}
          </button>

          {open && (
            <div className="mobile-user-menu">
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}