import { useEffect, useState, type JSX } from "react";
import { api } from "../api/client";
import LeftMenu from "../components/LeftMenu";
import HorizontalRow from "../components/HorizontalRow";
import TextDocCard from "../components/TextDocCard";
import type { Genre } from "../types";
import DocModal from "../components/DocModal";

/* ---- types (match mock backend) ---- */
type Podcast = {
  embed_url: string;
  title?: string;
};

type TextDoc = {
  id: string;
  filename: string;
  author: string;
};

export default function Home(): JSX.Element {
  /* ---- sidebar ---- */
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);

  /* ---- rows ---- */
  const [podcasts, setPodcasts] = useState<Podcast[] | null>(null);
  const [materialDocs, setMaterialDocs] = useState<TextDoc[]>([]);
  const [selfHelpDocs, setSelfHelpDocs] = useState<TextDoc[]>([]);
  const [activeDoc, setActiveDoc] = useState<TextDoc | null>(null);


  /* =========================
     Load genres (WORKING)
  ========================= */
  // useEffect(() => {
  //   let mounted = true;

  //   async function loadGenres() {
  //     try {
  //       const res = await api.get<Genre[]>("/genres");
  //       if (!mounted) return;
  //       setGenres(res.data || []);
  //     } catch (err) {
  //       console.error("Failed to load genres", err);
  //     }
  //   }

  //   loadGenres();
  //   return () => {
  //     mounted = false;
  //   };
  // }, []);

  useEffect(() => {
  let mounted = true;

  async function loadGenres() {
    try {
      const res = await api.get<Genre[]>("/genres");
      if (!mounted) return;

      const list = res.data || [];
      setGenres(list);

      // ✅ auto-select first genre on initial load
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
     (ISOLATED — NO Promise.all)
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
          `/genres/${selectedGenre.id}/podcasts`
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
     TEMPORARY PLACEHOLDERS
     (APIs NOT IMPLEMENTED YET)
  ========================= */
  useEffect(() => {
    setMaterialDocs([]);
    setSelfHelpDocs([]);
  }, []);

  /* =========================
     Render
  ========================= */
  return (
    <div className="app-root">
      <LeftMenu
        genres={genres}
        selected={selectedGenre}
        onSelect={(g) => setSelectedGenre(g)}
      />

      <main className="main-area">
        {/* -------- Podcasts Row -------- */}
        <HorizontalRow title="Podcasts">
          {!selectedGenre ? (
            <div className="row-empty">
              Click on a genre to view relevant podcasts
            </div>
          ) : podcasts === null ? (
            <div className="row-empty">Loading podcasts…</div>
          ) : podcasts.length === 0 ? (
            <div className="row-empty">
              No podcasts found for this genre.
            </div>
          ) : (
            podcasts.map((p, i) => (
              <div key={i} className="podcast-card">
                {p.title && (
                  <div className="podcast-title">{p.title}</div>
                )}
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

        {/* -------- Material Row -------- */}
        <HorizontalRow title="Material">
          <div className="row-empty">
            Material API not connected yet
          </div>
          {materialDocs.map((doc) => (
            <TextDocCard key={doc.id} doc={doc} />
          ))}
        </HorizontalRow>

        {/* -------- Self-Help Row -------- */}
        <HorizontalRow title="Self Help">
          <div className="row-empty">
            Self-help corpus not connected yet
          </div>
          {selfHelpDocs.map((doc) => (
            <TextDocCard key={doc.id} doc={doc} />
          ))}
        </HorizontalRow>
      </main>
      {activeDoc && (
        <DocModal
          doc={activeDoc}
          onClose={() => setActiveDoc(null)}
        />
      )}
    </div>
  );
}
