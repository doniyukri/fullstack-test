# Fullstack test

Nuxt, Vue, and TypeScript app with STAR, Terbilang, and employee data.
MongoDB stores the data. Elasticsearch stores the activity history.

## Run locally

Needs Node.js 22.22.3+ and Docker Desktop with Linux containers.

```bash
npm ci
cp .env.example .env
docker compose up -d --wait
npm run seed:reviewers
npm run dev -- --port 3001
```

Open http://localhost:3001. Use localhost, not 127.0.0.1, because the API checks the request origin.
MongoDB runs on port 27018 and Elasticsearch on 9201.

## Demo login

- Usernames: `reviewer1` to `reviewer10`
- Password for all accounts: `testting123456`
- `reviewer1` has saved STAR and Terbilang data and 25 demo employees

The seed keeps existing data and resets the demo passwords. These accounts are for local review.

## Checks

```bash
npm test
npm run typecheck
npm run build
npm run check:db
npm run test:e2e
```

Database checks need Docker running. Browser checks also need the app and Google Chrome.
Browser checks use the demo accounts and change calculator values.

## Notes

- Submit saves the input, then reads the output from the API
- Unchanged saves do not add history. STAR has a 60-second wait for repeated identical submissions
- Employee data and history are private per user. Lists load 10 records at a time
- The example CAPTCHA keys are for development. Production needs real Turnstile keys and HTTPS
- Keep `.env` out of Git. The Docker settings here are for local development
- Region data uses [Emsifa's API](https://github.com/emsifa/api-wilayah-indonesia) and needs internet when the cache is empty
- The logo is from [eci.id](https://eci.id)
- Low-severity npm findings remain in Nuxt build dependencies
