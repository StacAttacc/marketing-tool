# Budget Internal Tool

An internal marketing budget management and analytics dashboard. Input spend and results per channel per budget period, view ROI, CPA, and ARPU metrics, and chat with an AI analyst about your budget data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 4 (Vue 3, SSR) |
| Styling | Tailwind CSS v4 + DaisyUI v5 |
| API | oRPC (type-safe RPC over HTTP) |
| Data fetching | TanStack Query (Vue Query v5) |
| Database ORM | Drizzle ORM |
| Database | Neon (serverless PostgreSQL) |
| Auth | Better Auth |
| AI | Anthropic Claude (Haiku) |
| Charts | ApexCharts (vue3-apexcharts) |
| Date picker | v-calendar |
| Validation | Zod |
| Linting | ESLint (Nuxt config, stylistic, TypeScript) |
| Dev environment | Nix flake |

---

## Getting Started

### With Nix (recommended)

```bash
nix develop
pnpm run dev   # http://localhost:3000
```

The nix shell installs all system dependencies and sources `.env` automatically.

### Without Nix

```bash
npm install
npm run dev    # http://localhost:3000
```

### Environment variables (`.env`)

```
NODE_ENV=development

DATABASE_URL=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

ANTHROPIC_API_KEY=

# Only needed when running db:seed-admin
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
```

### Database commands

```bash
npm run db:generate   # generate migration files from schema changes
npm run db:migrate    # apply migrations to the database
npm run db:push       # push schema directly (dev only)
npm run db:studio     # open Drizzle Studio GUI
```

---

## Project Structure

```
budget-internal-tool/
├── app/
│   ├── components/es/         # all UI components (namespaced under "es")
│   │   ├── dashboard/         # dashboard charts and stat cards
│   │   │   ├── arpu/          # ARPU section
│   │   │   ├── cpa/           # CPA section
│   │   │   ├── roi/           # ROI section
│   │   │   ├── insights/      # insights section
│   │   │   └── table/         # dashboard data table
│   │   ├── inputs/            # data entry tables and modals
│   │   │   └── common/        # shared input primitives
│   │   ├── ChatModal.vue      # AI chat interface
│   │   ├── date-range-picker.vue
│   │   ├── nav-bar.vue
│   │   └── side-bar.vue
│   ├── composables/           # auto-imported Vue composables
│   ├── layouts/               # default and login-layout
│   ├── middleware/            # auth route guard
│   ├── pages/                 # file-based routes
│   ├── plugins/               # Nuxt plugins (oRPC, TanStack Query, ApexCharts, vCalendar)
│   ├── queries/               # TanStack Query hooks, one file per operation
│   └── utils/                 # shared utilities (auth client, formatCurrency)
├── server/
│   ├── api/
│   │   ├── auth/              # Better Auth handler
│   │   └── rpc/               # oRPC HTTP handler
│   ├── database/
│   │   ├── schemas/           # Drizzle table definitions
│   │   ├── migrations/        # auto-generated SQL migrations
│   │   └── db.ts              # Neon database connection
│   ├── orpc/
│   │   ├── router/            # all API procedures, grouped by resource
│   │   ├── authorized.ts      # base procedure with auth middleware
│   │   ├── context.ts         # request context (db, user session)
│   │   └── middlewares/       # oRPC middleware
│   └── utils/
│       └── auth.ts            # Better Auth server instance
├── shared/
│   └── utils/tryCatch.ts      # typed async error handling helper
├── tests/
│   ├── integration/           # integration tests against a real database
│   ├── unit/                  # unit tests
│   └── helpers/               # test utilities
├── nuxt.config.ts
├── drizzle.config.ts
└── eslint.config.mjs
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Login page |
| `/dashboard` | Analytics dashboard (ARPU, CPA, ROI, insights) |
| `/budget-input` | Data entry for spend, results, budgets, and campaigns |
| `/demo` | Demo/sandbox page |

All routes except `/` are protected by the `auth` middleware (`app/middleware/auth.ts`).

---

## Database Schema

### `budget`
A budget period (e.g. "Q1 2025").

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `budget_period` | text | Human-readable label |
| `total_budget_cents` | integer | Total budget in cents |
| `start_date` | date | Period start |
| `end_date` | date | Period end |

### `channel`
A marketing channel (e.g. "Google", "Meta").

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `name` | text | Unique channel name |

### `channel_budget`
Links a budget period to a channel and holds the allocated budget.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `budget_id` | uuid | FK → `budget` |
| `channel_id` | uuid | FK → `channel` |
| `allocated_budget_cents` | integer | Budget allocated to this channel |

Unique constraint on `(budget_id, channel_id)`.

### `campaign`
A campaign within a channel+budget allocation, with its own date range and budget.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `channel_budget_id` | uuid | FK → `channel_budget` |
| `amount_cents` | integer | Campaign budget in cents |
| `start_date` | date | Campaign start |
| `end_date` | date | Campaign end (nullable) |

### `spend`
An individual spend entry for a campaign on a date.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `campaign_id` | uuid | FK → `campaign` |
| `amount_cents` | integer | Spend amount in cents |
| `date` | date | Date of spend |

### `result`
An individual result entry (revenue + users acquired) for a campaign on a date.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `campaign_id` | uuid | FK → `campaign` |
| `date` | date | Date of result |
| `revenue_cents` | integer | Revenue in cents (nullable) |
| `users_acquired` | integer | Users acquired (nullable) |

### `budget_prediction`
A forward-looking prediction for a budget period.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `budget_id` | uuid | FK → `budget` |
| `prediction_period` | text | Label for the prediction period |
| `total_budget_cents` | integer | Predicted total budget |

### `channel_prediction`
Per-channel breakdown of a budget prediction.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `budget_prediction_id` | uuid | FK → `budget_prediction` |
| `channel_id` | uuid | FK → `channel` |
| `allocated_budget_cents` | integer | Predicted channel allocation |
| `predicted_revenue_cents` | integer | Predicted revenue (nullable) |
| `predicted_users_acquired` | integer | Predicted users (nullable) |

Unique constraint on `(budget_prediction_id, channel_id)`.

---

## API Layer (oRPC)

All API calls go through `/api/rpc` using oRPC. Every procedure requires authentication via the `authorized` base procedure in `server/orpc/authorized.ts`.

### Router structure

```
router/
├── budget/           create, list, filteredList, update, delete
├── channel/          list
├── channel_budget/   list, update
├── campaign/         create, list, filteredList, update, delete
├── spend/            create, list, filteredList, update, delete
├── result/           create, list, filteredList, update, delete, totalUsersAllTime
├── budgetPrediction/ create, filteredList, delete, getChannelPredictions
├── demo/             channelEfficiency, channelEfficiencyAllTime
├── user/             usersPerChannel, totalUsers
└── llm/              chat
```

`filteredList` procedures support sorting, pagination (`limit` + `offset`), and optional filtering by budget, channel, or date range. They return records plus a `pagination` object with `total`, `hasMore`, `limit`, and `offset`.

### Validation rules

- **Date ordering**: a budget's `endDate` must be on or after its `startDate`.
- **Allocation cap**: total channel allocations cannot exceed the budget's `totalBudgetCents`.
- **Search input**: the `search` parameter on `filteredList` is capped at 100 characters.

---

## AI Chat

The chat interface (`EsChatModal`) lets you ask questions about your budget data. Each message is stateless — no conversation history is maintained between sends.

**What you can send (at least one required):**
- **Text** — a free-form question or instruction
- **Budget** — select a budget period from the dropdown; the server fetches all associated spend, results, and predictions and includes them as JSON context
- **Image** — attach screenshots or charts (JPEG, PNG, GIF, WEBP)

**Server flow** (`server/orpc/router/llm/chat.ts`): receives the message, fetches budget data from the DB if a budget was selected, assembles content blocks for the Anthropic API, and returns plain text. Model: `claude-haiku-4-5-20251001`.

**Client flow** (`app/queries/llm/useChat.ts`): TanStack `useMutation` wrapping the oRPC call, following the same pattern as all other mutation hooks.

---

## Data Fetching (TanStack Query)

Query hooks live in `app/queries/` grouped by resource. Query keys are defined centrally in `app/queries/queryKeys.ts`.

Mutations invalidate via the base key (e.g. `queryKeys.spends`), which cascades to all derived keys via TanStack's prefix matching.

---

## Dashboard

The dashboard (`/dashboard`) has metric sections — **ARPU**, **CPA**, **ROI**, and **Insights** — each following the same pattern.

Each section has an `overview.client.vue` that owns `range` (date range) and `selectedChannel` state, passing them down to a chart and stat cards. The shared logic lives in the `useOverviewSection` composable.

Charts use ApexCharts with ISO date strings as x-axis categories. When only a single date exists in the data, a synthetic zero-value entry for the previous day is prepended so a line renders instead of an isolated point.

Channel colors are stable across sections — channels are sorted alphabetically and assigned colors from a fixed palette via `useChannelColors`.

---

## Tests

```bash
npm run test          # run once
npm run test:watch    # watch mode
```

Tests are in `tests/integration/` (run against a real database) and `tests/unit/`. Helpers are in `tests/helpers/`.

---

## Conventions

- All monetary values are stored and passed as **cents** (integers). Division by 100 happens only at display time.
- Component files ending in `.client.vue` are client-only (no SSR).
- All components are namespaced under the `Es` prefix (Nuxt auto-import convention).
- `shared/utils/tryCatch.ts` wraps promises in `{ data, error }` and is used in all server handlers instead of try/catch blocks.
# marketing-tool
