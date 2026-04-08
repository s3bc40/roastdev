# RoastDev — CLAUDE.md

## Project
Live polling app for roasting tech opinions as a team.

## Claude Code role
You are my pair programmer. You propose, I approve.
Work block by block. Never implement more than what the current prompt asks.
Explain every non-obvious choice before moving on.

## Locked stack
- Monorepo pnpm workspaces (apps/client, apps/server)
- Client: Vite + React + JavaScript (no TypeScript) + Socket.io-client
- Server: Node.js + Express + JavaScript + Socket.io + Mongoose
- Tests: Vitest everywhere
- CI: GitHub Actions

## Architecture
- Two MongoDB collections only: Session + Vote
- Questions are static in data/questions.json — no CRUD
- No TypeScript — plain JS
- No Turborepo

## Socket.io events
client → server : join_session(code), submit_vote(code, answerId)
server → client : session_joined(question), vote_update(results), error(message)
REST (host only) : POST /sessions, GET /sessions/:code, PATCH /sessions/:code/close

## Participant UX — two states
1. Voting: select an answer, submit
2. Waiting: vote confirmed, change answer allowed while session is live,
   live results visible only after submitting

## Learning rule
For every Node.js / Express / MongoDB pattern you implement,
explain why you chose this approach over an alternative.
I am learning this stack — understanding beats speed.