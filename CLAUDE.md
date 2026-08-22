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
  for monumental headlines; **Cinzel** for small carved "inscription" labels;
  **Hanken Grotesk** for body text. Fonts are self-hosted via @fontsource.
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

Motion rules: scroll-reveals (`.rv`), marquees, film grain and the cursor are all
switched off by `prefers-reduced-motion`, which must stay true for anything
added later.

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
