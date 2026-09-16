/**
 * Architectural, data model, and workflow diagrams extracted from the
 * canonical Marshmellow31/paymatrix-showcase repository README.md.
 */

export const paymatrixDiagrams = [
  {
    id: 'system-architecture',
    title: 'System Architecture & Hybrid Sync Pipeline',
    shortLabel: 'System Architecture',
    tag: 'Cloud & Client Topology',
    badge: 'FLOWCHART',
    summary:
      'Client-heavy PWA architecture with optimistic Redux state, offline-tolerant Firestore persistence, and server-side secret boundaries for AI and admin operations.',
    highlights: [
      'Client-heavy processing: splits and greedy debt simplification run locally in balanceEngine.js.',
      'Offline resilience: Firestore persistentLocalCache queues mutations during connectivity loss.',
      'Strict server-side secret boundary: Gemini API key resides solely in the Vercel serverless environment.',
    ],
    code: `flowchart TD
    subgraph Client["Browser / PWA (React + Redux)"]
        UI[React UI]
        RDX[Redux Store + redux-persist]
        SVC[Service Layer<br/>expense / group / friend / admin]
        ENG[balanceEngine.js<br/>splits + debt simplification]
        UI <--> RDX
        UI --> SVC
        SVC --> ENG
    end

    subgraph Firebase["Firebase"]
        FS[(Firestore)]
        AUTH[Firebase Auth<br/>Google Sign-in + Custom Claims]
        FCM[Cloud Messaging]
        CF[Cloud Functions v2]
    end

    subgraph Vercel["Vercel"]
        API[/api/scan-bill<br/>Gemini proxy/]
    end

    GEM[Google Gemini API]

    SVC -- SDK reads/writes<br/>guarded by rules --> FS
    UI --> AUTH
    SVC -- httpsCallable --> CF
    CF --> FS
    CF --> FCM
    FCM -- web push --> UI
    FS -- onDocumentCreated trigger --> CF
    UI -- base64 image --> API
    API -- API key (server-side) --> GEM`,
    notes:
      'PayMatrix delegates core mathematical and ledger calculations to the client runtime. Firestore security rules validate authorization and invariants on every write, while Cloud Functions v2 handle privileged push fan-out and rate limit counters.',
  },
  {
    id: 'data-model',
    title: 'Firestore Entity-Relationship Model',
    shortLabel: 'Data Schema (ERD)',
    tag: 'Database Architecture',
    badge: 'ER DIAGRAM',
    summary:
      'Relational document hierarchy mapped across Firestore root collections and isolated group subcollections with immutable audit logs.',
    highlights: [
      'Isolated group subcollections: expenses, settlements, and activity logs are scoped per group document.',
      'Immutable audit trail: logs subcollection enforces create-only, delete/update denied security rules.',
      'Anti-enumeration: friendCodes collection requires exact 8-character string lookups without list permissions.',
    ],
    code: `erDiagram
    USERS ||--o{ GROUPS : "member of"
    USERS ||--o{ FRIEND_REQUESTS : "sends/receives"
    USERS ||--o{ FRIEND_CODES : "owns"
    USERS ||--o{ LOG_GROUPS : "owns/member"
    GROUPS ||--o{ EXPENSES : contains
    GROUPS ||--o{ SETTLEMENTS : contains
    GROUPS ||--o{ LOGS : contains
    LOG_GROUPS ||--o{ ENTRIES : contains
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ AI_REQUESTS : logs

    USERS {
        string uid PK
        string email
        string displayName
        string upiId
        string preferredApp
        string friendCode
        array friends
        string fcmToken
        bool suspended
    }
    GROUPS {
        string id PK
        string name
        array members
        array historicalMembers
        string admin
        string createdBy
        string inviteCode
        string status
    }
    EXPENSES {
        string title
        number amount
        string paidBy
        string splitType
        array splits
        array participants
        string status
    }
    SETTLEMENTS {
        string payer
        string payee
        number amount
        string status
    }`,
    notes:
      'To ensure historical balance integrity, groups track historicalMembers so past ledgers remain mathematically consistent even if a participant leaves the active group roster.',
  },
  {
    id: 'flow-bill-scan',
    title: 'Multimodal Bill Scanning & Extraction Flow',
    shortLabel: 'Receipt Scanner Flow',
    tag: 'AI Vision Pipeline',
    badge: 'SEQUENCE',
    summary:
      'Client-side image optimization paired with a serverless Gemini Vision proxy enforcing strict structured output schemas and boundary validation.',
    highlights: [
      'On-device image downscaling: longest side capped at 1600px with 0.85 JPEG compression to minimize payload latency.',
      'Multi-photo receipt stitching: prompt guides Gemini to deduplicate overlapping items across continuous bill photos.',
      'Server-side validation: coercing numbers, date formatting, and enum restriction before database logging.',
    ],
    code: `sequenceDiagram
    participant U as User
    participant C as Client (useBillScanner)
    participant V as Vercel /api/scan-bill
    participant G as Gemini
    participant F as Firestore

    U->>C: Select receipt photo(s)
    C->>C: Downscale + JPEG compress → base64
    C->>V: POST { images[] }
    V->>G: generateContent(prompt + images, responseSchema)
    G-->>V: JSON { amount, title, date, category, items[] }
    V->>V: Validate & coerce fields
    V-->>C: Parsed receipt
    C->>F: Log ai_requests entry
    C->>U: Prefill Add-Expense form`,
    notes:
      'AI-extracted items are mapped into proportional shares during split creation. The gap between item sums and the receipt total is allocated proportionally across participating dishes as taxes and service charges.',
  },
  {
    id: 'flow-settle-up',
    title: 'Greedy Settlement & Zero-Trust UPI Protocol',
    shortLabel: 'UPI Settlement Flow',
    tag: 'Financial Settlement',
    badge: 'SEQUENCE',
    summary:
      'Min-cash-flow graph reduction collapsing multi-party debt obligations, paired with dynamic UPI QR generation that respects NPCI personal VPA risk policies.',
    highlights: [
      'O(N log N) min-cash-flow heuristic: collates net positions into maximal creditor/debtor pairs, eliminating up to 80% of transactions.',
      'QR pull vs. intent push: avoids NPCI payment failure flags triggered by third-party deep links targeting personal VPAs.',
      'Zero-trust payment boundary: app never moves money directly and treats external bank returns as unconfirmed until explicit settlement logging.',
    ],
    code: `sequenceDiagram
    participant D as Debtor
    participant A as App
    participant Cr as Creditor

    A->>A: computeGroupBalances(expenses, settlements, members)
    A->>A: simplifyDebts(balances) → minimal transactions
    A-->>D: "You owe Creditor ₹X"
    D->>A: Tap Settle
    A->>D: Render upi://pay QR (amount prefilled)
    D->>D: Scan QR in own UPI app → pays
    D->>A: Mark settled
    A->>Cr: createSettlement + push notification`,
    notes:
      'Settlement calculations are performed in integer paise with deterministic remainder distribution. A recorded settlement row re-derives live balances rather than mutating a shared aggregate counter.',
  },
  {
    id: 'flow-auth-rbac',
    title: 'Authentication & Role-Based Access Control',
    shortLabel: 'RBAC & Security Gating',
    tag: 'Security & Access Control',
    badge: 'CONTROL FLOW',
    summary:
      'Server-enforced administrative authority using cryptographically signed Firebase Auth Custom Claims, eliminating client-side bypass vulnerabilities.',
    highlights: [
      'Zero hardcoded email or UID allow-lists: claims.admin == true verified atomically in Firestore Rules and Cloud Functions.',
      'Fail-closed security design: administrative operations reject execution unless cryptographically validated at the server layer.',
      'Immutable audit logging: sensitive administrative actions generate un-modifiable records in security_logs.',
    ],
    code: `flowchart LR
    L[Google Sign-in] --> T{ID token}
    T -->|claims.admin == true| ADM[Admin console unlocked]
    T -->|no admin claim| USR[Normal user]
    ADM --> RULES{Firestore rules re-check<br/>isGlobalAdmin on every op}
    USR --> RULES`,
    notes:
      'The client admin interface is purely an ergonomics layer. Any write to rate_limits, user suspensions, or platform broadcasts requires server-side validation against verified token claims.',
  },
];
