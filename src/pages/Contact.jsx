import { Reveal } from '../components/Reveal/Reveal';

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-20">
      <section
        className="w-full"
        style={{ padding: 'clamp(100px,12vw,180px) clamp(20px,6vw,96px)' }}
      >
        <Reveal>
          <div className="mono-label mb-7">Contact</div>
          <h1
            className="m-0 mb-6 font-bold text-text-bright"
            style={{
              fontSize: 'clamp(48px,8vw,120px)',
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
          <a
            href="mailto:1080patelharshil@gmail.com"
            className="block text-text-bright no-underline break-words hover:underline"
            style={{
              fontSize: 'clamp(26px,4.6vw,72px)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              textDecorationThickness: '2px',
              textUnderlineOffset: '8px',
            }}
          >
            1080patelharshil@gmail.com
          </a>
          <div className="flex flex-wrap gap-7 mt-12">
            <a
              href="https://github.com/Marshmellow31"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[12px] tracking-[.12em] text-text-dim no-underline hover:text-text transition-colors"
            >
              GITHUB ↗
            </a>
            <a
              href="https://linkedin.com/in/harshil-patel-5a7373333"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[12px] tracking-[.12em] text-text-dim no-underline hover:text-text transition-colors"
            >
              LINKEDIN ↗
            </a>
            <div className="font-mono text-[12px] tracking-[.12em] text-text-faint">
              BHARUCH, GUJARAT — IN
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
