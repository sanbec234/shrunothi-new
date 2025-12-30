import { useEffect, useState, type JSX } from "react";
import { api } from "../api/client";
import LeftMenu from "../components/LeftMenu";
import HorizontalRow from "../components/HorizontalRow";
import TextDocCard from "../components/TextDocCard";
import type { Genre } from "../types/index";
import DocModal from "../components/DocModal";
import "../pages/home.css";
import LoginPopup from "../components/GoogleAuthPopup";
import GenreChips from "../components/GenreChips";
import MobileHeader from "../components/MobileHeader";

/* ---- types ---- */
type Podcast = {
  embed_url: string;
  title?: string;
};

type TextDoc = {
  id: string;
  title: string;
  author: string;
};

export default function Home(): JSX.Element {
  const user = JSON.parse(localStorage.getItem("authUser") || "null");

  /* ---- sidebar ---- */
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);

  /* ---- rows ---- */
  const [podcasts, setPodcasts] = useState<Podcast[] | null>(null);
  const [materialDocs, setMaterialDocs] = useState<TextDoc[]>([]);
  const [selfHelpDocs, setSelfHelpDocs] = useState<TextDoc[]>([]);
  const [activeDoc, setActiveDoc] = useState<TextDoc | null>(null);

  const [showLogin, setShowLogin] = useState(false);
  const [pendingDoc, setPendingDoc] = useState<TextDoc | null>(null);

  const authUser = JSON.parse(localStorage.getItem("authUser") || "null");
  const isLoggedIn = Boolean(authUser);

  

  /* =========================
     Disable screenshots / focus
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
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      const isScreenshot =
        key === "printscreen" ||
        (e.ctrlKey && key === "p") ||
        (e.metaKey && key === "p") ||
        (e.ctrlKey && e.shiftKey && key === "i") ||
        (e.metaKey && e.altKey && key === "i");

      if (isScreenshot) {
        e.preventDefault();

        document.documentElement.classList.add("blurred");

        setTimeout(() => {
          document.documentElement.classList.remove("blurred");
        }, 2000); // brief deterrent, not punishment

        alert("Screenshots are disabled.");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

        if (list.length > 0 && !selectedGenre) {
          setSelectedGenre(list[0]);
        }
      } catch (err) {
        console.error("Failed to load genres", err);
      }
    }

    loadGenres();
    return () => {
      mounted = false;
    };
  }, []);

  /* =========================
     Load podcasts by genre
  ========================= */
  useEffect(() => {
    let mounted = true;

    if (!selectedGenre) {
      setPodcasts(null);
      return;
    }

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
    return () => {
      mounted = false;
    };
  }, [selectedGenre]);

  /* =========================
     Load material by genre
  ========================= */
  useEffect(() => {
    let mounted = true;

    if (!selectedGenre) {
      setMaterialDocs([]);
      return;
    }

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
    return () => {
      mounted = false;
    };
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
    return () => {
      mounted = false;
    };
  }, []);

  /* =========================
     Render
  ========================= */
  return (
    <div className="home-root">
        {/* Mobile: genre chips */}
      {/* Mobile header + chips */}
      <div className="mobile-only mobile-top">
        <MobileHeader user={user} />

        <div className="mobile-chips">
          <GenreChips
            genres={genres}
            selected={selectedGenre}
            onSelect={(g) => setSelectedGenre(g)}
          />
        </div>
      </div>

      {/* Desktop: left menu */}
      <div className="desktop-only">
        <LeftMenu
          genres={genres}
          selected={selectedGenre}
          onSelect={(g) => setSelectedGenre(g)}
          user={user}
        />
      </div>

      <main className="main-area">
        {/* -------- Podcasts -------- */}
        <HorizontalRow
          title={`Podcasts${selectedGenre ? ` · ${selectedGenre.name}` : ""}`}
        >
          {!selectedGenre ? (
            <div className="row-empty">Click a genre to view podcasts</div>
          ) : podcasts === null ? (
            <div className="row-empty">Loading podcasts…</div>
          ) : podcasts.length === 0 ? (
            <div className="row-empty">No podcasts found</div>
          ) : (
            podcasts.map((p, i) => (
              <div key={i} className="podcast-card">
                <div className="podcast-meta">
                  <div className="podcast-title">
                    {p.title || " "}
                  </div>
                </div>

                <iframe
                  className="spotify-frame"
                  src={p.embed_url}
                  title={p.title || `podcast-${i}`}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              </div>
            ))
          )}
        </HorizontalRow>

        {/* -------- Material -------- */}
        <HorizontalRow
          title={`Material${selectedGenre ? ` · ${selectedGenre.name}` : ""}`}
        >
          {materialDocs.length === 0 ? (
            <div className="row-empty">No material found</div>
          ) : (
            materialDocs.map((doc) => (
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

        {/* -------- Self Help -------- */}
        <HorizontalRow
          title={`Self Help${selectedGenre ? ` · ${selectedGenre.name}` : ""}`}
        >
          {selfHelpDocs.length === 0 ? (
            <div className="row-empty">No self-help material</div>
          ) : (
            selfHelpDocs.map((doc) => (
              <TextDocCard
                key={doc.id}
                doc={doc}
                onClick={() => setActiveDoc(doc)}
              />
            ))
          )}
        </HorizontalRow>
      </main>

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