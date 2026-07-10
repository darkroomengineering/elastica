# Elastica New Site — Implementation Plan

**Branch:** `feat/new-site` · **Target:** elastica.darkroom.engineering
**Design source of truth:** `plans/new-site/design/Elastica Page Template.dc.html` (final, desktop 1440, settled states + per-section state boards + physics specs)
**Supporting sources:** Brainstorms 01–03 (evolution + rejected directions), `Footer Clutch Sketch.dc.html` (working prototype — all footer constants are tuned and real)

## Locked decisions

1. **Existing examples** → move behind a dev-only route (excluded from prod nav/sitemap). New site takes `/`.
2. **Strict dogfooding** — every section runs on `@darkroom.engineering/elastica`. Capability gaps become engine/react features first; no bespoke sims ship.
3. **Mobile v1 = touch-adapted** — last touch point acts as the cursor; `devicemotion` replaces window-shake; reduced body counts on mobile.

## The page (top → bottom)

| # | Section | Beat | Bodies | Height @1440 |
|---|---------|------|--------|--------------|
| S1 | Hero | ELASTICA letters drop as OBBs, one bounce, settle jostled; scroll locked until settle; cursor magnet knots letters | 8 DOM·OBB | 880 |
| S2 | Pills | Feature pills pinned as UI grid → unpin at 50% section progress (staggered, heaviest first) → follow cursor as colliding swarm → bunch at bottom fence | 12 DOM | 820 |
| INT | Rollers | `(n) (2d) (60fps) (0.8)` glyphs roll in with Lenis velocity, pile at right wall | 4–6 DOM | 320 |
| S3 | Murmur | Paragraph words are bodies; cursor steals ≤4-char words (orbit, dwell 1.5s returns); boids flock; fully reversible on scroll-up | ~60 DOM | 820 |
| S4 | Pop *(deferred from v1)* | Media shelf: `<img>` bodies spawn at 0% scale on scroll milestones and inflate, shoving the settled pile; drag to toss, hover lifts straight | ≤20 DOM·OBB | 820 |
| S5 | Footer | Field inverts to ink. v1: ~200 large canvas particles (SVG/icon sprites, 15% red) crust around a static rectangle with the ELASTICA wordmark inside it. Cursor bores r90, click pulses, wheel sloshes, window shake. v1.1: letterform-compound negative-space wordmark, higher counts | ~200 canvas | 900 |
| ∞ | Roller | Persistent red ball on top track = scroll progress, with mass (overshoots on hard scrolls) | 1 | — |

## Design system

- **Color:** `#F2EFE9` field · `#EAE6DD` band · `#E30613` **bodies only, never fields** · `#16140F` ink · `#C9C4BA` hairlines · (`#FF8A75` heat was dropped in B02 — do not use)
- **Type:** Archivo variable (display 800 wdth 115%, headings 700 @68/34; **wdth axis 62–125 = velocity**: squash on impact, stretch in flight) · Fragment Mono (labels 12–15, uppercase, 0.08em). Self-host via `next/font`.
- **Laws:** 1 nothing teleports · 2 everything settles, nothing stops · 3 the cursor has mass · 4 red belongs to bodies, never fields · 5 ≤100 DOM bodies, beyond → canvas · 6 one section simulates at a time.
- **Rejected directions (do not resurrect):** wall-squeeze (B01 Act II), spring-tail flashlight (Act III), flock-coalesces-into-words (Act IV), per-line word spill (Act V — superseded by boids model), "The Rest" finale (Act VII), hourglass progress, heat tint.

## Per-section feasibility matrix

Audit of `packages/engine` + `packages/react` against each section's spec (file:line citations in the capability audit, summarized here). **Decision key:** `LIB` = library as-is via `update` callback · `LIB+ENG` = library plus a named engine feature · `SPIKE` = validate before committing.

| Section | Needs | Library provides | Gaps | Perf risk | Decision |
|---------|-------|------------------|------|-----------|----------|
| **S1 Hero** | OBB drop, restitution 0.4, settle→unlock Lenis, magnet attraction, restitution→0 while clumped, 85% hitbox, scroll shear | OBB ✓, per-body `restitutions[]` mutable in `update` ✓, velocities readable for Σ\|v\| ✓, custom forces ✓ | No settle event (compute Σ\|v\| in userland — fine). 85% hitbox = register a smaller inner element, let glyph overflow (CSS, no engine change) | None (8 bodies) | **LIB** (+ **E4** settle callback as DX feature) |
| **S2 Pills** | static grid → staggered unpin at 50% fold, mass ∝ area, cursor-follow springs, inter-pill collisions, bottom fence | `isStatic[]` runtime-togglable ✓ (static→dynamic works, `elastica.ts:421–430`), `masses[]` ✓, springs in `update` ✓, `containerOffsets.bottom` ✓ | Re-pinning on scroll-up snaps to *init* position (`staticPositions` cached once) — fine for v1 forward flow; **E6** if full reverse wanted | None (12 bodies) | **LIB** (+ optional **E6**) |
| **INT Rollers** | circle bodies rendered as rotating glyphs, thrown in from the left, roll/bounce on the floor, wrap or pile | circle shape ✓, OBB angle → DOM `rotate()` ✓, Lenis velocity injection in `update` ✓ | None blocking — this is basic. Border handling (horizontal wrap + floor bounce) is a few lines in the `update` callback with `borders: false` (or rigid + manual left wrap). Verify circles get angular velocity integration under `useOBB` | None (6 bodies) | **LIB** (userland borders in `update`); per-side border config (E5) is a v1.1 engine nicety, not a blocker |
| **S3 Murmur** | ~60 word bodies (selectable spans), release on line crossing viewport center, boids (sep 1.2/align 0.6/coh 0.4), thief cursor (≤4 chars, 120px, orbit r30–70, cap 25), reversible re-dock | DOM bodies from spans ✓, spatial `hash` exposed to `update` for neighbor queries ✓, isStatic toggle for docked words ✓, all choreography expressible in `update` ✓ | None blocking — this is pure userland orchestration complexity | **Medium**: 60 CSS-var transform writes/frame + boids; measure style-recalc cost | **LIB**; hardest choreography, build last (per B02 risk order) |
| **S4 Pop** | bodies spawn at scale 0 and inflate over 600ms **with collision bounds growing**, high friction, restitution 0.15, drag impulse, hover scale 1.06 + rotation→0 | `displayScales[]` ✓ but **visual-only by design** (`elastica.ts:37`); dimensions captured once at `initialCondition` (`elastica.ts:217–253`); drag preset ✓; damping in `update` ✓ | Runtime body resize does not exist — needs a designed engine extension (E1), not a hack | Low (≤20 bodies) | **DEFERRED from v1** — skip the section for now; revisit once we've designed the right engine extension (E1) or a better mechanic |
| **S5 Footer** | v1 simplified: **~200 larger circles** @60fps, static obstacle = **one rectangle with the ELASTICA wordmark inside it** (particles crust around the rect, word reads inside), inward attraction, sprites = **SVG/icon blit per particle** if perf allows (fallback: oriented lozenge + pupil), bore/pulse/slosh/shake, pause off-screen | `CanvasElastica` + `CanvasBox static` ✓ (single static rect is the trivial case), attraction/bore/pulse/slosh/shake all in `update` ✓, 200 `CanvasBox` children = no mount concern | **E2 (blocking):** renderer is hardcoded rect/circle solid-fill (`canvas/renderer.ts`) — needs a custom draw callback; SVG sprites via pre-rasterized offscreen canvases + `drawImage` (cheap). **E3 (blocking):** no pause/play ref (DomElastica has one, `dom-elastica.tsx:26–29`) | **Low-Med at 200 bodies**; budget 60fps mid-tier laptop, DPR cap 2. Scale count upward only if headroom proves out | **LIB+ENG (E2, E3)**, start at ~200 big particles + rect obstacle; letterform-compound negative-space wordmark and higher counts are v1.1 explorations |
| **∞ Roller** | 1 ball, position = scroll progress with mass/overshoot | trivial | none | none | **LIB** (1-body instance for principle) or plain spring — decide in build |

**Cross-cutting:** "one section simulates at a time" = IntersectionObserver wrapper calling `ref.pause()/play()` (works today for DOM sections; footer needs E3). Multiple instances are safe — no shared engine state (audit Q7).

## Engine/react work items (strict dogfooding)

Ship as separate PRs against the audited engine (post-#26; coordinate with pending `fix/engine-audit` work in issue #7).

**v1 (blocking):**

| ID | Feature | Unblocks | Size |
|----|---------|----------|------|
| **E2** | `CanvasElastica` custom draw: `draw?: (ctx, x, y, angle, scale, particle) => void` per particle (or a render-override prop), keeping batched default path. Enables SVG/icon sprites via pre-rasterized offscreen canvas + `drawImage` | S5 | M |
| **E3** | `CanvasElastica` `ref.pause()/play()` — parity with `DomElasticaRef` | S5 + law 6 | S |
| **E4** | `onSettle?: (epsilon) => void` callback when Σ\|v\| < ε | S1 (DX; userland fallback exists) | S |

**Deferred (v1.1 / with S4 revisit):**

| ID | Feature | Notes |
|----|---------|-------|
| **E1** | Runtime body resize (`setBodySize` updating `dimensions`, `maxExtents`, `momentsOfInertia`) | Deferred with S4 — design the extension properly rather than rushing it |
| **E5** | Per-side border config (`{ left: 'periodic', right: 'rigid', … }`) | INT rollers handles borders in the `update` callback for v1; promote to engine API if the pattern repeats |
| **E6** | `updateStaticPosition(i)` / re-pin at current position | Only needed for full S2 scroll-up reversal |

Website-level utilities (not engine): `useCursorBody` (pointer force field, touch = last touch point), `useLenisVelocity` (ref bridge into `update`), `useSectionSim` (IO → pause/play orchestration), settle-aware Lenis lock.

## Build phases (risk order per B02: footer first, murmur last)

- **P0 — Foundation:** move examples to dev route; tokens + self-hosted fonts (Archivo variable incl. wdth axis, Fragment Mono); page scaffold with all sections in **settled static state** (the template's left column is exactly this — it doubles as the no-JS/reduced-motion baseline); Lenis + roller track chrome; metadata/OG.
- **P1 — Engine features** E2 + E3 (+E4 opportunistically) with tests (parallel with P0).
- **P2 — Footer clutch (v1 shape):** ~200 large circles in `CanvasElastica`, static obstacle = one rectangle with the ELASTICA wordmark inside it, SVG/icon sprites via E2 (pre-rasterized `drawImage`; fallback lozenge+pupil). Reuse the sketch's tuned interaction constants where they transfer: attraction 0.055, bore r90 force `1.4·(1−d/90)`, pulse `22·e^(−d/260)`, slosh `clamp(ΔY,±100)·0.02·rand(0.6–1.4)`, shake `Δscreen·0.22`, drag 0.985, speed cap 10, restitution 0.55 body / 0.2 statics / 0.3 walls, angle lerp 0.12 (velocity when v>1.1, else field tangent), DPR≤2 — retune radii/count for the 200-body scale. Measure fps headroom; scale count up only if it's free. Letterform-compound negative-space wordmark (T=0.26 W=0.72, A-counter blocker — all preserved in the sketch) is the v1.1 upgrade path.
- **P3 — Hero:** drop (restitution 0.4, one honest rebound) → settle detection → Lenis unlock (worst case ~1.2s, **any input fast-forwards**) → magnet (attraction ≤240px, restitution→0 clumped, spring home k≈0.02, 85% hitbox) → first-scroll shear.
- **P4 — Pills escort:** 12 real-text pills, unpin at 50% fold stagger 80ms mass ∝ area, follow springs stiffness 0.012–0.02 per-pill offsets, collisions on, fence restitution 0.2.
- **P5 — INT rollers:** spawn on band entry, vx = clamp(lenisVelocity × 2.5, 4, 18), horizontal wrap + floor bounce handled in the `update` callback, rolling glyph render.
- **P6 — Murmur:** span-wrap + measure once, release on line crossing center in reading order, boids via exposed hash, thief cursor, dwell-return, scroll-up re-dock via spring to stored home rects.
- **P7 — Hardening:** touch adaptation pass, `prefers-reduced-motion` (settled states, no sims), degradation tiers (mobile/low-end body counts), a11y (selectable text preserved, focus states, semantic sections), perf pass (style-recalc audit on S3, CLS check), SEO.

*(S4 Pop is out of v1 — see Open items.)*

## Open items

- **S4 Pop — deferred from v1.** The inflation mechanic needs a real engine extension (runtime body resize, E1) and possibly a rethink of the mechanic itself. Revisit after v1 ships: design E1 properly, decide content ("darkroom team picks" TBD), or replace with a different beat. The page flows S3 → S5 in the meantime.
- **Footer v1.1 path:** letterform-compound wordmark as negative space (full geometry preserved in `Footer Clutch Sketch.dc.html`), higher particle counts if the 200-body build shows headroom.
- Final copy beyond the template (template copy is real enough to ship v1).
- Roller: pure spring vs 1-body instance — decide when building; peg-run variant (B02 concept C, click-to-navigate) is a possible v1.1.
