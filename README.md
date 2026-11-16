# Electronic City Take-Home Test

A mobile-first employee app built with Nuxt, Vue, and TypeScript. The backend runs in Nuxt on Node.js.

## Features

- Login with Cloudflare Turnstile, server-side sessions, and login limits
- STAR patterns with three alignments
- Indonesian number wording with Rupiah
- Employee form with grade salary validation and linked region dropdowns
- Private employee search, filters, details, and infinite scrolling
- Activity history stored in Elasticsearch

## Requirements

- Node.js 22.22.3 or a newer supported Node 22 release
- Docker Desktop with Linux containers
- Google Chrome for the optional browser tests

## Setup

Run these commands from the project folder:

```bash
npm ci
cp .env.example .env
docker compose up -d --wait
npm run seed:reviewers
npm run dev -- --port 3001
```

Open http://localhost:3001. Use this address consistently because write requests check the origin.

MongoDB uses port 27018 and Elasticsearch uses port 9201. Both Docker ports are limited to localhost. The MongoDB replica set allows data and activity records to be saved in one transaction.

## Demo accounts

| Username   | Password       |
| ---------- | -------------- |
| reviewer1  | testting123456 |
| reviewer2  | testting123456 |
| reviewer3  | testting123456 |
| reviewer4  | testting123456 |
| reviewer5  | testting123456 |
| reviewer6  | testting123456 |
| reviewer7  | testting123456 |
| reviewer8  | testting123456 |
| reviewer9  | testting123456 |
| reviewer10 | testting123456 |

Reviewer1 has saved STAR and Terbilang values and 25 demo employees. Demo activity is labelled in history. Other reviewers start with their own empty data.

Running `npm run seed:reviewers` again preserves saved demo records and resets these ten demo passwords. These credentials are for local review only.

## CAPTCHA

The example environment uses official Cloudflare Turnstile test keys. They work with the development server. Production mode requires real Turnstile keys and HTTPS. Test keys are rejected outside development.

Set `NUXT_PUBLIC_TURNSTILE_SITE_KEY` and `NUXT_TURNSTILE_SECRET` for real keys. Keep `.env` out of Git.

## Tests

```bash
npm test
npm run typecheck
npm run build
```

With Docker services running:

```bash
npm run check:db
```

With the app and Docker services running:

```bash
npm run test:e2e
```

The browser tests use the demo accounts. They check phone layout, login, logout, employee privacy, filters, details, calculator saving, and history. They change demo calculator values.

## Project folders

- `app/`: pages, components, styles, and browser helpers
- `server/`: API routes, database access, and server validation
- `shared/`: schemas and calculation functions shared by the app and server
- `scripts/`: database and demo setup
- `tests/`: unit tests
- `checks/`: MongoDB checks using temporary test collections
- `e2e/`: browser tests

## Behavior

Submit saves calculator input, then loads the result from the API. Save & kembali asks about unsaved changes. Unchanged saves do not write data or add history. STAR rejects repeated identical submissions for 60 seconds.

Employee pages load ten records at a time. Each query includes the current user's ID. List responses omit salary and address; the details API checks ownership before returning them.

Golongan 1 accepts Rp3,000,000 to Rp5,000,000. Golongan 2 accepts Rp5,000,000 to Rp10,000,000. Golongan 3 accepts more than Rp10,000,000. The shared Rp5,000,000 boundary is allowed for either selected grade.

## Activity history

Data changes and pending activity are saved together in MongoDB. A background worker sends activity to Elasticsearch. Home also syncs pending records before reading history, so returning after a save shows the new activity. Failed delivery is retried. Browsing and unchanged saves do not add activity.

History includes changed fields and previous values. Employee salary, birth date, and address values are hidden in history. History is private per user and uses infinite scrolling. Refresh the page to check for new activity.

## Notes

- Region data comes from [Emsifa's Indonesian region API](https://github.com/emsifa/api-wilayah-indonesia) and is cached for one day
- Region dropdowns need internet access when the cache is empty
- The demo seed uses a small Jakarta fixture so it can run offline
- Search uses literal case-insensitive matching and is intended for a small directory
- The local Docker configuration is for development, not a public deployment
- The dependency audit still reports low-severity findings in Nuxt build dependencies
- The logo is from [eci.id](https://eci.id) and is used for this take-home project
