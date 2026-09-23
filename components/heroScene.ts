// Dot-particle samurai against a moon (design "V3 · Moon & stance"). Framework-free: the
// site drives it from HeroCanvas, and the design canvas boards embed a transpiled copy.
//  - rest: iai stance, sword sheathed
//  - env.out() true plays the whole draw and one rising cut (PLAY_IN); false plays it back (PLAY_OUT)
//  - env.leave() 0→1 (scrolling past the hero): the samurai blows away as dust and the moon
//    wanes to a crescent that stays behind the rest of the page
//  - env.eclipse() 0→1 (reaching the next section): the crescent wanes on to a new moon and
//    the shadow passes off the other side, leaving a full blood moon
//  - env.moon() moves and scales the moon (parallax drift; small and far in the contact scene)
//  - env.arrive() 0→1 (contact): the dust gathers into a second samurai, sword sheathed, only
//    the wind moving him, facing a small moon whose light streams out toward the viewer
//  - dots near the pointer dissolve into drifting ash and reform when it moves away

export type SceneConfig = {
  W: number; // canvas size, CSS px
  H: number;
  S: number; // figure scale
  ox: number; // figure offset
  oy: number;
  step: number; // sampling step of the silhouette masks
  rs: number; // dot radius scale
  R: number; // pointer dissolve radius
  wind: number;
  flakes: number;
  minDark: number; // min dot radius of the silhouette against the moon
  contact: { ox: number; oy: number; S: number }; // figure placement in the contact scene
};

export type SceneEnv = {
  colors: () => { ink: string; tint: string; blood: string }; // dots off the moon; moon; blood moon (hex)
  out: () => boolean; // play the cut forward (true) or back (false)
  leave: () => number; // 0 = on the hero … 1 = past it: dust + crescent
  eclipse: () => number; // 0 = crescent … 1 = through new moon to a full blood moon
  moon: () => { dx: number; dy: number; s: number }; // moon offset (px) and scale: parallax, contact
  arrive: () => number; // 0 … 1 = contact scene: a second samurai gathers from the dust, facing the moon
};

// The silhouette is always dark, in both themes.
const SHADOW = "#0a0a0a";

// Sword geometry, in figure-mask space (the figure faces right).
const DEG = Math.PI / 180;
const SAYA_ANG = 166; // scabbard direction, mouth → tail (back and slightly down)
const SAYA: [number, number] = [Math.cos(SAYA_ANG * DEG), Math.sin(SAYA_ANG * DEG)];
const MOUTH: [number, number] = [360, 408]; // scabbard mouth, at the front of the obi
const DRAW = 110; // how far the hand pulls the sword forward before the cut
const DRAWN: [number, number] = [MOUTH[0] - SAYA[0] * (8 + DRAW), MOUTH[1] - SAYA[1] * (8 + DRAW)];
const CTRL: [number, number] = [500, 285]; // bezier control of the hand's path through the cut
const FINISH: [number, number] = [480, 285]; // sword hand at the end, arm extended forward
const SWEEP = -196; // blade rotation through the cut: back-down → under → forward and up (-30°)
const STEP = 36; // front foot steps forward into the lunge
// The figure stands left of the moon's centre so the finished cut lies across the moon.
const FIG_X = -140;
const PLAY_IN = 0.9; // seconds for the whole draw-and-cut once triggered
const PLAY_OUT = 1.6; // seconds to play it back in reverse
// Crescent: the shadow disc sits up-left of the moon, so the lit sliver faces down-right.
const SHADE: [number, number] = [-0.97, -0.24];

type Dot = { k: number; bx: number; by: number; w: number; u: number; n: number; dx: number; dy: number; x: number; y: number; vx: number; vy: number; ph: number; r: number; a: number; dz: number; e: number; th: number };
type Flake = { x: number; y: number; vx: number; vy: number; s: number; rot: number; vr: number; ph: number };
type Cloud = { x: number; y: number; len: number; v: number; dots: [number, number, number][] };

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const seg = (v: number, a: number, b: number) => clamp((v - a) / (b - a), 0, 1);
const smooth = (x: number) => x * x * (3 - 2 * x);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

function prng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexRgb(h: string) {
  h = h.replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function mixRgb(a: string, b: string, t: number) {
  const pa = hexRgb(a).split(",").map(Number), pb = hexRgb(b).split(",").map(Number);
  return pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",");
}

function noise(x: number, y: number) {
  return (Math.sin(x * 0.021 + 1.3) * Math.cos(y * 0.017) + Math.sin((x + y) * 0.013 + 2) * 0.6 + Math.sin(x * 0.05 - y * 0.04) * 0.3) / 1.9;
}

// cfg is in canvas CSS px; intro = dots fly in (first build) vs. start in place (rebuild on resize)
export function startScene(cv: HTMLCanvasElement, cfg: SceneConfig, intro: boolean, env: SceneEnv) {
  const { W, H, S, ox, oy, rs } = cfg;
  // cap the backing store (~8 MP) so a fixed full-screen canvas stays cheap on big HiDPI screens
  const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(8e6 / (W * H)));
  cv.width = W * dpr;
  cv.height = H * dpr;
  const ctx = cv.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const rnd = prng(31);

  // ---------- silhouette masks ----------
  const MW = 600, MH = 720;
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = MW;
    c.height = MH;
    const m = c.getContext("2d", { willReadFrequently: true })!;
    m.fillStyle = "#fff";
    m.strokeStyle = "#fff";
    m.lineCap = "round";
    m.lineJoin = "round";
    return m;
  };
  let g = mk();
  const cut = (fn: () => void) => { g.globalCompositeOperation = "destination-out"; fn(); g.globalCompositeOperation = "source-over"; };
  const line = (x1: number, y1: number, x2: number, y2: number) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };

  // body (armour, hakama, hat), facing right
  g.beginPath(); g.moveTo(262, 205); g.lineTo(350, 200); g.quadraticCurveTo(392, 212, 392, 260); g.lineTo(384, 402); g.lineTo(246, 404); g.quadraticCurveTo(228, 300, 240, 240); g.closePath(); g.fill();
  cut(() => { g.lineWidth = 3; [292, 318, 344, 370].forEach((y) => line(248, y, 386, y - 4)); });
  const sodeB = () => { g.beginPath(); g.moveTo(208, 214); g.lineTo(282, 202); g.lineTo(292, 302); g.lineTo(202, 314); g.closePath(); };
  cut(() => { g.lineWidth = 8; sodeB(); g.stroke(); }); sodeB(); g.fill();
  cut(() => { g.lineWidth = 3; line(204, 240, 286, 228); line(204, 264, 288, 253); line(204, 288, 290, 278); });
  const sodeF = () => { g.beginPath(); g.moveTo(350, 206); g.lineTo(406, 212); g.lineTo(412, 288); g.lineTo(356, 282); g.closePath(); };
  cut(() => { g.lineWidth = 7; sodeF(); g.stroke(); }); sodeF(); g.fill();
  cut(() => { g.lineWidth = 3; line(352, 232, 408, 236); line(354, 256, 410, 262); });
  cut(() => { g.lineWidth = 6; line(236, 406, 392, 404); });
  g.beginPath(); g.moveTo(246, 410); g.lineTo(384, 408); g.quadraticCurveTo(420, 520, 452, 692); g.lineTo(332, 692); g.lineTo(312, 540); g.lineTo(284, 692); g.lineTo(150, 692); g.quadraticCurveTo(200, 520, 246, 410); g.closePath(); g.fill();
  cut(() => { g.lineWidth = 2.5; line(270, 432, 222, 690); line(360, 432, 402, 690); });
  // scabbard in the obi, with a gap cut around it
  const tail = [MOUTH[0] + SAYA[0] * 290, MOUTH[1] + SAYA[1] * 290];
  cut(() => { g.lineWidth = 18; line(MOUTH[0], MOUTH[1], tail[0], tail[1]); });
  g.lineWidth = 11; line(MOUTH[0], MOUTH[1], tail[0], tail[1]);
  g.beginPath(); g.ellipse(326, 192, 24, 24, 0, 0, Math.PI * 2); g.fill();
  const hat = () => { g.beginPath(); g.moveTo(318, 102); g.lineTo(452, 170); g.quadraticCurveTo(330, 190, 192, 152); g.closePath(); };
  cut(() => { g.lineWidth = 9; hat(); g.stroke(); }); hat(); g.fill();
  cut(() => { g.lineWidth = 2; for (let i = 0; i < 7; i++) line(318, 114, 204 + i * 40, 158 + i * 2.6); });
  const bodyD = g.getImageData(0, 0, MW, MH).data;

  // flowing cloth + hair (moves with the wind)
  g = mk();
  g.beginPath(); g.moveTo(250, 412); g.bezierCurveTo(200, 440, 140, 470, 58, 520); g.bezierCurveTo(92, 540, 118, 562, 70, 612); g.bezierCurveTo(150, 592, 192, 560, 228, 520); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(186, 590); g.bezierCurveTo(140, 612, 92, 636, 26, 656); g.lineTo(58, 678); g.bezierCurveTo(108, 670, 150, 662, 204, 648); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(206, 302); g.bezierCurveTo(178, 330, 150, 340, 112, 346); g.lineTo(134, 372); g.bezierCurveTo(168, 366, 198, 352, 222, 332); g.closePath(); g.fill();
  g.lineWidth = 4;
  g.beginPath(); g.moveTo(264, 178); g.quadraticCurveTo(200, 174, 118, 194); g.stroke();
  g.beginPath(); g.moveTo(264, 186); g.quadraticCurveTo(196, 200, 126, 236); g.stroke();
  g.beginPath(); g.moveTo(268, 194); g.quadraticCurveTo(214, 222, 150, 268); g.stroke();
  g.beginPath(); g.moveTo(280, 196); g.quadraticCurveTo(240, 240, 214, 290); g.stroke();
  const flowD = g.getImageData(0, 0, MW, MH).data;

  // ---------- dots ----------
  const pts: Dot[] = [];
  const add = (o: Partial<Dot>) =>
    pts.push({ k: 0, bx: 0, by: 0, w: 0, u: 0, n: 0, dx: 0, dy: 0, ...o, x: rnd() * W, y: rnd() * H, vx: 0, vy: 0, ph: rnd() * 6.283, r: (0.55 + rnd() * 1.05) * rs, a: 0.3 + rnd() * 0.7, dz: 0, e: 0, th: 0.35 + rnd() * 0.6 });
  const st = cfg.step;
  for (let y = 0; y < MH; y += st) {
    for (let x = 0; x < MW; x += st) {
      const idx = (y * MW + x) * 4 + 3;
      const keep = y > 600 ? Math.max(0.08, 0.95 - ((y - 600) / 95) * 0.87) : 0.95;
      if (bodyD[idx] > 100) {
        if (rnd() < keep) add({ k: 0, bx: x + (rnd() - 0.5) * st * 0.9, by: y + (rnd() - 0.5) * st * 0.9 });
      } else if (flowD[idx] > 100) {
        const w = clamp((300 - x) / 220, 0.15, 1);
        if (rnd() < keep * (1 - 0.45 * w)) add({ k: 1, bx: x + (rnd() - 0.5) * st * 0.9, by: y + (rnd() - 0.5) * st * 0.9, w });
      }
    }
  }
  const capsule = (k: number, len: number, t0: number, t1: number, ds: number) => {
    const nU = Math.ceil(len / ds);
    for (let i = 0; i <= nU; i++) {
      const u = i / nU, th = t0 + (t1 - t0) * u, nN = Math.max(1, Math.round(th / ds));
      for (let j = 0; j < nN; j++) add({ k, u: u + (rnd() - 0.5) * 0.01, n: (nN === 1 ? 0 : (j / (nN - 1) - 0.5) * th) + (rnd() - 0.5) * 1.2 });
    }
  };
  capsule(2, 200, 28, 16, st); // back arm (left hand)
  capsule(3, 190, 26, 16, st); // front arm (right hand)
  capsule(4, 58, 9, 9, st * 0.8); // grip
  capsule(5, 330, 6, 1.5, st * 0.7); // blade
  for (let tb = 0; tb < 16; tb++) { const ta = (tb / 16) * 6.283; add({ k: 6, dx: Math.cos(ta) * 8, dy: Math.sin(ta) * 8 }); } // tsuba

  // ---------- moon ----------
  const MC = { x: ox + 330 * S, y: oy + 300 * S }, MR = 290 * S;
  const MS = Math.ceil(MR * 2 + 160);
  const moonLayer = () => {
    const c = document.createElement("canvas");
    c.width = MS * dpr;
    c.height = MS * dpr;
    return c;
  };
  const moonCv = moonLayer(), bloodCv = moonLayer(); // same dot moon in two tints, crossfaded
  const renderMoon = (layer: HTMLCanvasElement, tint: string) => {
    const mctx = layer.getContext("2d")!;
    const rgb = hexRgb(tint);
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mctx.clearRect(0, 0, MS, MS);
    const cx = MS / 2, cy = MS / 2;
    const halo = mctx.createRadialGradient(cx, cy, MR * 0.92, cx, cy, MR * 1.28);
    halo.addColorStop(0, `rgba(${rgb},0.16)`);
    halo.addColorStop(1, `rgba(${rgb},0)`);
    mctx.fillStyle = halo;
    mctx.fillRect(0, 0, MS, MS);
    const r2 = prng(31);
    const lv: [number, number][][] = [[], [], [], [], []];
    const sp = 4.2 * rs;
    for (let yy = -MR; yy <= MR; yy += sp) {
      for (let xx = -MR; xx <= MR; xx += sp) {
        const d = Math.sqrt(xx * xx + yy * yy);
        if (d > MR) continue;
        if (d > MR - 8 && r2() < 0.45) continue;
        const n = (noise(xx / S, yy / S) + 1) / 2;
        const a = (0.35 + 0.6 * n) * (0.78 + (0.22 * d) / MR);
        lv[Math.min(4, Math.floor(a * 5))].push([cx + xx + (r2() - 0.5) * 1.5, cy + yy + (r2() - 0.5) * 1.5]);
      }
    }
    mctx.fillStyle = `rgb(${rgb})`;
    for (let l = 0; l < 5; l++) {
      mctx.globalAlpha = 0.25 + l * 0.18;
      mctx.beginPath();
      for (const p of lv[l]) { mctx.moveTo(p[0] + 1.5 * rs, p[1]); mctx.arc(p[0], p[1], 1.5 * rs, 0, 6.2832); }
      mctx.fill();
    }
    mctx.globalAlpha = 1;
  };

  // crescent: the moon with a shadow disc slid over it; shade = disc offset from the centre
  const cresCv = document.createElement("canvas");
  cresCv.width = MS * dpr;
  cresCv.height = MS * dpr;
  const cctx = cresCv.getContext("2d")!;
  let shade = 1e4, lastCres = -1;
  const renderCrescent = (k: number, e: number) => {
    // waning: the shadow slides in from up-left to a sliver; eclipse: it keeps going, through
    // new moon at the centre and off the other side, uncovering the moon in blood red
    shade = e > 0 ? MR * (0.4 - 2.7 * e) : MR * (2.3 - 1.9 * k);
    const red = smooth(seg(e, 0.4, 0.8));
    cctx.globalCompositeOperation = "source-over";
    cctx.clearRect(0, 0, cresCv.width, cresCv.height);
    cctx.globalAlpha = 1 - red;
    cctx.drawImage(moonCv, 0, 0);
    cctx.globalAlpha = red;
    cctx.drawImage(bloodCv, 0, 0);
    cctx.globalAlpha = 1;
    cctx.globalCompositeOperation = "destination-out";
    cctx.beginPath();
    cctx.arc((MS / 2 + SHADE[0] * shade) * dpr, (MS / 2 + SHADE[1] * shade) * dpr, MR * 1.02 * dpr, 0, 6.2832);
    cctx.fill();
    cctx.globalCompositeOperation = "source-over";
  };
  // lit part of the moon (the crescent once it wanes)
  // where the moon is drawn this frame (it drifts and shrinks; see env.moon)
  let mcx = MC.x, mcy = MC.y, mr = MR, msz = MS, msc = 1;
  const inMoon = (x: number, y: number) => {
    const dx = x - mcx, dy = y - mcy;
    if (dx * dx + dy * dy >= mr * mr * 0.985) return false;
    const sx = dx - SHADE[0] * shade * msc, sy = dy - SHADE[1] * shade * msc;
    return sx * sx + sy * sy > mr * mr * 1.04;
  };

  // drifting clouds across the moon (dark dot bands)
  const clouds: Cloud[] = [];
  for (let cb = 0; cb < 4; cb++) {
    const band: Cloud = { y: MC.y - MR * 0.2 + cb * MR * 0.32 + rnd() * 30, x: MC.x + (rnd() - 0.5) * MR * 2, len: MR * (0.7 + rnd() * 0.8), v: 0.08 + rnd() * 0.12, dots: [] };
    for (let cd = 0; cd < 260; cd++) { const u2 = rnd(); band.dots.push([u2 * band.len - band.len / 2, (rnd() - 0.5) * 22 * Math.sin(u2 * Math.PI) * rs, 1 + rnd() * 2.2 * rs]); }
    clouds.push(band);
  }
  // wind-blown leaves
  const flakes: Flake[] = [];
  const spawnFlake = (f: Flake, anywhere: boolean) => {
    f.x = anywhere ? rnd() * W : W + rnd() * 60; f.y = rnd() * H * 0.85; f.vx = -(0.8 + rnd() * 1.8) * cfg.wind; f.vy = 0.1 + rnd() * 0.4;
    f.s = (1.4 + rnd() * 2.2) * rs; f.rot = rnd() * 6.28; f.vr = (rnd() - 0.5) * 0.12; f.ph = rnd() * 6.28;
  };
  for (let fl = 0; fl < cfg.flakes; fl++) { const f0 = {} as Flake; spawnFlake(f0, true); flakes.push(f0); }
  // slash trail: s = position along the arc (0 oldest → 1 newest), r = fraction of blade length
  const trailDots = Array.from({ length: 200 }, () => ({ s: rnd(), r: 0.45 + 0.55 * Math.sqrt(rnd()), z: (0.5 + rnd() * 0.9) * rs }));
  // contact: motes of moonlight streaming out from the moon, growing as they come toward us
  const motes = Array.from({ length: 110 }, () => ({ a: rnd() * 6.2832, d: rnd(), v: 0.08 + rnd() * 0.14, z: 0.6 + rnd() * 1.4 }));

  // ---------- pointer, visibility ----------
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(cv);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Pointer tracked on the window: page content sits over the canvas, so canvas events miss it.
  let cx = -1e4, cy = -1e4; // client coords
  const onMove = (ev: PointerEvent) => { cx = ev.clientX; cy = ev.clientY; };
  const onLeave = () => { cx = -1e4; cy = -1e4; };
  const onUp = (ev: PointerEvent) => { if (ev.pointerType !== "mouse") onLeave(); }; // touch: no lingering hole
  const R = cfg.R;
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  document.documentElement.addEventListener("pointerleave", onLeave);

  // ---------- frame ----------
  const t0 = performance.now();
  let raf = 0, pS = !intro && env.out() ? 1 : 0, gone = intro ? 0 : env.leave(), ecl = intro ? 0 : env.eclipse(), arr = intro ? 0 : env.arrive();
  let first = true, last = t0, lastTint = "", lastBlood = "";
  const lv: Dot[][] = [[], [], [], []], dark: Dot[] = [], steel: Dot[] = [];
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const t = (now - t0) / 1000;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const { ink, tint, blood } = env.colors();
    if (tint !== lastTint || blood !== lastBlood) {
      renderMoon(moonCv, tint);
      renderMoon(bloodCv, blood);
      lastTint = tint;
      lastBlood = blood;
      lastCres = -1;
    }
    // scroll-driven phases, eased so a scroll-wheel notch doesn't step them
    const ease = reduce ? 1 : 1 - Math.exp(-6 * dt);
    gone += (env.leave() - gone) * ease; // leaving the hero: dust + crescent
    ecl += (env.eclipse() - ecl) * ease; // crescent → new moon → blood moon
    arr += (env.arrive() - arr) * ease; // the contact scene
    const cres = smooth(gone), e2 = smooth(ecl), red = smooth(seg(e2, 0.4, 0.8));
    if (cres > 0.001) {
      const key = cres + 2 * e2; // re-render the moon layer only when either phase moved
      if (Math.abs(key - lastCres) > 0.002) { renderCrescent(cres, e2); lastCres = key; }
    } else shade = 1e4;
    // the moon's place this frame: parallax drift, then small and far for the contact scene
    const mv = env.moon();
    msc = mv.s;
    mcx = MC.x + mv.dx;
    mcy = MC.y + mv.dy;
    mr = MR * msc;
    msz = MS * msc;
    // the figure: hero samurai until the page leaves it, then (contact) a second one that
    // gathers from the dust at its own place and scale; gE = how dissolved it is
    const atC = arr > 0.001, L = smooth(arr), gE = atC ? 1 - arr : gone;
    // (dots shrink less than the figure, so a small samurai stays visible)
    const fox = atC ? cfg.contact.ox : ox, foy = atC ? cfg.contact.oy : oy, fS = atC ? cfg.contact.S : S, rk = Math.sqrt(fS / S);

    // the cut plays forward while out (never in the contact scene); back, it reverses from the
    // end of the cut (skipping the still follow-through hold at 0.8..1). While the figure is
    // fully dust it jumps straight to its pose, so it re-forms already in it.
    const out = env.out() && !atC;
    if (!out) pS = Math.min(pS, 0.8);
    pS = reduce || gE > 0.99 ? (out ? 1 : 0) : clamp(pS + (out ? dt / PLAY_IN : -dt / PLAY_OUT), 0, 1);
    // pointer in canvas space, re-mapped every frame so it stays right while the page scrolls
    const rect = cv.getBoundingClientRect();
    const mx = ((cx - rect.left) * W) / rect.width, my = ((cy - rect.top) * H) / rect.height;
    const ws = cfg.wind * (0.8 + 0.45 * Math.sin(t * 0.5)) * (1 + 0.6 * L) * (reduce ? 0 : 1); // gustier at contact
    const light = mixRgb(tint, blood, red);

    // choreography
    const a = smooth(seg(pS, 0, 0.15)); // lean in over the hilt
    const b = smooth(seg(pS, 0.1, 0.45)); // draw: sword slides forward out of the scabbard
    const cr = seg(pS, 0.45, 0.8);
    const c = easeInOut(cr); // the cut: tip swings down, under and up to forward
    const f = smooth(seg(pS, 0.8, 1)); // follow-through: the trail fades

    // body: lean forward, then lunge into the cut with a step of the front foot
    const rot = 0.04 * a + 0.04 * c, cosR = Math.cos(rot), sinR = Math.sin(rot), txo = 6 * a + 24 * c, tyo = 12 * a + 18 * c;
    const T = (x: number, y: number): [number, number] => {
      if (y < 430) { const dx = x - 300, dy = y - 430; return [300 + dx * cosR - dy * sinR + txo, 430 + dx * sinR + dy * cosR + tyo]; }
      const k = 1 - (y - 430) / 262;
      return [x + txo * 0.3 * k + STEP * c * (1 - k) * clamp((x - 290) / 50, 0, 1), y + tyo * k];
    };
    const S1 = T(262, 252), S2 = T(352, 240);

    // H = tsuba end of the grip; the blade points along d from there
    let hx: number, hy: number;
    if (c > 0) {
      const v = 1 - c;
      hx = v * v * DRAWN[0] + 2 * c * v * CTRL[0] + c * c * FINISH[0];
      hy = v * v * DRAWN[1] + 2 * c * v * CTRL[1] + c * c * FINISH[1];
    } else {
      hx = MOUTH[0] - SAYA[0] * (8 + DRAW * b);
      hy = MOUTH[1] - SAYA[1] * (8 + DRAW * b);
    }
    const [Hx, Hy] = T(hx, hy);
    const ang = (SAYA_ANG + SWEEP * c) * DEG + rot, dX = Math.cos(ang), dY = Math.sin(ang), eX = -dY, eY = dX;
    // blade length clear of the scabbard; fully out once it has swung 25° away from it
    const reach = c > 0 ? 8 + DRAW + 400 * seg(-SWEEP * c, 0, 25) : 8 + DRAW * b;

    // right hand draws and cuts one-handed; left hand pulls the scabbard back (saya-biki)
    const HR: [number, number] = [Hx - dX * 12, Hy - dY * 12];
    const HL = T(MOUTH[0] + SAYA[0] * (14 + 26 * b), MOUTH[1] + SAYA[1] * (14 + 26 * b));

    ctx.clearRect(0, 0, W, H);
    if (L > 0.01) {
      // contact: moonlight coming toward us — a soft bloom and a few slow, breathing rays
      const bloom = ctx.createRadialGradient(mcx, mcy, mr * 0.8, mcx, mcy, mr * 4);
      bloom.addColorStop(0, `rgba(${light},${0.22 * L})`);
      bloom.addColorStop(1, `rgba(${light},0)`);
      ctx.fillStyle = bloom;
      ctx.fillRect(mcx - mr * 4, mcy - mr * 4, mr * 8, mr * 8);
      const RL = mr * 7;
      for (let i = 0; i < 7; i++) {
        const th = t * 0.04 + (i * 6.2832) / 7 + Math.sin(t * 0.3 + i) * 0.08, w = 0.035 + 0.02 * Math.sin(t * 0.5 + i * 2);
        const gr = ctx.createLinearGradient(mcx, mcy, mcx + Math.cos(th) * RL, mcy + Math.sin(th) * RL);
        gr.addColorStop(0, `rgba(${light},${0.1 * L})`);
        gr.addColorStop(1, `rgba(${light},0)`);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.moveTo(mcx, mcy);
        ctx.lineTo(mcx + Math.cos(th - w) * RL, mcy + Math.sin(th - w) * RL);
        ctx.lineTo(mcx + Math.cos(th + w) * RL, mcy + Math.sin(th + w) * RL);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (cres > 0.001) {
      ctx.globalAlpha = 0.07 * cres; // earthshine: the shadowed disc stays faintly there
      ctx.drawImage(moonCv, mcx - msz / 2, mcy - msz / 2, msz, msz);
      // dimmed as a background so text over it stays readable; bright again, small, at contact
      ctx.globalAlpha = 1 - 0.55 * cres + (0.55 * cres - 0.1) * L;
      ctx.drawImage(cresCv, mcx - msz / 2, mcy - msz / 2, msz, msz);
    } else ctx.drawImage(moonCv, mcx - msz / 2, mcy - msz / 2, msz, msz);
    if (cres < 0.999) {
      ctx.fillStyle = SHADOW;
      ctx.globalAlpha = 0.55 * (1 - cres);
      ctx.beginPath();
      for (const bnd of clouds) {
        if (!reduce) bnd.x -= bnd.v * cfg.wind * 2;
        if (bnd.x + bnd.len / 2 < MC.x - MR) bnd.x = MC.x + MR + bnd.len / 2;
        for (const dd of bnd.dots) { const px = bnd.x + dd[0], py = bnd.y + dd[1]; ctx.moveTo(px + dd[2], py); ctx.arc(px, py, dd[2], 0, 6.2832); }
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    lv[0].length = lv[1].length = lv[2].length = lv[3].length = 0;
    dark.length = 0;
    steel.length = 0;
    // once fully blown away the figure is skipped; its dots re-gather from where they drifted
    if (gE < 0.995) {
      for (const p of pts) {
        let P: [number, number];
        if (p.k === 0) {
          P = T(p.bx, p.by);
          if (p.by > 560) { const wb = (p.by - 560) / 130; P[0] -= ws * wb * (3 + 3 * Math.sin(t * 2 + p.by * 0.05)); P[1] += ws * wb * 1.5 * Math.sin(t * 2.6 + p.bx * 0.04); }
        } else if (p.k === 1) {
          P = T(p.bx, p.by);
          P[0] -= ws * p.w * (8 + 7 * Math.sin(t * 1.8 + p.by * 0.03 + p.bx * 0.012));
          P[1] += ws * p.w * 5 * Math.sin(t * 2.4 + p.bx * 0.035);
        } else if (p.k === 2 || p.k === 3) {
          const Sx = p.k === 2 ? S1 : S2, Hd = p.k === 2 ? HL : HR;
          const ax = Hd[0] - Sx[0], ay = Hd[1] - Sx[1], al = Math.sqrt(ax * ax + ay * ay) || 1, px2 = -ay / al, py2 = ax / al;
          const off = p.n + (p.k === 2 ? 16 : 10) * Math.sin(Math.PI * p.u);
          P = [Sx[0] + ax * p.u + px2 * off, Sx[1] + ay * p.u + py2 * off];
        } else if (p.k === 4) {
          const gl = p.u * 58 - 6;
          P = [Hx - dX * gl + eX * p.n, Hy - dY * gl + eY * p.n];
        } else if (p.k === 5) {
          const bl = 12 + p.u * 330, so = p.n + 12 * p.u * p.u;
          P = [Hx + dX * bl + eX * so, Hy + dY * bl + eY * so];
        } else {
          P = [Hx + dX * 8 + p.dx, Hy + dY * 8 + p.dy];
        }
        let tx = fox + (P[0] + FIG_X) * fS, ty = foy + P[1] * fS;
        if (first) { const fly = intro && !reduce; p.x = fly ? tx + (rnd() - 0.5) * H : tx; p.y = fly ? ty + (rnd() - 0.5) * H : ty; }

        // hover: dots near the pointer dissolve (fast) and reform once it leaves (slow);
        // leaving the hero dissolves every dot, blown further as dust (and back, at contact)
        const hx2 = tx - mx, hy2 = ty - my, hd = Math.sqrt(hx2 * hx2 + hy2 * hy2) || 1;
        const infl = smooth(clamp(1 - hd / R, 0, 1));
        p.dz += (infl - p.dz) * (1 - Math.exp(-(infl > p.dz ? 6 : 1.5) * dt));
        p.e = Math.max(p.dz, gE);
        if (p.e > 0.001) {
          // ash drifts up and downwind (left), spreading away from the pointer
          const lift = p.e * p.e * fS, blow = 1 + 3 * gE;
          tx += lift * ((hx2 / hd) * 18 * p.dz + (Math.cos(p.ph) * 22 - 30 * p.a) * blow + 5 * Math.sin(t * 1.7 + p.ph));
          ty += lift * ((hy2 / hd) * 18 * p.dz + (Math.sin(p.ph) * 16 - 52 * p.a) * blow + 4 * Math.cos(t * 1.3 + p.ph));
        }

        if (p.k >= 2 && t > 1.2) {
          // arms and sword are rigid once the intro has assembled them: locked to the pose,
          // so the cut stops dead instead of overshooting and wobbling like a spring
          p.x = tx;
          p.y = ty;
          p.vx = p.vy = 0;
        } else {
          // soft, floaty springs for the intro fly-in; after that the body is critically
          // damped (k 0.06 / damping 0.645: no overshoot) so the lunge settles firmly
          const soft = t < 2;
          const k = p.k >= 2 ? 0.25 : soft ? 0.02 : 0.06, damp = soft || p.k >= 2 ? 0.86 : 0.645;
          p.vx = (p.vx + (tx + Math.sin(t * 0.8 + p.ph) * 0.5 - p.x) * k) * damp;
          p.vy = (p.vy + (ty + Math.cos(t * 0.7 + p.ph) * 0.5 - p.y) * k) * damp;
          p.x += p.vx;
          p.y += p.vy;
        }
        if (p.k === 5 && 12 + p.u * 330 > reach) continue; // still inside the scabbard
        if (p.e > p.th) continue; // fully dissolved
        if (inMoon(p.x, p.y)) dark.push(p);
        else if (p.k === 5) steel.push(p);
        else lv[Math.min(3, Math.floor(p.a * (1 - 0.7 * p.e) * 4))].push(p);
      }
      first = false;
    }

    // silhouette against the moon
    ctx.fillStyle = SHADOW;
    ctx.beginPath();
    for (const pd of dark) { const rr = Math.max(cfg.minDark, pd.r * 1.8) * rk * (1 - 0.65 * pd.e); ctx.moveTo(pd.x + rr, pd.y); ctx.arc(pd.x, pd.y, rr, 0, 6.2832); }
    ctx.fill();
    // lit dots outside the moon
    ctx.fillStyle = ink;
    for (let b = 0; b < 4; b++) {
      ctx.globalAlpha = 0.2 + b * 0.24;
      ctx.beginPath();
      for (const pp of lv[b]) { const r = pp.r * rk * (1 - 0.6 * pp.e); ctx.moveTo(pp.x + r, pp.y); ctx.arc(pp.x, pp.y, r, 0, 6.2832); }
      ctx.fill();
    }
    // slash trail: a light crescent of dots behind the blade, plus a thin glowing streak
    // along the tip's path (dark over the moon, lit + glowing everywhere else)
    const trail = out ? seg(cr, 0.05, 0.25) * (1 - f) * (1 - gE) : 0; // slash effects only on the way out
    if (trail > 0) {
      const a0 = ang + Math.min(2.0, SAYA_ANG * DEG + rot - ang); // oldest trail angle
      for (const tr of trailDots) {
        const ta = a0 + (ang - a0) * tr.s, rr = 330 * tr.r;
        const x = ox + (Hx + FIG_X + Math.cos(ta) * rr) * S, y = oy + (Hy + Math.sin(ta) * rr) * S;
        const im = inMoon(x, y);
        ctx.globalAlpha = trail * tr.s ** 1.8 * (im ? 0.3 : 0.22);
        ctx.fillStyle = im ? SHADOW : ink;
        ctx.beginPath();
        ctx.arc(x, y, tr.z, 0, 6.2832);
        ctx.fill();
      }

      const hcx = ox + (Hx + FIG_X) * S, hcy = oy + Hy * S, tipR = 342 * S;
      const streak = (color: string, glow: number) => {
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = glow;
        ctx.lineCap = "round";
        const n = 28; // segments: faint hairline at the tail, a little bolder at the blade
        for (let i = 0; i < n; i++) {
          const s = (i + 1) / n;
          ctx.globalAlpha = trail * s ** 1.6 * 0.4;
          ctx.lineWidth = (0.3 + 1.2 * s) * S;
          ctx.beginPath();
          ctx.arc(hcx, hcy, tipR - 3 * S * s, a0 + ((ang - a0) * i) / n, a0 + (ang - a0) * s, ang < a0);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      };
      ctx.save();
      ctx.beginPath();
      ctx.arc(mcx, mcy, mr, 0, 6.2832);
      ctx.clip();
      streak(SHADOW, 0);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.arc(mcx, mcy, mr, 0, 6.2832);
      ctx.clip("evenodd");
      streak(ink, 3 * S);
      ctx.restore();
      ctx.fillStyle = ink;
    }
    // blade, glinting once drawn and flaring at the height of the cut
    ctx.globalAlpha = 1;
    ctx.shadowColor = ink;
    ctx.shadowBlur = (6 + (out ? 4 * Math.sin(Math.PI * cr) : 0)) * c;
    ctx.beginPath();
    for (const ps of steel) { const r = ps.r * rk * (1 - 0.6 * ps.e); ctx.moveTo(ps.x + r, ps.y); ctx.arc(ps.x, ps.y, r, 0, 6.2832); }
    ctx.fill();
    ctx.shadowBlur = 0;
    // leaves in the wind (quieter once the page has moved on)
    const leafA = 1 - 0.6 * gE; // back in full for the windy contact scene
    for (const fk of flakes) {
      if (!reduce) { fk.x += fk.vx * (0.7 + ws * 0.5); fk.y += fk.vy + Math.sin(t * 2 + fk.ph) * 0.4; fk.rot += fk.vr; }
      if (fk.x < -20 || fk.y > H + 20) spawnFlake(fk, false);
      const im = inMoon(fk.x, fk.y);
      ctx.save();
      ctx.translate(fk.x, fk.y);
      ctx.rotate(fk.rot);
      ctx.fillStyle = im ? SHADOW : ink;
      ctx.globalAlpha = (im ? 0.9 : 0.45) * leafA;
      ctx.fillRect(-fk.s, -fk.s * 0.35, fk.s * 2, fk.s * 0.7);
      ctx.restore();
    }
    // contact: motes of moonlight leave the moon and grow as they travel, as if toward us
    if (L > 0.01) {
      const far = Math.hypot(W, H) * 0.75;
      ctx.fillStyle = `rgb(${light})`;
      for (const m of motes) {
        if (!reduce) {
          m.d += m.v * dt * (0.4 + m.d); // accelerating as they near
          if (m.d > 1) { m.d = 0; m.a = rnd() * 6.2832; }
        }
        const dist = mr * 0.9 + m.d * m.d * far;
        ctx.globalAlpha = L * 0.55 * Math.sin(Math.PI * m.d);
        ctx.beginPath();
        ctx.arc(mcx + Math.cos(m.a) * dist, mcy + Math.sin(m.a) * dist, m.z * rs * (0.5 + 3.5 * m.d), 0, 6.2832);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };
  raf = requestAnimationFrame(frame);

  return {
    stop() {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    },
  };
}
