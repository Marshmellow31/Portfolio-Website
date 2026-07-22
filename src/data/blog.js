export const blogPosts = [
  {
    slug: 'custom-roms-android-modding',
    title: 'Pixel OS on Redmi Note 10 Pro Max: How Custom ROMs Shaped My Path Into Computer Science',
    date: '2026-07-22',
    readTime: '6 min read',
    tags: ['Android', 'Custom ROMs', 'Pixel OS', 'Xiaomi'],
    excerpt: 'How flashing custom ROMs on a Redmi Note 4 and Redmi Note 10 Pro Max — now running Pixel OS on Android 16 — sparked my love for computer science, plus a full guide to unlocking the bootloader, installing TWRP, and flashing Pixel OS yourself.',
    hasGuide: true,
    guideLabel: 'Read the Full Installation Guide',
    guideContent: `
## Installation Guide — Redmi Note 10 Pro Max (and Mi Devices)

This is the general process for putting Pixel OS on the Redmi Note 10 Pro / Pro Max, codenamed **sweet** (Note 10 Pro Max is specifically **sweetin**). The same skeleton — unlock, recovery, flash — applies to almost any Xiaomi/Mi device; only the file names and codename change.

**Read this fully before you start.** This voids your warranty and wipes your phone. Do not attempt it on your only device, and do not skip the backup step.

## Prerequisites

- **Backup everything.** Bootloader unlocking and flashing both wipe internal storage. Photos, app data, everything — get it off the device first.
- A PC with **ADB and Fastboot** platform-tools installed, plus Xiaomi's official USB drivers.
- The device charged to at least **60%** — an unlock or flash that dies mid-way from a dead battery can brick the phone.
- **USB debugging** and **OEM unlocking** enabled under Developer Options (unlock Developer Options first: Settings → About phone → tap MIUI version 7 times).
- A Mi Account, bound to the device under Developer Options → Mi Unlock status.
- The **Mi Unlock Tool** (miflash_unlock.exe) from Xiaomi.
- The **PixelOS build for your device** from [pixelos.net/download/sweet](https://pixelos.net/download/sweet), plus the matching **recovery zip** from the same page.
- A custom recovery — **TWRP** for sweet/sweetin is available at [twrp.me/xiaomi/xiaomiredminote10pro.html](https://twrp.me/xiaomi/xiaomiredminote10pro.html).

## Step 1 — Unlock the Bootloader

**This is the slow part, and it's Xiaomi's doing, not yours.** After you bind your Mi Account and request an unlock, Xiaomi enforces a mandatory waiting period before the tool will let you proceed — historically anywhere from 168 hours (7 days) up to 360 hours or more for newer accounts, entirely at Xiaomi's discretion. Request it early and go do something else.

- Log into your Mi Account on the phone and bind it under Developer Options → Mi Unlock status.
- Power off the phone, then boot into Fastboot mode (usually Volume Down + Power).
- Connect it to your PC and open the Mi Unlock Tool.
- Log into the same Mi Account inside the tool. It will tell you if you're still in the waiting period.
- Once eligible, hit Unlock and confirm "Unlock anyway" — this wipes the device.
- Wait for "Unlocked successfully," then reboot.

## Step 2 — Flash a Custom Recovery (TWRP)

- Rename the TWRP image you downloaded to something simple, e.g. \`twrp.img\`, and place it in your platform-tools folder.
- Boot the phone into Fastboot mode and connect it to your PC.
- Run:

fastboot flash recovery twrp.img

- Immediately hold the key combo to boot straight into recovery (don't let it boot to MIUI first, or stock firmware may overwrite TWRP).
- Once inside TWRP, let it patch the system so stock ROM stops replacing the custom recovery on boot.

## Step 3 — Flash Pixel OS

Pixel OS ships with its own vendor/boot images and GApps baked in, so there's no separate Google Apps package to flash.

- Download the Pixel OS build and its matching recovery zip for **sweet/sweetin** from [pixelos.net/download/sweet](https://pixelos.net/download/sweet).
- Extract \`boot.img\`, \`vendor_boot.img\`, and \`dtbo.img\` from the recovery zip into your platform-tools folder.
- Boot to Fastboot and flash them:

fastboot flash vendor_boot vendor_boot.img
fastboot flash dtbo dtbo.img
fastboot flash boot boot.img

- Reboot into recovery: \`fastboot reboot recovery\`
- In recovery, go to **Factory Reset → Format data** (not just wipe cache — a full format is required on a clean flash, and yes, it erases internal storage again).
- Back at the recovery main menu, choose **Apply Update → Apply from ADB**, then on your PC run:

adb sideload PixelOS_sweet-*.zip

- When it finishes, reboot the phone.

## Updating to a Newer Pixel OS Build Later

You don't need to repeat the whole process for every update. Either take the OTA under Settings → System → System Updater, or boot to recovery and sideload the new zip directly — no re-formatting needed for a dirty flash.

## Warnings

- **Every step here can brick your phone if done out of order** — flashing the wrong partition, skipping the wipe, or losing power mid-flash are the most common ways it goes wrong.
- **Unlocking the bootloader trips Xiaomi's warranty flag permanently** and stops official OTA updates from MIUI.
- **Verify your exact codename before downloading anything.** Note 10 Pro is "sweet," Note 10 Pro Max is "sweetin" — grabbing the wrong device's firmware is the single most common cause of a bricked phone in these threads.
- Always download recovery/ROM files from the ROM's official page, not from random forum mirrors.
    `,
    content: `
Some people find their way into computer science through a school course or a famous programmer they admired. I found mine through a mid-range phone and a burning desire to make it run games better.

## It Started With a Redmi Note 4

When I was in 7th–8th standard, I got my first personal device: a Redmi Note 4. Like most kids with their first phone, I wanted to squeeze every drop of performance out of it — specifically for gaming. Stock MIUI wasn't cutting it, so I started digging.

That's when I discovered custom ROMs — community-built versions of Android that replace the software your phone ships with. Cleaner interfaces, better performance, newer Android versions, features the manufacturer never intended to give you. The whole modding world opened up in front of me.

## Learning by Doing (and Risking)

There was no course for this. I learned everything from YouTube — how to unlock a bootloader, how to flash TWRP (a custom recovery), how to install a ROM without turning my phone into an expensive paperweight.

Armed with a laptop, a USB cable, and more confidence than experience, I unlocked the bootloader on my Redmi Note 4 and started experimenting. I tried out numerous different ROMs, one after another, just to see what each one felt like. At one point I even had OxygenOS — OnePlus's operating system — running on my Xiaomi device. A 13-year-old flashing another manufacturer's OS onto their phone, purely out of curiosity.

Was it risky? Absolutely. One wrong step during a flash can brick a device. But here's the thing — in all these years of modding, nothing has ever gone wrong. No bricked phones, no broken hardware, nothing. Careful research before every flash paid off.

## The Redmi Note 10 Pro Max Era

In 10th standard, I upgraded to a Redmi Note 10 Pro Max — and did exactly the same thing to it. Bootloader unlocked, custom recovery installed, and a rotation of ROMs until I found the one that stuck.

That ROM is Pixel OS, and I'm still running it today. As of right now, my phone is on Android 16 — a version most flagship phones are only just receiving. It's been almost six years since I bought this device, and it still runs smooth, secure, and completely up to date.

Let me put that in perspective:

- The Redmi Note 10 Pro Max cost around ₹20,000
- A Google Pixel with a comparable software experience costs ₹70,000–80,000
- My six-year-old device delivers that flagship-level experience every single day

That's the real power of the custom ROM community — it turns yesterday's mid-ranger into today's flagship, for free.

## Why This Matters More Than the Phone

Looking back, this is one of the best things that ever happened to me in the world of software. It wasn't the primary reason I chose computer science, but it shaped who I am today in ways a classroom never could.

It taught me to be curious — to ask "what if I could change this?" instead of accepting defaults. It taught me to take calculated risks — I was willing to risk my own hardware just to try a different OS. And it taught me that the best learning happens when you're genuinely obsessed with the outcome.

I don't regret a single flash. I get to enjoy the best user experience a phone can offer, on hardware most people wrote off years ago.

## Still My Daily Driver — Even Next to an iPhone 17

Here's the part that surprises people the most: I own an iPhone 17 today, and the Redmi Note 10 Pro Max hasn't gone anywhere. It's still my secondary device, still running Pixel OS, still on Android 16.

I keep it around for exactly one reason — it lets me use the latest Android version and experience everything the newest Android release has to offer, without buying expensive flagship hardware that puts a hole in my bank account. A brand-new flagship Android phone with day-one updates costs upwards of ₹70,000–80,000. My six-year-old Redmi does the same job for the ₹20,000 I paid for it back in 10th standard, thanks entirely to the custom ROM community keeping it current.

So the iPhone handles daily life, and the modded Redmi stays my window into stock Android — proof that the itch I picked up at 13 never really left.

## Want to Try It Yourself?

I'm putting together a complete, structured installation guide — how I did it on the Redmi Note 10 Pro Max, applicable to most Mi devices — including every warning and precaution you should know before touching your bootloader. Hit the Read More button below to check it out.
    `,
  },
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
