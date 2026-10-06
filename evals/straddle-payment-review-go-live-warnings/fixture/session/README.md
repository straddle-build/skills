# Walkies

Dog-walk bookings. Owners pay per walk by bank transfer through Straddle.

## Running

- Node 24 or later. `npm start` runs `src/server.ts` directly with Node's built-in TypeScript type stripping, so there is no build step; `PORT` sets the port (default 3000).
- The app stores orders and verified Straddle webhook events in a file-backed SQLite database through the built-in `node:sqlite` module. `DATABASE_PATH` sets the file (default `data/walkies.sqlite`). The app runs as a single instance on one database file.
- `npm test` checks the event store and payment states: duplicates, ordering by `changed_at`, ties, holds by source, paid then reversed, rollback, and reopening the file.
- `GET /api/orders/:id` shows the signed-in owner the walk and tip payment states, the walk's fulfilment state, and the support action for a charge that ended without paying. The app never retries a charge itself.
