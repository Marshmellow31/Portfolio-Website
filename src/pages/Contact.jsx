import { motion } from 'framer-motion';
import { Reveal } from '../components/Reveal/Reveal';
import Folder from '../components/Folder/Folder';
import CopyButton from '../components/CopyButton';
import { FaGithub, FaLinkedin, FaInstagram } from 'react-icons/fa';

const socialLinks = [
  { icon: <FaGithub size={22} color="#111" />, href: 'https://github.com/Marshmellow31', label: 'GitHub' },
  { icon: <FaLinkedin size={22} color="#111" />, href: 'https://linkedin.com/in/harshil-patel-5a7373333', label: 'LinkedIn' },
  { icon: <FaInstagram size={22} color="#111" />, href: 'https://www.instagram.com/harshil_3105_/', label: 'Instagram' },
];

const paperItems = socialLinks.map(s => (
  <a
    href={s.href}
    target="_blank"
    rel="noreferrer"
    aria-label={s.label}
    onClick={e => e.stopPropagation()}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
  >
    {s.icon}
  </a>
));

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col justify-center pt-20">
      <section
        className="w-full"
        style={{ padding: 'clamp(100px,12vw,180px) clamp(20px,6vw,96px)' }}
      >
        {/* Two-column grid — collapses to single column below lg */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* ── Left: text content ── */}
          <Reveal>
            <div className="mono-label mb-7">Contact</div>
            <h1
              className="m-0 mb-6 font-bold text-text-bright"
              style={{
                fontSize: 'clamp(48px,6vw,100px)',
                letterSpacing: '-0.045em',
                lineHeight: 0.92,
              }}
            >
              LET'S BUILD<br />SOMETHING
            </h1>
            <p
              className="m-0 text-text-muted max-w-lg mb-12"
              style={{ fontSize: 'clamp(16px,1.4vw,20px)', lineHeight: 1.6 }}
            >
              Open to select freelance opportunities, full-time roles, and interesting conversations.
            </p>
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              <a
                href="mailto:1080patelharshil@gmail.com"
                className="block text-text-bright no-underline break-words hover:underline"
                style={{
                  fontSize: 'clamp(20px,3vw,52px)',
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.05,
                  textDecorationThickness: '2px',
                  textUnderlineOffset: '8px',
                }}
              >
                1080patelharshil@gmail.com
              </a>
              <CopyButton text="1080patelharshil@gmail.com" />
            </div>
            <div className="flex flex-wrap gap-7 mt-12">
              <a href="https://github.com/Marshmellow31" target="_blank" rel="noreferrer"
                className="font-mono text-[12px] tracking-[.12em] text-text-dim no-underline hover:text-text transition-colors">
                GITHUB ↗
              </a>
              <a href="https://linkedin.com/in/harshil-patel-5a7373333" target="_blank" rel="noreferrer"
                className="font-mono text-[12px] tracking-[.12em] text-text-dim no-underline hover:text-text transition-colors">
                LINKEDIN ↗
              </a>
              <a href="https://www.instagram.com/harshil_3105_/" target="_blank" rel="noreferrer"
                className="font-mono text-[12px] tracking-[.12em] text-text-dim no-underline hover:text-text transition-colors">
                INSTAGRAM ↗
              </a>
              <div className="font-mono text-[12px] tracking-[.12em] text-text-faint">
                BHARUCH, GUJARAT — IN
              </div>
            </div>
          </Reveal>

          {/* ── Right: folder, shown only at lg+ to avoid clipping ── */}
          <div className="hidden lg:flex items-end justify-center" style={{ paddingBottom: '40px', minHeight: '340px', overflow: 'visible' }}>
            <Folder
              color="#d0d0d0"
              size={2.4}
              items={paperItems}
            />
          </div>

        </div>
      </section>
    </div>
  );
}
