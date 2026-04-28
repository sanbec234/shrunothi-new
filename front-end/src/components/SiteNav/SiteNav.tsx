import type { JSX } from "react";
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
};

export default function SiteNav({ items, cta }: Props): JSX.Element {
  return (
    <nav className="site-nav">
      <div className="site-nav__brand">
        <img src="/logo-figma.png" alt="Shrunothi" className="site-nav__logo" />
      </div>

      <ul className="site-nav__links">
        {items.map((item) => (
          <li key={item.label}>
            {item.onClick ? (
              <button type="button" onClick={item.onClick}>
                {item.label}
              </button>
            ) : item.href?.startsWith("/") ? (
              <Link to={item.href}>{item.label}</Link>
            ) : (
              <a href={item.href}>{item.label}</a>
            )}
          </li>
        ))}
      </ul>

      {cta.onClick ? (
        <button type="button" className="site-nav__cta" onClick={cta.onClick}>
          {cta.label}
        </button>
      ) : cta.href?.startsWith("/") ? (
        <Link to={cta.href} className="site-nav__cta">
          {cta.label}
        </Link>
      ) : (
        <a href={cta.href} className="site-nav__cta">
          {cta.label}
        </a>
      )}
    </nav>
  );
}
