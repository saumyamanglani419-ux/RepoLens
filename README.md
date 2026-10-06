# RepoLens

> **Understand any codebase at a glance.**

RepoLens is a full-stack MERN application that analyzes any public GitHub repository and turns it into a clear, explorable report: languages, tech stack, dependencies, file structure, configuration, API endpoints, code metrics and a repository health score.

The analysis engine is **100% rule-based**, built from plain Node.js logic, regular expressions and lightweight parsers. It uses no AI/LLM APIs.

---

## Features

| Area | What you get |
| --- | --- |
| **Authentication** | Register, login, logout, profile update, password change and account deletion. JWT in an **httpOnly cookie**, bcrypt-hashed passwords. |
| **Repository analysis** | Paste any GitHub URL format (`https://…`, `github.com/…`, `git@github.com:…`, `owner/repo`). |
| **Repository details** | Owner, description, default branch, stars, forks, watchers, issues, license, topics, homepage, contributors. |
| **Languages** | GitHub-style language bar with percentages. |
| **Tech stack** | ~200 detection rules across 19 categories (frameworks, databases, ORMs, styling, testing, CI/CD, hosting, …), each with **evidence** explaining why it was detected. |
| **Dependencies** | Parses `package.json`, `requirements*.txt`, `pyproject.toml`, `Pipfile`, `go.mod`, `Cargo.toml`, `composer.json`, `Gemfile`, `pom.xml`, `build.gradle(.kts)`, `pubspec.yaml`. Production and dev split, registry links, monorepo aware. |
| **Structure** | Searchable, collapsible file tree with sizes and file counts; top-level folder roles; ~80 kinds of notable config files. |
| **API endpoints** | Static route discovery for Express, Fastify, Koa, Hono, NestJS, Next.js (app & pages router), SvelteKit, Flask, FastAPI, Django, Spring, Gin/Echo/Fiber/Chi/net/http, Rails, Laravel and ASP.NET Core. Express router mount prefixes (`app.use('/api/users', usersRouter)`) are resolved. |
| **Metrics** | Files, folders, size, depth, estimated LOC, test/doc/image counts, file types, largest files, code/comment/blank composition. |
| **Insights** | Health score (0–100, grade A–F) from 14 weighted checks, highlights, and warnings (committed `.env`, no license, no tests, stale repo…). |
| **History** | Saved analyses with search, sorting, pagination, re-analysis (with health-score delta vs. the previous run), delete and clear all. |
| **Dashboard** | Totals, average health, primary languages and technologies across everything you've analyzed. |
| **Export** | Download the full report as JSON. |
| **UX** | Responsive (mobile drawer nav), skeleton loaders, empty/error states, toasts, inline form validation, accessible tabs/dialogs/tree, reduced-motion support. |

---

## Tech stack

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS v4, React Router 7, Axios, react-icons (Lucide)
- **Backend:** Node.js 20+, Express 5, Mongoose 8 (MongoDB), JWT (`jsonwebtoken`), `bcryptjs`, `zod` validation, `helmet`, `cors`, `express-rate-limit`, `cookie-parser`, `morgan`
- **Analysis:** GitHub REST API + `raw.githubusercontent.com`, `smol-toml`, `yaml`
- **Tests:** Node's built-in test runner (`node --test`) with an offline fixture repository

Charts are hand-built SVG/CSS components (no chart library needed).

---

## Project structure

```
repolens/
├── package.json                 # root scripts: install:all, dev, build, start, test
├── client/                      # React + TypeScript + Vite + Tailwind
│   ├── index.html
│   ├── vite.config.ts           # dev proxy /api → http://localhost:5000
│   ├── .env.example
│   └── src/
│       ├── main.tsx, App.tsx    # entry + routes
│       ├── index.css            # Tailwind v4 theme
│       ├── types.ts             # report / API types
│       ├── lib/                 # api client (axios), formatters, URL parser
│       ├── context/             # AuthContext, ToastContext
│       ├── components/
│       │   ├── ui/              # Button, Input, Modal, Tabs, Logo, primitives
│       │   ├── layout/          # AppLayout (sidebar), route guards
│       │   └── analysis/        # report tabs, charts, file tree, cards, forms
│       └── pages/               # Landing, Login/Register, Dashboard, Analyze,
│                                # AnalysisReport, History, Settings, 404
└── server/                      # Express + MongoDB API
    ├── .env.example
    ├── src/
    │   ├── index.js             # bootstrap (DB connect, listen, graceful shutdown)
    │   ├── app.js               # express app, security middleware, routes
    │   ├── config/              # env validation, MongoDB connection
    │   ├── models/              # User, Repository, Analysis
    │   ├── middleware/          # auth (JWT), zod validation, error handler
    │   ├── controllers/         # auth, analysis
    │   ├── routes/              # /api/auth, /api/analyses
    │   ├── services/github.js   # GitHub REST + raw content client
    │   ├── utils/               # AppError, GitHub URL parser
    │   └── analyzer/            # the rule-based analysis engine
    │       ├── index.js         # orchestrates one analysis
    │       ├── files.js         # path classification, language colors
    │       ├── dependencies.js  # 11 manifest parsers
    │       ├── stack.js         # technology detection rules
    │       ├── configFiles.js   # config file catalogue
    │       ├── endpoints.js     # HTTP route detection
    │       ├── structure.js     # file tree + folder roles
    │       ├── metrics.js       # size / LOC / file-type metrics
    │       └── insights.js      # project type, health score, README, scripts
    └── test/
        ├── analyzer.test.js     # unit + integration tests (offline)
        ├── helpers/localClient.js
        └── fixtures/sample-repo # small full-stack repo used by the tests
```

---

## Getting started

### Prerequisites

- **Node.js 20+** (`node -v`)
- **MongoDB**, either local (`mongodb://127.0.0.1:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- *(Recommended)* a **GitHub token** (see below)

### 1. Install

```bash
cd repolens
npm run install:all        # installs root, server and client dependencies
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env     # optional; defaults work for local dev
```

Edit `server/.env`. At minimum set `MONGODB_URI` and `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # → paste as JWT_SECRET
```

### 3. Run in development

```bash
npm run dev
```

- React app: **http://localhost:5173**
- API: **http://localhost:5000/api** (health check: `/api/health`)

Vite proxies `/api` to Express, so the auth cookie stays first-party and no CORS setup is needed.

### 4. Run tests

```bash
npm test               # analyzer unit/integration tests (no network or DB needed)
npm run typecheck      # TypeScript check of the client
```

### 5. Production build

```bash
npm run build                         # builds client/dist
# in server/.env set NODE_ENV=production (and a strong JWT_SECRET)
npm start                             # Express serves the API *and* client/dist on PORT
```

In production the auth cookie is `Secure`, so serve the app over HTTPS (localhost is exempt in modern browsers).

---

## Environment variables

### `server/.env`

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `MONGODB_URI` | **yes** | `mongodb://127.0.0.1:27017/repolens` | MongoDB connection string (local or Atlas). |
| `JWT_SECRET` | **yes** (prod) | dev-only fallback | Secret used to sign JWTs. ≥32 random chars; required in production. |
| `JWT_EXPIRES_IN` | no | `7d` | Session lifetime (`12h`, `7d`, `2w` …). |
| `PORT` | no | `5000` | API port. |
| `NODE_ENV` | no | `development` | `production` enables secure cookies and serving `client/dist`. |
| `CLIENT_URL` | no | `http://localhost:5173` | Allowed CORS origin(s), comma-separated. |
| `GITHUB_TOKEN` | recommended | none | GitHub token. Raises the rate limit from **60 → 5,000 requests/hour**. |
| `GITHUB_API_URL` / `GITHUB_RAW_URL` | no | GitHub.com | Override for GitHub Enterprise or a local mock. |

### `client/.env`

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | API base URL used by the browser. |
| `VITE_DEV_API_PROXY` | `http://localhost:5000` | Where the Vite dev server proxies `/api`. |

**Creating a GitHub token:** GitHub → Settings → Developer settings → *Fine-grained tokens* → Generate. Choose "Public repositories (read-only)" and no extra permissions. The token only ever lives on the server; it is never sent to the browser.

---

## REST API

All responses are JSON. Errors have the shape `{ "error": { "message", "code", "details?" } }`.

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | — | Service + database status |
| `POST` | `/api/auth/register` | — | `{ name, email, password }` → sets session cookie |
| `POST` | `/api/auth/login` | — | `{ email, password }` → sets session cookie |
| `POST` | `/api/auth/logout` | — | Clears session cookie |
| `GET` | `/api/auth/me` | ✓ | Current user |
| `PATCH` | `/api/auth/me` | ✓ | `{ name }` |
| `PATCH` | `/api/auth/password` | ✓ | `{ currentPassword, newPassword }` |
| `DELETE` | `/api/auth/me` | ✓ | `{ password }`: deletes the account and its analyses |
| `POST` | `/api/analyses` | ✓ | `{ url }`: runs an analysis (creates or refreshes) |
| `GET` | `/api/analyses` | ✓ | History: `?q=&sort=recent\|oldest\|name\|health\|stars&page=&limit=` |
| `GET` | `/api/analyses/stats` | ✓ | Dashboard aggregates |
| `GET` | `/api/analyses/:id` | ✓ | Full report |
| `POST` | `/api/analyses/:id/reanalyze` | ✓ | Re-run against the latest code |
| `DELETE` | `/api/analyses/:id` | ✓ | Remove one analysis |
| `DELETE` | `/api/analyses` | ✓ | Clear history |

---

## How the analysis works

1. **Metadata:** `GET /repos/{owner}/{repo}` (rejects private repos).
2. **In parallel:** languages, the full recursive git tree of the default branch, and top contributors (3 more API calls).
3. **Selective downloads:** up to 16 dependency manifests, the README, `Makefile`/`Procfile`, and up to 70 *route-like* source files (scored by path: `routes/`, `controllers/`, `*.controller.ts`, `urls.py`, `app/**/route.ts`…). These come from `raw.githubusercontent.com`, which doesn't count against the API rate limit.
4. **Rule-based modules** run over the tree and the downloaded files: dependency parsers → stack rules → config catalogue → endpoint detectors → structure builder → metrics → insights/health score.
5. The report is stored in MongoDB (`Analysis.report`), with a lightweight `summary` for fast history and dashboard queries. Shared GitHub metadata is upserted into `Repository`.

A typical analysis makes **4 GitHub API requests**, so even without a token you can run ~15 analyses per hour.

### Data model

- **User**: name, email (unique), bcrypt password hash (`select: false`), timestamps
- **Repository**: shared GitHub metadata per repo (stars, forks, branch, license, …) + analysis counter
- **Analysis**: one per (user, repository): `summary`, `previousSummary` (for deltas), full `report`, `runCount`, `analyzedAt`

---

## Security

- Passwords hashed with **bcrypt** (12 rounds); never returned by the API (`select: false`).
- JWT stored in an **httpOnly, SameSite=Lax** cookie (`Secure` in production), so it is not readable from JavaScript.
- CSRF mitigation: SameSite cookies + mutating requests must be `application/json`.
- **Helmet** security headers, strict **CORS** allow-list, 50 KB JSON body limit.
- **Rate limiting** on login/register/password endpoints and on analyses (per user).
- **zod** validation on every request body; generic error messages for auth (no account enumeration).
- Users can only read and modify their own analyses (ownership enforced in every query).
- The GitHub token and JWT secret live only in `server/.env` (git-ignored); no secrets in frontend code.

---

## Limitations

- **Public repositories only.** Private repos are rejected by design.
- **Static, heuristic analysis.** Endpoint detection reads source text with patterns; dynamically-built routes, unusual frameworks or deeply nested router mounting may be missed or partially prefixed. Stack detection relies on manifests, config files and language stats.
- **LOC is an estimate** (source bytes ÷ bytes-per-line measured on sampled files).
- **Very large repositories:** GitHub may truncate the tree (>100k entries). RepoLens flags this, and the stored tree is pruned to ~4,000 nodes.
- **Rate limits:** without `GITHUB_TOKEN`, GitHub allows 60 requests/hour per server IP.
- Analyses run synchronously in the request (typically 1–10 s). There is no background job queue, by design.

---

## License

MIT
