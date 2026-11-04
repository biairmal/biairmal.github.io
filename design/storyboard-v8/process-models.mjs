// Raw Meshy GLB → /public/v2 GLB: real-world height, pivot at base centre, base colour only (WebP), simplified, meshopt.
// Deps (not in package.json): npm i @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer sharp
// Unzip environment_set.zip into a folder named environment_set (next to ronin_set) first. Run from the repo root: node design/storyboard-v8/process-models.mjs [name ...]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { center, clearNodeTransform, dedup, prune, weld, simplify, compactPrimitive, textureCompress, meshopt, getBounds, flatten, join } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { statSync, mkdirSync, existsSync } from 'fs';
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

const RAW = ['3d_raw_models/Samurai Garden/ronin_set', '3d_raw_models/Samurai Garden/environment_set'];
const OUT = 'public/v2';
mkdirSync(OUT, { recursive: true });
const raw = (k) => RAW.map((d) => `${d}/Meshy_AI_${k}/Meshy_AI_model.glb`).find(existsSync);
// name: [raw dir, height m, [desktop tris, tex px], [phone tris, tex px]]
const JOBS = {
  p1: ['ronin_p1_tengu_metsuke_20261104_texture_c7af1ee3', 1.8, [12000, 2048], [5000, 1024]],
  p2: ['ronin_p2_tengu_nukitsuke_20261104_texture_e456271f', 1.62, [9500, 1024], [4000, 512]],
  p3: ['ronin_p3_tengu_kiritsuke_20261104_texture_1b1b4c12', 1.3, [9600, 1024], [4000, 512]],
  p5: ['ronin_p5_tengu_noto_20261104_texture_85d60178', 1.8, [9600, 1024], [4000, 512]],
  p6: ['ronin_p6_tengu_furikaeri_20261104_texture_82325019', 1.8, [11500, 2048], [5000, 1024]],
  stone: ['His_Stone_Boulder_3D_20261104_generate_3946634e', 0.3, [620, 0], [620, 0]],
  wall: ['Japanese_Earthen_Wall_Segment_20261104_image-to-3d-texture_caa9213f', 2.4, [1500, 0], [700, 0]],
  gate: ['Japanese_Garden_Gate_20261104_image-to-3d-texture_9b10d514', 3.4, [2500, 0], [1000, 0]],
  house: ['Japanese_House_with_Veranda_20261104_texture_81c91e29', 4.6, [8700, 2048], [4500, 1024]],
  rack: ['Japanese_Weapon_Rack_20261104_texture_4045b196', 1.6, [6000, 0], [2500, 0]],
  pine_tall: ['tall_japanese_pine_20261104_texture_b84e0d44', 1, [2600, 1024], [1100, 512]],
  pine_mid: ['medium_japanese_pine_20261104_texture_0f3190e1', 1, [1900, 1024], [800, 512]],
  target: ['tameshigiri_uncut_target_3d_20261104_texture_f9a4f287', 1.6, [720, 512], [400, 256]],
  target_lo: ['tameshigiri_cut_lower_3d_20261104_texture_2f0f2666', 1.6, [740, 512], [400, 256]],
  target_top: ['tameshigiri_cut_top_3d_20261104_texture_3723533e', 0.5, [450, 512], [260, 256]],
};
// Dense scans (wall, gate, rack): their UV islands break apart under simplification, so the texture is baked into
// vertex colours first (averaged across seams), the UVs and texture dropped, and the now-connected mesh simplified.
async function toVertexColour(doc) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  for (const p of prims(doc)) {
    const tex = p.getMaterial()?.getBaseColorTexture(), uv = p.getAttribute('TEXCOORD_0');
    if (!tex || !uv) continue;
    const { data, info } = await sharp(Buffer.from(tex.getImage())).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const pos = p.getAttribute('POSITION'), n = pos.getCount(), col = new Float32Array(n * 3), sum = new Map(), key = [];
    for (let i = 0; i < n; i++) {
      const [u, v] = uv.getElement(i, []), x = Math.min(info.width - 1, Math.max(0, Math.floor((u - Math.floor(u)) * info.width))), y = Math.min(info.height - 1, Math.max(0, Math.floor((v - Math.floor(v)) * info.height)));
      const o = (y * info.width + x) * 3, k = pos.getElement(i, []).map((c) => Math.round(c * 1e5)).join(',');
      const e = sum.get(k) ?? [0, 0, 0, 0]; e[0] += lin(data[o] / 255); e[1] += lin(data[o + 1] / 255); e[2] += lin(data[o + 2] / 255); e[3]++; sum.set(k, e); key.push(k);
    }
    for (let i = 0; i < n; i++) { const e = sum.get(key[i]); col.set([e[0] / e[3], e[1] / e[3], e[2] / e[3]], i * 3); }
    p.setAttribute('COLOR_0', doc.createAccessor().setType('VEC3').setArray(col).setBuffer(pos.getBuffer()));
    for (const a of ['TEXCOORD_0', 'TEXCOORD_1', 'NORMAL']) p.setAttribute(a, null);
    p.getMaterial().setBaseColorTexture(null);
  }
  await doc.transform(prune(), weld());
}
const only = process.argv.slice(2);
const prims = (doc) => doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives());
const tris = (doc) => prims(doc).reduce((n, p) => n + p.getIndices().getCount() / 3, 0);

for (const [name, [dir, H, ...lods]] of Object.entries(JOBS)) {
  if (only.length && !only.includes(name)) continue;
  for (const [li, [maxTris, px]] of lods.entries()) {
    const doc = await io.read(raw(dir));
    // base colour only: the look is matte, and the low-poly facets carry the shape
    for (const m of doc.getRoot().listMaterials()) {
      m.setNormalTexture(null).setOcclusionTexture(null).setMetallicRoughnessTexture(null).setEmissiveTexture(null);
      m.setMetallicFactor(0).setRoughnessFactor(1);
    }
    await doc.transform(prune(), dedup(), flatten(), join(), weld());
    if (!px && doc.getRoot().listTextures().length) await toVertexColour(doc);
    const before = tris(doc);
    if (before > maxTris) {
      await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: maxTris / before, error: 0.02 }));
      // image-to-3d scans are fragmented (UV islands): plain simplify stalls far above budget, so finish sloppily
      if (tris(doc) > maxTris * 1.15) for (const p of prims(doc)) {
        const idx = new Uint32Array(p.getIndices().getArray()), pos = new Float32Array(p.getAttribute('POSITION').getArray());
        const [out] = MeshoptSimplifier.simplifySloppy(idx, pos, 3, null, Math.floor(maxTris * 3 * (idx.length / 3 / tris(doc))), 1);
        p.getIndices().setArray(out); compactPrimitive(p);
      }
    }
    // Meshy leaves a few zero-length normals: they shade to NaN, which bloom smears into black blocks
    for (const p of prims(doc)) {
      const n = p.getAttribute('NORMAL'); if (!n) continue;
      for (let i = 0, e = []; i < n.getCount(); i++) { n.getElement(i, e); if (!(Math.hypot(...e) > 1e-4)) n.setElement(i, [0, 1, 0]); }
    }
    await doc.transform(center({ pivot: 'below' }));
    const scene = doc.getRoot().listScenes()[0];
    const b = getBounds(scene), k = H / (b.max[1] - b.min[1]);
    for (const n of scene.listChildren()) { n.setScale(n.getScale().map((s) => s * k)); n.setTranslation(n.getTranslation().map((t) => t * k)); clearNodeTransform(n); }
    const steps = [prune()];
    if (px) steps.push(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [px, px], quality: 82 }));
    steps.push(meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
    await doc.transform(...steps);
    const file = `${OUT}/${name}${li ? '-mobile' : ''}.glb`;
    await io.write(file, doc);
    const nb = getBounds(scene);
    console.log(`${name}${li ? '-m' : ''}`.padEnd(14), String(before).padStart(8), '→', String(tris(doc)).padStart(6), 'tris', nb.max.map((v, i) => (v - nb.min[i]).toFixed(2)).join('x'), (statSync(file).size / 1024).toFixed(0).padStart(5), 'KB');
  }
}
