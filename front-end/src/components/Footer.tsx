import type { JSX } from "react";
import "./Footer.css";

export default function Footer(): JSX.Element {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <img src="/logo.png" alt="Shrunothi" className="footer-logo" />
        <p className="footer-copy">
          © {new Date().getFullYear()} Shrunothi. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
