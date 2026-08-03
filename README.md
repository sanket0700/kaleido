# Kaleido

Share your world, in color.

A photo-sharing web app — the ground-up rebuild of a 2021 student project ([`MyInstagram`](https://github.com/sanket0700/MyInstagram)), this time with real auth, real data consistency, and an actual deploy target.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Firebase Authentication** — email/password
- **Cloud Firestore** — data
- **Firebase Cloud Storage** — post images / avatars
- **Cloud Run** — hosting (Google Cloud free tier)

## Local development

```bash
npm install
firebase emulators:start   # Auth + Firestore + Storage emulators
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000). Local dev talks to the Firebase emulators, not the live project — see `.env.local.example` for required config.

## Deployment

Pushes to `main` build a container and deploy to Cloud Run via GitHub Actions (`.github/workflows/deploy.yml`).
