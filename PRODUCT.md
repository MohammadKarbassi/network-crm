# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Sales teams of small and medium Iranian businesses, working in Persian (RTL).

- **Sales rep (کارشناس فروش):** at a desk most of the day, logging calls and notes, moving deals, working through today's tasks; occasionally on a phone between calls. Sees only records assigned to them.
- **Sales manager (مدیر فروش):** watches team numbers for the week/month, assigns leads and tasks, runs SMS/email campaigns and automations.
- **Admin (ادمین):** manages users and roles.

Primary device: desktop browser in the office; mobile is a secondary, must-work context.

## Product Purpose

«نتورک» is a CRM that manages customers and leads and improves the sales process so the company sells more. Success: reps always know their next action, managers see the real pipeline and team performance at a glance, and follow-up happens automatically through campaigns and automations.

## Positioning

A Persian-first CRM whose AI turns a rep's free-form call note into concrete CRM changes (deal stage and amount, follow-up task, lead status) that the rep confirms with one click, alongside on-demand customer summaries and a rule-based lead score. Built for the Iranian context: Jalali calendar, Toman amounts, Kavenegar SMS, OTP login by phone.

## Operating Context

- Login only by SMS one-time code to a registered mobile number.
- Daily loop: dashboard → today's tasks → open a lead/customer → log a call note (optionally AI-analyzed) → move the deal on the kanban.
- Manager loop: dashboard KPIs (week/month vs previous), team table, campaigns, automations, team management.
- Messages (SMS via Kavenegar, email via SMTP) always go through a queue; results land on the record's timeline.

## Capabilities and Constraints

- Sections: dashboard, leads, customers, deal pipeline (6-stage kanban with drag & drop), tasks with list + Jalali month calendar, campaigns, automations (templates + visual builder), team.
- Three roles: ADMIN, SALES_MANAGER, SALES_REP; reps see only their own records.
- AI features (ArvanCloud, GPT-4.1-Mini) only ever suggest; the user confirms every change. App must work fully with AI disabled.
- Stack: Next.js 16 App Router, shadcn/ui (radix), Tailwind 4, Persian RTL throughout, Vazirmatn font.
- Currency is Toman; dates are Jalali; digits shown in Persian.

## Brand Commitments

- Product name «نتورک» is fixed. No existing logo, colors, or visual identity; the visual world is open.
- Benchmark chosen by the user: Attio's frontend (modern, data-dense CRM interface) is the reference for craft and interaction quality.

## Evidence on Hand

- Optional demo dataset (`npm run db:seed:demo`): 30 customers, 50 leads, 60 deals, 40 tasks with Persian names; clearly synthetic.
- No real customers, testimonials, logos, or metrics exist; none may be fabricated.

## Product Principles

1. The rep's next action is always one glance away.
2. Numbers are truthful and comparable: every KPI carries its period and comparison.
3. AI proposes, people decide.
4. Persian is native, not translated: RTL layout, Jalali dates, Persian digits, natural copy.
5. Dense where people work, calm where people read.

## Accessibility & Inclusion

Persian RTL with correct bidi for phone numbers, emails and amounts; keyboard-operable kanban and dialogs; color never the only carrier of status (labels accompany every colored state).
