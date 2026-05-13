import { useEffect } from "react";

/**
 * GrowthX-style scroll reveal.
 *
 * - Uses IntersectionObserver with rootMargin so elements start animating
 *   the moment they peek into the viewport (not halfway through).
 * - MutationObserver picks up dynamically added elements (cards after API calls).
 * - Each element fires once then is unobserved — no jank on re-scroll.
 */
export function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.reveal = "visible";
            io.unobserve(entry.target);
          }
        });
      },
      {
        // Trigger as soon as 6% of the element is visible — feels instant
        threshold: 0.06,
        // Start detecting 60px before the element hits the viewport bottom
        rootMargin: "0px 0px -60px 0px",
      }
    );

    // Observe all current [data-reveal] elements that aren't already visible
    const observeAll = () => {
      document
        .querySelectorAll<HTMLElement>("[data-reveal]:not([data-reveal='visible'])")
        .forEach((el) => io.observe(el));
    };

    observeAll();

    // Watch for dynamically mounted elements (cards after API response)
    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const el = node as HTMLElement;
          // The element itself
          if ("reveal" in (el.dataset ?? {}) && el.dataset.reveal !== "visible") {
            io.observe(el);
          }
          // Any reveal children inside it
          el.querySelectorAll<HTMLElement>("[data-reveal]:not([data-reveal='visible'])").forEach(
            (child) => io.observe(child)
          );
        });
      });
    });

    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []); // run once on mount — MutationObserver handles the rest
}
