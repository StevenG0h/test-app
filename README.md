# Waiting Room Token Test App

A small React + TypeScript app for testing a waiting room / queue flow backed
by a token-based Go/Fiber API. On access the app requests a token from a
configurable endpoint; if the backend passes it straight through it gets in,
otherwise it shows an in-app waiting room and polls until a token is granted.
An `/expire` page invalidates the current token via a configurable endpoint.

## How it works

The backend (see the Go handlers `requestToken`, `validateToken`,
`invalidateToken`) decides between three outcomes when a token is requested:

- **Pass-through** — the queue is empty, so the user gets `{token, session}`
  and enters the app immediately.
- **Join the queue** — the user gets `{message}` and is shown the in-app
  waiting room until a token is granted.
- **Existing session** — the user already has a token and gets `{token}` back.

Flow:

- On page load the app calls `POST {VITE_REQUEST_TOKEN_URL}` with your cookies
  (`credentials: 'include'`).
  - `200 {token[, session]}` → active, user stays in.
  - `200 {message}` → queueing, app shows the in-app waiting room (with a
    "Check again" button). The configured `VITE_WAITING_ROOM_URL` is shown
    there as a direct link rather than being used for a redirect.
  - any other response / network error → "Try again" screen (a broken endpoint
    won't kick everyone out).
- On every route change the app re-checks the current token with
  `GET {VITE_VALIDATE_TOKEN_URL}?token=...`. A `400` means the token is
  invalid/expired → back to the in-app waiting room.
- The `/expire` page (`#/expire`) calls
  `GET {VITE_INVALIDATE_TOKEN_URL}?token=...&userId=...`. After a successful
  invalidation, navigating anywhere re-checks the token, which fails and sends
  you back to the in-app waiting room.

The endpoints are the source of truth — the app never reads `document.cookie`,
so your session cookie can be `HttpOnly`.

## Routes

- `#/` — Home (protected area, shows token status and configured endpoints)
- `#/expire` — Expire page (button-triggered token invalidation)

The waiting room is not a route — it's shown in place of the app whenever the
token check fails. Routes are simple hash routes, so no router library is
needed.

## Configuration

Copy `.env.example` to `.env`, set your values, then restart the dev server.

| Variable                      | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `VITE_REQUEST_TOKEN_URL`      | POST endpoint that requests a waiting-room token               |
| `VITE_VALIDATE_TOKEN_URL`     | GET endpoint that validates a token (`?token=...`)             |
| `VITE_INVALIDATE_TOKEN_URL`   | GET endpoint that invalidates a token (`?token=...&userId=...`) |
| `VITE_WAITING_ROOM_URL`       | URL shown on the waiting room page                             |
| `VITE_SESSION_COOKIE_NAME`    | Cookie name (informational/logging only)                       |

## Running

```sh
npm install
npm run dev
```

Open the printed URL (e.g. `http://localhost:5173`).

## Local testing with the mock server

The repo includes `mock-server.mjs`, a tiny fake waiting-room backend that
implements the exact contracts the app expects. It's useful to try the app
before your real endpoints are ready.

```sh
# terminal 1: start the app (talks to the mock via .env.mock)
npm run dev -- --mode mock

# terminal 2: start the mock backend (http://localhost:8787)
npm run mock
```

Walk through the full flow:

1. Open `http://localhost:5173` — first request has no session, so the app
   joins the queue and shows the in-app waiting room page.
2. Open `http://localhost:8787/api/token/grant` in a new tab — this grants a
   token for your session. Back in the app, click "Check again" — the app now
   gets `{token}` and you're in.
3. Go to `#/expire` and click "Revoke token" — the token is invalidated.
4. Navigate back to `#/` — the token check now fails and the in-app waiting
   room appears again.

To test the pass-through path (empty queue), start the mock with:

```sh
MOCK_PASS_THROUGH=1 npm run mock
```

Mock endpoints:

- `POST /api/token/request` — pass-through, join the queue, or existing token
- `GET /api/token/validate?token=...` — 200 valid | 400 invalid/expired
- `GET /api/token/invalidate?token=...&userId=...` — 200 | 400
- `GET /api/token/grant` — grants a token for the session (lets you in)
- `GET /waiting-room` — the waiting room page

## CORS and cookies

Cross-origin calls with cookies require your endpoints to respond with:

- `Access-Control-Allow-Origin: <app origin>` (not `*`)
- `Access-Control-Allow-Credentials: true`

If the app and your endpoints are on different sites, the session cookie also
needs `SameSite=None; Secure`.

To avoid CORS entirely in development, enable the commented-out dev proxy in
`vite.config.ts` and point `VITE_REQUEST_TOKEN_URL` / `VITE_VALIDATE_TOKEN_URL`
/ `VITE_INVALIDATE_TOKEN_URL` at same-origin paths such as `/api/token/request`.

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
