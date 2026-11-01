// /experimental/v7 · "Facing the Moon" (storyboard v7).
// One line through the world: blood moon (−Z) · far shore with pines · the lake · HIM on his stone
// at the origin, facing the moon · the lantern path · the house on the near shore (+Z).
// The camera faces the house for the first five shots and turns to the moon only at Contact.
//
// Plain JS so the world code can be ported 1:1 from the previz (design/previz/scene5.js).
// Generated assets: ronin, lantern, house (public/experimental/v6). Everything else is
// placeholder geometry until the remaining assets arrive.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
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

// ------------------------------------------------------------------ layout
const MOON_POS = V(-30, 30, -320);
const HIS = V(0, 0.13, 0);
const PATH = { z0: 1.0, z1: 35, y: 0.32 };
const LANTERNS = [[1.5, 7], [-1.5, 14], [1.5, 21], [-1.5, 28]];
const HOUSE = V(6, 0.4, 45);
const TARGETS = V(-6.5, 0.41, 39);
const ARMS = V(HOUSE.x + 2.4, 0.41, 38.6);
const WARM = new THREE.Color(0xffc985), PAPER = new THREE.Color(0xffe2b4), MOONC = new THREE.Color(0xff5a48), SEAM = 0xffd6cc;

// ------------------------------------------------------------------ shots
// Path shots: [pos, target, lens mm], for landscape (d) and portrait (m).
// Orbit shots circle him: { ang (deg, 0 = behind him, ±180 = in front; he faces −Z and his left is −X),
// rad, y (camera height), ty (look-at height), side (m: pushes him toward screen-right, room for text), mm }.
// The orbit runs the long way: front-left → his left → behind him → his right → his front (the slash).
const ORBIT = {
  c01: { d: { ang: -115, rad: 2.7, y: 1.15, ty: 1.2, side: 0.95, mm: 40 }, m: { ang: -115, rad: 3.0, y: 1.05, ty: 1.45, side: 0, mm: 30 } },
  c01b: { d: { ang: 0, rad: 2.9, y: 1.0, ty: 1.3, side: 0.2, mm: 38 }, m: { ang: 0, rad: 3.2, y: 0.95, ty: 1.5, side: 0, mm: 28 } },
  c02: { d: { ang: 180, rad: 3.1, y: 0.95, ty: 1.35, side: 0.8, mm: 34 }, m: { ang: 180, rad: 3.4, y: 0.9, ty: 1.55, side: 0, mm: 24 } },
};
const SHOT = {
  // c02h: holds the c02 framing while About is read (defined below from ORBIT.c02)
  // low over the planks, looking down the path to the house
  c03a: { d: [V(0.45, 0.8, 3.2), V(0.1, 1.05, 45), 30], m: [V(0.35, 0.8, 3.2), V(0.12, 1.6, 45), 20] },
  c03b: { d: [V(0.4, 0.85, 27), V(0.3, 1.15, 45), 30], m: [V(0.3, 0.85, 27), V(0.2, 1.7, 45), 20] },
  c04: { d: [V(TARGETS.x + 6.6, 1.2, TARGETS.z - 3.4), V(TARGETS.x + 5.7, 0.8, TARGETS.z + 2.1), 32], m: [V(TARGETS.x + 5.6, 1.25, TARGETS.z - 3.6), V(TARGETS.x + 4.1, 0.95, TARGETS.z + 0.7), 22] },
  c05: { d: [V(ARMS.x - 0.2, ARMS.y + 0.95, ARMS.z - 3.1), V(ARMS.x - 0.3, ARMS.y + 0.8, ARMS.z), 32], m: [V(ARMS.x + 0.15, ARMS.y + 0.62, ARMS.z - 3.5), V(ARMS.x - 0.12, ARMS.y + 1.0, ARMS.z), 20] },
  c06: { d: [V(0.75, 1.15, 6.2), V(-6.4, 7.0, -60), 55], m: [V(0.45, 1.0, 5.4), V(-4.3, 6.6, -60), 34] },
};
ORBIT.c02h = ORBIT.c02;
const ORDER = ["c01", "c01b", "c02", "c02h", "c03a", "c03b", "c04", "c05", "c06"];

function glowTexture(r, g, b, soft = 1) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");
  const gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gr.addColorStop(0.2 * soft, `rgba(${r},${g},${b},.35)`);
  gr.addColorStop(0.55, `rgba(${r},${g},${b},.07)`);
  gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr;
  x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
function canvasTex(w, h, draw, srgb) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ------------------------------------------------------------------ scroll anchors ([data-shot] elements)
function readAnchors(root) {
  const vh = window.innerHeight;
  const max = Math.max(1, document.documentElement.scrollHeight - vh);
  const out = [];
  root.querySelectorAll("[data-shot]").forEach((el) => {
    const idx = ORDER.indexOf(el.dataset.shot);
    if (idx < 0) return;
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    const y = el.dataset.at !== undefined ? top - vh * +el.dataset.at : top + r.height / 2 - vh / 2;
    out.push({ idx, y: clamp(y, 0, max) });
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
export function startFilm({ canvas, root, base, onProgress, onReady }) {
  const mobile = window.matchMedia("(max-width: 767px)").matches || navigator.maxTouchPoints > 1;
  const hi = !mobile;
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  const PR_MAX = Math.min(window.devicePixelRatio, 1.5), PR_MIN = hi ? 0.75 : 0.6;
  let pixelRatio = Math.min(PR_MAX, hi ? 1.5 : 1.0);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const dustScene = new THREE.Scene();
  const FOG = new THREE.Color(0x160707);
  scene.fog = new THREE.FogExp2(FOG, 0.012);
  const WARM_GLOW = glowTexture(255, 200, 140);

  // ---------------- sky + blood moon
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x0b0303) }, hor: { value: new THREE.Color(0x3a0e0a) } },
    vertexShader: "varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }",
    fragmentShader: `varying vec3 p; uniform vec3 top; uniform vec3 hor;
      float h(vec3 q){ return fract(sin(dot(q, vec3(12.9898,78.233,37.719)))*43758.5453); }
      void main(){ vec3 n = normalize(p); float t = smoothstep(-0.02, 0.45, n.y); vec3 c = mix(hor, top, t);
        vec3 q = floor(n*520.); float s = step(0.998, h(q)) * smoothstep(0.08, 0.5, n.y) * (0.4 + 0.6*h(q+1.));
        gl_FragColor = vec4(c + s*0.5, 1.); }`,
  })));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(34, 64, 32), new THREE.ShaderMaterial({
    fog: false, uniforms: { col: { value: new THREE.Color(0xe0503e) } },
    vertexShader: "varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }",
    fragmentShader: `varying vec3 p; uniform vec3 col;
      float hash(vec3 q){ return fract(sin(dot(q, vec3(127.1,311.7,74.7)))*43758.5453); }
      float noise(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
        return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float fbm(vec3 q){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*noise(q); q*=2.1; a*=.5; } return s; }
      void main(){ vec3 q = normalize(p); float maria = smoothstep(.42,.8, fbm(q*0.9+3.)); float m = fbm(q*2.5);
        gl_FragColor = vec4(col*(0.85 + 0.15*m)*(1. - .2*maria)*0.95, 1.); }`,
  }));
  moon.position.copy(MOON_POS);
  scene.add(moon);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(230, 70, 50), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: hi ? 0.75 : 1 }));
  halo.scale.setScalar(300);
  halo.position.copy(MOON_POS);
  scene.add(halo);

  // ---------------- environment and lights (the light count never changes)
  {
    const pm = new THREE.PMREMGenerator(renderer);
    const es = new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ color: 0x180606, side: THREE.BackSide })));
    const spot = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 8), new THREE.MeshBasicMaterial({ color: 0xff6050 }));
    spot.position.copy(MOON_POS).normalize().multiplyScalar(40);
    es.add(spot);
    const warm = new THREE.Mesh(new THREE.PlaneGeometry(30, 6), new THREE.MeshBasicMaterial({ color: 0x8a6030, side: THREE.DoubleSide }));
    warm.position.set(0, 0, 40);
    es.add(warm);
    scene.environment = pm.fromScene(es, 0.03).texture;
    pm.dispose();
  }
  const key = new THREE.DirectionalLight(MOONC, 1.4);
  key.position.copy(MOON_POS).normalize().multiplyScalar(40);
  scene.add(key, key.target);
  scene.add(new THREE.HemisphereLight(0x2a100c, 0x050202, hi ? 0.35 : 0.6));
  const point = (color, intensity, dist, x, y, z) => {
    if (!hi) return; // phones: emissive + glow + light pools carry the look
    const l = new THREE.PointLight(color, intensity, dist, 1.5);
    l.position.set(x, y, z);
    scene.add(l);
  };

  // ---------------- water
  const texLoader = new THREE.TextureLoader();
  const wn = [texLoader.load(`${base}/../Water_1_M_Normal.jpg`), texLoader.load(`${base}/../Water_2_M_Normal.jpg`)];
  for (const t of wn) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  const reflScale = hi ? 0.6 : 0.25;
  const water = new Reflector(new THREE.PlaneGeometry(1500, 1500), {
    textureWidth: Math.round(window.innerWidth * reflScale), textureHeight: Math.round(window.innerHeight * reflScale), clipBias: 0.002, multisample: hi ? 4 : 0,
    shader: {
      name: "WaterShader",
      uniforms: { color: { value: new THREE.Color(0x3a2220) }, tDiffuse: { value: null }, textureMatrix: { value: null }, n1: { value: wn[0] }, n2: { value: wn[1] }, deep: { value: new THREE.Color(0x080202) }, fogC: { value: FOG }, time: { value: 0 } },
      vertexShader: "uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW; void main(){ vUv = textureMatrix * vec4(position, 1.); vW = (modelMatrix*vec4(position,1.)).xyz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }",
      fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; uniform sampler2D n1; uniform sampler2D n2; uniform vec3 deep; uniform vec3 fogC; uniform float time; varying vec4 vUv; varying vec3 vW;
        void main(){ vec2 p = vW.xz; vec3 a = texture2D(n1, p*0.045 + vec2(time*0.01, time*0.006)).rgb*2.-1.; vec3 b = texture2D(n2, p*0.11 - vec2(time*0.008, -time*0.011)).rgb*2.-1.; vec2 n = (a.rg+b.rg)*0.5;
          float dist = length(cameraPosition - vW); vec4 uv = vUv; uv.xy += n*(0.016 + dist*0.0008)*uv.w;
          vec3 r = vec3(0.); float bl = 0.002 + dist*0.0001;
          for (int i=0;i<5;i++){ vec2 o = vec2(float(i)-2., float(i*3-(i*3/5)*5)-2.)*bl*uv.w; r += texture2DProj(tDiffuse, vec4(uv.xy+o, uv.zw)).rgb; } r /= 5.;
          vec3 v = normalize(cameraPosition - vW); float fres = 0.08 + 0.92*pow(1. - max(v.y, 0.), 4.);
          vec3 c = mix(deep, r*color*2.2, clamp(fres*1.25, 0., 1.)); float f = 1. - exp(-pow(0.022*dist, 2.)); c = mix(c, fogC, f*0.85);
          gl_FragColor = vec4(c, 1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    },
  });
  water.rotation.x = -Math.PI / 2;
  scene.add(water);
  if (!hi) { const reflect = water.onBeforeRender.bind(water); let n = 0; water.onBeforeRender = (...a) => { if (n++ % 2 === 0) reflect(...a); }; }
  const waterU = water.material.uniforms;

  // ---------------- materials
  const woodTex = canvasTex(1024, 128, (x) => { x.fillStyle = "#4a4038"; x.fillRect(0, 0, 1024, 128); for (let j = 0; j < 128; j += 2) { x.fillStyle = `rgba(10,8,6,${0.2 + Math.random() * 0.35})`; x.fillRect(0, j + Math.sin(j) * 2, 1024, 1); } }, true);
  const stoneTex = canvasTex(256, 256, (x) => { const img = x.createImageData(256, 256); for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const v = 110 + 40 * Math.sin(i * 0.1 + Math.sin(j * 0.06) * 3) * Math.sin(j * 0.08) + (Math.random() - 0.5) * 70; const k = (j * 256 + i) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = v; img.data[k + 3] = 255; } x.putImageData(img, 0, 0); });
  const Std = (o) => new THREE.MeshStandardMaterial(o);
  const M = {
    timberDark: Std({ map: woodTex, color: 0x2e2a26, roughness: 0.7 }),
    timber: Std({ map: woodTex, color: 0x6a625a, roughness: 0.78 }),
    plank: Std({ map: woodTex, color: 0x5a5450, roughness: 0.8 }),
    stone: Std({ color: 0x3a3b3e, roughness: 0.85, map: stoneTex, bumpMap: stoneTex, bumpScale: 3 }),
    lacquer: hi ? new THREE.MeshPhysicalMaterial({ color: 0x0c0c0d, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.15 }) : Std({ color: 0x0c0c0d, roughness: 0.3 }),
    steel: Std({ color: 0xe6e8ec, roughness: 0.1, metalness: 1, envMapIntensity: 2 }),
    iron: Std({ color: 0x2a2a2d, roughness: 0.45, metalness: 0.85 }),
    seam: new THREE.MeshBasicMaterial({ color: SEAM, transparent: true, opacity: 0.6, toneMapped: false }),
    flame: new THREE.MeshBasicMaterial({ color: 0xffe0b0, toneMapped: false }),
  };
  const box = (w, h, d, mat, x, y, z, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
  const pool = (x, y, z, r, k = 0.5) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: WARM_GLOW, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: k })); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); p.renderOrder = 3; scene.add(p); return p; };
  const glow = (x, y, z, s, k = 0.6, map = WARM_GLOW) => { const g = new THREE.Sprite(new THREE.SpriteMaterial({ map, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: k })); g.position.set(x, y, z); g.scale.setScalar(s); scene.add(g); return g; };

  // ---------------- far layers: three ridges, lighter with distance
  const ridge = (z, height, color, s, width) => {
    const sh = new THREE.Shape(); const N = 120; sh.moveTo(-width / 2, -5);
    for (let i = 0; i <= N; i++) { const t = i / N; sh.lineTo(-width / 2 + t * width, height * (0.45 + 0.3 * Math.sin(t * 7 + s) + 0.18 * Math.sin(t * 19 + s * 2) + 0.07 * Math.sin(t * 53 + s * 3))); }
    sh.lineTo(width / 2, -5); sh.closePath();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color, fog: false })); m.position.z = z; scene.add(m);
  };
  ridge(-300, 24, 0x2a0b09, 1.0, 1400); ridge(-190, 18, 0x1c0706, 2.3, 1000); ridge(-110, 11, 0x110404, 4.1, 700);

  // ---------------- land
  box(140, 0.8, 30, M.stone, 0, 0, -62);
  box(120, 0.8, 44, M.stone, 0, 0, 56);
  { const sand = new THREE.Mesh(new THREE.PlaneGeometry(70, 7), Std({ color: 0x2e2826, roughness: 1 })); sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.41, 37); scene.add(sand); }

  // ---------------- pines along the far shore (placeholder)
  {
    const bark = Std({ color: 0x0a0605, roughness: 0.95 }), needles = new THREE.MeshBasicMaterial({ color: 0x060303 });
    const pine = (x, z, h, lean, sp) => {
      const r = () => ((sp = (sp * 16807) % 2147483647) / 2147483647);
      const g = new THREE.Group(); g.position.set(x, 0.4, z); scene.add(g);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, 0, 0), V(lean * 0.3, h * 0.35, 0), V(lean * 0.7, h * 0.7, (r() - 0.5) * 1.5), V(lean, h, (r() - 0.5) * 1.5)]), 24, h * 0.025, 8), bark));
      const pads = 4 + Math.floor(r() * 3);
      for (let i = 0; i < pads; i++) {
        const t = 0.45 + (i / pads) * 0.6, s = h * (0.17 - 0.06 * (i / pads)) * (0.8 + r() * 0.5), side = (i % 2 ? 1 : -1) * (0.5 + r()) * h * 0.12;
        const p = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 7), needles); p.scale.set(s, s * 0.28, s * 0.75); p.position.set(lean * t + side, Math.min(h, h * t), (r() - 0.5) * 2); g.add(p);
        g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(lean * t * 0.9, h * t * 0.92, 0), p.position.clone()]), 6, h * 0.008, 5), bark));
      }
    };
    [[-58, -48, 14, 3], [-44, -49, 10, -2], [-34, -47, 16, 4], [-24, -50, 9, 1], [-13, -48, 12, -3], [-3, -49, 8, 2], [8, -47, 13, 5], [20, -50, 10, -2], [33, -48, 15, 3], [47, -49, 11, -4]]
      .forEach(([x, z, h, l], i) => pine(x, z, h, l, 101 + i * 37));
  }

  // ---------------- reeds (placeholder)
  {
    const geo = new THREE.ConeGeometry(0.012, 1, 3); geo.translate(0, 0.5, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0x050202 });
    const reeds = (cx, cz, r, n, hMin = 0.7, hMax = 1.6) => {
      const im = new THREE.InstancedMesh(geo, mat, n); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V();
      for (let i = 0; i < n; i++) { const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * r; q.setFromEuler(new THREE.Euler((rand() - 0.5) * 0.35, 0, (rand() - 0.5) * 0.35)); sc.set(1 + rand(), hMin + rand() * (hMax - hMin), 1 + rand()); m4.compose(V(cx + Math.cos(a) * d, 0, cz + Math.sin(a) * d), q, sc); im.setMatrixAt(i, m4); }
      scene.add(im);
    };
    reeds(-14, -45, 5, 260); reeds(14, -45, 5, 260); reeds(0, -45, 4, 160);
    reeds(-9, 35, 3, 220); reeds(9, 35, 3, 200);
    // near him, but outside the camera's orbit (radius 2.7–3.4)
    reeds(-5.0, 2.6, 0.7, 60, 0.4, 1.1); reeds(4.8, -2.0, 0.7, 50, 0.4, 1.0); reeds(-4.3, -3.7, 0.6, 40, 0.3, 0.9); reeds(1.4, -1.6, 0.25, 14, 0.3, 0.7);
  }

  // ---------------- his stone (placeholder)
  {
    const st = new THREE.Mesh(new RoundedBoxGeometry(1.3, 0.26, 1.1, 4, 0.1), M.stone); st.position.copy(HIS).setY(0); scene.add(st);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.065, 96), new THREE.MeshBasicMaterial({ color: SEAM, transparent: true, opacity: 0.22, toneMapped: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.012, 0); scene.add(ring);
  }

  // ---------------- the lantern path: generated walkway segments (placed once loaded) and its light seam
  const DECK = PATH.y + 0.04;
  box(0.012, 0.004, PATH.z1 - PATH.z0, M.seam, 0, DECK + 0.012, (PATH.z0 + PATH.z1) / 2);
  for (const [x, z] of LANTERNS) {
    glow(x * 1.05, 1.62, z, 2.4, 0.6);
    pool(x * 0.55, PATH.y + 0.05, z, 2.1, 0.32);
    pool(x * 1.3, 0.02, z, 3.2, 0.2);
    point(WARM, 4, 8, x * 1.05, 1.7, z);
  }

  // ---------------- WORK: the cut targets in the yard and the fire basket (generated models, placed once loaded)
  const BRAZIER = V(TARGETS.x + 3.3, TARGETS.y, TARGETS.z + 1.9);
  {
    const bx = BRAZIER.x, bz = BRAZIER.z, by = BRAZIER.y;
    const fire = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.4, 8), new THREE.MeshBasicMaterial({ color: 0xffb060, toneMapped: false })); fire.position.set(bx, by + 1.5, bz); scene.add(fire);
    glow(bx, by + 1.55, bz, 3.2, 0.8); pool(bx - 1.2, by + 0.02, bz - 1.2, 3.6, 0.4); pool(TARGETS.x + 4.2, TARGETS.y + 0.02, TARGETS.z + 0.9, 3.2, 0.22);
    point(0xff9a50, 14, 9, bx, by + 1.7, bz);
  }

  // ---------------- TOOLKIT: the weapons in front of the house (placeholders)
  {
    const blade = (L, w, curve) => {
      const N = 40, cx = (t) => -curve * t * t, s = new THREE.Shape();
      s.moveTo(cx(0) + w / 2, 0); for (let i = 1; i <= N; i++) { const t = (i / N) * 0.93; s.lineTo(cx(t) + (w / 2) * (1 - 0.28 * t), t * L); }
      s.lineTo(cx(1) - w * 0.32, L); for (let i = N; i >= 0; i--) { const t = (i / N) * 0.97; s.lineTo(cx(t) - (w / 2) * (1 - 0.28 * t), t * L); }
      return new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.0035, bevelEnabled: true, bevelThickness: 0.0025, bevelSize: 0.004, bevelSegments: 2 }), M.steel);
    };
    const weapon = (L, hilt, w, curve, drawn) => {
      const g = new THREE.Group(), sw = new THREE.Group(); sw.add(blade(L, w, curve));
      sw.add(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.007, 8), M.iron));
      const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.015, hilt, 16), M.lacquer); tk.position.y = -hilt / 2; sw.add(tk);
      sw.rotation.z = -Math.PI / 2; sw.position.x = -drawn; g.add(sw);
      const saya = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.016, L + 0.04, 16), M.lacquer); saya.rotation.z = -Math.PI / 2; saya.position.x = (L + 0.04) / 2; saya.scale.set(1.3, 1, 0.75); g.add(saya);
      const koi = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0022, 6, 24), M.seam); koi.rotation.y = Math.PI / 2; g.add(koi);
      return g;
    };
    const arms = new THREE.Group(); arms.position.copy(ARMS); scene.add(arms);
    box(1.5, 0.06, 0.4, M.lacquer, 0, 0.03, 0, arms);
    for (const x of [-0.55, 0.55]) box(0.06, 0.62, 0.24, M.lacquer, x, 0.34, 0, arms);
    const kat = weapon(0.72, 0.27, 0.031, 0.032, 0.18); kat.position.set(-0.5, 0.58, 0.03); arms.add(kat);
    const wak = weapon(0.5, 0.18, 0.028, 0.025, 0); wak.position.set(-0.38, 0.4, 0.03); arms.add(wak);
    const tan = weapon(0.27, 0.12, 0.026, 0, 0); tan.position.set(-0.2, 0.2, 0.03); arms.add(tan);
    const bow = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, 0, 0), V(0.12, 0.5, 0), V(0.05, 1.0, 0), V(0.12, 1.6, 0), V(0, 2.1, 0)]), 60, 0.016, 8), M.lacquer); bow.position.set(1.1, 0, -0.1); bow.rotation.z = 0.12; arms.add(bow);
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 2.1, 4), M.seam); string.position.set(0.97, 1.05, -0.1); string.rotation.z = 0.12; arms.add(string);
    const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.75, 16), M.lacquer); quiver.position.set(1.45, 0.38, 0.05); quiver.rotation.z = -0.1; arms.add(quiver);
    arms.rotation.y = Math.PI;
    pool(ARMS.x - 0.3, ARMS.y + 0.01, ARMS.z - 0.3, 1.8, 0.35);
    const shade = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.3), new THREE.MeshBasicMaterial({ color: 0xffd8a0, toneMapped: false })); shade.position.set(ARMS.x + 2.2, ARMS.y + 0.35, ARMS.z + 0.2); scene.add(shade);
    glow(ARMS.x + 2.2, ARMS.y + 0.6, ARMS.z + 0.2, 2.2, 0.55);
    point(WARM, 4, 6, ARMS.x + 1.4, ARMS.y + 0.8, ARMS.z + 0.2);
  }

  // ---------------- mist (baked noise texture) and dust
  const mistNoise = (() => {
    const N = 256, cells = 8, data = new Uint8Array(N * N * 4);
    const vn = (x, y, P) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
      const r = (a, b) => { const v = Math.sin((((a % P) + P) % P) * 127.1 + (((b % P) + P) % P) * 311.7 + P) * 43758.5453; return v - Math.floor(v); };
      const a = r(xi, yi), b = r(xi + 1, yi), c = r(xi, yi + 1), d = r(xi + 1, yi + 1); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { let v = 0, k = 0.5, f = 1; for (let o = 0; o < 5; o++) { v += k * vn((i / N) * cells * f, (j / N) * cells * f, cells * f); k *= 0.5; f *= 2; } const q = (j * N + i) * 4; data[q] = data[q + 1] = data[q + 2] = Math.round(v * 255); data[q + 3] = 255; }
    const t = new THREE.DataTexture(data, N, N); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true; return t;
  })();
  const mistMats = [];
  {
    const n = hi ? 8 : 3, top = 1.3, size = 120;
    for (let i = 0; i < n; i++) {
      const y = 0.05 + (n > 1 ? (i / (n - 1)) ** 1.5 : 0.3) * top;
      const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false,
        uniforms: { noise: { value: mistNoise }, seed: { value: i * 0.137 + 0.05 }, a: { value: ((0.07 * (1 - y / (top * 1.15)) * 9) / Math.max(n, 3)) * (n < 6 ? 0.8 : 1) }, time: { value: 0 } },
        vertexShader: "varying vec3 w; void main(){ w = (modelMatrix*vec4(position,1.)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(w,1.); }",
        fragmentShader: `varying vec3 w; uniform sampler2D noise; uniform float seed; uniform float a; uniform float time;
          void main(){ vec2 uv = w.xz*0.0275 + vec2(seed, seed*1.7);
            float d = texture2D(noise, uv + vec2(time*0.005, time*0.002)).r*0.65 + texture2D(noise, uv*2.3 - vec2(time*0.004, 0.)).r*0.35; d = smoothstep(0.42, 0.78, d);
            float cam = smoothstep(0.8, 4.0, length(cameraPosition - w)); float edge = 1. - smoothstep(36., 60., length(w.xz - vec2(0., -8.)));
            gl_FragColor = vec4(vec3(0.34,0.14,0.12), d*a*cam*edge); }` });
      mistMats.push(m);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m); p.rotation.x = -Math.PI / 2; p.position.set(0, y, -8); p.renderOrder = 2; scene.add(p);
    }
  }
  const dustMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { moon: { value: MOON_POS }, time: { value: 0 }, px: { value: Math.min(window.devicePixelRatio, 1.5) } },
    vertexShader: `attribute float sz; varying float vA; uniform vec3 moon; uniform float time; uniform float px;
      void main(){ vec3 pos = position; pos.x += sin(time*0.3 + position.y*2.)*0.15; pos.y += sin(time*0.2 + position.x)*0.1;
        vec4 mv = modelViewMatrix*vec4(pos,1.); gl_Position = projectionMatrix*mv;
        float d = -mv.z; float near = smoothstep(2.5, 0.6, d); gl_PointSize = min(sz * 14. / d * (1. + near*5.), 70.) * px;
        float fwd = pow(max(dot(-normalize(cameraPosition - pos), normalize(moon - pos)), 0.), 6.);
        vA = (0.16 + 1.4*fwd) * smoothstep(0.9, 1.8, d) * (1. - smoothstep(25., 55., d)) / (1. + near*12.); }`,
    fragmentShader: "varying float vA; void main(){ float r = length(gl_PointCoord-.5); float a = 1. - smoothstep(0., .5, r); gl_FragColor = vec4(vec3(1.0,0.62,0.55), a*a*vA); }" });
  {
    const count = hi ? 2400 : 900, pos = new Float32Array(count * 3), sz = new Float32Array(count);
    for (let i = 0; i < count; i++) { pos[i * 3] = (rand() - 0.5) * 40; pos[i * 3 + 1] = rand() * 9; pos[i * 3 + 2] = 42 - rand() * 70; sz[i] = 0.6 + rand() ** 3 * 3; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("sz", new THREE.BufferAttribute(sz, 1));
    const pts = new THREE.Points(geo, dustMat); pts.frustumCulled = false; dustScene.add(pts);
  }

  // ---------------- the slash: a crescent of light in front of him, swept by scroll (procedural until the rig arrives)
  const slashMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, toneMapped: false,
    uniforms: { head: { value: 0 }, fade: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }",
    fragmentShader: `varying vec2 vUv; uniform float head; uniform float fade;
      void main(){ float u = vUv.x; if (u > head) discard;
        float age = 1. - (head - u) * 1.35 * (1. - smoothstep(0.85, 1.05, head));   // once the cut completes, the whole crescent hangs in the air                      // bright at the head, fading tail
        float edge = smoothstep(0.2, 1.0, vUv.y), core = smoothstep(0.93, 1.0, vUv.y);
        float a = clamp(age, 0., 1.); a = a*a*a * edge * edge * (1. - fade);
        vec3 c = mix(vec3(1.0, 0.25, 0.18), vec3(1.0, 0.95, 0.9), core);
        gl_FragColor = vec4(c * (0.5 + 2.8*core), a * 0.8); }` });
  {
    // a ribbon between two radii around his chest, from low at his left hip (−X) to high above his right shoulder (+X)
    const N = 48, r0 = 0.62, r1 = 1.05, a0 = (205 * Math.PI) / 180, a1 = (35 * Math.PI) / 180;
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = a0 + (a1 - a0) * t;
      for (const [r, v] of [[r0, 0], [r1, 1]]) { pos.push(Math.cos(a) * r, Math.sin(a) * r, 0); uv.push(t, v); }
      if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const slash = new THREE.Mesh(g, slashMat);
    slash.position.set(HIS.x, HIS.y + 1.2, HIS.z - 0.45);   // just in front of him (he faces −Z)
    slash.rotation.set(0.15, 0, -0.1);
    // angle 205° is low on −X (his left hip, since he faces −Z); 35° is high on +X (above his right shoulder)
    scene.add(slash);
  }
  const fill = () => point(0xffb070, 2.5, 6, HIS.x - 0.8, 2.6, HIS.z + 2.0);
  fill();

  // ---------------- assets
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const suffix = hi ? "" : "-mobile";
  const NAMES = ["ronin", "lantern", "house", "walkway", "lantern_base", "brazier", "targets"];
  const files = Object.fromEntries(NAMES.map((n) => [n, `${base}/${n}${n === "lantern_base" ? "" : suffix}.glb`]));
  const progress = {};
  const report = () => onProgress?.(0.95 * (Object.values(progress).reduce((a, b) => a + b, 0) / NAMES.length));
  const load = (name) => new Promise((res) => loader.load(files[name], res, (e) => { if (e.total) { progress[name] = e.loaded / e.total; report(); } }, () => res(null)));
  let ready = false;
  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.05, 3000);
  Promise.all(NAMES.map(load)).then(([ronin, lantern, house, walkway, lanternBase, brazier, targets]) => {
    const topOf = (o) => new THREE.Box3().setFromObject(o).max.y;
    if (walkway) {
      // 5.2 m segments laid end to end along the path, deck top at DECK (the posts go down into the water)
      const seg = walkway.scene; seg.rotation.y = Math.PI / 2; seg.updateMatrixWorld(true);
      const lift = DECK - topOf(seg), len = 5.2, n = Math.ceil((PATH.z1 - PATH.z0) / len);
      for (let i = 0; i < n; i++) { const w = i ? seg.clone() : seg; w.position.set(0, lift, PATH.z0 + len / 2 + i * len); scene.add(w); }
    }
    if (lanternBase) {
      // untextured model: the scene's stone material
      lanternBase.scene.traverse((o) => { if (o.isMesh) o.material = M.stone; });
      for (const [x, z] of LANTERNS) { const b = lanternBase.scene.clone(); b.position.set(x * 1.05, -0.3, z); b.rotation.y = x > 0 ? 0.3 : -0.4; scene.add(b); }
    }
    if (brazier) { brazier.scene.position.copy(BRAZIER); scene.add(brazier.scene); }
    if (targets) {
      // the cut set, turned toward the Work camera
      targets.scene.position.set(TARGETS.x + 4.4, TARGETS.y, TARGETS.z + 0.9); targets.scene.rotation.y = 2.6; scene.add(targets.scene);
    }
    if (ronin) {
      const r = ronin.scene; r.position.copy(HIS); r.rotation.y = Math.PI; // faces the moon
      r.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; if (o.material) o.material.envMapIntensity = 0.6; } });
      scene.add(r);
    }
    if (lantern) {
      for (const [x, z] of LANTERNS) {
        const l = lantern.scene.clone(); l.position.set(x * 1.05, 0.3, z); l.scale.setScalar(0.92); scene.add(l);
        const core = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.22), M.flame); core.position.set(x * 1.05, 0.3 + 1.4 * 0.92, z); scene.add(core);
      }
    }
    if (house) {
      const h = house.scene; h.position.copy(HOUSE); h.rotation.y = Math.PI; // the paper wall faces the lake
      // the shōji glow: the bright (paper) part of the baked texture becomes emissive
      h.traverse((o) => {
        if (!o.isMesh || !o.material || !o.material.map) return;
        const m = o.material; m.emissive = PAPER.clone(); m.emissiveMap = m.map; m.emissiveIntensity = 0.9;
        m.onBeforeCompile = (sh) => {
          sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>", `
            vec3 paperTex = texture2D( emissiveMap, vEmissiveMapUv ).rgb;
            float paperL = dot( paperTex, vec3( 0.299, 0.587, 0.114 ) );
            totalEmissiveRadiance *= smoothstep( 0.62, 0.86, paperL ) * paperTex;`);
        };
        m.customProgramCacheKey = () => "paper-glow";
      });
      scene.add(h);
      const fz = HOUSE.z - 5;
      glow(HOUSE.x, HOUSE.y + 1.8, fz, 6, 0.35); pool(HOUSE.x, HOUSE.y + 0.02, fz - 0.6, 3.5, 0.3);
    }
    point(WARM, 8, 14, HOUSE.x, HOUSE.y + 1.8, HOUSE.z - 5);
    // compile every shader behind the loader so nothing stalls mid-scroll
    renderer.compileAsync(scene, camera).then(() => renderer.compileAsync(dustScene, camera)).catch(() => {}).finally(() => { ready = true; onProgress?.(1); onReady?.(); });
  });

  // ---------------- post: desktop only; phones render straight to the screen
  const composer = hi ? new EffectComposer(renderer) : null;
  let bloom = null;
  if (composer) {
    composer.addPass(new RenderPass(scene, camera));
    const dp = new RenderPass(dustScene, camera); dp.clear = false; dp.clearDepth = true; composer.addPass(dp);
    bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.45, 0.65, 0.78);
    composer.addPass(bloom);
    composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null }, seed: { value: 0 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }",
      fragmentShader: `uniform sampler2D tDiffuse; uniform float seed; varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + seed)*43758.5453); }
        void main(){ vec4 c = texture2D(tDiffuse, vUv); c.rgb *= mix(.5, 1., smoothstep(.95, .3, length(vUv-.5)*1.2)); c.rgb += (h(vUv*1000.)-.5)*.04; gl_FragColor = c; }` }));
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
    composer?.setSize(w, h);
    water.getRenderTarget().setSize(Math.round(w * reflScale), Math.round(h * reflScale));
    refresh();
  };
  window.addEventListener("resize", onResize);

  const variant = () => (window.innerWidth < window.innerHeight ? "m" : "d");
  const look = (p, t) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(p, t, V(0, 1, 0)));
  const orbitPose = (o) => {
    const a = (o.ang * Math.PI) / 180;
    const p = V(HIS.x + Math.sin(a) * o.rad, o.y, HIS.z + Math.cos(a) * o.rad);
    const chest = V(HIS.x, o.ty, HIS.z);
    // aim a little to his side so he sits right of centre: screen-left of him is "right × −side"
    const right = chest.clone().sub(p).cross(V(0, 1, 0)).normalize();
    return { p, q: look(p, chest.clone().addScaledVector(right, -o.side)), mm: o.mm };
  };
  const pose = (name) => {
    if (ORBIT[name]) return orbitPose(ORBIT[name][variant()]);
    const [p, t, mm] = SHOT[name][variant()];
    return { p, q: look(p, t), mm };
  };
  const tmpQ = new THREE.Quaternion();
  const camAt = (s) => {
    const i0 = Math.floor(clamp(s, 0, ORDER.length - 1)), i1 = Math.min(i0 + 1, ORDER.length - 1), u = s - i0;
    const n0 = ORDER[i0], n1 = ORDER[i1];
    if (ORBIT[n0] && ORBIT[n1]) {
      // the circle: interpolate around him (angles are not wrapped, so it goes the long way)
      const a = ORBIT[n0][variant()], b = ORBIT[n1][variant()], o = {};
      for (const k of Object.keys(a)) o[k] = lerp(a[k], b[k], u);
      return orbitPose(o);
    }
    const A = pose(n0), B = pose(n1);
    const p = A.p.clone().lerp(B.p, u);
    if (n0 === "c02h") {
      // from his front onto the path behind him: pass beside him (his right), staying low
      p.x += Math.sin(u * Math.PI) * 1.9;
      p.y -= Math.sin(u * Math.PI) * 0.15;
    } else {
      const dist = A.p.distanceTo(B.p);
      if (dist > 8 && n0 !== "c03a") p.y += Math.sin(u * Math.PI) * Math.min(7, dist * 0.15); // long flights arc up
    }
    return { p, q: tmpQ.copy(A.q).slerp(B.q, u).clone(), mm: lerp(A.mm, B.mm, u) };
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
    if (Math.abs(next - pixelRatio) > 0.02) { pixelRatio = next; lastAdapt = now; renderer.setPixelRatio(pixelRatio); renderer.setSize(window.innerWidth, window.innerHeight, false); if (composer) { composer.setPixelRatio(pixelRatio); composer.setSize(window.innerWidth, window.innerHeight); } }
  };

  // ---------------- frame
  const SNAP = new URLSearchParams(window.location.search).has("snap");
  let raf = 0, last = performance.now(), time = 0, first = true;
  const cur = { p: V(), q: new THREE.Quaternion(), mm: 45 };
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(canvas);
  const frame = () => {
    raf = requestAnimationFrame(frame);
    const now = performance.now(), dt = Math.min((now - last) / 1000, 1 / 20); last = now;
    if (!visible || document.hidden || !ready) return;
    time += dt;
    const s = shotAt(anchors, window.scrollY);
    const t = camAt(s);
    const k = first || SNAP ? 1 : 1 - Math.exp(-dt * 6); first = false;
    cur.p.lerp(t.p, k); cur.q.slerp(t.q, k); cur.mm = lerp(cur.mm, t.mm, k);
    camera.position.copy(cur.p); camera.quaternion.copy(cur.q);
    // pointer parallax: a small sideways lean
    camera.translateX(pointer.x * 0.08); camera.translateY(-pointer.y * 0.04);
    camera.fov = mmToFov(cur.mm); camera.updateProjectionMatrix();

    // the slash sweeps as the camera circles (c01 → c02), then fades as we leave him
    // the slash: as the camera comes round to his front (c01b → c02), then it fades as we leave him
    slashMat.uniforms.head.value = smooth(ramp(s, 1.7, 1.97)) * 1.05;
    slashMat.uniforms.fade.value = smooth(ramp(s, 2.45, 3.0));
    key.target.position.copy(HIS);

    waterU.time.value = time; dustMat.uniforms.time.value = time;
    for (const m of mistMats) m.uniforms.time.value = time;
    if (composer) { composer.passes[3].uniforms.seed.value = (time * 7.3) % 100; composer.render(dt); }
    else { renderer.render(scene, camera); renderer.autoClear = false; renderer.render(dustScene, camera); renderer.autoClear = true; }
    adapt(dt);
  };
  frame();

  return () => {
    cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
    window.removeEventListener("resize", onResize); window.removeEventListener("pointermove", onPointer);
    renderer.dispose(); composer?.dispose();
  };
}
