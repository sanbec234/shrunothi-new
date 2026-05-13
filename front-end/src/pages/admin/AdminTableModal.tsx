import { useEffect, type ReactNode } from "react";
import "./AdminTableModal.css";
import type { Genre } from "./admin.types";

interface AdminTableModalProps {
  isOpen: boolean;
  title: string;
  count?: number;
  onClose: () => void;

  /* toolbar filters — all optional */
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;

  genres?: Genre[];
  genreFilter?: string;
  onGenreFilterChange?: (id: string) => void;

  languages?: string[];
  languageFilter?: string;
  onLanguageFilterChange?: (l: string) => void;

  /* action buttons rendered in the toolbar */
  actions?: ReactNode;

  children: ReactNode;
}

export default function AdminTableModal({
  isOpen,
  title,
  count,
  onClose,
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  genres,
  genreFilter,
  onGenreFilterChange,
  languages,
  languageFilter,
  onLanguageFilterChange,
  actions,
  children,
}: AdminTableModalProps) {
  /* close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  /* lock body scroll */
  useEffect(() => {
    if (isOpen) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="atm-overlay" onClick={onClose}>
      <div className="atm-panel" onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div className="atm-header">
          <div className="atm-header__left">
            <h2 className="atm-title">{title}</h2>
            {count !== undefined && (
              <span className="atm-badge">{count}</span>
            )}
          </div>
          <button className="atm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* ── Toolbar ── */}
        <div className="atm-toolbar">
          {onSearchChange && (
            <div className="atm-search-wrap">
              <span className="atm-search-icon" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <input
                className="atm-search"
                type="text"
                placeholder={searchPlaceholder}
                value={search ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {search && (
                <button className="atm-search-clear" onClick={() => onSearchChange("")} aria-label="Clear search">×</button>
              )}
            </div>
          )}

          {genres && genres.length > 0 && onGenreFilterChange && (
            <select
              className="atm-filter-select"
              value={genreFilter ?? "all"}
              onChange={(e) => onGenreFilterChange(e.target.value)}
            >
              <option value="all">All genres</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}

          {languages && languages.length > 1 && onLanguageFilterChange && (
            <select
              className="atm-filter-select"
              value={languageFilter ?? "all"}
              onChange={(e) => onLanguageFilterChange(e.target.value)}
            >
              <option value="all">All languages</option>
              {languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          )}

          {actions && <div className="atm-actions">{actions}</div>}
        </div>

        {/* ── Table content ── */}
        <div className="atm-body">
          {children}
        </div>
      </div>
    </div>
  );
}
