// Live local hands for the KooKoo story, aligned over the hand-free product image.
// Plus an opt-in hourly birdsong chime: on each full hour the matching Singvögel bird sings,
// exactly like the real KooKoo clock. Twelve German songbirds, one per hour (1..12 → Pirol at 12).

const pad = (value: number) => String(value).padStart(2, "0");

// hour (1..12) → bird, sequential to the KooKoo Singvögel numbering
const BIRDS = [
  "Amsel", "Singdrossel", "Mönchsgrasmücke", "Gartengrasmücke", "Rotkehlchen", "Nachtigall",
  "Blaukehlchen", "Gartenrotschwanz", "Halsbandschnäpper", "Fitis", "Heidelerche", "Pirol",
];
const birdFor = (h: number) => BIRDS[((h % 12) || 12) - 1];
const chimeSrc = (h: number) => `assets/birdsong/${pad((h % 12) || 12)}.mp3`;

export function initKookooClock(): void {
  const dial = document.querySelector<HTMLElement>("[data-kookoo-clock]");
  const hour = document.querySelector<HTMLElement>("[data-kookoo-hour]");
  const minute = document.querySelector<HTMLElement>("[data-kookoo-minute]");
  const second = document.querySelector<HTMLElement>("[data-kookoo-second]");
  const link = dial?.closest<HTMLAnchorElement>(".clock-product");
  if (!dial || !hour || !minute || !second) return;

  const update = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    hour.style.transform = `rotate(${(h % 12) * 30 + m * .5}deg)`;
    minute.style.transform = `rotate(${m * 6 + s * .1}deg)`;
    second.style.transform = `rotate(${s * 6}deg)`;
    link?.setAttribute("aria-label", `KooKoo Singvögel clock showing ${pad(h)}:${pad(m)} local time - open the KooKoo website`);
  };

  update();

  // ---- opt-in hourly birdsong ----
  const btn = document.querySelector<HTMLButtonElement>("[data-kookoo-chime]");
  const label = document.querySelector<HTMLElement>("[data-kookoo-chime-label]");
  const hint = document.querySelector<HTMLElement>("[data-kookoo-chime-hint]");

  let armed = false;
  let lastHour = new Date().getHours();
  let audio: HTMLAudioElement | null = null;

  const play = (h: number) => {
    if (!armed) return;
    if (!audio) audio = new Audio();
    audio.src = chimeSrc(h);
    audio.currentTime = 0;
    audio.play().catch(() => { /* browser declined; stays silent */ });
  };

  const setHint = () => {
    if (!hint) return;
    hint.textContent = armed
      ? `on — you'll hear the ${birdFor(lastHour)} at ${pad((lastHour % 12) || 12)}:00, then a new bird every hour`
      : "each full hour sings its own bird - off until you turn it on";
  };

  const setArmed = (state: boolean) => {
    armed = state;
    btn?.classList.toggle("on", armed);
    btn?.setAttribute("aria-pressed", String(armed));
    if (label) label.textContent = armed ? "hourly birdsong is on" : "arm the hourly birdsong";
    setHint();
  };

  if (btn && label && hint) {
    btn.hidden = false;
    hint.hidden = false;
    setHint();
    btn.addEventListener("click", () => {
      setArmed(!armed);
      if (armed) play(new Date().getHours()); // the arming gesture unlocks + previews this hour's bird
      else audio?.pause();
    });
  }

  const tick = () => {
    update();
    const h = new Date().getHours();
    if (h !== lastHour) {
      lastHour = h;
      setHint();
      play(h);
    }
  };

  const timer = window.setInterval(tick, 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tick();
  });
  window.addEventListener("pagehide", () => clearInterval(timer), { once: true });
}
