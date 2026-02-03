import { useEffect, useState, type JSX } from "react";
import { api } from "../../api/client";
import LeftMenu from "../../components/LeftMenu/LeftMenu";
import HorizontalRow from "../../components/HorizontalRow";
import TextDocCard from "../../components/TextDocCard";
import type { Genre } from "../../types/index";
import DocModal from "../../components/DocModal/DocModal";
import "./home.css";
import LoginPopup from "../../components/GoogleAuthPopup";
import GenreChips from "../../components/GenreChips";
import MobileHeader from "../../components/MobileHeader/MobileHeader";
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
        const res = await api.get<TextDoc[]>(
          `/genres/${genreId}/material`
        );
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

   return (
      <div className="home-root">
        {/* ========== ANNOUNCEMENT CAROUSEL (NEW) ========== */}
        {!loading && shouldShow && announcements.length > 0 && (
          <AnnouncementCarousel
            announcements={announcements}
            onClose={onClose}
          />
        )}

        {/* ---------- Mobile header ---------- */}
        <div className="mobile-only mobile-top">
          <MobileHeader user={user} />
        </div>

        {/* ---------- Desktop sidebar ---------- */}
        <div className="desktop-only">
          <LeftMenu
            genres={genres}
            selected={selectedGenre}
            onSelect={setSelectedGenre}
            user={user}
          />
        </div>

        {/* ---------- Main content ---------- */}
        <main className="main-area">

          {/* Mobile genre chips */}
          <div className="mobile-only">
            <div className="genre-chips-wrapper">
              <GenreChips
                genres={genres}
                selected={selectedGenre}
                onSelect={setSelectedGenre}
              />
            </div>
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

          <HorizontalRow
            title={`Self Help`}
          >
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