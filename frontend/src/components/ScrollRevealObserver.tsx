import { useEffect } from "react";

/**
 * Global Scroll Reveal Observer for Amma Seva
 * Automatically observes sections, cards, grids, and content elements.
 * Triggers smooth, hardware-accelerated fluid transitions as elements
 * scroll into and out of view bidirectionally (scrolling UP and DOWN).
 */
export function ScrollRevealObserver() {
  useEffect(() => {
    // Enable CSS scroll animation class only when JS is active
    document.documentElement.classList.add("js-scroll-anim");

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        const target = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          target.classList.add("scroll-in-view");
        } else {
          // If element has scrolled completely away from view, reset it
          // so it smoothly re-animates when scrolling back (up or down)
          const rect = target.getBoundingClientRect();
          const windowHeight = window.innerHeight || document.documentElement.clientHeight;
          if (rect.top > windowHeight + 60 || rect.bottom < -60) {
            target.classList.remove("scroll-in-view");
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "0px 0px -40px 0px",
      threshold: [0, 0.12, 0.25],
    });

    const observeTargets = () => {
      // Elements to animate on scroll
      const selector = [
        ".scroll-reveal",
        ".scroll-reveal-card",
        ".premium-card",
        ".luxury-card",
        ".dark-luxury-card",
        ".seva-paper-card",
        "section > div > .grid > div",
        "section > div > div > h2",
        "section > div > div > .service-card",
        "section > div > div > .feature-card",
        ".animate-on-scroll"
      ].join(", ");

      const elements = document.querySelectorAll<HTMLElement>(selector);

      elements.forEach((el) => {
        // Exclude elements that shouldn't animate (e.g. modals, floating buttons, header)
        if (
          el.closest("header") || 
          el.closest(".fixed") || 
          el.classList.contains("no-scroll-reveal") ||
          el.hasAttribute("data-no-scroll-reveal")
        ) {
          return;
        }

        // If element is already in the initial viewport upon mount, reveal immediately
        const rect = el.getBoundingClientRect();
        const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
        if (inViewport) {
          el.classList.add("scroll-in-view");
        }

        observer.observe(el);
      });
    };

    // Initial observation
    observeTargets();

    // Observe dynamically mounted elements (route transitions, loaded services, etc.)
    const mutationObserver = new MutationObserver(() => {
      observeTargets();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}
