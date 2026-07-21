// Live local hands for the KooKoo story, aligned over the hand-free product image.

const pad = (value: number) => String(value).padStart(2, "0");

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
  const timer = window.setInterval(update, 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) update();
  });
  window.addEventListener("pagehide", () => clearInterval(timer), { once: true });
}
