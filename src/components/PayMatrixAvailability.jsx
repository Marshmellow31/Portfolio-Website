import { FiArrowUpRight, FiGlobe } from 'react-icons/fi';
import { PAYMATRIX_PLAY_STORE_URL, PAYMATRIX_WEB_URL } from '../data/paymatrixLinks.js';

export default function PayMatrixAvailability() {
  return (
    <aside aria-label="Get paymatrix" className="my-7 min-w-0 border-y border-border-strong py-6">
      <p className="m-0 font-mono text-[10px] uppercase tracking-[.14em] text-text-dim">Now on Google Play</p>
      <h2 className="mb-0 mt-3 text-[clamp(22px,2.2vw,30px)] font-semibold leading-tight tracking-[-.03em] text-text-bright">Split the bill. Skip the back-and-forth.</h2>
      <p className="mb-0 mt-2 text-[14px] leading-relaxed text-text-muted">Get paymatrix on Android, or jump straight in on the web.</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <a href={PAYMATRIX_PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center rounded-[4px] no-underline transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          <img src="/brand/google-play-badge.png" alt="Get it on Google Play" width="192" height="74" className="block h-auto w-48" />
        </a>
        <a href={PAYMATRIX_WEB_URL} target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-[4px] bg-text px-5 text-[13px] font-semibold text-bg no-underline transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <FiGlobe className="shrink-0 text-[16px]" aria-hidden="true" />
          Try it now on web
          <FiArrowUpRight className="shrink-0 text-[15px]" aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
}
