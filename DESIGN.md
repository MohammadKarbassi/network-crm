---
name: نتورک
description: A Persian-first CRM working plane; calm, dense records with one turquoise accent.
colors:
  paper: "oklch(0.992 0.002 95)"
  card-white: "oklch(1 0 0)"
  sidebar-warm: "oklch(0.972 0.003 95)"
  muted-warm: "oklch(0.965 0.003 95)"
  hover-warm: "oklch(0.955 0.004 95)"
  hairline: "oklch(0.915 0.004 95)"
  input-stroke: "oklch(0.89 0.005 95)"
  ink: "oklch(0.2 0.006 285)"
  ink-secondary: "oklch(0.5 0.008 285)"
  firouzeh: "oklch(0.5 0.095 196)"
  on-firouzeh: "oklch(0.99 0.004 196)"
  firouzeh-ring: "oklch(0.62 0.09 196)"
  firouzeh-soft: "oklch(0.95 0.03 196)"
  firouzeh-ink: "oklch(0.38 0.08 196)"
  firouzeh-selection: "oklch(0.86 0.06 196)"
  destructive: "oklch(0.56 0.19 25)"
  login-night: "oklch(0.21 0.02 220)"
typography:
  display:
    fontFamily: "Vazirmatn Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    letterSpacing: "-0.025em"
  kpi-value:
    fontFamily: "Vazirmatn Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: "32px"
    letterSpacing: "-0.025em"
    fontFeature: "\"ss01\", \"tnum\""
  title:
    fontFamily: "Vazirmatn Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "28px"
    letterSpacing: "-0.025em"
  card-title:
    fontFamily: "Vazirmatn Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.375
  body:
    fontFamily: "Vazirmatn Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    fontFeature: "\"ss01\""
  body-secondary:
    fontFamily: "Vazirmatn Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  label:
    fontFamily: "Vazirmatn Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 500
  chip:
    fontFamily: "Vazirmatn Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  nav-group:
    fontFamily: "Vazirmatn Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 500
rounded:
  inner: "6.4px"
  control: "8px"
  panel: "10px"
spacing:
  hairline-gap: "1px"
  chip-x: "8px"
  card-sm: "12px"
  column-gap: "12px"
  gutter-mobile: "16px"
  card: "16px"
  section: "20px"
  gutter-desktop: "32px"
components:
  button-primary:
    backgroundColor: "{colors.firouzeh}"
    textColor: "{colors.on-firouzeh}"
    rounded: "{rounded.control}"
    height: "32px"
    padding: "0 10px"
  button-primary-hover:
    backgroundColor: "color-mix(in oklch, oklch(0.5 0.095 196) 80%, transparent)"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "32px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "32px"
    padding: "4px 10px"
  page-toolbar:
    backgroundColor: "{colors.paper}"
    typography: "{typography.title}"
    height: "52px"
  card:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.panel}"
    padding: "{spacing.card}"
  kpi-strip:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.panel}"
    padding: "16px 20px"
  segmented:
    backgroundColor: "{colors.muted-warm}"
    rounded: "{rounded.control}"
    height: "32px"
    padding: "2px"
  segmented-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.inner}"
    typography: "{typography.body-secondary}"
  chip:
    typography: "{typography.chip}"
    rounded: "{rounded.inner}"
    height: "24px"
    padding: "0 8px"
  table-head:
    backgroundColor: "{colors.muted-warm}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.label}"
    height: "36px"
  table-row:
    typography: "{typography.body}"
    height: "44px"
  table-row-selected:
    backgroundColor: "{colors.firouzeh-soft}"
  kanban-column:
    backgroundColor: "{colors.muted-warm}"
    rounded: "{rounded.panel}"
  kanban-column-drop:
    backgroundColor: "{colors.firouzeh-soft}"
  kanban-card:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.control}"
    padding: "12px"
  nav-item:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    height: "32px"
  avatar:
    backgroundColor: "{colors.firouzeh-soft}"
    textColor: "{colors.firouzeh-ink}"
    rounded: "{rounded.inner}"
---

# Design System: نتورک

## Overview

**Creative North Star: "The Persian Ledger Desk"**

A light working plane for people who sit in front of it all day: warm, near-white paper, hairlines instead of boxes, and records that read like a precise ledger. The benchmark is Attio's craft (calm, dense, keyboard-driven), set natively in Persian RTL with Persian digits throughout. It is built on shadcn/radix controls retuned to this palette and scale, not the stock gray admin template.

Density stays high where people work (tables, kanban, KPI strip) and quiet where they read. A page has no hero. A sticky one-row toolbar comes first and the data starts right under it. One accent, Persian turquoise (firouzeh), marks what you can act on or what is selected or focused. Everything else is ink on warm neutrals.

Depth comes from tone and 1px hairlines. Nothing casts a shadow at rest, so an overlay's shadow means "this floats above your work".

**Key Characteristics:**
- Warm-neutral paper and hairlines; a single firouzeh accent.
- Compact type: Vazirmatn at 13 to 16px for UI, with Persian tabular digits.
- 8px controls, 10px panels, no resting shadows.
- Keyboard first: the ⌘K palette reaches every page and record.
- RTL native: the sidebar sits on the right, time reads right to left, and LTR islands for phones, emails and codes.

## Colors

Warm, nearly colorless neutrals (hue 95, chroma at most 0.005) with cool ink (hue 285) and one desaturated turquoise (hue 196). OKLCH in `src/app/globals.css` is canonical.

### Primary
- **Firouzeh** (`firouzeh`): the primary button, active nav icon, logo tile, chart bars and bar-list fills. Only the primary action, selection and focus use it.
- **Firouzeh Ring** (`firouzeh-ring`): the focus outline (2px, 2px offset) and sidebar ring.
- **Firouzeh Soft / Firouzeh Ink** (`firouzeh-soft`, `firouzeh-ink`): the selection pair. Selected table rows, the kanban column under a drag, avatar fallbacks and the due-tasks nav badge (on `firouzeh` at 12%).
- **Firouzeh Selection** (`firouzeh-selection`): native text `::selection`. The caret is also firouzeh.

### Neutral
- **Paper** (`paper`): the page background and the sticky toolbar (at 92% with backdrop blur).
- **Card White** (`card-white`): cards, the KPI strip, kanban cards, popovers.
- **Sidebar Warm** (`sidebar-warm`): the sidebar, one step warmer than the paper.
- **Muted Warm** (`muted-warm`): table header band (45%), kanban column bed (55%), segmented track (60%), row hover (55%).
- **Hairline** (`hairline`): every border and divider. **Input Stroke** (`input-stroke`): form field borders.
- **Ink / Ink Secondary** (`ink`, `ink-secondary`): text and secondary text, counts and meta.
- **Destructive** (`destructive`): errors and the destructive button. The button is a tinted field (10%), never solid red.
- **Login Night** (`login-night`): only the login aside and its pipeline motif.

### Semantic chip hues
Status, score, priority and stage use Tailwind's sky, violet, emerald, amber, orange, red and zinc. Chips pair a 100 tint with 800 ink. Stage dots use the 500 step. These hues never mean "brand".

### Named Rules
**The One Voice Rule.** Firouzeh is for the primary action, selection and focus. It is never decoration, a section color, or a second chart series.

**The Never Color Alone Rule.** Every colored state carries a label or number: chips print their label, the score chip prints its number and band, priority shows dot plus word, and bars print their value.

## Typography

**Body Font:** Vazirmatn Variable (with ui-sans-serif, system-ui). It is the only family, with heading and body on the same face and the `ss01` feature set on body.

**Character:** One humanist Persian sans in a tight, small scale. Hierarchy comes from weight (400/500/600) and ink tone, not size jumps.

### Hierarchy
- **Display** (700, 24px): only the login heading. The app has no display type.
- **KPI Value** (600, 26px desktop / 21px mobile, 32px line): KPI strip numbers.
- **Title** (600, 16px, 28px line): the page title in the toolbar. No in-app heading is larger.
- **Card Title** (600, 14px): card and panel headings.
- **Body** (400, 13.5px): table cells and nav items. Body-secondary (13px) is for toolbar counts and descriptions, breadcrumbs, segmented items and kanban cards.
- **Label** (500, 12.5px): table headers and KPI labels. **Chip** (500, 12px). **Nav group** (500, 11.5px).

### Named Rules
**The Persian Digits Rule.** Every number a person reads goes through `toLocaleString("fa-IR")` (or `Intl.NumberFormat("fa-IR")`) and sits in `tabular-nums`: counts, amounts (Toman), percentages, dates, badges. Phone numbers stay Latin digits inside a `dir="ltr"` island.

**The Compact Scale Rule.** UI text lives between 12 and 16px. Nothing in the authenticated app goes above 16px except KPI values.

## Layout

- **Shell:** the sidebar is on the right (`side="right"`, collapsible to icons), with the logo, the "جستجو… ⌘K" trigger, nav in three named groups, and the user footer above a hairline. On phones the sidebar becomes a sheet, and a 52px sticky mobile bar carries the menu, logo and search.
- **Content:** gutters are 16px on mobile and 32px from `md` up. Top padding is 16/24px, bottom 40px, and sections are 20px apart.
- **Toolbar first:** each page starts with the sticky page toolbar (see Components). Data begins directly below it.
- **Grids:** the dashboard pairs a fluid column with a fixed 24rem column at `lg`, with 16px gaps. The KPI strip is 2 columns, or 4 from `lg`. The kanban has six columns at a 68rem minimum with 12px gaps, and scrolls horizontally on narrow screens, bleeding to the gutters.
- **Rhythm:** controls are 32px tall (36px for `lg`, 44px for login fields and buttons), table heads 36px, rows 44px, chips 24px.

## Elevation & Depth

Flat at rest. Depth is tonal (paper, card white, muted beds) and drawn with 1px hairlines. Cards, tables, the KPI strip, kanban columns and dialogs have no resting shadow. Dialogs use a 1px ring at 10% ink.

### Shadow Vocabulary
- **Overlay** (`--shadow-overlay`: `0 1px 2px oklch(0.2 0.01 285 / 0.06), 0 8px 24px -6px oklch(0.2 0.01 285 / 0.16)`): content floating above the plane. The dragged kanban card uses it (plus a 1.5deg tilt).

### Named Rules
**The Hairline Depth Rule.** Only overlays get a shadow, and they use `shadow-overlay`. If a resting surface needs separation, give it a border or a tonal step, never a shadow.

## Shapes

Small, consistent rounding: `rounded.control` (8px) for buttons, inputs, the segmented track, kanban cards and the logo tile. `rounded.panel` (10px) for cards, the KPI strip and kanban columns. `rounded.inner` (6.4px) for things nested inside a control: chips, segmented segments, nav items and avatars. Pills (full round) are reserved for dots and the nav count badge. Borders are always 1px hairlines.

## Components

### Buttons
- **Shape:** gently rounded (8px), 32px tall, 14px medium text, 16px Lucide icons.
- **Primary:** firouzeh fill with near-white text. Hover drops to 80%. Active nudges down 1px.
- **Outline / Ghost / Secondary:** paper or transparent, hovering to the muted tone. These handle every non-primary action.
- **Destructive:** a red-tinted field (10%, 20% on hover) with red text.
- **Focus:** firouzeh ring (the global 2px outline, plus a 3px ring at 50% on controls).

### Chips
- **Style:** a 24px tinted field (100 step) with same-hue ink (800 step), 12px medium, a 6.4px radius and an inset 1px ring at 12% of the text color. Used for lead status and lead score.
- **Priority:** no field. An 8px dot plus the word, in amber or red ink (muted for low).
- **KPI delta:** a small emerald or red tinted field holding an arrow icon and a Persian percentage, followed by "نسبت به …".

### Cards / Containers
- **Corner Style:** 10px. **Background:** card white. **Border:** 1px hairline. **Shadow:** none.
- **Padding:** 16px (12px for the `sm` size). The card title is 14px semibold.

### Inputs / Fields
- **Style:** 32px tall, 8px radius, input-stroke border, transparent fill.
- **Focus:** the border turns firouzeh-ring with a 3px ring at 50%. **Error:** destructive border and ring at 20%.

### Navigation
- **Sidebar items:** 32px tall, 13.5px. Icons sit in secondary ink. The active item is semibold ink with a firouzeh icon, and hover gets the warm accent fill. Group labels are 11.5px secondary ink.
- **Search trigger:** a bordered paper field with "جستجو…" and a `kbd` showing ⌘K on Mac, Ctrl K elsewhere.

### Page Toolbar (signature)
Sticky, one row, at least 52px tall, on 92% paper with backdrop blur and a hairline bottom border. From the start side it holds an optional breadcrumb (13px, with a chevron), the 16px semibold title, a Persian count in secondary ink, and a one-line description (hidden on mobile). Actions sit on the end side. It replaces any hero block.

### KPI Strip (signature)
One 10px bordered card white strip. Cells are split by hairline dividers rather than separate cards: 2×2 with inner borders on mobile, 4 across with vertical dividers from `lg`. Each cell holds a label (12.5px), a value (26px semibold tabular) with an optional unit, and a delta chip with its comparison period.

### Segmented Control (signature)
A link-based tablist: a 32px track at 60% muted with a hairline border, 8px radius and 2px inset. Segments are 13px secondary ink. The active segment is paper with a hairline ring, medium weight and ink. The choice lives in the URL.

### Kanban (signature)
Columns are 10px beds of muted warm (no border). Each header has an 8px stage dot (sky, violet, amber, orange, emerald, or zinc for LOST), a 13px semibold stage name, a count tag on paper, and the column total in Toman below. Cards are 8px, card white with a hairline that darkens on hover, and show the title, customer, amount (semibold tabular), close date and an owner avatar. While dragging, the source card fades to 40% and a tilted overlay copy (`shadow-overlay`) follows the pointer. The column under the drag turns firouzeh-soft. Space picks up and drops; Enter opens the card.

### ⌘K Command Palette (signature)
⌘K or Ctrl K, or the sidebar trigger, opens a dialog up to 36rem wide with an RTL command list. Results come from the server after 2+ characters (180ms debounce, spinner on the end side) and are grouped as customers, leads and deals, each with a secondary-ink icon and a subtitle on the end side. A "رفتن به" group lists the nav pages, from the same `nav.ts` source as the sidebar.

### Charts
**The One Series Rule.** Charts show a single series in firouzeh with no legend, because the card title names the series. On load the bars rise once (Recharts, 160ms delay, 700ms ease-out), and the animation is off under reduced motion. Bars have a 4px top radius and are at most 24px wide. Gridlines are horizontal hairlines only. The SVG is `dir="ltr"` with a reversed x-axis, so time still reads right to left, and the y-axis sits on the right with plain Persian numbers in millions (no Persian words inside the SVG, which would flip). The tooltip content is RTL and shows the formatted Toman amount. Bar lists are plain HTML in firouzeh at 80%, and every value is printed. Their bars grow from the start edge on load (staggered 50ms), and their width eases over 500ms when the period changes.

### Login
A split view. The form side has the logo, a 24px bold title, the phone field (44px, LTR) and a 44px primary button. The `lg`+ aside is login-night with the pipeline motif: six lanes of firouzeh hairlines with faint cards, fading toward the bottom.

### Logo
A three-node network mark: an 8px-radius firouzeh tile with three near-white nodes joined by 70% strokes, followed by «نتورک» in 15px bold.

## Motion

**The One Ease Rule.** Everything that enters uses `--ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`) and moves only `transform`/`opacity` (`translate`, `scale`, `rotate`). Tokens and keyframes live in `globals.css`: `animate-rise`, `animate-grow-x`, `animate-pop`, `animate-lift`, `animate-travel`, plus the `stagger` and `strike` utilities. Tailwind only emits `@theme` keyframes that an `--animate-*` token uses, so each new keyframe gets a token.

- **Page entrance:** `(app)/template.tsx` adds `stagger` on every top-level page change. Sections rise 6px over 280ms, 40ms apart. Search-param changes (filters, period) don't replay it.
- **KPIs:** cells stagger in. The value and delta chip are keyed by value, so switching the period makes the new number rise in.
- **Kanban:** the picked-up card lifts (scale 1.02, 1.5° tilt, 160ms), cards shift aside over 200ms, and the drop settles over 220ms with the same ease.
- **Tasks:** the check mark pops in (180ms) and a strike line draws from the start edge (260ms). The server call waits 350ms so the feedback shows before the task moves to its new group.
- **AI results:** the summary and suggestion panel stagger in. New timeline entries and automation steps enter with `@starting-style` (`starting:` variant).
- **Buttons:** press is `scale(0.97)`.
- **Login (delight budget):** the lanes fade in, then one deal card hops lane by lane toward «موفق» in a 15s loop.
- **No motion:** the ⌘K palette (keyboard, many times a day) opens instantly. Hover never moves anything.
- **Reduced motion:** `--rise-y` drops to 0, and pop, grow and lift become fades. The login card is hidden, the strike is instant and Recharts doesn't animate.

## Do's and Don'ts

### Do:
- **Do** start every app page with the sticky one-row toolbar and put data directly under it.
- **Do** format every displayed number with `fa-IR` and `tabular-nums`. Keep phones, emails, OTP codes and shortcut keys in `dir="ltr"` islands.
- **Do** use logical properties (`ps`/`pe`, `ms`/`me`, `start`/`end`, `text-start`) everywhere in the RTL page. **Inside an LTR input**, position icons and padding with physical properties (`right-3`, `pr-9`), because logical `start` inside `dir="ltr"` resolves to the left.
- **Do** carry status as a tinted chip with its label, or a dot with its word. Never use color alone.
- **Do** use `shadow-overlay` for anything that floats (drag previews, popovers, menus).
- **Do** route new navigable pages through `nav.ts` so the sidebar and the ⌘K palette stay in sync.

### Don't:
- **Don't** use firouzeh for decoration, section fills, illustrations in the app, or a second data series.
- **Don't** put shadows on resting surfaces. Cards, tables, columns and dialogs separate by hairline and tone.
- **Don't** build hero blocks, oversized headings (over 16px in the app), or rows of separate KPI cards.
- **Don't** add chart legends or multi-series color sets. Charts animate only once on load; never loop, pulse or animate on hover.
- **Don't** put Persian words inside the LTR chart SVG. Format ticks as numbers and name the unit in the card title.
- **Don't** use Latin digits for counts, amounts, dates or percentages.
