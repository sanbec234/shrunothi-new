import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
  type ReactNode,
  type RefObject,
} from "react";

/* ── Rotating stats bar ─────────────────────────────────────── */
const STAT_ITEMS = [
  "Updated Weekly",
  "Curated by Professional Coaches",
  "Audio + Reading",
] as const;

function RotatingStatsBar(): JSX.Element {
  const [idx,     setIdx]     = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      const tid = setTimeout(() => {
        setIdx((i) => (i + 1) % STAT_ITEMS.length);
        setVisible(true);
      }, 280); // fade-out duration
      return () => clearTimeout(tid);
    }, 1780); // 1500 ms shown + 280 ms transition
    return () => clearInterval(id);
  }, []);

  return (
    <div className="h2-statsbar">
      {/* Desktop: all three items with dot separators — unchanged */}
      <span className="h2-statsbar__item h2-statsbar__item--desktop">Updated Weekly</span>
      <span className="h2-statsbar__dot  h2-statsbar__dot--desktop" />
      <span className="h2-statsbar__item h2-statsbar__item--desktop">Curated by Professional Coaches</span>
      <span className="h2-statsbar__dot  h2-statsbar__dot--desktop" />
      <span className="h2-statsbar__item h2-statsbar__item--desktop">Audio + Reading</span>

      {/* Mobile only: single rotating caption with fade+slide */}
      <span
        className={`h2-statsbar__item h2-statsbar__item--mobile${visible ? "" : " h2-statsbar__item--out"}`}
      >
        {STAT_ITEMS[idx]}
      </span>
    </div>
  );
}
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import DocModal from "../../components/DocModal/DocModal";
import LoginPopup from "../../components/GoogleAuthPopup";
import { useSubscription } from "../../hooks/useSubscription";
import type { Genre } from "../../types/index";
import type { TextDoc } from "../../types";
import {
  DEFAULT_PODCAST_LANGUAGE,
  INDIAN_PODCAST_LANGUAGES,
} from "../../constants/podcastLanguages";
import Footer from "../../components/Footer";
import SiteNav from "../../components/SiteNav/SiteNav";
import "./home2.css";

/* ── Types ─────────────────────────────────────────────────── */
type Podcast      = { embed_url: string; title?: string; language?: string };
type PodcastApi   = { podcasts?: Podcast[]; languages?: string[] };
type MaterialDoc  = TextDoc & { thumbnailUrl?: string | null; subscriberOnly?: boolean; locked?: boolean };
type SelfHelpDoc  = TextDoc & { preview?: string; thumbnailUrl?: string | null; subscriberOnly?: boolean; locked?: boolean };
type Suggestion   = { id: string; title: string; kind: "podcast" | "material" | "guide"; onSelect: () => void };

const THUMB_PLACEHOLDER = "/thumb-placeholder.jpg";

/* ============================================================
   Horizontal scroll row — arrows overlay the row
   ============================================================ */
function PodcastRow({
  rowRef,
  children,
  label,
}: {
  rowRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  label: string;
}) {
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);

  const sync = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(max > 2 && el.scrollLeft < max - 2);
  }, [rowRef]);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => { el.removeEventListener("scroll", sync); window.removeEventListener("resize", sync); };
  }, [rowRef, sync, children]);

  const scroll = (dir: "left" | "right") =>
    rowRef.current?.scrollBy({ left: dir === "left" ? -480 : 480, behavior: "smooth" });

  return (
    <div className="h2-scroll-wrap">
      <div ref={rowRef} className="h2-scroll" role="region" aria-label={label}>
        {children}
      </div>
      {/* Overlay arrows — sit on top of the row, not below it */}
      {canLeft && (
        <button
          type="button"
          className="h2-scroll-arrow h2-scroll-arrow--left"
          onClick={() => scroll("left")}
          aria-label={`Scroll ${label} left`}
        >‹</button>
      )}
      {canRight && (
        <button
          type="button"
          className="h2-scroll-arrow h2-scroll-arrow--right"
          onClick={() => scroll("right")}
          aria-label={`Scroll ${label} right`}
        >›</button>
      )}
    </div>
  );
}

/* ============================================================
   Search bar with autocomplete suggest
   ============================================================ */
function SearchWithSuggest({
  value,
  onChange,
  suggestions,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: Suggestion[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  /* close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hits = !value
    ? []
    : suggestions
        .filter((s) => s.title.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 6);

  return (
    <div className="h2-search-wrap" ref={wrapRef}>
      <div className="h2-search">
        <span className="h2-search__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </span>
        <input
          className="h2-search__input"
          type="text"
          placeholder="Search podcasts, materials and guides"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => value && setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
          aria-label="Search podcasts, materials and guides"
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            className="h2-search__clear"
            onClick={() => { onChange(""); setOpen(false); }}
            aria-label="Clear search"
          >×</button>
        )}
      </div>
      {open && hits.length > 0 && (
        <div className="h2-suggest" role="listbox">
          {hits.map((s) => (
            <button
              key={s.id}
              role="option"
              className="h2-suggest__item"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange("");
                s.onSelect();
                setOpen(false);
              }}
            >
              <span className="h2-suggest__badge">
                {s.kind === "podcast" ? "Podcast" : s.kind === "material" ? "Material" : "Guide"}
              </span>
              <span className="h2-suggest__label">{s.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Language tab strip
   ============================================================ */
function LangTabs({
  languages,
  active,
  onChange,
}: {
  languages: string[];
  active: string;
  onChange: (l: string) => void;
}) {
  if (languages.length <= 1) return null;
  return (
    <select
      className="h2-lang-select"
      value={active}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Podcast language"
    >
      {languages.map((lang) => (
        <option key={lang} value={lang}>
          {lang}
        </option>
      ))}
    </select>
  );
}

/* ============================================================
   HOME2
   ============================================================ */
export default function Home2(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState(() =>
    JSON.parse(localStorage.getItem("authUser") || "null")
  );
  const isLoggedIn = Boolean(authUser);
  const { isSubscribed: isPaidSubscriber, refresh: refreshSubscription } = useSubscription();

  /* genre */
  const [genres,        setGenres]        = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);

  /* search */
  const [searchQuery, setSearchQuery] = useState("");

  /* podcasts */
  const [podcasts,         setPodcasts]         = useState<Podcast[] | null>(null);
  const [podcastLang,      setPodcastLang]      = useState(DEFAULT_PODCAST_LANGUAGE);
  const [podcastLanguages, setPodcastLanguages] = useState<string[]>([...INDIAN_PODCAST_LANGUAGES]);

  /* content */
  const [materialDocs, setMaterialDocs] = useState<MaterialDoc[]>([]);
  const [selfHelpDocs, setSelfHelpDocs] = useState<SelfHelpDoc[]>([]);

  /* cross-genre suggestion pool */
  const [allMaterials, setAllMaterials] = useState<{ doc: MaterialDoc; genre: Genre }[]>([]);
  const [allPodcasts,  setAllPodcasts]  = useState<{ podcast: Podcast & { title: string }; genre: Genre }[]>([]);

  /* pending scroll-to-podcast after genre switch */
  const [pendingPodcastTitle, setPendingPodcastTitle] = useState<string | null>(null);

  /* modals */
  const [activeDoc,    setActiveDoc]    = useState<TextDoc | null>(null);
  const [showLogin,    setShowLogin]    = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [pendingDoc,   setPendingDoc]   = useState<TextDoc | null>(null);
  /* refs */
  const podcastRowRef   = useRef<HTMLDivElement>(null);
  const whatsNewRowRef  = useRef<HTMLDivElement>(null);
  const materialsRowRef = useRef<HTMLDivElement>(null);
  const podcastSection  = useRef<HTMLElement>(null);
  const materialsSection = useRef<HTMLElement>(null);
  const selfHelpSection  = useRef<HTMLElement>(null);

  /* ── genres ── */
  useEffect(() => {
    let ok = true;
    api.get<Genre[]>("/genres")
      .then((r) => {
        if (!ok) return;
        const list = Array.isArray(r.data) ? r.data : [];
        setGenres(list);
        if (list.length) setSelectedGenre((p) => p ?? list[0]);
      })
      .catch(console.error);
    return () => { ok = false; };
  }, []);

  /* ── fetch all genres' content for cross-genre suggestions ── */
  useEffect(() => {
    if (!genres.length) return;
    let ok = true;
    Promise.all(
      genres.map((g) =>
        api.get<MaterialDoc[]>(`/genres/${g.id}/material`)
          .then((r) => (Array.isArray(r.data) ? r.data : []).map((d) => ({ doc: d, genre: g })))
          .catch(() => [] as { doc: MaterialDoc; genre: Genre }[])
      )
    ).then((results) => { if (ok) setAllMaterials(results.flat()); });

    Promise.all(
      genres.map((g) =>
        api.get<PodcastApi>(`/genres/${g.id}/podcasts`, { params: { language: DEFAULT_PODCAST_LANGUAGE } })
          .then((r) =>
            (Array.isArray(r.data?.podcasts) ? r.data.podcasts! : [])
              .filter((p): p is Podcast & { title: string } => Boolean(p.title))
              .map((p) => ({ podcast: p, genre: g }))
          )
          .catch(() => [] as { podcast: Podcast & { title: string }; genre: Genre }[])
      )
    ).then((results) => { if (ok) setAllPodcasts(results.flat()); });

    return () => { ok = false; };
  }, [genres]);

  /* ── scroll to pending podcast once the row loads ── */
  useEffect(() => {
    if (!pendingPodcastTitle || !podcasts) return;
    const frames = podcastRowRef.current?.querySelectorAll<HTMLIFrameElement>("iframe");
    if (!frames?.length) return;
    for (const frame of Array.from(frames)) {
      if (frame.title === pendingPodcastTitle) {
        frame.closest(".h2-podcast-card")?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        setPendingPodcastTitle(null);
        break;
      }
    }
  }, [podcasts, pendingPodcastTitle]);

  /* ── reset lang on genre change ── */
  useEffect(() => { setPodcastLang(DEFAULT_PODCAST_LANGUAGE); }, [selectedGenre?.id]);

  /* ── podcasts (genre + lang) ── */
  useEffect(() => {
    if (!selectedGenre) { setPodcasts(null); setPodcastLanguages([...INDIAN_PODCAST_LANGUAGES]); return; }
    let ok = true;
    setPodcasts(null);
    api.get<PodcastApi>(`/genres/${selectedGenre.id}/podcasts`, { params: { language: podcastLang } })
      .then((r) => {
        if (!ok) return;
        setPodcasts(Array.isArray(r.data?.podcasts) ? r.data.podcasts! : []);
        setPodcastLanguages(
          Array.isArray(r.data?.languages) && r.data.languages!.length
            ? r.data.languages!
            : [...INDIAN_PODCAST_LANGUAGES],
        );
      })
      .catch(() => { if (ok) { setPodcasts([]); setPodcastLanguages([...INDIAN_PODCAST_LANGUAGES]); } });
    return () => { ok = false; };
  }, [selectedGenre, podcastLang]);

  /* ── materials ── */
  const fetchMaterials = useCallback((genreId: string) => {
    api.get<MaterialDoc[]>(`/genres/${genreId}/material`)
      .then((r) => { setMaterialDocs(Array.isArray(r.data) ? r.data : []); })
      .catch(() => { setMaterialDocs([]); });
  }, []);

  useEffect(() => {
    if (!selectedGenre) { setMaterialDocs([]); return; }
    fetchMaterials(selectedGenre.id);
  }, [selectedGenre, fetchMaterials]);

  /* ── self-help ── */
  const fetchSelfHelp = useCallback(() => {
    api.get<SelfHelpDoc[]>("/corpus/self-help")
      .then((r) => { setSelfHelpDocs(Array.isArray(r.data) ? r.data : []); })
      .catch(() => { setSelfHelpDocs([]); });
  }, []);

  useEffect(() => {
    fetchSelfHelp();
  }, [fetchSelfHelp]);

  /* ── subscribe click — requires login first ── */
  const handleSubscribeClick = useCallback(() => {
    if (!isLoggedIn) {
      // Show login popup; after login redirect to /plans
      setPendingDoc(null);
      setShowLogin(true);
      // Store intent so onSuccess knows to redirect
      sessionStorage.setItem("post_login_redirect", "/plans");
    } else {
      navigate("/plans");
    }
  }, [isLoggedIn, navigate]);

  /* ── logout ── */
  const handleLogout = useCallback(() => {
    localStorage.removeItem("google_id_token");
    localStorage.removeItem("authUser");
    setAuthUser(null);
    refreshSubscription();
    // Re-fetch without token — backend returns locked:true for subscriber content
    if (selectedGenre) fetchMaterials(selectedGenre.id);
    fetchSelfHelp();
  }, [selectedGenre, fetchMaterials, fetchSelfHelp, refreshSubscription]);

  /* ── scroll lock ── */
  useEffect(() => {
    document.body.style.overflow = activeDoc || showLogin || showSubscribe ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [activeDoc, showLogin, showSubscribe]);

  /* ── helpers ── */
  // Use doc.locked from the backend — it is computed at fetch time based on the
  // caller's token, so it is always the correct value for the current auth state.
  const isDocLocked = (doc: { locked?: boolean }) => Boolean(doc.locked);

  const openDoc = (doc: MaterialDoc | SelfHelpDoc) => {
    if (isDocLocked(doc)) {
      if (!isLoggedIn) { setPendingDoc(doc); setShowLogin(true); return; }
      setShowSubscribe(true);
      return;
    }
    setActiveDoc(doc);
  };
  const scrollTo = useCallback((ref: RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const sectionByHash: Record<string, RefObject<HTMLElement | null>> = {
      "#podcast": podcastSection,
      "#materials": materialsSection,
      "#selfhelp": selfHelpSection,
    };
    const sectionRef = sectionByHash[location.hash];

    if (!sectionRef) return;

    window.requestAnimationFrame(() => scrollTo(sectionRef));
  }, [location.hash, scrollTo]);

  const filterDocs = <T extends { title: string; author: string }>(arr: T[]) =>
    !searchQuery
      ? arr
      : arr.filter(
          (d) =>
            d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.author.toLowerCase().includes(searchQuery.toLowerCase()),
        );

  const filteredPodcasts  = !searchQuery
    ? podcasts
    : podcasts?.filter(
        (p) => p.title?.toLowerCase().includes(searchQuery.toLowerCase()),
      ) ?? null;
  const filteredMaterials = filterDocs(materialDocs);
  const filteredSelfHelp  = filterDocs(selfHelpDocs);

  /* What's New = first 5 from same genre+lang feed */
  const whatsNewPodcasts = podcasts?.slice(0, 5) ?? null;

  /* autocomplete suggestions pool — covers all genres */
  const suggestions: Suggestion[] = [
    ...allPodcasts.map((item, i) => ({
      id: `podcast-${item.genre.id}-${i}`,
      title: item.podcast.title,
      kind: "podcast" as const,
      onSelect: () => {
        setSelectedGenre(item.genre);
        setPendingPodcastTitle(item.podcast.title);
        setTimeout(() => scrollTo(podcastSection), 100);
      },
    })),
    ...allMaterials.map((item) => ({
      id: `material-${item.genre.id}-${item.doc.id}`,
      title: item.doc.title,
      kind: "material" as const,
      onSelect: () => {
        setSelectedGenre(item.genre);
        openDoc(item.doc);
      },
    })),
    ...selfHelpDocs.map((d) => ({
      id: d.id,
      title: d.title,
      kind: "guide" as const,
      onSelect: () => openDoc(d),
    })),
  ];

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="h2-root">
      <SiteNav
        items={[
          { label: "Podcast", onClick: () => scrollTo(podcastSection) },
          { label: "Materials", onClick: () => scrollTo(materialsSection) },
          { label: "Self Help Resources", onClick: () => scrollTo(selfHelpSection) },
          { label: "About Us", href: "/about-us" },
        ]}
        cta={{ label: "Subscribe Now", onClick: handleSubscribeClick }}
        secondaryCta={
          isLoggedIn
            ? { label: "Logout", onClick: handleLogout }
            : { label: "Sign In", onClick: () => setShowLogin(true) }
        }
      />

      {/* ── HERO ── */}
      <section className="h2-hero">
        <div>
          <h1 className="h2-hero__headline">
            Curated Resource<br />Library for<br />Business Coaching
          </h1>
          <p className="h2-hero__sub">
            A single, calming space for podcasts, reading materials, and self‑help
            guides. Switch genres to change what you see instantly, while the
            self‑help toolkit stays steady.
          </p>
          <button className="h2-grad-btn h2-grad-btn--lg" onClick={() => scrollTo(podcastSection)}>
            Explore Library
          </button>
        </div>
        <div className="h2-hero__visual" aria-hidden="true">
          <img src="/hero.png" alt="" className="h2-hero__img" />
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <RotatingStatsBar />

      <main className="h2-main">

        {/* ── WHAT'S NEW ── */}
        <section className="h2-section">
          <div className="h2-section__head">
            <div className="h2-section__bar" />
            <span className="h2-section__name">What's New</span>
          </div>

          {!selectedGenre ? (
            <p className="h2-empty">Select a genre to see what's new.</p>
          ) : whatsNewPodcasts === null ? (
            <p className="h2-empty">Loading…</p>
          ) : whatsNewPodcasts.length === 0 ? (
            <p className="h2-empty">No new podcasts for this genre yet.</p>
          ) : (
            <PodcastRow rowRef={whatsNewRowRef} label="What's New">
              {whatsNewPodcasts.map((p, i) => (
                <div key={i} className="h2-podcast-card">
                  <iframe
                    className="h2-spotify-frame"
                    src={p.embed_url}
                    title={p.title || `whats-new-${i}`}
                    loading="lazy"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  />
                </div>
              ))}
            </PodcastRow>
          )}
        </section>

        {/* ── CONTROLS (category title + search/lang + genre chips) ── */}
        <div className="h2-controls-bar">
          <div className="h2-category-tools">
            <h2 className="h2-category-title">Browse By Category</h2>
            <div className="h2-search-lang-row">
              <SearchWithSuggest
                value={searchQuery}
                onChange={setSearchQuery}
                suggestions={suggestions}
              />
              <LangTabs
                languages={podcastLanguages}
                active={podcastLang}
                onChange={setPodcastLang}
              />
            </div>
          </div>

          {genres.length > 0 && (
            <div className="h2-genres">
              {genres.map((g) => (
                <button
                  key={g.id}
                  className={`h2-genre-chip${selectedGenre?.id === g.id ? " h2-genre-chip--active" : ""}`}
                  onClick={() => setSelectedGenre(g)}
                >
                  {g.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── PODCAST ── */}
        <section className="h2-section" id="podcast" ref={podcastSection}>
          <div className="h2-section__head">
            <div className="h2-section__bar" />
            <span className="h2-section__name">
              Listen and Learn{selectedGenre ? ` · ${selectedGenre.name}` : ""}
            </span>
          </div>

          {!selectedGenre ? (
            <p className="h2-empty">Select a genre to view podcasts.</p>
          ) : filteredPodcasts === null ? (
            <p className="h2-empty">Loading podcasts…</p>
          ) : filteredPodcasts.length === 0 ? (
            <p className="h2-empty">
              {searchQuery ? "No podcasts match your search." : `No podcasts found in ${podcastLang} for this genre.`}
            </p>
          ) : (
            <PodcastRow rowRef={podcastRowRef} label="Podcasts">
              {filteredPodcasts.map((p, i) => (
                <div key={i} className="h2-podcast-card">
                  <iframe
                    className="h2-spotify-frame"
                    src={p.embed_url}
                    title={p.title || `podcast-${i}`}
                    loading="lazy"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  />
                </div>
              ))}
            </PodcastRow>
          )}
        </section>

        {/* ── MATERIALS ── */}
        <section className="h2-section" id="materials" ref={materialsSection}>
          <div className="h2-section__head">
            <div className="h2-section__bar" />
            <span className="h2-section__name">
              Expert Guide{selectedGenre ? ` · ${selectedGenre.name}` : ""}
            </span>
          </div>

          {filteredMaterials.length === 0 ? (
            <p className="h2-empty">
              {searchQuery ? "No materials match your search." : "No materials found for this genre."}
            </p>
          ) : (
            <PodcastRow rowRef={materialsRowRef} label="Materials">
              {filteredMaterials.map((doc) => (
                <MaterialCard key={doc.id} doc={doc} onOpen={openDoc} locked={isDocLocked(doc)} />
              ))}
            </PodcastRow>
          )}
        </section>

        {/* ── SELF HELP GUIDE ── */}
        <section className="h2-section" id="selfhelp" ref={selfHelpSection}>
          <div className="h2-section__head">
            <div className="h2-section__bar" />
            <span className="h2-section__name">Exclusive Content</span>
          </div>

          {filteredSelfHelp.length === 0 ? (
            <p className="h2-empty">
              {searchQuery ? "No guides match your search." : "No self-help guides available."}
            </p>
          ) : (
            <div className="h2-selfhelp-grid">
              {/* Show all cards for paid subscribers, or 10 cards + CTA for non-subscribers (4+2+4 layout) */}
              {isPaidSubscriber ? (
                filteredSelfHelp.map((doc) => (
                  <GuideCard key={doc.id} doc={doc} onOpen={openDoc} locked={isDocLocked(doc)} />
                ))
              ) : (
                <>
                  {/* 10 cards total: row 1 (4) + row 2 (2) + row 3 (4) */}
                  {filteredSelfHelp.slice(0, 10).map((doc) => (
                    <GuideCard key={doc.id} doc={doc} onOpen={openDoc} locked={isDocLocked(doc)} />
                  ))}
                  {/* Subscribe CTA — spans columns 7-12 (right half), rows 2-3 */}
                  <div className="h2-subscribe-card h2-subscribe-card--selfhelp">
                    <h2 className="h2-subscribe-card__text">
                      Subscribe Now to Access All Our Content
                    </h2>
                    <button
                      className="h2-grad-btn h2-grad-btn--lg h2-subscribe-card__btn"
                      onClick={() => navigate("/plans")}
                    >
                      Get Access
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

      </main>

      {/* ── FOOTER ── */}
      <Footer />

      {/* ── MODALS ── */}
      {activeDoc && <DocModal doc={activeDoc} onClose={() => setActiveDoc(null)} />}
      {showLogin && (
        <LoginPopup
          onSuccess={() => {
            setShowLogin(false);
            // Sync reactive auth state
            setAuthUser(JSON.parse(localStorage.getItem("authUser") || "null"));
            refreshSubscription();
            // Re-fetch with the new token — backend returns locked:false for subscriber content
            if (selectedGenre) fetchMaterials(selectedGenre.id);
            fetchSelfHelp();
            // Handle post-login redirect (e.g. from "Subscribe Now" click)
            const redirect = sessionStorage.getItem("post_login_redirect");
            if (redirect) {
              sessionStorage.removeItem("post_login_redirect");
              navigate(redirect);
              return;
            }
            if (pendingDoc) { setActiveDoc(pendingDoc); setPendingDoc(null); }
          }}
          onClose={() => {
            setShowLogin(false);
            setPendingDoc(null);
            sessionStorage.removeItem("post_login_redirect");
          }}
        />
      )}
      {showSubscribe && (
        <SubscribePopup onClose={() => setShowSubscribe(false)} />
      )}
    </div>
  );
}

/* ============================================================
   SubscribePopup — shown to logged-in non-subscribers
   ============================================================ */
function SubscribePopup({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1a2330", color: "#fff", padding: "2rem 2.25rem",
          borderRadius: 12, maxWidth: 420, width: "90%", textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔒</div>
        <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>
          Subscriber-only content
        </h3>
        <p style={{ margin: "0.9rem 0 1.6rem", lineHeight: 1.6, opacity: 0.85 }}>
          This material is available to subscribers. Unlock everything —
          premium materials and all self-help guides — for just ₹99/month.
        </p>
        <button
          className="h2-grad-btn h2-grad-btn--lg"
          style={{ width: "100%", marginBottom: "0.75rem" }}
          onClick={() => { onClose(); navigate("/plans"); }}
        >
          View plans
        </button>
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.5)",
            cursor: "pointer", fontSize: "0.9rem", textDecoration: "underline",
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   MaterialCard
   ============================================================ */
function MaterialCard({
  doc, onOpen, locked,
}: { doc: MaterialDoc; onOpen: (d: MaterialDoc) => void; locked: boolean }) {
  const [imgErr, setImgErr] = useState(false);
  const src = !imgErr && doc.thumbnailUrl ? doc.thumbnailUrl : THUMB_PLACEHOLDER;

  return (
    <div
      className={`h2-material-card${locked ? " h2-material-card--locked" : ""}`}
      onClick={() => onOpen(doc)}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen(doc)}
      aria-label={doc.title}
      title={locked ? "Subscribe to unlock" : undefined}
    >
      <div className="h2-material-card__thumb">
        <img src={src} alt="" onError={() => setImgErr(true)} />
        {locked && (
          <div className="h2-material-card__lock" aria-label="Subscribe to unlock">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>
      <div className="h2-material-card__body">
        <div className="h2-material-card__title">{doc.title}</div>
        <div className="h2-material-card__author">{doc.author}</div>
        {!locked && doc.preview && <p className="h2-material-card__desc">{doc.preview}</p>}
        <button
          className="h2-material-card__btn"
          onClick={(e) => { e.stopPropagation(); onOpen(doc); }}
        >
          {locked ? "Subscribe to unlock" : "Read More"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   GuideCard
   ============================================================ */
function GuideCard({
  doc, onOpen, locked,
}: { doc: SelfHelpDoc; onOpen: (d: SelfHelpDoc) => void; locked: boolean }) {
  const [imgErr, setImgErr] = useState(false);
  const src = !imgErr && doc.thumbnailUrl ? doc.thumbnailUrl : THUMB_PLACEHOLDER;

  return (
    <div
      className={`h2-guide-card${locked ? " h2-guide-card--locked" : ""}`}
      onClick={() => onOpen(doc)}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen(doc)}
      aria-label={doc.title}
      title={locked ? "Subscribe to unlock" : undefined}
    >
      <div className="h2-guide-card__thumb">
        <img src={src} alt="" onError={() => setImgErr(true)} />
        {locked && (
          <div className="h2-guide-card__lock" aria-label="Subscribe to unlock">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>
      <div className="h2-guide-card__body">
        <div className="h2-guide-card__title">{doc.title}</div>
        <div className="h2-guide-card__author">{doc.author}</div>
        {!locked && doc.preview && <p className="h2-guide-card__desc">{doc.preview}</p>}
        <button
          className="h2-guide-card__btn"
          onClick={(e) => { e.stopPropagation(); onOpen(doc); }}
        >
          {locked ? "Subscribe to unlock" : "Read More"}
        </button>
      </div>
    </div>
  );
}
