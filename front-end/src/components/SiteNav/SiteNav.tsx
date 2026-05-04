import { useState, useEffect, type JSX } from "react";
import { Link } from "react-router-dom";

import "./siteNav.css";

type NavItem = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type Cta = {
  label: string;
  onClick?: () => void;
  href?: string;
};

type Props = {
  items: NavItem[];
  cta: Cta;
  /** Optional ghost button rendered to the left of the primary CTA */
  secondaryCta?: Cta;
};

function NavLink({ item }: { item: NavItem }): JSX.Element {
  if (item.onClick) {
    return <button type="button" onClick={item.onClick}>{item.label}</button>;
  }
  if (item.href?.startsWith("/")) {
    return <Link to={item.href}>{item.label}</Link>;
  }
  return <a href={item.href}>{item.label}</a>;
}

function CtaElement({ cta, className }: { cta: Cta; className: string }): JSX.Element {
  if (cta.onClick) {
    return <button type="button" className={className} onClick={cta.onClick}>{cta.label}</button>;
  }
  if (cta.href?.startsWith("/")) {
    return <Link to={cta.href} className={className}>{cta.label}</Link>;
  }
  return <a href={cta.href} className={className}>{cta.label}</a>;
}

export default function SiteNav({ items, cta, secondaryCta }: Props): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);

  /* Lock body scroll while drawer is visible */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <>
      <nav className="site-nav">
        <div className="site-nav__brand">
          <img src="/header-logo.png" alt="Shrunothi" className="site-nav__logo" />
        </div>

        <ul className="site-nav__links">
          {items.map((item) => (
            <li key={item.label}>
              <NavLink item={item} />
            </li>
          ))}
        </ul>

        {/* Right-side buttons: optional ghost "Sign In" + primary CTA */}
        <div className="site-nav__cta-group">
          {secondaryCta && (
            <CtaElement cta={secondaryCta} className="site-nav__secondary-cta" />
          )}
          <CtaElement cta={cta} className="site-nav__cta" />
        </div>

        {/* Hamburger — right end on mobile */}
        <button
          type="button"
          className="site-nav__hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          aria-controls="site-nav-drawer"
        >
          <svg width="26" height="18" viewBox="0 0 26 18" fill="none" aria-hidden="true">
            <rect x="0" y="0"    width="26" height="2.5" rx="1.25" fill="currentColor" />
            <rect x="0" y="7.75" width="26" height="2.5" rx="1.25" fill="currentColor" />
            <rect x="0" y="15.5" width="26" height="2.5" rx="1.25" fill="currentColor" />
          </svg>
        </button>
      </nav>

      {/* Dim backdrop — covers the left half */}
      <div
        className={`site-nav__backdrop${menuOpen ? " site-nav__backdrop--open" : ""}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Right-side drawer — slides in from the right, covers 50 % */}
      <div
        id="site-nav-drawer"
        className={`site-nav__drawer${menuOpen ? " site-nav__drawer--open" : ""}`}
        role="dialog"
        aria-label="Navigation menu"
        aria-modal="true"
        aria-hidden={!menuOpen}
      >
        {/* Close button */}
        <button
          type="button"
          className="site-nav__drawer-close"
          onClick={close}
          aria-label="Close navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>

        <ul className="site-nav__drawer-links">
          {items.map((item) => (
            <li key={item.label} onClick={close}>
              <NavLink item={item} />
            </li>
          ))}
        </ul>

        <div className="site-nav__drawer-footer" onClick={close}>
          {secondaryCta && (
            <CtaElement cta={secondaryCta} className="site-nav__secondary-cta site-nav__drawer-secondary-cta" />
          )}
          <CtaElement cta={cta} className="site-nav__cta site-nav__drawer-cta" />
        </div>
      </div>
    </>
  );
}
