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
    link: 'https://ascend-iota-lac.vercel.app/',
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
    description: 'Pickleball venue & restaurant'
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
    description: 'Staff attendance for Mann Beauty Studio'
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
  },
  {
    image: '/projects/counter-uas-research-white.webp',
    link: '#projects',
    title: 'Counter-UAS Research',
    description: 'Verified swarm integrity & clearance research'
  }
];

/* ─── Internship credentials ───
   One certificate and one letter, both issued by Bhumi Developers / BD Buildcon
   LLP for the same two-month internship and both covering both websites — so
   the pair hangs off each of the two internship projects. */
export const internshipCredentials = {
  issuer: 'Bhumi Developers / BD Buildcon LLP',
  period: '19 May 2026 — 25 July 2026',
  ref: 'BD/INT/2026/001',
  signatories: 'Kiran Majmudar (Chairman & Founder) · Avik Majmudar (Director)',
  documents: [
    { label: 'Internship Certificate', href: '/credentials/bd-buildcon-internship-certificate.pdf' },
    { label: 'Letter of Recommendation', href: '/credentials/bd-buildcon-letter-of-recommendation.pdf' },
  ],
};

/* ─── Selected Work — monochrome redesign, one case study per project ───
   Each entry drives both the /projects list and the /projects/:slug page. */
const selectedWorkRaw = [
  {
    slug: 'gps-spoofing-research',
    group: 'research',
    weight: 'feature',
    title: 'Counter-UAS Research',
    year: '2026',
    role: 'Research · UAV Security',
    type: 'Research Project',
    image: '/projects/counter-uas-research-white.webp',
    images: ['/projects/counter-uas-research-white.webp'],
    description: 'Abstract—This project presents RAC-SRPL for detecting formation-preserving GNSS spoofing through randomized authenticated anchor audits, and VERGE-CUAS for uncertainty-aware, collision-conscious clearance of partially responsive drone swarms. Seeded position-domain simulations provide reproducible evidence; hardware validation remains future work.',
    problem: 'A coordinated GNSS spoofing attack can move an entire drone swarm while preserving pairwise distances, so relative range checks still look normal. Even a fixed audited leader can become a blind spot: rotate the formation around that sentinel and the leader remains unchanged while the rest of the swarm drifts toward sensitive airspace.',
    approach: 'The research now has two reproducible tracks in one GitHub package. RAC-SRPL detects and bounds absolute swarm displacement with sparse randomized authenticated ground-anchor challenges, then only permits recovery when the Swarm Rigid-Transform Protection Level is finite. VERGE-CUAS models the defensive side: bounded control nudges responsive intruders toward verified exits, identifies resistant members, and issues clearance only when the full protected zone is certified under uncertainty and packet loss.',
    features: [
      ['Formation-preserving threat model', 'Shows why pairwise inter-UAV ranging cannot observe a common rigid translation or rotation of the swarm.'],
      ['Fixed-sentinel blind spot', 'Constructs the case where a permanently audited leader stays unchanged while the rest of the formation rotates around it.'],
      ['Randomized anchor challenges', 'Selects both the audited swarm member and anchor subset unpredictably, then compares GNSS against surveyed-anchor position estimates.'],
      ['SRPL-gated recovery', 'Computes an absolute Swarm Rigid-Transform Protection Level and treats it as infinite until the audit history makes the transform observable.'],
      ['Reproducible RAC-SRPL evidence', 'Position-domain Monte Carlo results report random-member auditing detecting rigid attacks that relative-only and fixed-sentinel checks miss.'],
      ['VERGE-CUAS clearance simulator', 'Models risk-aware eviction of responsive drones from a protected zone while preserving separation and flagging resistant members.'],
      ['7,100 seeded VERGE-CUAS trials', 'Includes main comparisons, ablations, and sensitivity sweeps; the strongest result is the verification layer, while static route-risk assignment is reported as mixed.'],
      ['Safety-first validation boundary', 'The package stays in simulation, recorded data, cabled RF, or shielded-test territory and does not provide RF spoofing or jamming instructions.'],
    ],
    outcome: 'The latest repository packages two IEEE-style research manuscripts and reproducibility materials. RAC-SRPL contributes a randomized anchor-audit detector and absolute swarm protection bound for formation-preserving GNSS spoofing. VERGE-CUAS contributes a verifiable clearance simulator whose completed computational study covers 7,100 deterministic seeded trials. The repo is explicit that these are position-domain simulations, with hardware-in-the-loop testing, calibrated tracking errors, institutional approval, and independent review still required before publication or deployment claims.',
    stack: ['Python', 'NumPy', 'pandas', 'Matplotlib', 'LaTeX', 'Monte Carlo simulation'],
    link: null,
    github: 'https://github.com/Marshmellow31/counter-uas-research',
    paper: '/verge-cuas-ieee-paper.pdf',
    live: false,
    statusLabel: 'RESEARCH',
  },
  {
    slug: 'paymatrix',
    group: 'product',
    weight: 'feature',
    title: 'PayMatrix',
    year: '2026',
    role: 'Design · Full-Stack · AI',
    type: 'Personal Product',
    /* 1200×630 JPEG cut from the hero frame — the social card. The old square
       logo was being centre-cropped to ribbons by summary_large_image. */
    image: '/projects/paymatrix/01-hero-og.jpg',
    /* Card-carousel slides — small WebP derivatives, hero first. */
    images: [
      '/projects/paymatrix/01-hero-960.webp',
      '/projects/paymatrix/02-scan-640.webp',
      '/projects/paymatrix/03-split-640.webp',
      '/projects/paymatrix/04-balances-640.webp',
      '/projects/paymatrix/05-upi-640.webp',
    ],
    /* Designed case-study frames. Each one already carries its own headline,
       body copy and callout labels, so the page renders them edge to edge and
       does not repeat that text in markup — the `sr` strings exist only
       because the callouts inside a raster image aren't machine readable. */
    frames: {
      hero: {
        id: '/projects/paymatrix/01-hero',
        ratio: '16 / 10',
        alt: 'PayMatrix case study title card — "Splitting bills with friends shouldn\'t feel like accounting" beside an iPhone showing the dashboard with a ₹10,940.59 balance card, debt and pending-returns tiles, and Goa Trip and Flat 402 settlements.',
      },
      sections: [
        {
          id: '/projects/paymatrix/02-scan',
          alt: 'PayMatrix bill scanner extracting seven line items and ₹660 of tax from a ₹4,860 restaurant receipt into a review-and-fill form.',
          sr: 'AI bill scanning. One Gemini Vision call returns total, merchant, date and category as structured JSON — no manual typing anywhere in the flow. Every dish comes back with its own price, which is what makes the itemized split possible. Items total ₹4,200 against a ₹4,860 bill, and the ₹660 gap is captured as shared tax and charges.',
        },
        {
          id: '/projects/paymatrix/03-split',
          alt: 'PayMatrix assigning individual dishes to five named people, with a GST split mode distributing ₹660 of tax across the group.',
          sr: 'Itemized split and GST. Three split modes — equal, exact rupee amounts, or itemized — are handled by the same expense record. GST is apportioned by each person\'s dish subtotal rather than divided by head count. Excluding anyone re-runs the whole distribution instantly, and the last share absorbs rounding so totals stay exact.',
        },
        {
          id: '/projects/paymatrix/04-balances',
          alt: 'PayMatrix net-position screen for a five-person Goa trip, with a diagram collapsing ten raw obligations into two required settlements.',
          sr: 'Debt simplification. Every expense nets into one balance per person, then a greedy max-creditor / max-debtor pass pairs them off — collapsing ten raw obligations into two transfers, an 80% reduction, at O(n log n) per settlement and zero rounding drift.',
        },
        {
          id: '/projects/paymatrix/05-upi',
          alt: 'PayMatrix settle-up screen showing a ₹4,593.93 UPI payment as a scannable QR code, alongside the app\'s data-flow stack.',
          sr: 'UPI settlement. PayMatrix never touches money — it builds a signed upi://pay intent and hands it off, as a deep link into GPay, PhonePe or Paytm on Android and as a scannable QR on desktop. Marking a payment writes a settlement row, so balances always recompute from expenses plus settlements rather than from a mutable running total. The stack is React 19 and Vite as an installable PWA, Gemini Vision for receipt parsing, Firestore for real-time sync, a balance engine for greedy simplification, and the UPI intent handoff.',
        },
      ],
    },
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
    group: 'product',
    weight: 'feature',
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
    group: 'client',
    weight: 'feature',
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
    description: 'Marketing website for a pickleball venue & restaurant with premium animation and SEO.',
    problem: 'A new pickleball venue and restaurant needed to stand out in a fast-growing sports-cafe market where every competitor\'s website looks like the same template — and it needed to rank locally from day one.',
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
    credentials: internshipCredentials,
    group: 'internship',
    weight: 'feature',
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
    credentials: internshipCredentials,
    group: 'internship',
    weight: 'feature',
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
    group: 'client',
    weight: 'feature',
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
    group: 'client',
    weight: 'feature',
    title: 'Mann Beauty Studio',
    year: '2025',
    role: 'Freelance — Full-Stack',
    type: 'Client Work',
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
    group: 'client',
    weight: 'compact',
    title: 'Attendance Manager',
    year: '2025',
    role: 'Freelance — Full-Stack',
    type: 'Client Work',
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
    group: 'product',
    weight: 'feature',
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
    link: 'https://ascend-iota-lac.vercel.app/',
    github: 'https://github.com/Marshmellow31/Ascend',
    live: true,
  },
  {
    slug: 'navigator-plus',
    group: 'product',
    weight: 'feature',
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
    slug: 'blockchain-audit-system',
    group: 'academic',
    weight: 'compact',
    title: 'Blockchain Audit System',
    year: '2026',
    role: 'Full-Stack Developer · Database Design',
    type: 'Academic · DBMS',
    image: '/projects/academic/blockchain-audit.png',
    images: ['/projects/academic/blockchain-audit.png'],
    description: 'Blockchain-inspired DBMS audit dashboard with controlled transactions, hash-linked blocks, and integrity verification.',
    problem: 'A normal transaction table records the latest database state but does not make silent historical changes obvious. The academic brief called for a database-centered audit trail where tampering could be detected instead of merely logged.',
    approach: 'Built a React dashboard and Node.js backend around PostgreSQL/Supabase functions. Transactions are written through controlled operations, converted into hash-linked audit blocks, and checked by a verification function that detects a broken chain. This is a blockchain-inspired database design, not a decentralized blockchain network.',
    features: [
      ['Hash-linked audit blocks', 'Each audit block stores its own hash and the previous block hash, making historical changes detectable.'],
      ['Controlled fund transfers', 'Wallet and transfer operations validate balances before writing the transaction and its audit record.'],
      ['Database integrity checks', 'PostgreSQL functions create blocks and verify the full chain instead of leaving core rules in the interface.'],
      ['Operational dashboard', 'Wallets, transactions, blocks, fraud signals, and quick transfers are presented in one inspectable interface.'],
    ],
    outcome: 'Delivered a working academic DBMS system with a public dashboard and source repository, while keeping the blockchain claim scoped to tamper-evident database auditing.',
    stack: ['React 19', 'Node.js', 'Supabase', 'PostgreSQL'],
    link: 'https://dbms-project-2.vercel.app/dashboard',
    github: 'https://github.com/Marshmellow31/Blockchain_Audit_System',
    live: true,
  },
  {
    slug: 'airline-boarding-simulator',
    group: 'academic',
    weight: 'compact',
    title: 'Airline Boarding Simulator',
    year: '2025',
    role: 'Simulation Developer',
    type: 'Academic · OOP',
    image: '/projects/academic/airline-boarding.png',
    images: ['/projects/academic/airline-boarding.png'],
    description: 'Interactive airline operations simulator for flight selection, passenger check-in, boarding, and status tracking.',
    problem: 'A console-only airline system can demonstrate object-oriented structure, but it is difficult to see how passengers, flights, check-in states, and boarding events interact as one workflow.',
    approach: 'Presented the original C++ project concepts through a TypeScript web simulation with structured flight and passenger data, interactive controls, and a visible event log. The browser interface simulates the workflow; it does not execute the original C++ program.',
    features: [
      ['Flight operations', 'Select a flight, inspect its manifest, and move it through the boarding workflow.'],
      ['Passenger check-in', 'Manage passenger records and expose current check-in and boarding states.'],
      ['Boarding simulation', 'Run the selected flight through an interactive boarding sequence with visible state changes.'],
      ['Status and event logs', 'Track passenger state summaries and operational events as the simulation progresses.'],
    ],
    outcome: 'Turned an academic OOP exercise into a public, interactive demonstration while documenting the boundary between the C++ model and the web simulation.',
    stack: ['C++', 'TypeScript', 'React', 'Vite'],
    link: 'https://apk-6rso.vercel.app/',
    github: 'https://github.com/Marshmellow31/Airline-Boarding-System',
    live: true,
  },
  {
    slug: 'drone-no-fly-zone-simulator',
    group: 'academic',
    weight: 'compact',
    title: 'Drone No-Fly Zone Simulator',
    year: '2025',
    role: 'Simulation Developer · UAV Security',
    type: 'Academic · Simulation',
    image: '/projects/academic/drone-no-fly-zone.png',
    images: ['/projects/academic/drone-no-fly-zone.png'],
    description: 'Educational simulator for drone geofencing, restricted-airspace breaches, telemetry, and spoofing-awareness scenarios.',
    problem: 'Drone restrictions and GPS-spoofing risks are hard to understand from static diagrams alone, especially when learners cannot see telemetry and protected-zone events evolve over time.',
    approach: 'Built a browser-based, simulation-only environment with protected zones, moving drone tracks, scenario controls, telemetry, and an event log. It demonstrates geofencing and threat concepts without interacting with real drones, radio systems, or GPS signals.',
    features: [
      ['Restricted-zone visualization', 'Shows drone tracks and protected regions in one operational map.'],
      ['Scenario controls', 'Switch between normal, breach, and spoofing-awareness scenarios and adjust simulation speed.'],
      ['Live telemetry', 'Displays simulated position, altitude, speed, heading, signal strength, and battery state.'],
      ['Safety-first boundary', 'Prominently states that every action is local simulation and has no real drone or RF capability.'],
    ],
    outcome: 'Presented as an IIIT Vadodara academic project and released as a public educational demo, separate from the later Counter-UAS research work.',
    stack: ['TypeScript', 'React', 'Vite'],
    link: 'https://drone-no-fly-zone-simulator.vercel.app/',
    github: 'https://github.com/Marshmellow31/Drone-No-Fly-Zone-Simulator',
    live: true,
  },
  {
    slug: 'hare-krishna',
    group: 'client',
    weight: 'compact',
    title: 'Hare Krishna',
    year: '2026',
    role: 'Freelance — Design & Build',
    type: 'Client Work',
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
    group: 'client',
    weight: 'compact',
    title: 'Taste of Punjab',
    year: '2026',
    role: 'Freelance — Design & Build',
    type: 'Client Work',
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
  /* Tiles want a real screenshot, not a logo. `image` is still the logo mark
     for the sphere and og:image; `cover` is the first gallery shot when there
     is one, and falls back to the mark only for projects with no captures. */
  cover: p.images?.[0] || p.image,
  hasShot: Boolean(p.images?.length),
}));

export const getProjectBySlug = (slug) => selectedWork.find((p) => p.slug === slug);

/* ─── Sections for the /projects page ───
   Order here is the order on the page. Every project carries a `group` that
   points at one of these ids and a `weight` ('feature' | 'compact') that picks
   its card, so adding a project never means touching the page component. */
export const projectGroups = [
  {
    id: 'product',
    label: 'Products',
    title: 'Products I Built',
    blurb: 'Things I shipped because I wanted them to exist — hardware, AI, and apps that people other than me now use.',
  },
  {
    id: 'internship',
    label: 'Internship',
    title: 'Internship',
    blurb: 'Corporate sites shipped during my web development internship in Bharuch, Gujarat.',
  },
  {
    id: 'research',
    label: 'Research',
    title: 'Research',
    blurb: 'Published work on drone navigation security, plus the tooling built alongside it.',
  },
  {
    id: 'client',
    label: 'Client Work',
    title: 'Client & Freelance',
    blurb: 'Paid builds for real businesses: booking platforms, loyalty CRMs, marketing sites, and internal tools.',
  },
  {
    id: 'academic',
    label: 'Academic',
    title: 'Academic Projects',
    blurb: 'Coursework turned into inspectable systems across databases, object-oriented design, and simulation.',
  },
].map((g) => {
  /* `weight` no longer picks a card — every rail card is the same size — but it
     still sorts the quicker builds to the end of their section. */
  const inGroup = selectedWork
    .filter((p) => p.group === g.id)
    .sort((a, b) => (a.weight === 'compact' ? 1 : 0) - (b.weight === 'compact' ? 1 : 0));
  return {
    ...g,
    projects: inGroup,
    features: inGroup.filter((p) => p.weight !== 'compact'),
    compacts: inGroup.filter((p) => p.weight === 'compact'),
    count: inGroup.length,
  };
}).filter((g) => g.count > 0);

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
        slug: 'playhub',
      },
      {
        name: 'MARKETING WEBSITE',
        description: 'High-performance marketing website with premium animations, SEO optimization, and dynamic routing for a pickleball venue.',
        stack: ['React 19', 'React Router v7', 'Tailwind CSS', 'Framer Motion'],
        slug: 'picklerage',
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
        slug: 'bhumi-developers',
      }
    ]
  },
  {
    company: 'BD BUILDCON',
    role: 'WEB DEVELOPMENT INTERN',
    location: 'Bharuch, Gujarat',
    projects: [
      {
        name: 'BD BUILDCON PORTAL',
        description: 'Production-ready marketing site for a turnkey industrial EPC contractor. Filterable project gallery, employee portal, custom motion components.',
        stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Lenis'],
        slug: 'bd-buildcon',
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
        slug: 'mann-beauty',
      },
      {
        name: 'ATTENDANCE MANAGER',
        description: 'Secret-key protected attendance dashboard with real-time sync and CSV exports for salon staff payroll.',
        stack: ['React 19', 'Zustand', 'Firebase'],
        slug: 'attendance-manager',
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
        slug: 'hare-krishna',
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
        slug: 'taste-of-punjab',
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
