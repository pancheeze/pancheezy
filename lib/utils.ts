export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function scrollToSection(id: string) {
  const el = document.querySelector(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

let monoFontCache: string | null = null;

// CSS font-family for the monospace font (Source Code Pro via next/font), for canvas
// text. next/font renames the family, so it is read from the --font-mono variable.
export function monoFont(): string {
  if (monoFontCache) return monoFontCache;
  const family =
    typeof document === "undefined"
      ? ""
      : getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim();
  monoFontCache = family ? `${family}, ui-monospace, monospace` : "ui-monospace, monospace";
  return monoFontCache;
}

export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: EASE },
  }),
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.8, delay, ease: EASE },
  }),
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, delay, ease: EASE },
  }),
};

export const staggerContainer = (stagger = 0.12, delayChildren = 0) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});
