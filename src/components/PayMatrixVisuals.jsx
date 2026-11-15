import {
  FiSmartphone, FiShield, FiLock, FiCpu, FiDatabase, FiFileText, FiCheck,
  FiDivide, FiRepeat, FiWifiOff, FiRadio, FiEyeOff, FiCheckCircle,
} from 'react-icons/fi';
import { Reveal, CountUp } from './Reveal/Reveal';

/* Visual case-study body for paymatrix: numbers, one worked example, one flow,
   and icon tiles. Replaces the paragraph-heavy sections on this page only. */

const stats = [
  { n: 427, label: 'commits' },
  { n: 56, label: 'DB migrations' },
  { n: 117, label: 'test files' },
  { n: 3, label: 'languages · EN HI GU' },
];

const split = [
  { who: 'You', paise: 3334, bot: 0 },
  { who: 'Riya', paise: 3334, bot: 2 },
  { who: 'Kabir', paise: 3333, bot: 1 },
];
const rupees = (p) => `₹${(p / 100).toFixed(2)}`;

const flow = [
  { Icon: FiSmartphone, label: 'Tap' },
  { Icon: FiShield, label: 'Verify' },
  { Icon: FiLock, label: 'Lock group' },
  { Icon: FiCpu, label: 'Recompute' },
  { Icon: FiDatabase, label: 'Write' },
  { Icon: FiFileText, label: 'Audit log' },
];

const tiles = [
  { Icon: FiDivide, label: 'Exact to the paisa' },
  { Icon: FiRepeat, label: 'Retry-safe' },
  { Icon: FiWifiOff, label: 'Works offline' },
  { Icon: FiRadio, label: 'Live groups' },
  { Icon: FiEyeOff, label: 'Bill photos never stored' },
  { Icon: FiCheckCircle, label: 'You confirm payment' },
];

const label = 'font-mono text-[11px] tracking-[.18em] uppercase text-text-dim';

export default function PayMatrixVisuals() {
  return (
    <div className="px-[clamp(20px,6vw,96px)] pb-[clamp(48px,6vw,88px)] pt-[clamp(32px,4vw,56px)] space-y-[clamp(56px,7vw,104px)]">
      {/* ── Numbers ── */}
      <Reveal>
        <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-4 border border-border">
          {stats.map((s) => (
            <div key={s.label} className="bg-bg p-6 md:p-8">
              <div className="font-bold text-text-bright" style={{ fontSize: 'clamp(40px,6vw,76px)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                <CountUp target={s.n} />
              </div>
              <div className="mt-3 font-mono text-[10px] tracking-[.14em] uppercase text-text-dim">{s.label}</div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ── One worked example ── */}
      <Reveal>
        <div className={`${label} mb-6`}>Split to the paise</div>
        <div className="rounded-2xl border border-border-strong bg-[#0A0A0B] p-5 sm:p-8">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-bold text-text-bright" style={{ fontSize: 'clamp(32px,5vw,56px)', letterSpacing: '-0.04em' }}>₹100.01</span>
            <span className="font-mono text-[12px] text-text-dim">÷ 3 people</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {split.map((p) => (
              <div key={p.who} className="flex items-center gap-3 rounded-xl border border-border bg-white/[0.02] p-3">
                <img src={`/avatars/voxel-bot-${p.bot}.svg`} alt="" width={48} height={48} loading="lazy" decoding="async" className="h-12 w-12 rounded-full" />
                <div>
                  <div className="text-[13px] text-text-muted">{p.who}</div>
                  <div className="font-bold text-text-bright text-[22px]" style={{ letterSpacing: '-0.02em' }}>{rupees(p.paise)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 font-mono text-[12px] text-text">
            <FiCheck aria-hidden="true" />
            <span>33.34 + 33.34 + 33.33 = 100.01 — never a paisa lost</span>
          </div>
        </div>
      </Reveal>

      {/* ── One flow ── */}
      <Reveal>
        <div className={`${label} mb-6`}>Every change, one transaction</div>
        <ol className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-6">
          {flow.map(({ Icon, label: l }, i) => (
            <li key={l} className="relative flex flex-col items-center gap-3 rounded-xl border border-border-strong bg-white/[0.02] px-3 py-6 text-center">
              <span className="absolute left-3 top-2 font-mono text-[10px] text-text-dim">{String(i + 1).padStart(2, '0')}</span>
              <Icon className="text-[26px] text-text" aria-hidden="true" />
              <span className="text-[13px] font-medium text-text">{l}</span>
            </li>
          ))}
        </ol>
      </Reveal>

      {/* ── Guarantees ── */}
      <Reveal>
        <div className={`${label} mb-6`}>Built-in guarantees</div>
        <ul className="m-0 grid list-none grid-cols-2 gap-px bg-border p-0 border border-border md:grid-cols-3">
          {tiles.map(({ Icon, label: l }) => (
            <li key={l} className="flex items-center gap-4 bg-bg p-5 sm:p-7">
              <Icon className="shrink-0 text-[24px] text-text" aria-hidden="true" />
              <span className="text-[14px] font-medium text-text sm:text-[16px]">{l}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}
