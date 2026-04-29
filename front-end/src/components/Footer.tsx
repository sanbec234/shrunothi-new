import type { JSX } from "react";
import "./Footer.css";

const socialLinks = [
  { href: "https://www.facebook.com", label: "Facebook", icon: "/about-us/icon-facebook.png" },
  { href: "https://www.linkedin.com", label: "LinkedIn", icon: "/about-us/icon-linkedin.png" },
  { href: "https://www.instagram.com", label: "Instagram", icon: "/about-us/icon-instagram.png" },
  { href: "https://www.youtube.com", label: "YouTube", icon: "/about-us/icon-youtube.png" },
];

export default function Footer(): JSX.Element {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <img className="site-footer-logo" src="/about-us/logo.png" alt="Shrunothi" />

        <div className="site-footer-social">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={link.label}
            >
              <img src={link.icon} alt="" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
