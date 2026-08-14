import { FaGithub, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

function GmailLogo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="52 42 88 66" role="img" aria-label="Gmail">
      <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
      <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
      <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
      <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
      <path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2" />
    </svg>
  );
}

const platforms = [
  {
    Icon: GmailLogo,
    name: 'Email',
    handle: '1080patelharshil@gmail.com',
    href: 'mailto:1080patelharshil@gmail.com',
    iconClass: 'bg-white shadow-[0_7px_0_#c9c9c9,0_12px_24px_rgba(66,133,244,.16)]',
    accent: 'group-hover:border-[#ea4335]/55',
  },
  {
    Icon: FaGithub,
    name: 'GitHub',
    handle: '@Marshmellow31',
    href: 'https://github.com/Marshmellow31',
    iconClass: 'bg-[#24292f] text-white shadow-[0_7px_0_#101215,0_12px_24px_rgba(57,211,83,.12)]',
    accent: 'group-hover:border-[#39d353]/45',
  },
  {
    Icon: FaLinkedinIn,
    name: 'LinkedIn',
    handle: 'Harshil Patel',
    href: 'https://linkedin.com/in/harshil-patel-5a7373333',
    iconClass: 'bg-[#0a66c2] text-white shadow-[0_7px_0_#064785,0_12px_24px_rgba(10,102,194,.18)]',
    accent: 'group-hover:border-[#0a66c2]/60',
  },
  {
    Icon: FaInstagram,
    name: 'Instagram',
    handle: '@harshil_3105_',
    href: 'https://www.instagram.com/harshil_3105_/',
    iconClass: 'bg-[linear-gradient(145deg,#833ab4_5%,#e1306c_48%,#f77737_72%,#fcaf45)] text-white shadow-[0_7px_0_#7c2455,0_12px_24px_rgba(225,48,108,.18)]',
    accent: 'group-hover:border-[#e1306c]/55',
  },
];

export default function SocialOrbit3D({ className = '' }) {
  return (
    <div className={`border border-border rounded-xl bg-bg/80 p-4 sm:p-5 flex flex-col ${className}`} aria-label="Social profiles">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <div className="mono-label">Find me online</div>
          <p className="m-0 mt-2 text-[12px] text-text-faint">Profiles, work, and occasional updates.</p>
        </div>
        <div className="hidden sm:block font-mono text-[9px] uppercase tracking-[.14em] text-text-faint">Select a profile ↗</div>
      </div>

      <div className="grid flex-1 gap-3 lg:grid-cols-2 lg:auto-rows-fr">
        {platforms.map(({ Icon, name, handle, href, iconClass, accent }) => (
          <a
            key={name}
            href={href}
            target={href.startsWith('mailto:') ? undefined : '_blank'}
            rel={href.startsWith('mailto:') ? undefined : 'noreferrer'}
            aria-label={`Open ${name} profile`}
            className={`group relative flex min-h-[74px] items-center gap-3 overflow-hidden rounded-[9px] border border-white/[.08] bg-surface px-3.5 py-3 text-text no-underline transition-[transform,border-color,background-color] duration-300 hover:-translate-y-1 hover:bg-[#1b1b20] active:translate-y-0 ${accent}`}
          >
            <span className="social-logo-stage flex h-[50px] w-[50px] shrink-0 items-center justify-center">
              <span className={`social-logo-revolve flex h-[42px] w-[42px] items-center justify-center rounded-[10px] ${iconClass}`}>
                <Icon size={22} aria-hidden="true" />
              </span>
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-text-bright">{name}</span>
              <span className="mt-1 block truncate font-mono text-[10px] tracking-[.08em] text-text-dim">{handle}</span>
            </span>

            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-[14px] text-text-dim transition-all duration-300 group-hover:border-white/25 group-hover:bg-white group-hover:text-black group-hover:rotate-45" aria-hidden="true">↗</span>
            <span className="pointer-events-none absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-white/40 transition-transform duration-300 group-hover:scale-x-100" />
          </a>
        ))}
      </div>
    </div>
  );
}
