# Huddle — marketing website

Static marketing site for **Huddle**, the one-workspace app for multi-practice dental groups
(queues for Balances, Claims, Approvals, Chart/Desk Check, Daily Check-in, Call Check, Dental Wiki,
Scoreboard, Uploads, and the owners-only Pulse: Finance, HR, Payroll).

No build step. Everything lives in `site/`:

| Path | What it is |
| --- | --- |
| `site/index.html` | The landing page (hero, before/after day, modules, stats, role tour, ROI calculator, testimonials, security, integrations, FAQ, demo form, footer) |
| `site/assets/styles.css` | Design system and all component styles (light + dark) |
| `site/assets/app.js` | Nav, mobile menu, tabs, ROI calculator, count-up, form handling |
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
5. **Trust claims** (BAA, encryption, US residency, 400-day retention) mirror Huddle's design docs; confirm each with counsel before publishing.
6. **Brand name**: "Huddle" is also used by other software products; check the trademark before buying the domain.
