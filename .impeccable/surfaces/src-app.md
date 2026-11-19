---
version: 1
slug: "src-app"
primary_target: "src/app"
related_targets: []
---

# Surface brief: whole app (redesign)

Scope: every authenticated surface plus login. Mode: Operate (login is the only lightly Persuade moment).
Audience/job: Iranian SMB sales reps and managers at a desk all day (mobile second); find the next action, update records fast, read the team's numbers.
Constraints: Persian RTL, Jalali dates, Toman, Vazirmatn; existing functions, copy and roles unchanged; shadcn/radix components stay as the control vocabulary.
Benchmark (user-pinned): Attio frontend craft and interaction quality.

## Direction contract

THESIS: A Persian Attio. Records are calm, dense, precise objects you move through by keyboard; it refuses the default shadcn admin template of gray cards, oversized headings and boxed sections.

OWN-WORLD: Light working plane (office daylight, monitor all day). Content #FCFCFB, sidebar/toolbars one step warmer #F5F5F3, 1px hairlines #E7E7E4, ink #18181B, secondary ink #6B6B70. One accent: Persian turquoise (firouzeh) for primary action, selection and focus only. Attribute chips are soft tinted fields with same-hue ink (status, stage, source, priority), never color alone. 13.5px base Vazirmatn, Persian tabular digits in data, 8px control radius, shadows only on overlays. Lucide icons 16px, 1.75 stroke. Logo: a three-node network mark.

STORY: The rep lands on today, jumps to any person or deal with ⌘K, works a record page (header, attribute rail, timeline), drags a deal, leaves. The manager reads KPIs and the team table without hunting.

FIRST VIEWPORT: App: 248px sidebar on the right (workspace mark + name, search trigger «جستجو… ⌘K», grouped nav, user footer); content opens with a 52px sticky toolbar (title, count, view controls, primary action) and the data starts immediately below, no hero card. Login: split view, form on the start side with mark, title and phone field; the other half a deep ink field showing a quiet pipeline motif in turquoise hairlines.

FORM: Canon pinned by the user (Attio benchmark), executed at full fidelity; concept-seed f7b146a9 ran, its assignment yielded to the user's pin. Signature interaction: the ⌘K command palette across navigation, customers, leads and deals.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
