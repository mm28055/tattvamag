# Tattvamag

Personal Hinduism blog — essays and notes on Indian textual traditions, philosophy, history, and colonial discourse.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind 4**
- **Neon Postgres** for articles + comments
- **Vercel** hosting
- **Cloudflare** DNS + CDN in front
- Admin uploads Word `.docx` files; **Mammoth** converts to HTML preserving footnotes

## Local setup

```bash
# 1) Install
npm install

# 2) Copy env template and fill in real values
cp .env.example .env.local
#    — DATABASE_URL from Neon console
#    — ADMIN_PASSWORD (any long string you'll type in the admin login)
#    — ADMIN_SESSION_SECRET (≥ 32 random chars; gen with:)
#        node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# 3) Create the database schema (one time)
node scripts/run-migration.mjs

# 4) Import the 22 existing articles from the scraped JSON (one time)
node scripts/import-articles.mjs

# 5) Run the dev server
npm run dev
```

Open <http://localhost:3000>.

## Pages

| Route | Purpose |
|---|---|
| `/` | Homepage — day-toggled between Layout A (Variant 1 text-focused) and Layout B (v2 style). Override with `?layout=a` or `?layout=b`. |
| `/[slug]` | Article page with drop cap + margin footnotes + comments. |
| `/archive` | Full list with category + tag filters. |
| `/about` | Bio page. |
| `/admin/login` | Password login (ADMIN_PASSWORD). |
| `/admin` | Dashboard — article counts, pending comments. |
| `/admin/new` | Upload a `.docx` to publish a new article. |
| `/admin/comments` | Moderate comments (approve / delete). |

## Publishing workflow

1. Write the article in Microsoft Word. Use real footnotes (Insert → Footnote).
2. Go to `/admin/new` (after signing in at `/admin/login`).
3. Drag in the `.docx` + optional cover image, fill in title / subtitle / category / tags.
4. **Publish** → article is live immediately at `/[slug]`.

## Comments

Anyone can submit a comment on an article. Comments are **pending moderation** — they don't appear on the site until you approve them in `/admin/comments`. Spam defenses:

- Honeypot field (invisible input that bots auto-fill)
- Per-IP rate limit (5 / hour)
- Link-count limit (max 3 URLs per comment)

## Migration from WordPress

The original 22 WordPress articles were scraped via `../migration/scrape.mjs`. Scraped JSON lives in `src/data/*.json` as a source-of-truth backup. `scripts/import-articles.mjs` loads them into Neon.

## Deployment

Pushing to `main` auto-deploys to Vercel production. Preview deploys run for every PR. Environment variables live in the Vercel project settings.
