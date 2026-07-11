export const blogPosts = [
  {
    slug: 'esp32-smart-ac',
    title: 'I Made My Dumb AC Smart for ₹600 (and Learned to Respect Hardware)',
    date: '2026-07-11',
    readTime: '7 min read',
    tags: ['ESP32', 'Hardware', 'IoT'],
    excerpt: 'How I turned a basic Samsung split AC into a phone-controlled, scheduling, energy-tracking smart AC with a single ESP32 and an IR LED — including the MOSFET-vs-transistor bug that nearly ended the project.',
    content: `
My AC is not smart. It's a perfectly good Samsung split unit, but its entire intelligence lives in a plastic remote that I lose behind the couch at least twice a week. Every summer I have the same thought walking home in 40°C heat: why can't I just tell it to start cooling before I get there?

Flagship smart ACs can do that. Mine cost a fraction of theirs and it's not going anywhere for years. So this year I stopped wishing and decided to bolt the intelligence on myself — for the price of a couple of pizzas.

## The Itch, and a Naive Plan

The whole idea rests on one boring fact: my AC already has a wireless interface. It's called the infrared remote. If I could get a microcontroller to speak IR, I could impersonate the remote and command the AC from anything on my Wi-Fi.

So I bought the cheapest parts that could possibly work: an ESP32 DevKit v1, one IR transmitter, and a handful of jumper wires, resistors, and transistors.

The plan in my head was textbook. A GPIO pin can only push a few milliamps, and I wanted range, so I'd drive the IR LED through a transistor: pin toggles the transistor, transistor switches the higher current through the LED, LED blasts IR at the AC. Clean. Standard. What could go wrong?

## The Failure I Want to Warn You About

I wired it all up, flashed firmware that sent a Samsung "power on" frame, and pointed it at the AC.

Nothing. No beep, no cold air, no blinking anything — IR is invisible, so I couldn't even see whether the LED was firing. I did what everyone does: checked the code, the pin number, the resistor, re-flashed, swapped jumpers, aimed a phone camera at the LED to catch the faint IR flicker. It stayed dark. Hours went by. I started wondering if I'd fried the pin.

The culprit was sitting in my hand the whole time. The little three-legged part I'd grabbed as my "transistor" was actually a MOSFET, not the NPN transistor my circuit assumed. They look nearly identical, but they switch on completely different principles — a bipolar transistor is current-driven through its base, a MOSFET is voltage-driven through its gate — and their pinouts don't line up. My circuit was feeding the right signal to the wrong kind of pin. The LED never stood a chance.

That's the emotional low point of every hardware project, and if you build anything physical you will meet it: the bug isn't in your code, it's in your assumptions about a component you never thought to question.

## The Breakthrough: Stop Being Clever

Once I understood the problem, I could have sourced the correct transistor and rebuilt the driver stage. Instead I asked a simpler question: do I even need the driver?

The AC sits in the same room as the ESP32. I didn't need whole-house range — I needed to reliably hit a receiver window ten feet away. So I ripped out the transistor entirely and wired the IR LED straight to the ESP32 through a single current-limiting resistor. I rewrote the firmware around that direct connection, flashed it, and pointed it at the AC one more time.

Beep. The AC turned on.

I have rarely been that happy about a single beep. The whole system — Wi-Fi, IR protocol, the AC's decoder — worked end to end. Fewer parts, less to go wrong, and plenty of range for a same-room mount. Sometimes the senior-engineer move is to delete the sophisticated thing you were proud of.

## From Blinking an LED to an Actual Product

Getting the AC to respond was the hard 20%. The fun 80% was turning "I can send one command" into something I'd actually want to use every day. I paired with Claude Code for the build — I made the accounts, designed the UI, and decided which features mattered; it did a lot of the heavy lifting on firmware and integrations, which let me spend my attention on product decisions instead of boilerplate.

What came out the other side is a web app that runs on the ESP32 itself, served over local Wi-Fi with no cloud in the middle:

- **Full control** — power, temperature, mode, and fan, plus one-tap presets
- **Countdown timers** — "off in 45 minutes"
- **Weekly schedules** — "on at 24° cool, 10 PM, weeknights"
- **Multi-step programs** — sleep curves like 60 min at 24° then 25° then 26° then off
- **A live 24-hour cost timeline** that projects when the AC switches and what it costs
- **30 days of energy and cost stats** in kWh and rupees
- **Filter reminders, safety auto-off, and optional Alexa / Google voice control**

It even installs to your phone's home screen as a PWA and works offline. That's a feature list I'd expect on an AC costing many times mine.

Two engineering ideas from this build surprised me.

**IR is write-only.** Infrared is a one-way street — the ESP32 can tell the AC what to do, but it can never read the AC's real state. So the device only ever knows what it last commanded. That single fact shapes everything downstream: the energy stats, for example, honestly track commanded on-time, not real compressor duty.

**Defer hardware work to the main loop.** The 38 kHz IR signal is bit-banged in software with microsecond timing. If a web request tried to fire IR directly from a different task mid-transmission, the waveform would shred. The rule that fixed it: web and cloud handlers only ever mutate state and raise a flag; the actual IR send happens exclusively in the Arduino loop, on one cooperative task. A clean boundary between "decide what to do" and "touch the hardware" made the whole thing reliable.

## What It Cost, and How You Can Build One

The best part: this is genuinely cheap and genuinely clonable. The whole build lands around ₹600–700 — an ESP32, an IR LED, some jumpers and resistors. You almost certainly already own the other two ingredients: a phone and a Wi-Fi router. No hub, no subscription, no vendor app, no account required.

## What Hardware Taught Me

Software fails politely — a wrong value throws a stack trace that points at the line. Hardware fails silently. A MOSFET where you wanted a transistor gives you no error, no log, just an LED that stays dark and an evening of doubting yourself.

- Verify your physical parts before you debug your code — the universe will happily let you chase a firmware bug that was never there
- Ship in layers: I set out to make one LED blink an AC awake, and earned everything else one working beep at a time
- The senior move is often deleting your cleverest idea the moment a simpler one works

Turns out the smartest thing in my smart AC was knowing when to keep the circuit dumb.
    `,
  },
  {
    slug: 'building-production-react-apps',
    title: 'What I Learned Building Production React Apps for Real Clients',
    date: '2025-06-15',
    readTime: '5 min read',
    tags: ['React', 'Freelance', 'Web Dev'],
    excerpt: 'From corporate websites to local business apps, here are the key lessons I learned shipping real React projects that actual users depend on every day.',
    content: `
## The Reality of Client Work

Building side projects is one thing. Shipping production code that real businesses depend on is something entirely different. Over the past year, I've built and deployed websites for construction companies, beauty parlours, and real estate firms — each with their own unique challenges.

## Lesson 1: Performance Matters More Than You Think

When I built the Bhumi Developers website, I quickly learned that their target audience — property buyers — often browse on mid-range phones with spotty connections. Every kilobyte matters. I switched from heavy animation libraries to CSS-only transitions where possible and saw a 40% improvement in load times.

## Lesson 2: Communication > Code

The best code in the world means nothing if the client doesn't understand what you've built. I started creating simple video walkthroughs for every milestone delivery, and client satisfaction went through the roof.

## Lesson 3: Always Build for the Handoff

Not every client has a developer on staff. I learned to structure my code with clear comments, use CMS integrations where possible, and create simple documentation for content updates.

## Key Takeaways

- Start every project with a discovery call, not a code editor
- Performance budgets should be set before writing a single line
- The best feature is the one your client actually uses
- Always leave the codebase better than you found it
    `,
  },
  {
    slug: 'ai-tools-developer-workflow',
    title: 'How I Use AI Tools in My Developer Workflow Without Losing My Edge',
    date: '2025-05-20',
    readTime: '4 min read',
    tags: ['AI', 'Productivity', 'Tools'],
    excerpt: 'AI coding assistants are everywhere. Here\'s how I integrate tools like Claude, Gemini, and Ollama into my workflow while still sharpening my core skills.',
    content: `
## The AI Integration Question

Every developer is asking the same question: how much should I rely on AI? After months of experimenting with Claude, Gemini, Whisper, and local Ollama models, I've found a balance that works.

## Where AI Shines

**Boilerplate generation** — Setting up Express routes, database schemas, and utility functions. AI handles the repetitive structure so I can focus on business logic.

**Code review** — Having an AI scan my code for edge cases and security issues before pushing to production has caught bugs I would have missed.

**Documentation** — Turning my messy code comments into proper JSDoc or README files in seconds.

## Where I Draw the Line

**Architecture decisions** — AI can suggest patterns, but understanding WHY you choose a monolith vs microservices requires experience and context it doesn't have.

**Client communication** — No AI can replace the nuance of understanding what a client actually means vs what they say.

**Debugging production issues** — When something breaks at 2 AM, you need to understand the stack trace yourself.

## My Setup

- **Claude** for complex problem-solving and code architecture
- **Gemini** for quick lookups and API exploration  
- **Ollama (local)** for sensitive client code I can't send to the cloud
- **Whisper** for transcribing client call recordings into action items
    `,
  },
  {
    slug: 'content-creation-meets-coding',
    title: 'Why Every Developer Should Try Content Creation',
    date: '2025-04-10',
    readTime: '3 min read',
    tags: ['Content', 'Career', 'Instagram'],
    excerpt: 'Running @guywithblack350 taught me more about marketing, user psychology, and audience building than any course ever could.',
    content: `
## The Unlikely Overlap

When people learn I'm both a developer and a content creator with 22M+ views, they're surprised. But the skills overlap more than you'd think.

## What Content Creation Taught Me About Development

**Understanding your audience** — On Instagram, you learn within hours if your content resonates. This mindset directly translates to building user interfaces. Every button placement, every color choice, every animation is content — and your users are the audience.

**Iteration speed** — Posting reels daily forces you to ship fast and iterate. I brought this same energy to my development work, and my clients noticed.

**Analytics thinking** — Reading Instagram insights is surprisingly similar to reading web analytics. Both tell you where users drop off, what captures attention, and what drives action.

## The Numbers That Changed My Perspective

- **22M views in 90 days** taught me that consistency beats perfection
- **3 brand collaborations** showed me how to pitch and deliver commercial value
- **4,200+ followers** proved that authentic voice matters more than production quality

## My Advice

If you're a developer, start creating content about what you build. It sharpens your communication skills, builds a personal brand, and opens doors you didn't know existed.
    `,
  },
];
