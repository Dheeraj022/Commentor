# Social Media Comment Monitoring Dashboard

## Product Requirements Document & AI Website-Building Prompt

**Project type:** MVP web application\
**Working name:** Social Comment Monitor\
**Primary goal:** Extract social media posts and comments for selected
accounts and date ranges using Apify Actors, store the results in
Supabase, classify comments by sentiment, and display reports in a
dashboard.

------------------------------------------------------------------------

# 1. Project Overview

Build a web-based Social Media Comment Monitoring Dashboard for a
digital marketing agency. The application will allow an authenticated
user to add social media account handles, select a date range, fetch
posts and comments through Apify, analyze comment sentiment, and view
the results in one place.

The first version should focus only on comment extraction, reporting,
sentiment analysis, and avoiding unnecessary repeat extraction costs. Do
not build a full ORM platform.

## Core objectives

1.  Manage social media handles for YouTube, Instagram, Facebook, and
    LinkedIn.
2.  Select a start date and end date.
3.  Fetch posts published during the selected period, subject to each
    platform/Actor's capabilities.
4.  Fetch comments associated with eligible posts.
5.  Normalize platform-specific data into one common format.
6.  Classify comments as Positive, Negative, or Neutral.
7.  Display platform-wise and overall reports.
8.  Save all extracted data in Supabase.
9.  Check existing data before starting a new Apify run.
10. Reuse cached results and fetch only missing data where coverage can
    be reliably determined.

**Important:** Apify is an extraction provider, not a guarantee that
every platform, account, post, or comment is accessible. Each platform
will use a separately configured Apify Actor. Actor availability, input
format, output schema, pricing, permissions, rate limits, and platform
restrictions must be verified before implementation. Never promise
universal extraction.

------------------------------------------------------------------------

# 2. Technology Stack

Use the following stack:

  -----------------------------------------------------------------------
  Layer                               Technology
  ----------------------------------- -----------------------------------
  Frontend                            Next.js (App Router) + React +
                                      TypeScript

  Styling                             Tailwind CSS

  UI components                       shadcn/ui or an equivalent
                                      accessible component library

  Icons                               Lucide

  Database                            Supabase PostgreSQL

  Authentication                      Supabase Auth

  Server-side API                     Next.js Route Handlers / server
                                      actions

  Extraction                          Apify API and configured
                                      platform-specific Actors

  Sentiment                           Pluggable AI sentiment provider,
                                      with a deterministic fallback for
                                      development

  Charts                              Recharts

  Hosting                             Vercel or another compatible
                                      Node.js host

  Validation                          Zod

  Date handling                       date-fns
  -----------------------------------------------------------------------

Use strict TypeScript. Keep API calls and secrets on the server. Do not
call Apify directly from browser code.

------------------------------------------------------------------------

# 3. User Roles and Authentication

For the MVP, support a simple authenticated workspace.

-   Sign in and sign out.
-   Protect all dashboard routes.
-   Each record must belong to a workspace/user.
-   Users must only access data belonging to their own workspace.
-   Use Supabase Row Level Security (RLS).
-   Do not build complex agency team permissions in the first release,
    but design the schema so roles can be added later.

Create a clean login page and a protected dashboard layout.

------------------------------------------------------------------------

# 4. Main Navigation

Use a left sidebar on desktop and a responsive navigation drawer on
mobile.

Navigation items:

1.  Overview
2.  Social Accounts
3.  Fetch Comments
4.  All Comments
5.  Sentiment Reports
6.  Fetch History
7.  Settings

The interface should feel like a professional SaaS analytics product.
Use a restrained light theme, neutral backgrounds, clear typography,
subtle borders, and accessible contrast. Avoid excessive gradients,
decorative effects, and crowded cards.

------------------------------------------------------------------------

# 5. Social Account Management

Create a Social Accounts page.

## Supported platform types

-   Instagram
-   Facebook
-   YouTube
-   LinkedIn

## Add account form

Fields:

-   Platform (required dropdown)
-   Display name (required)
-   Handle, page URL, channel URL, or profile URL (required)
-   Platform account/page/channel ID (optional, where known)
-   Apify Actor ID (select from configured platform integration; do not
    ask ordinary users to enter it unless they are administrators)
-   Active/inactive status

Actions:

-   Add account
-   Edit account
-   Disable account
-   Delete account (with confirmation)
-   Test configuration (where supported)

Show accounts in a table or cards with platform icon, display name,
handle/URL, status, and last successful fetch.

Do not collect social account passwords. Prefer supported public URLs or
platform-authorized access, depending on the selected Actor's
requirements.

------------------------------------------------------------------------

# 6. Fetch Comments Workflow

Create a dedicated Fetch Comments page.

## Step 1: Select accounts

Allow one or more saved accounts to be selected. Show platform icons and
account names. Do not allow disabled accounts to be selected.

## Step 2: Select date range

Fields:

-   Start date
-   End date

Validation:

-   Both dates are required.
-   End date cannot be earlier than start date.
-   Display the selected dates clearly.
-   Use the workspace's configured timezone; default to Asia/Kolkata for
    this project, but make it configurable.

## Date semantics

For the initial MVP, use **post publication date** as the main date
filter:

-   Find posts published between the selected start and end dates.
-   Fetch comments for those posts, subject to Actor capabilities.
-   Store each comment's own publication timestamp.
-   Display the comment date separately from the post publication date.

Later, add a separate comment-date filter. Do not silently treat post
date and comment date as the same thing.

## Step 3: Preview fetch plan

Before extraction, show:

-   Selected accounts
-   Date range
-   Accounts with cached complete coverage
-   Accounts needing extraction
-   Accounts with partial coverage
-   Estimated Actor runs, if it can be calculated from known Actor
    configuration
-   Any platform limitations or missing configuration

Do not invent cost estimates. If an Actor's pricing is unknown, show
"Cost estimate unavailable".

## Step 4: Fetch Data button

When clicked:

1.  Validate the request on the server.
2.  Create a fetch batch.
3.  Check cache and fetch coverage for each account and date range.
4.  Skip accounts with complete, valid cached coverage unless the user
    explicitly requests refresh.
5.  Queue extraction only for missing coverage.
6.  Start the correct configured Apify Actor for each account/platform.
7.  Store the Apify run ID and dataset ID.
8.  Poll or process the run asynchronously.
9.  Normalize and upsert returned posts and comments.
10. Run sentiment analysis only for comments that have not already been
    analyzed or whose text has changed.
11. Mark the fetch batch complete, partially complete, or failed.
12. Refresh the dashboard data.

The UI must show progress by account and platform. Do not make a user
wait on a single long-running HTTP request.

------------------------------------------------------------------------

# 7. Apify Integration Architecture

Implement a server-side Apify adapter layer.

Suggested modules:

-   `lib/apify/client.ts`
-   `lib/apify/actors.ts`
-   `lib/apify/run-actor.ts`
-   `lib/apify/get-run-status.ts`
-   `lib/apify/get-dataset-items.ts`
-   `lib/social/normalizers/instagram.ts`
-   `lib/social/normalizers/facebook.ts`
-   `lib/social/normalizers/youtube.ts`
-   `lib/social/normalizers/linkedin.ts`

## Actor configuration

Do not hardcode assumptions about Actor input or output schemas.

Create an admin configuration for each platform integration:

-   Platform
-   Actor ID
-   Input template/schema
-   Enabled status
-   Documentation URL
-   Expected output mapping
-   Whether the Actor extracts posts, comments, or both
-   Supported date filtering mode
-   Pagination/limit options
-   Known constraints

Use environment variables for credentials:

``` env
APIFY_API_TOKEN=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SENTIMENT_API_KEY=
```

The service role key, Apify token, and AI API key must only be used on
the server. Never expose them in client-side bundles or return them from
API endpoints.

## Apify run lifecycle

Support:

-   Actor run creation
-   Run ID persistence
-   Dataset ID persistence
-   Run status checks
-   Retry for transient failures
-   Timeout handling
-   Dataset pagination
-   Partial dataset processing
-   Error details for administrators

Use a background job or scheduled worker pattern suitable for the
hosting platform. A user-facing request should create a job and return
its ID rather than wait for a potentially long extraction.

Use webhook callbacks if the selected Apify setup supports them
reliably; otherwise use a scheduled polling worker. Verify the exact
Apify API endpoints and Actor input contracts against current Apify
documentation during implementation.

## Normalization

Each platform Actor may return different field names. Convert outputs
into a common internal structure.

For each post, normalize:

-   Platform
-   Account ID
-   External post ID
-   Post URL
-   Post text/caption/title
-   Published timestamp
-   Media type, if available
-   Raw source data (optional, with size limits)

For each comment, normalize:

-   Platform
-   Account ID
-   Internal post ID
-   External post ID
-   External comment ID
-   Parent comment ID, if available
-   Comment text
-   Author display name, if available
-   Author profile URL, if available
-   Comment URL, if available
-   Comment published timestamp
-   Like count, if available
-   Reply count, if available
-   Raw source data (optional, with size limits)

If a field is unavailable from an Actor, store null. Do not fabricate
values.

------------------------------------------------------------------------

# 8. Duplicate Prevention and Cache Logic

This is a core product requirement because repeated Apify extraction can
increase costs.

## Exact same date range

When the same account and exact date range are requested again:

-   Check whether the date range has complete successful coverage.
-   If complete and not expired, do not start another Actor run.
-   Show existing data and a message such as: "Data already fetched for
    this account and date range. Showing saved results."
-   Display the last fetched timestamp.

## Overlapping date ranges

Example:

-   Existing coverage: 1 September--7 September.
-   New request: 5 September--10 September.

If the system can reliably determine daily coverage, reuse 5--7
September and fetch only 8--10 September.

If the Actor cannot support precise date filtering or completeness
cannot be established, do not claim that only missing days were fetched.
Explain the limitation and use a safe, configurable extraction strategy.

## Manual refresh

Provide a "Refresh data" action with a confirmation dialog:

-   Explain that this may trigger new Apify usage/cost.
-   Allow the user to proceed or cancel.
-   Upsert posts and comments rather than creating duplicates.
-   Update coverage metadata only after successful processing.

## Unique keys

Use unique constraints:

-   Posts: `(platform, external_post_id, account_id)`
-   Comments: `(platform, external_comment_id, account_id)`

Handle missing external IDs carefully. Do not use comment text alone as
a globally unique key.

## Coverage records

Track coverage per account, platform, date range, and extraction
configuration/version. Include:

-   Start date
-   End date
-   Status
-   Actor ID
-   Actor run ID
-   Completed timestamp
-   Number of posts
-   Number of comments
-   Whether coverage is complete, partial, or unknown
-   Error message

A successful Actor run does not automatically prove that every possible
post or comment was returned. Coverage status must reflect what the
Actor can actually guarantee.

------------------------------------------------------------------------

# 9. Sentiment Analysis

Classify every comment into exactly one of:

-   Positive
-   Negative
-   Neutral

Store:

-   Sentiment label
-   Confidence score (if provider returns one)
-   Short reason or explanation (optional)
-   Model/provider
-   Analysis timestamp
-   Language (if detected)
-   Analysis status

## Rules

-   Do not classify a comment only from isolated keywords; consider the
    full sentence and context.
-   Understand emojis, Hinglish, Hindi, English, and common
    mixed-language comments where the chosen model supports them.
-   Sarcasm and ambiguous comments should be handled conservatively.
-   If the model cannot confidently classify a comment, use Neutral or
    "Needs review" internally. If the dashboard must show exactly three
    categories, map the review state to Neutral while retaining a review
    flag.
-   Never send the same unchanged comment for sentiment analysis
    repeatedly.
-   Allow a user to manually correct a sentiment label.
-   Preserve the original automated result separately from any manual
    override.

## Summary generation

Generate a concise summary from the stored classified comments:

-   Positive feedback themes
-   Negative feedback themes
-   Neutral/general observations
-   Frequently mentioned topics
-   Common complaints
-   Suggested areas for improvement

Summaries must be based only on fetched comments in the selected
filters. Do not invent customer feedback or claim statistical
significance from a small sample.

------------------------------------------------------------------------

# 10. Dashboard Pages and UI Requirements

## A. Overview

Top filters:

-   Date range
-   Social account
-   Platform
-   Sentiment

Summary cards:

-   Total posts
-   Total comments
-   Positive comments
-   Negative comments
-   Neutral comments

Charts:

-   Sentiment distribution
-   Comments by platform
-   Comments over time
-   Sentiment trend over time

AI summary section:

-   Positive feedback summary
-   Negative feedback summary
-   Neutral observations

Recent activity:

-   Latest fetch batches
-   Failed or partially completed jobs
-   Last successful extraction

All metrics must be calculated from actual database records and active
filters. Never use hardcoded demo numbers in production.

## B. All Comments

Create a searchable, filterable, paginated table.

Columns:

-   Platform
-   Account
-   Post
-   Comment
-   Comment author
-   Comment date
-   Sentiment
-   Likes (if available)
-   Actions

Filters:

-   Date range
-   Platform
-   Account
-   Sentiment
-   Search comment text
-   Post ID or URL

Actions:

-   View comment details
-   Open original post/comment URL in a new tab, if available
-   Change sentiment manually
-   Export filtered results to CSV

Do not show private or unavailable user information.

## C. Platform-wise Views

Provide separate tabs for:

-   Instagram
-   Facebook
-   YouTube
-   LinkedIn

Each tab should show platform-specific accounts, posts, comments, and
sentiment metrics.

If a platform is not configured, show a clear setup message rather than
fake data.

## D. Sentiment Reports

Show:

-   Positive / Negative / Neutral totals and percentages
-   Sentiment by platform
-   Sentiment by account
-   Sentiment trend
-   Top positive themes
-   Top negative themes
-   AI-generated summary

Percentages should use the number of classified comments as the
denominator. Clearly indicate when comments are unclassified or
excluded.

## E. Fetch History

Show:

-   Batch ID
-   Selected accounts
-   Date range
-   Started time
-   Completed time
-   Status
-   Posts fetched
-   Comments fetched
-   Actor runs
-   Error details

Statuses:

-   Queued
-   Running
-   Processing
-   Completed
-   Partially completed
-   Failed
-   Cancelled

Allow users to open a batch and see account-level results.

------------------------------------------------------------------------

# 11. Suggested Supabase Database Schema

Create migrations for the following tables. Use UUID primary keys and
timestamps.

## `workspaces`

-   `id` UUID primary key
-   `name` text
-   `created_at` timestamptz

## `workspace_members`

-   `id` UUID primary key
-   `workspace_id` UUID references workspaces
-   `user_id` UUID references auth.users
-   `role` text
-   `created_at` timestamptz

## `social_accounts`

-   `id` UUID primary key
-   `workspace_id` UUID references workspaces
-   `platform` text
-   `display_name` text
-   `handle` text
-   `profile_url` text
-   `external_account_id` text nullable
-   `is_active` boolean default true
-   `created_at` timestamptz
-   `updated_at` timestamptz

## `social_posts`

-   `id` UUID primary key
-   `workspace_id` UUID references workspaces
-   `social_account_id` UUID references social_accounts
-   `platform` text
-   `external_post_id` text
-   `post_url` text nullable
-   `text_content` text nullable
-   `published_at` timestamptz nullable
-   `media_type` text nullable
-   `raw_data` jsonb nullable
-   `first_fetched_at` timestamptz
-   `last_fetched_at` timestamptz
-   Unique constraint on
    `(social_account_id, platform, external_post_id)`

## `social_comments`

-   `id` UUID primary key
-   `workspace_id` UUID references workspaces
-   `social_account_id` UUID references social_accounts
-   `social_post_id` UUID references social_posts
-   `platform` text
-   `external_comment_id` text
-   `parent_external_comment_id` text nullable
-   `comment_text` text
-   `author_name` text nullable
-   `author_profile_url` text nullable
-   `comment_url` text nullable
-   `published_at` timestamptz nullable
-   `like_count` integer nullable
-   `reply_count` integer nullable
-   `raw_data` jsonb nullable
-   `first_fetched_at` timestamptz
-   `last_fetched_at` timestamptz
-   Unique constraint on
    `(social_account_id, platform, external_comment_id)`

## `sentiment_analysis`

-   `id` UUID primary key
-   `workspace_id` UUID references workspaces
-   `social_comment_id` UUID references social_comments
-   `automated_label` text
-   `manual_label` text nullable
-   `confidence` numeric nullable
-   `reason` text nullable
-   `language` text nullable
-   `provider` text nullable
-   `model_name` text nullable
-   `analysis_status` text
-   `analyzed_at` timestamptz nullable
-   `updated_at` timestamptz
-   Unique constraint on `social_comment_id`

The displayed sentiment should use `manual_label` when present;
otherwise use `automated_label`.

## `fetch_batches`

-   `id` UUID primary key
-   `workspace_id` UUID references workspaces
-   `requested_by` UUID references auth.users
-   `start_date` date
-   `end_date` date
-   `timezone` text
-   `status` text
-   `refresh_requested` boolean default false
-   `created_at` timestamptz
-   `started_at` timestamptz nullable
-   `completed_at` timestamptz nullable
-   `error_message` text nullable

## `fetch_batch_accounts`

-   `id` UUID primary key
-   `fetch_batch_id` UUID references fetch_batches
-   `social_account_id` UUID references social_accounts
-   `status` text
-   `coverage_status` text
-   `posts_count` integer default 0
-   `comments_count` integer default 0
-   `error_message` text nullable

## `apify_runs`

-   `id` UUID primary key
-   `workspace_id` UUID references workspaces
-   `fetch_batch_account_id` UUID references fetch_batch_accounts
-   `platform` text
-   `actor_id` text
-   `apify_run_id` text
-   `dataset_id` text nullable
-   `status` text
-   `usage_info` jsonb nullable
-   `started_at` timestamptz nullable
-   `finished_at` timestamptz nullable
-   `error_message` text nullable

## `fetch_coverage`

-   `id` UUID primary key
-   `workspace_id` UUID references workspaces
-   `social_account_id` UUID references social_accounts
-   `platform` text
-   `start_date` date
-   `end_date` date
-   `coverage_status` text
-   `actor_id` text nullable
-   `last_fetch_batch_id` UUID references fetch_batches
-   `completed_at` timestamptz nullable
-   `posts_count` integer default 0
-   `comments_count` integer default 0
-   `configuration_version` text nullable

Add indexes for workspace, account, platform, published timestamps,
sentiment labels, and fetch status. Add RLS policies so users can only
access records in their own workspaces.

The final schema can be adjusted during implementation, but preserve the
data relationships and uniqueness rules.

------------------------------------------------------------------------

# 12. Backend API Routes

Suggested Next.js route handlers:

  --------------------------------------------------------------------------------
  Method                  Route                           Purpose
  ----------------------- ------------------------------- ------------------------
  GET                     `/api/accounts`                 List social accounts

  POST                    `/api/accounts`                 Add an account

  PATCH                   `/api/accounts/:id`             Update an account

  DELETE                  `/api/accounts/:id`             Delete an account

  POST                    `/api/fetch/preview`            Check cache and produce
                                                          fetch plan

  POST                    `/api/fetch/start`              Create batch and queue
                                                          extraction

  GET                     `/api/fetch/:batchId`           Get batch progress

  POST                    `/api/fetch/:batchId/refresh`   Force refresh with
                                                          confirmation

  GET                     `/api/comments`                 Search/filter/paginate
                                                          comments

  PATCH                   `/api/comments/:id/sentiment`   Manually update
                                                          sentiment

  GET                     `/api/reports/overview`         Dashboard summary
                                                          metrics

  GET                     `/api/reports/sentiment`        Sentiment report

  GET                     `/api/history`                  Fetch history

  GET                     `/api/export/comments`          Export filtered comments
  --------------------------------------------------------------------------------

Every route must authenticate the user, validate inputs, verify
workspace access, and return safe error messages.

------------------------------------------------------------------------

# 13. Background Processing and Reliability

Extraction and sentiment analysis may take time. Use a background job
design.

Recommended stages:

1.  Create fetch batch.
2.  Create account-level tasks.
3.  Check cached coverage.
4.  Start Apify Actor runs for missing coverage.
5.  Save run identifiers.
6.  Poll run status or receive supported webhook events.
7.  Read dataset items in pages.
8.  Normalize and upsert posts/comments.
9.  Queue sentiment analysis for new or changed comments.
10. Generate report summaries.
11. Update task and batch statuses.

Requirements:

-   Idempotent processing: retrying a job must not duplicate records.
-   Retry transient network/server failures with limits and backoff.
-   Do not retry permanent configuration or permission errors endlessly.
-   Preserve partial results if one account fails.
-   One platform failure must not cancel successful results from other
    platforms.
-   Log technical errors without exposing secrets.
-   Provide clear user-facing error messages.
-   Handle API rate limits and Apify usage limits.
-   Provide an administrator-visible run log.

------------------------------------------------------------------------

# 14. Security and Privacy

-   Keep Apify and AI credentials server-side.
-   Use Supabase RLS for all workspace-owned records.
-   Validate all URLs and user inputs.
-   Avoid storing unnecessary personal data about commenters.
-   Respect platform terms, applicable law, and the selected Actor's
    permitted use.
-   Do not bypass login walls, access controls, or platform
    restrictions.
-   Do not scrape private accounts or private content without
    appropriate authorization.
-   Do not expose raw Actor datasets publicly.
-   Add basic rate limiting to fetch endpoints.
-   Confirm before manual refresh because it can create additional usage
    costs.

------------------------------------------------------------------------

# 15. MVP Scope and Development Phases

Build in phases. Do not attempt every integration at once.

## Phase 1 --- Dashboard foundation

-   Next.js app and responsive layout
-   Supabase setup and authentication
-   Workspace and account tables
-   Add/edit social account UI
-   Fetch Comments form
-   Fetch History page
-   Use clearly labelled mock data only for UI development

## Phase 2 --- First working extraction

-   Select and verify one Instagram Actor
-   Confirm its input schema and output dataset format
-   Build server-side Apify integration
-   Extract posts and comments for a test account
-   Normalize and save records
-   Add run progress and error handling

## Phase 3 --- Cache and duplicate prevention

-   Exact-range cache checks
-   Coverage records
-   Skip complete cached ranges
-   Unique comment/post constraints
-   Manual refresh
-   Safe overlapping-range behavior

## Phase 4 --- Sentiment analysis and reporting

-   Sentiment classification
-   Manual sentiment correction
-   Overview metrics and charts
-   Platform reports
-   AI-generated feedback summaries

## Phase 5 --- Additional platforms

-   Facebook Actor
-   YouTube Actor
-   LinkedIn Actor, subject to verified access and availability
-   Platform-specific normalizers
-   Integration testing for each platform

Do not build all four integrations before proving one complete
extraction flow.

------------------------------------------------------------------------

# 16. Acceptance Criteria

The MVP is ready for testing when:

1.  A user can sign in.
2.  A user can add a social media account.
3.  A user can select an account and date range.
4.  The server checks existing coverage before launching an Actor.
5.  A configured Apify Actor can be started from the backend.
6.  The user can see extraction progress.
7.  Returned posts and comments are normalized and stored.
8.  Re-running the same fully covered date range does not start another
    Actor run.
9.  Duplicate posts and comments are not inserted.
10. New comments receive sentiment analysis.
11. The dashboard displays real comment records and sentiment counts.
12. Users can filter and export comments.
13. Partial failures are visible and do not erase successful data.
14. Users cannot access another workspace's records.
15. API keys are never exposed to the browser.

------------------------------------------------------------------------

# 17. Instructions to the AI Website Builder

Build this application in the existing project if one exists; otherwise
initialize a new Next.js project.

Before coding:

1.  Inspect the project structure.
2.  Present a short implementation plan.
3.  Identify missing environment variables and Supabase configuration.
4.  Do not invent Apify Actor IDs or their input/output schemas.
5.  Ask for the actual Actor IDs and documentation/input examples when
    needed.
6.  Create database migrations and RLS policies.
7.  Build the responsive UI with reusable components.
8.  Implement server-side APIs.
9.  Test the complete workflow with one verified Actor.
10. Add clear setup instructions in `README.md`.

## Development rules

-   Use TypeScript throughout.
-   Keep components reusable and well organized.
-   Keep all secrets on the server.
-   Use environment variables and provide `.env.example` with
    placeholder values only.
-   Never hardcode production dashboard metrics.
-   Clearly label demo/mock data.
-   Do not create fake successful extraction states.
-   Do not mark coverage complete when the Actor has only partially
    returned data.
-   Use loading, empty, success, partial-success, and error states.
-   Make the application responsive for desktop, tablet, and mobile.
-   Keep the first release focused on comment monitoring rather than a
    full ORM suite.

## Expected final deliverables

-   Working Next.js application
-   Supabase SQL migrations
-   RLS policies
-   Apify integration adapter
-   One verified working platform integration
-   Sentiment analysis module
-   Comment monitoring dashboard
-   Fetch history and caching
-   CSV export
-   `.env.example`
-   Setup and deployment README
-   Test cases for cache logic, duplicate prevention, and data
    normalization

**Final product vision:** A simple, affordable, multi-platform social
media comment monitoring dashboard where an agency can select accounts,
choose a date range, fetch comments through Apify, understand audience
sentiment, and reuse previously fetched data instead of paying to
extract the same data repeatedly.
