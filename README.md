# 🧳 TripSync — Group Vacation Planner

Plan a group vacation everyone actually agrees on. Each member submits their **budget**, **preferred destinations**, and **available dates** — TripSync combines them into one curated itinerary for the whole group.

**Live app:** https://tripsync-beige.vercel.app

Built with Expo (React Native + expo-router + TypeScript). Runs on iOS, Android, and web. Backend: Vercel serverless functions + Neon Postgres.

## Features (MVP)

- **Sign in** with just a name (mock auth, stored on device)
- **Create a group trip** — get a 6-character invite code to share
- **Join as a solo traveller** — enter a friend's invite code to join their existing group
- **Per-member preferences** — total budget (per person), destination votes, and any number of available date windows
- **Curated itinerary generation**:
  - Dates: the longest stretch when *everyone* is free (2–7 days)
  - Budget: set by the *lowest* member budget so nobody is priced out
  - Destination: scored by group votes, budget fit, and season match
  - Trips are automatically shortened to stay within budget
  - Day-by-day plan with morning / afternoon / evening activities and per-person costs
- **Alternatives** — tap any other candidate destination to rebuild the itinerary around it
- **"Why this trip"** notes explaining every decision the planner made

## Run it

```bash
npm install
npm run web       # in the browser (requires Node >= 20.19.4)
npm start         # scan the QR code with Expo Go for iOS/Android
```

Local dev talks to the production API by default; set `EXPO_PUBLIC_API_URL` to override.

## Deploy

```bash
vercel --prod
```

The Vercel project builds the web app with `npx expo export -p web` (see `vercel.json`) and deploys `/api/*.ts` as serverless functions. The Neon Postgres integration injects `DATABASE_URL`; the schema (a single `groups` table with a JSONB document per group) is created automatically on first request.

## How it works

| Piece | File |
|---|---|
| Domain types | `src/types.ts` |
| Destination catalog (10 destinations, ~10 activities each) | `src/data/destinations.ts` |
| Itinerary engine (date overlap, budget, scoring) | `src/lib/itinerary.ts` |
| API client store (React context) | `src/lib/store.tsx` |
| Serverless API (Neon Postgres) | `api/` |
| Screens | `src/app/` (expo-router) |

The itinerary engine runs **server-side** (`api/generate.ts`) so the whole group sees the same plan; it's a pure function shared with the client codebase.

## Current limitations

- Identity is a locally-stored anonymous user (no auth); clearing browser storage creates a new identity.
- Concurrent edits use last-write-wins at the group level.
- Destination catalog is static; a places/flights API could replace it later.
- Dates are entered as `YYYY-MM-DD` text (no calendar picker yet).
