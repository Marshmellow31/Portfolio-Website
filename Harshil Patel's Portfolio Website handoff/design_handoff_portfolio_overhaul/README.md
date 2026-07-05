# Handoff: Portfolio Overhaul — Monochrome Swiss Redesign + Floating Terminal + Webcam Playground

> **For Claude Code**, integrating into the existing Vite repo (`final portfolio/` — React 19 + Vite + Tailwind v4 + framer-motion + react-router).
> Read this fully before writing code. Work in this order: (1) design tokens, (2) Home redesign, (3) floating terminal, (4) Playground page.

## Overview

Complete visual overhaul of Harshil Patel's portfolio from the current "Bebas Neue + Playfair + hot pink `#ff007f`" look to a **monochrome, Swiss, dev-tool-minimal** aesthetic (Linear/Vercel/Raycast tier), plus two feature upgrades:

1. **Floating terminal** — the existing inline `MacTerminal` becomes a floating, draggable, closable/minimizable window opened with ⌘K/Ctrl+K.
2. **Webcam Playground** — a new route (`/playground`) that gamifies the webcam: hand-gesture physics with 3D wireframe objects, a particle field, and a face-mimicking robot avatar. Head movement parallaxes every scene.

## About the Design Files

The bundled files are **design references created in HTML** — working prototypes showing intended look and behavior, NOT production code to paste in verbatim. Recreate them in the existing React 19 + Vite + Tailwind codebase using its established patterns (framer-motion, react-router, Tailwind `@theme` tokens).

**Exception — the two vanilla JS engines** (`components/hp-terminal.js`, `components/playground-engine.js`) are framework-free web components with zero dependencies (playground lazy-imports MediaPipe from CDN at runtime). You MAY use them nearly as-is (drop into `public/` or `src/lib/`, mount via a small React wrapper with `useRef` + `customElements`), or port them to idiomatic React. Porting notes below either way. All the gesture math, physics, and command logic in them is tested and should be preserved exactly.

## Fidelity

**High-fidelity.** Colors, typography, spacing, copy, and interactions are final. Recreate pixel-perfectly.

## Design Tokens (replaces the current `@theme` in `src/index.css`)

```css
--color-bg:            #0A0A0B;   /* near-black, NOT pure #000 */
--color-surface:       #101013;   /* terminal/cards; terminal uses rgba(14,14,16,.92) + blur(18px) */
--color-text:          #F2F2F3;   /* primary text — also the ONLY "accent". Monochrome site. */
--color-text-bright:   #F7F7F8;   /* hero name, contact email */
--color-text-muted:    #A8A8B0;   /* paragraphs */
--color-text-dim:      #8A8A93;   /* labels, nav links */
--color-text-faint:    #5A5A62;   /* metadata, footer */
--color-border:        rgba(255,255,255,.08);  /* hairlines everywhere */
--color-border-strong: rgba(255,255,255,.14);  /* interactive borders */

--font-heading: 'Helvetica Neue', Helvetica, Arial, sans-serif;  /* DELETE Bebas Neue + Playfair */
--font-body:    'Helvetica Neue', Helvetica, Arial, sans-serif;
--font-mono:    'JetBrains Mono', ui-monospace, monospace;       /* keep */
```

- **There is no accent color.** Delete `#ff007f` everywhere. Emphasis = white, size, and weight.
- Headings: weight 700, `letter-spacing: -0.035em` to `-0.045em`, `line-height: 0.92–1.05`.
- Mono micro-labels: 11px, `letter-spacing: .28em`, uppercase, `--color-text-dim`, pattern `01 — About`.
- Section padding: `clamp(80px,10vw,140px)` vertical, `clamp(20px,6vw,96px)` horizontal.
- Sections divided by 1px `--color-border` hairlines. Radius: 4px buttons, 6–10px windows/pills. No colored shadows, no gradients.
- Scrollbar thumb: `rgba(255,255,255,.15)` (not pink).

## What to KEEP / CUT / RESTYLE from the current repo

**KEEP (restyle to monochrome):**
- `Lanyard` (three.js card) — keep desktop-only lazy load; recolor card/band to white-on-dark (the DC version reads a `--accent` CSS var — set it to `#FFFFFF`).
- `Section`, `useMediaQuery`, scroll-reveal approach (see Interactions), `SkillsMarquee` optional.
- Routing structure (Home / Projects / Blog / Contact) — user chose multi-page.
- `Handsfree` + `useHandTracking` — its MediaPipe loading pattern is reusable for the Playground.

**CUT entirely:** `CustomCursor`, `Preloader` (hamster), Playfair-italic `TextReveal` quotes, "Creative Developer" eyebrow, `TextPressure`/outline-text tricks, mouse-scroll icon (replace with mono "SCROLL" text at 10px/.3em pulsing opacity .25→.9 2.6s).

**RESTYLE:** `MacTerminal` → floating window (section 3). `InfiniteMenu` sphere — optional; current tile PNGs are violet-glow and clash with monochrome. If kept, regenerate tiles in monochrome; otherwise the new project-row list replaces it.

## Screens

### 1. Home (`Portfolio.dc.html` — reference)

Order: Nav / Hero / Selected Work / About / Capabilities / Experience / Contact / Footer.

- **Nav**: fixed 64px; transparent → `rgba(10,10,11,.72)` + `blur(14px)` + bottom hairline after 24px scroll. Left: "Harshil Patel" 14px/600. Right: WORK ABOUT EXPERIENCE CONTACT (mono 11px .12em dim, hover→white), a bordered "● PLAYGROUND" link (routes to `/playground`), and a `⌘K` pill button (mono 11px, `rgba(255,255,255,.05)` bg, `.12` border, radius 6px) that toggles the terminal.
- **Hero**: full viewport, bottom hairline. Background: existing strands/ambient WebGL desaturated to white (`colors: #ffffff,#6a6a72`, saturation 0, ~0.28 intensity, wrapper opacity .5) — or omit on mobile. Right 44%: Lanyard (desktop ≥1024px only). Content: 40px hairline + eyebrow `FULL-STACK DEVELOPER — IIIT VADODARA` (mono 11px .28em); H1 "Harshil / Patel" two lines, `clamp(58px,11vw,168px)`, 700, -0.045em, lh 0.92; sub `clamp(17px,1.6vw,21px)` muted, max-width 560px: *"I build production software — web, mobile, and AI tools — shipped to real businesses, not just repos."*; CTAs: solid white "Selected work ↓" (13px/600, 14×26px pad, radius 4) + hairline-border "Get in touch". Entrance: fade-up 14px, .8s ease, stagger 0.1/0.25/0.4s.
- **Selected Work**: header row (label `01 — Selected Work`, H2 "Things I've shipped" `clamp(34px,4.5vw,64px)`, right-aligned mono `09 PROJECTS`). Then **table-style rows** (not cards), each: `02` index (mono 11 faint, 32px col) · title (`clamp(20px,2.2vw,28px)`/600, optional white `LIVE` badge: 9px mono, black text on white, radius 3, 3×7 pad) · description (14px muted, max 520px) · stack line (mono 11px faint, ` · ` separated) · `LIVE ↗` / `CODE ↗` links (mono 11px, underline-border). Rows: 30px pad, hairline dividers, hover bg `rgba(255,255,255,.025)`. Row wrap: flex-wrap, title block `flex:1 1 300px`, stack `flex:1 1 220px`. Data + copy: use `renderVals()` in the DC file — 9 projects with exact descriptions and links (PayMatrix is the only LIVE one).
- **About**: 2-col auto-fit grid `minmax(320px,1fr)`. Left: label `02 — About`, H2 "Software that leaves the repo", paragraph (exact copy in DC). Right: 3 stat rows with hairline tops — `PROJECTS SHIPPED → 15+` (count-up), `CLIENT PRODUCTS IN PRODUCTION → 6` (count-up), `GRADUATING → 2028` (static). Stat numbers `clamp(32px,3.5vw,48px)`/700.
- **Capabilities**: label `03 — Capabilities`, H2 "Stack". 1px-gap grid (`gap:1px; background:var(--color-border)` trick) of 6 cells `minmax(260px,1fr)`: group name (mono 11px .2em dim) + comma-separated list (15px, lh 1.9, `#D6D6DA`). No chips.
- **Experience**: label `04 — Experience`, H2 "Real clients, real deadlines". Rows: period (mono, `2025 — NOW` / `CLIENT`, 130px col) · role 600 + org muted · summary 14px. Exact copy in DC file.
- **Contact**: label `05 — Contact`; the email itself is the headline — `1080patelharshil@gmail.com` at `clamp(26px,4.6vw,72px)`/700/-.04em, hover underline (2px thickness, 8px offset). Below: `GITHUB ↗ · LINKEDIN ↗ · BHARUCH, GUJARAT — IN` mono row.
- **Footer**: hairline top; `© 2026 Harshil Patel — built with React, coffee & questionable sleep` + `BACK TO TOP ↑`.

### 2. Floating Terminal (`components/hp-terminal.js` — reference, logic is production-ready)

Floating macOS-style window, globally mounted (App level, all routes).

- **Open**: ⌘K / Ctrl+K toggle, nav `⌘K` pill, or restored "terminal" pill. **Close**: red dot or Esc. **Minimize**: yellow dot → bottom-right pill (`● terminal`, blinking dot, radius 999) that reopens. **Maximize**: green dot toggles 680×420 ↔ 920×620.
- Chrome: `rgba(14,14,16,.92)` + `blur(18px)`, border `.14`, radius 10, shadow `0 30px 90px rgba(0,0,0,.65)`. Title bar 38px, drag handle, title `harshil@portfolio — zsh` (mono 11px). **Traffic lights are monochrome `#3a3a40` at rest and colorize (red/yellow/green) only on group hover** — signature detail.
- Drag: pointer-capture on title bar, clamped to viewport; position persisted to `localStorage['hp-term-pos-v1']`. Mobile ≤640px: docked bottom sheet (12px inset, 64vh max), no drag.
- Open animation: `scale(.96) translateY(8px)` → 1, 220ms `cubic-bezier(.2,.9,.3,1.2)`. Blinking block cursor 7×15px, `step-end` 1.05s.
- Commands (keep verbatim from reference): `help about skills projects open <name> github linkedin email whoami sudo hire-me clear exit`; ↑/↓ history with draft restore; Tab autocomplete with common-prefix + double-Tab list; typed boot (32ms/char, skipped under `prefers-reduced-motion`): *"Welcome to Harshil's portfolio terminal." / "Type 'help' to get started."* `sudo hire-me` navigates to `/contact` (use react-router, not scroll). `open` map: paymatrix→live URL, ascend/picklerage/mann→GitHub repos. Errors in white with underline (no red).
- React integration: replace the old inline `<MacTerminal>` section on Home; mount the floating one once in `App.jsx`.

### 3. Playground (`Playground.dc.html` + `components/playground-engine.js` — reference; engine math is production-ready)

New route `/playground`, full-viewport app (own layout, `overflow:hidden`, no site footer).

- **Top bar** (60px, hairline): `← SITE` link · divider · "Playground" · right: segmented mode switcher (OBJECTS / PARTICLES / AVATAR — mono 10px, active = white bg/black text, in `rgba(255,255,255,.05)` container radius 7) · live stats `54 FPS · 1 HAND · FACE OK` (mono 10px faint) · ENABLE CAMERA (solid white) / STOP (hairline border + blinking dot).
- **Idle intro card** (centered, blur panel radius 12): title "Control this page with your hands", privacy line *"Video is processed locally in your browser and never leaves your device."*, gesture legend (PINCH / FIST / OPEN HAND / YOUR HEAD — 96px mono column + description), Enable Camera button, footnote "requires a webcam — nothing is recorded or uploaded".
- **Engine** (canvas 2D, monochrome wireframe — no three.js needed):
  - MediaPipe `@mediapipe/tasks-vision@0.10.14` lazy-imported ONLY on enable; HandLandmarker (2 hands, VIDEO mode, GPU) + FaceLandmarker (blendshapes + facial transformation matrix; run every 2nd frame). CDN + model URLs at top of engine file.
  - **Gesture detection** (preserve exactly): coords mirrored `x=(1-lm.x)*W`; hand size = wrist→middle-MCP distance; pinch = thumbTip↔indexTip / size `< 0.38` enter, `< 0.55` stay (hysteresis); fist = mean fingertip→wrist distance / (4·size) `< 1.28`; pinch-point velocity tracked per frame for throws.
  - **Objects mode**: 6 seeded wireframe solids (cube/octa/tetra/icosahedron, 42–76px, custom 3D projection depth 900, walls bounce ×0.85, damping .985). Pinch near object (≤max(110, r·1.6)) grabs (lerp ×0.35, hand motion spins it); release throws at hand velocity ×1.1; pinch empty space spawns (max 12); fist attracts within 420px and **crushes** within ~90px → 26-particle burst, respawn ~1.2s. Held object stroke `rgba(255,255,255,.95)` w1.6 vs `.55` w1.
  - **Particles mode**: 420 particles, toroidal wrap; fingertips attract (<220px, ×0.22); pinch repulse burst (<260px, inverse-square); fist vortex (<340px, tangential 0.9 + inward 0.12); alpha/size scale with speed.
  - **Avatar mode**: robot face (rounded-rect head, antenna, brows, eyes, mouth, cheek bolts) driven by head pose from the facial transformation matrix (yaw/pitch/roll euler) + blendshapes: `eyeBlinkLeft/Right` (mirror sides), `jawOpen` mouth height, `mouthSmile*` curve, `browInnerUp` lift. Debug line: `yaw 12° pitch -4° jaw 30%`.
  - **All modes**: face nose position → parallax target (±60/±40px, lerp .06) offsetting grid + scene; hand cursor = circle (pinch 8px / open 14px / fist 22px+filled) + crosshair ticks; 56px background grid at `rgba(255,255,255,.045)`.
  - **Preview**: 168px bottom-right, mirrored + grayscale video, live hand-skeleton overlay (standard 21-landmark edges), "LOCAL ONLY" tag.
  - **Safety**: camera stream stopped on STOP, route unmount, and `visibilitychange` hidden; site 100% functional without camera; errors (permission denied) → toast with retry.
- Reuse the repo's existing `useHandTracking.js` loading pattern where it matches; the engine file's math supersedes it.

## Interactions & Motion (global)

- Scroll reveals: IntersectionObserver, threshold .12, only for elements below 90% viewport at load; `opacity 0 → 1`, `translateY(18px) → 0`, .7s ease. Content must be visible if JS fails (progressive enhancement).
- Count-ups: IO threshold .5, 1100ms cubic ease-out.
- ALL motion (reveals, strands, boot typing, blink cursor) disabled/instant under `prefers-reduced-motion`.
- Dark only. No light mode.
- Performance: Lanyard + strands desktop-only lazy; playground models load on demand; one WebGL context per viewport max.

## State Management

- Home: `scrolled` (nav), IO refs. Terminal (self-contained): open/min/max, lines, input, history+draft, localStorage position. Playground page: `mode`, `status` (idle/loading/running/error), stats `{fps,hands,face}` — engine emits `hp-status` / `hp-stats` CustomEvents; page calls `el.start() / el.stop() / el.setMode()`.

## Assets

- JetBrains Mono via Google Fonts (400/500). Helvetica Neue = system stack, no webfont.
- No images required by the new design. Old violet project tiles (`assets/tiles/`) are deprecated unless regenerated monochrome.
- MediaPipe WASM + models load from jsdelivr/Google Storage CDNs at runtime (URLs in engine file).

## Files in this bundle

- `Portfolio.dc.html` — Home redesign reference (template markup + logic incl. exact copy/data in `renderVals()`)
- `Playground.dc.html` — Playground page chrome + state wiring reference
- `components/hp-terminal.js` — floating terminal web component (production-ready logic)
- `components/playground-engine.js` — webcam engine web component (production-ready math)
- `components/strands.js` — WebGL2 strands background (framework-free; usable as-is)
- `components/lanyard-card.js` — lightweight 2D lanyard fallback (the repo's three.js Lanyard is preferred on desktop)

Note: `.dc.html` files contain custom template syntax (`{{ }}`, `<sc-for>`, `<sc-if>`, `<x-import>`) — read them for markup structure, inline styles, copy, and logic; do not execute them in the Vite app.
