import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  showScrollHint?: boolean;
};

export default function HorizontalRow({
  title,
  children,
  showScrollHint = false,
}: Props) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;

    const maxScrollLeft = row.scrollWidth - row.clientWidth;
    const hasOverflow = maxScrollLeft > 2;

    setHasOverflow(hasOverflow);
    setCanScrollLeft(hasOverflow && row.scrollLeft > 2);
    setCanScrollRight(hasOverflow && row.scrollLeft < maxScrollLeft - 2);
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    updateScrollState();

    const handleScroll = () => updateScrollState();
    const handleResize = () => updateScrollState();

    row.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      row.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [children, updateScrollState]);

  const scrollByStep = (direction: "left" | "right") => {
    const row = rowRef.current;
    if (!row) return;

    const step = Math.max(row.clientWidth * 0.82, 280);
    const delta = direction === "left" ? -step : step;
    row.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section className="row-section">
      <h2 className="row-title">{title}</h2>

      <div ref={rowRef} className="row-scroll" role="region" aria-label={title}>
        {children}
      </div>

      <div className="row-nav">
        {showScrollHint && hasOverflow && (
          <p className="row-scroll-hint" aria-live="polite">
            Scroll sideways for more
          </p>
        )}
        <button
          type="button"
          className="row-nav-btn"
          aria-label={`Scroll ${title} left`}
          onClick={() => scrollByStep("left")}
          disabled={!canScrollLeft}
        >
          ←
        </button>
        <button
          type="button"
          className="row-nav-btn"
          aria-label={`Scroll ${title} right`}
          onClick={() => scrollByStep("right")}
          disabled={!canScrollRight}
        >
          →
        </button>
      </div>
    </section>
  );
}
