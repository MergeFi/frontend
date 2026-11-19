/**
 * Deterministic, locally generated identicon used as the avatar fallback
 * (#929). Replaces the api.dicebear.com fallback, which required
 * `images.dangerouslyAllowSVG` for the whole image pipeline, put a
 * third-party request on every profile/bounty card, and sent each viewed
 * contributor's handle to that third party as a URL parameter.
 *
 * Returns a `data:` URI, so it renders without any network request and
 * without going through the Next.js image optimizer.
 */

const GRID = 5;

/** 32-bit FNV-1a: tiny, stable across runtimes, good enough to pick a pattern. */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

export function identiconSvg(seed: string): string {
  const hash = hashSeed(seed);
  const hue = (hash >>> 16) % 360;
  const half = Math.ceil(GRID / 2);

  const cells: string[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < half; col++) {
      if (((hash >>> (row * half + col)) & 1) === 0) continue;
      cells.push(`<rect x="${col}" y="${row}" width="1" height="1"/>`);
      const mirror = GRID - 1 - col;
      if (mirror !== col) {
        cells.push(`<rect x="${mirror}" y="${row}" width="1" height="1"/>`);
      }
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 ${GRID + 2} ${GRID + 2}">` +
    `<rect x="-1" y="-1" width="${GRID + 2}" height="${GRID + 2}" fill="hsl(${hue},40%,92%)"/>` +
    `<g fill="hsl(${hue},55%,45%)">${cells.join("")}</g>` +
    `</svg>`
  );
}

export function identiconDataUri(seed: string): string {
  return `data:image/svg+xml,${encodeURIComponent(identiconSvg(seed))}`;
}
