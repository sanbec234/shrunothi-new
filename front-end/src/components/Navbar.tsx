import type { JSX } from "react";
import "./Navbar.css";

type User = {
  name: string;
  email: string;
  picture?: string;
};

type Props = {
  user?: User | null;
  onSignUpClick?: () => void;
};

export default function Navbar({ user, onSignUpClick }: Props): JSX.Element {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <div className="navbar-logo">
          <img src="/logo.png" alt="Shrunothi" className="navbar-logo-img" />
        </div>

        {/* Nav links */}
        <div className="navbar-links">
          <a href="#podcasts" className="navbar-link">Podcast</a>
          <a href="#materials" className="navbar-link">Materials</a>
          <a href="#selfhelp" className="navbar-link">Self Help Resources</a>
          <a href="#about" className="navbar-link">About Us</a>
        </div>

        {/* Right side: user avatar or sign-up button */}
        <div className="navbar-right">
          {user ? (
            <div className="navbar-user">
              {user.picture && (
                <img src={user.picture} alt={user.name} className="navbar-avatar" />
              )}
              <span className="navbar-username">{user.name}</span>
            </div>
          ) : (
            <button className="navbar-signup-btn" onClick={onSignUpClick}>
              Sign Up
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
