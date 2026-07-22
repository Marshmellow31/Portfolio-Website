import { useState } from 'react';
import { Reveal } from '../components/Reveal/Reveal';
import Folder from '../components/Folder/Folder';
import CopyButton from '../components/CopyButton';
import { FaGithub, FaLinkedin, FaInstagram } from 'react-icons/fa';
import useSEO from '../utils/useSEO';

const socialLinks = [
  { icon: <FaGithub size={22} color="#111" />, href: 'https://github.com/Marshmellow31', label: 'GitHub' },
  { icon: <FaLinkedin size={22} color="#111" />, href: 'https://linkedin.com/in/harshil-patel-5a7373333', label: 'LinkedIn' },
  { icon: <FaInstagram size={22} color="#111" />, href: 'https://www.instagram.com/harshil_3105_/', label: 'Instagram' },
];

const paperItems = socialLinks.map(s => (
  <a
    key={s.label}
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

const inputCls =
  'w-full bg-surface border border-border rounded-[6px] px-4 py-3 text-[14px] text-text placeholder:text-text-faint outline-none focus:border-white/40 transition-colors font-sans';

function ContactForm() {
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    if (form._honey.value) return; // bot
    setStatus('sending');
    try {
      const res = await fetch('https://formsubmit.co/ajax/1080patelharshil@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name.value,
          email: form.email.value,
          message: form.message.value,
          _subject: `Portfolio inquiry from ${form.name.value}`,
          _captcha: 'false',
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('sent');
      form.reset();
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="border border-border rounded-xl p-8 bg-surface text-center">
        <div className="mono-label mb-3">Message sent</div>
        <p className="m-0 text-text-muted text-[15px]">Thanks — I usually reply within a day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="text" name="_honey" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid sm:grid-cols-2 gap-4">
        <input className={inputCls} name="name" type="text" placeholder="Your name" required maxLength={120} />
        <input className={inputCls} name="email" type="email" placeholder="Your email" required maxLength={200} />
      </div>
      <textarea className={inputCls} name="message" rows={5} placeholder="What are we building?" required maxLength={4000} style={{ resize: 'vertical' }} />
      <div className="flex items-center gap-4 flex-wrap">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="inline-flex items-center justify-center bg-text text-bg border-none text-[13px] font-semibold px-[26px] h-[46px] rounded-[4px] cursor-pointer transition-colors hover:bg-white disabled:opacity-50 disabled:cursor-wait"
        >
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        {status === 'error' && (
          <span className="font-mono text-[11px] text-text-dim">
            Couldn't send — email me directly instead.
          </span>
        )}
      </div>
    </form>
  );
}

export default function Contact() {
  useSEO({ title: 'Contact', description: 'Open to select freelance opportunities, full-time roles, and interesting conversations.', path: '/contact' });
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

          {/* ── Right: folder easter egg ── */}
          <div className="hidden lg:flex items-end justify-center" style={{ minHeight: '260px', overflow: 'visible' }}>
            <Folder
              color="#d0d0d0"
              size={2}
              items={paperItems}
            />
          </div>

        </div>

        {/* ── Form: below text and folder ── */}
        <div className="mt-16 max-w-2xl">
          <Reveal>
            <div className="mono-label mb-5">Or write it here</div>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
