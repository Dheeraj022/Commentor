# Social Media Comment Monitoring Dashboard (Social Comment Monitor)

A full-stack, enterprise-grade web application built for digital marketing agencies to extract social media posts and comments (Instagram, YouTube, Facebook, LinkedIn) using configured Apify Actors, store them in Supabase PostgreSQL with Row Level Security (RLS), classify comments by sentiment (positive, negative, neutral), and prevent unnecessary repeated scraping costs through smart caching.

---

## Key Features

1. **Multi-Platform Social Account Management**
   - Connect and manage handles for **Instagram**, **YouTube**, **Facebook**, and **LinkedIn**.
   - Configured with official Apify Actor mappings, input contracts, and constraints.
   - Add, edit, disable, or delete accounts with URL validation.

2. **Smart Caching & Duplicate Prevention (Zero-Waste Scraping)**
   - **Exact-Range Detection:** Detects previously fetched date ranges per account; reuses cached posts and comments instead of re-scraping.
   - **Contained & Overlapping Ranges:** Identifies full or partial coverage to minimize extraction runs.
   - **Unique Constraints:** Deduplicates posts `(social_account_id, platform, external_post_id)` and comments `(social_account_id, platform, external_comment_id)`.
   - **Force Refresh Guard:** User-confirmed refresh option when a fresh scrape is explicitly requested.

3. **Multi-Lingual Sentiment Analysis & Feedback Intelligence**
   - Classifies every comment into **Positive**, **Negative**, or **Neutral** with confidence scores and reasoning.
   - Handles **English**, **Hindi (Devanagari)**, **Hinglish**, **emojis** (❤️, 🔥, 👏, 😡, 👎), and negation patterns ("not good").
   - Pluggable AI engine architecture with an offline, deterministic NLP fallback.
   - **Manual Correction Override:** Allows agency analysts to manually correct sentiment while preserving automated predictions.
   - **AI Synthesis:** Generates high-level summaries including positive themes, common complaints, frequently mentioned topics, and actionable suggestions.

4. **Interactive Dashboard & Reporting**
   - **Overview:** KPI cards, sentiment distribution pie charts, platform volume breakdowns, comments over time, sentiment trends.
   - **All Comments Table:** Real-time search, platform filter, account filter, sentiment filter, date range filter, inline sentiment correction, and comment details modal.
   - **CSV Export:** 1-click export of filtered comment lists with authors, dates, sentiment labels, and original URLs.
   - **Fetch History:** Detailed audit trail of past batches, account-level run statuses, post/comment counts, and Apify run IDs.
   - **Settings:** Timezone configuration, configured Apify Actor matrix, and API credential security status.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) + React 19 + TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Icons** | Lucide React + Custom brand SVGs |
| **Charts** | Recharts (Pie, Bar, Area charts) |
| **Database & Auth** | Supabase PostgreSQL + Supabase Auth + RLS |
| **Extraction** | Apify API + Platform Actors |
| **Validation** | Zod |
| **Date Utilities** | date-fns |
| **Testing** | Node.js / tsx automated test suite |

---

## Project Structure

```
├── supabase/
│   └── migrations/
│       └── 20261122000000_init_schema.sql    # Complete Supabase schema, indexes & RLS policies
├── src/
│   ├── types/
│   │   └── index.ts                          # Comprehensive TypeScript domain interfaces
│   ├── lib/
│   │   ├── utils.ts                          # Formatting & className helpers
│   │   ├── db/
│   │   │   └── index.ts                      # Data access layer (Supabase + local fallback)
│   │   ├── supabase/
│   │   │   ├── client.ts                     # Browser Supabase client
│   │   │   └── server.ts                     # Server-side Supabase client
│   │   ├── apify/
│   │   │   ├── client.ts                     # Secure Apify API client
│   │   │   ├── actors.ts                     # Platform Actor definitions & schemas
│   │   │   ├── run-actor.ts                  # Actor run starter
│   │   │   ├── get-run-status.ts             # Status poller
│   │   │   └── get-dataset-items.ts          # Paginated dataset fetcher
│   │   ├── social/
│   │   │   └── normalizers/                  # Normalized post/comment transformers
│   │   │       ├── instagram.ts
│   │   │       ├── facebook.ts
│   │   │       ├── youtube.ts
│   │   │       ├── linkedin.ts
│   │   │       └── index.ts
│   │   ├── fetch/
│   │   │   ├── cache-manager.ts              # Date-range coverage & cache evaluator
│   │   │   └── batch-runner.ts               # Extraction orchestrator
│   │   └── sentiment/
│   │       ├── analyzer.ts                   # Multi-lingual & emoji sentiment analyzer
│   │       └── summary-generator.ts          # Theme & complaint summarizer
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx                   # Responsive left navigation
│   │   │   └── Header.tsx                    # Top bar with timezone & shortcuts
│   │   └── ui/
│   │       ├── PlatformBadge.tsx             # Visual platform badges with SVGs
│   │       └── SentimentBadge.tsx            # Positive/Negative/Neutral indicators
│   └── app/
│       ├── (dashboard)/
│       │   ├── layout.tsx                    # Protected dashboard layout
│       │   ├── page.tsx                      # Overview metrics & charts
│       │   ├── accounts/page.tsx             # Social accounts management
│       │   ├── fetch/page.tsx                # 4-step comment fetch wizard
│       │   ├── comments/page.tsx             # Filterable comments table
│       │   ├── reports/page.tsx              # Sentiment deep-dive reports
│       │   ├── history/page.tsx              # Extraction history & audit log
│       │   └── settings/page.tsx             # Workspace & platform settings
│       ├── login/page.tsx                    # Agency authentication page
│       └── api/                              # Route Handlers for all endpoints
└── tests/
    └── verify-all.ts                         # Automated verification test suite
```

---

## Environment Variables Setup

Copy the example environment file:
```bash
cp .env.example .env.local
```

Configure your credentials in `.env.local`:
```env
# Apify API Token (from https://console.apify.com/account/integrations)
APIFY_API_TOKEN=your_apify_token_here

# Supabase Database & Auth (from your Supabase project settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional Pluggable AI Sentiment Key
SENTIMENT_API_KEY=

# Default Timezone
NEXT_PUBLIC_APP_TIMEZONE=Asia/Kolkata
```

> **Note:** If Supabase keys are not set, the application operates in resilient local development mode with built-in high-fidelity seed data, complete CRUD operations, cache evaluation, and sentiment updating.

---

## Supabase Database Setup

To apply the database schema, copy and execute the migration file in your Supabase SQL Editor:
```
supabase/migrations/20261122000000_init_schema.sql
```

The migration automatically sets up:
- `workspaces` & `workspace_members`
- `social_accounts`
- `social_posts` (with unique constraint on `social_account_id, platform, external_post_id`)
- `social_comments` (with unique constraint on `social_account_id, platform, external_comment_id`)
- `sentiment_analysis` (with unique constraint on `social_comment_id`)
- `fetch_batches`, `fetch_batch_accounts`, `apify_runs`, and `fetch_coverage`
- Performance indexes on published timestamps, sentiment labels, and account IDs
- Row Level Security (RLS) policies isolating records per workspace

---

## Running the Application Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run automated test suite:**
   ```bash
   npm test
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build for production:**
   ```bash
   npm run build
   npm run start
   ```

---

## Verified Platform Actors

| Platform | Actor ID | Capabilities | Docs |
|---|---|---|---|
| **Instagram** | `apify/instagram-scraper` | Posts + Comments | [Apify Instagram](https://apify.com/apify/instagram-scraper) |
| **YouTube** | `streamers/youtube-scraper` | Videos + Comments | [Apify YouTube](https://apify.com/streamers/youtube-scraper) |
| **Facebook** | `apify/facebook-pages-scraper` | Page Posts + Top Comments | [Apify Facebook](https://apify.com/apify/facebook-pages-scraper) |
| **LinkedIn** | `curious_coder/linkedin-post-search-scraper` | Company Posts + Comments | [Apify LinkedIn](https://apify.com/curious_coder/linkedin-post-search-scraper) |

---

## Test Verification

Run `npm test` to verify:
- Exact date range match and cache reuse without duplicate scraping
- Contained date range coverage recognition
- Multi-platform data normalization into common schema
- Comment deduplication by external ID
- Multi-lingual sentiment analysis (English, Hindi, Hinglish, emojis, negation handling)
- Feedback theme and complaint generation
