/* ─── Project items for the sphere (Interactive) ─── */
export const items = [
  {
    image: '/projects/paymatrix.png',
    link: 'https://pay-matrix.vercel.app/',
    title: 'PayMatrix',
    description: 'AI-powered expense sharing'
  },

  {
    image: '/projects/ascend.png',
    link: 'https://github.com/Marshmellow31/Ascend',
    title: 'Ascend',
    description: 'Gamified productivity PWA'
  },
  {
    image: '/projects/playhub.png',
    link: '#projects',
    title: 'PlayHub',
    description: 'Court & venue booking'
  },

  {
    image: '/projects/picklerage.png',
    link: 'https://github.com/Marshmellow31/PickleRage-website',
    title: 'PickleRage',
    description: 'Sports venue website'
  },
  {
    image: '/projects/bhumi.png',
    link: '#projects',
    title: 'Bhumi Developers',
    description: 'Corporate real estate site'
  },
  {
    image: '/projects/mannbeauty.png',
    link: 'https://github.com/Marshmellow31/Mann-beauty-parlour',
    title: 'Mann Beauty Studio',
    description: 'Luxury salon loyalty PWA'
  },
  {
    image: '/projects/bdbuildcon.png',
    link: '#projects',
    title: 'BD Buildcon',
    description: 'Industrial EPC contractor site'
  },
  {
    image: '/projects/attendance.png',
    link: '#projects',
    title: 'Attendance Manager',
    description: 'Secret-key protected dashboard'
  },
  {
    image: '/projects/navigator.png',
    link: '#projects',
    title: 'Navigator+',
    description: 'Native Android GPS dashboard'
  }
];

/* ─── Selected Work — monochrome redesign (table-style rows on Home) ─── */
const selectedWorkRaw = [
  {
    title: 'PayMatrix',
    image: '/projects/paymatrix.png',
    description: 'Group-expense platform with AI bill scanning (Gemini Vision), greedy debt simplification, native UPI deep-linking, and real-time sync.',
    stack: ['React 19', 'Firebase', 'Tailwind', 'Gemini API'],
    link: 'https://pay-matrix.vercel.app/',
    github: 'https://github.com/Marshmellow31/PayMatrix',
    live: true,
  },
  {
    title: 'Ascend',
    image: '/projects/ascend.png',
    description: 'Gamified productivity PWA — XP and levels, Pomodoro, 24-week heatmaps, command palette.',
    stack: ['Svelte 5', 'Vite', 'Firebase', 'PWA'],
    link: null,
    github: 'https://github.com/Marshmellow31/Ascend',
    live: false,
  },
  {
    title: 'PlayHub',
    image: '/projects/playhub.png',
    description: 'Court booking app with Razorpay payments, Google Wallet passes, Leaflet maps, and a role-based admin dashboard.',
    stack: ['React 19', 'TypeScript', 'Firebase', 'Capacitor'],
    link: null,
    github: null,
    live: false,
  },
  {
    title: 'Mann Beauty Studio',
    image: '/projects/mannbeauty.png',
    description: 'Loyalty PWA replacing paper cards for a working salon — phone auth, visual loyalty tracking, admin CRM.',
    stack: ['React 19', 'Tailwind v4', 'Firebase v12'],
    link: null,
    github: 'https://github.com/Marshmellow31/Mann-beauty-parlour',
    live: false,
  },
  {
    title: 'Bhumi Developers',
    image: '/projects/bhumi.png',
    description: 'Corporate site and project portfolio for a real-estate firm — Lenis smooth scroll, 3D elements, PDF brochures.',
    stack: ['Next.js', 'React 19', 'Framer Motion'],
    link: null,
    github: null,
    live: false,
  },
  {
    title: 'BD Buildcon',
    image: '/projects/bdbuildcon.png',
    description: 'Marketing site for a turnkey industrial EPC contractor — filterable project gallery, employee portal.',
    stack: ['Next.js', 'TypeScript', 'Lenis'],
    link: null,
    github: null,
    live: false,
  },
  {
    title: 'PickleRage',
    image: '/projects/picklerage.png',
    description: 'Marketing website for a pickleball venue with premium animation and SEO.',
    stack: ['React 19', 'React Router v7', 'Framer Motion'],
    link: null,
    github: 'https://github.com/Marshmellow31/PickleRage-website',
    live: false,
  },
  {
    title: 'Attendance Manager',
    image: '/projects/attendance.png',
    description: 'Secret-key protected attendance dashboard with real-time sync and CSV exports for payroll.',
    stack: ['React 19', 'Zustand', 'Firebase'],
    link: null,
    github: null,
    live: false,
  },
  {
    title: 'Navigator+',
    image: '/projects/navigator.png',
    description: 'Native Android ride-tracking dashboard — stable live GPS speed and distance under background restrictions.',
    stack: ['Kotlin', 'Jetpack Compose'],
    link: null,
    github: null,
    live: false,
  },
];

export const selectedWork = selectedWorkRaw.map((p, i) => ({
  ...p,
  num: String(i + 1).padStart(2, '0'),
  stackLine: p.stack.join(' · '),
}));

/* ─── Capabilities grid (grouped stack, comma lists) ─── */
export const skillGroups = [
  { name: 'Languages', list: 'TypeScript, JavaScript, Python, C++, Java, Dart, Kotlin, SQL' },
  { name: 'Frontend', list: 'React 19, Next.js, Svelte 5, Tailwind CSS, Framer Motion, Three.js' },
  { name: 'Backend', list: 'Node.js, Express, Firebase, MySQL, REST APIs' },
  { name: 'Mobile', list: 'Android (Kotlin), Flutter, PWA, Capacitor' },
  { name: 'AI / ML', list: 'Ollama, Claude API, Gemini Vision, Whisper STT, Embeddings' },
  { name: 'Tools', list: 'Git, GitHub Actions, Vercel, Docker, Vitest, ESLint' },
];

/* ─── Work History ─── */
export const workHistory = [
  {
    company: 'PICKLERAGE',
    role: 'FREELANCE / CONTRACT DEVELOPER',
    location: 'Remote',
    projects: [
      {
        name: 'COURT BOOKING APP',
        description: 'Full-stack court booking application featuring payment gateway integration, digital wallet passes, interactive maps, and a comprehensive admin dashboard with role-based access.',
        stack: ['React 19', 'TypeScript', 'Firebase', 'Razorpay', 'Capacitor'],
      },
      {
        name: 'MARKETING WEBSITE',
        description: 'High-performance marketing website with premium animations, SEO optimization, and dynamic routing for a pickleball venue.',
        stack: ['React 19', 'React Router v7', 'Tailwind CSS', 'Framer Motion'],
      }
    ]
  },
  {
    company: 'BHUMI DEVELOPERS',
    role: 'WEB DEVELOPMENT INTERN',
    location: 'Bharuch, Gujarat',
    projects: [
      {
        name: 'CORPORATE WEBSITE',
        description: 'Corporate site and project portfolio for a real-estate firm. Lenis smooth scrolling, 3D elements, premium animations, PDF brochures.',
        stack: ['Next.js', 'React 19', 'Tailwind CSS', 'Framer Motion'],
      },
      {
        name: 'BD BUILDCON PORTAL',
        description: 'Production-ready marketing site for a turnkey industrial EPC contractor. Filterable project gallery, employee portal, custom motion components.',
        stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Lenis'],
      }
    ]
  },
  {
    company: 'MANN BEAUTY STUDIO',
    role: 'FULL-STACK DEVELOPER',
    location: 'Freelance',
    projects: [
      {
        name: 'SALON PWA & CRM',
        description: 'Luxury-tier PWA replacing paper loyalty cards. Features phone auth, visual loyalty tracking, and a comprehensive admin CRM dashboard.',
        stack: ['React 19', 'Tailwind v4', 'Framer Motion', 'Firebase v12'],
      }
    ]
  }
];

/* ─── Skill categories ─── */
export const skills = {
  'Languages': ['TypeScript', 'JavaScript', 'Python', 'C++', 'Java', 'Dart', 'Kotlin', 'SQL'],
  'Frontend': ['React 19', 'Next.js', 'Svelte 5', 'Tailwind CSS', 'Framer Motion', 'Three.js'],
  'Backend': ['Node.js', 'Express', 'Firebase', 'MySQL', 'REST APIs'],
  'Mobile': ['Android (Kotlin)', 'Flutter', 'PWA', 'Capacitor'],
  'AI / ML': ['Ollama', 'Claude API', 'Gemini Vision', 'Whisper STT', 'Embeddings'],
  'Tools': ['Git', 'GitHub Actions', 'Vercel', 'Docker', 'Vitest', 'ESLint'],
};

/* ─── Featured projects ─── */
export const projects = [
  {
    title: 'PayMatrix',
    description: 'Premium group-expense platform with AI bill scanning via Gemini Vision, greedy debt-simplification, native UPI deep-linking, and real-time sync.',
    stack: ['React 19', 'Vite', 'Firebase', 'Tailwind CSS', 'Gemini API'],
    link: 'https://pay-matrix.vercel.app/',
    github: 'https://github.com/Marshmellow31/PayMatrix',
    image: '/projects/paymatrix.png',
  },
  {
    title: 'Ascend',
    description: 'Frosted-glass gamified productivity PWA with XP/levels, Pomodoro timer, 24-week heatmaps, and a command palette.',
    stack: ['Svelte 5', 'Vite', 'Firebase', 'PWA'],
    link: null,
    github: 'https://github.com/Marshmellow31/Ascend',
    image: '/projects/ascend.png',
  },
  {
    title: 'PlayHub',
    description: 'Court booking app with Razorpay payments, Google Wallet passes, Leaflet maps, and admin dashboard with role-based access.',
    stack: ['React 19', 'TypeScript', 'Firebase', 'Capacitor', 'Razorpay'],
    link: null,
    github: null,
    image: '/projects/playhub.png',
  },
  {
    title: 'PickleRage',
    description: 'Marketing website for a pickleball venue with premium animations and SEO optimization.',
    stack: ['React 19', 'React Router v7', 'Framer Motion', 'Vite'],
    link: null,
    github: 'https://github.com/Marshmellow31/PickleRage-website',
    image: '/projects/picklerage.png',
  },
  {
    title: 'Bhumi Developers',
    description: 'Corporate site and project portfolio for a real-estate firm. Lenis smooth scrolling, 3D elements, premium animations, PDF brochures.',
    stack: ['Next.js', 'React 19', 'Tailwind CSS', 'Framer Motion'],
    link: null,
    github: null,
    image: '/projects/bhumi.png',
  },
  {
    title: 'Mann Beauty Studio',
    description: 'Luxury-tier PWA replacing paper loyalty cards. Features phone auth, visual loyalty tracking, and a comprehensive admin CRM dashboard.',
    stack: ['React 19', 'Tailwind v4', 'Framer Motion', 'Firebase v12'],
    link: null,
    github: 'https://github.com/Marshmellow31/Mann-beauty-parlour',
    image: '/projects/mannbeauty.png',
  },
  {
    title: 'BD Buildcon',
    description: 'Production-ready marketing site for a turnkey industrial EPC contractor. Filterable project gallery, employee portal, custom motion components.',
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Lenis'],
    link: null,
    github: null,
    image: '/projects/bdbuildcon.png',
  },
  {
    title: 'Attendance Manager',
    description: 'Premium custom-built attendance manager with real-time sync, interactive grid, and CSV exports for payroll processing.',
    stack: ['React 19', 'Vite', 'Tailwind v4', 'Zustand', 'Firebase'],
    link: null,
    github: null,
    image: '/projects/attendance.png',
  },
  {
    title: 'Navigator+',
    description: 'Native Android ride-tracking dashboard. Features stable GPS live speed, average speed, and distance tracking running continuously under background restrictions.',
    stack: ['Kotlin', 'Android SDK', 'Jetpack Compose'],
    link: null,
    github: null,
    image: '/projects/navigator.png',
  },
];
