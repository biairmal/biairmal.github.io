# v8 · Meshy prompts (all assets, from scratch)

The look: **low-poly stylised realism.** Real proportions and real materials, built from simplified forms with
visible broad facets and no fine detail. It sits between a realistic scan and a cartoon: no exaggerated shapes,
no outlines, no toy colours. Colour is muted traditional Japanese colours, with red as the only strong accent.

Built in code, not Meshy: the moon, sky, ridges, sea of cloud, raked gravel, particles, ghosts, fire and glow.

---

## 1. How to use this file

1. **Lock the style first.** Generate the **stone lantern** (§4.3), the asset you already like, and compare it with
   the current one. Adjust the style block until it looks right, then use the same block for everything.
2. **Every prompt = style block + asset prompt.** Paste the style block (§2) after each asset prompt. Paste the
   "avoid" line into the negative prompt field, or at the end of the prompt if there is no such field.
3. **Then the ronin:** generate **P1** first, and use a render of it as the image reference for P2–P6 so the
   costume matches.
4. **Export:** GLB, remeshed to the triangle count in the tables, with textures at the listed size. Make a desktop
   version and a phone version where both are listed. I handle the rest (real-world size, pivot, WebP, compression).

### Texture or not

Meshy exports each model as one mesh, so without a texture it can only have one colour.

- **Texture** everything made of more than one material. The ronin (indigo, black, straw, red), the pines (trunk and
  foliage), the wall (plaster, wood, tiles), the gate, the house (which needs its paper texture for the glow), the
  weapon rack and the targets (straw, wood, red cords).
- **No texture** for the single-material models: his stone, the garden rocks, the stepping stone, the lantern, the
  fire basket, the small plants and the pagoda. I colour them in code from the palette, with a subtle procedural grain.
  The colours come out exact, the files are smaller, and you save Meshy credits. Ignore the Texture column in their tables.

When you texture:
- Put the colour words in Meshy's texture prompt field, if it has one.
- Ask for **base colour only**. No metallic, roughness or normal maps: the look is matte, and the facets already
  give the shape.
- If Meshy offers to remove baked lighting, turn it on.

---

## 2. The shared style block

> **Style:** *"low-poly stylised realism, simplified forms with broad flat facets, realistic proportions, clean
> silhouette, matte hand-painted textures with flat even colour, no baked shadows or highlights, muted traditional
> Japanese colours, single object, centred, no ground plane, no base, no background."*

> **Avoid:** *"cartoon, chibi, toy, exaggerated proportions, outlines, glossy, photorealistic scan, fine detail,
> small ornaments, engravings, cracks, moss, dirt, text, logos, ground, pedestal, floor, multiple objects."*

**No baked shadows** matters most: the scene relights every model for dark mode (red moonlight) and light mode
(overcast day). Shadows painted into a texture would show up in both.

---

## 3. Palette

Traditional colour names. The hex values are this site's picks: aim for them, they don't need to be exact.

| Colour | Name | Hex | Where |
|---|---|---|---|
| Ink black | 墨 sumi | `#1e1d1b` | lacquer, roof tiles, iron, the ronin's hakama |
| Indigo | 藍 ai | `#263d4a` | the ronin's kimono (indigo-dyed, faded) |
| Pine green | 松葉 matsuba | `#3e5232` | pine foliage |
| Chestnut | 栗 kuri | `#5b3d2b` | wood: posts, veranda, stands |
| Mouse grey | 鼠 nezumi | `#7d7b76` | stone: lanterns, rocks, stepping stones |
| Earth ochre | 朽葉 kuchiba | `#a08560` | the earthen wall, straw targets, the straw hat |
| Unbleached paper | 生成 kinari | `#efe9dc` | shōji paper |
| **Vermilion red** | 朱 shu | **`#c4453f`** | **the accent**: the gate, sword cords, the ronin's inner collar, target bindings |

Red stays small. It goes on cords, bindings, one collar line and the gate, nothing else. In a frame of greys and
indigo, those few touches carry the brand.

---

## 4. Asset prompts

### 4.1 The ronin: six static poses

**Base prompt** (same every time, with one pose line added):

> *"Lone ronin samurai, adult man, realistic proportions, faded indigo kimono, ink-black hakama trousers, a thin
> vermilion red collar showing under the kimono, wide conical straw hat (kasa) hiding the eyes, straw sandals,
> katana in a black lacquered scabbard on the left hip with a vermilion red cord, full body, static pose, both
> feet flat on the ground,"* + pose line + style block.

| Pose | Pose line | Tris desktop / phone | Texture |
|---|---|---|---|
| P1 目付 Metsuke | *"standing still facing forward, left hand on the scabbard with thumb on the guard, right hand resting near the hilt, ready"* | 12k / 5k | 2048 / 1024 |
| P2 抜付 Nukitsuke | *"mid-draw, blade half out of the scabbard and horizontal, front foot stepping forward"* | 10k / 4k | 1024 / 512 |
| P3 切付 Kiritsuke | *"low wide stance, the cut finished, sword arm extended forward and down"* | 10k / 4k | 1024 / 512 |
| P4 血振 Chiburi | *"low stance, katana held out to his right side at waist height after flicking blood off the blade, eyes following the blade"* | 10k / 4k | 1024 / 512 |
| P5 納刀 Nōtō | *"standing, resheathing the katana: blade tip at the mouth of the scabbard on his left hip, left hand guiding it"* | 10k / 4k | 1024 / 512 |
| P6 振り返り Furikaeri | *"standing tall, sword sheathed on the left hip, arms relaxed, seen from behind, head turned over his right shoulder looking back"* | 12k / 5k | 2048 / 1024 |

Check before exporting: the katana is **one straight, clean piece**, separate from the hand and leg (blades often fuse
or bend). There is no ground slab under the feet. The hat brim is a clean cone.

### 4.2 Pine tree (×2)

A normal pine whose silhouette reads as a **triangle** from far away. Solid foliage masses only: thin, transparent
needle cards break apart at web budgets, which is what made the old pine look noisy.

> *"Japanese pine tree, conifer with a conical overall shape, its silhouette a clean tall triangle, a straight dark
> trunk visible at the bottom, foliage in 6–8 stacked solid tiers that get smaller toward the pointed top, small gaps
> between tiers, pine green foliage, grey-brown bark, no thin leaf planes, no transparent needles,"* + style block.

| Variant | Extra line | Tris desktop / phone | Texture |
|---|---|---|---|
| Tall | *"tall and slender, about 14 m"* | 2.5k / 1k | 1024 / 512 |
| Medium | *"medium, fuller and wider at the base, about 7 m"* | 2k / 800 | 1024 / 512 |

### 4.3 Stone lantern (tōrō): the current design, simplified

> *"Japanese stone garden lantern (tōrō), kasuga style, about 1.6 m tall: a stepped base, a round column, a middle
> platform, a square fire box with open window holes on all four sides, a hexagonal roof with gently upturned
> corners, a round jewel finial on top, smooth plain grey stone, no carvings, no moss, no cracks,"* + style block.

| Tris desktop / phone | Texture |
|---|---|
| 800 / 400 | 1024 / 512 |

The fire box window holes must be **open** (real holes), so the light I place inside shows through them.

### 4.4 Rocks and stones

> **His stone:** *"a single flat-topped natural granite boulder, about 1.4 m wide and 0.4 m tall, broad flat top big
> enough to stand on, softened faceted sides, grey stone,"* + style block.

> **Garden rock** (×2 variants): *"an upright weathered garden rock for a Japanese dry garden, about 1.2 m tall,
> irregular faceted shape, grey stone,"* + *"tall and narrow"* / *"low and wide"* + style block.

> **Stepping stone:** *"a single flat irregular stepping stone, about 0.8 m across and 0.12 m thick, slightly
> rounded edges, grey stone,"* + style block.

| Asset | Tris desktop / phone | Texture |
|---|---|---|
| His stone | 600 / 300 | 1024 / 512 |
| Garden rock (each) | 500 / 250 | 512 / 256 |
| Stepping stone | 200 / 120 | 512 / 256 |

### 4.5 Earthen wall segment (tsuiji)

> *"a straight segment of a Japanese earthen garden wall (tsuiji), 4 m long, 2.2 m tall, 0.5 m thick, smooth
> weathered ochre earth plaster, a dark wooden strip along the bottom, a small ink-grey clay-tile roof cap along
> the top, both ends cut flat and square so segments line up end to end,"* + style block.

| Tris desktop / phone | Texture |
|---|---|
| 1.2k / 600 | 1024 / 512 |

### 4.6 Garden gate

> *"a small roofed Japanese garden gate, two square posts and a crossbeam in vermilion red lacquer, a small ink-grey
> clay-tile roof with gently curved eaves, about 3.5 m wide and 3.2 m tall, open with no doors,"* + style block.

| Tris desktop / phone | Texture |
|---|---|
| 1.5k / 700 | 1024 / 512 |

This is the one red building in the garden: it sits at the end of the path, so the camera walks toward it through Approach.

### 4.7 House with veranda

> *"a small single-storey traditional Japanese house, about 8 m wide, 6 m deep and 5 m tall, a raised wooden
> veranda (engawa) about 1 m deep running along the whole front at knee height, the front wall made of sliding shōji
> screens with a wooden lattice over unbleached paper, chestnut-brown wooden posts and beams, a hip-and-gable roof
> of ink-grey clay tiles with deep overhanging eaves, a flat stone step in front of the veranda,"* + style block.

| Tris desktop / phone | Texture |
|---|---|
| 12k / 5k | 2048 / 1024 |

Two things the film depends on:
- **Bright paper.** The shōji paper must be the brightest colour in the texture, close to white. The glow behind the
  screens is made from the bright parts of the texture.
- **A flat, open veranda floor.** The weapon rack stands on it, so nothing should be lying on it.

### 4.8 Weapon rack (Toolkit)

Four weapons, one per toolkit group: Backend, Frontend, Database, DevOps & cloud.

> *"a Japanese weapon display on one low black-lacquered wooden base, about 1.3 m wide and 0.5 m deep: a horizontal
> three-tier sword stand (katana-kake) holding a katana, a wakizashi and a tantō in black lacquered scabbards with
> vermilion red cords, and beside it an upright longbow (yumi) with a quiver of arrows, all straight and clean,"* +
> style block.

| Tris desktop / phone | Texture |
|---|---|
| 4k / 1.5k | 1024 / 512 |

### 4.9 Cutting targets (tameshigiri): uncut and cut

Three models. The cut target comes in **two separate pieces**, so I can hang the top piece in mid-fall above the
stand: Meshy outputs one mesh per generation, and a single model would fuse the two pieces together.

> **Uncut:** *"a tameshigiri cutting target: a rolled straw tatami mat, about 0.2 m thick and 0.6 m tall, standing
> upright on a thin wooden post with a simple cross-shaped wooden foot, the straw roll bound with two thin vermilion
> red cords, straw ochre colour, intact and uncut,"* + style block.

> **Cut, lower piece:** *"the lower part of a tameshigiri cutting target after a clean diagonal sword cut: a rolled
> straw tatami mat on a thin wooden post with a cross-shaped wooden foot, the roll ends at a clean flat cut face sloping
> at about 35 degrees, the cut face showing tightly packed pale straw in rings, one thin vermilion red cord binding
> below the cut, straw ochre colour,"* + style block.

> **Cut, top piece:** *"the severed top piece of a rolled straw tatami mat, about 0.2 m thick, a short cylinder
> with a flat top and a clean flat cut face at the bottom sloping at about 35 degrees, the cut face showing tightly
> packed pale straw in rings, one thin vermilion red cord binding, straw ochre colour, no post, no stand,"* + style block.

| Asset | Tris desktop / phone | Texture |
|---|---|---|
| Uncut | 800 / 400 | 512 / 256 |
| Cut, lower piece | 700 / 350 | 512 / 256 |
| Cut, top piece | 500 / 250 | 512 / 256 |

Generate the uncut target first, then use a render of it as the image reference for both cut pieces. That way the roll
thickness, straw colour and cords match, and the two cut faces meet cleanly when I line them up.

### 4.10 Fire basket (kagaribi)

> *"a Japanese fire basket (kagaribi), an open basket of curved black iron straps on a tall three-legged iron stand,
> about 1.6 m tall, empty, no fire, no logs,"* + style block.

| Tris desktop / phone | Texture |
|---|---|
| 1.5k / 700 | 512 / 256 |

The fire and its glow are made in code, so the basket must be empty.

### 4.11 Far pagoda (optional)

It is only ever seen as a silhouette in the distance, so the primitives in the previz work too.

> *"a five-storey Japanese pagoda, simple massing, five stacked roofs getting smaller toward the top, a thin spire on
> top, very simple, dark wood and grey roofs, about 30 m tall,"* + style block.

| Tris (one version) | Texture |
|---|---|
| 800 | 512 |

### 4.12 Small plants

A dry garden keeps its planting sparse and low: small clumps that hug the bases of the rocks, the foot of the walls,
the lanterns and the veranda step, never out on the open gravel. The same rule as the pines applies: **chunky solid
clumps, no thin blades or leaf planes**, so they stay clean at low poly and read as shapes against the gravel.
Each one is placed many times, so the budgets are tiny.

> **Clipped shrub** (karikomi, ×2 variants): *"a Japanese clipped azalea shrub (karikomi), a dense rounded mound of
> small leaves with a smooth clipped surface, dark green,"* + *"low and wide, about 1.2 m across and 0.6 m tall"* /
> *"smaller and taller, about 0.7 m across and 0.7 m tall"* + style block.

> **Grass tuft:** *"a small clump of Japanese mondo grass, a dense rounded tuft about 0.3 m wide, thick blades merged
> into a solid clump, dark green,"* + style block.

> **Fern:** *"a small Japanese garden fern, about 0.5 m wide, a few broad fronds arching from the centre, chunky
> simplified fronds, pine green,"* + style block.

> **Dwarf bamboo** (sasa): *"a small clump of dwarf bamboo (sasa), about 0.8 m wide and 0.6 m tall, broad leaves in
> chunky simplified clusters, green with pale dry leaf edges,"* + style block.

| Asset | Tris desktop / phone | Texture |
|---|---|---|
| Clipped shrub (each) | 600 / 300 | 512 / 256 |
| Grass tuft | 300 / 150 | 512 / 256 |
| Fern | 400 / 200 | 512 / 256 |
| Dwarf bamboo | 600 / 300 | 512 / 256 |

**Moss is made in code**, not modelled: soft green patches painted into the gravel shader around each rock and
along the wall foot. In light mode the plants turn a soft grey-green, like the pines.

---

## 5. Totals

| | Desktop | Phone |
|---|---|---|
| Six ronin poses | ~64k tris | ~26k tris |
| Everything else | ~34k tris | ~15k tris |
| Estimated download (meshopt + WebP) | ~3.6 MB | ~1.5 MB |

That is lighter than v7 (~6.5 MB desktop / ~3.5 MB phone), and only the hero set loads before the first frame:
P1, his stone and the pines.
