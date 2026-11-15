/**
 * Architecture, data model and workflow diagrams for paymatrix.
 * Source of truth: the app repository's architecture notes and invariants
 * (current stack: Firebase Auth + Supabase Postgres, post-cutover Nov 2026).
 */

export const paymatrixDiagrams = [
  {
    id: 'data-model',
    title: 'Ledger Data Model',
    shortLabel: 'Data Schema (ERD)',
    tag: 'Database Architecture',
    badge: 'ER DIAGRAM',
    summary:
      'A relational ledger where every expense carries explicit payers and splits that must reconcile to the total, with an immutable audit trail and per-operation receipts.',
    highlights: [
      'Amounts are bigint paise end to end; a commit-time trigger rejects any expense whose payers, splits and total disagree.',
      'group_member_balances is maintained transactionally, and every group balance nets to zero.',
      'audit_events is append-only, and operation_receipts make retried commands idempotent.',
    ],
    code: `erDiagram
    PROFILES ||--o{ GROUP_MEMBERS : joins
    GROUPS ||--o{ GROUP_MEMBERS : has
    GROUPS ||--o{ EXPENSES : contains
    GROUPS ||--o{ SETTLEMENTS : contains
    GROUPS ||--o{ GROUP_MEMBER_BALANCES : tracks
    GROUPS ||--o{ AUDIT_EVENTS : appends
    EXPENSES ||--o{ EXPENSE_PAYERS : paid_by
    EXPENSES ||--o{ EXPENSE_SPLITS : split_into
    EXPENSES ||--o{ EXPENSE_ITEMS : itemized
    PROFILES ||--o{ OPERATION_RECEIPTS : retries
    PROFILES ||--o{ NOTIFICATIONS : receives

    EXPENSES {
        uuid id PK
        bigint amount_paise
        text split_type
        int version
    }
    EXPENSE_PAYERS {
        uuid expense_id FK
        text uid
        bigint amount_paise
    }
    EXPENSE_SPLITS {
        uuid expense_id FK
        text uid
        bigint amount_paise
    }
    SETTLEMENTS {
        uuid id PK
        text payer
        text payee
        bigint amount_paise
    }
    GROUP_MEMBER_BALANCES {
        uuid group_id FK
        text uid
        bigint net_paise
    }
    OPERATION_RECEIPTS {
        text actor
        text operation_id
        jsonb result
    }`,
    notes:
      'Simplified for display. Settlements are only ever deleted or restored, never edited, and an edit to an expense carries the version it started from so a conflict is surfaced instead of silently overwritten.',
  },
  {
    id: 'flow-bill-scan',
    title: 'Receipt Scanning Flow',
    shortLabel: 'Receipt Scanner Flow',
    tag: 'AI Vision Pipeline',
    badge: 'SEQUENCE',
    summary:
      'A bill photo is sent to Gemini once, under a server-enforced quota, and only the structured text answer is kept. The image itself is never stored.',
    highlights: [
      'Quota first: cmd.consume_scan_quota runs before any model call.',
      'No retention: no image on the device, in the database, in storage or in logs.',
      'The extracted draft fills the form; the person reviews it, and the server computes the real shares.',
    ],
    code: `sequenceDiagram
    participant U as User
    participant C as Client
    participant V as Vercel /api/scan-bill
    participant D as Postgres cmd.*
    participant G as Gemini

    U->>C: Choose up to four photos
    C->>V: POST images + Firebase token
    V->>D: consume_scan_quota
    D-->>V: allowed
    V->>G: generateContent(images, response schema)
    G-->>V: structured JSON
    V->>V: validate and coerce fields
    V-->>C: parsed bill draft
    C->>U: prefilled expense to review`,
    notes:
      'Itemized bills weight each person by their own dishes, so tax, charges and discount follow what they ate. dishes + tax + charges - discount must equal the bill total, and the same rule is implemented in SQL, JavaScript and Kotlin.',
  },
  {
    id: 'flow-settle-up',
    title: 'Settlement & UPI Handoff',
    shortLabel: 'UPI Settlement Flow',
    tag: 'Financial Settlement',
    badge: 'SEQUENCE',
    summary:
      'Balances are shown as who owes whom; settling hands off to the person’s own UPI app via QR, and a settlement is recorded only when the payer declares it.',
    highlights: [
      'A QR (upi://pay) plus copy-UPI-ID: no push deep links to personal UPI IDs, which UPI risk policy blocks.',
      'Returning from a payment app is not proof of payment, so recording requires an explicit paymentConfirmed declaration.',
      'A settlement cannot exceed what is owed (SETTLEMENT_EXCEEDS_BALANCE).',
    ],
    code: `sequenceDiagram
    participant D as Debtor
    participant A as paymatrix
    participant P as Debtor's UPI app
    participant S as Postgres cmd.*

    A-->>D: "You owe Priya ₹636.63"
    D->>A: Tap Settle
    A->>D: Show upi://pay QR + copy UPI ID
    D->>P: Pay in own bank app
    P-->>D: Payment done (outside paymatrix)
    D->>A: Confirm I paid
    A->>S: record_settlement(paymentConfirmed)
    S->>S: check amount <= owed, update balances
    S-->>A: committed + audit event + push`,
    notes:
      'paymatrix never moves money. Recording a settlement is a declaration by the payer that counts as soon as it is committed, and it is audited like every other ledger change.',
  },
  {
    id: 'flow-auth-rbac',
    title: 'Identity & Access Control',
    shortLabel: 'RBAC & Security Gating',
    tag: 'Security & Access Control',
    badge: 'CONTROL FLOW',
    summary:
      'Firebase proves who you are; Postgres decides what you may do. Each command re-checks the verified subject and group membership itself.',
    highlights: [
      'Third-party auth: Supabase validates the Firebase JWT, and the subject becomes app.uid().',
      'Every cmd.* function checks verification and membership; profiles are visible only to self, co-members and friends.',
      'The admin console is limited to named owners in ops.owner_identity and needs a recent Google sign-in.',
    ],
    code: `flowchart LR
    L[Firebase sign-in] --> T{ID token}
    T --> J[Supabase validates JWT]
    J --> C[cmd.* function]
    C --> V{verified user?}
    V -- no --> X[NOT_AUTHENTICATED / EMAIL_NOT_VERIFIED]
    V -- yes --> M{group member?}
    M -- no --> N[NOT_AUTHORIZED]
    M -- yes --> OK[run command in one transaction]
    T --> A{admin console?}
    A -- owner uid + email + fresh Google sign-in --> ADM[adm_enter passes]
    A -- anyone else --> N`,
    notes:
      'The admin screen is only an ergonomics layer: every cmd.adm_* function starts with app.adm_enter, and refusals are returned rather than raised so their log line survives.',
  },
];
