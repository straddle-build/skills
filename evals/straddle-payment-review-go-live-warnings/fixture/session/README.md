# Walkies

Dog-walk bookings. Owners pay per walk by bank transfer through Straddle.

## Running

- Node 24 or later. `npm start` runs `src/server.ts` directly with Node's built-in TypeScript type stripping, so there is no build step; `PORT` sets the port (default 3000).
- The app stores orders and verified Straddle webhook events in a file-backed SQLite database through the built-in `node:sqlite` module. `DATABASE_PATH` sets the file (default `data/walkies.sqlite`). The app runs as a single instance on one database file.
- `npm test` checks the event store: duplicates, ordering by `changed_at`, ties, rollback, and reopening the file.
