import type { JSX } from "react";
import "./Footer.css";

const socialLinks = [
  { href: "https://www.facebook.com", label: "Facebook", icon: "/about-us/icon-facebook.png" },
  { href: "https://www.linkedin.com", label: "LinkedIn", icon: "/about-us/icon-linkedin.png" },
  { href: "https://www.instagram.com", label: "Instagram", icon: "/about-us/icon-instagram.png" },
  { href: "https://www.youtube.com", label: "YouTube", icon: "/about-us/icon-youtube.png" },
];

const exploreLinks = [
  { label: "Podcast", href: "/#podcast" },
  { label: "Expert Guides", href: "/#materials" },
  { label: "Exclusive Contents", href: "/#exclusive" },
];

export default function Footer(): JSX.Element {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">

        {/* Column 1: Logo + social */}
        <div className="site-footer-brand">
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

        {/* Column 2: Explore links */}
        <div className="site-footer-col">
          <h3 className="site-footer-col__title">Explore Shrunothi</h3>
          <ul className="site-footer-col__links">
            {exploreLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Contact */}
        <div className="site-footer-col">
          <h3 className="site-footer-col__title">Contact Us</h3>
          <address className="site-footer-address">
            Nibbana Institute Pvt. Ltd.,<br />
            No 23, Radhakrishnan Salai,<br />
            9th street, Mylapore,<br />
            Chennai - 600 004.<br />
            <a href="tel:+919345223107">+91-93452 23107</a>
          </address>
        </div>

      </div>
    </footer>
  );
}
