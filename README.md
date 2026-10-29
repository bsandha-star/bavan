# Huddle — marketing website

Static marketing site for **Huddle** (huddle.dental), the AI operating layer for dental groups.
Two products: **Workspace** for office managers (queues that work themselves, Blind Spots, Call Check,
the Dental Wiki, a financing leaderboard, the daily huddle) and **Pulse** for owners (Bottom Line, Roster,
On Time, Staff File and Payday, run as a service). The copy is the product vision, not a description of
the current internal dashboard.

No build step. Everything lives in `site/`:

| Path | What it is |
| --- | --- |
| `site/index.html` | The landing page (interactive queue demo, two products, before/after day, six Workspace themes, outcomes, Pulse, how it works, pricing, testimonials, integrations wall, security, FAQ, demo form) |
| `site/assets/styles.css` | Design system and all component styles (light + dark) |
| `site/assets/app.js` | Nav, mobile menu, the "Work this queue" demo, count-up, form handling |
| `site/assets/favicon.svg` | Favicon / logo mark |
| `site/privacy.html`, `site/terms.html` | Placeholder legal pages |
| `site/_headers` | Security headers for Cloudflare Pages / Netlify |

## Deploy (pick one)

- **Cloudflare Pages:** create a Pages project from this repo. Build command: *none*. Output directory: `site`.
- **Netlify:** connect the repo. `netlify.toml` already points at `site/`.
- **Vercel:** import the repo. `vercel.json` already sets `outputDirectory` to `site`.
- **GitHub Pages:** merge to `main`, then Settings → Pages → Source: *GitHub Actions*. The workflow in `.github/workflows/pages.yml` publishes `site/`.

Preview locally:

```bash
cd site && python3 -m http.server 8080
# open http://localhost:8080
```

## Before launch: placeholders to replace

Search the HTML for `PLACEHOLDER` comments. The list:

1. **Contact details** in the "Book a demo" card and footer: company name, address, phone, sales/support/legal emails (`hello@huddle.dental` etc. are made up).
2. **Testimonials** (three quotes) in the "From the front office" section are illustrative, not real customers.
3. **Demo form endpoint**: `assets/app.js` has a `TODO (launch)` where the form should POST (Formspree, Netlify Forms, HubSpot, or your own API). Right now it only shows the thank-you state.
4. **Privacy and Terms** pages are stubs.
5. **Claims and outcomes** (hours saved, AR reduction, call recovery rate, BAA, encryption, residency) are vision copy; make each true or soften it before launch, and have counsel read the security section.
7. **Integrations wall** lists platforms that are live, in development or on the roadmap; the footer says so. Trim to what is real at launch.
6. **Brand name**: "Huddle" is also used by other software products; check the trademark before buying the domain.
