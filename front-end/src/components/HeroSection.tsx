import type { JSX } from "react";
import "./HeroSection.css";

type Props = {
  onExplore?: () => void;
};

export default function HeroSection({ onExplore }: Props): JSX.Element {
  return (
    <section className="hero">
      <div className="hero-inner">
        {/* Left: text + CTA */}
        <div className="hero-left">
          <h1 className="hero-heading">
            Curated Resource Library for Business Coaching
          </h1>
          <p className="hero-sub">
            A single, calming space for podcasts, reading materials, and
            self-help guides. Switch genres to change what you see instantly,
            while the self-help toolkit stays steady.
          </p>
          <button className="btn-gradient hero-cta" onClick={onExplore}>
            Explore Library
          </button>
        </div>

        {/* Right: decorative image */}
        <div className="hero-right">
          <div className="hero-img-wrap">
            <img
              src="/hero-image.png"
              alt="Coaching library"
              className="hero-img"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            {/* fallback gradient orb when image is missing */}
            <div className="hero-orb" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
