// Scroll-driven 3D film for /experimental: one continuous world, a camera that flies through the
// storyboard's shots as the page scrolls, and the rigged ronin performing on cue.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { buildWorld, HERO_POS, LANTERNS, MOON_POS, RACK, V } from "./world";

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const ramp = (v: number, a: number, b: number) => clamp((v - a) / (b - a), 0, 1);
const smooth = (x: number) => x * x * (3 - 2 * x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mmToFov = (mm: number) => (2 * Math.atan(12 / mm) * 180) / Math.PI;
const rotY = (v: THREE.Vector3, a: number) => v.clone().applyAxisAngle(V(0, 1, 0), a);

// ------------------------------------------------------------------ the shots (storyboard v4)
type Shot = { id: string; pos: THREE.Vector3; tgt: THREE.Vector3; mm: number; roll: number; phase: number; blood: number; eclipse: number };
const shot = (id: string, pos: THREE.Vector3, tgt: THREE.Vector3, mm: number, phase: number, o: Partial<Shot> = {}): Shot => ({ id, pos, tgt, mm, phase, roll: 0, blood: 0, eclipse: 0, ...o });
const rackM = new THREE.Matrix4().compose(RACK.pos, new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), RACK.rotY), V(1, 1, 1));
const S04_POS = V(-3.0, 1.0, -25.4);
export const SHOTS: Shot[] = [
  shot("s01", V(-0.6, 1.05, 8.6), V(2.0, 2.7, 0), 35, 8),                                   // stance: the moon at his back
  shot("s02a", V(1.75, 0.62, 2.7), V(2.75, 1.75, 0), 45, 8, { roll: 0.05 }),                // koiguchi: low and close
  shot("s02b", V(0.3, 1.3, 5.6), V(2.8, 1.75, 0), 40, 10, { roll: 0.07 }),                  // the cut
  shot("s03", V(-3, 6.5, 8), V(14, 8.5, -40), 18, 128, { roll: -0.02 }),                    // crane up, the moon wanes
  shot("s04", S04_POS, S04_POS.clone().add(rotY(V(-1.1, 0.35, -4.0), 0.24)), 40, 135),       // about: at the head of the path
  shot("s05a", V(-4.6, 1.6, -26.3), V(-3.9, 1.2, -48), 30, 140),                           // approach: walking the path
  shot("s05b", V(-4.4, 1.5, -36.0), V(-3.9, 1.15, -60), 30, 142),
  shot("s06", V(-0.2, 1.4, 2.2).applyMatrix4(rackM), V(-1.05, 1.2, 0).applyMatrix4(rackM), 35, 145),   // work: the sword rack
  shot("s07", V(31.5, 4.2, -56.5), V(29.2, 6.7, -64), 30, 150),                            // toolkit: the tsuba ring
  shot("s08a", V(-1, 3, 14), MOON_POS.clone().add(V(0, -6, 0)), 70, 180, { eclipse: 1 }),   // totality
  shot("s08b", V(-1, 3, 14), MOON_POS.clone().add(V(0, -12, 0)), 55, 360, { blood: 1 }),    // blood moon
  shot("s09", V(-2.5, 1.35, 9.5), V(-2.33, 2.05, -0.5), 24, 360, { blood: 1 }),             // contact: he faces you
];
const IDX = Object.fromEntries(SHOTS.map((s, i) => [s.id, i]));

// ------------------------------------------------------------------ character materials (by glTF material name)
function characterMaterials(hi: boolean) {
  // phones get MeshStandardMaterial: no clearcoat or sheen lobes, a much cheaper shader
  const P = (o: THREE.MeshPhysicalMaterialParameters) => {
    if (hi) return new THREE.MeshPhysicalMaterial(o);
    const { color, roughness, metalness, envMapIntensity } = o;
    return new THREE.MeshStandardMaterial({ color, roughness: typeof roughness === "number" && o.clearcoat ? Math.min(roughness, 0.3) : roughness, metalness, envMapIntensity });
  };
  const S = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o);
  const seam = new THREE.MeshBasicMaterial({ color: 0xeaf2ff, toneMapped: false });
  const M: Record<string, THREE.Material> = {
    lacquer_black: P({ color: 0x050506, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.1 }),
    lacquer_red: P({ color: 0x7a1410, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08 }),
    silk: P({ color: 0xc9c5bd, roughness: 0.6, sheen: 1, sheenRoughness: 0.35, sheenColor: new THREE.Color(0xffffff), envMapIntensity: 0.6 }),
    horsehair: P({ color: 0xe2e0db, roughness: 0.4, sheen: 0.6, sheenColor: new THREE.Color(0xffffff) }),
    iron: S({ color: 0x2a2928, metalness: 1, roughness: 0.42 }),
    blade_steel: P({ color: 0xd9dde3, metalness: 1, roughness: 0.12, envMapIntensity: 1.6 }),
    cloth_vest: P({ color: 0x0b0b0c, roughness: 0.92, sheen: 0.3, sheenColor: new THREE.Color(0x2a2b30), envMapIntensity: 0.3 }),
    cloth_kimono: P({ color: 0x17171a, roughness: 0.9, sheen: 0.3, sheenColor: new THREE.Color(0x30323a), envMapIntensity: 0.3 }),
    cloth_under: S({ color: 0x3a3a3e, roughness: 0.9 }),
    cloth_trousers: S({ color: 0x141416, roughness: 0.92 }),
    cloth_wraps: S({ color: 0x18171a, roughness: 0.95 }),
    cloth_obi: S({ color: 0x101012, roughness: 0.9 }),
    rope: S({ color: 0x3a3836, roughness: 0.95 }),
    bead_dark: P({ color: 0x0a0a0b, roughness: 0.25, clearcoat: 1 }),
    bead_light: P({ color: 0x9a9a9c, roughness: 0.3, clearcoat: 1 }),
    kasa_lacquer: P({ color: 0x0e0e10, roughness: 0.45, clearcoat: 0.8, clearcoatRoughness: 0.2, envMapIntensity: 0.7 }),
    ito_wrap: S({ color: 0x1a1a1c, roughness: 0.75 }),
    hood: S({ color: 0x0c0c0e, roughness: 0.95 }),
    wood_sandal: S({ color: 0x1a1612, roughness: 0.85 }),
    seam_light: seam,
  };
  return { M, seam };
}

// ------------------------------------------------------------------ spring bones: coat panels and sleeve bags swing behind the body
function springBones(root: THREE.Object3D) {
  const groups: Record<string, THREE.Bone[]> = {};
  root.traverse((o) => {
    if (!(o as THREE.Bone).isBone) return;
    const m = o.name.match(/^(coat_\d+|sleeve_[LR])_(\d+|end)$/);
    if (m) (groups[m[1]] ||= []).push(o as THREE.Bone);
  });
  const PARAMS: Record<string, { stiff: number; drag: number; grav: number }> = { coat: { stiff: 1.4, drag: 0.3, grav: 0.15 }, sleeve: { stiff: 0.9, drag: 0.22, grav: 0.2 } };
  const order = (b: THREE.Bone) => (b.name.endsWith("end") ? 99 : +b.name.split("_").pop()!);
  type Joint = { b: THREE.Bone; rest: THREE.Quaternion; tailLocal: THREE.Vector3; len: number; tail: THREE.Vector3; prev: THREE.Vector3; init: boolean };
  const chains = Object.entries(groups).map(([key, bones]) => {
    bones.sort((a, b) => order(a) - order(b));
    const joints: Joint[] = bones.map((b, i) => {
      const tailLocal = bones[i + 1] ? bones[i + 1].position.clone() : V(0, 0.05, 0);
      return { b, rest: b.quaternion.clone(), tailLocal, len: tailLocal.length(), tail: V(), prev: V(), init: false };
    });
    return { joints, P: PARAMS[key.split("_")[0]] };
  });
  const byName = (n: string) => root.getObjectByName(n);
  const caps = ([["thigh_L", "shin_L", 0.085], ["thigh_R", "shin_R", 0.085], ["shin_L", "foot_L", 0.065], ["shin_R", "foot_R", 0.065], ["hips", "chest", 0.13]] as [string, string, number][])
    .map(([a, b, r]) => ({ a: byName(a), b: byName(b), r }))
    .filter((c): c is { a: THREE.Object3D; b: THREE.Object3D; r: number } => !!c.a && !!c.b);
  const A = V(), B = V(), AB = V(), AP = V(), head = V(), animTail = V(), restDir = V(), to = V(), vel = V(), next = V();
  const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), pq = new THREE.Quaternion();
  const gravity = V(0, -1, 0);
  const collide = (p: THREE.Vector3, r: number) => {
    for (const c of caps) {
      c.a.getWorldPosition(A); c.b.getWorldPosition(B); AB.subVectors(B, A); AP.subVectors(p, A);
      const t = clamp(AP.dot(AB) / AB.lengthSq(), 0, 1);
      const q = A.addScaledVector(AB, t);
      const d = p.distanceTo(q), min = c.r + r;
      if (d < min && d > 1e-5) p.sub(q).multiplyScalar(min / d).add(q);
    }
  };
  const step = (dt: number) => {
    for (const { joints, P } of chains)
      for (const j of joints) {
        j.b.quaternion.copy(j.rest);
        j.b.updateMatrixWorld(true);
        j.b.getWorldPosition(head);
        animTail.copy(j.tailLocal).applyMatrix4(j.b.matrixWorld);
        if (!j.init) { j.tail.copy(animTail); j.prev.copy(animTail); j.init = true; }
        restDir.subVectors(animTail, head).normalize();
        vel.subVectors(j.tail, j.prev).multiplyScalar(1 - P.drag);
        next.copy(j.tail).add(vel).addScaledVector(restDir, P.stiff * dt).addScaledVector(gravity, P.grav * dt);
        next.sub(head).setLength(j.len).add(head);
        collide(next, 0.015);
        next.sub(head).setLength(j.len).add(head);
        j.prev.copy(j.tail); j.tail.copy(next);
        to.subVectors(j.tail, head).normalize();
        q1.setFromUnitVectors(restDir, to);
        j.b.getWorldQuaternion(q2).premultiply(q1);
        j.b.parent!.getWorldQuaternion(pq).invert();
        j.b.quaternion.copy(pq.multiply(q2));
        j.b.updateMatrixWorld(true);
      }
  };
  return {
    update(dt: number) { const n = Math.max(1, Math.ceil(dt / (1 / 60))); for (let i = 0; i < n; i++) step(dt / n); },
    reset() { for (const { joints } of chains) for (const j of joints) j.init = false; },
  };
}

// ------------------------------------------------------------------ scroll anchors: [data-shot] elements in the page
type Anchor = { idx: number; y: number };
function readAnchors(root: HTMLElement): Anchor[] {
  const vh = window.innerHeight;
  const max = Math.max(1, document.documentElement.scrollHeight - vh);
  const out: Anchor[] = [];
  root.querySelectorAll<HTMLElement>("[data-shot]").forEach((el) => {
    const idx = IDX[el.dataset.shot!];
    if (idx === undefined) return;
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    // data-at: where the element's top sits (fraction of the viewport) when the shot holds;
    // without it, the shot holds when the element is centred.
    const at = el.dataset.at;
    const y = at !== undefined ? top - vh * +at : top + r.height / 2 - vh / 2;
    out.push({ idx, y: clamp(y, 0, max) });
  });
  out.sort((a, b) => a.y - b.y || a.idx - b.idx);
  // keep anchors strictly increasing in both scroll and shot order
  for (let i = 1; i < out.length; i++) if (out[i].y <= out[i - 1].y) out[i].y = out[i - 1].y + 1;
  return out;
}
// fractional shot index for a scroll position, eased so each shot holds briefly
function shotAt(anchors: Anchor[], y: number) {
  if (!anchors.length) return 0;
  if (y <= anchors[0].y) return anchors[0].idx;
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1], b = anchors[i];
    if (y <= b.y) {
      const u = (y - a.y) / (b.y - a.y);
      const e = smooth(ramp(u, 0.08, 0.92));
      return a.idx + (b.idx - a.idx) * e;
    }
  }
  return anchors[anchors.length - 1].idx;
}

// ------------------------------------------------------------------ the engine
export type ExperienceOptions = {
  canvas: HTMLCanvasElement;
  overlay: HTMLCanvasElement;
  root: HTMLElement;
  modelUrl: { high: string; low: string };
  texturesBase: string;
  onProgress?: (p: number) => void;
  onReady?: () => void;
};

export function startExperience(o: ExperienceOptions) {
  const mobile = window.matchMedia("(max-width: 767px)").matches || navigator.maxTouchPoints > 1;
  const quality: "high" | "low" = mobile ? "low" : "high";
  const renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: true, powerPreference: "high-performance" });
  // resolution adapts to the frame rate (see adapt() below); phones start lower
  const PR_MAX = Math.min(window.devicePixelRatio, quality === "high" ? 1.5 : 1.5);
  const PR_MIN = quality === "high" ? 0.75 : 0.6;
  let pixelRatio = Math.min(PR_MAX, quality === "high" ? 1.5 : 1.0);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = quality === "high";
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const texLoader = new THREE.TextureLoader();
  const waterNormals: [THREE.Texture, THREE.Texture] = [texLoader.load(`${o.texturesBase}/Water_1_M_Normal.jpg`), texLoader.load(`${o.texturesBase}/Water_2_M_Normal.jpg`)];
  const world = buildWorld(renderer, { quality, waterNormals });
  const { scene, dustScene } = world;

  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.05, 2000);

  // ---------------- post
  const usePost = quality === "high";
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = quality === "high" ? new BokehPass(scene, camera, { focus: 8, aperture: 0.0003, maxblur: 0.0035 }) : null;
  if (bokeh) composer.addPass(bokeh);
  const dustPass = new RenderPass(dustScene, camera);
  dustPass.clear = false;
  dustPass.clearDepth = true;
  composer.addPass(dustPass);
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.35, 0.6, 0.9);
  composer.addPass(bloom);
  // light shafts: march toward the moon through a low-res mask of the moon minus everything in front of it
  const occRT = new THREE.WebGLRenderTarget(Math.round(window.innerWidth / 3), Math.round(window.innerHeight / 3));
  const black = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const moonScene = new THREE.Scene();
  const moonClone = new THREE.Mesh(world.moon.geometry, world.moonMat);
  moonClone.position.copy(MOON_POS);
  moonScene.add(moonClone);
  const rays = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, occ: { value: occRT.texture }, sun: { value: new THREE.Vector2(0.5, 0.5) }, k: { value: 0 }, tint: { value: new THREE.Color(0xdfe6ff) } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }",
    fragmentShader: `uniform sampler2D tDiffuse; uniform sampler2D occ; uniform vec2 sun; uniform float k; uniform vec3 tint; varying vec2 vUv;
      void main(){ vec4 base = texture2D(tDiffuse, vUv);
        if (k <= 0.001) { gl_FragColor = base; return; }
        vec2 d = (vUv - sun) / 60.; vec2 uv = vUv; float w = 1.; vec3 acc = vec3(0.);
        for (int i = 0; i < 60; i++) { uv -= d; vec3 s = texture2D(occ, uv).rgb; acc += s * dot(s, vec3(.3,.5,.2)) * w; w *= 0.965; }
        gl_FragColor = vec4(base.rgb + acc * tint * 0.03 * k, 1.); }`,
  });
  if (quality === "high") composer.addPass(rays);
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, red: { value: 0 }, seed: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }",
    fragmentShader: `uniform sampler2D tDiffuse; uniform float red; uniform float seed; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + seed)*43758.5453); }
      void main(){ vec2 c = vUv - .5;
        vec4 col = texture2D(tDiffuse, vUv);
        col.rgb *= mix(.5, 1., smoothstep(.95, .3, length(c)*1.2));
        col.rgb += (h(vUv*1000.) - .5) * .045;
        col.rgb = mix(col.rgb, col.rgb*vec3(1.12,.86,.82), red*.5);
        col.rgb = mix(col.rgb, col.rgb*vec3(.96,1.,1.05), (1.-red)*.6);
        gl_FragColor = col; }`,
  });
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  // ---------------- character
  const charRoot = new THREE.Group();
  scene.add(charRoot);
  let mixer: THREE.AnimationMixer | null = null;
  const actions: Record<string, THREE.AnimationAction> = {};
  let springs: ReturnType<typeof springBones> | null = null;
  const { M: charMats, seam: charSeam } = characterMaterials(quality === "high");
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  let ready = false;
  loader.load(
    o.modelUrl[quality],
    (g) => {
      g.scene.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (!m.isMesh) return;
        const swap = (mat: THREE.Material) => charMats[mat.name.replace(/\.\d+$/, "")] || charMats.lacquer_black;
        m.material = Array.isArray(m.material) ? m.material.map(swap) : swap(m.material);
        m.castShadow = true;
        m.frustumCulled = false;
      });
      charRoot.add(g.scene);
      mixer = new THREE.AnimationMixer(g.scene);
      for (const c of g.animations) {
        const a = mixer.clipAction(c);
        a.play();
        a.paused = true;
        a.setEffectiveWeight(0);
        actions[c.name] = a;
      }
      springs = springBones(g.scene);
      // compile every shader now, behind the loader, so nothing stalls mid-scroll
      const hidden: THREE.Object3D[] = [];
      scene.traverse((obj) => { if (!obj.visible) { hidden.push(obj); obj.visible = true; } });
      const finish = () => {
        for (const h of hidden) h.visible = false;
        ready = true;
        o.onProgress?.(1);
        o.onReady?.();
      };
      renderer.compileAsync(scene, camera).then(() => renderer.compileAsync(dustScene, camera)).then(finish, finish);
    },
    (e) => { if (e.total) o.onProgress?.(0.95 * (e.loaded / e.total)); },
    () => { o.onProgress?.(1); o.onReady?.(); }
  );

  // ---------------- scroll state
  let anchors = readAnchors(o.root);
  const refresh = () => { anchors = readAnchors(o.root); };
  const ro = new ResizeObserver(refresh);
  ro.observe(document.body);
  const pointer = new THREE.Vector2();
  const onPointer = (e: PointerEvent) => pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  window.addEventListener("pointermove", onPointer, { passive: true });
  const onResize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    occRT.setSize(Math.round(w / 3), Math.round(h / 3));
    world.resize(w, h);
    refresh();
  };
  window.addEventListener("resize", onResize);

  // ---------------- choreography: what the ronin does at each point of the film
  const PATH_START = V(-4.0, 0.38, -31), PATH_END = V(-4.0, 0.38, -46.5);
  const WALK_SPEED = 0.8; // m/s, matches the walk clip's stride
  type CharState = { pos: THREE.Vector3; rotY: number; visible: boolean; w: Record<string, number>; t: Record<string, number> };
  function character(s: number, y: number, maxY: number): CharState {
    const w: Record<string, number> = { idle: 1, iai: 0, walk: 0, bow: 0 };
    const t: Record<string, number> = { iai: 0, walk: 0, bow: 0 };
    let pos = HERO_POS.clone(), rotY = Math.PI / 2 + 0.25, visible = true;
    if (s < 3.5) {
      // the iai, scrubbed by scroll: seal → draw and rising cut → second cut, flick, sheathe
      t.iai = s < 1 ? 0.7 * smooth(ramp(s, 0.12, 1)) : s < 2 ? lerp(0.7, 1.75, ramp(s, 1, 2)) : lerp(1.75, 6.2, ramp(s, 2, 3.2));
      const k = smooth(ramp(s, 0.02, 0.15)) * (1 - smooth(ramp(s, 3.2, 3.45)));
      w.iai = k; w.idle = 1 - k;
    } else if (s < 7) {
      if (s < 4) { pos = V(-4.1, 0.38, -29.4); rotY = 0.72; }
      else if (s < 5) {
        const u = smooth(ramp(s, 4.05, 5));
        pos = V(-4.1, 0.38, -29.4).lerp(PATH_START, u);
        rotY = lerp(0.72, Math.PI, u);
        w.walk = smooth(ramp(s, 4.2, 4.7)); w.idle = 1 - w.walk;
      } else {
        const u = ramp(s, 5, 6.6);
        pos = PATH_START.clone().lerp(PATH_END, u);
        rotY = Math.PI;
        w.walk = 1 - smooth(ramp(s, 6.4, 6.6)); w.idle = 1 - w.walk;
      }
      t.walk = ((pos.distanceTo(V(-4.1, 0.38, -29.4)) / WALK_SPEED) % 2.2 + 2.2) % 2.2;
      visible = s < 6.9;
    } else if (s < 8.6) {
      visible = false;
    } else {
      // back on the slab under the eclipse; at the contact he has turned to face you
      const u = smooth(ramp(s, 10, 11));
      pos = HERO_POS.clone().lerp(V(1.1, 0.36, 0.2), u);
      rotY = lerp(Math.PI / 2 + 0.25, -0.37, u);
      // the bow, as the footer arrives
      const b = ramp(y, maxY - window.innerHeight * 0.9, maxY - 10);
      t.bow = 1.25 * smooth(b);
      w.bow = smooth(ramp(b, 0, 0.15)); w.idle = 1 - w.bow;
    }
    return { pos, rotY, visible, w, t };
  }
  // the page is sliced along the blade at the moment of the cut
  const sliceAmount = (s: number, iaiT: number) => (s < 3 ? smooth(ramp(iaiT, 1.12, 1.24)) * (1 - smooth(ramp(iaiT, 1.42, 1.72))) : 0);

  // ---------------- adaptive resolution: hold ~55+ fps by trading pixels
  let acc = 0, frames = 0, lastAdapt = 0;
  const adapt = (dt: number) => {
    acc += dt; frames++;
    if (acc < 1.2) return;
    const avg = acc / frames; acc = 0; frames = 0;
    const now = performance.now();
    if (now - lastAdapt < 1500) return;
    let next = pixelRatio;
    if (avg > 1 / 45) next = Math.max(PR_MIN, pixelRatio * 0.85);
    else if (avg < 1 / 58) next = Math.min(PR_MAX, pixelRatio * 1.08);
    if (Math.abs(next - pixelRatio) > 0.02) {
      pixelRatio = next; lastAdapt = now;
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      if (usePost) { composer.setPixelRatio(pixelRatio); composer.setSize(window.innerWidth, window.innerHeight); }
    }
  };

  // ---------------- frame
  const SNAP = new URLSearchParams(window.location.search).has("snap"); // testing: no camera smoothing
  const NOCHAR = new URLSearchParams(window.location.search).has("nochar");
  if (SNAP) (window as unknown as { __info: unknown }).__info = renderer.info;   // testing: draw-call and triangle counts
  let time = 0, idleT = 0, last = performance.now(), camSmoothed: Shot | null = null;
  const ctx = o.overlay.getContext("2d")!;
  const cur = { pos: V(), tgt: V(), mm: 35, roll: 0, phase: 8, blood: 0, eclipse: 0 };
  const tmpA = V(), tmpB = V();
  let raf = 0;
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
  io.observe(o.canvas);

  const frame = () => {
    raf = requestAnimationFrame(frame);
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    if (!visible || document.hidden) return;
    time += dt; idleT += dt;
    const y = window.scrollY;
    const maxY = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const s = shotAt(anchors, y);

    // camera: blend the two shots either side of s
    const i0 = Math.floor(clamp(s, 0, SHOTS.length - 1)), i1 = Math.min(i0 + 1, SHOTS.length - 1), u = s - i0;
    const A = SHOTS[i0], B = SHOTS[i1];
    const target = {
      pos: tmpA.copy(A.pos).lerp(B.pos, u).clone(),
      tgt: tmpB.copy(A.tgt).lerp(B.tgt, u).clone(),
      mm: lerp(A.mm, B.mm, u), roll: lerp(A.roll, B.roll, u), phase: lerp(A.phase, B.phase, u),
      blood: lerp(A.blood, B.blood, u), eclipse: lerp(A.eclipse, B.eclipse, u),
    };
    // a long flight arcs upward instead of skimming the water
    const dist = A.pos.distanceTo(B.pos);
    if (dist > 8) target.pos.y += Math.sin(u * Math.PI) * Math.min(6, dist * 0.12);
    // critically damped follow, so wheel steps glide
    const k = camSmoothed && !SNAP ? 1 - Math.exp(-dt * 6) : 1;
    camSmoothed = camSmoothed || ({ ...target, id: "" } as Shot);
    cur.pos.lerp(target.pos, k); cur.tgt.lerp(target.tgt, k);
    cur.mm = lerp(cur.mm, target.mm, k); cur.roll = lerp(cur.roll, target.roll, k); cur.phase = lerp(cur.phase, target.phase, k);
    cur.blood = lerp(cur.blood, target.blood, k); cur.eclipse = lerp(cur.eclipse, target.eclipse, k);
    if (!camSmoothed.id) { cur.pos.copy(target.pos); cur.tgt.copy(target.tgt); camSmoothed.id = "init"; }
    // pointer parallax: the camera leans a few degrees toward the cursor
    const off = cur.tgt.clone().sub(cur.pos);
    const right = off.clone().cross(V(0, 1, 0)).normalize();
    camera.position.copy(cur.pos).addScaledVector(right, pointer.x * 0.12).add(V(0, -pointer.y * 0.06, 0));
    camera.fov = mmToFov(cur.mm);
    camera.lookAt(cur.tgt);
    camera.rotateZ(cur.roll);
    camera.updateProjectionMatrix();

    // character
    let iaiT = 0;
    if (ready && mixer) {
      const c = character(s, y, maxY);
      iaiT = c.t.iai;
      charRoot.visible = c.visible && !NOCHAR;
      charRoot.position.copy(c.pos);
      charRoot.rotation.y = c.rotY;
      const total = Object.values(c.w).reduce((a, b) => a + b, 0) || 1;
      for (const [name, a] of Object.entries(actions)) {
        const dur = a.getClip().duration;
        a.time = name === "idle" ? idleT % dur : clamp(c.t[name] ?? 0, 0, dur - 1e-3);
        const wgt = (c.w[name] ?? 0) / total;
        a.enabled = wgt > 0.001;
        a.setEffectiveWeight(wgt);
      }
      mixer.update(0);
      springs?.update(dt);
    }

    // each set is only on stage during its own part of the film
    const sets = world.sets;
    sets.slab.visible = s < 4.6 || s > 8.4;
    sets.path.visible = s > 2.9 && s < 7.3;
    sets.rack.visible = s > 5.6 && s < 8.3;
    sets.tsubaRing.visible = s > 6.6 && s < 8.7;
    world.mists.slab.visible = sets.slab.visible;
    world.mists.path.visible = sets.path.visible;
    world.mists.rack.visible = sets.rack.visible;
    world.mists.tsuba.visible = sets.tsubaRing.visible;
    sets.rackSpot.intensity = sets.rack.visible ? 2.2 : 0;
    world.moon.visible = !(s > 6.55 && s < 7.45);   // the rack shot is close and low; the moon's reflection would glare behind it
    // lanterns light as the walk passes them
    const walkU = ramp(s, 5, 6.6);
    LANTERNS.forEach((_, i) => world.setLantern(i, smooth(ramp(walkU, i * 0.25 - 0.05, i * 0.25 + 0.1)) * ramp(s, 4.3, 4.8)));

    world.update({
      time, camera, phase: cur.phase, blood: cur.blood, eclipse: smooth(clamp(cur.eclipse * 1.4 - 0.2, 0, 1)),
      ripple: new THREE.Vector2(charRoot.position.x, charRoot.position.z), shadowAt: charRoot.position.clone().setY(0), tsubaSpin: s * 1.1,
    });
    charSeam.color.copy(world.palette.seam(cur.blood));

    // post settings for this moment
    if (bokeh) {
      const u2 = bokeh.uniforms as Record<string, THREE.IUniform>;
      const focusOn = charRoot.visible && s < 7 ? charRoot.position.distanceTo(camera.position) : cur.tgt.distanceTo(camera.position);
      u2.focus.value = Math.min(focusOn, 200);
      u2.aperture.value = s > 8.5 && s < 10.5 ? 0.00005 : 0.0004;
    }
    bloom.strength = 0.35 * (1 - 0.75 * smooth(ramp(s, 6.4, 6.8)) * (1 - smooth(ramp(s, 7.2, 7.6))));
    grade.uniforms.red.value = cur.blood;
    grade.uniforms.seed.value = (time * 7.3) % 100;
    const mp = MOON_POS.clone().project(camera);
    const onScreen = world.moon.visible && mp.z < 1 && Math.abs(mp.x) < 1.6 && Math.abs(mp.y) < 1.6;
    if (quality === "high" && onScreen) {
      rays.uniforms.sun.value.set((mp.x + 1) / 2, (mp.y + 1) / 2);
      rays.uniforms.k.value = 1 - cur.eclipse;
      (rays.uniforms.tint.value as THREE.Color).setRGB(0.87 + 0.13 * cur.blood, 0.9 - 0.5 * cur.blood, 1 - 0.7 * cur.blood);
      const fog = scene.fog;
      scene.overrideMaterial = black; scene.fog = null;
      world.water.visible = false;
      renderer.setRenderTarget(occRT);
      renderer.setClearColor(0x000000, 1);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.autoClear = false;
      renderer.render(moonScene, camera);
      renderer.autoClear = true;
      renderer.setRenderTarget(null);
      scene.overrideMaterial = null; scene.fog = fog;
      world.water.visible = true;
    } else rays.uniforms.k.value = 0;

    if (usePost) composer.render(dt);
    else {
      renderer.render(scene, camera);
      renderer.autoClear = false;
      renderer.render(dustScene, camera);
      renderer.autoClear = true;
    }
    adapt(dt);

    // slice overlay
    const sl = sliceAmount(s, iaiT);
    const W = o.overlay.width, H = o.overlay.height;
    if (sl > 0.001) {
      if (W !== window.innerWidth || H !== window.innerHeight) { o.overlay.width = window.innerWidth; o.overlay.height = window.innerHeight; }
      const w = o.overlay.width, h = o.overlay.height;
      const y0 = h * 0.74, y1 = h * 0.18;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      const half = (top: boolean) => {
        ctx.save();
        ctx.beginPath();
        if (top) { ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, y1); ctx.lineTo(0, y0); }
        else { ctx.moveTo(0, y0); ctx.lineTo(w, y1); ctx.lineTo(w, h); ctx.lineTo(0, h); }
        ctx.closePath();
        ctx.clip();
        const dx = (top ? -14 : 14) * sl, dy = (top ? -10 : 10) * sl;
        ctx.drawImage(renderer.domElement, dx, dy, w, h);
        if (!top) { ctx.fillStyle = `rgba(0,0,0,${0.2 * sl})`; ctx.fillRect(0, 0, w, h); }
        ctx.restore();
      };
      half(true); half(false);
      const flash = smooth(ramp(iaiT, 1.12, 1.2)) * (1 - smooth(ramp(iaiT, 1.2, 1.32)));
      const line = (dy: number, color: string, width: number) => { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(-20, y0 + dy); ctx.lineTo(w + 20, y1 + dy); ctx.stroke(); };
      line(0, `rgba(255,255,255,${0.18 * sl})`, 14);
      line(0, `rgba(255,255,255,${sl})`, 2.5);
      line(3, `rgba(255,74,58,${0.75 * sl})`, 1.2);
      line(-3, `rgba(74,208,255,${0.6 * sl})`, 1.2);
      if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${0.35 * flash})`; ctx.fillRect(0, 0, w, h); }
      o.overlay.style.opacity = "1";
    } else if (o.overlay.style.opacity !== "0") {
      ctx.clearRect(0, 0, W, H);
      o.overlay.style.opacity = "0";
    }
  };
  frame();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onPointer);
    renderer.dispose();
    composer.dispose();
  };
}
