// The static world of the /experimental page: sky, moon, water, mist, dust and the four sets
// (stone slab, walkway with lanterns, sword rack, tsuba ring). Framework-free three.js.
import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const MOON_POS = V(66, 38, -170);
export const HERO_POS = V(2.6, 0.36, 0);
export const RACK = { pos: V(14, 0, -40), rotY: -0.3 };
export const TSUBA_POS = V(30, 7, -64);
export const LANTERNS: [number, number][] = [[-2.5, -33], [-5.5, -39], [-2.5, -45], [-5.5, -51]];

const NIGHT = { skyTop: 0x04050a, skyHor: 0x12151c, fog: 0x0b0d12, moon: 0xf1ece2, key: 0xd6e0ff, seam: 0xeaf2ff, mist: 0x3c4250, water: 0x2a3038, deep: 0x030407, dust: 0xdfe6f2 };
const BLOOD = { skyTop: 0x0e0303, skyHor: 0x2a0b09, fog: 0x1a0807, moon: 0xd8483a, key: 0xff5a48, seam: 0xff6a5a, mist: 0x4a1c18, water: 0x3a1412, deep: 0x080202, dust: 0xff7a66 };
type Palette = typeof NIGHT;
const mixHex = (k: keyof Palette, t: number, out = new THREE.Color()) => out.setHex(NIGHT[k]).lerp(new THREE.Color(BLOOD[k]), t);

export function glowTexture(r: number, g: number, b: number, soft = 1) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d")!;
  const gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gr.addColorStop(0.2 * soft, `rgba(${r},${g},${b},.35)`);
  gr.addColorStop(0.55, `rgba(${r},${g},${b},.07)`);
  gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr;
  x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function canvasTexture(w: number, h: number, draw: (x: CanvasRenderingContext2D) => void, srgb = false) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export type World = ReturnType<typeof buildWorld>;

export function buildWorld(renderer: THREE.WebGLRenderer, opts: { quality: "high" | "low"; waterNormals: [THREE.Texture, THREE.Texture] }) {
  const scene = new THREE.Scene();
  const dustScene = new THREE.Scene();
  const fogColor = new THREE.Color(NIGHT.fog);
  scene.fog = new THREE.FogExp2(fogColor, 0.03);
  const seamMats: THREE.MeshBasicMaterial[] = [];
  const seam = (opacity = 0.85) => {
    const m = new THREE.MeshBasicMaterial({ color: NIGHT.seam, transparent: true, opacity, toneMapped: false });
    seamMats.push(m);
    return m;
  };

  // ---------------- sky
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { top: { value: new THREE.Color(NIGHT.skyTop) }, hor: { value: new THREE.Color(NIGHT.skyHor) } },
    vertexShader: "varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }",
    fragmentShader: `varying vec3 p; uniform vec3 top; uniform vec3 hor;
      float h(vec3 q){ return fract(sin(dot(q, vec3(12.9898,78.233,37.719)))*43758.5453); }
      void main(){ vec3 n = normalize(p); float t = smoothstep(-0.02, 0.45, n.y);
        vec3 c = mix(hor, top, t);
        vec3 q = floor(n*520.); float s = step(0.998, h(q)) * smoothstep(0.08, 0.5, n.y) * (0.4 + 0.6*h(q+1.));
        gl_FragColor = vec4(c + s*0.5, 1.); }`,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), skyMat));

  // ---------------- moon: a lit sphere, so its phases are real
  const moonMat = new THREE.ShaderMaterial({
    fog: false,
    uniforms: { L: { value: V(0, 0, 1) }, col: { value: new THREE.Color(NIGHT.moon) }, glow: { value: 0 }, soft: { value: opts.quality === "high" ? 0 : 1 } },
    vertexShader: "varying vec3 n; varying vec3 p; void main(){ n = normalize(mat3(modelMatrix)*normal); p = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }",
    fragmentShader: `varying vec3 n; varying vec3 p; uniform vec3 L; uniform vec3 col; uniform float glow; uniform float soft;
      float hash(vec3 q){ return fract(sin(dot(q, vec3(127.1,311.7,74.7)))*43758.5453); }
      float noise(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
        return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float fbm(vec3 q){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*noise(q); q*=2.1; a*=.5; } return s; }
      void main(){
        vec3 q = normalize(p);
        float m = fbm(q*2.5);
        float maria = smoothstep(.4,.8, fbm(q*0.9+3.));
        float crater = smoothstep(.66,.74, noise(q*22.)) * .12;
        float d = smoothstep(-0.05, 0.22, dot(n, normalize(L)));
        vec3 c = col * (0.82 + 0.18*m - crater*(1.-soft*.7)) * (1. - mix(.26, .1, soft)*maria);
        gl_FragColor = vec4(c*(d*0.9 + 0.03) + col*glow*0.3, 1.);
      }`,
  });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(30, 96, 48), moonMat);
  moon.position.copy(MOON_POS);
  scene.add(moon);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(225, 230, 240), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: 0.35 }));
  halo.scale.setScalar(220);
  halo.position.copy(MOON_POS);
  scene.add(halo);
  const corona = new THREE.Mesh(
    new THREE.RingGeometry(30.15, 31.2, 160),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, depthWrite: false })
  );
  corona.position.copy(MOON_POS);
  scene.add(corona);
  const coronaGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(230, 236, 255, 2.2), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0, fog: false }));
  coronaGlow.scale.setScalar(150);
  scene.add(coronaGlow);

  // ---------------- environment for reflections
  {
    const pm = new THREE.PMREMGenerator(renderer);
    const es = new THREE.Scene();
    es.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(50, 32, 16),
        new THREE.ShaderMaterial({
          side: THREE.BackSide,
          uniforms: { a: { value: new THREE.Color(0x1a1e28) }, b: { value: new THREE.Color(0x020203) } },
          vertexShader: "varying vec3 p; void main(){ p=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
          fragmentShader: "varying vec3 p; uniform vec3 a; uniform vec3 b; void main(){ float t = normalize(p).y; gl_FragColor = vec4(mix(b, a, smoothstep(-0.2, 0.15, t)) * (1. + 2.*exp(-abs(t)*12.)), 1.); }",
        })
      )
    );
    const spot = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    spot.position.copy(MOON_POS).normalize().multiplyScalar(40);
    es.add(spot);
    scene.environment = pm.fromScene(es, 0.03).texture;
    pm.dispose();
  }

  // ---------------- lights: the moon is the key, always behind the subject
  const key = new THREE.DirectionalLight(NIGHT.key, 3.0);
  key.castShadow = opts.quality === "high";
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0x7d8cab, 0.45);
  fill.position.set(-8, 5, 20);
  scene.add(fill);
  const hemi = new THREE.HemisphereLight(0x1d2230, 0x000000, 0.7);
  scene.add(hemi);
  const shadowAround = (p: THREE.Vector3, r = 5) => {
    key.target.position.copy(p);
    key.position.copy(p).add(MOON_POS.clone().sub(p).normalize().multiplyScalar(30));
    const c = key.shadow.camera;
    c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = 80;
    c.updateProjectionMatrix();
  };

  // ---------------- water: a mirror broken by two layers of ripples, blurring with distance
  const [wn1, wn2] = opts.waterNormals;
  for (const t of [wn1, wn2]) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  const waterShader = {
    name: "WaterShader",
    uniforms: {
      color: { value: new THREE.Color(NIGHT.water) },
      tDiffuse: { value: null },
      textureMatrix: { value: null },
      n1: { value: wn1 },
      n2: { value: wn2 },
      time: { value: 0 },
      deep: { value: new THREE.Color(NIGHT.deep) },
      fogC: { value: fogColor },
      ripple: { value: new THREE.Vector2(2.6, 0) },
    },
    vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
      void main(){ vUv = textureMatrix * vec4(position, 1.); vW = (modelMatrix*vec4(position,1.)).xyz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; uniform sampler2D n1; uniform sampler2D n2; uniform float time; uniform vec3 deep; uniform vec3 fogC; uniform vec2 ripple;
      varying vec4 vUv; varying vec3 vW;
      void main(){
        vec2 p = vW.xz;
        vec3 a = texture2D(n1, p*0.045 + vec2(time*0.01, time*0.006)).rgb*2.-1.;
        vec3 b = texture2D(n2, p*0.11 - vec2(time*0.008, -time*0.011)).rgb*2.-1.;
        vec2 n = (a.rg + b.rg) * 0.5;
        float d = length(p - ripple);
        n += normalize(p - ripple + 1e-4) * sin(d*7. - time*2.) * 0.25 * exp(-d*0.35) * smoothstep(0.6, 1.4, d);
        float dist = length(cameraPosition - vW);
        vec4 uv = vUv; uv.xy += n * (0.018 + dist*0.0009) * uv.w;
        vec3 r = vec3(0.);
        float bl = 0.002 + dist*0.00012;
        for (int i=0;i<5;i++){ vec2 o = vec2(float(i)-2., float(i*3-(i*3/5)*5)-2.)*bl*uv.w; r += texture2DProj(tDiffuse, vec4(uv.xy+o, uv.zw)).rgb; }
        r /= 5.;
        vec3 v = normalize(cameraPosition - vW);
        float fres = 0.08 + 0.92*pow(1. - max(v.y, 0.), 4.);
        vec3 c = mix(deep, r * color * 2.2, clamp(fres*1.25, 0., 1.));
        float f = 1. - exp(-pow(0.03*dist, 2.));
        c = mix(c, fogC, f*0.85);
        gl_FragColor = vec4(c, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  };
  const reflScale = opts.quality === "high" ? 0.6 : 0.25;
  const water = new Reflector(new THREE.PlaneGeometry(1500, 1500), {
    textureWidth: Math.round(window.innerWidth * reflScale),
    textureHeight: Math.round(window.innerHeight * reflScale),
    clipBias: 0.002,
    shader: waterShader,
    multisample: opts.quality === "high" ? 4 : 0,
  });
  water.rotation.x = -Math.PI / 2;
  scene.add(water);
  if (opts.quality === "low") {
    // phones: refresh the reflection on every other frame; the water moves slowly enough to hide it
    const reflect = water.onBeforeRender.bind(water);
    let n = 0;
    water.onBeforeRender = (...args: Parameters<typeof reflect>) => { if (n++ % 2 === 0) reflect(...args); };
  }
  const waterU = (water.material as THREE.ShaderMaterial).uniforms;

  // ---------------- materials for the sets
  const stoneTex = canvasTexture(512, 512, (x) => {
    const img = x.createImageData(512, 512);
    for (let j = 0; j < 512; j++)
      for (let i = 0; i < 512; i++) {
        const v = 110 + 40 * Math.sin(i * 0.05 + Math.sin(j * 0.03) * 3) * Math.sin(j * 0.04) + (Math.random() - 0.5) * 70;
        const k = (j * 512 + i) * 4;
        img.data[k] = img.data[k + 1] = img.data[k + 2] = v;
        img.data[k + 3] = 255;
      }
    x.putImageData(img, 0, 0);
  });
  const woodTex = canvasTexture(1024, 128, (x) => {
    x.fillStyle = "#5a4e40";
    x.fillRect(0, 0, 1024, 128);
    for (let j = 0; j < 128; j += 2) {
      x.fillStyle = `rgba(20,14,8,${0.15 + Math.random() * 0.3})`;
      x.fillRect(0, j + Math.sin(j) * 2, 1024, 1);
    }
  }, true);
  const stone = new THREE.MeshStandardMaterial({ color: 0x3a3b3e, roughness: 0.82, roughnessMap: stoneTex, bumpMap: stoneTex, bumpScale: 3, map: stoneTex, envMapIntensity: 0.5 });
  const stoneDark = stone.clone();
  stoneDark.color = new THREE.Color(0x1e1f22);
  stoneDark.roughnessMap = null;
  stoneDark.roughness = 0.97;
  const wood = new THREE.MeshStandardMaterial({ map: woodTex, color: 0x6a6a6a, roughness: 0.75, bumpMap: woodTex, bumpScale: 2, envMapIntensity: 0.4 });
  const hi = opts.quality === "high";
  const lacquer = hi ? new THREE.MeshPhysicalMaterial({ color: 0x141416, roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.28, envMapIntensity: 0.55 }) : new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.3, envMapIntensity: 0.7 });
  const steel = hi ? new THREE.MeshPhysicalMaterial({ color: 0xe6e8ec, roughness: 0.12, metalness: 1, envMapIntensity: 2.0 }) : new THREE.MeshStandardMaterial({ color: 0xe6e8ec, roughness: 0.12, metalness: 1, envMapIntensity: 2.0 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x2a2a2d, roughness: 0.45, metalness: 0.85, envMapIntensity: 1.1 });

  // ---------------- set: the stone slab the story starts and ends on
  const slab = new THREE.Group();
  {
    const a = new THREE.Mesh(new RoundedBoxGeometry(5, 0.4, 3.2, 4, 0.06), stone);
    a.position.set(2, 0.16, 0);
    const b = new THREE.Mesh(new RoundedBoxGeometry(2.6, 0.26, 2.2, 4, 0.06), stoneDark);
    b.position.set(-1.2, 0.08, 1.3);
    b.rotation.y = 0.22;
    const c = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.2, 1.1, 3, 0.05), stoneDark);
    c.position.set(5.4, 0.04, -1.4);
    c.rotation.y = -0.4;
    for (const m of [a, b, c]) { m.receiveShadow = true; slab.add(m); }
  }
  scene.add(slab);

  // ---------------- set: the walkway with four stone lanterns (Plan, Build, Ship, Sustain)
  const path = new THREE.Group();
  const lanternLights: { light: THREE.PointLight; win: THREE.MeshBasicMaterial; glow: THREE.Sprite }[] = [];
  {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const plank = new THREE.BoxGeometry(1.9, 0.07, 0.3);
    const planks = new THREE.InstancedMesh(plank, wood, 80);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 80; i++) {
      m4.makeRotationY((rand() - 0.5) * 0.02).setPosition(-4 + (rand() - 0.5) * 0.04, 0.34, -28 - i * 0.34);
      planks.setMatrixAt(i, m4);
    }
    planks.receiveShadow = true;
    path.add(planks);
    for (const x of [-0.93, 0.93]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 27.2), wood);
      rail.position.set(-4 + x, 0.26, -41.5);
      path.add(rail);
    }
    const post = new THREE.CylinderGeometry(0.07, 0.08, 0.7, 10);
    for (let i = 0; i < 10; i++)
      for (const x of [-0.95, 0.95]) {
        const p = new THREE.Mesh(post, wood);
        p.position.set(-4 + x, 0.2, -28 - i * 3);
        path.add(p);
      }
    const guide = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.003, 27), seam(0.45));
    guide.position.set(-4, 0.377, -41.5);
    path.add(guide);
    const lathe = (pts: [number, number][]) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 6);
    const parts: [THREE.BufferGeometry, number][] = [
      [lathe([[0.001, 0], [0.42, 0], [0.42, 0.12], [0.3, 0.2], [0.001, 0.2]]), 0],
      [new THREE.CylinderGeometry(0.11, 0.13, 0.9, 12), 0.65],
      [lathe([[0.001, 0], [0.22, 0], [0.36, 0.1], [0.36, 0.16], [0.001, 0.16]]), 1.1],
      [lathe([[0.001, 0], [0.55, 0], [0.5, 0.06], [0.12, 0.3], [0.06, 0.36], [0.001, 0.36]]), 1.67],
      [new THREE.SphereGeometry(0.075, 12, 8), 2.08],
    ];
    const glowMap = glowTexture(255, 220, 170);
    for (const [x, z] of LANTERNS) {
      const L = new THREE.Group();
      for (const [geo, y] of parts) {
        const m = new THREE.Mesh(geo, stone);
        m.position.y = y;
        m.castShadow = true;
        L.add(m);
      }
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.42), stone);
      box.position.y = 1.47;
      L.add(box);
      const winMat = new THREE.MeshBasicMaterial({ color: 0x101010 });
      for (const r of [0, Math.PI / 2]) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.2, 0.18), winMat);
        win.position.y = 1.47;
        win.rotation.y = r;
        L.add(win);
      }
      // kept at scene level so hiding the walkway never changes the light count (that would recompile every shader)
      const light = new THREE.PointLight(0xffd9a8, 0, 10, 1.6);
      light.position.set(x, 0.36 + 1.47, z);
      if (opts.quality === "high") scene.add(light);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
      glow.position.y = 1.47;
      glow.scale.setScalar(2.4);
      L.add(glow);
      L.position.set(x, 0.36, z);
      path.add(L);
      lanternLights.push({ light, win: winMat, glow });
    }
  }
  scene.add(path);
  const setLantern = (i: number, k: number) => {
    const l = lanternLights[i];
    l.light.intensity = 6 * k;
    l.light.visible = true;
    l.win.color.setRGB(0.06 + 0.94 * k, 0.06 + 0.84 * k, 0.06 + 0.7 * k);
    (l.glow.material as THREE.SpriteMaterial).opacity = 0.6 * k;
  };

  // ---------------- set: the sword rack, one sword per project
  const katana = (drawnBy: number, ringRed: boolean) => {
    const g = new THREE.Group();
    const L = 0.72, w = 0.031, N = 40;
    const cx = (t: number) => -0.032 * t * t;
    const s = new THREE.Shape();
    s.moveTo(cx(0) + w / 2, 0);
    for (let i = 1; i <= N; i++) { const t = (i / N) * 0.93; s.lineTo(cx(t) + (w / 2) * (1 - 0.28 * t), t * L); }
    s.lineTo(cx(1) - w * 0.32, L);
    for (let i = N; i >= 0; i--) { const t = (i / N) * 0.97; s.lineTo(cx(t) - (w / 2) * (1 - 0.28 * t), t * L); }
    const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.0035, bevelEnabled: true, bevelThickness: 0.0025, bevelSize: 0.004, bevelSegments: 2 }), steel);
    const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.007, 8), iron);
    const tsuka = new THREE.Mesh(new THREE.CylinderGeometry(0.0165, 0.0155, 0.27, 16), lacquer);
    tsuka.position.y = -0.14;
    const sword = new THREE.Group();
    sword.add(blade, tsuba, tsuka);
    sword.rotation.z = -Math.PI / 2;      // lie along +X, edge up
    sword.position.x = -drawnBy;
    const saya = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.016, 0.76, 16), lacquer);
    saya.rotation.z = -Math.PI / 2;
    saya.position.x = 0.38;
    saya.scale.set(1.3, 1, 0.75);
    const koi = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0022, 6, 24), ringRed ? new THREE.MeshBasicMaterial({ color: 0xc4453f }) : seam());
    koi.rotation.y = Math.PI / 2;
    g.add(sword, saya, koi);
    return g;
  };
  const rack = new THREE.Group();
  {
    const plinth = new THREE.Mesh(new RoundedBoxGeometry(2.4, 0.7, 1.1, 3, 0.04), stoneDark);
    plinth.position.y = 0.35;
    plinth.receiveShadow = true;
    rack.add(plinth);
    const base = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.07, 0.36, 2, 0.02), lacquer);
    base.position.y = 0.735;
    rack.add(base);
    for (const x of [-0.5, 0.5]) {
      const sh = new THREE.Shape();
      sh.moveTo(-0.04, 0); sh.lineTo(0.04, 0); sh.lineTo(0.03, 0.72); sh.quadraticCurveTo(0, 0.78, -0.03, 0.72); sh.closePath();
      const arm = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 }), lacquer);
      arm.position.set(x, 0.77, -0.11);
      rack.add(arm);
    }
    [0, 0, 0.05, 0.38].forEach((d, i) => {
      const k = katana(d, i === 3);
      k.position.set(-0.72, 0.97 + i * 0.16, 0);
      rack.add(k);
    });
    rack.position.copy(RACK.pos);
    rack.rotation.y = RACK.rotY;
  }
  scene.add(rack);
  const rackSpot = new THREE.SpotLight(0xdfe6ff, 2.2, 8, 0.28, 0.95, 1.5);
  rackSpot.position.copy(V(0.3, 3.0, -1.6).applyMatrix4(new THREE.Matrix4().compose(RACK.pos, new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), RACK.rotY), V(1, 1, 1))));
  rackSpot.target.position.copy(RACK.pos).add(V(0, 1.25, 0));
  if (opts.quality === "high") scene.add(rackSpot, rackSpot.target);

  // ---------------- set: the tsuba ring, one guard per tool group
  const tsubaRing = new THREE.Group();
  {
    const s = new THREE.Shape();
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      const r = 0.5 * (1 + 0.05 * Math.cos(4 * a));
      if (i) s.lineTo(Math.cos(a) * r * 0.93, Math.sin(a) * r);
      else s.moveTo(Math.cos(a) * r * 0.93, Math.sin(a) * r);
    }
    const hole = (cx: number, cy: number, rx: number, ry: number) => { const h = new THREE.Path(); h.absellipse(cx, cy, rx, ry, 0, Math.PI * 2, true); s.holes.push(h); };
    hole(0, 0, 0.05, 0.15); hole(-0.22, 0, 0.055, 0.1); hole(0.22, 0, 0.055, 0.1);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.3; hole(Math.cos(a) * 0.37, Math.sin(a) * 0.39, 0.026, 0.03); }
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 12 });
    const ironB = new THREE.MeshStandardMaterial({ color: 0x3a3a3f, roughness: 0.45, metalness: 0.45, bumpMap: stoneTex, bumpScale: 1.5, envMapIntensity: 1.3 });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.5;
      const t = new THREE.Mesh(geo, ironB);
      t.scale.setScalar(1.4);
      t.position.set(Math.cos(a) * 2.6, Math.sin(i * 1.7) * 0.3, Math.sin(a) * 2.6);
      t.rotation.set(0.3 * Math.sin(i), a + 0.9, 0.2 * Math.cos(i * 2));
      tsubaRing.add(t);
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.0025, 6, 128), seam(i === 0 ? 0.9 : 0.2));
      r.position.copy(t.position);
      r.rotation.copy(t.rotation);
      tsubaRing.add(r);
    }
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.003, 6, 200), seam(0.3));
    orbit.rotation.x = Math.PI / 2;
    tsubaRing.add(orbit);
    tsubaRing.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), steel));
    tsubaRing.position.copy(TSUBA_POS);
    tsubaRing.rotation.set(0.25, 0, 0.08);
    if (opts.quality === "high")
      for (const [p, c, i] of [[V(26, 11, -60), 0xdfe6ff, 40], [V(34, 4, -67), 0x9fb0d0, 25], [V(30, 7, -60.5), 0xffffff, 6]] as [THREE.Vector3, number, number][]) {
        const l = new THREE.PointLight(c, i, 14, 1.4);
        l.position.copy(p);
        scene.add(l);
      }
    else ironB.emissive = new THREE.Color(0x15171c);   // phones: no point lights here, a little self-light instead
  }
  scene.add(tsubaRing);

  // ---------------- mist: layers lying on the water around each set. The noise is baked once into a
  // tileable texture (two cheap lookups per pixel instead of five octaves of procedural noise).
  const mistNoise = (() => {
    const N = 256, cells = 8;
    const vnoise = (x: number, y: number, period: number) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
      const r = (a: number, b: number) => { const v = Math.sin((((a % period) + period) % period) * 127.1 + (((b % period) + period) % period) * 311.7 + period) * 43758.5453; return v - Math.floor(v); };
      const a = r(xi, yi), b = r(xi + 1, yi), c = r(xi, yi + 1), d = r(xi + 1, yi + 1);
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
    const data = new Uint8Array(N * N * 4);
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) {
        let v = 0, k = 0.5, f = 1;
        for (let o = 0; o < 5; o++) { v += k * vnoise((i / N) * cells * f, (j / N) * cells * f, cells * f); k *= 0.5; f *= 2; }
        const q = (j * N + i) * 4;
        data[q] = data[q + 1] = data[q + 2] = Math.round(v * 255); data[q + 3] = 255;
      }
    const t = new THREE.DataTexture(data, N, N);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
    t.needsUpdate = true;
    return t;
  })();
  const mistMats: THREE.ShaderMaterial[] = [];
  const mist = (center: THREE.Vector3, size: number, n: number, top: number, density: number) => {
    const g = new THREE.Group();
    for (let i = 0; i < n; i++) {
      const y = 0.04 + (n > 1 ? (i / (n - 1)) ** 1.6 : 0.3) * top;
      const m = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        fog: false,
        uniforms: { col: { value: new THREE.Color(NIGHT.mist) }, noise: { value: mistNoise }, seed: { value: i * 0.137 + 0.05 }, a: { value: (0.085 * density * (1 - y / (top * 1.15)) * 10) / Math.max(n, 3) * (n < 6 ? 0.75 : 1) }, cen: { value: center.clone() }, R: { value: size / 2 }, time: { value: 0 } },
        vertexShader: "varying vec3 w; void main(){ w = (modelMatrix*vec4(position,1.)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(w,1.); }",
        fragmentShader: `varying vec3 w; uniform sampler2D noise; uniform vec3 col; uniform float seed; uniform float a; uniform vec3 cen; uniform float R; uniform float time;
          void main(){
            vec2 uv = w.xz * 0.0275 + vec2(seed, seed * 1.7);
            float d = texture2D(noise, uv + vec2(time*0.005, time*0.002)).r * 0.65 + texture2D(noise, uv * 2.3 - vec2(time*0.004, 0.)).r * 0.35;
            d = smoothstep(0.42, 0.78, d);
            float edge = 1. - smoothstep(R*0.55, R, length(w.xz - cen.xz));
            float cam = smoothstep(0.8, 4.0, length(cameraPosition - w));
            gl_FragColor = vec4(col, d*a*edge*cam);
          }`,
      });
      mistMats.push(m);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m);
      p.rotation.x = -Math.PI / 2;
      p.position.set(center.x, y, center.z);
      p.renderOrder = 2;
      g.add(p);
    }
    scene.add(g);
    return g;
  };
  const layers = opts.quality === "high" ? 8 : 3;
  const mists = {
    slab: mist(V(2, 0, -2), 70, layers, 1.5, 1.15),
    path: mist(V(-4, 0, -40), 60, layers, 1.5, 1.25),
    rack: mist(V(14, 0, -40), 30, Math.max(2, Math.ceil(layers / 2)), 1.2, 0.6),
    tsuba: mist(V(30, 0, -62), 40, Math.max(2, Math.ceil(layers / 2)), 1.5, 0.8),
  };

  // ---------------- dust: motes around the camera, bright when backlit by the moon
  const dustMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
    uniforms: { col: { value: new THREE.Color(NIGHT.dust) }, moon: { value: MOON_POS }, time: { value: 0 }, px: { value: Math.min(window.devicePixelRatio, 1.5) } },
    vertexShader: `attribute float sz; varying float vA; uniform vec3 moon; uniform float time; uniform float px;
      void main(){
        vec3 pos = position;
        pos.x += sin(time*0.3 + position.y*2.) * 0.15; pos.y += sin(time*0.2 + position.x) * 0.1;
        vec4 wp = modelMatrix*vec4(pos,1.);
        vec4 mv = viewMatrix*wp; gl_Position = projectionMatrix*mv;
        float d = -mv.z; float near = smoothstep(2.5, 0.6, d);
        gl_PointSize = min(sz * 14. / d * (1. + near*5.), 70.) * px;
        vec3 toCam = normalize(cameraPosition - wp.xyz); vec3 toMoon = normalize(moon - wp.xyz);
        float fwd = pow(max(dot(-toCam, toMoon), 0.), 6.);
        vA = (0.22 + 1.6*fwd) * smoothstep(0.9, 1.8, d) * (1. - smoothstep(20., 45., d)) / (1. + near*12.) * step(0.05, wp.y); }`,
    fragmentShader: "uniform vec3 col; varying float vA; void main(){ vec2 c = gl_PointCoord-.5; float r = length(c); float a = 1. - smoothstep(0., .5, r); gl_FragColor = vec4(col, a*a*vA); }",
  });
  const dust = new THREE.Group();
  {
    const count = opts.quality === "high" ? 2600 : 700;
    const pos = new Float32Array(count * 3), sz = new Float32Array(count);
    let seed = 3;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 16;
      pos[i * 3 + 1] = (rand() - 0.4) * 7;
      pos[i * 3 + 2] = (rand() - 0.5) * 16;
      sz[i] = 0.6 + rand() ** 3 * 3.2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("sz", new THREE.BufferAttribute(sz, 1));
    const pts = new THREE.Points(geo, dustMat);
    pts.frustumCulled = false;
    dust.add(pts);
  }
  dustScene.add(dust);

  // ---------------- per-frame: palette (night → blood), moon phase, eclipse, animated bits
  const tmpC = new THREE.Color();
  function update(o: { time: number; camera: THREE.Camera; phase: number; blood: number; eclipse: number; ripple: THREE.Vector2; shadowAt: THREE.Vector3; tsubaSpin: number }) {
    const b = o.blood;
    skyMat.uniforms.top.value.copy(mixHex("skyTop", b, tmpC));
    skyMat.uniforms.hor.value.copy(mixHex("skyHor", b, tmpC));
    fogColor.copy(mixHex("fog", b, tmpC));
    moonMat.uniforms.col.value.copy(mixHex("moon", b, tmpC));
    moonMat.uniforms.glow.value = 0.25 * b;
    key.color.copy(mixHex("key", b, tmpC));
    key.intensity = 3.0 + 0.6 * b;
    for (const m of seamMats) m.color.copy(mixHex("seam", b, tmpC));
    for (const m of mistMats) { m.uniforms.col.value.copy(mixHex("mist", b, tmpC)); m.uniforms.time.value = o.time; }
    dustMat.uniforms.col.value.copy(mixHex("dust", b, tmpC));
    dustMat.uniforms.time.value = o.time;
    waterU.color.value.copy(mixHex("water", b, tmpC));
    waterU.deep.value.copy(mixHex("deep", b, tmpC));
    waterU.time.value = o.time;
    waterU.ripple.value.copy(o.ripple);
    const hm = halo.material as THREE.SpriteMaterial;
    hm.color.setRGB(1, 1 - 0.7 * b, 1 - 0.75 * b);
    halo.visible = moon.visible;
    hm.opacity = (0.35 + 0.25 * b) * (1 - o.eclipse) * (opts.quality === "high" ? 1 : 1.9);
    // moon phase: the light orbits the sphere, relative to where the camera looks from
    const toCam = o.camera.position.clone().sub(MOON_POS).normalize();
    const ref = V(-1, 0.25, 0);
    const side = ref.sub(toCam.clone().multiplyScalar(toCam.dot(ref))).normalize();
    const a = (o.phase * Math.PI) / 180;
    moonMat.uniforms.L.value.copy(toCam.clone().multiplyScalar(Math.cos(a)).add(side.multiplyScalar(Math.sin(a))));
    corona.lookAt(o.camera.position);
    (corona.material as THREE.MeshBasicMaterial).opacity = 0.85 * o.eclipse;
    coronaGlow.position.copy(MOON_POS).sub(toCam.clone().multiplyScalar(31));
    (coronaGlow.material as THREE.SpriteMaterial).opacity = 0.9 * o.eclipse;
    dust.position.copy(o.camera.position);
    shadowAround(o.shadowAt);
    tsubaRing.rotation.y = o.tsubaSpin;
  }

  const resize = (w: number, h: number) => {
    water.getRenderTarget().setSize(Math.round(w * reflScale), Math.round(h * reflScale));
  };

  return { scene, dustScene, moon, moonMat, water, update, setLantern, resize, sets: { slab, path, rack, tsubaRing, rackSpot }, mists, palette: { seam: (b: number) => mixHex("seam", b) } };
}
