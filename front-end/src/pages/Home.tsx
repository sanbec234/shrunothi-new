import { useEffect, useRef, useState, type JSX } from "react";
import { api } from "../api/client";

import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import HorizontalRow from "../components/HorizontalRow";
import TextDocCard from "../components/TextDocCard";
import DocModal from "../components/DocModal";
import Footer from "../components/Footer";
import LoginPopup from "../components/GoogleAuthPopup";

import type { Genre } from "../types/index";
import "./home.css";

/* ---- types ---- */
type Podcast = {
  embed_url: string;
  title?: string;
};

type TextDoc = {
  id: string;
  title: string;
  author: string;
  preview?: string;
  thumbnailUrl?: string;
};

export default function Home(): JSX.Element {
  const user = JSON.parse(localStorage.getItem("authUser") || "null");
  const isLoggedIn = Boolean(user);
  const contentRef = useRef<HTMLDivElement>(null);

  /* ---- sidebar ---- */
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  /* ---- rows ---- */
  const [podcasts, setPodcasts] = useState<Podcast[] | null>(null);
  const [materialDocs, setMaterialDocs] = useState<TextDoc[]>([]);
  const [selfHelpDocs, setSelfHelpDocs] = useState<TextDoc[]>([]);
  const [activeDoc, setActiveDoc] = useState<TextDoc | null>(null);

  const [showLogin, setShowLogin] = useState(false);
  const [pendingDoc, setPendingDoc] = useState<TextDoc | null>(null);

  /* =========================
     Security: blur on focus-loss
  ========================= */
  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        key === "printscreen" ||
        (e.ctrlKey && key === "p") ||
        (e.metaKey && key === "p") ||
        (e.ctrlKey && e.shiftKey && key === "i") ||
        (e.metaKey && e.altKey && key === "i")
      ) {
        e.preventDefault();
        alert("Screenshots and printing are disabled.");
      }
    };
    window.addEventListener("keydown", blockKeys);
    return () => window.removeEventListener("keydown", blockKeys);
  }, []);

  useEffect(() => {
    // Guard: require explicit user interaction AND the tab to be hidden
    // before blurring — prevents false-triggers from DevTools, HMR, etc.
    let interacted = false;

    const markInteracted = () => { interacted = true; };

    const handleVisibility = () => {
      if (!interacted) return;
      if (document.hidden) {
        document.documentElement.classList.add("blurred");
      } else {
        document.documentElement.classList.remove("blurred");
      }
    };

    window.addEventListener("click", markInteracted, { once: true });
    window.addEventListener("keydown", markInteracted, { once: true });
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("click", markInteracted);
      window.removeEventListener("keydown", markInteracted);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  /* =========================
     Load genres
  ========================= */
  useEffect(() => {
    let mounted = true;
    async function loadGenres() {
      try {
        const res = await api.get<Genre[]>("/genres");
        if (!mounted) return;
        const list = res.data || [];
        setGenres(list);
        if (list.length > 0 && !selectedGenre) setSelectedGenre(list[0]);
      } catch (err) {
        console.error("Failed to load genres", err);
      }
    }
    loadGenres();
    return () => { mounted = false; };
  }, []);

  /* =========================
     Load podcasts by genre
  ========================= */
  useEffect(() => {
    let mounted = true;
    if (!selectedGenre) { setPodcasts(null); return; }

    async function loadPodcasts() {
      try {
        const res = await api.get<{ podcasts: Podcast[] }>(
          `/genres/${selectedGenre!.id}/podcasts`
        );
        if (!mounted) return;
        setPodcasts(res.data.podcasts || []);
      } catch (err) {
        console.error("Failed to load podcasts", err);
        setPodcasts([]);
      }
    }
    loadPodcasts();
    return () => { mounted = false; };
  }, [selectedGenre]);

  /* =========================
     Load materials by genre
  ========================= */
  useEffect(() => {
    let mounted = true;
    if (!selectedGenre) { setMaterialDocs([]); return; }

    async function loadMaterial() {
      try {
        const res = await api.get<TextDoc[]>(
          `/genres/${selectedGenre!.id}/material`
        );
        if (!mounted) return;
        setMaterialDocs(res.data || []);
      } catch (err) {
        console.error("Failed to load material", err);
        setMaterialDocs([]);
      }
    }
    loadMaterial();
    return () => { mounted = false; };
  }, [selectedGenre]);

  /* =========================
     Load self-help
  ========================= */
  useEffect(() => {
    let mounted = true;
    async function loadSelfHelp() {
      try {
        const res = await api.get<TextDoc[]>("/corpus/self-help");
        if (!mounted) return;
        setSelfHelpDocs(res.data || []);
      } catch (err) {
        console.error("Failed to load self-help corpus", err);
      }
    }
    loadSelfHelp();
    return () => { mounted = false; };
  }, []);

  /* ---- filtered docs ---- */
  const filteredMaterial = materialDocs.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSelfHelp = selfHelpDocs.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* =========================
     Render
  ========================= */
  return (
    <div className="page-root">
      {/* ── Top Navbar ── */}
      <Navbar
        user={user}
        onSignUpClick={() => setShowLogin(true)}
      />

      {/* ── Info ticker ── */}
      <div className="ticker-bar">
        <span className="ticker-item">Updated Weekly</span>
        <span className="ticker-dot">•</span>
        <span className="ticker-item">Curated by Professional Coaches</span>
        <span className="ticker-dot">•</span>
        <span className="ticker-item">Audio + Reading</span>
      </div>

      {/* ── Hero ── */}
      <HeroSection
        onExplore={() =>
          contentRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      />

      {/* ── Main content area ── */}
      <main className="main-content" ref={contentRef}>

        {/* Genre filter pills + search */}
        <div className="filters-bar">
          <div className="genre-pills scroll-x">
            {genres.map((g) => (
              <button
                key={g.id}
                className={`genre-pill ${selectedGenre?.id === g.id ? "genre-pill--active" : ""}`}
                onClick={() => setSelectedGenre(g)}
              >
                {g.name}
              </button>
            ))}
          </div>

          <div className="search-wrap">
            <div className="search-bar">
              <svg className="search-icon" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="6" stroke="#555" strokeWidth="2" />
                <path d="M13.5 13.5L17 17" stroke="#555" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                className="search-input"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Podcasts ── */}
        <HorizontalRow title="Podcast" id="podcasts">
          {!selectedGenre ? (
            <div className="row-empty">Select a genre to view podcasts</div>
          ) : podcasts === null ? (
            <div className="row-empty">Loading podcasts…</div>
          ) : podcasts.length === 0 ? (
            <div className="row-empty">No podcasts found for this genre</div>
          ) : (
            podcasts.map((p, i) => (
              <div key={i} className="podcast-card">
                {p.title && <div className="podcast-title">{p.title}</div>}
                <iframe
                  src={p.embed_url}
                  title={p.title || `podcast-${i}`}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              </div>
            ))
          )}
        </HorizontalRow>

        {/* ── Reading Materials ── */}
        <HorizontalRow title="Materials" id="materials">
          {filteredMaterial.length === 0 ? (
            <div className="row-empty">
              {searchQuery ? "No results match your search" : "No material found for this genre"}
            </div>
          ) : (
            filteredMaterial.map((doc) => (
              <TextDocCard
                key={doc.id}
                doc={doc}
                onClick={() => {
                  if (!isLoggedIn) {
                    setPendingDoc(doc);
                    setShowLogin(true);
                    return;
                  }
                  setActiveDoc(doc);
                }}
              />
            ))
          )}
        </HorizontalRow>

        {/* ── Self Help ── */}
        <HorizontalRow title="Self Help Guide" id="selfhelp">
          {filteredSelfHelp.length === 0 ? (
            <div className="row-empty">
              {searchQuery ? "No results match your search" : "No self-help material available"}
            </div>
          ) : (
            filteredSelfHelp.map((doc) => (
              <TextDocCard
                key={doc.id}
                doc={doc}
                onClick={() => setActiveDoc(doc)}
              />
            ))
          )}
        </HorizontalRow>

        {/* ── Subscribe CTA ── */}
        <section className="subscribe-cta">
          <div className="subscribe-cta-inner">
            <h2 className="subscribe-heading">
              Subscribe Now<br />to Access<br />All Our Content
            </h2>
            <button
              className="subscribe-btn"
              onClick={() => setShowLogin(true)}
            >
              Get Access
            </button>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <Footer />

      {/* ── Modals ── */}
      {activeDoc && (
        <DocModal doc={activeDoc} onClose={() => setActiveDoc(null)} />
      )}

      {showLogin && (
        <LoginPopup
          onSuccess={() => {
            setShowLogin(false);
            if (pendingDoc) {
              setActiveDoc(pendingDoc);
              setPendingDoc(null);
            }
          }}
          onClose={() => {
            setShowLogin(false);
            setPendingDoc(null);
          }}
        />
      )}
    </div>
  );
}
