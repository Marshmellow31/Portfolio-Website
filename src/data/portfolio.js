/* ─── Project items for the sphere (Interactive) ─── */
export const items = [
  {
    image: '/projects/paymatrix.webp',
    link: 'https://pay-matrix.vercel.app/',
    title: 'PayMatrix',
    description: 'AI-powered expense sharing'
  },

  {
    image: '/projects/esp32ac.svg',
    link: 'https://github.com/Marshmellow31/Smart-AC-Dashboard',
    title: 'ESP32 Smart AC',
    description: 'IR-controlled smart AC on a chip'
  },
  {
    image: '/projects/ascend.webp',
    link: 'https://github.com/Marshmellow31/Ascend',
    title: 'Ascend',
    description: 'Gamified productivity PWA'
  },
  {
    image: '/projects/playhub.webp',
    link: '#projects',
    title: 'PlayHub',
    description: 'Court & venue booking'
  },

  {
    image: '/projects/picklerage.webp',
    link: 'https://github.com/Marshmellow31/PickleRage-website',
    title: 'PickleRage',
    description: 'Sports venue website'
  },
  {
    image: '/projects/bhumi.svg',
    link: '#projects',
    title: 'Bhumi Developers',
    description: 'Corporate real estate site'
  },
  {
    image: '/projects/mannbeauty.webp',
    link: 'https://github.com/Marshmellow31/Mann-beauty-parlour',
    title: 'Mann Beauty Studio',
    description: 'Luxury salon loyalty PWA'
  },
  {
    image: '/projects/bdbuildcon.svg',
    link: '#projects',
    title: 'BD Buildcon',
    description: 'Industrial EPC contractor site'
  },
  {
    image: '/projects/attendance.webp',
    link: '#projects',
    title: 'Attendance Manager',
    description: 'Secret-key protected dashboard'
  },
  {
    image: '/projects/navigator.webp',
    link: '#projects',
    title: 'Navigator+',
    description: 'Native Android GPS dashboard'
  },
  {
    image: '/projects/harekrishna.webp',
    link: '#projects',
    title: 'Hare Krishna',
    description: 'Restaurant website'
  },
  {
    image: '/projects/tasteofpunjab.webp',
    link: '#projects',
    title: 'Taste of Punjab',
    description: 'Digital QR Menu'
  }
];

/* ─── Selected Work — monochrome redesign, one case study per project ───
   Each entry drives both the /projects list and the /projects/:slug page. */
const selectedWorkRaw = [
  {
    slug: 'paymatrix',
    title: 'PayMatrix',
    year: '2026',
    role: 'Design · Full-Stack · AI',
    type: 'Personal Product',
    image: '/projects/paymatrix.webp',
    images: [
      '/projects/paymatrix/01-hook.webp',
      '/projects/paymatrix/02-overview.webp',
      '/projects/paymatrix/03-scan.webp',
      '/projects/paymatrix/04-split.webp',
      '/projects/paymatrix/05-settle.webp',
      '/projects/paymatrix/06-insights.webp',
      '/projects/paymatrix/07-cta.webp',
    ],
    description: 'Group-expense platform with AI bill scanning (Gemini Vision), greedy debt simplification, native UPI deep-linking, and real-time sync.',
    problem: 'Splitting group expenses is still a mess of screenshots, manual entry, and "who owes whom" chains. Existing apps make you type every line item by hand and settle debts through long chains of tiny transfers.',
    approach: 'PayMatrix scans the physical bill instead — Gemini Vision reads the receipt, itemizes it, and assigns items to people. A greedy debt-simplification algorithm collapses the who-owes-whom graph into the minimum number of transfers, and each one deep-links straight into the payer\'s UPI app. Firebase keeps every member of the group in sync in real time.',
    features: [
      ['AI bill scanning', 'Point a camera at a receipt — Gemini Vision extracts merchant, line items, and totals into a structured split.'],
      ['Debt simplification', 'A greedy settlement algorithm reduces N-person debt graphs to the fewest possible transactions.'],
      ['Native UPI deep-linking', 'Every settlement opens directly in GPay/PhonePe/Paytm with amount and note pre-filled.'],
      ['Real-time group sync', 'Expenses, edits, and settlements propagate to every member instantly via Firestore listeners.'],
      ['Spending insights', 'Per-person and per-category breakdowns show where the group\'s money actually goes.'],
    ],
    outcome: 'Live in production and used for real group trips — the settle-up flow that used to take an evening of arithmetic now takes three taps.',
    stack: ['React 19', 'Firebase', 'Tailwind', 'Gemini API'],
    link: 'https://pay-matrix.vercel.app/',
    github: 'https://github.com/Marshmellow31/PayMatrix',
    instagram: 'https://www.instagram.com/paymatrixapp/',
    live: true,
  },
  {
    slug: 'esp32-smart-ac',
    title: 'ESP32 Smart AC',
    year: '2026',
    role: 'Hardware · Firmware · Full-Stack',
    type: 'Personal Product',
    image: '/projects/esp32ac.svg',
    images: [
      '/projects/esp32/esp32-dashboard-01.webp',
      '/projects/esp32/esp32-dashboard-02.webp',
      '/projects/esp32/esp32-dashboard-03.webp',
    ],
    description: 'A ~₹600 build that turns a basic Samsung split AC into a flagship-grade smart AC — Wi-Fi control, scheduling, sleep curves, energy tracking, and Alexa/Google voice, all served from a single ESP32.',
    problem: 'Smart ACs cost a fortune, and a perfectly good "dumb" AC isn\'t worth replacing just to control it from a phone. The intelligence lives in a plastic remote that gets lost behind the couch — there\'s no way to start cooling before you get home, schedule it, or see what it costs to run.',
    approach: 'The AC already has a wireless interface: its IR remote. I used an ESP32 with a single IR LED to impersonate the Samsung remote over 38 kHz IR, then built a dependency-free web app that runs on the device itself and serves flagship-level automation over local Wi-Fi — no hub, no cloud, no subscription. The firmware is a clean single-owner architecture where one module is the sole source of truth and the only thing that touches the IR pin.',
    features: [
      ['On-device web app', 'A vanilla-JS PWA served gzipped from the ESP32\'s own flash — installable, offline-capable, reachable at http://ac-controller/ on the LAN.'],
      ['Full climate control', 'Power, temperature, mode, and fan, plus one-tap presets — everything the physical remote does, from any phone.'],
      ['Schedules & sleep curves', 'Countdown timers, weekly schedules, and multi-step programs like "60 min @24° → 25° → 26° → off" that resume after a reboot.'],
      ['Energy & cost model', 'Tracks commanded on-time to project a live 24-hour cost timeline and 30-day kWh/₹ stats — honest about IR being write-only.'],
      ['"Manual wins" precedence', 'Manual and voice commands pause schedules for a hold window, while timers and safety auto-off deliberately bypass it — product logic, not just code.'],
      ['Voice control', 'Optional Alexa and Google Home integration via Sinric Pro, bridged bidirectionally so the app and cloud stay in sync.'],
    ],
    outcome: 'A basic Samsung AC now schedules itself, tracks its own running cost, and answers to my phone and voice — built for the price of two pizzas, and fully open-source so anyone can clone it.',
    stack: ['ESP32', 'C++ / Arduino', 'PlatformIO', 'Vanilla JS PWA'],
    link: null,
    github: 'https://github.com/Marshmellow31/Smart-AC-Dashboard',
    live: false,
    statusLabel: 'IN DAILY USE',
  },
  {
    slug: 'picklerage',
    title: 'PickleRage',
    year: '2026',
    role: 'Freelance — Design & Build',
    type: 'Client Work',
    image: '/projects/picklerage.webp',
    images: [
      '/projects/picklerage/01.webp',
      '/projects/picklerage/02.webp',
      '/projects/picklerage/03.webp',
      '/projects/picklerage/04.webp',
    ],
    description: 'Marketing website for a pickleball venue with premium animation and SEO.',
    problem: 'A new pickleball venue needed to stand out in a fast-growing sport where every competitor\'s website looks like the same template — and it needed to rank locally from day one.',
    approach: 'Designed and built a motion-first marketing site: scroll-driven reveals, kinetic type, and court photography treated like editorial spreads. Under the hood it\'s a fast React 19 SPA with route-level code splitting and SEO meta done properly per page.',
    features: [
      ['Premium motion design', 'Framer Motion choreography on every section — reveals, parallax, and hover states that feel engineered, not decorated.'],
      ['Local SEO foundation', 'Structured data, per-route meta, and performance tuned for Core Web Vitals so the venue ranks for local searches.'],
      ['Content-flexible sections', 'Pricing, events, and coaching blocks the owners can extend without redesign.'],
    ],
    outcome: 'Delivered as the venue\'s primary web presence and booking funnel entry point.',
    stack: ['React 19', 'React Router v7', 'Framer Motion'],
    link: 'https://www.picklerage.in/',
    github: 'https://github.com/Marshmellow31/PickleRage-website',
    live: true,
  },
  {
    slug: 'bhumi-developers',
    title: 'Bhumi Developers',
    year: '2025',
    role: 'Web Development Intern',
    type: 'Internship',
    image: '/projects/bhumi.svg',
    images: [
      '/projects/bhumi-gallery/01.webp',
      '/projects/bhumi-gallery/02.webp',
      '/projects/bhumi-gallery/03.webp',
    ],
    description: 'Corporate site and project portfolio for a real-estate firm — Lenis smooth scroll, 3D elements, PDF brochures.',
    problem: 'A real-estate firm with serious projects had no web presence to match — buyers judged them against national developers whose sites feel premium.',
    approach: 'Built a corporate site that borrows the language of high-end property marketing: Lenis smooth scrolling, subtle 3D elements, and a project portfolio where each development gets its own gallery and downloadable PDF brochure.',
    features: [
      ['Project portfolio system', 'Each development has its own page with galleries, specs, and location context.'],
      ['PDF brochure pipeline', 'Print-quality brochures served per project for the sales team to share.'],
      ['Premium scroll feel', 'Lenis smooth scrolling and scroll-linked reveals across the whole site.'],
    ],
    outcome: 'Shipped as the firm\'s official corporate site during my internship.',
    stack: ['Next.js', 'React 19', 'Framer Motion'],
    link: 'https://www.bhumidevelopers.co.in/',
    github: null,
    live: true,
  },
  {
    slug: 'bd-buildcon',
    title: 'BD Buildcon',
    year: '2025',
    role: 'Web Development Intern',
    type: 'Internship',
    image: '/projects/bdbuildcon.svg',
    description: 'Marketing site for a turnkey industrial EPC contractor — filterable project gallery, employee portal.',
    problem: 'An industrial EPC contractor needed to present decades of turnkey projects to procurement teams — an audience that wants proof and specifics, not marketing fluff.',
    approach: 'Built a TypeScript Next.js site around a filterable project gallery — sector, scope, and scale filters let a procurement engineer find a comparable past project in seconds. An employee portal handles internal documents behind auth.',
    features: [
      ['Filterable project gallery', 'Filter the contractor\'s full project history by sector, scope, and scale.'],
      ['Employee portal', 'Authenticated internal area for company documents and resources.'],
      ['Custom motion components', 'A small reusable animation kit keeps the industrial content feeling alive without a framework of one-offs.'],
    ],
    outcome: 'Production-ready marketing site delivered as part of the internship.',
    stack: ['Next.js', 'TypeScript', 'Lenis'],
    link: 'https://bdbuildcon.com/',
    github: null,
    live: true,
  },
  {
    slug: 'playhub',
    title: 'PlayHub',
    year: '2026',
    role: 'Freelance — Full-Stack',
    type: 'Client Work',
    image: '/projects/playhub.webp',
    images: [
      '/projects/playhub/01.webp',
      '/projects/playhub/02.webp',
      '/projects/playhub/03.webp',
      '/projects/playhub/04.webp',
      '/projects/playhub/05.webp',
      '/projects/playhub/06.webp',
      '/projects/playhub/07.webp',
      '/projects/playhub/08.webp',
      '/projects/playhub/09.webp',
      '/projects/playhub/10.webp',
    ],
    description: 'Court booking app with Razorpay payments, Google Wallet passes, Leaflet maps, and a role-based admin dashboard.',
    problem: 'Court bookings at the venue ran on phone calls and a paper register — double bookings, no prepayment, and no view of utilization.',
    approach: 'A full booking platform: players pick a court and slot on a live availability grid, pay through Razorpay, and get a Google Wallet pass as their ticket. Staff manage everything from a role-based admin dashboard; Leaflet maps handle venue discovery.',
    features: [
      ['Live slot booking', 'Real-time availability grid backed by Firestore — no double bookings, ever.'],
      ['Razorpay payments', 'Prepaid bookings with server-verified payment capture.'],
      ['Google Wallet passes', 'Each booking issues a wallet pass with QR check-in.'],
      ['Role-based admin', 'Owners, managers, and staff each see exactly the controls they need.'],
      ['Capacitor build', 'Same codebase ships as an installable Android app.'],
    ],
    outcome: 'Full-stack booking system built end-to-end as a solo freelance engagement.',
    stack: ['React 19', 'TypeScript', 'Firebase', 'Capacitor'],
    link: null,
    github: null,
    live: false,
  },
  {
    slug: 'mann-beauty',
    title: 'Mann Beauty Studio',
    year: '2025',
    role: 'Freelance — Full-Stack',
    type: 'Client Work',
    featured: false,
    image: '/projects/mannbeauty-gallery/01.webp',
    images: [
      '/projects/mannbeauty-gallery/01.webp',
      '/projects/mannbeauty-gallery/02.webp',
    ],
    description: 'Loyalty PWA replacing paper cards for a working salon — phone auth, visual loyalty tracking, admin CRM.',
    problem: 'The salon ran loyalty on paper punch cards — customers lost them, staff couldn\'t verify them, and the owner had zero visibility into repeat business.',
    approach: 'Replaced the cards with a PWA customers add to their home screen: phone-number auth (no passwords for a non-technical audience), a visual loyalty tracker, and an admin CRM where staff log visits and the owner finally sees retention data.',
    features: [
      ['Phone-first auth', 'OTP login — the only identity a walk-in customer reliably has is their number.'],
      ['Visual loyalty tracking', 'Progress toward rewards shown as a filling card — instantly legible at the counter.'],
      ['Admin CRM', 'Visit logging, customer lookup, and retention stats for the owner.'],
      ['Installable PWA', 'Home-screen app with no app-store friction.'],
    ],
    outcome: 'In daily use at the salon — paper cards fully retired.',
    stack: ['React 19', 'Tailwind v4', 'Firebase v12'],
    link: null,
    github: 'https://github.com/Marshmellow31/Mann-beauty-parlour',
    live: false,
  },
  {
    slug: 'attendance-manager',
    title: 'Attendance Manager',
    year: '2025',
    role: 'Freelance — Full-Stack',
    type: 'Client Work',
    featured: false,
    image: '/projects/attendance-gallery/01.webp',
    images: [
      '/projects/attendance-gallery/01.webp',
      '/projects/attendance-gallery/02.webp',
      '/projects/attendance-gallery/03.webp',
    ],
    description: 'Secret-key protected attendance dashboard with real-time sync and CSV exports for payroll — built for the same salon as Mann Beauty Studio.',
    problem: 'A small business tracked worker attendance in a notebook, then spent hours each month turning it into payroll numbers.',
    approach: 'A deliberately simple dashboard: a secret key instead of accounts (one shared device at the site), an interactive month grid for marking attendance, real-time sync so the owner sees updates from anywhere, and one-click CSV export shaped for payroll.',
    features: [
      ['Secret-key access', 'No account system to manage — a single rotating key gates the dashboard.'],
      ['Interactive month grid', 'Mark present/absent/half-day with one tap per worker per day.'],
      ['Payroll CSV export', 'Month-end export lands in exactly the shape payroll needs.'],
      ['Real-time sync', 'Zustand + Firestore keep every open device consistent.'],
    ],
    outcome: 'Month-end payroll prep went from hours of transcription to a single export.',
    stack: ['React 19', 'Zustand', 'Firebase'],
    link: null,
    github: null,
    live: false,
  },
  {
    slug: 'ascend',
    title: 'Ascend',
    year: '2025',
    role: 'Design · Frontend',
    type: 'Personal Product',
    image: '/projects/ascend.webp',
    images: [
      '/projects/ascend/01.webp',
      '/projects/ascend/02.webp',
      '/projects/ascend/03.webp',
      '/projects/ascend/04.webp',
      '/projects/ascend/05.webp',
      '/projects/ascend/06.webp',
    ],
    description: 'Gamified productivity PWA — XP and levels, Pomodoro, 24-week heatmaps, command palette.',
    problem: 'Todo apps track tasks but don\'t make you want to do them. The habit-forming mechanics that keep people in games are absent from the tools meant to run their lives.',
    approach: 'Ascend treats productivity like a game you\'re leveling in: tasks award XP, streaks compound, and a 24-week heatmap makes consistency visible the way GitHub\'s graph does for commits. Built in Svelte 5 as a frosted-glass PWA with a command palette for keyboard-first use.',
    features: [
      ['XP & levels', 'Completing tasks earns XP scaled by difficulty — progress you can feel.'],
      ['Pomodoro engine', 'Built-in focus timer that feeds session data back into your stats.'],
      ['24-week heatmaps', 'Long-horizon consistency view, GitHub-graph style.'],
      ['Command palette', 'Everything — add, complete, navigate — reachable without the mouse.'],
    ],
    outcome: 'My daily driver for task management, and my deepest dive into Svelte 5 runes.',
    stack: ['Svelte 5', 'Vite', 'Firebase', 'PWA'],
    link: null,
    github: 'https://github.com/Marshmellow31/Ascend',
    live: true,
  },
  {
    slug: 'navigator-plus',
    title: 'Navigator+',
    year: '2025',
    role: 'Android Developer',
    type: 'Personal Product',
    image: '/projects/navigator-gallery/01.webp',
    images: [
      '/projects/navigator-gallery/01.webp',
      '/projects/navigator-gallery/02.webp',
    ],
    description: 'Native Android ride-tracking dashboard — stable live GPS speed and distance under background restrictions.',
    problem: 'Android kills background GPS aggressively — most ride trackers freeze, drift, or die mid-ride the moment the screen locks.',
    approach: 'Built a native Kotlin dashboard around a foreground service architected to survive Doze and OEM battery managers. Speed and distance come from a filtered fused-location stream, so the numbers stay stable at speed instead of jittering.',
    features: [
      ['Survives background restrictions', 'Foreground service + wake strategy keeps tracking alive through Doze and screen-off.'],
      ['Stable live telemetry', 'Filtered GPS gives smooth live speed, average speed, and distance.'],
      ['Compose dashboard', 'Glanceable ride UI built entirely in Jetpack Compose.'],
    ],
    outcome: 'Reliable tracking across full rides where Play-Store trackers cut out.',
    stack: ['Kotlin', 'Jetpack Compose'],
    link: null,
    github: null,
    live: false,
  },
  {
    slug: 'hare-krishna',
    title: 'Hare Krishna',
    year: '2026',
    role: 'Freelance — Design & Build',
    type: 'Client Work',
    featured: false,
    image: '/projects/harekrishna.webp',
    images: ['/projects/harekrishna.webp'],
    description: 'Modern, performant restaurant website with animated sections and multi-page layout.',
    problem: 'The restaurant needed a digital presence to showcase their diverse menu and premium dining experience to customers.',
    approach: 'Built a responsive multi-page website focusing on high-quality visuals, smooth scroll animations, and clear calls-to-action for the menu and contact information.',
    features: [
      ['Animated UI', 'Scroll-driven reveals and modern hover states enhance the premium feel.'],
      ['Multi-page Structure', 'Dedicated sections for Home, Menu, About, and Contact for easy navigation.'],
      ['Responsive Design', 'Optimized for mobile devices to allow customers to easily view the menu on the go.']
    ],
    outcome: 'Delivered a complete digital storefront for the restaurant.',
    stack: ['HTML5', 'CSS3', 'JavaScript'],
    link: 'https://hare-krishna-nu.vercel.app/',
    github: null,
    live: true,
  },
  {
    slug: 'taste-of-punjab',
    title: 'Taste of Punjab',
    year: '2026',
    role: 'Freelance — Design & Build',
    type: 'Client Work',
    featured: false,
    image: '/projects/tasteofpunjab.webp',
    images: ['/projects/tasteofpunjab.webp'],
    description: 'Interactive Digital QR Menu with category tabs and fast vanilla JS rendering.',
    problem: 'The restaurant required a fast, easy-to-use digital menu accessible via QR code without requiring app downloads.',
    approach: 'Developed a lightweight single-page application using vanilla JavaScript for instant load times. Features a dual-tab navigation system for easy browsing of a large menu.',
    features: [
      ['Zero-dependency SPA', 'Built entirely with vanilla HTML/CSS/JS for maximum performance and minimal load time.'],
      ['Dual-tab Navigation', 'Super tabs (Starters, Mains, etc.) and sub-category pills make browsing extensive menus effortless.'],
      ['Dynamic Rendering', 'Menu data is loaded dynamically, making it easy to update prices and items without touching HTML.']
    ],
    outcome: 'Provided a seamless digital menu experience for dine-in customers.',
    stack: ['HTML5', 'CSS3', 'JavaScript'],
    link: 'https://taste-of-punjab-silk.vercel.app/',
    github: null,
    live: true,
  },
];

export const selectedWork = selectedWorkRaw.map((p, i) => ({
  ...p,
  num: String(i + 1).padStart(2, '0'),
  stackLine: p.stack.join(' · '),
}));

export const getProjectBySlug = (slug) => selectedWork.find((p) => p.slug === slug);

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
  },
  {
    company: 'HARE KRISHNA RESTAURANT',
    role: 'FREELANCE / CONTRACT DEVELOPER',
    location: 'Remote',
    projects: [
      {
        name: 'RESTAURANT WEBSITE',
        description: 'Designed and built a modern, responsive website with scroll-driven animations and a digital menu showcase.',
        stack: ['HTML5', 'CSS3', 'JavaScript'],
      }
    ]
  },
  {
    company: 'TASTE OF PUNJAB',
    role: 'FREELANCE / CONTRACT DEVELOPER',
    location: 'Remote',
    projects: [
      {
        name: 'DIGITAL QR MENU',
        description: 'Developed a high-performance, zero-dependency digital menu application with interactive categorization and fast rendering.',
        stack: ['HTML5', 'CSS3', 'JavaScript'],
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

/* ─── Featured projects (legacy card data — kept for components that still use it) ─── */
export const projects = selectedWork.map((p) => ({
  title: p.title,
  description: p.description,
  stack: p.stack,
  link: p.link,
  github: p.github,
  image: p.image,
}));
