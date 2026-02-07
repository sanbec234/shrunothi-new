import { useEffect, useState, useRef, type JSX } from "react";
import { api } from "../../api/client";
import HorizontalRow from "../../components/HorizontalRow";
import TextDocCard from "../../components/TextDocCard";
import type { Genre } from "../../types/index";
import DocModal from "../../components/DocModal/DocModal";
import "./home.css";
import LoginPopup from "../../components/GoogleAuthPopup";
import { useDailyAnnouncements } from "../../hooks/useDailyAnnouncements";
import AnnouncementCarousel from "../../components/AnnouncementCarousel/AnnouncementCarousel";

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

const accentPalette = [
  "#2f7d79",
  "#d97706",
  "#7c3aed",
  "#0f4c81",
  "#c2410c",
  "#0f766e",
  "#7f1d1d",
  "#5b21b6",
  "#065f46",
];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const getAccent = (genreId: string) => {
  const index = hashString(genreId) % accentPalette.length;
  return accentPalette[index];
};

const loggedOutGreetings = [
  "Howdy, curious mind!",
  "Hey there, explorer!",
  "Welcome, knowledge seeker!",
  "Hi, ready to dive in?",
  "Hello, future achiever!",
];

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

  const { announcements, shouldShow, loading, onClose } = useDailyAnnouncements();

  const [featuredIndex, setFeaturedIndex] = useState(0);
  const featuredGenre = genres[featuredIndex] || null;

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [greetingIndex, setGreetingIndex] = useState(0);
  
  const podcastSectionRef = useRef<HTMLElement | null>(null);
  
  const handleLogout = () => {
    localStorage.removeItem("authUser");
    window.location.href = "/";
  };

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

        if (list.length > 0) {
          setSelectedGenre((prev) => prev ?? list[0]);
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

  useEffect(() => {
    if (genres.length === 0) return;

    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % genres.length);
    }, 2800); // timing feels calm & premium

    return () => clearInterval(interval);
  }, [genres]);

  /* =========================
     Load podcasts
  ========================= */
  useEffect(() => {
    let mounted = true;

    if (!selectedGenre) {
      setPodcasts(null);
      return;
    }

    const genreId = selectedGenre.id;

    async function loadPodcasts() {
      try {
        const res = await api.get<{ podcasts: Podcast[] }>(
          `/genres/${genreId}/podcasts`
        );
        if (!mounted) return;
        setPodcasts(res.data.podcasts || []);
      } catch {
        setPodcasts([]);
      }
    }

    loadPodcasts();
    return () => {
      mounted = false;
    };
  }, [selectedGenre]);

  /* =========================
     Load material
  ========================= */
  useEffect(() => {
    let mounted = true;

    if (!selectedGenre) {
      setMaterialDocs([]);
      return;
    }

    const genreId = selectedGenre.id;

    async function loadMaterial() {
      try {
        const res = await api.get<TextDoc[]>(`/genres/${genreId}/material`);
        if (!mounted) return;
        setMaterialDocs(res.data || []);
      } catch {
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
      } catch {
        /* silent */
      }
    }

    loadSelfHelp();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const isModalOpen = Boolean(activeDoc || showLogin);

    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [activeDoc, showLogin]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  useEffect(() => {
    if (isLoggedIn) {
      setGreetingIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % loggedOutGreetings.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn && showUserMenu) {
      setShowUserMenu(false);
    }
  }, [isLoggedIn, showUserMenu]);

  const activeAccent = selectedGenre ? getAccent(selectedGenre.id) : "#2f7d79";
  const displayName = authUser?.name || user?.name;
  const pillLabel = displayName
    ? `Howdy, ${displayName}!`
    : loggedOutGreetings[greetingIndex];

  return (
    <div className="home-root">
      {!loading && shouldShow && announcements.length > 0 && (
        <AnnouncementCarousel announcements={announcements} onClose={onClose} />
      )}

      <header className="site-header">
        <div className="brand">
          <img src="/logo.png" alt="Shrunothi" className="brand__logo" />
          <div className="brand__text">
            {/* <span className="brand__eyebrow">SHRUNOTHI</span> */}
            {/* <span className="brand__title">Resource Library for Business Coaching</span> */}
          </div>
        </div>
        <div className="user-menu" ref={userMenuRef}>
          <button
            className="user-pill"
            onClick={() => {
              if (!isLoggedIn) return;
              setShowUserMenu((prev) => !prev);
            }}
            disabled={!isLoggedIn}
            aria-disabled={!isLoggedIn}
          >
            {pillLabel}
          </button>

          {isLoggedIn && showUserMenu && (
            <div className="user-dropdown">
              <button className="user-dropdown__item" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="main-area">
        <section className="hero">
          <div className="hero__content">
            {/* <p className="eyebrow">PODCASTS, MATERIALS, SELF-HELP GUIDES</p> */}
            <p className="eyebrow">Resource Library for Business Coaching</p>
            <h1>Curated resources for the way you want to feel.</h1>
            <p className="hero__lead">
              A single, calming space for podcasts, reading materials, and self‑help
              guides. Switch genres to change what you see instantly, while the
              self‑help toolkit stays steady.
            </p>
            <div className="hero__cta">
              <button
                className="primary"
                onClick={() => {
                  podcastSectionRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
              >
                Explore the library
              </button>
              {/* <button className="ghost">Save for later</button> */}
            </div>
            <div className="hero__meta">
              <span>Updated Weekly</span>
              <span>Curated by Professional Coachers</span>
              <span>Audio + Reading</span>
            </div>
          </div>

          <div className="hero__panel">
            <div className="glass">
              <div className="glass__label">Now featuring Genres</div>
                <div className="glass__title animated-fade" key={featuredGenre?.id}>
                  {featuredGenre?.name}
                </div>

                <p className="" key={`${featuredGenre?.id}-desc`}>
                  {featuredGenre
                    ? `Curated podcasts and reading for ${featuredGenre.name}.`
                    : "Curated audio and reading across genres."}
                </p>
              <div className="glass__accent">
                <div className="pulse" style={{ background: activeAccent }}></div>
                <span>Genre pulse</span>
              </div>
            </div>
            <div className="hero__gradient"></div>
          </div>
        </section>

        <section className="section">
          <div className="section__head">
            <div>
              <p className="eyebrow">Genres</p>
              <h2>Choose your current rhythm.</h2>
            </div>
            <p className="section__subtitle">
              Each genre refreshes the podcast and materials playlists instantly.
            </p>
          </div>
          <div className="genre-grid">
            {genres.map((genre) => {
              const accent = getAccent(genre.id);
              return (
                <button
                  key={genre.id}
                  className={`genre-card ${
                    selectedGenre?.id === genre.id ? "genre-card--active" : ""
                  }`}
                  onClick={() => setSelectedGenre(genre)}
                  style={{ borderColor: accent }}
                >
                  <div
                    className="genre-card__swatch"
                    style={{ background: accent }}
                  ></div>
                  <div>
                    <h3>{genre.name}</h3>
                    <p>Curated playlists and reading for {genre.name}.</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="section" ref={podcastSectionRef}>
          <div className="section__head">
            <div>
              <p className="eyebrow">Podcasts</p>
              <h2>Listen to shift your state of mind.</h2>
            </div>
            <p className="section__subtitle">
              Embedded Spotify playlists, ready to play without leaving the library.
            </p>
          </div>

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
                  <iframe
                    className="spotify-frame"
                    src={p.embed_url}
                    title={p.title || `podcast-${i}`}
                    loading="lazy"
                  />
                </div>
              ))
            )}
          </HorizontalRow>
        </section>

        <section className="section">
          <div className="section__head">
            <div>
              <p className="eyebrow">Materials</p>
              <h2>Articles and guides to deepen the practice.</h2>
            </div>
            <p className="section__subtitle">
              Thoughtful reading, worksheets, and playbooks tailored to the genre.
            </p>
          </div>

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
        </section>

        <section className="section section--alt">
          <div className="section__head">
            <div>
              <p className="eyebrow">Self-help Guides</p>
              <h2>Always-on foundations for better days.</h2>
            </div>
            <p className="section__subtitle">
              These guides stay available regardless of genre, so you can keep
              your anchors close.
            </p>
          </div>

          <HorizontalRow title="Self Help">
            {selfHelpDocs.length === 0 ? (
              <div className="row-empty">No self-help material</div>
            ) : (
              selfHelpDocs.map((doc) => (
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
        </section>

        <footer className="footer">
          <div>
            <h3>Shrunothi Library</h3>
            <p>
              A calming digital shelf for curated wellness resources.
            </p>
          </div>
          <div className="footer__col">
            <a className="footer-link" href="/privacy-policy">Privacy Policy</a>
            <a className="footer-link" href="/tos">Terms of Service</a>
          </div>
        </footer>
      </main>

      {activeDoc && <DocModal doc={activeDoc} onClose={() => setActiveDoc(null)} />}

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
