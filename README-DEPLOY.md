# PatchMortem — deployable site

11 pages, one shared config file. Static — no build step, no
server-side runtime required.

## Contents

    index.html            homepage (was patchmortem_v11.html)
    platform.html
    how-it-works.html
    pricing.html
    security.html         includes #dpa and #rbi anchor sections
    banking-bfsi.html
    msps.html
    about.html
    contact.html
    privacy.html
    terms.html
    assets/pm-config.js   ALL link destinations live here
    WIRING.md             what to set before go-live

## Deploy

Upload the whole folder, keeping `assets/` alongside the HTML.
Works as-is on Netlify, Vercel, Cloudflare Pages, S3+CloudFront,
GitHub Pages, or any Nginx/Apache docroot. `index.html` is the
default document.

Nothing is fetched from a build pipeline. Fonts come from Google
Fonts over CDN; the logo is inlined as base64.

## IMPORTANT — what changed on the homepage

Your original `patchmortem_v11.html` was built for the Claude
artifact environment. It contained **33 `sendPrompt()` calls** —
a function that only exists inside that environment. Deployed to
a real host, every nav link, hero CTA, pricing button, and footer
link would have done nothing.

All 33 are now real links:

| Was | Now |
|---|---|
| Nav: Platform / How it works / Pricing | the real pages |
| Nav: Partners / Resources | msps.html / platform.html |
| Hero: Start free trial | `data-pm="trial"` |
| Hero: Get a demo | `data-pm="demo"` |
| Hero: AWS Marketplace | `data-pm="aws"` |
| Feature "See how it works" links | platform / how-it-works / security#rbi |
| Pricing: Starter / Professional | `data-pm="trial"` |
| Pricing: Enterprise | `data-pm="sales"` (mailto) |
| Footer: all 14 items | the real pages |

The homepage nav was also aligned with the subpage nav so
navigation is consistent sitewide (Platform, How it works,
Pricing, Security, Banking & BFSI, MSPs).

The `sendPrompt` shim function has been removed.

## Before go-live

See `WIRING.md`. Four values in `assets/pm-config.js`:

1. `appLoginUrl` / `appSignupUrl` — verify the real dashboard routes
2. `demoBookingUrl` — your scheduling link (currently blank)
3. `awsMarketplaceUrl` — your listing (currently blank)
4. `formEndpoint` — contact form POST target (currently blank)
   See SETUP-GOOGLE-FORM.md for the Google Workspace route.

Blank values route to `contact.html` and log a console warning.
Nothing 404s.

## Still on your list

- The homepage still says remediation "in milliseconds" / under
  two seconds. `how-it-works.html` shows the accurate 8m 7s
  timeline. You said you would handle this.
- Server-side form validation and spam protection.
