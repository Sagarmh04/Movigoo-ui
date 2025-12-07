# Movigoo Frontend UI

Premium, glassy, cinematic event booking interface crafted with Next.js App Router, TypeScript, Tailwind, Framer Motion, React Query, and ShadCN UI.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS with custom premium tokens
- Framer Motion for page + micro animations
- React Query + axios for data
- Firebase Firestore for realtime events (optional, falls back to API/seed data)
- ShadCN UI primitives (Button/Card/Dialog/Sheet/Tooltip/Drawer)
- Jest + Testing Library

## Getting Started

```bash
pnpm install   # or npm install / yarn
pnpm dev       # http://localhost:3000
```

### Environment variables

Create `.env.local` (copy from `.env.local.example`):

```
NEXT_PUBLIC_API_BASE_URL=https://api.movigoo.dev
NEXT_PUBLIC_MAP_KEY=pk.xxxxxx
NEXT_PUBLIC_PAYMENT_PROVIDER=stripe

# Firebase Configuration (for realtime events)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=1:xxxx:web:xxxxxxxx
```

**Firebase Setup (Realtime Events):**

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database (start in test mode for development)
3. Get your Firebase config from Project Settings > General > Your apps
4. Add the `NEXT_PUBLIC_FIREBASE_*` variables to `.env.local`
5. Create a Firestore collection named `events` with documents containing:
   - `title` (string, required)
   - `description` (string, optional)
   - `startAt` (Timestamp, required for ordering)
   - `endAt` (Timestamp, optional)
   - `image` (string, optional) - image URL
   - `host` (string, optional) - organizer name
   - `status` (string, required) - set to `"published"` for events to appear
   - `createdAt` (Timestamp, optional)
   - Additional fields: `city`, `venue`, `categories`, `priceFrom`, `organizerId`, `slug`, `coverWide`, `coverPortrait`, `rating`, `hosted`
6. Create a Firestore index for the query: `status` (ascending) + `startAt` (ascending)
   - Firebase Console will prompt you to create this index when you first run the query
7. Restart your dev server: `npm run dev`

Once Firebase is configured, events will load in real-time from Firestore. If Firebase is not configured, the app falls back to the API/seed data.

`NEXT_PUBLIC_API_BASE_URL` powers all `/api/events`, `/api/bookings`, and `/api/payments/verify` calls. Local mock: run `npx json-server ./scripts/mock-server.js` (see below) and point the base URL to `http://localhost:4000`.

### Mock API (demo)

1. `npx json-server --watch ./scripts/seed-data.json --port 4000 --routes scripts/mock-routes.json`
2. Update `.env.local` base URL to `http://localhost:4000`
3. All React Query hooks will now hit the mock endpoints using axios.

> Replace this mock with the real backend as soon as endpoints are online.

## Design System

- Tailwind tokens defined in `styles/tailwind.config.js` (`premium-glow`, `gradient-indigo`, `accent-amber`, `card-glass`)
- Global glassmorphism utilities in `app/globals.css`
- ShadCN-based UI components inside `components/ui`

## Key Features

- **Home**: Cinematic hero, 3D poster carousel, trending scroller.
- **Events listing**: Sticky glass filter bar, pill chips, infinite scroll grid.
- **Event detail**: Parallax hero, gallery, FAQ, sticky booking sidebar.
- **Booking**: Reusable `TicketSelector` and `BookingSidebar` with React Query mutation flow, success/failure animations, toasts.
- **Checkout**: Payment states (processing / success / failure) with micro interactions.
- **My Bookings**: Premium ticket cards with QR, download/share CTAs.
- **Mobile**: Bottom dock navigation, sheets/drawers for filters.

## Hosted Event Detection

Front-end compares `event.organizerId === currentUser.id`. Backend can also send `hosted: true` to avoid duplicate logic. Organizer view adds `HostedBadge`, glowing borders, and “Manage Event” CTA.

## API Contract

Detailed request/response samples live in `docs/api-contract.md`.

## Testing

```bash
pnpm test
```

Tests cover `EventCard` (hosted badge) and `TicketSelector` (quantity limits). Add more as booking logic evolves.

## Deployment Notes

- Ensure env vars are configured in hosting provider (Vercel).
- Next/Image allows any HTTPS host (`next.config.mjs`). Restrict once CDN domains are final.
- React Query cache is client-side; use SSR if SEO required for listings.
- Replace `hooks/useCurrentUser` with production auth (Clerk/Auth0/custom).

## Backend Integration Checklist

- `/api/events` paginated list with hosted flag.
- `/api/events/:slug` returns `ticketTypes` + `organizer`.
- `/api/bookings` returns `{ bookingId, status, paymentUrl?, booking }`.
- `/api/payments/verify` handles payment provider callbacks.
- `/api/bookings?userId=` returns prior purchases for `My Bookings`.

Once live, the booking sidebar will call the backend mutation, show processing loader, then display success/failure states with `PaymentSuccessAnimation` or `PaymentFailureAnimation`.

