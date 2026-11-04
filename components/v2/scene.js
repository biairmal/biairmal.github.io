// /v2 · 刹那 Setsuna, "One Instant" (storyboard v8: design/storyboard-v8/STORYBOARD.md).
// A walled dry garden on a cliff. He stands on his stone at the edge, facing the blood moon (−Z); the lantern path
// runs from him to the gate (+Z); the cut targets are in the west corner, the house and its veranda on the east.
// Nothing on him moves: each beat is a separate static pose, swapped while the camera hides it. Time is one uniform
// that slows to a stop as you start to scroll, is scrubbed by the scroll while frozen, and resumes at Contact.
//
// Plain JS, ported from the storyboard's blockout previz. Models live in public/v2.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const ramp = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
const smooth = (x) => x * x * (3 - 2 * x);
const lerp = (a, b, t) => a + (b - a) * t;
const mmToFov = (mm) => (2 * Math.atan(12 / mm) * 180) / Math.PI;

// ------------------------------------------------------------------ layout (he faces the moon, −Z; his left is −X)
const MOON = V(25, 40, -320);
const EDGE = -8; // the cliff edge; walls on the other three sides: x −14 / x 22 / z 18 (gate at x 0)
const HIS = V(0, 0, -6); // y: the top of his stone, set once it loads
const ROCKS = [[-6, -2, 1.3], [5, -1, 1.0], [-4.6, 5, 0.8], [6.5, 12.5, 1.1], [-3.8, 16, 0.7]]; // x, z, scale
const STONES = Array.from({ length: 13 }, (_, i) => { const z = -3.2 + i * 1.6; return [0.45 * Math.sin(z * 0.7), z]; });
const KATA = [{ z: 0, side: -1, pose: "p1" }, { z: 3.6, side: 1, pose: "p2" }, { z: 7.2, side: -1, pose: "p3" }, { z: 10.8, side: 1, pose: "p5" }];
const LANTERNS = KATA.map((k) => V(k.side * 2.5, 0, k.z + 0.6));
const WORK_AT = V(-10.6, 0, 6.4); // the Work pose (P4 Chiburi; P3 stands in until it exists)
const WORK_POSE = "p3";
const TARGETS = [[-9.4, 8.6], [-9.7, 9.8], [-9.3, 11.0], [-9.6, 12.2]]; // one per project, in the Work list's order: the first (current) is uncut
const BRAZIER = V(-11.4, 0, 11.6); // behind the targets: their warm back light
const ARMS = V(12.2, 0.6, 5); // the weapon rack, on the veranda floor: set from the house once it loads
const WIPE = V(3.4, 0, 8.6); // the small pine the camera brushes past on its way to the veranda (Toolkit's foreground wipe)
// trees: x, z, height, kind (0 tall, 1 medium). Along the cliff, beyond the walls (their tops show over the cap), a few inside
const TREES = [
  [-10, -7.2, 9, 0], [12.5, -7, 7.5, 1], [-12, -3.5, 6, 1], [-11.2, 15.6, 5, 1], [WIPE.x, WIPE.z, 3.4, 1], [18.8, 15.5, 6.5, 0],
  [-17.5, 1, 12, 0], [-18.5, 7.5, 9, 1], [-17, 13, 11, 0], [-8, 21.5, 10, 0], [-3.5, 23, 8, 1], [6.5, 22, 12, 0], [12, 23.5, 9, 1], [17.5, 21, 10, 0],
  [26, -1, 11, 0], [25.5, 6.5, 8.5, 1], [26.5, 13, 12, 0], [-22, 18, 13, 0], [29, 20, 13, 0],
];

// ------------------------------------------------------------------ shots
// Orbit shots circle him: ang 0 = behind him (+Z), ±180 = his front; side pushes him right of centre (room for text).
// Path shots: camera position, look-at point, lens mm. Portrait screens: a wider lens and no side offset.
const ORB = (ang, rad, y, ty, mm, side) => ({ orbit: { ang, rad, y, ty, mm, side } });
const AT = (p, t, mm, extra = {}) => ({ p, t, mm, ...extra });
const contact = (d, mm) => {
  const chest = V(HIS.x, 1.45, HIS.z), p = chest.clone().addScaledVector(chest.clone().sub(MOON).normalize(), d);
  p.y = Math.max(p.y, 0.6);
  return AT(p, MOON.clone().add(V(-40, -14, 0)), mm, { mt: MOON.clone().add(V(0, -12, 0)) }); // mt: the portrait look-at (him centred)
};
const SHOTS = {
  s01: ORB(-4.5, 3.9, 1.05, 1.4, 40, 0.75), // the moment before: the moon behind his hat
  s02: ORB(-60, 3.2, 1.15, 1.25, 38, 0.5), // time slows: the circle starts, clockwise round his left
  s03a: ORB(-120, 3.2, 1.3, 1.25, 35, 0.6), // bullet time: frozen embers parallax
  s03b: ORB(-180, 3.4, 0.9, 1.25, 35, 0.6), // About: his front, low; the garden revealed behind him
  ...Object.fromEntries(KATA.map((k, i) => [`s04${"abcd"[i]}`, AT(V(-k.side * 0.3, 0.8, k.z - 4.2), V(k.side * 1.6, 1.0, k.z), 30, i === 0 ? { pass: true } : {})])),
  s05: AT(V(-4.2, 1.4, 14.5), V(-10, 0.95, 9.3), 36, { whip: true, mt: V(-9.6, 1.35, 10.6) }), // Work: whip pan to the targets
  get s06() { return AT(V(ARMS.x - 3.9, ARMS.y + 0.7, ARMS.z - 1.3), V(ARMS.x, ARMS.y + 0.75, ARMS.z + 0.2), 38); }, // Toolkit: the rack
  get s07() { return { ...contact(5, 35), arc: true }; }, // time resumes: rises, arcs back, dolly zoom begins
  get s08() { return contact(12, 85); }, // Contact: telephoto, the moon swells behind him
};
const ORDER = Object.keys(SHOTS);
const FROZEN = [1, ORDER.indexOf("s07")]; // time slows to a stop over s01 → s02, resumes over s07 → s08

// ------------------------------------------------------------------ themes: colours and intensities only (nothing recompiles)
const THEMES = {
  dark: { top: 0x0b0303, hor: 0x3a0e0a, stars: 1, moon: 0xe0503e, flat: 0, halo: 0.7, fog: 0x160707, fogD: 0.028, gA: 0x141212, gB: 0x302c2a, cloud: 0x3a1210, ash: 0x8a7e78, ember: 0xff6040,
    far0: 0x2a0b09, far1: 0x1c0706, far2: 0x110404, far3: 0x0d0303, hemiS: 0x3a1a16, hemiG: 0x080303, hemi: 1.0, key: 0xff6a58, keyI: 2.3, warm: 1, ghost: 0xb0524a, stone: 0x3a3a3c, ground: 0x1a1817, core: 0xffe0b0, bloom: 0.45, exposure: 1 },
  light: { top: 0xf3f0ea, hor: 0xdcd5ca, stars: 0, moon: 0xc4453f, flat: 1, halo: 0.12, fog: 0xe6e1d8, fogD: 0.03, gA: 0xd3cec5, gB: 0xf1eee8, cloud: 0xffffff, ash: 0x8f8a84, ember: 0xc4453f,
    far0: 0xd6d0c5, far1: 0xc4bcae, far2: 0xaea595, far3: 0x8f877b, hemiS: 0xf4f1ec, hemiG: 0x8a857e, hemi: 1.7, key: 0xfff2e6, keyI: 1.4, warm: 0, ghost: 0x6a625c, stone: 0x8a8680, ground: 0x9a958d, core: 0x4a4540, bloom: 0, exposure: 1 },
};
const mixTheme = (k) => {
  const o = {};
  for (const n in THEMES.dark) {
    const a = THEMES.dark[n], b = THEMES.light[n];
    o[n] = n === "fogD" || n === "stars" || n === "flat" || n === "halo" || n === "hemi" || n === "keyI" || n === "warm" || n === "bloom" || n === "exposure"
      ? lerp(a, b, k) : new THREE.Color(a).lerp(new THREE.Color(b), k);
  }
  return o;
};

const glowTexture = () => {
  const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,255,255,.3)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
};

// ------------------------------------------------------------------ scroll anchors ([data-shot] elements), as in v7
function readAnchors(root) {
  const vh = window.innerHeight, max = Math.max(1, document.documentElement.scrollHeight - vh), out = [];
  root.querySelectorAll("[data-shot]").forEach((el) => {
    const idx = ORDER.indexOf(el.dataset.shot);
    if (idx < 0) return;
    const r = el.getBoundingClientRect(), top = r.top + window.scrollY;
    out.push({ idx, y: clamp(el.dataset.at !== undefined ? top - vh * +el.dataset.at : top + r.height / 2 - vh / 2, 0, max) });
  });
  out.sort((a, b) => a.y - b.y || a.idx - b.idx);
  for (let i = 1; i < out.length; i++) if (out[i].y <= out[i - 1].y) out[i].y = out[i - 1].y + 1;
  return out;
}
function shotAt(anchors, y) {
  if (!anchors.length) return 0;
  if (y <= anchors[0].y) return anchors[0].idx;
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1], b = anchors[i];
    if (y <= b.y) return a.idx + (b.idx - a.idx) * smooth(ramp((y - a.y) / (b.y - a.y), 0.06, 0.94));
  }
  return anchors[anchors.length - 1].idx;
}

// ------------------------------------------------------------------ the film
export function startFilm({ canvas, root, base, clock: clockEl, onProgress, onReady }) {
  const params = new URLSearchParams(window.location.search);
  const mobile = window.matchMedia("(max-width: 767px)").matches || navigator.maxTouchPoints > 1 || params.has("lo"); // ?lo: the phone path
  const hi = !mobile;
  const SNAP = params.get("shot"); // ?shot=s03b holds one shot (for checking frames)
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  const PR_MAX = Math.min(window.devicePixelRatio, 1.5), PR_MIN = hi ? 0.75 : 0.6;
  let pixelRatio = Math.min(PR_MAX, hi ? 1.5 : 1.0);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.NeutralToneMapping; // keeps the paper white and the red red (ACES greys both)

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x160707, 0.028);
  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.05, 3000);
  const glowTex = glowTexture();
  const sprite = (color, s, k, pos) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: k })); m.scale.setScalar(s); m.position.copy(pos); scene.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
  const faceTo = (o, t) => { o.rotation.y = Math.atan2(t.x - o.position.x, t.z - o.position.z); }; // models face +Z

  // ---------------- sky, moon (sun in light mode)
  const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, stars: { value: 1 } };
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: "varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }",
    fragmentShader: `varying vec3 p; uniform vec3 top, hor; uniform float stars;
      float h(vec3 q){ return fract(sin(dot(q, vec3(12.9898,78.233,37.719)))*43758.5453); }
      void main(){ vec3 n = normalize(p); vec3 c = mix(hor, top, smoothstep(-0.02, 0.45, n.y));
        vec3 q = floor(n*520.); c += stars * step(0.998, h(q)) * smoothstep(0.08, 0.5, n.y) * 0.5;
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }` })));
  const moonU = { col: { value: new THREE.Color() }, flatK: { value: 0 } };
  const moon = new THREE.Mesh(new THREE.SphereGeometry(34, 48, 24), new THREE.ShaderMaterial({ fog: false, uniforms: moonU,
    vertexShader: "varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }",
    fragmentShader: `varying vec3 p; uniform vec3 col; uniform float flatK;
      float hash(vec3 q){ return fract(sin(dot(q, vec3(127.1,311.7,74.7)))*43758.5453); }
      float noise(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
        return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
      void main(){ vec3 q = normalize(p); float m = noise(q*3.)*.5 + noise(q*7.)*.3 + noise(q*15.)*.2;
        gl_FragColor = vec4(col * mix(0.75 + 0.3*m, 1., flatK), 1.);
        #include <colorspace_fragment>
      }` }));
  moon.position.copy(MOON); scene.add(moon);
  const halo = sprite(0xe04632, 320, 0.7, MOON); halo.material.fog = false;

  // ---------------- far: three ridges, a pagoda on a far peak (the scale cue), the sea of cloud below the cliff
  const farMats = [];
  for (const [z, b, h, s, w] of [[-300, -30, 36, 1.0, 1400], [-190, -30, 30, 2.3, 1000], [-110, -30, 24, 4.1, 700]]) {
    const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0);
    for (let i = 0; i <= 120; i++) { const t = i / 120; sh.lineTo(-w / 2 + t * w, h * (0.45 + 0.3 * Math.sin(t * 7 + s) + 0.18 * Math.sin(t * 19 + s * 2) + 0.07 * Math.sin(t * 53 + s * 3))); }
    sh.lineTo(w / 2, 0); sh.closePath();
    const m = new THREE.MeshBasicMaterial({ fog: false }); farMats.push(m);
    const r = new THREE.Mesh(new THREE.ShapeGeometry(sh), m); r.position.set(0, b, z); scene.add(r);
  }
  const pagodaMat = new THREE.MeshBasicMaterial({ fog: false }); farMats.push(pagodaMat);
  const PAGODA = V(-55, -12, -150);
  {
    const g = new THREE.Group(); g.position.copy(PAGODA); g.scale.setScalar(0.65); scene.add(g); // its base is lost in the cloud
    for (let i = 0; i < 5; i++) { const w = 6 - i * 0.8, y = i * 4.2; box(w * 0.6, 3.2, w * 0.6, pagodaMat, 0, y + 1.6, 0, g); box(w * 1.25, 0.5, w * 1.25, pagodaMat, 0, y + 3.4, 0, g); }
    box(0.25, 6, 0.25, pagodaMat, 0, 24, 0, g);
  }
  const cloudTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d");
    for (let i = 0; i < 70; i++) { const px = rand() * 256, py = rand() * 256, r = 20 + rand() * 50, g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, "rgba(255,255,255,.35)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 256, 256); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 12); return t;
  })();
  const cloudMats = [];
  for (const y of [-11, -14, -18]) {
    const m = new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0.7 }); cloudMats.push(m);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(900, 700), m); p.rotation.x = -Math.PI / 2; p.position.set(0, y, EDGE - 340); scene.add(p);
  }

  // ---------------- the garden: a platform on the cliff and raked gravel (lines, and rings around each rock)
  const groundMat = new THREE.MeshStandardMaterial({ roughness: 1 });
  box(88, 40, 50, groundMat, 4, -20, 17); // top at y 0, from the cliff edge (z −8) back to z 42
  const gravelU = { rocks: { value: [V(HIS.x, HIS.z, 1), ...ROCKS.map(([x, z, s]) => V(x, z, s))] }, cA: { value: new THREE.Color() }, cB: { value: new THREE.Color() }, fogC: { value: scene.fog.color }, fogD: { value: 0.028 } };
  {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(36, 26), new THREE.ShaderMaterial({ uniforms: gravelU,
      vertexShader: "varying vec3 w; varying float fd; void main(){ w = (modelMatrix*vec4(position,1.)).xyz; vec4 mv = viewMatrix*vec4(w,1.); fd = -mv.z; gl_Position = projectionMatrix*mv; }",
      fragmentShader: `uniform vec3 rocks[6]; uniform vec3 cA, cB, fogC; uniform float fogD; varying vec3 w; varying float fd;
        void main(){
          float l = sin(w.z*34.), inR = 0.;
          for (int i = 0; i < 6; i++){ float d = length(w.xz - rocks[i].xy), r = rocks[i].z; float k = 1. - smoothstep(r*2.3, r*2.7, d); if (k > inR){ inR = k; l = mix(sin(w.z*34.), sin((d - r)*34.), k); } }
          float grain = fract(sin(dot(floor(w.xz*120.), vec2(12.9898,78.233)))*43758.5453);
          l *= 1. - 0.85*smoothstep(4., 15., fd); // the lines fade with distance (no shimmer)
          vec3 c = mix(cA, cB, smoothstep(-1.2, 1.3, l)) * (0.88 + 0.24*grain);
          gl_FragColor = vec4(mix(c, fogC, 1. - exp(-fogD*fogD*fd*fd)), 1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }` }));
    g.rotation.x = -Math.PI / 2; g.position.set(4, 0.004, 5); scene.add(g);
  }
  const stoneMat = new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true });
  {
    const disc = new THREE.CylinderGeometry(0.42, 0.48, 0.12, 9);
    const all = [...STONES.map(([x, z]) => [x, z, 1]), ...KATA.map((k) => [k.side * 1.6, k.z, 1.3])];
    const im = new THREE.InstancedMesh(disc, stoneMat, all.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    all.forEach(([x, z, s], i) => { q.setFromAxisAngle(V(0, 1, 0), x * 3); im.setMatrixAt(i, m4.compose(V(x, 0.05, z), q, V(s, 1, s))); });
    scene.add(im);
  }

  // ---------------- lights: a constant count (phones skip the point lights); the theme only changes colours and intensities
  const hemi = new THREE.HemisphereLight(0x3a1a16, 0x080303, 0.9); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xff6a58, 1.6); key.position.copy(MOON).normalize().multiplyScalar(40); key.target.position.copy(HIS); scene.add(key, key.target);
  const warm = [], glows = [];
  const point = (int, dist, p) => { if (!hi) return null; const l = new THREE.PointLight(0xffc985, int, dist, 1.5); l.position.copy(p); scene.add(l); warm.push([l, int]); return l; };
  point(3, 7, V(HIS.x - 1, 2.6, HIS.z + 2.2)); // a warm fill on him from the garden side
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffe0b0, toneMapped: false });
  for (const p of LANTERNS) { point(4, 7, V(p.x, 1.3, p.z)); glows.push([sprite(0xff8a48, 1.6, 0.4, V(p.x, 1.05, p.z)), 0.4]); }
  point(12, 9, V(BRAZIER.x, 1.6, BRAZIER.z)); glows.push([sprite(0xffa060, 3, 0.8, V(BRAZIER.x, 1.5, BRAZIER.z)), 0.8]);
  const rackLight = point(8, 10, V(ARMS.x - 1.5, 2.2, ARMS.z));
  { const g = sprite(0xffc985, 1.2, 0.9, V(PAGODA.x, PAGODA.y + 6, PAGODA.z + 2.5)); g.material.fog = false; glows.push([g, 0.9]); } // a light in the far pagoda
  { const fire = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.38, 7), new THREE.MeshBasicMaterial({ color: 0xff8a40, toneMapped: false })); fire.position.set(BRAZIER.x, 1.42, BRAZIER.z); scene.add(fire); }

  // ---------------- particles: ash and embers in one draw; their motion is a function of time only (frozen = free)
  const partU = { t: { value: 0 }, px: { value: pixelRatio }, cAsh: { value: new THREE.Color() }, cEmb: { value: new THREE.Color() } };
  {
    const n = hi ? 1850 : 700, embers = hi ? 250 : 100, pos = new Float32Array(n * 3), kind = new Float32Array(n), sz = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos[i * 3] = -20 + rand() * 45; pos[i * 3 + 1] = -12 + rand() * 21; pos[i * 3 + 2] = -16 + rand() * 36; kind[i] = i < embers ? 1 : 0; sz[i] = kind[i] ? 1.6 + rand() * 1.6 : 0.6 + rand() ** 3 * 2.5; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("kind", new THREE.BufferAttribute(kind, 1)); g.setAttribute("sz", new THREE.BufferAttribute(sz, 1));
    const p = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: partU, transparent: true, depthWrite: false,
      vertexShader: `attribute float kind; attribute float sz; uniform float t, px; uniform vec3 cAsh, cEmb; varying vec3 vC; varying float vA;
        void main(){ vec3 p = position;
          if (kind < .5) p += vec3(t*0.12 + sin(t*0.4 + position.y)*0.3, -t*0.1, sin(t*0.3 + position.x)*0.2);
          else p += vec3(sin(t*0.7 + position.z)*0.25, t*0.45, 0.);
          p = mod(p - vec3(-20., -12., -16.), vec3(45., 21., 36.)) + vec3(-20., -12., -16.);
          vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv; float d = -mv.z;
          gl_PointSize = clamp(sz*30./d, 1., 44.)*px; vC = kind < .5 ? cAsh : cEmb; vA = (kind < .5 ? .5 : 1.) * smoothstep(0.4, 1.6, d); }`,
      fragmentShader: "varying vec3 vC; varying float vA; void main(){ float a = 1. - smoothstep(.15, .5, length(gl_PointCoord - .5)); gl_FragColor = vec4(vC, a*vA); }" }));
    p.frustumCulled = false; scene.add(p);
  }

  // ---------------- theme: follows the site's toggle (the .dark / .light class on <html>), crossfading over ~0.6 s
  const paper = [], ghostMats = [];
  const html = document.documentElement;
  const isLight = () => (html.classList.contains("light") ? 1 : html.classList.contains("dark") ? 0 : window.matchMedia("(prefers-color-scheme: dark)").matches ? 0 : 1);
  let themeK = isLight(), themeTo = themeK, bloom = null;
  const applyTheme = (k) => {
    const T = mixTheme(k);
    skyU.top.value.copy(T.top); skyU.hor.value.copy(T.hor); skyU.stars.value = T.stars;
    moonU.col.value.copy(T.moon); moonU.flatK.value = T.flat; halo.material.opacity = T.halo;
    scene.fog.color.copy(T.fog); scene.fog.density = gravelU.fogD.value = T.fogD; gravelU.cA.value.copy(T.gA); gravelU.cB.value.copy(T.gB);
    for (const m of cloudMats) m.color.copy(T.cloud);
    farMats.forEach((m, i) => m.color.copy(T[`far${i}`]));
    stoneMat.color.copy(T.stone); groundMat.color.copy(T.ground); coreMat.color.copy(T.core);
    hemi.color.copy(T.hemiS); hemi.groundColor.copy(T.hemiG); hemi.intensity = T.hemi; key.color.copy(T.key); key.intensity = T.keyI;
    for (const [l, i] of warm) l.intensity = i * T.warm;
    for (const [g, i] of glows) g.material.opacity = i * T.warm;
    for (const m of paper) m.emissiveIntensity = 0.5 * T.warm;
    partU.cAsh.value.copy(T.ash); partU.cEmb.value.copy(T.ember);
    for (const m of ghostMats) m.color.copy(T.ghost);
    if (bloom) bloom.strength = T.bloom;
    renderer.toneMappingExposure = T.exposure;
  };
  applyTheme(themeK);
  const mo = new MutationObserver(() => { themeTo = isLight(); });
  mo.observe(html, { attributes: true, attributeFilter: ["class"] });

  // ---------------- pose helpers
  // The digital afterimage: a pose drawn as its own vertices (shares the mesh's position buffer, no extra download).
  const ghostOf = (pose) => {
    const mat = new THREE.PointsMaterial({ size: 0.01, transparent: true, opacity: 0.4, depthWrite: false, color: mixTheme(themeK).ghost });
    ghostMats.push(mat);
    const g = new THREE.Group();
    pose.traverse((m) => {
      if (!m.isMesh) return;
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", m.geometry.attributes.position);
      const p = new THREE.Points(geo, mat); m.updateWorldMatrix(true, false); p.applyMatrix4(m.matrixWorld.clone().premultiply(pose.matrixWorld.clone().invert())); g.add(p);
    });
    return { group: g, mat };
  };
  // Condense / dissolve: the solid pose is cut out in small cubes by a hash of world position; `solid` 0 → 1 fills it in.
  const dissolving = (pose) => {
    const u = { value: 0 };
    pose.traverse((m) => {
      if (!m.isMesh) return;
      m.material = m.material.clone();
      m.material.onBeforeCompile = (sh) => {
        sh.uniforms.uSolid = u;
        sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vDw;").replace("#include <project_vertex>", "#include <project_vertex>\nvDw = (modelMatrix * vec4(transformed, 1.)).xyz;");
        sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vDw; uniform float uSolid;").replace("#include <clipping_planes_fragment>",
          "#include <clipping_planes_fragment>\nif (fract(sin(dot(floor(vDw*26.), vec3(12.9898,78.233,37.719)))*43758.5453) > uSolid) discard;");
      };
      m.material.customProgramCacheKey = () => "dissolve";
    });
    return u;
  };

  // ---------------- assets: the hero set behind the loader, the rest streams in after first paint
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const suffix = hi ? "" : "-mobile";
  const progress = {};
  const HERO = ["p1", "stone", "pine_tall", "pine_mid", "wall"];
  const REST = ["p2", "p3", "p5", "p6", "gate", "house", "rack", "lantern", "brazier", "target", "target_lo", "target_top"];
  const report = () => onProgress?.(0.95 * (HERO.reduce((a, n) => a + (progress[n] ?? 0), 0) / HERO.length));
  const load = (name) => new Promise((res) => loader.load(`${base}/${name}${suffix}.glb`, (g) => { progress[name] = 1; report(); res(g); }, (e) => { if (e.total) { progress[name] = e.loaded / e.total; report(); } }, () => res(null)));
  const topOf = (o) => new THREE.Box3().setFromObject(o).max.y;
  // one draw call per kind: every mesh of a model, instanced at each [position, rotationY, scale]
  const instance = (gltf, list, parent) => {
    gltf.scene.updateMatrixWorld(true);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    gltf.scene.traverse((o) => {
      if (!o.isMesh) return;
      const im = new THREE.InstancedMesh(o.geometry, o.material, list.length);
      list.forEach(([p, ry, s], i) => { q.setFromAxisAngle(V(0, 1, 0), ry); im.setMatrixAt(i, m4.compose(p, q, s.isVector3 ? s : V(s, s, s)).multiply(o.matrixWorld)); });
      im.computeBoundingSphere(); parent.add(im);
    });
  };
  const him = {}, ghosts = [], work = { focus: 0, cur: 0 };
  let ready = false;

  Promise.all(HERO.map(load)).then(([p1, stone, pineTall, pineMid, wall]) => {
    if (stone) {
      const s = stone.scene; s.traverse((o) => { if (o.isMesh) o.material = stoneMat; });
      instance(stone, ROCKS.map(([x, z, k]) => [V(x, -0.12 * k, z), x * 1.7, k * 1.25]), scene); // the garden rocks: his stone, bigger and sunk
      s.position.set(HIS.x, 0, HIS.z); scene.add(s); s.updateMatrixWorld(true);
      HIS.y = topOf(s); // he stands on its top
    }
    if (p1) { const g = p1.scene; g.position.copy(HIS); faceTo(g, MOON); scene.add(g); him.p1 = g; }
    for (const [gltf, kind] of [[pineTall, 0], [pineMid, 1]]) if (gltf) instance(gltf, TREES.filter((t) => t[3] === kind).map(([x, z, h]) => [V(x, -0.05, z), x * 1.31 + z, h]), scene);
    if (wall) {
      // segments laid end to end along three sides, stretched a little so each run fits exactly
      const len = 5.46, list = [];
      for (const [x1, z1, x2, z2] of [[-14, EDGE + 0.3, -14, 18], [22, EDGE + 0.3, 22, 18], [-14, 18, -1.75, 18], [1.75, 18, 22, 18]]) {
        const L = Math.hypot(x2 - x1, z2 - z1), n = Math.ceil(L / len), ry = -Math.atan2(z2 - z1, x2 - x1);
        for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; list.push([V(lerp(x1, x2, t), 0, lerp(z1, z2, t)), ry, V(L / n / len, 1, 1)]); }
      }
      instance(wall, list, scene);
    }
    renderer.compileAsync(scene, camera).catch(() => {}).finally(() => { ready = true; onProgress?.(1); onReady?.(); streamRest(); });
  });

  const streamRest = () => Promise.all(REST.map(load)).then(([p2, p3, p5, p6, gate, house, rack, lantern, brazier, target, targetLo, targetTop]) => {
    const g = new THREE.Group(); // compiled before it joins the scene, so nothing stalls mid-scroll
    const P = { p1: him.p1, p2: p2?.scene, p3: p3?.scene, p5: p5?.scene };
    const place = (pose, at, look) => { const o = pose.clone(); o.position.copy(at); faceTo(o, look); g.add(o); o.updateMatrixWorld(true); return o; };
    if (p6) { him.p6 = place(p6.scene, HIS, MOON); him.p6.visible = false; }
    KATA.forEach((k, i) => {
      if (!P[k.pose]) return;
      const at = V(k.side * 1.6, 0.11, k.z), look = V(-k.side * 0.4, 0, k.z - 3.5); // facing the camera as it comes down the path
      const body = place(P[k.pose], at, look), ghost = ghostOf(body);
      ghost.group.position.copy(body.position); ghost.group.rotation.copy(body.rotation); g.add(ghost.group);
      ghosts.push({ body, ghost, solid: dissolving(body), at: ORDER.indexOf(`s04${"abcd"[i]}`) });
    });
    const wp = { p2, p3, p5 }[WORK_POSE];
    if (wp) place(wp.scene, WORK_AT, V(WORK_AT.x + 3, 0, WORK_AT.z + 1.2));
    if (gate) { gate.scene.position.set(0, 0, 18); g.add(gate.scene); }
    if (house) {
      const h = house.scene; h.rotation.y = -Math.PI / 2; h.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(h); h.position.set(11.6 - b.min.x, 0, 5 - (b.min.z + b.max.z) / 2); g.add(h); // the veranda faces the garden
      h.updateMatrixWorld(true);
      // the veranda: the first raised floor going in from the front edge; the rack stands on it, against the shōji
      const ray = new THREE.Raycaster();
      let x = 11.7, y = 0;
      for (; x < 16; x += 0.05) { ray.set(V(x, 1.9, ARMS.z), V(0, -1, 0)); y = ray.intersectObject(h, true)[0]?.point.y ?? 0; if (y > 0.2) break; }
      ARMS.set(x + 0.6, y, ARMS.z); rackLight?.position.set(ARMS.x - 1.6, ARMS.y + 1.6, ARMS.z);
      h.traverse((o) => { // v7's shōji glow: the bright texels of the paper become emissive
        if (!o.isMesh || !o.material?.map) return;
        const m = o.material; m.emissive = new THREE.Color(0xffe2b4); m.emissiveMap = m.map; m.emissiveIntensity = 0.5 * (1 - themeK); paper.push(m);
        m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>", "vec3 pt = texture2D(emissiveMap, vEmissiveMapUv).rgb; totalEmissiveRadiance *= smoothstep(0.62, 0.86, dot(pt, vec3(.299,.587,.114))) * pt;"); };
        m.customProgramCacheKey = () => "paper-glow";
      });
    }
    if (rack) { const r = rack.scene; r.position.copy(ARMS); r.rotation.y = -Math.PI / 2; g.add(r); }
    if (lantern) {
      lantern.scene.scale.setScalar(0.75);
      for (const p of LANTERNS) { const l = lantern.scene.clone(); l.position.copy(p); l.rotation.y = p.x * 0.4; g.add(l); box(0.16, 0.15, 0.16, coreMat, p.x, 1.05, p.z, g); }
    }
    if (brazier) { brazier.scene.position.copy(BRAZIER); g.add(brazier.scene); }
    // Work: the current project still stands uncut; the three finished ones are cut, their tops hanging mid-fall
    const look = V(-4.2, 0, 14.5);
    TARGETS.forEach(([x, z], i) => {
      const at = V(x, 0, z);
      if (i === 0) { if (target) place(target.scene, at, look); return; }
      if (targetLo) place(targetLo.scene, at, look);
      if (targetTop) {
        const t = place(targetTop.scene, at, look);
        t.position.y = 1.2 + 0.06 * i; t.translateX(0.06 + 0.05 * i); t.rotateZ(-0.12 - 0.1 * i);
      }
    });
    return renderer.compileAsync(g, camera, scene).catch(() => {}).then(() => scene.add(g));
  });

  // Work: opening a row eases the camera toward that row's target
  const rows = [...root.querySelectorAll("#work details")];
  const onToggle = () => { const i = rows.findIndex((d) => d.open); if (i >= 0) work.focus = i; };
  rows.forEach((d) => d.addEventListener("toggle", onToggle));

  // ---------------- post: desktop only (bloom + vignette + grain); phones render straight to the screen
  const composer = hi ? new EffectComposer(renderer) : null;
  let grain = null;
  if (composer) {
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), mixTheme(themeK).bloom, 0.65, 0.8);
    composer.addPass(bloom);
    grain = new ShaderPass({ uniforms: { tDiffuse: { value: null }, seed: { value: 0 }, vig: { value: 1 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }",
      fragmentShader: `uniform sampler2D tDiffuse; uniform float seed, vig; varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + seed)*43758.5453); }
        void main(){ vec4 c = texture2D(tDiffuse, vUv); c.rgb *= mix(1. - .5*vig, 1., smoothstep(.95, .3, length(vUv-.5)*1.2)); c.rgb += (h(vUv*1000.)-.5)*.035; gl_FragColor = c; }` });
    composer.addPass(grain);
    composer.addPass(new OutputPass());
  }

  // ---------------- camera director
  let anchors = readAnchors(root);
  const refresh = () => { anchors = readAnchors(root); };
  const ro = new ResizeObserver(refresh); ro.observe(document.body);
  const pointer = new THREE.Vector2();
  const onPointer = (e) => pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  window.addEventListener("pointermove", onPointer, { passive: true });
  const onResize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    composer?.setSize(w, h); refresh();
  };
  window.addEventListener("resize", onResize);

  const look = (p, t) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(p, t, V(0, 1, 0)));
  const portrait = () => window.innerWidth < window.innerHeight;
  const orbitPose = (o) => {
    const a = (o.ang * Math.PI) / 180, p = V(HIS.x + Math.sin(a) * o.rad, o.y, HIS.z + Math.cos(a) * o.rad);
    // portrait: him centred and low in the frame (text above and below), a wider lens
    const port = portrait(), chest = V(HIS.x, o.ty + (port ? 0.35 : 0), HIS.z);
    const right = chest.clone().sub(p).cross(V(0, 1, 0)).normalize();
    return { p, q: look(p, chest.addScaledVector(right, port ? 0 : -o.side)), mm: o.mm * (port ? 0.72 : 1) };
  };
  const pose = (c) => (c.orbit ? orbitPose(c.orbit) : { p: c.p, q: look(c.p, portrait() && c.mt ? c.mt : c.t), mm: c.mm * (portrait() ? 0.62 : 1) });
  const camAt = (s) => {
    const i0 = Math.floor(clamp(s, 0, ORDER.length - 1)), i1 = Math.min(i0 + 1, ORDER.length - 1);
    const A = SHOTS[ORDER[i0]], B = SHOTS[ORDER[i1]];
    let u = s - i0;
    if (A.orbit && B.orbit) { const o = {}; for (const k in A.orbit) o[k] = lerp(A.orbit[k], B.orbit[k], u); return orbitPose(o); }
    if (B.whip) u = smooth(ramp(u, 0.4, 0.6)); // the whip pan: the whole turn inside a short stretch of scroll
    const a = pose(A), b = pose(B), p = a.p.clone().lerp(b.p, u);
    if (B.pass) p.x += Math.sin(u * Math.PI) * 1.8; // from his front onto the path: the clockwise circle carries on round his right
    if (B.arc) p.y += Math.sin(u * Math.PI) * 2.5; // clears the veranda without looking down on the garden
    return { p, q: a.q.clone().slerp(b.q, u), mm: lerp(a.mm, b.mm, u) };
  };

  // ---------------- adaptive resolution
  let acc = 0, frames = 0, lastAdapt = 0;
  const adapt = (dt) => {
    acc += dt; frames++;
    if (acc < 1.2) return;
    const avg = acc / frames; acc = 0; frames = 0;
    const now = performance.now(); if (now - lastAdapt < 1500) return;
    let next = pixelRatio;
    if (avg > 1 / 45) next = Math.max(PR_MIN, pixelRatio * 0.85); else if (avg < 1 / 58) next = Math.min(PR_MAX, pixelRatio * 1.08);
    if (Math.abs(next - pixelRatio) > 0.02) {
      pixelRatio = next; lastAdapt = now; partU.px.value = pixelRatio;
      renderer.setPixelRatio(pixelRatio); renderer.setSize(window.innerWidth, window.innerHeight, false);
      if (composer) { composer.setPixelRatio(pixelRatio); composer.setSize(window.innerWidth, window.innerHeight); }
    }
  };

  // ---------------- frame
  let raf = 0, last = performance.now(), clock = 0, first = true, shownClock = "";
  const cur = { p: V(), q: new THREE.Quaternion(), mm: 45 };
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(canvas);
  const frame = () => {
    raf = requestAnimationFrame(frame);
    const now = performance.now(), dt = Math.min((now - last) / 1000, 1 / 20); last = now;
    if (!visible || document.hidden || !ready) return;
    const s = SNAP && SHOTS[SNAP] ? ORDER.indexOf(SNAP) : shotAt(anchors, window.scrollY);

    // time: flows, slows to a stop, stays frozen (inching forward only while you scroll), then resumes
    const scale = s < FROZEN[0] ? 1 - smooth(s / FROZEN[0]) : s < FROZEN[1] ? 0 : smooth(ramp(s, FROZEN[1], FROZEN[1] + 1));
    clock += dt * (SNAP ? 0 : scale);
    const t = 4 + clock + 0.3 * clamp(s - FROZEN[0], 0, FROZEN[1] - FROZEN[0]);
    partU.t.value = t;
    if (clockEl) {
      const txt = new Date(t * 1000).toISOString().slice(11, 23);
      if (txt !== shownClock) { shownClock = txt; clockEl.firstChild.textContent = txt; clockEl.dataset.frozen = scale === 0 ? "1" : "0"; }
    }

    // theme crossfade
    if (themeK !== themeTo) { themeK = Math.abs(themeTo - themeK) < 0.02 ? themeTo : lerp(themeK, themeTo, 1 - Math.exp(-dt * 7)); applyTheme(themeK); }

    // camera: the shot for this scroll position, eased; Work leans toward the open row's target
    const c = camAt(s);
    work.cur = lerp(work.cur, work.focus, 1 - Math.exp(-dt * 3));
    const wk = clamp(1 - Math.abs(s - ORDER.indexOf("s05")), 0, 1);
    if (wk > 0) {
      const tz = lerp(TARGETS[0][1], TARGETS[3][1], work.cur / 3) - 10.4;
      c.p.z += tz * 0.25 * wk; c.p.x -= 0.4 * wk * smooth(clamp(work.cur, 0, 1));
      c.q.premultiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), -tz * 0.05 * wk));
    }
    const k = first || SNAP ? 1 : 1 - Math.exp(-dt * 6); first = false;
    cur.p.lerp(c.p, k); cur.q.slerp(c.q, k); cur.mm = lerp(cur.mm, c.mm, k);
    camera.position.copy(cur.p); camera.quaternion.copy(cur.q);
    camera.translateX(pointer.x * 0.06); camera.translateY(-pointer.y * 0.03); // pointer parallax: a small lean
    camera.fov = mmToFov(cur.mm); camera.updateProjectionMatrix();

    // him: P1 until the camera is at Work, then P6 (swapped while he is off-screen); the ghosts condense as you reach them
    if (him.p1) { const late = s >= ORDER.indexOf("s05") + 0.5; him.p1.visible = !late || !him.p6; if (him.p6) him.p6.visible = late; }
    for (const g of ghosts) {
      const k = smooth(ramp(0.6 - Math.abs(s - g.at), 0, 0.4)); // 1 within ±0.2 of its stop, 0 beyond ±0.6
      g.solid.value = k; g.body.visible = k > 0.001;
      g.ghost.group.visible = k < 0.999 && s < ORDER.indexOf("s05") + 0.5; g.ghost.mat.opacity = 0.4 * (1 - k);
    }

    if (composer) { grain.uniforms.seed.value = (now * 0.0073) % 100; grain.uniforms.vig.value = 1 - themeK * 0.7; composer.render(dt); }
    else renderer.render(scene, camera);
    adapt(dt);
  };
  frame();
  if (SNAP) window.__film = { THREE, scene, camera };

  return () => {
    cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect();
    rows.forEach((d) => d.removeEventListener("toggle", onToggle));
    window.removeEventListener("resize", onResize); window.removeEventListener("pointermove", onPointer);
    renderer.dispose(); composer?.dispose();
  };
}
