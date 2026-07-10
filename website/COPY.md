# Elastica — Copy Bank

Source of truth for site copy. Every claim in here is backed by the engine source
(citations in `packages/engine/src/`). Pull from this instead of reusing the same
paragraph twice — each section of the site should get its own angle.

**Currently used on the site (don't repeat):**
- hero-drop: "THE UNSERIOUS PHYSICS ENGINE" (owns this line — removed from footer)
- pills-escort (01): "Collision as a layout tool." + §4.1 short as standfirst
- int-rollers: §5-derived glyph captions — dom / 2d / 60 / 0.8 / 0 deps / 3×3
- murmur-thief (02): manifesto paragraph, "teleports" fixed to "explodes" (§6)
- flock-section (03 — still your dom): §4.2 (tuned — short + coda; the long
  variant's `--ex`/`--ey` tokens break oddly as flying words)
- footer top-left: "divs with mass." (§3)
- meta description (layout.tsx): §3 one-sentence
- Still unused, reserved: §4.3 solver, §4.4 settling, §4.5 timestep, §4.8 two
  renderers, §4.9 borders, §4.11 trust block — earmarked for a future
  "03 — how it's built" section

---

## 1. Positioning core

**What it is, in one line:**
Elastica is a 2D physics engine that treats your layout as the scene — real DOM
elements become rigid bodies that collide, bounce, and settle, while staying
real DOM.

**The differentiator:** every other web physics library simulates shapes and
draws pictures of them. Elastica moves your actual markup. A word is still a
word while it falls. A button still clicks mid-bounce. Text stays selectable at
rest. Nothing is a screenshot of itself.

**The engineering stance:** stability over accuracy. The solver enforces
"never explodes" beats "physically exact" — a kinetic-energy ceiling means no
formula error can ever inject energy. Piles come to rest on their own, without
a sleep system, because every bounce loses energy and resting contacts are
never re-kicked.

**Audience split:** designers/creative devs care about the DOM story and the
feel; engineers care about the solver guarantees, spatial hashing, fixed
timestep, and zero dependencies. Write to both, separately.

---

## 2. Voice

- Short declaratives. Concrete nouns. The existing hero voice is right — keep it.
- Metaphors must map to a real mechanism. "It never explodes" is good because
  the KE ceiling exists. "Blazing fast" is banned because it maps to nothing.
- Physics vocabulary used casually: mass, momentum, restitution, settle, rest.
- Never say: lightweight, blazing, seamless, powerful, optimal, delightful,
  "perfect for creative coding."
- Numbers beat adjectives: zero dependencies, one draw call, 16.67 ms, 3×3 cells.

---

## 3. The pitch at five lengths

**3 words:** Divs with mass.

**Tagline options (pick per placement, don't reuse):**
- Your layout is the scene.
- Physics for things that were never supposed to move.
- The DOM, with consequences.
- Set the type. Then drop it.
- It moves your markup, not a picture of it.

**One sentence:**
Elastica turns real DOM elements into rigid bodies — words, images, buttons,
the footer — and simulates them at a fixed 60 Hz timestep, tuned for feel and
guaranteed never to explode.

**Short paragraph (~40 words):**
Elastica is a 2D physics engine for the page you already built. Wrap any
element in a boundary box and it acquires mass, velocity, and opinions about
the elements around it. It collides, it settles, and it's still your DOM —
selectable, clickable, accessible — the whole way down.

**Long paragraph (~90 words):**
Most physics engines simulate abstract shapes and hand you coordinates to draw
with. Elastica works the other way around: it starts from your layout. Any DOM
element can be registered as a rigid body — the engine measures its rectangle,
gives it mass and velocity, and from then on moves it with CSS transforms while
the element stays fully alive: text selectable, links clickable, markup
untouched. Underneath, a fixed-timestep solver with spatial hashing and a
kinetic-energy ceiling keeps hundreds of bodies colliding smoothly at any
refresh rate, with one hard rule — energy can be lost, never invented.

---

## 4. Themed blocks — one per site section

Each theme has a **kicker** (section label), a **headline**, a **short** (~25w)
and a **long** (~60w) variant. Mix lengths as layout demands.

### 4.1 The core idea — layout as rigid bodies

- Kicker: `WHAT IT IS`
- Headline: **Anything on the page can fall.**
- Short: Wrap an element in a boundary box and it becomes a rigid body. The
  engine measures it, gives it mass, and lets the rest of the page find out.
- Long: Elastica doesn't render into a canvas and ask you to rebuild your UI
  inside it. It registers the elements you already have — the engine reads each
  one's rectangle, assigns it mass and velocity, and drives it with a single
  CSS transform. Your h1 is now a body. Your footer is now a floor. The layout
  didn't change; it just started obeying different rules.

### 4.2 The DOM story — still real, all the way down

- Kicker: `STILL YOUR DOM`
- Headline: **A word is still a word while it falls.**
- Short: Elastica moves elements with CSS custom properties on a single
  transform — no canvas, no clones. Text stays selectable. Buttons still click.
  Screen readers still read.
- Long: Rendering is four CSS variables — `--ex`, `--ey`, `--er`, `--eds` — on
  one `translate3d`/`rotate` rule injected once per page. That's the whole
  render path. Because the engine never replaces your elements with drawings of
  them, everything they could do before, they can do mid-flight: receive
  clicks, hold selection, keep their place in the accessibility tree. Physics
  as a layer, not a rewrite.

### 4.3 Feel & stability — the solver

- Kicker: `HOW IT'S BUILT`
- Headline: **It would rather lose energy than invent it.**
- Short: The solver follows Newton's restitution law with a hard ceiling: a
  collision can never end with more energy than it started with. Never
  explodes beats physically exact.
- Long: Collision response is Newton's restitution law with guardrails. Impulses
  are split by mass — a light body takes three times the kick of one three times
  heavier, and momentum is conserved to one part in a million. An approach gate
  fires impulses only when bodies are actually closing, so resting contacts are
  never re-kicked into jitter. And a kinetic-energy ceiling scales everything
  back if any contact tries to end hotter than it began. The simulation is
  allowed to be wrong. It is not allowed to blow up.

### 4.4 Settling — rest without a sleep system

- Kicker: `AT REST`
- Headline: **Everything settles. Nothing is told to sleep.**
- Short: There's no sleep threshold. Piles come to rest because every bounce
  loses energy and separating bodies are never re-kicked — calm is a
  consequence, not a state flag.
- Long: Most engines fake rest: below some speed, bodies are frozen and flagged
  asleep. Elastica doesn't need the flag. With restitution under one, every
  bounce dissipates energy; the approach gate guarantees a separating pair
  never receives another impulse. A gravity-pressed pile converges on its own
  to about four hundredths of a pixel of motion per frame — visually still,
  actually still simulating, ready to wake the moment you push it.
- Bonus fact: an `onSettle` callback fires when the whole scene has come to
  rest — and re-arms if you stir it again.

### 4.5 Time — fixed timestep

- Kicker: `ON TIME`
- Headline: **The clock is fixed. Your refresh rate is not its problem.**
- Short: Physics runs on a fixed 16.67 ms step behind an accumulator. Same
  behavior on a 60 Hz office monitor and a 120 Hz phone.
- Long: Elastica steps its world every 16.67 milliseconds, no matter how often
  your display paints. An accumulator banks real elapsed time and spends it in
  fixed steps, so the simulation is identical at 60 Hz, 120 Hz, or whatever
  ProMotion is doing today. Catch-up is capped at four steps per frame — come
  back from a backgrounded tab and the world resumes calmly instead of
  fast-forwarding through everything it missed. Under sustained overload it
  runs slower than wall-clock, by design. Slow is a mood; exploding is a bug.

### 4.6 Collision tech — spatial hashing

- Kicker: `BROADPHASE`
- Headline: **Every body only worries about its neighbors.**
- Short: A spatial hash grid means each body checks the 3×3 cells around it,
  not the whole scene — O(n·k) instead of O(n²).
- Long: The container is cut into a grid; each body is hashed to a cell and
  only tested against the 3×3 neighborhood around it. The grid is
  self-correcting: if bodies grow large relative to the container, cell size
  clamps automatically so nothing can ever slip past the neighborhood check.
  When a cell gets crowded — more than sixteen bodies — the engine switches
  that bucket to sort-and-sweep instead of brute force. You don't tune any of
  this. It just refuses to do quadratic work.

### 4.7 Rotation — AABB and OBB modes

- Kicker: `TWO GEOMETRIES`
- Headline: **Upright, or spinning.**
- Short: AABB mode keeps boxes axis-aligned and cheap. OBB mode adds real
  rotation — separating-axis tests, torque from off-center hits, per-body mass
  and restitution.
- Long: In AABB mode every body is an upright rectangle — the fastest possible
  test, right for UIs that should jostle but not tumble. Switch on OBB mode and
  rectangles rotate: collisions run the separating-axis theorem, off-center
  impacts impart spin, and each body can carry its own mass and bounciness.
  Circles work in both modes, including the hard case — a circle whose center
  ends up inside a rectangle gets expelled through the nearest face, never
  trapped.

### 4.8 Two renderers — DOM and Canvas

- Kicker: `TWO RENDERERS`
- Headline: **DOM until two hundred bodies. Canvas after.**
- Short: DomElastica moves real elements — best under ~200 bodies.
  CanvasElastica batches by style: two hundred identical rectangles cost one
  draw call.
- Long: The same engine drives two renderers. DomElastica is the point — real
  elements, full interactivity — and comfortably handles a couple hundred
  bodies. Past that, CanvasElastica takes over: particles are grouped by shape,
  fill, and stroke, and each group renders in a single batched call. Two
  hundred white rectangles: one draw call. Same solver, same timestep, same
  behavior — you're only choosing what does the painting.

### 4.9 Borders — the edges of the world

- Kicker: `AT THE EDGES`
- Headline: **Walls that bounce, edges that wrap, or no edges at all.**
- Short: Three border modes: rigid (bounce off the container), periodic (exit
  right, re-enter left), or none. Wrapping waits until a body has fully left —
  nothing pops.
- Long: The container can be a room, a torus, or a suggestion. Rigid borders
  reflect velocity and clamp position in the same step — a body that overshoots
  a wall is put back on it before you ever see the overshoot. Periodic borders
  wrap bodies to the far side, but only after the trailing edge has fully
  exited, rotation included, so re-entry never pops into view. Or turn borders
  off and let things leave. Insets let the simulation respect your header.

### 4.10 Control — you own the forces

- Kicker: `YOUR RULES`
- Headline: **The engine resolves. You decide what pushes.**
- Short: Gravity isn't built in — it's one line in your update callback. The
  engine owns collisions and time; forces, flows, and pointer drag are yours.
- Long: Every frame, Elastica hands you the arrays — positions, velocities,
  external forces — and lets you write the rules of your world before it
  resolves the consequences. Gravity is one line. A wind field is three. Pointer
  drag is a preset. This is the division of labor: you define the forces, the
  engine guarantees that whatever you do, collisions stay correct, momentum
  stays conserved, and nothing explodes. Presets (DVD screensaver, drag +
  gravity, flow fields) cover the classics; the callback covers everything else.

### 4.11 Engineering credibility — the trust block

- Kicker: `UNDER THE HOOD`
- Headline: **Zero dependencies. One hard rule.**
- Short: A pure-TypeScript engine with zero runtime dependencies, MIT licensed,
  with a test suite that checks momentum conservation to 1e-6.
- Long: The engine is pure TypeScript with zero runtime dependencies — the
  React bindings are a separate, optional entry point. Hot paths use object
  pools instead of allocating; pair deduplication is a single bitwise key. The
  test suite doesn't test vibes: it asserts momentum conserved to one part in a
  million, exit velocity within 5% of restitution × entry velocity, resting
  contacts producing effectively zero energy after 100 frames, and malformed
  input — zero-size bodies, NaN timesteps, negative mass — refused at the door.

### 4.12 Static bodies — the furniture

- Kicker: `IMMOVABLE`
- Headline: **Some things push back and never move.**
- Short: Mark any element static and it becomes furniture: infinite effective
  mass, zero velocity change, a wall shaped exactly like your layout.
- Long: One attribute — `data-state="static"` — turns an element into an
  immovable body. Static bodies have zero inverse mass: they absorb nothing,
  the dynamic partner takes the full impulse, and their position is re-pinned
  every step. Your nav bar becomes a ceiling. A pull-quote becomes a boulder in
  the stream. The layout itself is the level design.

---

## 5. Micro-copy

**Stat callouts (for a numbers strip / feature grid):**
- `0` runtime dependencies
- `16.67 ms` fixed physics step
- `1` draw call for 200 identical bodies (canvas mode)
- `3×3` cells checked per body, not the whole scene
- `≤ 4` catch-up steps after a backgrounded tab
- `1e-6` momentum conservation tolerance in tests
- `~0.04 px/frame` — what "at rest" measures out to
- `2` renderers · `2` collision modes · `2` shapes

**Captions for demos:**
- "Every word here is a rigid body. Select one anyway."
- "Static bodies: the headline is furniture."
- "Periodic borders — off the right edge, back on the left. No pop."
- "OBB mode: hit it off-center and it spins."
- "This pile isn't asleep. It's just out of energy."
- "Drag one. Momentum does the rest."
- "Backgrounded the tab? The world waited."

**CTA / button labels:**
- "Drop something" · "Break the layout" · "npm i physics" ·
  "Read the source" · "Start colliding"

**Section kickers (numbered-label style, matching `02 — HOW IT FEELS`):**
`WHAT IT IS` · `STILL YOUR DOM` · `HOW IT'S BUILT` · `AT REST` · `ON TIME` ·
`BROADPHASE` · `TWO GEOMETRIES` · `AT THE EDGES` · `YOUR RULES` ·
`UNDER THE HOOD`

---

## 6. Claims audit — fix before shipping

**"And it never, ever teleports." (murmur-thief hero) — overclaims.**
The engine has no continuous collision detection; a body moving more than its
own width per step can tunnel. What IS true: border overshoot is clamped in the
same step, periodic wrap never pops into view, and overlap is drained smoothly.
Truthful replacements, same rhythm:
- "And it never, ever explodes." ← strongest; backed verbatim by the KE ceiling.
- "And nothing ever pops into place."
- "And when it hits a wall, it's already back inside."

**Flock-panel paragraph — replace entirely.** "Lightweight… optimal
performance… smooth animations… perfect for creative coding" is the generic
copy this document exists to kill. Use §3 long paragraph or §4.6/§4.10 there.

**Don't claim:** friction (not modeled), springs/joints (none), arbitrary
polygons (rects + circles only), Web Worker/off-main-thread (main thread only),
mass from element size (uniform unless set), built-in gravity (user-applied),
deterministic replay (no seeded RNG). "60 fps" is fine colloquially, but the
precise claim is a fixed 60 Hz timestep independent of display refresh.
