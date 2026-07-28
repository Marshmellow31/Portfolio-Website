import manifest from '../../data/case-images.json';

/* A case-study frame rendered from the derivatives that
   scripts/optimize-case-images.mjs produced.

   The ratio is declared in two places on purpose: width/height give the
   browser the intrinsic box before any CSS parses, and aspect-ratio holds
   that box once the element is fluid. Both agree with the source file, so
   nothing shifts on load and object-cover never actually has to crop. */
export default function CaseImage({
  id,
  alt,
  ratio,
  sizes = '100vw',
  priority = false,
  className = '',
  /* Caps how wide the frame is allowed to get. Because the ratio is fixed,
     width is the only thing that controls height — so a viewport-height term
     here (e.g. 150vh on a 16:10 frame) is what keeps a big monitor from
     rendering a hero taller than the screen. */
  maxWidth,
}) {
  const entry = manifest[id];
  if (!entry) return null;

  const dir = id.slice(0, id.lastIndexOf('/'));
  const srcSet = (list) => list.map(({ w, file }) => `${dir}/${file} ${w}w`).join(', ');

  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(entry.avif)} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(entry.webp)} sizes={sizes} />
      <img
        src={`${dir}/${entry.png}`}
        alt={alt}
        width={entry.width}
        height={entry.height}
        sizes={sizes}
        loading={priority ? undefined : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
        className={`block w-full h-auto object-cover mx-auto ${className}`}
        style={{ aspectRatio: ratio, maxWidth }}
      />
    </picture>
  );
}
