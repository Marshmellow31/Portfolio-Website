import { useEffect, useRef, useState } from 'react';
import { Reveal } from '../components/Reveal/Reveal';
import SocialOrbit3D from '../components/SocialOrbit3D';
import useSEO from '../utils/useSEO';

const inputCls =
  'w-full bg-bg border border-border rounded-[6px] px-4 py-3.5 text-[14px] text-text placeholder:text-text-faint outline-none focus:border-white/50 transition-colors font-sans';
const labelCls = 'font-mono text-[10px] uppercase tracking-[.16em] text-text-dim';

const WEB3FORMS_ACCESS_KEY = 'e0bef498-6aa0-41c4-915c-b6e640cdec9b';
const projectTypes = ['Website or product', 'Freelance project', 'Full-time role', 'Something else'];

function ProjectTypeSelect({ value, onChange, invalid }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);

  useEffect(() => {
    const close = e => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const choose = index => {
    onChange(projectTypes[index]);
    setActiveIndex(index);
    setOpen(false);
  };

  const onKeyDown = e => {
    if (e.key === 'Escape') return setOpen(false);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const direction = e.key === 'ArrowDown' ? 1 : -1;
      setOpen(true);
      setActiveIndex(index => (index + direction + projectTypes.length) % projectTypes.length);
    }
    if ((e.key === 'Enter' || e.key === ' ') && open) {
      e.preventDefault();
      choose(activeIndex);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name="project_type" value={value} />
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid}
        onClick={() => setOpen(current => !current)}
        onKeyDown={onKeyDown}
        className={`w-full h-[50px] flex items-center justify-between gap-4 bg-bg border rounded-[6px] px-4 text-left text-[14px] outline-none transition-colors ${invalid ? 'border-red-400/70' : open ? 'border-white/50' : 'border-border hover:border-white/30'}`}
      >
        <span className={value ? 'text-text' : 'text-text-faint'}>{value || 'Select an option'}</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <path d="m3 5 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div role="listbox" aria-label="Project type" className="absolute z-30 left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-[8px] border border-white/15 bg-[#151518] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,.55)] animate-[fadeUp_.16s_ease_both]">
          {projectTypes.map((option, index) => {
            const selected = option === value;
            const active = index === activeIndex;
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActiveIndex(index)}
                onClick={() => choose(index)}
                className={`w-full min-h-[44px] flex items-center justify-between rounded-[5px] border-0 px-3.5 text-left text-[14px] cursor-pointer transition-colors ${active ? 'bg-white/10 text-text-bright' : 'bg-transparent text-text-muted hover:text-text'} ${selected ? 'font-medium' : ''}`}
              >
                <span>{option}</span>
                {selected && <span className="text-[12px]" aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContactForm() {
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [projectType, setProjectType] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!projectType) {
      setStatus('validation');
      return;
    }
    setStatus('sending');

    try {
      const formData = new FormData(form);
      formData.append('access_key', WEB3FORMS_ACCESS_KEY);
      formData.append('subject', `Portfolio inquiry from ${formData.get('name')}`);
      formData.append('from_name', 'Harshil Patel Portfolio');

      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || String(res.status));

      setStatus('sent');
      setProjectType('');
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
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className={labelCls}>Name</span>
          <input className={inputCls} name="name" type="text" placeholder="Your name" required maxLength={120} autoComplete="name" />
        </label>
        <label className="flex flex-col gap-2">
          <span className={labelCls}>Email</span>
          <input className={inputCls} name="email" type="email" placeholder="you@example.com" required maxLength={200} autoComplete="email" />
        </label>
      </div>
      <label className="flex flex-col gap-2">
        <span className={labelCls}>I’m reaching out about</span>
        <ProjectTypeSelect value={projectType} onChange={value => { setProjectType(value); setStatus('idle'); }} invalid={status === 'validation'} />
        {status === 'validation' && <span className="font-mono text-[10px] text-red-300/80">Please choose what you’re reaching out about.</span>}
      </label>
      <label className="flex flex-col gap-2">
        <span className={labelCls}>Project details</span>
        <textarea className={inputCls} name="message" rows={6} placeholder="Tell me about the idea, timeline, and what success looks like." required maxLength={4000} style={{ resize: 'vertical' }} />
      </label>
      <div className="flex items-center justify-between gap-4 flex-wrap pt-1">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="inline-flex items-center justify-center bg-text text-bg border-none text-[13px] font-semibold px-[26px] h-[48px] rounded-[4px] cursor-pointer transition-colors hover:bg-white disabled:opacity-50 disabled:cursor-wait"
        >
          {status === 'sending' ? 'Sending…' : 'Send inquiry →'}
        </button>
        {status !== 'error' && <span className="font-mono text-[10px] uppercase tracking-[.12em] text-text-faint">Usually replies within 24 hours</span>}
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
        style={{ padding: 'clamp(32px,4vw,64px) clamp(20px,6vw,96px) clamp(64px,8vw,120px)' }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,.95fr)] gap-14 xl:gap-24 items-start max-w-[1680px] mx-auto">
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
              className="m-0 text-text-muted max-w-lg mb-14"
              style={{ fontSize: 'clamp(16px,1.4vw,20px)', lineHeight: 1.6 }}
            >
              Open to select freelance opportunities, full-time roles, and interesting conversations.
            </p>
            <div className="flex flex-wrap gap-x-7 gap-y-4 mb-8">
              <div className="font-mono text-[12px] tracking-[.12em] text-text-faint">
                BHARUCH, GUJARAT — IN
              </div>
            </div>
            <SocialOrbit3D />
          </Reveal>

          <Reveal>
            <div className="border border-border bg-surface/70 rounded-xl p-6 sm:p-8 lg:p-10">
              <div className="mono-label mb-4">Start a conversation</div>
              <h2 className="m-0 mb-3 text-text-bright text-[clamp(24px,2vw,34px)] font-semibold tracking-[-.03em]">Tell me what you have in mind.</h2>
              <p className="m-0 mb-8 text-text-muted text-[14px] leading-6">Share a few details and I’ll get back to you with a clear next step.</p>
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
