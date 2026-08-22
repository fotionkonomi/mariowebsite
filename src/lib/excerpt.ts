/* Turns a project's write-up into a short subtitle track for the hover state.

   Deliberately not just "the first N sentences": several write-ups open with
   housekeeping ("After a while, it's finally time to update my portfolio") and
   close with credits and thank-yous. Fragments shorter than MIN read as noise
   on screen, so they are dropped. */
const MIN_CHARS = 45;
const MAX_LINES = 6;
/* A subtitle nobody can finish reading is worse than no subtitle. Comfortable
   reading is roughly 15 characters a second, so a 186-character sentence — and
   the write-ups have several — would need about 12 seconds on screen, long
   enough that the next line never arrives. Real subtitles are chunks, not
   sentences, so long sentences get split at clause boundaries. */
const CHUNK_CHARS = 112;

function flatten(body: string): string {
  return body
    .replace(/^#{1,6}\s+.*$/gm, '')            // headings
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')   // links -> their text
    .replace(/https?:\/\/\S+/g, '')            // bare urls
    .replace(/[*_`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Break one sentence into subtitle-sized pieces, preferring clause breaks
   (comma, semicolon, colon, dash) and falling back to the last word that
   fits. No ellipses: these are continuations, not truncations. */
function chunk(sentence: string): string[] {
  if (sentence.length <= CHUNK_CHARS) return [sentence];
  const out: string[] = [];
  let rest = sentence;
  while (rest.length > CHUNK_CHARS) {
    const window = rest.slice(0, CHUNK_CHARS);
    const clause = Math.max(
      window.lastIndexOf(', '), window.lastIndexOf('; '),
      window.lastIndexOf(': '), window.lastIndexOf(' — '),
    );
    const at = clause > CHUNK_CHARS * 0.45 ? clause + 1 : window.lastIndexOf(' ');
    if (at <= 0) break;
    out.push(rest.slice(0, at).trim());
    rest = rest.slice(at).trim();
  }
  if (rest) out.push(rest);
  return out;
}

/** One sentence per subtitle, played in the order they were written.

    Leading sentences under LEAD_CHARS are dropped: the write-ups tend to open
    with throat-clearing ("After a while, it's finally time to update my
    portfolio", "This project was made as part of a college exercise") and the
    first subtitle is the one everybody actually reads. Everything from the
    first substantial sentence onward is kept in its original order, so the
    track still reads as the artist wrote it. */
const LEAD_CHARS = 70;

export function wallLines(body: string | undefined, fallback: string): string[] {
  if (!body) return [fallback];
  const all = flatten(body)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= MIN_CHARS)
    .filter((s) => !/^special thanks|^hope to share|^hoping to share/i.test(s));

  const start = all.findIndex((s) => s.length >= LEAD_CHARS);
  const from = start < 0 ? 0 : start;
  const lines = all.slice(from).flatMap(chunk).slice(0, MAX_LINES);
  return lines.length ? lines : [fallback];
}
