# Storyboard v8 · 刹那 Setsuna — "One Instant"

> The whole site is a single instant, held still.
> As you start to scroll, time slows and stops: embers and ash hang in the air.
> The visitor is the only thing that moves. **Scrolling is the only clock.**

Route: `/v2` (app/v2, components/v2; models in public/v2, made by process-models.mjs). Dark mode first, light mode is the same instant under a white sky.
No character animation anywhere. He holds a still pose in each beat, and the camera alone hides every pose change.

---

## 1. Rules of this film

1. **He never moves on screen.** A pose changes only (a) behind a foreground object, (b) while he dissolves into or
   condenses out of his own particles, or (c) while the camera is looking elsewhere. Nothing flashes.
2. **Time is a uniform.** One `uTime` drives particles, mist and embers. Its speed (`timeScale`) is set per shot:
   `1` (flowing) → eases to `0` (frozen) → `1` (resumes at Contact). While frozen, `uTime` is a tiny function of scroll,
   so particles inch forward only while you scroll and hang still the moment you stop.
3. **Frozen particles + moving camera = bullet time.** Every shot during the freeze has lateral camera motion, so the
   hanging particles parallax. That parallax is what sells "time has stopped".
4. **One continuous camera, always low.** No cuts, no views from above. The camera stays at eye height or lower and
   never shows all the walls at once, so the garden never reads as a small box.
5. **Colour:** ink black, bone white, greys. Red `#c4453f` only for the moon/sun, embers, blood drops and one UI accent.
   (v7's gold `#c9a46a` counter in Approach becomes red or neutral.)

---

## 2. The world: a walled dry garden on a cliff

A **karesansui** (dry garden): raked gravel that *represents* water, replacing v7's lake. The gravel is a flat plane
with a procedural raked-line shader (parallel lines, rings around each rock), so the Reflector and its second scene
render per frame are gone. It fits the brand too: *every line of code, a deliberate cut* ↔ every raked line drawn deliberately.

**Enclosed on three sides, open on the fourth.** An earthen wall with a tiled cap (*tsuiji*, like Ryōan-ji's) runs
along the west, east and south sides, with a small gate in the south wall. The north side is open: the cliff edge, a
sea of cloud far below, the ridges and the blood moon. A closed room facing an open void: the enclosure fills the
frame wherever the camera looks back, and the void makes the world feel vast wherever it looks out.

```
             (−Z)  BLOOD MOON · ridges · far pagoda in the cloud · sea of cloud below
   ────────────────────────────── cliff edge (open) ──────────────────────────────
   ║  tree               ◆ HIS STONE (P1, then P6)                       tree   ║
   ║                       ( ( raked rings ) )                                   ║
   ║            rock          ○ ghost 1 Metsuke                ┃ VERANDA       ║
   ║                            ○ ghost 2 Nukitsuke            ┃ rack on the   ║
 W ║                          ○ ghost 3 Kiritsuke   tree       ┃ veranda floor ║ E
 A ║  P4 ✕✕✕✕ targets          ○ ghost 4 Nōtō                  ┃ house · shōji ║
 L ║  brazier                  ·  (path of stepping stones)                    ║
 L ║  tree                rock ·                                  rock         ║
   ╚═════════════════════════  ⛩ gate  ══════════════════════════════════════╝
        trees beyond the walls: their pads show over the tiled cap
```

- **Cliff edge (−Z):** he stands on his stone at the very edge, facing the moon. One tree leans out over the void.
- **Far:** the three procedural ridges from v7, the sea of cloud, and a **pagoda on a far peak** with one warm window
  (dark mode). It is the scale cue: it tells you how far away the ridges are.
- **Garden:** about 36 × 26 m inside the walls. Five rocks (his_stone reused) with raked rings.
- **Stepping-stone path:** from him to the gate, with four lanterns and four ghosts beside it. This is Approach.
- **West corner:** the cut targets and the brazier (Work). **East:** the house; its veranda holds the weapon rack (Toolkit).
- **Beyond the walls:** trees whose canopies show over the cap, so the wall never ends in empty sky.

---

## 3. His poses

| ID | Name | Pose | Used in |
|----|------|------|---------|
| P1 | 目付 **Metsuke** (the gaze) | Standing, left hand on the scabbard, thumb on the guard, right hand resting at the hilt, eyes forward | Hero, About, Approach ghost 1 |
| P2 | 抜付 **Nukitsuke** (the draw) | Front foot stepping out, blade half out of the scabbard, horizontal | Approach ghost 2 |
| P3 | 切付 **Kiritsuke** (the cut) | Low wide stance, cut finished, sword arm extended forward and down | Approach ghost 3 |
| P4 | 血振 **Chiburi** (shaking off the blood) | Blade flicked out to the side, low, eyes down the blade | Work |
| P5 | 納刀 **Nōtō** (resheathing) | Blade tip at the mouth of the scabbard, sliding home | Approach ghost 4 |
| P6 | 振り返り **Furikaeri** (looking back) | Standing, sword sheathed, back to camera, head turned over his shoulder toward the viewer | Contact |

**Approach = the kata.** The four stages of iaijutsu map onto the four stages of the site:
Plan = **Metsuke** (see it first) · Build = **Nukitsuke** (the draw) · Ship = **Kiritsuke** (the cut that lands) ·
Sustain = **Nōtō** (resheathe, ready again). The draw and the cut appear only here, as ghosts. The opening has no cut.

### How the poses are made

**Static, unrigged models, one per pose, generated in Meshy** (prompts in §9). The film never moves him, so a rig
adds nothing. Each pose is about 0.25–0.4 MB desktop / 0.1–0.15 MB phone: 2048 textures for the close-ups
(P1, P6) and 1024 for the rest. Each loads only when its section is near.
The ghost point clouds are sampled from these meshes at load, so they need no extra files.

**Stand-in until P4 exists:** P3 stands at the targets (`WORK_POSE` in components/v2/scene.js).

---

## 4. Shot list

`svh` = scroll length. Lens in mm (24 mm sensor height, as in v7). Desktop framing first, then phone (portrait).

### S01 · Hero: "The moment before" — `100svh` · P1 · time **flowing**
- **Camera:** 3.4 m behind him on the line to the moon, low (1.05 m), looking slightly up, 40 mm. The blood moon sits
  behind his hat and shoulders like a halo; he is right of centre. Far left, the pagoda stands in the sea of cloud.
  Hero text on the left (v7, unchanged). **Phone:** 32 mm, him and the moon in the lower half, text above.
- **World:** embers rise slowly from below the cliff, ash drifts, mist rolls over the cloud sea. Pointer parallax as in v7.
- **UI:** a mono timecode top-right: `刹那 00:00:00.000`, ticking with `uTime`. "Scroll to draw" stays.

```
┌───────────────────────────────────────┐
│ Every line of code,       ·   ▄███▄   │
│ a deliberate cut.           ▄█◢██◣█▄  │  ← the moon behind his hat
│ I'm Bandana…       ·        ██▐█▌██   │
│ [Start a project]   ┼ pagoda  ▐█▌     │
│ ~~~~~~~~~ cloud sea ~~~~~~~~~ ▐█▌     │
└───────────────────────────────────────┘
```

### S02 · "Time slows" (Hero → About) — `120svh` · P1 · time **stops**
- **Camera:** starts circling him **clockwise**, toward his left side (radius 3.2 m, 38 mm). Nothing cuts and nothing flashes.
- **Time:** `timeScale` eases from 1 to 0 across this move. The embers decelerate and stop, and the ash hangs still.
  The timecode digits slow and stop, and a small red `■ frozen` appears beside them.

### S03 · About: "Bullet time" — `100svh + 60svh hold` · P1 frozen
- **Camera:** keeps circling the frozen moment clockwise, from his left side round to his front, 35 mm, sinking 1.3 → 0.9 m
  (a low hero angle). This is **the reveal of the garden**: the hero showed only the void, and now the walls, the house,
  the lantern path and the ghosts appear behind him. The hanging embers parallax across all of it.
- **UI:** About text on the left (desktop) / bottom (phone), as in v7.

```
┌───────────────────────────────────────┐
│ 人 ABOUT        ☁ tree      ☁ tree    │
│ Backend by trade,  ·   ▄██▄   ·       │
│ full-stack…  house ┃ ▐█▌░ ghost ⛯     │  ← him from the front, the garden behind
│ Based in   Jakarta ┃ ▐█▌  ═══wall═══  │
│              ≈≈≈ raked rings ≈≈≈      │
└───────────────────────────────────────┘
```

### S04 · Approach: "The kata" — `400svh` pinned (v7 slides, **kept as-is**) · 4 ghosts
- **Camera:** continues the clockwise turn: past his front it carries on round his right side onto the path, and walks
  **away from him, toward the gate**: low (0.8 m), 30 mm. The circle and the walk read as one movement.
  At each lantern it eases to a stop and turns toward that stone's ghost (left, right, left, right). The gate grows ahead.
- **The ghosts: condense / dissolve.** Beside the path stand *digital afterimages* of him: his pose drawn as a point
  cloud (red-grey points, sampled from the pose mesh). As the camera arrives, the points condense into the solid pose.
  As it leaves, the pose dissolves back into points that hang in the air. Metsuke → Nukitsuke → Kiritsuke → Nōtō.
- **UI:** v7's ApproachSlides unchanged, plus the kata term in the counter: `01 / 04 · 目付 METSUKE`, then the big "Plan".
  The four diamond marks stay.

### S05 · Work: "What was cut" — section length · P4
- **Camera:** from the last stone, a **whip pan** right (inside ~5% of scroll) to the west corner. Settles at 36 mm, 1.4 m.
  P4 was placed there while off-screen. The brazier is close in the left foreground and gives the warm key.
- **World:** four targets, one per project. The three finished projects are **cut**: their top pieces hang mid-fall,
  slid along the diagonal cut and tilted, with straw fragments frozen around them. The fourth, the current project
  (the bank rewrite, 2025 – now), still stands **uncut**: work in progress. P4 stands right of them, blade flicked out,
  an arc of red drops hanging off the blade.
- **UI:** the accordion stays. Opening a row eases the camera ~0.5 m toward that row's target (4 projects = 4 targets).
  The result line of the open row gets the red accent.

```
┌───────────────────────────────────────┐
│ 戦 RECENT WORK       ◢   ◢   ◢   ◢    │  ← top halves hanging mid-fall
│ Shipped in…  🔥      ▐   ▐   ▐   ▐ ▄█ •••│  ← P4 Chiburi, red drops
│ 01 Mobile banking…  +                 │
│ 02 Event-driven…    +   ≈≈ gravel ≈≈  │
└───────────────────────────────────────┘
```

### S06 · Toolkit: "Tools I trust" — section length · no ronin
- **Camera:** a lateral track east, close past a small tree that fills the frame for a moment (**foreground wipe**),
  to the veranda. It settles on the gravel by the step stone, at the height of the veranda floor, 42 mm,
  then dollies along the rack as the section scrolls.
- **World:** the rack stands **on the veranda floor**, against the lit shōji (v7 paper glow). Four weapons = four groups
  (Backend, Frontend, Database, DevOps & cloud).
- **UI:** the 4-column grid stays. Hovering a group raises a light on its weapon (a uniform, not a new light).
  On phones, the camera's dolly picks the weapon for the group in view.

### S07 · "Time resumes" (Toolkit → Contact) — `80svh` · P1 → **P6** (swapped off-screen)
- **Camera:** rises off the veranda, arcs back across the garden and turns to the moon. It ends behind him with a
  **dolly zoom**: the camera pulls back while the lens goes 35 → 85 mm, so he stays the same size and the moon swells behind him.
- **Time:** `timeScale` eases 0 → 1. Embers start rising again and the mist rolls. The timecode resumes ticking.

### S08 · Contact — section + footer · P6
- **Camera:** holds the telephoto (85 mm), 12 m behind him: a huge moon, him in silhouette inside it, looking back over
  his shoulder at you. The edge of a lantern frames the left. A slow 0.2 m drift.
  It mirrors the hero shot: same line to the moon, close at the start, far at the end.
- **UI:** **v7 Contact text placement, kept** ("Have something / that needs to ship?" at 104 px). Email link with the slash hover.
- **Phone:** 50 mm, moon top half, him small at the bottom edge, text in between.

```
┌───────────────────────────────────────┐
│ 連 CONTACT              ████████      │
│ Have something        ██  ▄█▄   ██    │
│ that needs to ship?    ██ ▐█◥ ██      │  ← inside the moon, looking back
│ bandanairmal@… ↗          ▐█▌         │
│ ~~~~~~~~~ cloud sea ~~~~~~~~ 00:00:04 │
└───────────────────────────────────────┘
```

---

## 5. Pose-change toolkit (camera only)

| Technique | How | Cost | Used |
|-----------|-----|------|------|
| Foreground wipe | The camera tracks past a near object that fills the frame for a few frames; swap behind it | free | S06 |
| Whip pan | A fast turn inside a short scroll window; swap mid-pan | free | S05 |
| Condense / dissolve | Pose mesh ↔ its own point cloud: a noise-threshold cut-out on the mesh, with points appearing where it is cut | 1 Points draw per ghost | S04 |
| Off-screen swap | Change the pose while the camera looks elsewhere | free | S05, S07 |
| Dolly zoom | Not a swap: the reveal that makes the new pose feel like an arrival | free | S07 |

No flashes or white-outs anywhere, including the theme switch (§7).

---

## 6. Particles

| Layer | Dark | Light | Count (desktop / phone) |
|-------|------|-------|-------------------------|
| Ash | grey flakes, small | snow, pale grey | 1600 / 600 |
| Embers | red-orange, rising from the cliff | a few red petals (camellia) | 250 / 100 |
| Blood drops | red, on P4's blade (S05) | same | ~15 |
| Ghost points | red-grey | ink grey | 6k / 2.5k per ghost, sampled at load |

Ash, embers and drops share **one** `Points` draw call. Motion is a function of `uTime` in the vertex shader,
so a frozen frame costs zero CPU.

---

## 7. Light mode: 白昼 "the white instant"

The same instant on an overcast morning. **The models keep their materials**: soft, even daylight shows the
fabric, wood and stone as mid tones. They are not black silhouettes. Distance fades to paper white (aerial perspective),
so the far layers stay light and quiet behind the text.

| | Dark | Light |
|---|---|---|
| Sky | `#0b0303` → horizon `#3a0e0a` | paper `#f3f0ea` → horizon `#dcd5ca` |
| Disc | blood moon `#e0503e` with halo | **red sun**, flat `#c4453f`, no halo |
| Gravel | dark slate, faint raked highlights | bone white, grey rake shadows |
| Walls | dark plaster, black tiles | warm grey plaster `#c9bfae`, charcoal tiles |
| Fog / cloud sea | deep red-black | white mist |
| Light on the models | red moonlight + warm fill | overcast: strong sky light, soft white key |
| Particles | ash + embers | snow + red petals |
| Lanterns / shōji | lit, warm | unlit, paper-white |

- **Text stays readable in both modes:**
  - The text sits where the scene is quiet: left on desktop, top or bottom on phones.
  - A soft scrim fades in behind it: black in dark mode, as in v7, and **paper white** in light mode.
  - The subjects stay right of centre, away from the text.
- **No new models are needed.** Everything is material colours, light intensities, fog and particle colour.
- **Theme switch:** the colours crossfade over ~0.6 s, with no flash. Everything is a uniform and the light count stays
  the same, so nothing recompiles (the v7 lesson).
- Dark is built and tuned first; light is a palette pass afterwards.

---

## 8. Assets

**Every model is built new, from scratch**, in one shared style: low-poly stylised realism with muted traditional
Japanese colours and red as the accent. The prompts, palette and triangle budgets are in
[MESHY_PROMPTS.md](MESHY_PROMPTS.md). Until the lantern and fire basket are generated, /v2 uses the v6 ones (copied into public/v2).

| Asset | Use in v8 |
|-------|-----------|
| ronin, 6 static poses | Hero / About, the Approach ghosts, Work, Contact |
| pine tree, tall + medium | The cliff edge, beyond the walls, a few inside the garden. A triangle silhouette from afar |
| stone lantern | 4 beside the path. The current design, simplified |
| his stone, 2 garden rocks, stepping stone | His stone, 5 rocks with raked rings, the path |
| earthen wall segment | Instanced along three sides |
| garden gate (vermilion) | The south wall, at the end of the path |
| house with veranda | The east side; the weapon rack stands on its veranda |
| weapon rack | Toolkit: four weapons for the four groups |
| cutting target: uncut + cut (lower and top pieces) | Work: three cut targets with their top pieces hanging mid-fall, and one uncut (see S05) |
| fire basket | Work's warm key light; the fire is made in code |
| small plants: 2 clipped shrubs, grass tuft, fern, dwarf bamboo | Sparse clumps at the rock bases, the wall foot, the lanterns and the veranda step; moss is painted into the gravel in code |
| far pagoda (optional) | The scale cue in the distance; primitives work too |

Made in code: the moon, sky, ridges, sea of cloud, raked gravel, particles, ghosts, fire and glow.
Dropped from v7: the walkway, lantern bases, water + Reflector and reeds.

### Performance budget

| | v7 (now) | v8 target |
|---|---|---|
| Triangles, desktop | ~200k | **~98k** (64k of it the six poses) |
| Models, desktop | ~6.5 MB | **~3.6 MB** in total |
| Models, phone | ~3.5 MB | **~1.5 MB** in total |
| Loader waits for | everything | the **hero set only** (P1, his stone, pines). The rest streams after first paint |
| Scene renders per frame | 2 (Reflector) | **1** |
| Post | bloom + vignette (desktop) | bloom + vignette (desktop); phones: none, vignette in CSS |
| Particles | 1 draw | 1 draw + 1 per ghost on screen |
| Skinned meshes each frame | 1 | **0** |
| Repeated props (wall, rocks, trees, stones) | separate meshes | **instanced**: one draw call per kind |

Kept from v7: meshopt geometry, WebP textures, mobile LODs, `compileAsync` behind the loader, a constant light count,
adaptive pixel ratio, and pausing the render when the canvas is hidden.

---

## 9. Meshy prompts

All of them, with the shared style block, the palette and the triangle budgets: [MESHY_PROMPTS.md](MESHY_PROMPTS.md).

---

## 10. Decisions

1. Poses: static, unrigged Meshy models; frozen frames from the current rig are stand-ins until the models exist.
2. Toolkit has no ronin.
3. No blade flash and no cut in the opening; time slows to a stop instead. No views from above.
4. The garden is enclosed by walls on three sides and open to the cliff on the fourth.
5. The weapon rack stands on the house's veranda.
6. Light mode is overcast daylight: models in mid tones, with a paper scrim behind the text.
7. Every model is built new in one style: low-poly stylised realism, muted traditional Japanese colours, red accent.
8. Trees are plain pines with a triangle silhouette.
