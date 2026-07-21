# PatchMortem — backend wiring checklist

Every CTA on every page reads its destination from a single file:

    assets/pm-config.js

Edit that file only. Nothing else needs touching.

---

## What is wired (44 CTAs across 10 pages)

| Role | Count | Reads from | Currently |
|---|---|---|---|
| `login` | 10 | `appLoginUrl` | `https://app.patchmortem.com/login` |
| `signup` | 10 | `appSignupUrl` | `https://app.patchmortem.com/signup` |
| `trial` | 5 | `appSignupUrl` | same as signup |
| `demo` | 7 | `demoBookingUrl` | **BLANK — falls back to contact.html** |
| `aws` | 10 | `awsMarketplaceUrl` | **BLANK — falls back to contact.html** |
| `sales` | 1 | `emailSales` | mailto, subject pre-filled |
| `security` | 1 | `emailSecurity` | mailto, subject pre-filled |
| contact form | 1 | `formEndpoint` | **BLANK — falls back to mailto** |

---

## Before go-live — 4 values to set

### 1. `appLoginUrl` / `appSignupUrl`
Confirm the real dashboard paths. Your homepage mock already
references `app.patchmortem.com`, so these are a best guess at
the route names — verify `/login` and `/signup` exist.

### 2. `demoBookingUrl`
Paste your scheduling link (Cal.com, Calendly, HubSpot Meetings,
Zoho Bookings). Until set, all 7 "Schedule a demo" / "Talk to us"
buttons route to the contact form — safe, but a scheduling link
converts far better.

### 3. `awsMarketplaceUrl`
Your public listing URL. Leave blank until the listing is
actually live. The footer still says "AWS Marketplace Partner",
so if the listing is not live, either publish it or soften that
footer line.

### 4. `formEndpoint`
Where the contact form POSTs. Options:

- Your own API — `https://api.patchmortem.com/v1/leads`
- Formspree — `https://formspree.io/f/XXXXXXX`
- Web3Forms — `https://api.web3forms.com/submit`
- HubSpot Forms API

Posts JSON:

    {
      "name": "...", "email": "...", "org": "...",
      "size": "...", "message": "...",
      "source": "patchmortem.com/contact.html",
      "submittedAt": "2026-07-21T..."
    }

Until set, the form opens the visitor's mail client with the
enquiry pre-filled to `hello@zurlux.com`. Ugly, but it never
silently loses a lead.

---

## How the fallback works

Any blank config value routes that button to `contact.html` and
logs a console warning naming the missing key. Nothing 404s, and
`document.querySelectorAll('[data-pm-unconfigured]')` in the
console lists every element still waiting on config.

## Form validation
Client-side only: name and email required, email format checked.
**Server-side validation and spam protection are still yours to
add** — add a honeypot field or CAPTCHA at the endpoint, since
a public JSON endpoint will be found by bots.

## Analytics
`trackClicks: true` pushes `cta_click` and `form_submit` events
to `window.dataLayer` for GTM/GA4. No tracking script is
included — add your own, or set `trackClicks: false`.
