# Waiting Room Session Test App

A small React + TypeScript app for testing a waiting room / queue flow. It
validates the session on every access by calling a configurable endpoint,
redirects users to a configurable waiting-room URL when the session is missing
or invalid, and provides an `/expire` page that revokes the session via a
configurable endpoint.

## How it works

- On every page load and every route change, the app calls
  `GET {VITE_VALIDATE_URL}` with your cookies (`credentials: 'include'`).
- A `2xx` response means the session is active and the user stays in.
- A `401`/`403` response means the session is missing/expired, so the app shows
  an in-app waiting room page (with a "Check again" button). The configured
  `VITE_WAITING_ROOM_URL` is shown there as a direct link rather than being
  used for an automatic redirect.
- Any other response, or a network error, shows a "Try again" screen instead of
  redirecting — a broken endpoint won't kick everyone out.
- The `/expire` page (`#/expire`) has a "Revoke session" button that calls
  `GET {VITE_REVOKE_URL}` with your cookies. After a successful revoke,
  navigating anywhere triggers validation again, which fails and sends you back
  to the in-app waiting room.

The endpoints are the source of truth — the app never reads `document.cookie`,
so your session cookie can be `HttpOnly`.

## Routes

- `#/` — Home (protected area, shows session status and configured endpoints)
- `#/expire` — Expire page (button-triggered revoke)

The waiting room is not a route — it's shown in place of the app whenever the
session check fails. Routes are simple hash routes, so no router library is
needed.

## Configuration

Copy `.env.example` to `.env`, set your values, then restart the dev server.

| Variable                   | Purpose                                                             |
| -------------------------- | ------------------------------------------------------------------- |
| `VITE_VALIDATE_URL`        | GET endpoint that validates the session (2xx = active, 401/403 = bad) |
| `VITE_REVOKE_URL`          | POST endpoint that revokes/expires the session                      |
| `VITE_WAITING_ROOM_URL`    | URL users are redirected to when the session is invalid             |
| `VITE_SESSION_COOKIE_NAME` | Cookie name (informational/logging only)                            |

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
# terminal 1: start the app
npm run dev

# terminal 2: start the mock backend (http://localhost:8787)
npm run mock
```

With the default `.env` values you can then walk through the full flow:

1. Open `http://localhost:5173` — no session, so the app shows the in-app
   waiting room page.
2. Open `http://localhost:8787/api/session/grant` in a new tab — this sets the
   session cookie and returns you to the app. Back in the app, click
   "Check again" — validation now passes and you get in.
3. Go to `#/expire` and click "Revoke session" — the cookie is cleared.
4. Navigate back to `#/` — validation now fails and the in-app waiting room
   appears again.

Mock endpoints:

- `GET /api/session/validate` — 200 if the session cookie exists, else 401
- `POST /api/session/revoke` — clears the cookie, 200
- `GET /api/session/grant` — sets the cookie and redirects to the app
- `GET /waiting-room` — the waiting room page

## CORS and cookies

Cross-origin calls with cookies require your endpoints to respond with:

- `Access-Control-Allow-Origin: <app origin>` (not `*`)
- `Access-Control-Allow-Credentials: true`

If the app and your endpoints are on different sites, the session cookie also
needs `SameSite=None; Secure`.

To avoid CORS entirely in development, enable the commented-out dev proxy in
`vite.config.ts` and point `VITE_VALIDATE_URL` / `VITE_REVOKE_URL` at
same-origin paths such as `/api/session/validate`.

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
