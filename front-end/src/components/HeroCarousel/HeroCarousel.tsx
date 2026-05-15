import { useState, useEffect, useCallback, type JSX } from "react";
import { api } from "../../api/client";
import "./heroCarousel.css";

type Banner = { id: string; image_url: string; order: number };

type Props = {
  fallback: JSX.Element;
};

/** True when the viewport is narrower than the tablet breakpoint (≤768 px). */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 768px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

export default function HeroCarousel({ fallback }: Props): JSX.Element {
  const isMobile = useIsMobile();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let ok = true;
    // Reset while switching between desktop ↔ mobile
    setLoaded(false);
    setBanners([]);
    setCurrent(0);

    const endpoint = isMobile ? "/carousel-mobile" : "/carousel";

    api
      .get<Banner[]>(endpoint)
      .then((r) => {
        if (!ok) return;
        const list = Array.isArray(r.data) ? r.data : [];
        list.sort((a, b) => a.order - b.order);
        setBanners(list);
        setLoaded(true);
      })
      .catch(() => {
        if (ok) setLoaded(true);
      });

    return () => {
      ok = false;
    };
  }, [isMobile]);

  /* auto-rotate every 3 seconds */
  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(id);
  }, [banners.length]);

  const goTo = useCallback((idx: number) => setCurrent(idx), []);

  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + banners.length) % banners.length),
    [banners.length],
  );

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % banners.length),
    [banners.length],
  );

  if (!loaded) return fallback;
  // If no banners for this platform, fall back to the hero section
  if (banners.length === 0) return fallback;

  return (
    <div className="hero-carousel">
      <div className="hero-carousel__track">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={`hero-carousel__slide${i === current ? " hero-carousel__slide--active" : ""}`}
          >
            <img src={banner.image_url} alt={`Banner ${i + 1}`} />
          </div>
        ))}
      </div>

      {/* arrows */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            className="hero-carousel__arrow hero-carousel__arrow--left"
            onClick={prev}
            aria-label="Previous banner"
          >
            &#8249;
          </button>
          <button
            type="button"
            className="hero-carousel__arrow hero-carousel__arrow--right"
            onClick={next}
            aria-label="Next banner"
          >
            &#8250;
          </button>
        </>
      )}

      {/* dots */}
      {banners.length > 1 && (
        <div className="hero-carousel__dots">
          {banners.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              className={`hero-carousel__dot${i === current ? " hero-carousel__dot--active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Go to banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
