# Amma Seva — Build Plan

A premium home healthcare site using only white + logo colors (navy `#1e2a5a` and gold `#c9a24c`), with the Amma Seva logo, serif display type (Cormorant) + clean sans (Inter).

## Design System

- Palette: white background, navy primary, gold accent, soft neutral greys for borders/muted text. No other colors.
- Typography: Cormorant Garamond (headings, like logo) + Inter (body).
- Tokens defined in `src/styles.css` via `@theme` / `:root` (oklch). Logo used in header + footer + hero.
- Components: rounded cards, subtle shadows, generous whitespace, gold hairline dividers echoing the logo mark.

## Phase 1 — Marketing site (this iteration)

Static, mobile-responsive, SEO-ready. No backend yet.

Routes:
- `/` Home — hero (nurse/family image + logo), tagline, Book a Service + Call Now CTAs, services grid, Why Choose Us, How It Works (4 steps), testimonials, FAQ, contact strip, footer.
- `/services` — overview grid of all services.
- `/services/$slug` — dedicated page per service (elderly, mother-baby, pregnancy, newborn, home-nursing, injection, post-surgery, attendant, bedridden, icu-recovery, physiotherapy [coming soon], doctor-consultation [coming soon]) with description, benefits, duration, indicative pricing, enquiry form (frontend only).
- `/about`, `/contact` (phone/WhatsApp/email/address + Google Map embed + form), `/careers`, `/blog` (placeholder list), `/privacy`, `/terms`, `/refund`.
- Floating WhatsApp button + sticky Call Now on mobile.
- SEO: unique title/description/OG per route, sitemap.xml, robots.txt, JSON-LD LocalBusiness on home.

## Phase 2 — Backend & booking (next iteration, after Phase 1 approval)

Enable Lovable Cloud for:
- Auth (customer + caregiver + admin roles via `user_roles` table).
- Booking flow: service → date/time → duration → address → patient details → confirmation.
- Caregiver registration portal with document uploads (Cloud Storage) + verification workflow.
- Admin dashboard (bookings, assignments, approvals, payments, reports).
- Notifications: email (Resend), WhatsApp/SMS via a provider of your choice (needs API keys).
- Payments: Razorpay (best for India: UPI, cards, netbanking, wallets) — I'll recommend the provider at that stage.

## Technical notes

- TanStack Start + Tailwind v4 + shadcn.
- Images generated for hero + service cards; logo saved via lovable-assets from your upload.
- Analytics + WhatsApp/social integrations wired as placeholders you can fill.

## What I'll ship this turn

All of Phase 1 above. Phase 2 (auth, bookings, admin, payments, notifications) will need Lovable Cloud enabled and a few API keys — I'll set it up next once you approve Phase 1.
