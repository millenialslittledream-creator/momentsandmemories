# Evite Canvas Editor — Competitive Research & Build Plan

Research done 2026-06-21, prompted by a reference screenshot (canvas-style invite editor with
draggable text elements, font/color/align panel) and the app airawath.com. No code written yet —
this is research + a plan for discussion.

## 1. Who has this kind of editor

| Company | Editor type | Notes |
|---|---|---|
| **Canva** | Full free-form canvas | Industry gold standard. Every element freely draggable/resizable/rotatable. Huge template + sticker library. No RSVP/guest tools — just makes images/PDFs. |
| **Adobe Express** | Full free-form canvas (Canva-like) | Same league as Canva, tighter Adobe asset/font integration, AI background tools. |
| **Paperless Post** | Semi-free-form, template-anchored | High-end editorial look. Built-in RSVP tracking + guest messaging + email delivery baked into the platform — design AND distribution in one place. |
| **Greenvelope** | Template-based, lighter customization | Matching digital envelopes/liners (a little "unwrapping" animation). Polished but you're picking from preset designs, not building freely. Pricing scales with guest count (~$30+/event). |
| **Zola** | Template-based, step-by-step flow | Drag-and-drop but guided (template → personalize → delivery → guest list). Mobile-preview vs print-preview toggle. Monograms, animations, music embeds. Tied into Zola's broader registry/wedding-site ecosystem. |
| **RSVPify** | Drag-and-drop **event page** builder, not really a card editor | Strongest at guest management (ticketing, custom RSVP forms, meal choice, plus-ones) — design is secondary to them. |
| **DesiEvite / Vinvite / Selfanimate / WedMeGood Invites** (India-specific) | Mostly fixed-template + fill-in-the-blank | Ceremony-specific categories (mehendi, haldi, sangeet, muhurtham, half-saree), regional variants (Rajasthani, Bengali, South Indian, Punjabi). Video-invite formats are common here. **This tier is roughly where momentsandmemories is today** — same maturity level, same gap (no free-form editing). |
| **airawath.com** | Unknown/unindexed | Not findable via search — likely a small or very new player. Worth treating as "one data point," not a benchmark of an established market leader. |

## 2. What each one is actually known for (the differentiator, not just the editor)

- **Canva** — total creative freedom + the biggest asset library. Weakness: zero event/RSVP features, it's a pure design tool.
- **Adobe Express** — same tier as Canva, wins on premium stock assets and AI tools.
- **Paperless Post** — the only one that combines an elegant editor *and* full send/RSVP/guest-messaging pipeline in one product. Closest to what momentsandmemories is trying to be.
- **Greenvelope** — the "tactile digital" feel (envelope/liner/unwrap animation) is its signature, not raw editing power.
- **Zola** — deep personalization (monograms, music, animation) but inside a guided flow, not a free canvas. Strength is that it's part of a bigger wedding-planning ecosystem (registry, website, guest list) — same direction momentsandmemories is headed.
- **RSVPify** — best guest-management/ticketing forms in the category; weakest on visual design freedom.
- **India-specific apps** — differentiate on *ceremony coverage* (multi-event Indian wedding structures: haldi/mehendi/sangeet/reception) and regional design libraries, not on editor sophistication. This is the actual competitive set for momentsandmemories' audience, and it's the one with the most room to differentiate, since none of them currently combine deep regional templates *with* a real free-form editor.

## 3. Engineering approach — how to avoid debugging hell

Hand-rolling this on raw **Fabric.js** is the path most likely to cause pain — confirmed via
research, not just guesswork: Fabric.js has long-standing, repeatedly-reported memory-leak issues
(`loadFromJSON` ballooning to 1GB+ per canvas, removed objects not being garbage collected,
multiple open GitHub issues going back years). It also has no official React bindings, so you'd be
gluing it to React state yourself.

**Konva.js** (with official `react-konva` bindings) is the better from-scratch option: multi-layer
canvas architecture, dirty-rectangle rendering (only repaints what changed), built with
React/Vue/Svelte/Angular bindings out of the box. Still, you build the entire property panel,
sticker library, and template-schema logic yourself.

**Polotno** (polotno.com) is a third option worth evaluating before building anything: it's a
commercial SDK *specifically* built for "let users edit canvas designs inside your app" — it
already ships the canvas engine, the drag/resize/rotate/lock/duplicate/layer behavior, the
text/image/shape/sticker side panel (visibly very close to what's in your reference screenshot),
a JSON design schema, and PNG/PDF export. It exists precisely to skip the class of bugs Fabric.js
is known for.

**Recommendation**: evaluate Polotno's pricing/license terms first. If it fits the budget, it
removes most of the "debugging issues" risk by outsourcing the hard canvas-engineering work. If
licensing rules it out, build on Konva.js + react-konva rather than raw Fabric.js.

## 4. Plan (no code yet — for discussion)

**Phase 0 — Decide build vs. buy**
- Evaluate Polotno SDK pricing/license for a commercial wedding app
- Decision: Polotno (faster, paid) vs. Konva.js DIY (free, slower, more long-term maintenance)

**Phase 1 — Data model change**
- Current templates (`src/data/eviteTemplates.ts`, `TemplateRenderer.tsx`) use fixed text slots
- New model needed: array of positioned elements (type, x, y, width, height, rotation, font,
  color, align, z-index) per template
- Decide: migrate all existing templates to the new schema at once, or run fixed-layout (old) and
  free-form (new) templates side by side during rollout

**Phase 2 — Pilot on ONE template**
- Build the canvas + property panel (font/color/align) against a single existing template
- Validate touch/mobile drag behavior specifically — your guests/hosts are mobile-first (per the
  QR-import flow already built), so this needs to work well on small touchscreens, not just desktop

**Phase 3 — Expand**
- Sticker/shape/background asset library
- Layering controls (trash/layers/lock/rotate/duplicate — visible in the reference screenshot)
- Roll out to remaining templates

**Phase 4 — Export pipeline**
- Make sure the final rendered design (the static image baked into the actual sent invite/QR)
  matches what the host saw in the live editor exactly — "looks right in the editor, wrong in the
  exported image" is a very common bug class in this kind of feature, worth testing for explicitly
  rather than discovering after launch
