import galleryImages from '../data/gallery-images.json';

/* Screenshots from a project's `images` array — the plain files under public/,
   as opposed to the designed case-study frames that <CaseImage> renders.
 *
 * The manifest (`npm run images:gallery`) supplies intrinsic dimensions so the
 * browser can reserve the box before the bytes land, and a srcset wherever the
 * source is wider than the slot it actually renders into. Sources with no
 * manifest entry degrade to a plain <img>, so adding a screenshot without
 * re-running the script still works — it just misses the optimisation. */
export default function GalleryImage({
  src,
  alt,
  sizes = '(min-width: 768px) 46vw, 92vw',
  priority = false,
  className = '',
  ...rest
}) {
  const meta = galleryImages[src];
  /* The original is the widest candidate, so it stays in the set for large
     viewports; the generated variants cover everything below it. */
  const srcSet = meta?.srcset?.length
    ? [...meta.srcset.map((v) => `${v.file} ${v.w}w`), `${src} ${meta.w}w`].join(', ')
    : undefined;

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={meta?.w}
      height={meta?.h}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      {...rest}
    />
  );
}
