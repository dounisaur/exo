# Handoff: EXΩ — "Cobalt" redesign (venue discovery)

## Overview
This is a visual redesign of the EXΩ venue-discovery app (travellers browsing cafés, restaurants, bars and attractions). It re-skins the existing product in a "Cobalt" system (deep-cobalt header, indigo / blue / orange accents) and reorganises the desktop view into a **list · map · detail** three-column layout. It uses **only the fields/actions that already exist in the live app** — nothing invented — plus one intentional placeholder (`About`) that the team plans to add later.

## About the Design Files
The files in this bundle (`EXO Cobalt.dc.html`, `ios-frame.jsx`, `support.js`) are **design references created in HTML** — a prototype showing the intended look, layout and behaviour. **They are not production code to copy directly.** `*.dc.html` is a streaming-component prototype format used by the design tool; `support.js` is only the prototype runtime and `ios-frame.jsx` only draws an iPhone bezel for the mobile mockups — **none of these belong in the real codebase.**

The task is to **recreate these designs inside the EXΩ codebase's existing environment** (its current framework, component library, router, state and map stack) using its established patterns. If the relevant screens don't exist yet, build them in whatever framework the app already uses; if there is genuinely no environment yet, pick the most appropriate one for a map-driven web app (e.g. React + Vite + Leaflet) and implement there.

### How to open the prototype
Open `EXO Cobalt.dc.html` in a browser (it loads `support.js` from the same folder). It contains **four** mockups stacked vertically: Desktop Discovery, Desktop Venue Detail, Mobile Discovery, Mobile Venue Detail.

## Fidelity
**High-fidelity.** Colours, typography, spacing, radii and copy are final and should be matched. The one exception is the `About` block, which is deliberately an empty `COMING SOON` placeholder. Phone numbers behind **Call** are placeholders (`+30 210 …`) because the live app exposes a Call button but no visible number — wire these to the real numbers from your data.

---

## Screens / Views

### 1. Desktop Discovery — list · map · detail (1280 × 820)
**Purpose:** Browse venues, see them on a map, and read the selected venue's full details + comments without leaving the page.

**Layout:** A rounded app frame, `flex column`.
- **Top bar** — height 64px, background `#1e3a8a`, `space-between`. Left: logo `🍴 EXΩ 🍷` (white, 21px/800). Right: `Login` (`#dbe2f5`, 14px/600).
- **Body** — `flex row`, three columns:
  1. **Sidebar** — `width: 392px`, `border-right: 1px solid #e7eaf4`, background `#fafbff`.
     - Header (padding 18px): **Plan My Itinerary** (full-width indigo button) + **Filters** (orange pill button with a ⌄ chevron).
     - Scrollable venue list. The **selected** card is solid orange `#f5841f` with white text; **unselected** cards are white with a `#e7eaf4` border. Each card: venue name (16px/700) + `★ rating` on the right, then a row of category pill · price · hours.
  2. **Map** — `flex: 1` (≈500px wide), background `#eef1f8` with a faint cobalt grid (`linear-gradient(rgba(30,58,138,.05) 1px, transparent 1px)`, 46px). Pins: the selected venue = orange dot `#f5841f` with a cobalt label chip; other venues = blue dots `#1e40af` with white label chips. A zoom `+ / −` control sits bottom-left. *(In production this is the real Leaflet/OpenStreetMap map — see Assets.)*
  3. **Detail panel** — `width: 384px`, `flex: none`, `border-left: 1px solid #e7eaf4`, white, vertically scrollable. Shows the selected venue (see "Venue detail content" below).

### 2. Desktop Venue Detail — full page
**Purpose:** A dedicated page for one venue (reached via a card / "View").
**Layout:** Top bar (same as above) → breadcrumb row (`‹ Back to list / <Venue>`, height 54px, bottom border) → body `flex row, gap 30px, padding 28px`:
- **Left column** (`flex: 1.5`): venue name (30px/700), category pill, info rows (price/city/address/hours), star rating, action buttons (Call, Directions, Hide map, Start Here), `About` block, `Comments (n)`.
- **Right column** (`width: 380px`): the **map** (embedded), an **info card** listing Address / Hours / Price / City, and a full-width indigo **Start Here** button.

### 3. Mobile Discovery (iOS, 402 × 874)
**Purpose:** Same discovery flow on phone.
**Layout:** Cobalt header (logo + Login) → **Plan My Itinerary** + **Filters** → map fills the body with pins → a **bottom sheet** (white, top radius 24px, drag handle) titled `n places` containing the same venue cards (selected = orange).

### 4. Mobile Venue Detail (iOS)
**Layout:** Cobalt header with a `‹` back chevron + venue name → scrollable content: category pill, info rows, rating, actions (Call, Directions, comment, Start Here), `About`, embedded map, `Comments (n)`.

### Venue detail content (shared by the detail panel / detail page)
In order: **Name** → **category pill** → **info rows** (💵 price · 🏢 city · 📍 address · 🕐 hours, each a small line-icon + text) → **star rating + number** → **action buttons** → **About** (`COMING SOON` placeholder + italic muted line) → **Comments (n)** (each comment = grey rounded card with the comment text and a date — no author, avatar or rating).

---

## Interactions & Behavior
- **Card / pin select:** clicking a list card or a map pin selects that venue → card turns orange, map centres/affords that pin, the detail panel updates. (The prototype is static; implement this selection state.)
- **Call:** `<a href="tel:+30210...">` — initiates a phone call. Use the venue's real phone number.
- **Directions:** opens maps in a new tab — `https://www.google.com/maps/dir/?api=1&destination=<URL-encoded address>` (`target="_blank" rel="noopener"`).
- **View / Hide map:** toggles the venue's inline map (Leaflet) — label flips between `View` and `Hide`.
- **Comment count (💬 n):** opens/expands that venue's comments.
- **Start Here:** adds the venue as the starting point of an itinerary.
- **Plan My Itinerary:** opens the itinerary builder.
- **Filters:** dropdown of category/price/etc. filters over the list + map.
- **Login:** auth entry point.
- **Responsive:** desktop = 3 columns; below ~900px collapse to the mobile pattern (header → controls → map → bottom-sheet list; detail becomes its own view).

## State Management
- `venues: Venue[]` — fetched list.
- `selectedVenueId` — drives sidebar highlight, map focus, detail panel.
- `filters` — active Filters selection.
- `itinerary: Venue[]` — built via Start Here / Plan My Itinerary.
- `expandedMap` / `expandedComments` per venue (mobile/feed inline toggles).
- `Venue` shape: `{ id, name, category, price, city, address, hours, rating, lat, lng, phone, comments: { text, date }[] }`.

## Design Tokens

### Colors
| Token | Hex | Usage |
|---|---|---|
| Cobalt (header) | `#1e3a8a` | Top bar / mobile header, selected pin label |
| Indigo | `#4f46e5` | Plan My Itinerary, Start Here |
| Blue | `#2563eb` | View/Hide, comment button, category-pill text, links |
| Blue (deep) | `#1e40af` | Map pins, breadcrumb link, secondary blue |
| Orange | `#f5841f` | Filters, selected/featured card, selected pin |
| Gray (button) | `#eef0f4` | Call / Directions buttons |
| Green | `#16a34a` | Price (`$`, `$$`, `$$$`) |
| Star gold / empty | `#f5b50a` / `#d8dce5` | Rating stars |
| Ink | `#15224a` | Headings / primary text |
| Body / muted | `#3f4660`, `#5d6584`, `#6a7191`, `#9097b3` | Secondary text |
| Category pill | bg `#eaf1ff`, text `#2563eb` | Category tag |
| Card border / divider | `#e7eaf4` / `#eef0f6` | Borders, hairlines |
| App bg / sidebar / map | `#eef0f3` / `#fafbff` / `#eef1f8` | Backgrounds |
| Comment bg | `#f6f7fa` | Comment cards |
| White | `#ffffff` | Cards, detail panel |

### Typography
- **Display/UI font:** `Hanken Grotesk` (weights 400/500/600/700/800).
- **Mono labels:** `JetBrains Mono` (400/500) — used for the tiny uppercase section labels and the `COMING SOON` chip (≈10–12px, letter-spacing .08–.22em, uppercase).
- Scale: page H1 30px/700/-0.02em · detail card name 22px/700 · list card name 16px/700 · info rows 13.5–15px · ratings 16–19px · comment text 13.5–14px.

### Radius
- Frame 22px · cards 16–18px · buttons 10–12px · pills/`tel`/`directions` chips 100px · map controls 12px.

### Shadow
- Card: `0 6px 20px -12px rgba(21,34,74,.3)`
- Orange CTA / featured: `0 10px 20px -10px rgba(245,132,31,.55)`
- Indigo CTA: `0 12px 24px -14px rgba(79,70,229,.65)`
- Detail/floating elevation: `0 24px 50px -20px rgba(21,34,74,.3)`

### Spacing
- Card padding 14–24px · column gaps 30px (desktop body) · info-row vertical gap 7–9px · button padding 10–14px.

## Assets
- **Logo:** wordmark `EXΩ` flanked by the 🍴 (fork-and-knife) and 🍷 (wine) emoji — replace with your real logo asset if you have one.
- **Icons:** simple inline-SVG line icons (phone, map-pin, clock, building, wallet, speech-bubble, chevron). Swap for your icon library (Lucide/Heroicons etc.).
- **Map:** the live app uses **Leaflet + OpenStreetMap** tiles. The detail mockups embed a real OSM map via `https://www.openstreetmap.org/export/embed.html?bbox=…&marker=…`; reproduce with `leaflet` / `react-leaflet` + OSM tiles and a marker per venue.
- **Fonts:** Hanken Grotesk + JetBrains Mono (Google Fonts).
- No raster images are used — venues have **no photos** in the current app (don't add a photo gallery).

## Files
- `EXO Cobalt.dc.html` — the four mockups (Desktop Discovery, Desktop Detail, Mobile Discovery, Mobile Detail). **Reference only.**
- `ios-frame.jsx` — iPhone bezel used only to frame the mobile mockups. **Not for production.**
- `support.js` — prototype runtime so the HTML opens in a browser. **Not for production.**
