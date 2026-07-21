// motion layer (motion.dev, mini build) - scroll reveals, palette pop, widget stagger
// every effect is gated by motionOK(); reduced motion attaches nothing.
// initial hidden states are set HERE in JS, never in CSS - no-JS visitors see everything.
// motion/mini ships only animate(); the in-view trigger is a plain IntersectionObserver,
// keeping the bundle small while the animations themselves run on motion's WAAPI engine.

import { animate } from "motion/mini";
import { motionOK, $$ } from "./state";

const springy = "cubic-bezier(.30,1.28,.52,1)"; // back-out ≈ light spring
const REVEAL = ".sec-head, .sec-sub, .card, .dossier, .channel, .manifest, .clock-story, .record-shelf, .film-frame, .movement-note, .langs"; // .step has its own timeline observer

export function initMotion(): void {
  if (!motionOK() || !("IntersectionObserver" in window)) return;
  const els = $$(REVEAL);
  for (const el of els) {
    // Keep content visibly present before intersection. This prevents direct
    // hash navigation, print capture, and slow devices from showing blank bands.
    el.style.opacity = ".88";
    el.style.transform = "translateY(9px)";
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        animate(
          e.target as HTMLElement,
          { opacity: 1, transform: "translateY(0px)" },
          { duration: 0.44, easing: springy }
        );
      }
    },
    { rootMargin: "0px 0px -4% 0px" }
  );
  els.forEach((el) => io.observe(el));
}

// springy pop for the palette dialog on open
export function springIn(el: HTMLElement): void {
  if (!motionOK()) return;
  animate(
    el,
    { opacity: [0, 1], transform: ["scale(.97) translateY(6px)", "scale(1) translateY(0px)"] },
    { duration: 0.28, easing: springy }
  );
}

// stagger freshly rendered widget content in
export function staggerIn(container: ParentNode): void {
  if (!motionOK()) return;
  const items = Array.from(container.querySelectorAll<HTMLElement>("li, .lw-title, .big"));
  items.forEach((item, i) => {
    animate(
      item,
      { opacity: [0, 1], transform: ["translateY(7px)", "translateY(0px)"] },
      { duration: 0.32, delay: i * 0.05, easing: "ease-out" }
    );
  });
}

export function initDetailsMotion(): void {
  if (!motionOK()) return;
  const details = $$<HTMLDetailsElement>("details.step-more");
  for (const item of details) {
    item.addEventListener("toggle", () => {
      if (!item.open || !motionOK()) return;
      const facts = item.querySelector<HTMLElement>(".step-facts");
      if (!facts) return;
      staggerIn(facts);
    });
  }
}
