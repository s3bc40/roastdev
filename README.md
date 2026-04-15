# RoastDev

> A live polling app for roasting tech opinions as a team.

[![CI](https://github.com/s3bc40/roastdev/actions/workflows/ci.yml/badge.svg)](https://github.com/s3bc40/roastdev/actions/workflows/ci.yml)
[![Deploy Check](https://github.com/s3bc40/roastdev/actions/workflows/deploy-check.yml/badge.svg)](https://github.com/s3bc40/roastdev/actions/workflows/deploy-check.yml)

---

## Goals

RoastDev lets a team host live opinion polls in real time:

- A **host** creates a session, gets a short code, and advances questions one by one.
- **Participants** join with the code, vote on each question, and watch live results the moment they submit.
- Questions are opinionated tech prompts (tabs vs spaces, best state manager, etc.) — the point is the debate, not the score.

The project was built as a learning exercise to practise the full Node.js / Express / MongoDB / Socket.io backend stack alongside a lightweight React frontend, all wired together in a pnpm monorepo.

---

## Tech stack

### Frontend — `apps/client`

| Tool                                | Role                      | Why                                                                                             |
| ----------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------- |
| **React 19**                        | UI component model        | Industry-standard declarative UI; hooks cover all state needs without a framework               |
| **Vite 8**                          | Dev server & bundler      | Near-instant HMR, native ESM, zero config for React                                             |
| **Socket.io-client 4**              | Real-time transport       | Pairs with the server library; handles reconnection and fallback automatically                  |
| **react-icons**                     | Icon set                  | Tree-shakeable SVG icons, no CSS bundle overhead                                                |
| **canvas-confetti**                 | Win animation             | Single-purpose, tiny lib — no need to pull in a heavier animation framework                     |
| **Vitest + @testing-library/react** | Unit tests                | Vitest reuses the Vite config; Testing Library encourages testing behaviour over implementation |
| **jsdom**                           | DOM environment for tests | Simulates the browser in Node so component tests run without a real browser                     |

### Backend — `apps/server`

| Tool            | Role                   | Why                                                                                      |
| --------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| **Node.js 20**  | Runtime                | LTS, native ESM support, large ecosystem                                                 |
| **Express 4**   | HTTP server            | Minimal, unopinionated; enough for a few REST routes without full framework overhead     |
| **Socket.io 4** | WebSocket layer        | Rooms, namespaces, and auto-reconnect baked in; pairs perfectly with the client lib      |
| **Mongoose 8**  | MongoDB ODM            | Schema validation at the application layer, lean query API, easy virtual fields          |
| **MongoDB**     | Database               | Document model fits session + vote shapes naturally; no rigid schema needed              |
| **dotenv**      | Environment config     | Keeps secrets out of code; standard Node.js practice                                     |
| **cors**        | CORS middleware        | Single-line cross-origin setup for the dev split (`:5173` → `:3001`)                     |
| **nodemon**     | Dev restart            | Watches `src/` and restarts on change — no manual server restarts during development     |
| **Vitest**      | Test runner            | Same runner as the client; supports multiple projects (unit / integration) in one config |
| **supertest**   | HTTP integration tests | Fires real HTTP requests against the Express app in-process; no network required         |

### Tooling — root

| Tool                        | Role             | Why                                                                                  |
| --------------------------- | ---------------- | ------------------------------------------------------------------------------------ |
| **pnpm workspaces**         | Monorepo manager | Strict, fast, disk-efficient; workspace protocol links packages without duplication  |
| **Prettier 3**              | Formatter        | Non-negotiable style enforced at commit time — no formatting debates in review       |
| **ESLint 10 (flat config)** | Linter           | Catches real bugs (`no-unused-vars`, `no-undef`); flat config is the modern standard |
| **GitHub Actions**          | CI/CD            | Free for public repos; runs format → lint → test on every PR                         |

---

## Architecture

```
roastdev/
├── apps/
│   ├── client/          # Vite + React SPA
│   │   └── src/
│   │       ├── pages/   # Home, Host, Participant
│   │       ├── components/
│   │       ├── hooks/   # useSession
│   │       └── tests/
│   └── server/          # Express + Socket.io API
│       └── src/
│           ├── models/  # Session.js, Vote.js (Mongoose)
│           ├── routes/  # sessions.js (REST)
│           └── socket/  # index.js (Socket.io handlers)
├── data/
│   └── questions.json   # Static question bank — no CRUD
├── .github/workflows/
│   ├── ci.yml           # Runs on every PR
│   └── deploy-check.yml # Runs on push to main (+ build)
├── eslint.config.js
├── .prettierrc
└── package.json         # Root scripts
```

**Two MongoDB collections:**

- `sessions` — holds the session code, active question index, open/closed state.
- `votes` — one document per participant per session, references session + answer chosen.

Questions live in `data/questions.json` and are loaded at server startup. There is no admin UI or CRUD for them — keeping them static removes an entire layer of complexity.

---

## Socket.io event map

```
client → server
  join_session(code)              # Participant joins a session room
  submit_vote(code, answerId)     # Participant casts or changes a vote
  next_question(code)             # Host advances to the next question

server → client
  session_joined(question)        # Confirms join; sends current question
  vote_update(results)            # Live vote counts after any submission
  next_question(question, hasMore)# Broadcasts new question to all in room
  error(message)                  # Validation or business-rule failure
```

---

## REST API (host only)

| Method  | Path                    | Description                                  |
| ------- | ----------------------- | -------------------------------------------- |
| `POST`  | `/sessions`             | Create a new session; returns the short code |
| `GET`   | `/sessions/:code`       | Fetch session state + current question       |
| `PATCH` | `/sessions/:code/close` | Close the session (no more votes accepted)   |

---

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 10 — install with `npm i -g pnpm`
- **MongoDB** running locally on the default port (`27017`), or a connection string to a remote instance

---

## Installation

```bash
git clone https://github.com/s3bc40/roastdev.git
cd roastdev
pnpm install
```

`pnpm install` at the root installs dependencies for all workspaces in one shot.

---

## Environment setup

Create `apps/server/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/roastdev
PORT=3001
```

The client talks to `http://localhost:3001` by default (configured in `apps/client/src/socket.js`).

---

## Running locally

```bash
pnpm dev
```

This runs the client and server in parallel:

- Client → `http://localhost:5173`
- Server → `http://localhost:3001`

To run each workspace individually:

```bash
pnpm --filter client dev
pnpm --filter server dev
```

**Typical flow:**

1. Open `http://localhost:5173` as the **host** — click _Create session_, copy the code.
2. Open a second tab as a **participant** — enter the code to join.
3. Host clicks _Next question_ to advance; participants vote and see live results.

---

## Running tests

Run all tests from the root:

```bash
pnpm test
```

### Client tests

```bash
pnpm --filter client test
```

Uses Vitest + jsdom + `@testing-library/react`. Tests cover the three pages (Home, Host, Participant) and assert on rendered output and socket interactions via mocks.

### Server unit tests

```bash
pnpm --filter server test
```

Tests REST route handlers and Socket.io event handlers in isolation, with Mongoose models stubbed out.

### Server integration tests

```bash
pnpm --filter server test:integration
```

Spins up a real Express app against a local MongoDB instance and fires HTTP requests with `supertest`. Verifies the full request → DB → response cycle without a running server process.

---

## Code quality

### Prettier

Config in `.prettierrc`:

```json
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

| Command             | When to use                                                |
| ------------------- | ---------------------------------------------------------- |
| `pnpm format`       | Locally, to auto-fix all files                             |
| `pnpm format:check` | CI — fails if any file is not formatted (never auto-fixes) |

Prettier runs as a pre-commit hook so formatting issues are caught before they reach the remote.

### ESLint

Config in `eslint.config.js` — ESLint 10 flat config style:

```js
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  js.configs.recommended, // catches real JS errors
  prettier, // disables rules that conflict with Prettier
]);
```

`eslint-config-prettier` is intentionally last — it turns off any ESLint style rules that Prettier already owns, so the two tools never fight each other.

| Command                     | Effect              |
| --------------------------- | ------------------- |
| `pnpm lint`                 | Lint all workspaces |
| `pnpm --filter client lint` | Lint client only    |
| `pnpm --filter server lint` | Lint server only    |

---

## CI/CD

### On every pull request — `ci.yml`

```
checkout → pnpm install → format:check → lint → test
```

The pipeline runs on `ubuntu-latest` with Node 20 and pnpm 10. `--frozen-lockfile` ensures the lockfile is never silently updated in CI.

### On push to `main` — `deploy-check.yml`

```
checkout → pnpm install → format:check → lint → test → build
```

Identical to CI plus a `pnpm build` step that confirms the client Vite build compiles cleanly — a sanity check before any deployment.

**Key decisions:**

- Format is checked before lint so style noise doesn't pollute linting output.
- `format:check` never writes — only `pnpm format` (local only) does. This prevents CI from silently mutating committed files.
- Tests run last because they are the slowest step; failing fast on format/lint saves time.

---

## Learning material

### Node.js & Express

- **ES modules in Node** — using `"type": "module"` in `package.json` enables native `import`/`export` without a build step. The trade-off: CommonJS `require()` and `__dirname` are unavailable; use `import.meta.url` + `URL` instead.
- **Middleware pipeline** — Express processes a request through a chain of `(req, res, next)` functions. Mounting `cors()` and `express.json()` before routes means every handler gets parsed bodies and correct CORS headers automatically.
- **Separation of `app.js` and `index.js`** — keeping the Express app factory separate from the server startup (`app.listen`) makes integration testing with `supertest` possible: tests import `app` without binding a port.

### MongoDB & Mongoose

- **Schema-first design** — even though MongoDB is schemaless, defining a Mongoose schema enforces shape at the application layer. This catches bad data before it reaches the database.
- **Two-collection design** — `Session` and `Vote` are separate documents rather than embedding votes inside sessions. This lets you query votes independently (e.g., count per answer) without loading the entire session document.
- **`lean()` queries** — calling `.lean()` on a Mongoose query returns plain JS objects instead of full Mongoose documents, which is faster when you only need to read data and don't need document methods.

### Socket.io

- **Rooms** — each session gets its own Socket.io room (keyed by session code). Broadcasting to a room (`io.to(code).emit(...)`) targets only connected participants in that session without looping over sockets manually.
- **Acknowledgements vs events** — `submit_vote` uses a plain event rather than an acknowledgement callback because the result (`vote_update`) needs to go to _all_ participants, not just the one who voted.
- **Reconnection** — Socket.io clients reconnect automatically on disconnect. The `join_session` handler is idempotent (re-joining the room is safe), so a participant who briefly loses connection rejoins cleanly without server-side cleanup.

### Testing

- **Unit vs integration** — unit tests replace Mongoose models with stubs and run instantly; integration tests hit a real database and catch issues that mocks can miss (index behaviour, validation at the DB level, query shape). Both layers are needed.
- **Testing Library philosophy** — queries like `getByRole` and `getByText` mirror how a user interacts with the UI, not how the code is structured. Tests that survive refactors are tests that assert on behaviour, not implementation details.
- **`supertest` in-process HTTP** — `supertest(app)` binds the Express app to an ephemeral port for each test. No server needs to be running, and there are no port conflicts between test workers.

### Monorepo with pnpm

- **Workspace protocol** — `workspace:*` in `package.json` references a local package by path instead of a registry version. pnpm resolves it to a symlink; no publishing step required during development.
- **`--frozen-lockfile` in CI** — prevents pnpm from updating the lockfile during install. If `pnpm-lock.yaml` is out of sync with `package.json`, CI fails loudly instead of silently drifting.
- **Parallel script execution** — `pnpm -r --parallel dev` runs the `dev` script in every workspace concurrently, wiring up client and server with a single command from the root.
