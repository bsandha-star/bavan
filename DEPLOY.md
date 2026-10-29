# Deploying huddle.dental

The site is static files in `site/`. The domain huddle.dental is registered at Squarespace, which only
manages DNS for it, so the files are hosted elsewhere and Squarespace points the domain at that host.

## Step 1 — turn on hosting (one time, about 2 minutes)

**Option A: GitHub Pages (this repo, free, already wired up)**

1. Open https://github.com/bsandha-star/bavan/settings/pages
2. Under **Build and deployment → Source**, it should read **Deploy from a branch**, branch `gh-pages`, folder `/ (root)`. Every push to `main` republishes that branch automatically.
3. Under **Custom domain**, type `huddle.dental` and press Save. Tick **Enforce HTTPS** once DNS has propagated (step 2).
4. The site is also reachable at https://bsandha-star.github.io/bavan/ until the domain points here.

GitHub Pages on a **private** repo needs a paid GitHub plan; this repo was made public on 2026-10-29 for that reason. If the Pages setting is greyed out, either make the
repo public (it holds only the marketing site, nothing sensitive) at Settings → General → Danger Zone →
Change visibility, or use option B.

**Option B: Cloudflare Pages (free, private repo is fine)**

1. https://dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git → pick `bsandha-star/bavan`.
2. Build command: *(leave empty)*. Build output directory: `site`. Deploy.
3. Custom domains → add `huddle.dental` and `www.huddle.dental`. Cloudflare shows the records to add.

## Step 2 — point the domain (Squarespace)

Squarespace → Domains → huddle.dental → **DNS settings** → add these records (delete any existing A/AAAA records
for `@` first, and the Squarespace "parking" records if present):

| Type  | Host | Value |
|-------|------|-------|
| A     | @    | 185.199.108.153 |
| A     | @    | 185.199.109.153 |
| A     | @    | 185.199.110.153 |
| A     | @    | 185.199.111.153 |
| AAAA  | @    | 2606:50c0:8000::153 |
| AAAA  | @    | 2606:50c0:8001::153 |
| AAAA  | @    | 2606:50c0:8002::153 |
| AAAA  | @    | 2606:50c0:8003::153 |
| CNAME | www  | bsandha-star.github.io |

(For option B, use the CNAME targets Cloudflare gives you instead.)

DNS usually propagates within an hour. Then go back to GitHub Settings → Pages and tick **Enforce HTTPS**.

## Step 3 — check

- https://huddle.dental loads with a padlock and shows the site.
- https://www.huddle.dental redirects to the apex.
- The "Work this queue" demo runs; the form shows its thank-you state.

## Later changes

Edit files in `site/`, commit to `main`, and the workflow redeploys in about a minute.
