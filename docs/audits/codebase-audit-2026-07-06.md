# Codebase Audit — elastic-collision (Elastica) — 2026-07-06

**Scope:** the full repository — `packages/engine` (core physics), `packages/react` (DOM + canvas bindings), `website/` (Next.js demo app), `docs/`, committed `dist/`, root packaging, and all repo tooling (hooks, CI, lint, publish pipeline).

**Method:** three parallel adversarial auditors — one per area (engine, React bindings, website/repo-DX) — each performing full reads with expectation-vs-reality tracing per the audit spec (state how each area SHOULD behave, then confirm or refute against the code; every finding backed by a concrete input/state → wrong-result scenario, marked CONFIRMED or PLAUSIBLE). The three reports (107 raw findings) were then merged, cross-area duplicates consolidated (10 merges), and renumbered into a single C-series in severity order. Five top findings were **independently re-verified against source by the merge orchestrator** and all held; they are marked "CONFIRMED (independently re-verified)".

**Totals after dedupe: 97 findings — 7 Critical, 23 High, 38 Medium, 29 Low.**

All paths relative to the repo root. Repo state at audit: HEAD `643f02c` ("update read me"), working tree clean.

---

## 1. Summary table

| ID | Severity | Area | One-line issue | Location | Status |
|----|----------|------|----------------|----------|--------|
| C1 | Critical | react | Documented install cannot run: hamo is imported unconditionally but declared an *optional*, undocumented peer (not auto-installed by npm≥7/bun) | packages/react/package.json:17-21; readme.md:16-20 | CONFIRMED (independently re-verified) |
| C2 | Critical | engine | Circle-center-inside-rect contact normal is inverted → circles are sucked INTO rectangles and trapped, never expelled | packages/engine/src/collision/circle.ts:140-167, 267-294 | CONFIRMED (independently re-verified) |
| C3 | Critical | engine | Dense-bucket broadphase path silently drops cross-cell pairs (all pairs between two dense buckets; ~half of sparse↔dense) | packages/engine/src/collision/aabb.ts:289-300; obb.ts:518-529 | CONFIRMED (independently re-verified) |
| C4 | Critical | engine | OBB resolution is not elastic-collision math: momentum never conserved; restitution applied as a global KE rescale per contact-substep; repulsion inversely proportional to penetration | packages/engine/src/collision/obb.ts:233-410 | CONFIRMED |
| C5 | Critical | react | Adding/removing/remounting a BoundaryBox corrupts or silently ignores physics state — DOM registration is never reconciled with engine arrays | packages/react/src/dom/dom-elastica.tsx:159-184 | CONFIRMED (independently re-verified) |
| C6 | Critical | website | Website consumes the committed minified `dist/` via a tsconfig alias + accidental npm self-reference; three copies of the engine coexist; source edits are invisible to the demo | website/tsconfig.json:47-48; package.json:80-89 | CONFIRMED (independently re-verified; self-reference mechanism PLAUSIBLE) |
| C7 | Critical | repo | Zero CI: the only workflows live in `website/.github/workflows/`, a directory GitHub Actions never reads | website/.github/workflows/ | CONFIRMED |
| C8 | High | engine | Center-point hashing + 3×3 search misses collisions for bodies larger than one cell; README describes `gridSize` as "cell size (should be ≥ largest element)" — wrong quantity, inverted tuning advice | packages/engine/src/spatial-hash.ts:30-36; readme.md:104 | CONFIRMED |
| C9 | High | repo | Root README "Engine Only" example calls nonexistent `engine.setContainer()` and never calls `initialCondition` — the only raw-engine onboarding path cannot work | readme.md:224; packages/engine/src/elastica.ts (no such method) | CONFIRMED |
| C10 | High | react | README BoundaryBox example is fiction: `isStatic`, `mass`, `restitution`, `displayScale`, `shape` don't exist (`BoundaryBoxProps = HTMLAttributes<HTMLDivElement>`); real static mechanism `data-state="static"` undocumented | readme.md:112-126; packages/react/src/dom/boundary-box.tsx:9 | CONFIRMED |
| C11 | High | react | README CanvasBox example uses `shape="rectangle"` + `isStatic`; real API is `'rect' \| 'circle'` + `static` → invisible colliding particle; engine and react use two shape vocabularies | readme.md:128-144; packages/react/src/types.ts:36; canvas-box.tsx:27 | CONFIRMED |
| C12 | High | react | Config defaults drift: `useOBB` documented false, actual true; `gridSize` documented 8, engine/canvas default 4, DOM wrapper 8 | readme.md:100-110; packages/engine/src/elastica.ts:66,70; dom-elastica.tsx:43,46 | CONFIRMED |
| C13 | High | react | Quick start renders visually broken: required absolute-positioning-at-container-origin layout contract and container sizing are undocumented | readme.md:26-52; packages/engine/src/elastica.ts:394-395 | CONFIRMED |
| C14 | High | react | Every resize and every canvas particle register/unregister resets the entire world (re-randomizes all positions) | packages/react/src/canvas/canvas-elastica.tsx:127-138, 259-272; dom-elastica.tsx:176-184 | CONFIRMED |
| C15 | High | react | CanvasBox physics props (`mass`, `restitution`, `static`, dimensions) look reactive but are only applied at re-init | packages/react/src/canvas/canvas-box.tsx:89-104; canvas-elastica.tsx:274-282 | CONFIRMED |
| C16 | High | react | DomElastica silently drops `solver.substeps` (documented config) when reconstructing config | packages/react/src/dom/dom-elastica.tsx:114-118 | CONFIRMED |
| C17 | High | react | `'use client'` directives stripped from the published bundle → Server Component import errors in Next.js App Router | dist/elastica-react.mjs:1; packages/react/rollup.config.js | CONFIRMED |
| C18 | High | react | `ref` prop (only pause/play API) requires React 19; peers allow ≥18.2 where it silently fails | packages/react/src/dom/dom-elastica.tsx:38, 231-234 | CONFIRMED |
| C19 | High | react | Canvas context lies: `elastica` null-asserted (`elasticaRef.current!`) is null on first render; context value identity churns every render | packages/react/src/canvas/canvas-elastica.tsx:285-292 | CONFIRMED |
| C20 | High | react | DOM mode cannot do circles at all; README claims both modes support shapes | packages/react/src/dom/boundary-box.tsx:49-52; readme.md:9 | CONFIRMED |
| C21 | High | engine | AABB resolution = unconditional full velocity swap; masses and restitution silently ignored in AABB mode; exclusion kick unbounded as overlap→0 | packages/engine/src/collision/aabb.ts:150-221 | CONFIRMED |
| C22 | High | engine | No approach-velocity check (`v_rel·n`) in either resolver → sticking, oscillation, per-substep energy bleed for persistent contacts | packages/engine/src/collision/obb.ts:233-410; aabb.ts:150-221 | CONFIRMED |
| C23 | High | engine | Angular impulse divided by `dt` → resulting spin scales with `substeps`/`fixedDeltaTime` config; breaks frame-rate-independence claim | packages/engine/src/collision/obb.ts:290-292, 325-327, 374-377 | CONFIRMED |
| C24 | High | engine | `mass = 0` or zero-size shape → `momentOfInertia = 0` → division by zero → NaN cascade through velocities, positions, spatial hash | packages/engine/src/elastica.ts:164, 180-181, 237-258; obb.ts:292 | CONFIRMED |
| C25 | High | engine | `accumulateTime` infinite-loops (tab-freezing hang) when `fixedDeltaTime ≤ 0`; `createAccumulator` does no validation | packages/engine/src/accumulator.ts:18-32 | CONFIRMED |
| C26 | High | engine | Re-running `initialCondition` with a now-null element leaves a ghost collider: stale position/velocity/maxExtents with `[0,0]` dimensions still collide | packages/engine/src/elastica.ts:136-147 | CONFIRMED |
| C27 | High | engine | `defaultRestitution` unclamped in constructor (setter clamps); `> 1` → exponential energy explosion | packages/engine/src/elastica.ts:110, 260-264; obb.ts:299, 334, 387 | CONFIRMED |
| C28 | High | website | `website/lib/utils/elastica.d.ts` is a hand-maintained duplicate of the generated types and already drifts (erases nullability, missing `shape`, missing exports) | website/lib/utils/elastica.d.ts:52 vs dist/react/types.d.ts | CONFIRMED |
| C29 | High | repo | License/identity contradictions: package.json ISC vs README MIT vs website MIT; no LICENSE file; repo URL/remote/footer names disagree | package.json:27; readme.md:235-237; website/package.json:6 | CONFIRMED (repo-link liveness PLAUSIBLE) |
| C30 | High | repo | `bun run dev:react` broken (invokes vite — not a dependency anywhere); react package.json also lacks `private: true` and carries a self-referential peer dep | package.json:11; packages/react/package.json | CONFIRMED |
| C31 | Medium | engine | `update()` mutates `this.fixedDeltaTime` as substep channel with no try/finally — one user-callback exception permanently corrupts the timestep | packages/engine/src/elastica.ts:320-383 | CONFIRMED |
| C32 | Medium | engine | Static reset assigns cached position array *by reference* — in-place mutation in a user callback silently corrupts the static cache | packages/engine/src/elastica.ts:335-338 | CONFIRMED |
| C33 | Medium | engine | Rigid borders use unrotated half-extents → rotated OBB corners clip through walls | packages/engine/src/borders.ts:39-65 | CONFIRMED |
| C34 | Medium | engine | Borders are perfectly elastic regardless of `restitutions[i]`, with no angular response — inconsistent with body-body model | packages/engine/src/borders.ts:39-65 | CONFIRMED |
| C35 | Medium | engine | `integrateAngularMotion` only runs when `calculateCollisions && useOBB` → `collisions: false` freezes all rotation despite `setAngularVelocity` API | packages/engine/src/elastica.ts:353-364 | CONFIRMED |
| C36 | Medium | engine | `update()` before `initialCondition` (or 0×0 container) → NaN cell ids → all bodies in one bucket → silent O(n²) | packages/engine/src/spatial-hash.ts:31-32 | CONFIRMED |
| C37 | Medium | engine | `Elastica.gridSize` public mutable but `SpatialHash.gridSize` readonly → runtime mutation desyncs hash encode vs neighbor decode → silently missed collisions | packages/engine/src/elastica.ts:25, 77; spatial-hash.ts:9, 14-16 | CONFIRMED |
| C38 | Medium | engine | `sweepBucket` uses unrotated half-width for rotated OBBs → sweep early-exit skips genuinely overlapping rotated pairs in dense buckets | packages/engine/src/collision/aabb.ts:15-62; obb.ts:524 | CONFIRMED |
| C39 | Medium | engine | `collisionsList` overwritten per substep — with `substeps > 1` consumers only see the last substep's collisions | packages/engine/src/elastica.ts:356, 367 | CONFIRMED |
| C40 | Medium | engine | `cornersPool.release` never called → pool permanently drained after 32 acquisitions; SAT recomputes corners 4× per body per test; "object pooling" claim false for corners | packages/engine/src/pool.ts:61-94; obb.ts:41, 81 | CONFIRMED |
| C41 | Medium | engine | Engine reads DOM (`element.dataset.state === 'static'`) inside `initialCondition`; canvas mode must bypass via array pokes — two mechanisms for one concept, wrong layer | packages/engine/src/elastica.ts:140; packages/react/src/canvas/canvas-elastica.tsx:168-188 | CONFIRMED |
| C42 | Medium | engine | No add/remove-body API; index-keyed arrays make React `addBox`/`removeBox` a no-op (add) or an identity shuffle (remove) | packages/engine/src/elastica.ts:126-205 | CONFIRMED |
| C43 | Medium | engine | No tunneling protection (no swept tests/CCD), undocumented; compounded by C4's repulsion being weakest at deep penetration | packages/engine/src/collision/* (absence); obb.ts:271-272 | CONFIRMED |
| C44 | Medium | engine | False engine-doc claims cluster: energy formula inverted, "both systems implement restitution" (AABB doesn't), "zero-size → no collision" (no validation exists), world-transform snippet uses `-angle`, pooling claims false | packages/engine/README.md:99-112; docs/COLLISION_DETECTION.md:200-203, 372-381 | CONFIRMED |
| C45 | Medium | react | Init runs against hamo's initial rect `{}` (truthy) → NaN container math; 2-3 full inits per mount | packages/react/src/dom/dom-elastica.tsx:176-184; canvas-elastica.tsx:129, 157 | CONFIRMED |
| C46 | Medium | react | Engine constructed in render (`useState(() => new Elastica(...))`), discarded, rebuilt in an effect; ×3 under StrictMode; one wasted `initialCondition` | packages/react/src/dom/dom-elastica.tsx:137, 151-157 | CONFIRMED |
| C47 | Medium | react | Re-init keyed on rect object identity — top/left-only layout shifts reset the whole sim; 500ms debounce hardcoded | packages/react/src/dom/dom-elastica.tsx:176-184 | CONFIRMED |
| C48 | Medium | react | Presets place static elements using document coords in a container-space sim; canvas statics pile at top-left | packages/react/src/presets.ts:66-73, 100-111 | CONFIRMED |
| C49 | Medium | react | `--er`/`--eds` CSS vars only written when non-default → stick at last non-default value (stale rotation/scale) | packages/react/src/dom/renderer.ts:50-62 | CONFIRMED |
| C50 | Medium | react | Removing the last CanvasBox leaves frozen pixels on the canvas (early return before `clearRect`) | packages/react/src/canvas/canvas-elastica.tsx:160 | CONFIRMED |
| C51 | Medium | react | Heavy per-frame allocation (~5N objects × 60fps) in the canvas path sold as "for 200+ elements, better performance" | packages/react/src/canvas/canvas-elastica.tsx:141-162; canvas/renderer.ts:29-43 | CONFIRMED |
| C52 | Medium | react | No pause/play on CanvasElastica; no `prefers-reduced-motion`; no offscreen pause in either mode | packages/react/src/canvas/canvas-elastica.tsx (absence) | CONFIRMED |
| C53 | Medium | react | Canvas pre-init block is dead (`el.element === null` never true; mass writes overwritten by `initialCondition`) | packages/react/src/canvas/canvas-elastica.tsx:165-182 | CONFIRMED |
| C54 | Medium | react | DOM and canvas handle config three different ways (allowlist-reconstruction vs raw memo); canvas memo missing `substeps` dep; different effective defaults per mode | packages/react/src/dom/dom-elastica.tsx:100-135; canvas-elastica.tsx:90-107 | CONFIRMED |
| C55 | Medium | react | `InitialConditionParams`/`UpdateParams` duplicated in presets.ts and types.ts — silent drift risk | packages/react/src/presets.ts:5-45 vs types.ts:12-33 | CONFIRMED |
| C56 | Medium | react | Two hash-grid debuggers with different geometry: DOM overlay is viewport-fixed (wrong unless sim is full-screen); canvas draws in-container (correct) | packages/react/src/utils.tsx:31-58 vs canvas/renderer.ts:107-135 | CONFIRMED |
| C57 | Medium | react | README "initialCondition called once on mount" is false — runs 2-3× on mount, on every debounced resize, on rect moves, on register/unregister | readme.md:94 | CONFIRMED |
| C58 | Medium | react | Vestigial visibility machinery: `timeRef` write-only; `useJavascriptEnable` misnamed, gates nothing, re-renders subtree per tab-switch, exported publicly | packages/react/src/dom/dom-elastica.tsx:92, 190-196; utils.tsx:9-29 | CONFIRMED |
| C59 | Medium | repo | Zero tests for engine and react (only website string/math utils have tests); no `test` script anywhere; PR template references nonexistent `bun lint` | repo-wide (absence); website/.github/PULL_REQUEST_TEMPLATE.md | CONFIRMED |
| C60 | Medium | repo | Publish pipeline unguarded: no `prepublishOnly` build, `clean` wipes committed dist, npm `latest` tag points at `1.0.0-dev` | package.json:17-19 | CONFIRMED |
| C61 | Medium | repo | Three git-hook systems configured, all dead (husky, 2× lefthook — tools uninstalled); `.husky/post-merge` `npx vc env pull` is a supply-chain footgun if ever activated | .husky/pre-commit, .husky/post-merge; lefthook.yml; website/lefthook.yml | CONFIRMED |
| C62 | Medium | website | website/ docs are the unmodified Satus template and actively lie: `setup:project`/`generate` scripts, `/studio`, `/api/revalidate`, integrations dirs don't exist | website/README.md; PROD-README.md; ARCHITECTURE.md; .env.example | CONFIRMED |
| C63 | Medium | website | Two different hamo packages ship in the same app (library externalizes 0.6.46; website imports 1.0.0-dev.7) | dist/elastica-react.mjs; website/components/ui/fold/index.tsx:4 | CONFIRMED |
| C64 | Medium | website | Debug tooling ships to production unconditionally; FPS overlay defaults ON; global Cmd+O debug palette live for all visitors | website/lib/features/index.tsx:59-61; lib/dev/orchestra.ts:13 | CONFIRMED |
| C65 | Medium | website | Two contradictory WebGL feature flags; the "central" one (`lib/config/features.ts`, default off) is dead code; the live one defaults on | website/lib/config/features.ts:7 vs lib/features/index.tsx:14 | CONFIRMED |
| C66 | Medium | repo | Root lint/format configs target a stack this repo doesn't have (eslint/next/storybook/prettier — none installed) and contradict website's Biome setup | .eslintrc.json; .prettierrc; .vscode/settings.json vs website/.vscode/settings.json | CONFIRMED |
| C67 | Medium | website | Two of six demo examples (Gravity, Text) are dead code — commented out of the nav with no explanation | website/app/page.tsx:14, 17, 39-40, 45-46 | CONFIRMED |
| C68 | Medium | repo | Naming schizophrenia: npm `elastica`, git remote `elastic-collisions`, dir `elastic-collision`, workspace pkgs `elastic-collisions`/`react-elastic-collision-wrapper` (no version/exports/types); `window.elasticaVersion` reports the *website's* version | package.json; packages/*/package.json; website/app/layout.tsx:82 | CONFIRMED |
| C69 | Low | engine | `hasBounced(i)` increments and returns a count — name promises a boolean read, delivers a mutation | packages/engine/src/elastica.ts:218-222 | CONFIRMED |
| C70 | Low | engine | `hash`/`buckets` getters return live internals; prototype getters vanish under object spread — the React wrapper's `{...instances}` already loses them | packages/engine/src/elastica.ts:41-47; packages/react/src/dom/dom-elastica.tsx:181-183, 209-217 | CONFIRMED |
| C71 | Low | engine | Pair key `(indexA << 16) \| indexB` silently collides above 65,535 elements; limit undocumented at call sites | packages/engine/src/collision/aabb.ts:239; obb.ts:466 | CONFIRMED |
| C72 | Low | engine | Element larger than container triggers opposite walls in the same pass → per-substep jitter and `bounced` counter spam | packages/engine/src/borders.ts:39-65 | CONFIRMED |
| C73 | Low | engine | `ElementData.rect.left/top` typed as accepted but never read by the engine; the zero-argument default callback yields all bodies at origin | packages/engine/src/types.ts:19-23; elastica.ts:126-205 | CONFIRMED |
| C74 | Low | engine | `solver.substeps: NaN` → substep loop runs zero times → `update()` silently does nothing | packages/engine/src/elastica.ts:116, 325 | CONFIRMED |
| C75 | Low | engine | Negative/NaN dimensions, velocities, masses accepted without validation anywhere; garbage propagates silently | packages/engine/src/elastica.ts:126-205 (absence) | CONFIRMED |
| C76 | Low | engine | Published main entry is terser-minified ESM — painful consumer debugging; readable UMD build exists but isn't the entry | rollup.config.js:17-30; package.json exports | CONFIRMED |
| C77 | Low | engine | `vectorPool` dead code (never used, not exported) beside an index.ts comment claiming "only used ones" exported | packages/engine/src/pool.ts:136; index.ts:22-23 | CONFIRMED |
| C78 | Low | engine | 3×3 neighborhood logic duplicated (`getNeighborCellIds` vs `SpatialHash.getNeighborIndices`) — fixes will land in one, not the other | packages/engine/src/collision/aabb.ts:68-91; spatial-hash.ts:57-82 | CONFIRMED |
| C79 | Low | engine | Stale/lying internals: "cached state object" comment (fresh objects per substep); `CollisionRecord.loop/inHash` names describe long-gone structure | packages/engine/src/elastica.ts:344; types.ts:32-35 | CONFIRMED |
| C80 | Low | react | `initalConditionsPresets` typo baked into public API, README, and website | packages/react/src/presets.ts:129 | CONFIRMED |
| C81 | Low | react | Preset incoherences: `rightFlow` doesn't flow right (zero-mean noise); `dvdScreenSaverOBB` ≡ `dvdScreenSaver` with dead reads; `DragAndGravity` casing odd | packages/react/src/presets.ts:179-232 | CONFIRMED |
| C82 | Low | react | `containerOffsets` are fractions of container size with an asymmetric sign convention; README reads as pixels — `{top: 10}` insets by 10× container height | readme.md:106; packages/engine/src/borders.ts:26-27, 40-65, 79-80 | CONFIRMED |
| C83 | Low | react | Injected `[data-elastica]` stylesheet (appended last to `<head>`) silently overrides user transforms on boxes; no escape hatch | packages/react/src/dom/renderer.ts:9-19 | CONFIRMED |
| C84 | Low | react | Package default export is `DomElastica` while engine default export is the `Elastica` class — same import shape, different things | packages/react/src/index.tsx:62 | CONFIRMED |
| C85 | Low | react | Permanent `will-change: transform` on every physics element — compositor-layer memory at scale | packages/react/src/dom/renderer.ts:16 | CONFIRMED |
| C86 | Low | react | `dpr` default read once per render, no matchMedia listener — stale DPR after monitor moves | packages/react/src/canvas/canvas-elastica.tsx:67 | CONFIRMED |
| C87 | Low | react | Guard `boxes.some(({rect}) => !rect)` can never trip (rect always set; unmeasured state is truthy `{}`) | packages/react/src/dom/dom-elastica.tsx:179 | CONFIRMED |
| C88 | Low | react | `HashGrid`, `isEmptyArray`, `useJavascriptEnable` exported publicly, documented nowhere | packages/react/src/index.tsx:46 | CONFIRMED |
| C89 | Low | repo | docs/ is orphaned (referenced by nothing) and stale: pre-rename API names in LESSONS_LEARNED; engine README file structure omits five existing files | docs/COLLISION_DETECTION.md; docs/LESSONS_LEARNED.md:91; packages/engine/README.md:116-128 | CONFIRMED |
| C90 | Low | repo | Consumers get a prerelease with no provenance: `latest` = 1.0.0-dev, no CHANGELOG, no tags/releases; ESM-only `.mjs` untested against CJS consumers | package.json; npm registry state | CONFIRMED |
| C91 | Low | website | Example1: hash-grid debug labels permanently overwrite element text (never restored on toggle-off) | website/components/examples/example-1.tsx:106-108 | CONFIRMED |
| C92 | Low | website | Example6: default gravity (0.01) outside its own slider range (max 0.005); particle sizes re-randomize on re-render | website/components/examples/example-6.tsx:14, 77-81, 169-186 | CONFIRMED |
| C93 | Low | website | Example4's hand-rolled neighbor check has row-wrap false positives and an off-by-one; re-implements (incorrectly) what the engine exposes | website/components/examples/example-4.tsx:281-298 | CONFIRMED |
| C94 | Low | website | Error page mounts `Wrapper` with `webgl` — the only place in the app enabling WebGL is the error path | website/app/error.tsx:19 | CONFIRMED |
| C95 | Low | website | Metadata base URL falls back to `https://localhost:3000` (unreachable https-on-localhost); sitemap/OG URLs wrong without env var | website/app/layout.tsx:18; robots.ts:4; sitemap.ts:4 | CONFIRMED |
| C96 | Low | website | Inline `next/script` without required `id` (and meaningless `async` on inline content) | website/app/layout.tsx:82 | PLAUSIBLE |
| C97 | Low | repo | Tool caches and template editor config committed: `.tldr/cache/*` tracked despite gitignore; stale `website/.cursor/rules/*` | .tldr/cache/call_graph.json; website/.cursor/rules/ | CONFIRMED |

---

## 2. System map

### 2.1 Monorepo layout

```
/                          package.json  name=@darkroom.engineering/elastica v1.0.0-dev
│                          ← simultaneously: workspace root, build orchestrator, AND the published npm package
├── dist/                  COMMITTED build output (engine ESM/UMD + react ESM + all .d.ts)
├── packages/engine/       name="elastic-collisions"              (no version, not private) → rollup writes to ../../dist
├── packages/react/        name="react-elastic-collision-wrapper" (no version, not private) → rollup writes to ../../dist
├── website/               name=@darkroom.engineering/elastica-website — Next 16 app on Satus starter
├── docs/                  COLLISION_DETECTION.md, LESSONS_LEARNED.md (orphaned, unreferenced)
├── .husky/  lefthook.yml  .eslintrc.json  .prettierrc            ← ALL dead config (C61, C66)
└── (no .github/ at root — no CI whatsoever; workflows sit unread in website/.github/) (C7)
```

### 2.2 Engine architecture (packages/engine/src) — real execution paths

```
 Consumer (React wrapper or raw)                        ENGINE
 ┌──────────────────────────┐
 │ rAF loop                 │    createAccumulator/     ┌────────────────────────┐
 │  deltaTime ──────────────┼──► accumulateTime ─steps─► Elastica.update() × N   │
 └──────────────────────────┘    (accumulator.ts,       │  (elastica.ts)         │
                                  hardcoded 4-step cap) └───────────┬────────────┘
                                          per substep (substeps cfg)│
        ┌────────────────────────────────────────────────────────────┘
        ▼
  1. user callback(this)              ← integrates positions/velocities itself,
                                        reads this.fixedDeltaTime (temporarily scaled!)
  2. static reset                     ← positions[i] = staticPositions[i] (by REFERENCE)
  3. borders (borders.ts)             ← rigid reflect / periodic wrap, unrotated extents
  4. collisions (if calculateCollisions)
       useOBB=true  → detectAndResolveOBB (collision/obb.ts)
                       broadphase: spatial hash (spatial-hash.ts; center-point hashing,
                       3×3 neighborhood; dense buckets >16 → sort-and-sweep from aabb.ts)
                       → isOBBNeighbor (maxExtents radius check)
                       narrowphase: shapeCollisionTest → circleVsCircle / circleVsOBB /
                       satCollisionTest (SAT, 4 axes, pooled arrays from pool.ts)
                       resolution: resolveOBBCollision (penetration-repulsion + global
                       KE rescale + positional correction)
                       then integrateAngularMotion (angle += ω·dt)
       useOBB=false → detectAndResolveAABB (collision/aabb.ts)
                       narrowphase: testAABB; resolution: exclusion kick + KE rescale +
                       velocity SWAP; no positional correction, no mass, no restitution
  5. spatialHash.update(elementCount) ← rebuild buckets for next substep
 Then once per frame: onRender(index, x, y, angle, scale) for non-static bodies.
```

**State model:** Elastica is a struct-of-arrays: `positions/velocities/dimensions/angles/angularVelocities/masses/momentsOfInertia/restitutions/maxExtents/shapeTypes/isStatic/staticPositions/bounced/displayScales/externalForces` — all index-keyed, all public mutable. `initialCondition(elements, rect, callback)` populates them; the callback is expected to set real positions/velocities. `update(elements, cb, onRender?)` uses `elements` **only for `.length`**.

**Key invariants — enforced vs assumed:**

| Invariant | Where enforced | Reality |
|---|---|---|
| Contact normal points A→B | `satCollisionTest` (explicit `dot < 0` flip, obb.ts:161-167) | **Assumed, violated** in circle-center-inside-rect branches (C2) |
| Every nearby pair reaches narrowphase | Assumed by 3×3 neighborhood | **Violated** by dense-bucket `continue` (C3) and center-point hashing for large bodies (C8) |
| Momentum conserved in collisions | Nowhere | **Not conserved** anywhere (C4, C21) |
| Kinetic energy → `initialKE × restitution` | KE-rescale in both resolvers | Enforced per resolution event — which re-fires every substep for persistent contacts (C4, C22) |
| `fixedDeltaTime ≥ 1`, `substeps ≥ 1` | Constructor clamps (elastica.ts:115-116) | `createAccumulator` doesn't clamp (C25); `fixedDeltaTime` is mutated at runtime as a side channel (C31) |
| `restitution ∈ [0,1]` | `setRestitution` clamps | Constructor's `defaultRestitution` does **not** clamp (C27) |
| Mass > 0, dimensions > 0 | Nowhere | Zero mass/size → division by zero → NaN cascade (C24) |
| hash gridSize == neighbor-decode gridSize | Assumed | `Elastica.gridSize` public mutable; `SpatialHash.gridSize` readonly, set once (C37) |
| Arrays consistent with current element list | Assumed | Re-init with null elements leaves ghosts (C26); no add/remove API (C42) |

### 2.3 React layer (packages/react/src)

```
DomElastica (provider, 'dom')                CanvasElastica (provider, 'canvas')
├─ owns Elastica engine (useState+effect)    ├─ owns Elastica engine (ref+effect)
├─ boxesRefs: Map<HTMLElement,ElementData>   ├─ particlesRef: Map<number,CanvasParticleData>
├─ hamo useRect → sectionRect (container)    ├─ hamo useRect → containerRect + <canvas> sizing (dpr)
├─ hamo useFrame → accumulateTime → N×       ├─ hamo useFrame → lazy init (initializedRef) →
│    elastica.update(boxes, userUpdate,      │    accumulateTime → N× elastica.update(elements, userUpdate)
│    renderElement on last step)             │    → renderBatched(ctx, particles, positions, angles)
└─ ElasticaContext {addBox, removeBox,       └─ ElasticaContext {registerParticle, unregisterParticle,
     elastica, container}                         updateParticle, elastica(!), container}
   └─ BoundaryBox (memo)                        └─ CanvasBox (renders null)
        useRect per element                          registers once, updates Map on prop change
        addBox(element, {element, rect})
        mutates elementData.rect in place
```

**DOM lifecycle as traced:** engine #1 constructed during render (dom-elastica.tsx:137); children commit first and register with hamo's initial `{}` rect (truthy); parent effects then build engine #2 and run `initialCondition` on the stale engine with `container.width === undefined` → NaN preset math; a re-render plus hamo's measurement produce 2-3 inits per mount (more under StrictMode) before the sim is real (C45, C46). Frame loop: hamo `useFrame` → `accumulateTime` (4-step cap) → up to N `update` calls → CSS-variable renderer (`translate3d(--ex,--ey)` + `--er`/`--eds`). Registration changes never re-run init (C5); container resize fully re-inits and re-randomizes (C14/C47). Unmount: hamo unsubscribes; the engine has no `destroy()` and holds no globals — GC suffices; injected `<style id="elastica-css">` persists (harmless singleton).

**Engine↔React contract in practice:** engine arrays are positional; the DOM layer maps `Map insertion order → index` and never reconciles; the canvas layer reconciles by resetting the world; the website hardcodes indices into `elastica.externalForces[index]`. `container`/`rect` measured-ness is nowhere enforced (hamo's initial `{}` passes every guard). The layout contract (children absolutely positioned at container origin) is enforced only by the website's Tailwind classes, not by the library or docs (C13).

### 2.4 How the website actually consumes the library

1. All six examples import from **`@elastica`** — a tsconfig path alias: `website/tsconfig.json:47` → `"../dist/elastica-react.mjs"`, i.e. the **committed, minified build artifact**, never `packages/*/src`.
2. Types come from `website/lib/utils/elastica.d.ts` — a 247-line **hand-written ambient module** duplicating (and already drifting from) the generated `dist/react/*.d.ts` (C28).
3. `dist/elastica-react.mjs` itself imports `@darkroom.engineering/elastica` and `@darkroom.engineering/hamo`. No workspace copy of the elastica package exists in node_modules; resolution most plausibly works via **Node package self-reference** through the root package.json's name + exports map (mechanism PLAUSIBLE; the fragility is CONFIRMED — `.next` chunk fingerprints match the local dist).
4. hamo `0.6.46` (root devDep) feeds the library while the website's own components use hamo `1.0.0-dev.7` — two implementations ship (C63).
5. `bun.lock` resolves packages/react's `"*"` peer to the **npm-published 0.0.14** — a third, 14-versions-stale engine copy linked under `packages/react/node_modules/`.

Net: `packages/*/src → (manual bun run build) → committed dist/ → tsconfig alias + accidental self-reference → website`. Editing source has zero effect on the demo until dist is rebuilt, and nothing enforces or documents that (C6).

### 2.5 Build/release story

Publish = `bun publish` from root; no `prepublishOnly`/`prepack` — whatever dist is on disk is published. `bun run build` first *deletes* the committed dist. npm `latest` currently points at `1.0.0-dev` (published 2026-01-30). No changelog, tags, or release workflow; no CI (C7); three dead git-hook systems (C61). Scripts: `dev:website` works, `dev:engine` works, `dev:react` is broken (C30). Root readme has **no** contributor build/run instructions; website READMEs are unmodified Satus template (C62).

### 2.6 Verified non-finding: dist is in sync with src

Both the engine and react auditors independently checked the committed `dist/` against source — feature markers (`displayScales`, `sweepBucket`, `substeps`, `integrateAngularMotion`, `staticPositions`, `onRender`, the `calculatecCollisions` typo) in the bundles, `.d.ts` signatures against current src, and git timestamps at HEAD `643f02c`. **No drift exists as of the last commit.** This is a process risk (nothing prevents drift tomorrow — C7, C60), not a current defect.

---

## 3. Findings

Grouped by hunt category, severity order within each. Every finding retains its concrete scenario and status.

### 3.1 Correctness

**C2 — CRITICAL [engine] — packages/engine/src/collision/circle.ts:140-167, 267-294 — Circle trapped inside rectangles: inverted contact normal. CONFIRMED (independently re-verified, circle.ts:151-166).**
Expected: when a circle's center is inside a rectangle, the normal pushes it out through the nearest face — the code's own comment says "Normal should point from rect toward circle (consistent with outside case)" and docs/COLLISION_DETECTION.md:377 says "Find closest edge, push toward it." Actual: the normal points from the nearest edge *toward the circle center*, i.e. into the rectangle's interior:

```ts
if (minDist === distToLeft) {
  normal = [1, 0] // Point RIGHT (toward circle center from left edge)
  penetration = radius + distToLeft
```

Trace: rect at (0,0), half-extents 100; circle radius 10 at (−90, 0). `distToLeft = 10` → normal `[1,0]`, penetration 20. Geometric A→B (rect→circle) is `[−1,0]`; code returns `[+1,0]`. `resolveOBBCollision` moves the circle along `+normal` (deeper in) and the rect along `−normal` (toward the circle) — they *converge*. Once past the midline the normal flips → the circle oscillates around the rectangle's center line, permanently trapped. Both dispatch orders in `shapeCollisionTest` (obb.ts:432-444) inherit the inversion. `satCollisionTest` sanity-flips its normal against the center-to-center vector (obb.ts:161-167); the circle branches have no such flip. Reachable via overlap at spawn (`initialConditionsPresets.random` doesn't dedupe positions), drag interactions (DragAndGravity), or high velocity punching a center past a face in one step (C43).
Direction: negate the normals in the center-inside branches (validate with the same `dot(centerDiff, normal)` flip SAT uses); add a "circle spawned inside rect is expelled" unit test.

**C3 — CRITICAL [engine] — packages/engine/src/collision/aabb.ts:289-300 (identical in obb.ts:518-529) — Dense buckets silently disable cross-cell collision detection. CONFIRMED (independently re-verified, aabb.ts:290-300).**
Expected: when a neighbor bucket is dense (>16 bodies), sort-and-sweep should *replace*, not *remove*, pair checks between the current body and that bucket. Actual:

```ts
if (bucket.length > DENSE_BUCKET_THRESHOLD) {
  if (sweptBuckets.has(neighborCellId)) continue
  sweptBuckets.add(neighborCellId)
  const sweepPairs = sweepBucket(bucket, ...)   // pairs WITHIN this bucket only
  ...
  continue                                       // indexA vs bucket members: never tested
}
```

Miss matrix (pair d ∈ dense cell D, s ∈ sparse neighbor S): checked only when the outer loop is on `d` and iterates S's sparse bucket with `indexA < indexB` — i.e. only if `d < s`; all pairs with `s < d` are dropped. For two adjacent dense buckets, either side hits the other's dense path → sweep-within-only → **every cross-boundary pair between two dense buckets is dropped**. Scenario: DragAndGravity-style pile-up, 20 boxes settle in cell 27 and 20 in adjacent cell 28 (React default gridSize 8 → 64 cells) — bodies interpenetrate freely at the seam, exactly when the scene is dense, i.e. exactly when the optimization triggers. Also degrades C2's preconditions into "commonly reachable."
Direction: after sweeping a dense bucket, still test `indexA` (when `indexA ∉ bucket`) against bucket members; or sweep the union of the 3×3 neighborhood.

**C4 — CRITICAL [engine] — packages/engine/src/collision/obb.ts:233-410 — The "elastic collision" resolution conserves neither momentum nor (meaningfully) energy. CONFIRMED.**
The standard model the library's name promises: impulse `j = −(1+e)·(v_rel·n) / (1/m_A + 1/m_B + rotational terms)` applied as `±j·n/m` — conserves momentum exactly, reduces to textbook elastic collisions at e=1. The code instead does three things, each wrong on its own terms:
1. **Mass-blind, velocity-blind kick** (obb.ts:271-272, 355-362): `repulsionStrength = 1 / max(penetration, 1)`; both bodies get equal-and-opposite *velocity* deltas regardless of mass. Momentum change = `(m_B − m_A)·rs·n ≠ 0` for unequal masses. Trace m_A=1, m_B=5, v_A=[2,0], v_B=[0,0], rs=1: total momentum goes 2 → 6 after the kick, → ~4.38 after the KE rescale. A pebble shoves a boulder as hard as itself.
2. **Repulsion inversely proportional to penetration**: deeper penetration → *weaker* kick (1/pen, capped at 1). A 50px-deep high-speed impact gets a 0.02 px/step nudge; a 1px graze gets 1.0. Backwards from any penalty model, and impact speed never enters the formula.
3. **Restitution as global KE rescale** (obb.ts:384-394): `targetKE = (KE_A + KE_B) × restitution`, then *both* bodies' linear and angular velocities are scaled by one scalar. Consequences: (a) tangential motion is damped by collisions — bodies grazing at right angles lose speed in all directions; (b) with default e=0.8, a contact persisting N substeps multiplies pair KE by 0.8^N — a resting stack hemorrhages energy (see C22); (c) the rescale is a second, independent momentum violation; (d) two overlapping bodies at rest have initialKE=0 → scale=0 → velocities zeroed; separation relies entirely on positional correction. Static-body branches (obb.ts:277-350) share the structure with a ×2 kick.
Direction: replace with a standard impulse solver (relative velocity along normal, effective mass including `r×n` terms, restitution on the normal component only). Keep the slop/percent positional correction — that part is conventional and fine.

**C5 — CRITICAL [react] — packages/react/src/dom/dom-elastica.tsx:159-184 — Adding/removing/remounting a BoundaryBox corrupts or silently ignores physics state. CONFIRMED (independently re-verified, dom-elastica.tsx:159-165).**
`addBox`/`removeBox` only mutate the `boxesRefs` Map. The init effect deps are `[elastica, sectionRect]` (line 184) — registration changes never re-run it. Engine arrays are positional; the boxes array is `[...boxesRefs.values()]` (insertion order).
- Scenario A (remove): 5 boxes running; box #0 unmounts. Next frame `boxes.length === 4` but `positions[0..3]` still hold the *old* bodies 0-3 — every remaining element inherits its predecessor's position/velocity/angle (all visually teleport), and box #4's state is orphaned. The engine never reconciles (borders.ts:37 guards only `undefined`).
- Scenario B (add): a 6th BoundaryBox mounts later. `positions[5]`/`velocities[5]` are `undefined`; engine loops skip it → the new element **never moves and never collides** until the container happens to resize. Worse: a README-style `update` callback without guards (`velocity[1] += ...`, readme.md:183) throws `TypeError: Cannot read properties of undefined` **every frame**.
- Scenario C (remount/reorder): React remounts a middle child (key change) → Map delete+set moves it to the end → same index-shift corruption as A for every element after it.
Contrast: canvas mode force-reinits on register/unregister (different bug, C14); DOM does nothing.
Direction: re-run init on registration-set change (minimum), or give the engine stable body handles (C42); short-term, document that children must be a static set.

**C8 — HIGH [engine] — packages/engine/src/spatial-hash.ts:30-36 + readme.md:104 — Bodies larger than one cell miss collisions; the README actively steers users into it. CONFIRMED.** *(merged: engine + site auditors)*
Each body hashes into exactly one cell by center; broadphase checks the 3×3 neighborhood — sound only while `body half-extent ≤ cell size`. React default `gridSize: 8` on a 1200px container → 150px cells; a 400px-wide element (halfWidth 200 > 150) can overlap a body two cells away — never tested, silent interpenetration. The root README then describes `gridSize` as "*Spatial hash cell size (should be >= largest element)*" — it is neither a size (it's the cell **count per axis**: `cellX = floor(gridSize * x / width)`; larger gridSize = *smaller* cells) nor should it be ≥ element size; `packages/engine/README.md` ("gridSize × gridSize cells") contradicts the root readme and is the correct one. Scenario: user with 100px elements follows the readme → `gridSize: 100` → 10,000 cells (~19px each on a 1920px container), far smaller than elements → broadphase misses collisions between touching elements → "collisions randomly don't work" bug report. Correct guidance is the opposite: gridSize ≤ containerSize / largestElement.
Direction: derive gridSize from container/max-extent (or hash bodies into every overlapped cell); rewrite the doc row in cell-pixel-size terms; consider renaming (`gridDivisions`) or validating at runtime.

**C21 — HIGH [engine] — packages/engine/src/collision/aabb.ts:150-221 — AABB mode: unconditional velocity swap; mass and restitution silently ignored. CONFIRMED.**
`resolveAABBCollision` adds an "exclusion force" (`±max(1/overlap, 0.5)` per axis — unbounded as overlap→0: a 0.01px x-overlap injects a 100 px/step kick before the rescale), rescales to conserve KE exactly ("assuming equal masses" per its own comment), then **swaps the full velocity vectors**. A swap is correct only for equal-mass, head-on, e=1 collisions; for oblique contact, exchanging tangential components is visibly wrong (grazing bodies swap travel directions entirely). Meanwhile `masses`, `restitutions`, `setMass`, `setRestitution`, `defaultRestitution` all exist on the instance and all do nothing in AABB mode (docs claim both systems implement restitution — C44). Scenario: `useOBB: false, defaultRestitution: 0.1` → collisions remain perfectly elastic.

**C22 — HIGH [engine] — obb.ts:233-410, aabb.ts:150-221 — No approach-velocity check → sticking, oscillation, per-substep energy bleed. CONFIRMED.**
Neither resolver tests `v_rel · n < 0` before resolving. Bodies that already received their kick but still overlap next substep (positional correction only removes `percent=0.8` of `(pen − slop)`) get re-resolved: OBB mode re-applies the KE×0.8 rescale (compounding C4), AABB mode re-swaps velocities — a pair can flip velocities every substep while overlapping (the classic vibrating stuck pair). Scenario: two 100px boxes spawned 30px overlapped, e=0.8, substeps=4 → eight rescales in two frames ≈ 0.8⁸ ≈ 17% of their KE left before separation.

**C23 — HIGH [engine] — obb.ts:290-292, 325-327, 374-377 — Angular response depends on solver configuration. CONFIRMED.**
`const newAngVelA = angVelA + (torqueA / inertiaA) / dt` — the comment claims the `/dt` "cancels out" with integration, true only for the angle change during that substep. The persistent angular velocity after contact is ∝ 1/dt: with `substeps: 4` (dt=4.17ms) the same collision leaves bodies spinning 4× faster than with `substeps: 1` (dt=16.67ms). The linear kick has the opposite problem (per-event, not per-time → more substeps = more kicks for persistent contacts). Net: changing `substeps`/`fixedDeltaTime` changes *outcomes*, not just accuracy — contradicting the frame-rate-independence claims (accumulator.ts:14-16; root README "Features").

**C24 — HIGH [engine] — elastica.ts:164, 180-181, 237-258; obb.ts:292 — Zero mass / zero size → division by zero → NaN cascade. CONFIRMED.**
No validation anywhere. `setMass(i, 0)` sets `momentsOfInertia[i] = 0`; a 0×0 rect or radius-0 circle does the same at init. First collision: `torqueA / inertiaA` → ±Infinity → `getKineticEnergy` computes `0 · Infinity²` = NaN → `scale = sqrt(target/NaN)` = NaN → velocities → positions → `computeCellId` all NaN. The body — and everything it touches through resolution — vanishes into NaN. Zero-size bodies *do* reach narrowphase despite the doc claiming otherwise (C44): `testAABB` with dims `[0,0]` is a point-in-box test, and the `!dim` guards pass because `[0,0]` is truthy.

**C25 — HIGH [engine] — accumulator.ts:18-32 — `accumulateTime` hangs the tab for `fixedDeltaTime ≤ 0`. CONFIRMED.**
`while (accumulated >= fixedDeltaTime) { accumulated -= fixedDeltaTime; steps++ }` — with `fixedDeltaTime = 0` the condition is `acc >= 0` subtracting 0: infinite loop on the main thread. `createAccumulator` performs no validation (unlike the Elastica constructor, which clamps to ≥1 at elastica.ts:115). Any raw-engine consumer wiring `createAccumulator(myConfig.dt)` with a 0/undefined-coerced value freezes the page. Also: the step cap of 4 (line 31) is hardcoded and undocumented — under sustained load the sim silently runs slower than wall-clock with no signal to the caller.

**C26 — HIGH [engine] — elastica.ts:136-147 — Second `initialCondition` with nulls creates ghost colliders. CONFIRMED.**
For a null element the mapper returns `[0,0]` dimensions **before** resetting positions/velocities/angles/masses/maxExtents/isStatic for that index. On first init the stale slots are `undefined` and guards skip them. On **re-init** (React re-runs `initialCondition` on every container resize — dom-elastica.tsx:176-184), an element that changed from real to null keeps its previous position, velocity, `maxExtents`, and `isStatic`: it stays in the spatial hash, passes `isOBBNeighbor` with the stale extent, and its `[0,0]` dims still point-collide (C24 note). Result: an invisible body that bumps others around. A shrinking element list similarly leaves stale tail entries (mostly inert, but `integrateAngularMotion` iterates `state.angles.length` and keeps integrating dead bodies' angles — obb.ts:549).

**C31 — MEDIUM [engine] — elastica.ts:320-383 — One user-callback exception permanently corrupts the timestep. CONFIRMED.**
`update()` sets `this.fixedDeltaTime = originalDeltaTime / substeps`, calls the user callback, restores at the end — no try/finally. A throw mid-frame leaves `fixedDeltaTime` at the substep value; the next `update()` treats it as the base and divides again. With `substeps: 4`, two exceptions shrink an intended 16.67ms step to ~1.04ms — the sim slows 16×, silently. Also applies to reentrancy (calling `update` from within the callback). Direction: try/finally, or stop using a public config field as a parameter channel (pass dt to the callback).

**C32 — MEDIUM [engine] — elastica.ts:335-338 — Static-position cache aliasing. CONFIRMED.**
`this.positions[index] = cachedPos` assigns the *same array object* stored in `staticPositions`. Any consumer callback that mutates positions in place (`position[0] = mouseX` — the natural style, and what presets do for dynamic bodies) writes through to the cache; the "static" anchor drifts permanently. Direction: copy on restore (`[cachedPos[0], cachedPos[1]]`).

**C33 — MEDIUM [engine] — borders.ts:39-65 — Rigid borders use unrotated half-extents. CONFIRMED.**
A 200×20 OBB rotated 45° pokes its corners ~56px through the wall every bounce; clamping uses `dimension`, never `maxExtents` or the rotated projection.

**C38 — MEDIUM [engine] — aabb.ts:15-62; obb.ts:524 — Dense-bucket sweep uses unrotated extents in OBB mode. CONFIRMED.**
`detectAndResolveOBB` passes `state.dimensions` (unrotated half-extents) to `sweepBucket`, whose early-exit `break` (line 50) assumes `left/right = pos.x ± dim.x`. A 200×20 box rotated 90° has an actual x-extent of 100 but is swept with 10 → genuinely overlapping rotated pairs pruned. OBB mode should sweep with `maxExtents`. (Only matters inside dense buckets — the pairs C3 doesn't already drop.)

**C40 — MEDIUM [engine] — pool.ts:61-94; obb.ts:41, 81 — `cornersPool.release` is never called anywhere. CONFIRMED.**
The pool permanently drains after 32 acquisitions, after which every SAT test allocates fresh corner arrays; SAT also recomputes corners 4× per body per test. The "Object Pooling" section of docs/COLLISION_DETECTION.md and LESSONS_LEARNED.md's "0 allocations in steady state" claim are false for this path (see C44).

**C45 — MEDIUM [react] — dom-elastica.tsx:176-184; canvas-elastica.tsx:129, 157 — Init runs against hamo's initial rect `{}`. CONFIRMED.**
hamo `useRect` initializes state to `{}` (truthy). The DOM guard checks `isEmptyArray(boxes)` and `!rect` but never `sectionRect.width`. Mount sequence: init fires with `container = {}` → presets compute `Math.random() * undefined = NaN` positions; engine pre-allocates arrays with NaN; only after hamo measures does a correct re-init run. Same in canvas: `!containerRect` is false for `{}`; the resize effect computes `canvas.width = undefined * dpr → NaN → 0`. Self-heals, but users' `initialCondition` observably runs with `container.width === undefined` (code caching values from the first call keeps garbage), and mount does 2-3 full inits. Direction: gate on `container?.width > 0`.

**C46 — MEDIUM [react] — dom-elastica.tsx:137, 151-157 — Engine built in render, then discarded and rebuilt in an effect. CONFIRMED.**
`useState(() => new Elastica(stableConfig))` runs at render (impure allocation; ×2 under StrictMode), then the `[stableConfig]` effect *always* constructs another engine and `setElastica` on mount. The useState engine receives one wasted `initialCondition` before the state update lands. The constructor is pure/SSR-safe (verified — no window/document), so this is waste plus an extra init, not a crash. Canvas avoids this with ref+effect — incoherent approaches to the same problem (C54). Direction: `useRef` + lazy construction, or `useMemo` from `stableConfig` and drop the effect.

**C47 — MEDIUM [react] — dom-elastica.tsx:176-184 — Re-init keyed on rect object identity, not the dimensions the engine consumes. CONFIRMED.**
hamo publishes a fresh rect object whenever *any* of top/left/width/height change (500ms debounced); the engine only consumes width/height. Scenario: content above the simulation expands (ad banner, accordion) → container `top` changes, size unchanged → full re-init → all elements teleport to new random positions. Direction: dep on `[sectionRect?.width, sectionRect?.height]`; expose the debounce.

**C48 — MEDIUM [react] — presets.ts:66-73, 100-111 — Static-element initialization mixes coordinate spaces. CONFIRMED.**
Presets place static bodies at `rect.left + width/2` where `rect.left/top` come from hamo's useRect = `getBoundingClientRect() + window.scroll*` (document-absolute). Engine positions are container-relative (borders clamp to `[0..container.width]`). Scenario: `DomElastica` rendered 400px down the page (or page scrolled) with a `data-state="static"` box → its collision body sits 400px below where the element visually is; moving elements bounce off empty space and pass through the visible static box. Works on the website only because the demo container is `fixed inset-0` at origin. Canvas mode: `rect.left/top` don't exist on particles → `?? 0` → every static CanvasBox body lands at `[w/2, h/2]` regardless of anything. Direction: compute `elementRect.left - containerRect.left`; give canvas statics an explicit `x/y` prop.

**C49 — MEDIUM [react] — dom/renderer.ts:50-62 — `--er`/`--eds` CSS vars are write-only-when-nondefault, so they stick. CONFIRMED.**
`--er` is only set when `angle !== 0`; `--eds` only when `scale !== 1`. Scenario: a callback animates `displayScales[i]` from 1.5 back to exactly 1 (or angles snap to 0, or a config change recreates the engine with `angles=0` while old DOM vars persist on the same elements) → the element stays rotated/scaled at the stale value forever. Direction: always write both vars, or explicitly clear at defaults.

**C16 — HIGH [react] — dom-elastica.tsx:100-135 — `stableConfig` silently drops `solver.substeps`. CONFIRMED.** *(placed here for narrative; see summary table for severity order)*
Engine supports `substeps` (types.ts:69; elastica.ts:116) and the README documents it (readme.md:110). `<DomElastica config={{ solver: { substeps: 4 } }}>` → `stableConfig.solver` is rebuilt from `{slop, percent, fixedDeltaTime}` only → engine runs `substeps: 1`. No warning. Canvas passes the raw config through, so the identical config behaves differently per mode (C54). Direction: spread `config.solver` rather than allowlisting; add `substeps` now.

**C19 — HIGH [react] — canvas-elastica.tsx:285-292 — Canvas context lies about `elastica`. CONFIRMED.**
The provider value carries `elastica: elasticaRef.current!` — null during the first render pass (populated in an effect at line 110), typed non-null. Child effects run *before* parent effects, so on mount every child effect sees `elastica === null`; consumers crash or add defensive checks the types say are unnecessary — the repo's own website does exactly that (`if (!elastica) return`, example-1.tsx:134). `contextValue` is also rebuilt inline each render (despite a comment claiming stability) → every provider render re-renders all consumers. DOM memoizes; canvas doesn't. Direction: create the engine lazily-but-synchronously (same fix as C46), type `elastica` as `Elastica | null`, memoize the value.

**C71 — LOW [engine] — aabb.ts:239; obb.ts:466 —** `(indexA << 16) | indexB` pair keys silently collide for >65,535 bodies; the 16-bit limit is documented in LESSONS_LEARNED but not at the call sites. CONFIRMED.

**C91 — LOW [website] — example-1.tsx:106-108 —** With `showHashGrid` on, `element.textContent = 'elastica-' + hash[index]` is never restored on toggle-off: every box stays labeled `elastica-17` instead of "Elastica" until example switch/reload. CONFIRMED.

**C92 — LOW [website] — example-6.tsx:14, 77-81, 169-186 —** Default `gravity: 0.01` exceeds its own slider max (0.005) — touching the slider makes the default unrecoverable; `radius={20 + Math.random()*7.5}` is evaluated in render, so toggling Show Hash Grid re-randomizes every particle's size. CONFIRMED.

**C93 — LOW [website] — example-4.tsx:281-298 —** Hand-rolled neighbor check `hashA + gridSize*i + j` treats column-0/column-max cells as neighbors of the adjacent row's far edge (row-wrap false positives) and the bound check `box > gridSize * gridSize` admits index `gridSize²`. Demo-only impact (wrong flocking neighborhoods at screen edges); it re-implements — incorrectly — the `getNeighborIndices` the engine already exposes. CONFIRMED.

**C95 — LOW [website] — app/layout.tsx:18; robots.ts:4; sitemap.ts:4 —** Metadata base falls back to `https://localhost:3000` (https on localhost — unreachable; `.env.example` says http). Sitemap/OG URLs wrong in any env missing `NEXT_PUBLIC_BASE_URL`. CONFIRMED.

**C96 — LOW [website] — app/layout.tsx:82 —** Inline `next/script` without `id` (Next requires it for inline scripts) and meaningless `async` on inline content. PLAUSIBLE (exact Next 16 behavior unverified at runtime).

### 3.2 Alternative / unintended paths

**C14 — HIGH [react] — canvas-elastica.tsx:127-138, 259-272 (+ DOM analog dom-elastica.tsx:176-184) — Every resize and every particle register/unregister resets the entire world. CONFIRMED.**
`registerParticle`/`unregisterParticle`/canvas-resize all set `initializedRef.current = false` → next frame re-runs `initialCondition` → the user callback (typically random presets) re-randomizes **all** positions/velocities. Scenario: an infinite-scroll page adds one CanvasBox → 500 existing particles teleport. Window resize (after hamo's 500ms debounce) → same. DOM mode: resize → same via the `sectionRect` dep. There is no "preserve state, adjust bounds" path at all. Direction: separate "container changed" (rescale/clamp positions) from "population changed" (init only the new index) — needs a small engine add/remove API (C42; design tension 2).

**C26, C36, C72, C74 are engine-side alt-path findings — see 3.1/below.**

**C36 — MEDIUM [engine] — spatial-hash.ts:31-32 — Zero container → NaN spatial hash → silent O(n²). CONFIRMED.**
`computeCellId` divides by `container.width/height`. If `update()` runs before `initialCondition` (exactly what the root README's "Engine Only" snippet does — C9) or the measured rect is 0×0 (display:none container), cell ids are NaN. Map keys treat NaN as equal → every body lands in one NaN bucket; `getNeighborCellIds(NaN, ...)` propagates NaN through bounds checks (NaN comparisons are false → not skipped). The sim "works" but broadphase degenerates to a single bucket — silent O(n²), zero warning.

**C50 — MEDIUM [react] — canvas-elastica.tsx:160 — `if (particles.length === 0) return` runs before `clearRect`. CONFIRMED.**
Scenario: render `{show && <CanvasBox/>}` particles, toggle all off → the frame loop early-returns forever, leaving the last drawn frame frozen on the canvas. Ghost particles persist until a particle is re-added or the canvas resizes. Direction: clear before the early return.

**C72 — LOW [engine] — borders.ts:39-65 —** An element taller/wider than the container satisfies both opposite wall conditions every substep → position ping-pong plus `bounced` counter inflation. CONFIRMED.

**C74 — LOW [engine] — elastica.ts:116, 325 —** `solver: { substeps: NaN }` → `Math.max(1, Math.floor(NaN)) = NaN` → substep loop runs zero times → `update()` silently does nothing. CONFIRMED.

**C94 — LOW [website] — app/error.tsx:19 —** The error page is heavier than the site: it is the only place passing `webgl` to `Wrapper`, so throwing an error mounts the WebGL canvas. Template leftover. CONFIRMED.

Non-finding for the record: multiple concurrent engine instances are safe (module-global pools are content-agnostic; `acquire` resets) — verified by the engine auditor.

### 3.3 Incoherences

**C6 — CRITICAL [website] — website/tsconfig.json:47-48; root package.json:80-89; dist/elastica-react.mjs — Website consumes committed `dist/` via alias + accidental self-reference; three copies of the engine coexist. CONFIRMED (independently re-verified: `@elastica` alias → committed dist at website/tsconfig.json:47; self-reference resolution mechanism PLAUSIBLE).**
All six examples import `@elastica` → `"../dist/elastica-react.mjs"` — the committed, minified artifact, never `packages/*/src`. Types come from a hand-written ambient module (C28). `dist/elastica-react.mjs` itself imports `@darkroom.engineering/elastica`, which exists in no node_modules; the build succeeded anyway (Jan 30 `.next` chunks fingerprint-match the local dist — the typo'd string `calculatecCollisions` present only in local `dist/elastica.mjs` appears in chunk `682866360edd6a7d.js`); the only standard mechanism that explains resolution is **Node package self-reference** through the root package.json's name + exports map. Meanwhile `bun.lock` also installs the npm-published **0.0.14** to satisfy packages/react's `"*"` peer — a third, 14-versions-stale engine copy that IDE go-to-definition can land in.
Scenarios: (1) contributor fixes a collision bug in `packages/engine/src/collision/obb.ts`, runs `bun run dev:website`, reloads — behavior unchanged; nothing anywhere says you must `bun run build` first. (2) Anyone extracting `website/` standalone (it's a self-branded Satus app) → `@elastica` points at a nonexistent `../dist` and the self-reference disappears → build fails.
Direction: make the website depend on the workspace packages by name (bun links them natively; Next transpiles workspace deps), delete the alias and the hand-written d.ts; or at minimum wire `dev:website` to run engine/react watch builds concurrently and document the dist pipeline.

**C27 — HIGH [engine] — elastica.ts:110, 260-264; obb.ts:299, 334, 387 — `defaultRestitution` unclamped in constructor while `setRestitution` clamps. CONFIRMED.**
`new Elastica({ defaultRestitution: 1.2 })` → every collision multiplies pair KE by 1.2 → exponential blow-up within seconds (engine README even boasts of "preventing the gaining-energy bug" — C44). Two entry points enforce different invariants for the same field.

**C28 — HIGH [website] — website/lib/utils/elastica.d.ts — Hand-maintained duplicate of the generated types, already drifting. CONFIRMED.**
Line 52 declares `boxes: ElementData[]` vs the real `(ElementData | null | undefined)[]`; missing `ElementData.shape`; missing exports (`HashGrid`, `isEmptyArray`, `useJavascriptEnable`, `AnyElasticaContextValue`, the `ElasticaContext` value export); its `Elastica` interface is a small hand-approximation of the real class. Scenario: `example-1.tsx:81` does `boxes.forEach(({ element }, index) => ...)` — compiles only because the shim erases nullability; against the real types it's a TS error, and at runtime a null entry (element unmounted mid-frame) would throw destructuring undefined. Nothing checks the shim against `dist/react/index.d.ts`; it will silently rot with every API change. Direction: delete the shim; point the alias's types at `dist/react/index.d.ts` (or depend on the workspace package so `exports.types` just works).

**C34 — MEDIUM [engine] — borders.ts:39-65 —** Borders are perfectly elastic (full reflection) regardless of `restitutions[i]`, with no angular response — a e=0.2 body bounces off walls like e=1, and a spinning box's spin is unaffected by wall hits. Inconsistent with the body-body model in the same engine. CONFIRMED.

**C35 — MEDIUM [engine] — elastica.ts:353-364 —** `integrateAngularMotion` lives inside `if (this.calculateCollisions)`: config `{ collisions: false, useOBB: true }` + `setAngularVelocity(i, 0.01)` → nothing rotates, ever. Rotation is not conceptually a collision concern; a user disabling collisions for a decorative spinning field gets frozen angles with zero feedback. CONFIRMED.

**C37 — MEDIUM [engine] — elastica.ts:25, 77; spatial-hash.ts:9, 14-16 —** `elastica.gridSize` is a public mutable field consumed by `getNeighborCellIds` via state, but the hash itself is computed by `SpatialHash` frozen at construction. `elastica.gridSize = 16` at runtime → cell ids encoded base-4, decoded base-16 → wrong neighborhoods, silently missed collisions. Two sources of truth for one number. CONFIRMED.

**C53 — MEDIUM [react] — canvas-elastica.tsx:165-182 — Dead/broken pre-init block. CONFIRMED.**
`buildElementDataArray` sets `element: undefined` (line 144); the pre-init loop tests `el.element === null` — never true, so the "static workaround" branch is unreachable. The `elastica.masses[i] = p.mass` writes just below execute *before* `initialCondition`, which unconditionally resets `masses[index] = defaultMass` (elastica.ts:152) — wasted work with a misleading comment. The second pass inside the callback (lines 186-196) is the one that works. Direction: delete the block.

**C54 — MEDIUM [react] — dom-elastica.tsx:100-135 vs canvas-elastica.tsx:90-107 — DOM and canvas solve "config" three different ways. CONFIRMED.**
DOM: allowlist-reconstruction with its own DEFAULT_CONFIG (`gridSize: 8`) over engine defaults (4). Canvas: `useMemo(() => config, [13 hand-picked deps])` returning the raw object — its dep list is missing `config?.solver?.substeps`, so changing substeps at runtime is ignored (stale memo). Net: `<DomElastica>` (no config) runs gridSize 8 / substeps dropped; `<CanvasElastica>` (no config) runs gridSize 4 / substeps honored. The same README table claims one set of defaults for both (C12). Direction: one shared `useStableConfig` hook, one source of defaults.

**C55 — MEDIUM [react] — presets.ts:5-45 vs types.ts:12-33 —** `InitialConditionParams`/`UpdateParams` defined twice; presets' copies aren't exported from the index, types.ts's are. Any new engine array must be added in both or presets silently type-check against the stale shape (the `boxes` doc comments already differ). Direction: presets import from './types'. CONFIRMED.

**C56 — MEDIUM [react] — utils.tsx:31-58 vs canvas/renderer.ts:107-135 —** Two hash-grid debuggers with different geometry: DOM `HashGrid` renders a `position: fixed; inset: 0` overlay — the **viewport**, not the simulation container; unless `DomElastica` is full-screen the grid doesn't correspond to actual hash cells (`container/gridSize`, spatial-hash.ts:31-35). Canvas draws the grid correctly in-container. Same debug feature, contradictory outputs. Direction: make DOM HashGrid `position: absolute` within the provider div. CONFIRMED.

**C58 — MEDIUM [react] — dom-elastica.tsx:92, 190-196; utils.tsx:9-29 — Vestigial visibility machinery. CONFIRMED.**
`timeRef` is written twice, read never. `useJavascriptEnable` (name suggests JS/no-JS detection; actually tracks tab visibility) feeds a branch whose only effect is `setJavascriptEnable(true)` — a state update that re-renders the whole provider subtree once per tab-switch and gates nothing (frame catch-up is already handled by the accumulator's 4-step cap). Also exported as public API (index.tsx:46). Direction: delete, or actually use it (e.g. reset the accumulator on visibility regain).

**C63 — MEDIUM [website] — dist/elastica-react.mjs; website/components/ui/fold/index.tsx:4 — Two different hamo packages ship in the same app. CONFIRMED.**
The library externalizes `@darkroom.engineering/hamo` (0.6.46, resolved from ROOT node_modules — only works because website sits inside the workspace) while website code imports hamo `1.0.0-dev.7` (10+ files). Two `useRect`/`useResizeObserver`/RAF implementations in one client bundle; behavior divergence between library-driven and site-driven rects during debugging; and a standalone website checkout can't resolve the scoped hamo at all. Direction: migrate packages/react to the new hamo (or inline the two hooks it uses).

**C65 — MEDIUM [website] — lib/config/features.ts:7 vs lib/features/index.tsx:14 — Two contradictory WebGL flags; the "central" one is dead code. CONFIRMED.**
`features.ts`: `webgl: Boolean(process.env.NEXT_PUBLIC_ENABLE_WEBGL)` → default **false**, comment "disabled by default" — imported by nothing (verified). `lib/features/index.tsx`: `hasWebGL = env !== 'false'` → default **true**, actually used. Scenario: maintainer wants WebGL off, reads features.ts, concludes it already is; in reality `LazyGlobalCanvas` mounts for every visitor, and disabling requires `NEXT_PUBLIC_ENABLE_WEBGL=false` — the exact opposite of what features.ts implies. Direction: delete features.ts or make it the single consumed source; pick one default.

**C67 — MEDIUM [website] — app/page.tsx:14, 17, 39-40, 45-46 —** Example2 (Gravity) and Example5 (Text) are commented out of the nav; the files are fully present and maintained-looking. They still compile only via the lying shim (C28) and will silently rot on any API change; nobody knows if they're broken, unfinished, or curated out. Direction: re-enable or delete; if kept disabled, one-line comment why. CONFIRMED.

**C68 — MEDIUM [repo] — package.json; packages/*/package.json; website/app/layout.tsx:82 — Naming schizophrenia across every identity surface. CONFIRMED.** *(merged: site + engine auditors)*
npm: `@darkroom.engineering/elastica`; git remote: `elastic-collisions`; directory: `elastic-collision`; workspace packages: `elastic-collisions` and `react-elastic-collision-wrapper` — the engine package has **no version/main/exports/types** (it exists only as a build-script holder; the published identity lives at the root); website: `elastica-website`. `window.elasticaVersion` is set from the *website's* package.json (`1.0.0`), matching no published library version — someone debugging prod gets a number that identifies nothing. Direction: converge on `elastica` everywhere; report the real library version.

**C69 — LOW [engine] — elastica.ts:218-222 —** `hasBounced(i)` *increments* and returns a count — the name promises a boolean read, delivers a mutation; every caller uses it as "record a bounce". CONFIRMED.

**C77 — LOW [engine] — pool.ts:136; index.ts:22-23 —** `vectorPool` is used nowhere and not exported; index.ts comments "only used ones" while exporting `cornersPool`/`axesPool` — and the corners pool is itself half-dead (C40). CONFIRMED.

**C78 — LOW [engine] — aabb.ts:68-91; spatial-hash.ts:57-82 —** The 3×3 neighborhood algorithm exists twice (`getNeighborCellIds` vs `SpatialHash.getNeighborIndices`) with different return types; a future off-by-one fix will land in one and not the other. CONFIRMED.

**C80 — LOW [react] — presets.ts:129 —** `initalConditionsPresets` typo is the only exported spelling, propagated to README and website. CONFIRMED.

**C81 — LOW [react] — presets.ts:179-232 —** `rightFlow`'s flow is `0.5*(rand-0.5)` — zero-mean noise, nothing flows right; `dvdScreenSaverOBB` reads `angle`/`angularVelocity` then does exactly what `dvdScreenSaver` does (dead reads; the comment admits the engine integrates rotation); `DragAndGravity` breaks camelCase. CONFIRMED.

### 3.4 Affordance mismatches

**C15 — HIGH [react] — canvas-box.tsx:89-104; canvas-elastica.tsx:274-282 — Physics props are wired to look controlled but aren't. CONFIRMED.**
CanvasBox has an update effect covering `mass, restitution, isStatic, width, height...` calling `updateParticle` — which only rewrites the Map. But `mass`/`restitution`/`static` are read exclusively inside the init block (canvas-elastica.tsx:184-196), and collision dimensions are baked at `initialCondition` (the engine reads `rect` only there; `update()` uses `elements` solely for `.length`). Scenario: animate `<CanvasBox width={w}>` from 10→100 → the *drawn* rect grows (renderer reads the Map each frame) while the *collision body* stays 10px until an unrelated resize/register forces re-init — visible interpenetration. Changing `mass={5}` does nothing, ever, unless something else resets the world. Direction: wire `updateParticle` to `elastica.setMass/setRestitution` + dimension updates, or document these as init-only and drop them from the update effect.

**C18 — HIGH [react] — dom-elastica.tsx:38, 231-234 — `ref` as a plain prop only works on React 19; peers say `react: ">=18.2.0"`. CONFIRMED.**
No `forwardRef` anywhere (verified in the bundle). On React 18.2: `<DomElastica ref={elasticaRef}>` → React strips `ref`, warns "Function components cannot be given refs", `ref.current` stays null → the only pause/play API is silently dead. README's "Control playback" section (readme.md:153-156) fails exactly this way on 18. Direction: `forwardRef`, or bump the peer to `>=19` and document it.

**C37 (above) also belongs here:** mutable public config fields (`gridSize`, `calculateBorders`, `calculateCollisions`, `fixedDeltaTime`, `substeps`) look like live knobs; `gridSize` desyncs, and `fixedDeltaTime` is secretly also an *output* channel during `update()` (C31) — writing it from a callback fights the engine's own save/restore.

**C73 — LOW [engine] — types.ts:19-23; elastica.ts:126-205 —** `ElementData.rect.left/top` are typed as accepted ("optional for presets") but `initialCondition` never reads them — positions come only from the callback. A raw consumer passing measured rects expects placement and gets everything at `[0,0]`. Related: the default `callback = () => {}` yields a degenerate all-bodies-at-origin state that rigid borders then smear into the top-left corner — the zero-argument easy path is the broken path. Also: `update(elements, ...)` requires the full `ElementData[]` but reads only `.length` — the signature implies per-frame element data is consumed; resizing an element mid-run changes nothing until re-init. CONFIRMED.

**C83 — LOW [react] — dom/renderer.ts:9-19 —** The injected `[data-elastica]` rule is appended to `<head>` at first init — later than app stylesheets — so at equal specificity (0-1-0) it beats any user `transform` on the box (e.g. a hover scale via class). Silent override, no escape hatch. CONFIRMED.

**C84 — LOW [react] — index.tsx:62 —** `export { DomElastica as default }`: `import Elastica from '@darkroom.engineering/elastica'` is the engine class; `import Elastica from '.../react'` is a React component. Same mental import shape, wildly different things. CONFIRMED.

### 3.5 Missing functionality

**C20 — HIGH [react] — boundary-box.tsx:49-52; readme.md:9 — DOM mode cannot do circles; README claims both modes support shapes. CONFIRMED.**
There is no per-element shape API in DOM mode at all (see also C10 — the README's `shape` prop is fiction); `ElementData` has a `shape` field waiting to be wired, but BoundaryBox never sets it.

**C39 — MEDIUM [engine] — elastica.ts:356, 367 —** `collisionsList` is overwritten per substep — with `substeps > 1` consumers doing hit effects/sound only see the last substep's collisions. CONFIRMED.

**C42 — MEDIUM [engine] — elastica.ts:126-205 — No add/remove-body API; index-keyed identity invites teleports. CONFIRMED.**
The engine's only population path is the destructive `initialCondition`. The React layer exposes `addBox`/`removeBox` (advertised in the root README): adding mid-run grows `elements.length` past the initialized arrays → the new body has undefined position → skipped by every guard → *nothing happens* until a resize re-inits; removing shifts every subsequent index while engine arrays stay keyed by old indices → bodies visually swap positions/velocities/masses (C5). The engine can't fix the React layer, but the SoA index-keyed API is what makes this misuse the path of least resistance (design tension 2).

**C43 — MEDIUM [engine] — collision/* (absence); obb.ts:271-272 —** No tunneling protection (purely static overlap tests, no swept/CCD): a body moving more than its own size per substep tunnels through others (border clamps are position-based, so walls mostly hold). Compounded by C4's repulsion being *weakest* at deep penetration, fast impacts under-respond even when detected. Undocumented; `substeps` exists but is never framed as the mitigation. CONFIRMED.

**C52 — MEDIUM [react] — canvas-elastica.tsx (absence) —** CanvasElastica has no ref/pause/play (DOM does: dom-elastica.tsx:26-29); neither mode supports `prefers-reduced-motion`; no IntersectionObserver pause when offscreen (both loops burn CPU for invisible sims); no `onInit`/engine access outside children. For a physics animation library aimed at marketing sites this is the standard checklist. CONFIRMED absent.

**C75 — LOW [engine] — elastica.ts:126-205 (absence) —** Negative/NaN dimensions, velocities, and masses accepted without validation at any public entry (constructor, `initialCondition`, setters); e.g. circle radius −5 yields "collisions" with negative penetration whose kicks fire but corrections don't. No NaN sentinels; failures are always silent and downstream. Related gaps: no `destroy()`/reset; no interpolation alpha from the accumulator (positions render at fixed-step boundaries — slight temporal aliasing at 120Hz+ despite the "smooth across refresh rates" claim); `bounced[]` is never reset by the engine although the README calls it "Collision flags" — as a flag it's monotonic garbage after frame 1. CONFIRMED.

**C86 — LOW [react] — canvas-elastica.tsx:67 —** `dpr` default is read once per render with no matchMedia listener; dragging the window to a 1x monitor keeps rendering at the old DPR until an unrelated re-render. CONFIRMED.

### 3.6 Boundary & safety

**C17 — HIGH [react] — dist/elastica-react.mjs:1; packages/react/rollup.config.js — `'use client'` stripped from the published bundle. CONFIRMED.**
All six client source files start with `'use client'`; the shipped bundle contains zero occurrences (verified by grep) — rollup drops module-level directives when bundling unless preserved via `output.banner` or a directive plugin. Scenario: a Next.js App Router user imports `{ DomElastica }` in a server component (the natural first attempt) → `createContext is not a function` / "only works in Client Components", with no hint the library was supposed to declare the boundary itself. This is the primary consumer profile for this org. Direction: `output.banner: "'use client';"` (sourcemap-safe plugin).

**C41 — MEDIUM [engine] — elastica.ts:140; canvas-elastica.tsx:168-188 — The physics core hard-codes a DOM contract. CONFIRMED.**
`initialCondition` reads `element.element?.dataset?.state === 'static'`. Canvas mode (no DOM elements) must bypass it by writing `elastica.isStatic[i] = true` inside the init callback *and again every frame* because re-inits clobber manual sets. Two mechanisms for one concept, enforced in the wrong layer; the engine cannot be used headless with static bodies except via the undocumented array poke. Direction: take `isStatic` as data on `ElementData`; implement the DOM-attribute convention in the React/DOM layer (design tension: the canvas init also pokes `masses[i]` directly, bypassing `setMass` — only correct because the proper setter is *also* called in a second pass; see C53).

**C51 — MEDIUM [react] — canvas-elastica.tsx:141-162; canvas/renderer.ts:29-43 — The mode sold as "for 200+ elements, better performance" allocates per frame. CONFIRMED.**
Two `Array.from(map.values())`, N fresh `ElementData` objects (`buildElementDataArray` **every frame**, though the engine reads them only for `.length` after init), a batches `Map`, per-batch arrays, and an `indexMap` — ~5N objects × 60fps. GC pressure directly undercuts the component's stated purpose. Direction: cache the elements array, invalidate on registration change; hoist batch structures.

**C64 — MEDIUM [website] — lib/features/index.tsx:59-61; lib/dev/orchestra.ts:13 — Debug tooling ships to production unconditionally; FPS overlay defaults ON. CONFIRMED (from code).**
OrchestraTools is always pushed; the `features.devtools` "always false in production" flag is never consulted; default orchestra state is `{ stats: true }` (persisted to localStorage); `cmdo.tsx` hijacks Cmd/Ctrl+O globally. Every production visitor gets the stats-gl FPS meter and a live debug palette (grid debugger, minimap, Theatre studio toggle — @theatre/studio, a devDependency, pulled into prod bundles via dynamic import). May be intentional for a physics demo; contradicts the code's own comments. Direction: gate on NODE_ENV or the dead devtools flag; if the FPS meter is intentional, mount Stats explicitly and drop the rest.

**C70 — LOW [engine] — elastica.ts:41-47; dom-elastica.tsx:181-183, 209-217 —** `hash`/`buckets` getters return live internal structures — consumers can corrupt broadphase state — and, being prototype getters, they vanish under object spread. The React wrapper's `{ boxes, ...instances }` in `initialCondition` already loses them (which is why its update path re-plumbs `hash`/`gridSize` explicitly — the API shape manufactured that bug), and the DOM update spread leaks engine internals (`spatialHash`, `staticPositions`, `collisionsList`, …) into the user's `UpdateParams` beyond its declared type — accidental API surface users will depend on. CONFIRMED.

Security posture otherwise: the engine is pure computation — no injection/authz surface; pools are bounded; `checkedPairs`/`sweptBuckets` are per-call; the only unbounded-growth candidate (stale `hashArray` tail after shrinking re-init) is minor. Nothing further to flag beyond C61's hook footgun.

### 3.7 Documentation

**C9 — HIGH [repo] — readme.md:224 — "Engine Only" example calls nonexistent `engine.setContainer()`; the only raw-engine onboarding path cannot work. CONFIRMED.** *(merged: engine + react + site auditors)*
`engine.setContainer({ width: 800, height: 600 })` — no such method exists on `Elastica` (`setContainer` lives on the internal `SpatialHash`; the container is set via `initialCondition(elements, rect, cb)`). Scenario: a vanilla-JS user follows the only non-React example in existence → `TypeError: engine.setContainer is not a function` on the second line. Even with that line removed, the example never calls `initialCondition`, so dimensions/positions are undefined, `update()` no-ops, and the spatial hash NaNs into a single bucket (C36). Direction: rewrite against the real API (initialCondition + update + onRender).

**C10 — HIGH [react] — readme.md:112-126 vs boundary-box.tsx:9 — The BoundaryBox example is fiction. CONFIRMED.** *(merged: react + site auditors)*
`isStatic`, `mass`, `restitution`, `displayScale`, `shape` — none exist; `BoundaryBoxProps = HTMLAttributes<HTMLDivElement>` (confirmed against both src and the shipped `dist/react/dom/boundary-box.d.ts`). TS users get compile errors (`isStatic` is not a DOM attribute); JS users get React unknown-prop warnings, the props leak onto the DOM div or vanish, and zero physics effect — the "static" element happily drifts away. The real static mechanism is `data-state="static"` (engine elastica.ts:140, used correctly by website example-2), documented only in JSDoc. There is *no* per-element mass/restitution/displayScale/shape API in DOM mode at all — an affordance gap vs CanvasBox, which has them. Direction: rewrite the section from the generated types; document `data-state="static"`; decide whether per-element physics for DOM mode should exist (open question 11).

**C11 — HIGH [react] — readme.md:128-144 vs types.ts:36, canvas-box.tsx:27 — CanvasBox example uses `shape="rectangle"` and `isStatic`. CONFIRMED.** *(merged: react + site auditors)*
Real API: `CanvasShape = 'rect' | 'circle'` and the prop is `static`. At runtime `'rectangle'` falls through both branches of the renderer (canvas/renderer.ts:82-89) → the particle **collides but is never drawn** (the engine receives 'rectangle' via the pass-through at canvas-elastica.tsx:147) — invisible colliding ghosts, straight from the docs; `isStatic` is silently dropped → the "static" particle moves. Bonus incoherence: the ENGINE's `ShapeType` is `'rectangle' | 'circle'` while react-canvas uses `'rect' | 'circle'` — one concept, two vocabularies across one API surface. Direction: fix the readme; unify the shape vocabulary (breaking, but pre-1.0).

**C12 — HIGH [react] — readme.md:100-110 — Config table wrong on defaults. CONFIRMED.** *(merged: react + engine auditors; gridSize semantics are C8)*
(a) `useOBB` documented default `false`; engine default is `true` (elastica.ts:70) and so is DomElastica's DEFAULT_CONFIG — users following the docs think they're in cheap AABB mode but pay OBB cost (or vice versa: expect AABB semantics, get OBB). (b) `gridSize` documented `8` — true for DomElastica only; engine and canvas default is `4` (see C54 for the mode split). (c) The `gridSize` description is wrong in kind and direction — covered in C8. Also missing from the table entirely: `solver.slop`, `solver.percent`. Direction: regenerate the table from code, one defaults source (C54).

**C13 — HIGH [react] — readme.md:26-52 — Quick start yields a visually broken simulation. CONFIRMED.**
`renderElement` sets `translate3d(--ex, --ey)` where x/y are container-space top-left coordinates (elastica.ts:394-395) — correct only if each box is absolutely positioned at the container origin. The website does `className="absolute inset-0 w-fit h-fit"` on every BoundaryBox and mounts the provider in a `fixed inset-0` section; the README shows plain in-flow divs and no container sizing (the provider is `height: 100%` of whatever parent). Newcomer result: boxes offset by their static layout positions, collisions not matching visuals, or a 0-height container with everything clamped to the top edge — plus `key={i}` index keys in the canonical example (the exact trigger for C5's scenario C). Direction: either BoundaryBox enforces the contract (`position: absolute; top: 0; left: 0` — one line) or the contract is the first line of the docs.

**C29 — HIGH [repo] — package.json:27; readme.md:235-237; website/package.json:6 — License and repository identity contradictions; no LICENSE file. CONFIRMED (whether the `elastica` GitHub repo exists: PLAUSIBLE broken link).** *(merged: site + react + engine auditors)*
Root package.json says `"license": "ISC"` and `repository: darkroomengineering/elastica.git`; root readme says "MIT"; website/package.json says "MIT"; the actual git remote is `darkroomengineering/elastic-collisions.git`; the website footer and readme link to `github.com/darkroomengineering/elastica`; **no LICENSE file exists anywhere** (verified). Scenario: legal review of a consumer project finds npm metadata ISC vs readme MIT vs no license text → the package is effectively "all rights reserved" until fixed; the footer link on the live demo may 404. Direction: pick MIT (stated intent), add LICENSE, align package.json + repository URL + remote.

**C44 — MEDIUM [engine] — packages/engine/README.md:99-112; docs/COLLISION_DETECTION.md:200-203, 372-381 — False engine-doc claims cluster (all CONFIRMED against code).**
- engine README:104: "Initial KE = Final KE × restitution" — inverted (code: final = initial × e; as written it claims energy *gain*). Line 101: "Both collision systems implement energy conservation ... restitution" — AABB mode has no restitution (C21). Line 112: "prevents the 'gaining energy' bug" — yet `defaultRestitution > 1` is accepted and gains energy (C27).
- COLLISION_DETECTION.md:378: "Zero-size shapes | Returns no collision (dimensions validation)" — there is no dimensions validation; zero-size bodies collide as points (C24). Line 377: "Circle center inside rectangle → push toward closest edge" — code pushes away from the closest edge, toward the interior (C2). Line 380: "All impulse transfers to dynamic body" — the resolver is not impulse-based (C4). Lines 200-203: the world-space transform snippet rotates by `-angle`; the code (correctly) rotates by `+angle` (circle.ts:311-317). The "Object Pooling" section shows acquire/release as the pattern in use — corners are never released (C40). LESSONS_LEARNED.md:91: "Pooling: 0 allocations in steady state" — false for the corners path.
- Undocumented anywhere: units (ms for dt, px for space, rad for angles); the accumulator's hardcoded 4-step cap; `containerOffsets` semantics (C82).

**C57 — MEDIUM [react] — readme.md:94 — "initialCondition … Called once on mount" is false. CONFIRMED.**
Actually called 2-3× on mount (C45/C46), on every debounced resize, on rect top/left changes (C47), and in canvas mode on every register/unregister (C14). Users putting one-time setup (event listeners, fetching) in it get repeated side effects.

**C62 — MEDIUM [website] — website/README.md; PROD-README.md; ARCHITECTURE.md; .env.example — website/ docs are the unmodified Satus template and actively lie about this repo. CONFIRMED.**
Quick Start commands `bun run setup:project` and `bun run generate` don't exist in website/package.json; referenced files/routes (`lib/integrations/`, `app/(examples)/`, `/studio`, `/api/revalidate` — there is no `app/api/` at all) don't exist; `.env.example` carries SATŪS branding + Sanity/Shopify/HubSpot/Mailchimp/Mandrill/Turnstile vars consumed by nothing; `robots.ts` disallows `/studio/` and `/api/draft-mode/`; `tsconfig.json:39` maps `~/integrations/*` to a nonexistent dir. Scenario: a newcomer told "the demo site is in website/" follows any doc-driven path and dead-ends ("Script not found", 404s). Direction: replace website/README.md with ~10 honest lines; delete or trim PROD-README/ARCHITECTURE.

**C79 — LOW [engine] — elastica.ts:344; types.ts:32-35 —** Stale/lying internals: the `getBorderState()` call site comments "(using cached state object)" but all three `get*State()` methods build fresh objects per substep; `CollisionRecord { loop, inHash }` field names describe a loop structure that no longer exists. CONFIRMED.

**C82 — LOW [react] — readme.md:106; borders.ts:26-27, 40-65, 79-80 —** `containerOffsets` are **fractions of container size** (multiplied by container dimensions) with an asymmetric sign convention (top/left inset positive, bottom/right inset negative, due to the `+1` at borders.ts:26-27, 79-80), while the README ("Inset simulation bounds", numeric defaults) reads as pixels — `{top: 10}` insets by 10× container height, flinging everything out. Documented nowhere. CONFIRMED.

**C88 — LOW [react] — index.tsx:46 —** `HashGrid`, `isEmptyArray`, `useJavascriptEnable` exported publicly, appear in no docs (and `useJavascriptEnable` gates nothing — C58). CONFIRMED.

**C89 — LOW [repo] — docs/; packages/engine/README.md:116-128 —** `docs/COLLISION_DETECTION.md` and `docs/LESSONS_LEARNED.md` are referenced by nothing (no inbound links; the root readme has no docs section). LESSONS_LEARNED uses pre-rename API names (`ReactElastica`, `AxisAlignedBoundaryBox`) and prescribes `useMemo` patterns the website's own ARCHITECTURE.md forbids under React Compiler. The engine README "File Structure" omits `accumulator.ts`, `pool.ts`, `spatial-hash.ts`, `collision/circle.ts`, `collision/index.ts` (all exist). Direction: add a Docs section to the root readme; refresh names; regenerate the tree. CONFIRMED.

### 3.8 Developer experience

**C1 — CRITICAL [react] — packages/react/package.json:17-21 + readme.md:16-20 — The documented install cannot run the documented quick start. CONFIRMED (independently re-verified: hamo unconditionally imported but optional peer).**
`@darkroom.engineering/hamo` is imported unconditionally (dom-elastica.tsx:9, canvas-elastica.tsx:9, boundary-box.tsx:4) yet declared an **optional** peer (`peerDependenciesMeta`) in both packages/react and the root (published) package.json:72-74. Optional peers are *not* auto-installed by npm≥7/bun, and optionality also suppresses the peer warning that would explain the failure. The README says only `npm i @darkroom.engineering/elastica` and never mentions hamo. Scenario: newcomer follows the README → `import ... from '@darkroom.engineering/elastica/react'` → build error `Cannot find module '@darkroom.engineering/hamo'`, step zero, every consumer. Direction: make hamo a real dependency of the published package (tiny, internal-org), or a non-optional peer + install docs.

**C7 — CRITICAL [repo] — website/.github/workflows/ — Zero CI: the only workflows live where GitHub Actions never reads them. CONFIRMED.**
`automerge-dependabot.yml` and `lighthouse-to-slack.yml` sit in `website/.github/workflows/`; there is no root `.github/` (verified). Scenario: a PR that breaks `bun run build:engine` or website typecheck merges green because nothing runs; the dependabot automerge workflow has never fired (an unmerged `dependabot/npm_and_yarn/website/...` branch sits on origin); Lighthouse reporting silently never happens. Combined with C6/C60, dist can drift from src with no tripwire. (The PR template also lives in the unread location.) Direction: move workflows to root `.github/workflows/` with paths filters; add a minimal CI job: install → build engine+react → **diff dist against committed dist (fail on drift)** → website typecheck/build → bun test.

**C30 — HIGH [repo] — package.json:11; packages/react/package.json — `bun run dev:react` is broken; react package metadata is a fossil. CONFIRMED.** *(merged: site + react auditors)*
`dev:react` invokes `"dev": "vite"` — vite is absent from every package.json, bun.lock, and node_modules/.bin (verified); there is no vite config or index.html in packages/react (a fossil from a removed playground). Scenario: contributor reads root scripts, runs it → `error: script "dev" exited with code 127`. Additionally: no `"private": true` (accidental-publish risk for a package named `react-elastic-collision-wrapper` with no version/exports — publish would error on the missing version, which is the only guard); `peerDependencies: {"@darkroom.engineering/elastica": "*"}` on a package that is *bundled into* that same package — self-referential and meaningless (and the reason npm 0.0.14 gets installed, C6). Direction: point `dev` at `rollup -c -w` like `watch` (note `dev:engine`'s `npm-run-all --parallel watch` is needless indirection for one task); mark workspace packages private.

**C59 — MEDIUM [repo] — repo-wide — Zero tests for the physics engine and React bindings; existing website tests unrunnable-by-script; PR template references a nonexistent check. CONFIRMED.** *(merged: engine + react + site auditors)*
The only tests in the repo are `website/lib/utils/math.test.ts` and `strings.test.ts` (bun:test) — and no package.json anywhere has a `test` script. packages/engine and packages/react have no tests at all: for code whose failure modes are "physics looks subtly wrong," the absence of even one conservation/expulsion/broadphase regression test means C2/C3/C4-class bugs ship invisibly, and the registration/index-shift class (C5) is exactly what a jsdom test would have caught. The engine package.json has `build`/`watch` only — no test/lint/typecheck. `website/.github/PULL_REQUEST_TEMPLATE.md` says "`bun lint` passes" — no such script exists at root. Direction: add `"test": "bun test"` (root + website), seed engine tests (energy conservation, SAT edges, circle-inside-rect expulsion, dense-bucket pairs), fix the template.

**C60 — MEDIUM [repo] — package.json:17-19 — Committed dist + publish pipeline with no guards; npm `latest` points at a `-dev` version. CONFIRMED.**
No `prepublishOnly`/`prepack` → whatever dist is on disk gets published. `npm view` shows `latest: 1.0.0-dev` (published 2026-01-30) — `publish:dev` exists precisely to keep dev builds off `latest`, yet 1.0.0-dev IS latest. `bun run build`'s first step (`clean`) deletes the committed dist, so an engine build failure leaves the working tree with a gutted tracked directory. bun.lock separately pins the workspace peer to npm `0.0.14` (C6). Scenario: maintainer edits engine source, forgets `bun run build`, runs `bun run publish` → stale dist published under a bumped version. Direction: `prepublishOnly: bun run build:engine && bun run build:react`; publish a stable semver or move the dev line to the `dev` tag; long-term stop committing dist or add the CI drift check (C7).

**C61 — MEDIUM [repo] — .husky/, lefthook.yml, website/lefthook.yml — Three git-hook systems configured, all dead; one is a supply-chain footgun. CONFIRMED.**
`.husky/pre-commit` runs `npx lint-staged` (lint-staged not installed, no config), `.husky/post-merge` runs `npx vc env pull`; root `lefthook.yml` is 100% commented-out example; `website/lefthook.yml` runs `bunx tsgo` (not a dependency). Neither husky nor lefthook is in any package.json; `.git/hooks` contains only samples; `core.hooksPath` unset (all verified). Scenario: developers assume formatting/typecheck runs pre-commit (three configs say so) → nothing runs, and there's no CI behind it (C7). If husky were ever activated, `npx vc env pull` would fetch whatever package `vc` is on npm at that moment (Vercel's CLI package is `vercel`; the `vc` alias only exists once vercel is installed) → arbitrary-code-execution-by-typo on every merge; same class of risk for `bunx tsgo`. Direction: pick ONE hook manager, install it as a real devDependency with prepare, delete the other two configs, pin hook tools.

**C66 — MEDIUM [repo] — .eslintrc.json; .prettierrc; .vscode/settings.json — Root lint/format configs are for a stack this repo doesn't have, and contradict the website's. CONFIRMED.**
Root eslint extends `next/core-web-vitals` + `plugin:storybook/recommended` + a `useLenis` hooks config — no eslint, next, or storybook at root (packages build with rollup). Prettier configs with prettier installed nowhere. Root `.vscode/settings.json` mandates prettier + eslint codeActions while `website/.vscode/settings.json` mandates Biome. Scenario: contributor opens the monorepo root in VS Code → prettier (not installed) applies to website files whose tooling expects Biome → formatter errors/churn diffs. Direction: delete root eslint/prettier; extend Biome to packages/ or accept none; align .vscode.

**C76 — LOW [engine] — rollup.config.js:17-30; package.json exports —** The published module entry (`dist/elastica.mjs`) is terser-minified ESM; consumers stepping into engine code in devtools read mangled output (sourcemaps help only when served). The readable UMD build (`elastica.js`) exists but isn't the entry. Also: running `bun run build` inside packages/engine writes into the repo-root `dist/` (rollup.config.js:5) — surprising but functional. CONFIRMED.

**C85 — LOW [react] — dom/renderer.ts:16 —** Permanent `will-change: transform` on every `[data-elastica]` element promotes up to "fewer than 200" boxes to compositor layers forever (the org's own style rules forbid always-on will-change). Fine at 20 boxes, memory-hungry at 200. CONFIRMED.

**C87 — LOW [react] — dom-elastica.tsx:179 —** `boxes.some(({ rect }) => !rect)` is dead: BoundaryBox always registers `rect: rect ?? {width: 0, height: 0}` and hamo's `{}` is truthy — the guard that *looks like* it protects init from unmeasured children protects nothing (the real unmeasured state, `{}`/`{width: undefined}`, passes; see C45). CONFIRMED.

**C90 — LOW [repo] — package.json; npm registry —** Consumers get a prerelease with no provenance: `latest` = 1.0.0-dev, no CHANGELOG, no GitHub releases, no repo tags; `main`/`exports` untested against CJS consumers (ESM-only `.mjs` behind `"default"` — fine on Node ≥22 `require(esm)`, breaks older). Overlaps C60; kept separate for the consumer-facing angle. CONFIRMED.

**C97 — LOW [repo] — .tldr/cache/, website/.cursor/rules/ —** Tool caches committed: `.tldr/cache/call_graph.json` tracked at root and in website despite `.tldr/*` in .gitignore (files added before the ignore); `website/.cursor/rules/*` references integrations that don't exist. Direction: `git rm --cached` the caches; prune cursor rules. CONFIRMED.

---

## 4. Design tensions

**1. The resolver fork: impulse-solver rewrite vs doc-honesty.**
The core OBB/AABB resolution (C4, C21, C22) is a heuristic that cannot be parameter-tuned into correctness: momentum violation, tangential damping, and per-substep energy bleed are structural, and the library is *named* after the physics it doesn't do. Two coherent exits: (a) replace with a standard sequential-impulse contact solver — ~60 lines using the contact data the narrowphase already produces (normal impulse with restitution on approach velocity, effective mass with `r×n` terms, keep the existing slop/percent positional correction), making the name true; or (b) declare the current behavior an aesthetic ("looks bouncy, never explodes"), rewrite the docs, and rename the knobs so `mass`/`restitution`/KE vocabulary stops promising a contract the code doesn't honor. Everything around the resolver (broadphase, SAT, circle tests) is salvageable as-is once C2/C3 are fixed. The wrong move is the current middle: physics vocabulary + non-physics behavior.

**2. Positional identity is the load-bearing contract, and no layer owns it.**
Engine bodies have no identity beyond their array index; the only population path is the destructive `initialCondition` (C42). React's world is keyed and dynamic. The DOM layer maps Map-insertion-order → index and never reconciles (C5); the canvas layer reconciles by nuking the world (C14); "re-init" conflates three different events — container measured, container resized, population changed — each wanting different behavior (nothing / rescale-or-clamp / incremental add-remove), all funneled into "randomize everything"; the website hardcodes indices into `elastica.externalForces[index]`. Alternative to weigh: engine-level `addBody()/removeBody() → stable handle` with an internal free list (SoA kept internal for performance), and a React layer that maps child → handle. C5, C14, C15, C26, and C42 all collapse into that one abstraction.

**3. Three copies of the engine between source and screen.**
The demo pipeline is `packages/*/src → manual build → committed dist/ (consumed via tsconfig alias + accidental npm self-reference + a hand-written 247-line type shim) → website`, with npm's stale 0.0.14 additionally linked in via a `"*"` peer (C6, C28, C63). Four sources of truth for one API (src, dist, shim, readme) connected only by human discipline. Alternative: the website depends on the workspace packages by name (bun links them; Next transpiles workspace deps), the alias and shim are deleted, and `files: ["dist"]` keeps publishing working. Cost: contributors run a watch build — which is what the `dev:*` scripts are for.

**4. A monorepo without a release pipeline.**
Committed dist with no prepublish build (C60), no CI anywhere it runs (C7), three dead hook systems (C61), `latest` = 1.0.0-dev (C90), root package = published package = workspace root (which is what makes the self-reference in C6 possible and prevents engine/react from versioning independently, despite the peer-dep structure implying separate publication was once intended). Both auditors verified dist is in sync *today* — but every mechanism that would keep it true tomorrow is absent. Alternative: root goes `private: true` with a dedicated publish package (or separate engine/react packages), `prepublishOnly` builds, and one small CI job whose dist-drift check makes the committed artifact safe to keep — or dist leaves git entirely.

**5. Docs written for three audiences, addressed to none.**
npm consumers get a root readme whose four API sections are wrong in load-bearing ways (C9-C13); engine learners get orphaned, stale `docs/` (C44, C89); repo visitors get website READMEs describing a different product (C62). Meanwhile the two React providers re-implement the same plumbing differently (engine creation, init gating, context memoization, defaults — C46, C19, C54), so even correct docs would have to document two behaviors. Nobody gets the one document that matters: "how changes flow from src to demo to npm." Alternative: one shared `useElasticaEngine` hook to collapse the provider divergence, then a root readme regenerated from the shipped `.d.ts` with a Development section, and website docs shrunk to a pointer.

---

## 5. Expectation gaps

- Expected `npm i` + README to produce a working demo; found a missing-module error (hamo), then a visually broken sim (undocumented absolute-positioning contract), with `key={i}` index keys in the canonical example.
- Expected elastic collisions to conserve momentum; found mass-blind equal velocity kicks plus a global KE rescale that violates it twice.
- Expected restitution to scale the normal bounce; found it multiplying the pair's *total* KE — including tangential and rotational — every substep of contact.
- Expected a circle overlapping a rectangle to be pushed out; found it pulled to the rectangle's midline and trapped.
- Expected dense scenes to be the spatial hash's showcase; found the dense-bucket path silently dropping cross-cell pairs.
- Expected `gridSize` per README to be a cell size in px to increase for big elements; found a cell *count* where increasing it makes big elements broken.
- Expected `setMass` to matter; found it a no-op in AABB mode and a NaN grenade at 0.
- Expected `<CanvasBox mass={5}>` to set mass; found it writes a Map entry nobody reads until the world resets.
- Expected removing one DOM box to remove one body; found every other body teleports into its neighbor's state.
- Expected `collisions: false` to only disable collisions; found it also freezes all rotation.
- Expected `substeps` to refine accuracy; found it changes spin magnitudes and contact energy loss — and DOM mode silently drops it while canvas honors it but won't react to changes.
- Expected the "Engine Only" README example to run; found a nonexistent method and a sim that silently does nothing.
- Expected "frame-rate independent" to include a safe accumulator; found an infinite loop for dt ≤ 0 and an undocumented 4-step cap.
- Expected `useCanvasElastica().elastica` to be an engine (the type says so); found `null` on first render behind a `!` assertion.
- Expected `ref.current.pause()` per README on React 18; found `ref.current === null` plus a console warning.
- Expected `'use client'` library components importable from a server component; found the directive stripped from the bundle.
- Expected `showHashGrid` to show the hash grid; found (DOM) a viewport-sized overlay unrelated to the actual cells unless the sim is full-screen.
- Expected pausing to exist in both modes; found play/pause in DOM only.
- Expected object pooling per docs; found the corners pool drains permanently and every SAT projection allocates.
- Expected the "200+ particles" canvas path to be allocation-light; found ~5 allocations per particle per frame.
- Expected `useJavascriptEnable` to detect JavaScript availability; found a tab-visibility flag that gates nothing.
- Expected `hasBounced(i)` to ask; found it counts.
- Expected the engine to be renderer-agnostic; found `dataset.state` parsing in the core.
- Expected the demo site to import the library like a consumer or a workspace; found a tsconfig alias to a committed minified bundle + hand-written types.
- Expected `lib/utils/elastica.d.ts` to be generated; found it hand-maintained and already lying about nullability.
- Expected CI because workflows exist; found them in a directory GitHub never reads.
- Expected pre-commit checks because husky AND two lefthook configs exist; found all three dead and the tools uninstalled.
- Expected `bun run dev:react` to start something; found a vite invocation with no vite anywhere.
- Expected one license; found ISC (npm) vs MIT (readme, website) vs no LICENSE file.
- Expected the website's README to describe the website; found Satus's README with commands that don't exist here.
- Expected dev tools off in prod; found the FPS meter defaulting ON and a Cmd+O palette live for all visitors.
- Expected one hamo; found two (scoped 0.6.46 for the library, 1.0.0-dev.7 for the site).
- Expected `npm i` to give a stable release; found `1.0.0-dev` published as `latest`.
- Expected `initalConditionsPresets` to be a typo I could avoid; found it's the only spelling exported.
- Expected tests for a physics engine; found two string/math utility tests for the website and nothing for collisions.

---

## 6. Open questions for the maintainer

1. Is the non-conservative resolver (C4/C21) a deliberate aesthetic choice for DVD-screensaver-style motion ("looks bouncy, never explodes"), with the physics vocabulary (mass, restitution, KE) intended as flavor rather than contract? The fix direction differs completely: rewrite the solver vs rewrite the docs and rename the knobs.
2. Is the circle-inside-rect inward normal (C2) intentional "swallowing" behavior for some demo, or a sign bug? The in-code comment contradicts the implementation, suggesting bug.
3. Is `useOBB: true` really the intended default (engine constructor) while the README says false — which is the product decision (C12)?
4. Are dynamic element lists (add/remove mid-run) in scope for v1? This decides whether C5/C14/C26/C42 warrant a body-handle API or just documentation ("re-init is the only mutation path"). Relatedly: should `initialCondition` re-runs randomize (current) or is a `preservePositions` re-init contemplated?
5. `containerOffsets`' fraction-of-container units and the +1 bottom/right convention (C82) — locked-in public behavior (shipped but documented nowhere) or free to change to symmetric px/fraction insets?
6. Is the committed `dist/` meant to track every src commit (then: CI drift guard) or only releases (then: document that dist is release-only)? Related: was it committed only to feed the website, or for npm-install-from-git (C6/C60)?
7. The dead `vectorPool` and the exported `cornersPool`/`axesPool` (C77/C40) — is external pool access a supported API, or leftover surface to prune?
8. The accumulator's hardcoded 4-step cap — chosen empirically? Should it scale with `substeps` (4 steps × 4 substeps = 16 integrations on a hitch frame is a real spike)?
9. Is React 18 support real (peer range) or is React 19 assumed (ref-as-prop, @types/react ^19)? One of the two must change (C18).
10. Is hamo meant to stay a peer (org-standard shared dep) or should the published package own it? Its `optional: true` flag looks like a publish-workflow workaround rather than a decision (C1).
11. Was per-element mass/restitution/shape in DOM mode (the README's BoundaryBox example, C10) planned API that was cut, or doc fiction? If planned, `ElementData` already has a `shape` field waiting to be wired (C20).
12. Is `dvdScreenSaverOBB` intentionally identical to `dvdScreenSaver` (the engine integrates rotation itself), i.e., should it be deleted (C81)?
13. Who consumes the exported `HashGrid`/`isEmptyArray`/`useJavascriptEnable` utilities (C88) — internal website only? If so they should not be public API.
14. Is `github.com/darkroomengineering/elastica` real (rename pending?) or should package.json/footer point at `elastic-collisions`? Which name wins going forward (C29/C68)?
15. Is the license MIT (readme) or ISC (npm metadata)? A LICENSE file is needed either way (C29).
16. Was publishing `1.0.0-dev` under the `latest` dist-tag intentional (soft launch) or a missed `--tag dev` (C60/C90)?
17. Is the always-on stats-gl FPS meter on the production demo intentional showcase or Satus leftover (C64)?
18. Why are Example2 (Gravity) and Example5 (Text) disabled — broken against the current engine, unfinished, or curation (C67)?
19. Is the website ever meant to run standalone (its Satus heritage suggests yes)? That decides whether the `../dist` alias is acceptable at all (C6).
20. Should packages/engine and packages/react eventually publish separately (the react wrapper's peer-dependency on the engine implies that design), or is single-package `@darkroom.engineering/elastica` + `/react` subpath the final shape (C68, design tension 4)?
