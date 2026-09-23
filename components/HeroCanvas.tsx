"use client";

import { useEffect, useRef } from "react";
import { startScene, type SceneConfig, type SceneEnv } from "@/components/heroScene";

// Frame-space configs: W×H is the design artboard box the hero figure is laid out in
// ([data-hero-frame]); the component scales them onto the real, full-screen canvas.
type FrameConfig = Omit<SceneConfig, "contact">;
const DESKTOP: FrameConfig = { W: 1000, H: 900, S: 1.1, ox: 80, oy: 60, step: 5, rs: 1, R: 160, wind: 1, flakes: 70, minDark: 2.1 };
const MOBILE: FrameConfig = { W: 390, H: 470, S: 0.62, ox: 4, oy: 36, step: 6, rs: 0.8, R: 100, wind: 0.6, flakes: 36, minDark: 2.2 };

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const ramp = (v: number, a: number, b: number) => clamp((v - a) / (b - a), 0, 1);
const smooth = (x: number) => x * x * (3 - 2 * x);
// a section's top, in page px
const pageTop = (id: string) => {
  const el = document.getElementById(id);
  return el ? el.getBoundingClientRect().top + window.scrollY : Infinity;
};

// The moon-and-samurai background: fixed behind the whole home page.
//  hero → first scroll plays the cut; leaving the hero the samurai blows away as dust and the
//  moon wanes to a crescent (done before #about arrives); it drifts with a slow parallax; at
//  #work it passes through new moon to a blood moon; at #contacts it shrinks, far and bright,
//  and the dust gathers into a second samurai facing it.
const HeroCanvas = ({ className }: { className?: string }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const hero = cv?.parentElement;
    const frame = hero?.querySelector<HTMLElement>("[data-hero-frame]");
    if (!cv || !hero || !frame) return;
    // Same breakpoint as Tailwind's `xl`, where the hero switches layout.
    const mq = window.matchMedia("(min-width: 1280px)");

    // theme colours, re-read when the header's toggle flips the class on <html>
    let colors = { ink: "#ededed", tint: "#e8e4dc", blood: "#c4453f" };
    const readTheme = () => {
      const cs = getComputedStyle(document.documentElement);
      const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
      colors = { ink: v("--foreground", colors.ink), tint: v("--moon", colors.tint), blood: v("--accent", colors.blood) };
    };
    readTheme();
    const themeObs = new MutationObserver(readTheme);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // moon path, set per layout in build(): parallax rate, hero moon centre, contact moon
    let path = { par: 0.05, hm: { x: 0, y: 0 }, cm: { x: 0, y: 0, s: 1 } };
    const vh = () => cv.clientHeight;
    // a section's arrival: from its top entering the screen to its top 30% down
    const arrival = (id: string) => {
      const t = pageTop(id);
      return ramp(window.scrollY, t - vh(), t - vh() * 0.3);
    };
    const env: SceneEnv = {
      colors: () => colors,
      out: () => window.scrollY > 1,
      leave: () => {
        const a = hero.offsetHeight * 0.28;
        return ramp(window.scrollY, a, Math.max(a + 200, pageTop("about") - vh() - 20));
      },
      eclipse: () => arrival("work"),
      arrive: () => arrival("contacts"),
      moon: () => {
        const par = Math.max(0, window.scrollY - (pageTop("about") - vh())) * path.par;
        const a = smooth(arrival("contacts")), dx = -par * 0.35, dy = -par;
        const { hm, cm } = path;
        return { dx: dx + (cm.x - hm.x - dx) * a, dy: dy + (cm.y - hm.y - dy) * a, s: 1 + (cm.s - 1) * a };
      },
    };

    // Stacked (mobile/tablet) layout: the hero text scrolls up over the samurai, so the
    // background dims a little once scrolling starts, and returns as the samurai turns to dust.
    const dim = () => {
      const d = mq.matches ? 0 : ramp(window.scrollY, 0, 160) * (1 - env.leave());
      cv.style.opacity = d ? String(1 - 0.45 * d) : "";
    };
    dim();
    window.addEventListener("scroll", dim, { passive: true });
    mq.addEventListener("change", dim);

    let scene: ReturnType<typeof startScene> | null = null, built = "", timer = 0;
    const build = () => {
      const c = cv.getBoundingClientRect(), f = frame.getBoundingClientRect(), h = hero.getBoundingClientRect();
      if (!c.width || !c.height || !f.width) return;
      const desk = mq.matches, W = c.width, H = c.height;
      const key = `${W}|${H}|${f.width}|${desk}`;
      if (scene && key === built) return;
      const base = desk ? DESKTOP : MOBILE, fs = f.width / base.W, S = base.S * fs;
      // the canvas is fixed at the top of the screen; the hero is at the top of the page
      const ox = f.left - c.left + base.ox * fs, oy = f.top - h.top + base.oy * fs;
      // contact scene, from the design boards (1440×900, 390×844): a small moon up-right and a
      // smaller samurai below it, facing it
      const cS = (desk ? 0.6 : 0.3) * fs;
      const contact = desk
        ? { ox: W - 436 * fs, oy: H - 100 * fs - 692 * cS, S: cS }
        : { ox: W - 143 * fs, oy: H - 84 * fs - 692 * cS, S: cS };
      path = {
        par: desk ? 0.05 : 0.03,
        hm: { x: ox + 330 * S, y: oy + 300 * S },
        cm: desk ? { x: W - 140 * fs, y: 230 * fs, s: 0.32 } : { x: W - 60 * fs, y: 150 * fs, s: 0.24 },
      };
      scene?.stop();
      scene = startScene(cv, {
        ...base,
        W,
        H,
        ox,
        oy,
        S,
        rs: base.rs * fs,
        R: base.R * fs,
        minDark: base.minDark * fs,
        flakes: Math.round((base.flakes * W) / f.width), // same leaf density, wider area
        contact,
      }, !built, env);
      built = key;
    };
    build();
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = window.setTimeout(build, 150);
    });
    ro.observe(cv);
    ro.observe(frame);
    return () => {
      window.removeEventListener("scroll", dim);
      mq.removeEventListener("change", dim);
      clearTimeout(timer);
      ro.disconnect();
      themeObs.disconnect();
      scene?.stop();
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
};

export default HeroCanvas;
