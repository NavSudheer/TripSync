# 🧳 TripSync — Group Vacation Planner

Plan a group vacation everyone actually agrees on. Each member submits their **budget**, **preferred destinations**, and **available dates** — TripSync combines them into one curated itinerary for the whole group.

Built with Expo (React Native + expo-router + TypeScript). Runs on iOS, Android, and web.

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
npm run web       # in the browser
npm start         # scan the QR code with Expo Go for iOS/Android
```

## How it works

| Piece | File |
|---|---|
| Domain types | `src/types.ts` |
| Destination catalog (10 destinations, ~10 activities each) | `src/data/destinations.ts` |
| Itinerary engine (date overlap, budget, scoring) | `src/lib/itinerary.ts` |
| Local "backend" (AsyncStorage store + React context) | `src/lib/store.tsx` |
| Screens | `src/app/` (expo-router) |

## Current limitations

- Data is stored **on-device only** (AsyncStorage acts as a mock backend), so groups can only be joined from the same device. Swapping `src/lib/store.tsx` for a real backend (e.g. Supabase/Firebase) makes it multi-device without touching the screens.
- Destination catalog is static; a places/flights API could replace it later.
- Dates are entered as `YYYY-MM-DD` text (no calendar picker yet).
