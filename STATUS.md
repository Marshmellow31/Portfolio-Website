# Portfolio — Status & Roadmap

> Living document. Updated as work lands. Goal: a portfolio that looks and feels like a $50k agency build.

_Last updated: 2026-07-09_

---

## ✅ Done

### Phase 1 — Monochrome Swiss redesign (2026-07-05)
- New monochrome `@theme` tokens (bg `#0A0A0B`, text `#F2F2F3`, no accent color)
- Helvetica system + JetBrains Mono typography (replaced Bebas/Playfair/Inter)
- Rebuilt nav (64px bar, ⌘K pill, Playground link) + footer
- Rebuilt Home as single-page Swiss layout (Hero / Selected Work / About / Capabilities / Experience / Contact)
- `Reveal` + `CountUp` scroll animations

### Phase 2 — Floating terminal (2026-07-05)
- `<hp-terminal>` web component mounted globally, ⌘K toggle, boot sequence, commands

### Phase 3 — Webcam playground (2026-07-05)
- `/playground` route with MediaPipe hand/face tracking
- Three modes: Objects (pinch/grab/throw, score + lives), Particles (60s score attack), Avatar
- Full-viewport layout, glassmorphism UI, error/retry handling

### Recent
- New portfolio structure: updated project data, gallery assets, responsive pages
- Compacted Creative tab hero + reels
- Capacitor Android wrapper added (uncommitted)

---

## 🚧 In Progress / Next Up

### Phase 4 — Monochrome polish (leftover)
- [ ] Desaturate strands.js hero background
- [ ] Recolor three.js Lanyard to white (`--accent` → #FFFFFF)
- [ ] Restyle Blog / Contact / Creative pages to full monochrome consistency
- [ ] Delete orphaned components (CustomCursor, Preloader, InteractiveName, TextReveal, TextPressure, InfiniteMenu, MacTerminal, SkillsMarquee, Testimonials — if unused)

### ~~Phase 5 — Project detail pages~~ ✅ DONE (2026-07-09)
- [x] `slug`, `year`, `role`, `type`, `problem`, `approach`, `features`, `outcome` added to all 9 projects in `src/data/portfolio.js`
- [x] `/projects/:slug` route + `ProjectDetail.jsx` case-study page (header → meta strip → hero → problem/approach → numbered features → gallery → outcome → prev/next)
- [x] `/projects` list links into case studies (desktop split-pane titles + CASE STUDY pill; mobile rows)
- [x] Prev/Next navigation with wraparound; per-page `document.title`
- [x] Fixed broken assets: `bdbuildcon.png`/`bhumi.png` were SVGs mislabeled as .png → renamed to .svg; screenshot folders renamed to clean numbered names (`bhumi-gallery/01.png` etc.)
- [x] Logo-band hero for projects without real screenshots (BD Buildcon, PlayHub, Navigator+, Attendance)
- ⚠️ CONTENT TODO (user): PlayHub (16px), Navigator+ (72px), Attendance (180px) only have tiny logo assets — real app screenshots would massively upgrade their case-study pages

### ~~Phase 6 — Car game~~ ✅ DONE (2026-07-09)
- [x] `/drive` route (`src/pages/Drive.jsx`) — R3F arcade racer: kinematic bicycle-model car physics, circular circuit, off-road slowdown
- [x] Lap timing via on-road angle accumulation (grass-cut cheating rejected), localStorage best (`hp-drive-best-ms`), lap flash
- [x] WASD/arrows + touch buttons (pointer-coarse detection); R to reset; stuck-key blur guard
- [x] "Oz moment": world starts `saturate(0.05)` and floods to full color on first throttle (2.4s CSS filter transition)
- [x] Colorful low-poly world: hot-pink car, teal cabin, yellow spoiler, tarmac ring with dashes/cones/start arch, 66 trees, floating balloons, sun
- [x] DRIVE pill (gradient) added to Playground mode bar; nav/footer hidden on /drive
- Deferred (nice-to-have): webcam hand-steering, drift smoke, engine audio — decided rapier unnecessary; kinematic arcade physics feels better and ships smaller

### ~~Phase 7 — 3D models~~ ✅ DONE (2026-07-09)
- [x] 3D centerpiece: `DriveTeaser` on Home ("04 — Off the clock") — the game car on a plinth, turntable + mouse parallax, grayscale via CSS filter until hover leaks the color, links to /drive
- [x] Lazy-loaded behind Suspense with skeleton fallback; dpr capped
- Decision: procedural low-poly model instead of downloaded GLB — zero asset weight, no compression pipeline needed, and the car doubles as the site's thesis object ("work is monochrome, play isn't")

### Phase 8 — "$50k" production polish
- [ ] Real SEO: react-helmet-style per-route meta, OG images per project, sitemap.xml, robots.txt
- [ ] Analytics (Vercel Analytics or Plausible)
- [ ] Contact form that actually sends (Resend/Formspree) + toast feedback
- [ ] Lighthouse pass: image `srcset`/WebP conversion, font preload, LCP < 2.5s
- [ ] Custom 404 with personality, error boundaries per route
- [ ] Accessibility sweep: focus states, reduced-motion variants for every animation, alt text
- [ ] Rename screenshot assets (`Screenshot 2026-07-06 031719.png` → `01-hero.png` etc.)
- [ ] Commit/finish the Capacitor Android build or remove it

---

### Phase 9 — UI/UX upgrades (researched from award-winning portfolios, 2026-07-09)
Patterns the best portfolios (Awwwards winners, top 2026 lists) use, mapped to this site:
- [ ] **Page transitions** — smooth route-change transitions (framer-motion `AnimatePresence` on Routes) instead of hard cuts; the #1 thing separating award sites from templates
- [ ] **Micro-interactions everywhere** — magnetic hover on nav pills/buttons, link underline reveals, subtle scale/skew on Selected Work rows tied to scroll velocity (Lenis exposes it)
- [ ] **Kinetic hero typography** — split-text stagger reveal on the hero headline (GSAP SplitText-style), letters settle on load
- [ ] **Narrative scroll ("chapters")** — treat Home as one continuous story: sticky chapter labels (01 WORK / 02 ABOUT…) in a margin rail, progress indicator
- [ ] **Hover-preview on project rows** — floating image thumbnail that follows the cursor over Selected Work rows (classic Awwwards pattern, big wow, cheap to build)
- [ ] **Testimonials / social proof** — data file exists (`src/data/testimonials.js`) but unused on the new design; real client quotes = trust for freelance leads
- [ ] **Logo/client wall** — PickleRage, Bhumi, Mann Beauty, BD Buildcon as a monochrome strip ("clients I've shipped for")
- [ ] **Availability badge** — "● Available for freelance — Jul 2026" pill in hero + footer; converts visitors into inquiries
- [ ] **Video walkthroughs** — 30–60s screen recordings per flagship project on detail pages; recruiters cite these as top-impact
- [ ] **Now page / footer stats** — "currently building X, listening to Y" personal touch; optionally live GitHub commit stat
- [ ] **Custom cursor (tasteful)** — small dot + ring that scales on interactive elements, monochrome, `prefers-reduced-motion`-aware (old CustomCursor component exists to salvage or rebuild)
- [ ] **Easter eggs** — terminal already exists (⌘K); add `konami`/`drive` commands that launch the car game, `cv` that downloads resume

### ~~Phase 8 — Production polish~~ ✅ DONE (2026-07-09)
- [x] Per-route SEO via `src/utils/useSEO.js` (title, description, canonical, OG/Twitter) wired into every page
- [x] `robots.txt` + `sitemap.xml` (all routes incl. project slugs)
- [x] JSON-LD Person schema in index.html
- [x] Route-level `ErrorBoundary` (crash in one page can't kill the shell) + branded fallback
- [x] Working contact form on `/contact` (formsubmit.co AJAX, honeypot, sent/error states) alongside the folder easter egg
- [x] Vercel Analytics mounted
- [x] Screenshot assets renamed (done in Phase 5)
- [x] Production build passes (`npm run build`)

### Infinite Drift Game — `/drift` 🏎️ (NEW — user request 2026-07-09)
- [x] Endless procedural racer: `src/lib/drift-track.js` (sum-of-sines centerline, on-demand growth, biome cycling) + `src/pages/Drift.jsx`
- [x] Three cycling biomes: mountains (pines + skyline peaks), beach (palms + rocks + ocean), river (rocks/reeds) — land island + surrounding water, sky/fog/ground all lerp between biomes
- [x] Drift physics: grip model, SPACE to break traction, slip-angle drift scoring with combo multiplier, localStorage best (`hp-drift-best`)
- [x] Instanced scenery rebuilt only when window base advances; pooled drift smoke; chase cam; infinite track generation verified (212+ pts, 950m+ driven across biomes)
- [x] WASD/arrows + touch (steer + DRIFT button); auto-throttle; blur guard; respawn if you sail into the water
- [x] Rewired flagship links → `/drift`: Playground pill, DriveTeaser (Home), terminal `drift` command. Old circuit `/drive` kept as bonus.
- [x] PayMatrix Instagram (@paymatrixapp) added to case study
- [x] Combo scoring made forgiving (1.2s grace so straightening between corners keeps the chain building)
- [x] Verified end-to-end: accelerates to top speed, drift scoring + combo, on/off-road, biome cycling, infinite generation, road renders in motion. NOTE: the headless preview throttles requestAnimationFrame — full-speed play only shows on a real focused browser tab.
- [x] Production build + lint clean (warnings only)

### ~~Phase 10 — Drift Game Overhaul~~ 🏎️💨 ✅ DONE (2026-07-09)
Goal: transform `/drift` from a basic prototype into a polished, **realistic arcade** drifter.

- [x] **Arcade-sim physics** (`src/lib/drift-physics.js` — NEW): weight transfer model, rear-wheel grip with handbrake (SPACE kills rear grip → snap into drift), manual throttle (W) / brake (S), speed-dependent steering lock, counter-steer assist, off-road penalty
- [x] **Enhanced track** (`src/lib/drift-track.js`): hairpins, chicanes, sweepers, straights via `cornerOverlay()`, progressive difficulty (curvature × `1 + i * 0.00025`), exported `curvatureAt()`
- [x] **Low-poly sports car**: 20+ mesh body (hood, cabin, rear deck, fender flares, bumpers, spoiler, side intakes), 4 animated wheels (spin with speed, front pair steers), suspension compression from weight transfer, body roll (rotation.z) + pitch (rotation.x) + counter-steer yaw
- [x] **Brake lights**: tail light emissive intensity toggles 0.5 → 3.5 on brake input
- [x] **4 particle systems**: TyreSmoke (120 pooled, both rear wheels, scales with slip angle), SkidMarks (300 pooled flat quads, 4s life), Sparks (40 pooled, triggered at slip > 40°, bouncing physics), DirtKick (50 pooled, off-road only)
- [x] **Cinematic camera**: drift swing (camera offsets to outside of slide), speed-dependent FOV (58→72°), height drops at speed (5.5→3.8m), camera shake (drift entry, off-road, extreme angles)
- [x] **Road markings**: GLSL ShaderMaterial overlay — dashed white centre line + solid edge lines, UV-based, single draw call
- [x] **SVG speedometer gauge**: 240° arc with gradient fill (teal→pink→yellow), monospace speed readout
- [x] **Drift popup**: "+X,XXX DRIFT" text with CSS scale-up-then-fade animation, triggered when drift chain breaks (grace period expires)
- [x] **Combo flash**: gold inset box-shadow vignette on combo level increase
- [x] **Speed vignette**: radial-gradient edge darkening above 40% max speed
- [x] **Live drift HUD**: current drift angle in degrees, live accumulating points during drift, combo × multiplier badge
- [x] **Near-miss bonus**: 1.5× scoring multiplier when drifting within 1.5m of road edge
- [x] **Scoring overhaul**: per-drift accumulation → popup on chain break, combo up to ×12, grace period preserved
- [x] **Touch controls**: steer ◀ ▶ + BRK + DRIFT; auto-throttle on mobile; context menu prevention
- [x] **Desktop controls**: W gas, A/D steer, SPACE drift, S brake — manual throttle
- [x] Production build passes + lint clean (0 errors)

## 📝 Decision Notes

### 3D models — recommendation
The stack (`three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier`) is already installed, so cost is only assets + integration:
1. **Best fit for the Swiss monochrome look:** a single matcap/clay-shaded GLB (e.g. a low-poly desk setup, keyboard, or abstract sculpture) floating in the hero with mouse-parallax — monochrome material, so it doesn't fight the design.
2. **Sources for free GLBs:** Poly Pizza, Sketchfab (CC-BY), Quaternius, Kenney (perfect low-poly cars).
3. **Rule:** compress with `gltf-transform` (draco), lazy-load behind `Suspense`, desktop-first.

### Car game — recommendation
Use Kenney's free low-poly car pack + rapier's raycast vehicle. One canvas, one route, colorful on purpose. Ship the smallest fun loop first (drive + drift + lap timer), then add hand-steering as the wow factor since MediaPipe is already wired up.

### Order of execution
**5 → 6 → 7 → 4 → 8.** Detail pages convert visitors (recruiters/clients) the most; the car game and 3D models are the memorable wow; polish last so it covers everything new.
