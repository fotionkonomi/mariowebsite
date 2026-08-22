# Marios Konomis — portfolio site

A portfolio for a 3D artist. Static site, built with Astro, deployed to Cloudflare Pages.

**Read this before changing anything.** It explains not just how the site works but
*why* it was built this way, so the reasoning survives even if none of the code does.

---

## The one rule everything else follows

**Content is separated from code.** Publishing new work never requires touching a
layout, a component, or a stylesheet. If you find yourself editing a `.astro` file
in order to add a project, something has gone wrong — stop and fix the structure
instead.

This exists because Marios maintains the site himself, with an AI agent, and he is
not a developer. He must be able to read a change and understand it without reading
code. A diff that adds a project should look like a sentence he would say out loud.

---

## Adding a new project

Three steps. Nothing else.

1. Make a folder in `src/content/projects/`. **The folder name becomes the URL**:
   `src/content/projects/temple-of-apollo/` → `/work/temple-of-apollo`
2. Put the renders in that folder. Full resolution, straight out of the render —
   do **not** resize or compress them by hand. The build does that.
3. Create `index.md` in the folder:

```markdown
---
title: "Temple of Apollo"
year: 2026
order: 2                 # lower numbers appear first on the home page
summary: "One or two sentences. Shown under the title in the grid."
hero: "./final-render.jpg"     # the single image representing this project
animations:                    # optional — looping turntables (see below)
  - "./turntable.webp"
images:                        # everything else, in the order it should appear
  - "./wireframe.jpg"
  - "./clay-pass.jpg"
software:                      # optional
  - "3ds Max"
credits: "Optional collaborator credits"
artstation: "https://www.artstation.com/artwork/xxxxx"   # optional
---

The write-up goes here, in plain Markdown. Use `## Subheadings` if it's long.
```

That's it. The project page, the home-page card, the URL, and the image optimisation
all happen automatically.

**If a field is wrong or missing, the build stops and tells you which file and which
field.** That is deliberate — it is far better than silently publishing a broken page.

To hide a project without deleting it, add `draft: true`.

---

## Changing his details

Name, email, location, links, CV, skills, software: **all in `src/site.ts`**, one
file, plain values. Nothing else needs editing.

⚠️ `email` is currently the placeholder `CHANGE-ME@example.com`. Replace it before
going live.

To add the CV: put the PDF at `public/cv.pdf`, then set `cv: '/cv.pdf'` in
`src/site.ts`. While `cv` is `null` no CV link appears anywhere — nothing breaks.

## The design language — "night at the museum"

The site is a dark vitrine: the artwork is the light source. All styling lives in
**`src/styles/global.css`**, tokens at the top:

- `--void` warm basalt dark (never pure black), `--bone` marble-white text,
  `--bronze` the single accent — deliberately the colour of the Derveni Krater
  itself. Do not add more accent colours.
- Three type voices, each with a job: **Archivo** (variable width, used expanded)
  for monumental headlines; **Cinzel** for carved "inscription" text;
  **Hanken Grotesk** for body text. Fonts are self-hosted via @fontsource.
- **The home hero is the one deliberate exception**: it is set in Cinzel 400
  with wide tracking (`.stage-name`), not the Archivo monument voice, because
  Archivo 800 at 125% width read as a poster rather than a plaque. It is the
  artist's name — it should feel chiselled, not shouted. Note the
  `text-indent` matching the `letter-spacing` on both lines: tracking adds a
  trailing gap after the last character, which shifts centred text visually
  off-axis, and the indent puts it back.
- Careful with `.stage-intro p` selectors: the carve eyebrow is a `<p>` too.
  Both the colour rule and the pinned `display: none` need `:not(.carve)`, or
  the location line silently vanishes and loses its bronze.
- Roman numerals (`src/lib/roman.ts`) appear as engraved ghost numerals on the
  work plates — ornament that encodes the year.

**The signature element is the stage on the home page**
(`src/components/Stage.astro`). The krater sits centre-stage and rotates
ambiently; scrolling slides it left, brings the projects in from the right, and
from then on the page does not scroll at all — the projects pan up inside a
fixed rail, looping forever.

Two counters drive all of it:

- **`acc`** — how far in you are, in units. `0` = krater centred and
  auto-rotating. `0→1` = it travels left while the rail arrives. Above `1`, each
  whole unit advances one project. Floored at zero, never capped above, which is
  what makes the unwind symmetric: N passes down costs exactly N passes up
  (verified: 88 notches down took 88 notches to reverse).
- **`spin`** — tracks the **signed** change in `acc`, so the krater turns one
  way as you scroll down and the opposite way as you scroll back up. One full
  40-frame revolution per project, so the rotation *is* the progress bar.

The rail renders the project list **twice**. At the wrap point both copies show
identical content, so jumping from the last project back to the first is
invisible. Do not remove the clone.

`paint()` is a plain DOM write and is called from the loop *and* directly on
input. That is deliberate: if `--enter` is ever undefined, `var()` invalidates
the whole `transform` declaration and it collapses to `none`, so the vars must
be set before the first frame and must not depend on rAF running. Background
tabs and low-power mode throttle rAF to zero.

**The krater has no circle, no border, no clipping — and no colour grading.**
There is deliberately **no `filter`** on it: an earlier version used
`contrast()/brightness()` to sink the frames' mid-grey studio backdrop, and it
made the bronze read as too dark. Do not reintroduce it.

The backdrop is removed by mask shape alone. The object was measured across
several rotations as spanning **x 19%–78%** and **y 1%–99.7%** — it touches top
and bottom but leaves ~19% of bare backdrop on each side. So the mask is an
ellipse with a 50% x-radius (opaque to 60%, giving 30% of solid coverage where
the object needs 29.5%) and an 82% y-radius, which stays opaque through the
vertical centre so the handles and foot are never clipped, while the left and
right edges and all four corners fall past the gradient and dissolve entirely.
A symmetric radial mask would decapitate the handles; a rectangular feather
leaves visible box edges. Behind it sits a soft two-layer pool of light so any
surviving grey reads as a lit vitrine rather than the edge of a rectangle.

To regenerate the frames (or add a turntable for another project):

```
node -e "import('sharp').then(async ({default:sharp}) => {
  const src='src/content/projects/<slug>/<file>.webp';
  const m=await sharp(src).metadata();
  for(let i=0;i<m.pages;i++) await sharp(src,{page:i}).webp({quality:74})
    .toFile(\`public/turn/<slug>/f\${String(i).padStart(2,'0')}.webp\`);
})"
```

**Entered framing.** Once the krater has travelled left it is scaled to **250%**
with its centre on the left viewport edge, so exactly half of it bleeds off the
left. `-50vw` is what puts the centre at `x: 0`; `scale()` expands about the
centre, so that framing holds at any scale. It is then nudged **7% right and
7% down**, measured against the krater at its *enlarged* size, which brings the
visible fraction to **57%**. (15% was tried first and read as too far right and
too low.)

`--nudge-x` / `--nudge-y` are **17.5%**, not 7%, because `translate()`
percentages resolve against the *unscaled* box: 7% of the enlarged size is
7% x 2.5. Keeping them as percentages rather than px or vw means the offset
stays proportional to the krater at every viewport size. Translations all
contribute additively to the final centre and `scale()` contributes none, so the
order among the translate steps does not matter.

Verified at 1440x900: enlarged 1395px, centre moved exactly 98px right and 98px
down (7% of 1395), fraction visible 0.570, at-rest state untouched, and fully
reversible back to centre. Note the frames are natively **702px**, so at this size they are
upscaled ~2x and are visibly soft — that is a source-resolution limit, not a
bug, and 702 is the largest ArtStation serves for that asset.

At this scale the krater can reach under the rail — zero overlap at 1440px wide
with the 7% nudge, but 246px at 980px, and it grows quickly if the nudge or the
scale is increased — so the rail sits **above** it (z-index 3 vs 2) and a
scrim on `.stage-rail::before` sits **behind the panels** (z-index 0 vs the
track's 1). It darkens the krater passing through without dimming the panel
text, and the krater appears to dissolve into the rail's left edge. Increase the
scale or the nudge further and this scrim is what keeps the copy legible.

**Hover preview.** Hovering a project's thumbnail fades a heavily blurred copy
of that project's hero in behind the card, at **25%** opacity, filling the whole
`.panel`. Four things make it work:

- The trigger is `.panel-media:hover ~ .panel-preview`, a **sibling** selector,
  so the *thumbnail* is the trigger — not the panel, which in pinned mode is a
  full `100svh` tall and would fire the moment the pointer entered the rail.
  This requires the preview `<img>` to stay immediately **after** `.panel-media`
  in the DOM; move it and the selector silently stops matching.
- `.panel` is `position: relative` (containing block) and `overflow: hidden`,
  and the preview is `scale(1.14)` so the blur's feathered edges land outside
  the panel rather than reading as a vignette frame. Content sits at
  `z-index: 1`, the preview at `0`.
- The preview is only **420px wide**, with `loading="eager" fetchpriority="low"`.
  Cover-fitting it into the panel resamples it roughly **5x**, which the blur
  hides. That is the constraint to watch: at the current **12px** blur it is
  invisible, but drop below roughly **8px** and the low-resolution source starts
  to show, at which point the width needs raising too. Eager because a lazy
  transparent image can be deferred and would then be missing on first hover;
  low priority so it never competes with the hero images. Total cost is
  **107KB over 8 requests** (the duplicated clone panels reuse the same URLs).

- At 25% the wash lifts the local background enough to eat into the secondary
  text. Measured over the region where `.panel-body` sits, `.panel-sum` on
  `--ash` fell to **3.63:1** on the brightest hero (the Stoa), under the 4.5:1
  floor, and five of eight projects failed. The fix brightens the text **with**
  the wash rather than dimming the wash: `.panel-sum` mixes toward `--bone` and
  `.panel-num` goes to `--bronze-hot` on hover, which restores the worst case to
  **10.19:1** and **6.58:1** and reads as the card lighting up. If the opacity is
  raised again, re-check these two — the script for it is a `sharp` cover-resize
  of each hero, sampled over the text region, composited over `--void`.

Opacity and blur are one value each if they want tuning, but note two couplings:
opacity to the hover text colours above, and blur to the preview's 420px width.

Contrast was re-verified after the blur came down, using the 95th-percentile
brightness of the text region rather than its mean (less blur means bright spots
are no longer smoothed away): worst case **8.40:1** for the summary and
**5.42:1** for the label. Both still pass.

**Hover (the subtitle track).** Hovering a project does three things at once,
all driven from `initHover()` in `Stage.astro`:

- **The wash cycles.** `.panel-wash` holds up to four frames — the hero plus
  three of the project's own images — and steps through them every **2s**. The
  frames are stacked and crossfaded via an `is-on` class, so nothing is fetched
  mid-animation. Frame 0 is eager (instant first hover); the rest are lazy and
  the handler promotes them on enter, well before the first swap. Verified
  timing: 1998 / 1999 / 2001 ms.
- **The write-up plays as subtitles**, one line at a time. Every line is in the
  DOM with only the active one shown, so the crossfade is pure CSS and nothing
  is parsed at runtime. The lines are absolutely stacked with a reserved
  `min-height`, so the block never reflows as sentences of different length
  replace each other.
- **Dwell is derived from length**, not fixed: `1000ms + 46ms per character`,
  clamped to 2.4–5.4s. Note `textContent` is **trimmed** first — the template
  indents it, and the raw string was inflating every dwell by about 700ms.

`src/lib/excerpt.ts` builds the track, and two decisions there matter:

- **Leading filler is dropped.** The write-ups open with throat-clearing
  ("After a while, it's finally time to update my portfolio", "This project was
  made as part of a college exercise") and the first subtitle is the one
  everybody reads. Everything from the first substantial sentence onward is kept
  in original order, so it still reads as the artist wrote it.
- **Long sentences are chunked at ~112 chars**, preferring clause breaks. This
  is not cosmetic: the Stoa's opening sentence is 186 characters, which at a
  comfortable ~15 chars/sec needs about 12 seconds on screen — long enough that
  the next line never arrives. Chunking lands every line at 17–21 chars/sec.

Blur is **8px** and opacity **0.30**. Because the wash now cycles through
different images, contrast was re-verified across **all 28 wash frames**, not
just the heroes: worst summary **6.96:1**, worst label **5.12:1**. The label
needed lifting past plain `--bronze-hot` to get there — one frame of
unreal-archviz put it at 4.49:1, a hair under the floor. Raise the opacity
again and this needs re-running.

The hover trigger is `.panel-plate:hover`, with `.panel-wash`, `.panel-body`
and `.panel-wall` all targeted as **following siblings** of it. Reordering
those children silently breaks all three at once.

The rail is **58vw**, which still clears the krater's bronze by 117px at 1440 —
the object ends at 78% of its frame, so the rail only overlaps the dark
feathered surround. The rail's edge fade is 8%, down from 14%, which had been
dimming the wall text.

**The panel is a 3-row grid** (`auto auto 1fr`) — plate, caption, gap. The gap
is a `1fr` row rather than a reserved pixel value, because when both were
centred a long title (the Stoa wraps to three lines) pushed the caption into
the wall text. Letting the browser distribute what is left means they cannot
collide.

**Removed, deliberately:** the popping supporting-view plates (cut in favour of
the cycling wash — if they return, the positions must compose at 0, 1, 2 and 3
images, because river-shrine has no extras at all), and all availability
messaging on Contact — first the chip, then the sentence itself. The `.avail`
styles and the `live-pulse` keyframe went with the chip rather than being left
as dead CSS, and the page's meta description was updated too, so search results
do not still claim what the page no longer says. The About page keeps its own
"Based in Athens, Greece. Available for freelance and full-time work." line;
`site.availability` is still used there.

**The pinned stage is opt-in.** Everything in the CSS is written as a plain
vertical stack that scrolls natively; JS adds `data-stage-ready` to `<html>`
only on a wide viewport with a fine pointer and motion allowed, and every pinned
rule is scoped under that attribute. No JS, a phone, or reduced-motion therefore
gets a normal scrolling page rather than a frozen one. The `MediaQueryList`
objects that watch for changes **must stay referenced** in module scope — an
unreferenced one gets garbage-collected and silently stops firing, which once
left the pinned stage running at phone width.

**Cursor.** State lives in module scope, never on `body.dataset`, because
`<ClientRouter />` replaces `<body>` on navigation. Every init cancels the prior
rAF loop and listener, and init re-runs on `astro:page-load`. The native pointer
is hidden only once the custom one is confirmed running
(`html[data-cursor="live"]`), so a script failure can never leave the page with
no visible cursor.

Ambient rotation of the krater at rest is `AUTO_MS` — one frame per **200ms**,
so about 8 seconds for a full turn. Scroll-driven rotation is separate and
unaffected (one revolution per project).

Motion rules: scroll-reveals (`.rv`), marquees, film grain, the cursor, and the
hover wash/subtitle cycling are all switched off by `prefers-reduced-motion`,
which must stay true for anything added later.

---

## Rules that matter

**Images go in `src/`, never in `public/`.** Anything in `public/` is served exactly
as uploaded, with *no optimisation*. Marios's renders are up to 3840px wide and
several megabytes; unoptimised they would make the site unusable on a phone. Files
under `src/` get converted to WebP at multiple sizes automatically. This is the main
reason the project uses Astro at all — do not undo it.

**Animated files go in `animations`, not `images`.** Anything in `images` is resized
and re-encoded. Animated WebP survives that, but gains nothing from it — one test
file came out *larger* than the original and cost a second of build time per size.
Files in `animations` are served byte-for-byte untouched.

**Never commit source 3D files.** No `.fbx`, `.blend`, `.max`, `.ztl`, `.3dm`. They
are large binaries and git keeps them forever, even after deletion — the repo would
grow permanently with every revision of every model. `.gitignore` already blocks
them. Only web-ready output belongs here.

**Contact is a `mailto:` link, never a form.** A form needs a backend service,
attracts spam, and fails silently — and nobody notices a broken contact form until
they have already missed the message that mattered.

**The grid crops, the project page never does.** Home-page thumbnails are cropped to
one uniform shape so the grid reads as curated rather than as a dump of files. On
project pages images appear uncropped, at full width. Every image sits on a light
neutral tile so that dark renders don't read as holes punched in a white page.

---

## Commands

```
npm run dev      # local preview at http://localhost:4321, updates as you save
npm run build    # produce the deployable site in dist/
npm run preview  # serve the built site exactly as it will be deployed
```

`npm run dev` is the one to use while editing. Look at the browser, not the code.

---

## Publishing

Cloudflare Pages watches the git repository and rebuilds on every push.

- Build command: `npm run build`
- Output directory: `dist`

The agent should commit and push as part of "publish this", with a message describing
the change in plain language. Marios never needs to type a git command — but the
history is his undo. "Put the gallery back how it was before Tuesday" is a request
that only works because every change is a commit.

A broken local build **cannot** take the live site down: the deployed site is static
files already sitting on Cloudflare's servers. That is worth remembering before
panicking.

---

## Deliberately not here

Things that were considered and rejected. Don't add them without a reason that beats
the original one.

- **A CMS.** Adds a database, auth, hosting that runs software, and a permanent
  maintenance burden — to solve a problem that editing one text file already solves.
- **A contact form.** See above.
- **Real-time 3D models in the browser.** Marios works in 3ds Max and exports FBX.
  Converting a render-quality FBX to a web-ready GLB is not a file conversion — it's
  retopology, baking and PBR material rebuilding, i.e. a skilled art task. An
  automated conversion produces a flat grey approximation, which next to his actual
  renders would actively damage the portfolio. **Turntables solve the same problem
  properly**: they're a render, which is a thing he is already expert at, at full
  quality. Three already exist and are on the site.
- **A framework heavier than Astro.** No routing, SSR or client-side framework is
  needed. Every page is static HTML. The only client JS is the turntable viewer,
  the cursor, the clock and the scroll reveals — all small, dependency-free and
  progressive (the site works fully with JS off).
- **A light "white cube" gallery look.** Built first, replaced on request with the
  current dark museum design — Mario wanted interactive, full of life, WOW. The
  dark direction also suits the work: bronze and spotlit renders glow on dark.
- **A statement band, a CTA section and a footer on the home page.** The home
  page is the loop and has nothing below it, by decision. The email lives on
  /contact, reachable from the nav, which is always fixed and clickable — along
  with the Home key, that is the only way out of a deep scroll accumulator.
- **A grid of project cards on the home page.** Superseded by the panning rail.

---

## Status / to do

- [ ] Replace the placeholder email in `src/site.ts`
- [ ] Add `public/cv.pdf` and set `cv` in `src/site.ts`
- [ ] Have Marios approve the About page copy — it was drafted from his ArtStation
      project descriptions and skill list, not written by him
- [ ] Fill in `software:` for the projects that don't list it (only the ones where he
      stated it are filled in; the rest were left empty rather than guessed)
- [ ] Register a domain and point it at the Cloudflare Pages project
