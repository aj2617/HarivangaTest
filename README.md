## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the Firebase and optional `GEMINI_API_KEY` values in `.env.local`
3. Run the app:
   `npm run dev`

## Deploy To Cloudflare Pages

This project is ready for Cloudflare Pages.

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: `20` or newer

### Environment variables

Add the same Firebase environment variables you use locally in the Cloudflare Pages project settings before deploying.

### Notes

- The app uses `HashRouter`, so no SPA rewrite rule is needed.
- For a Git-connected Cloudflare Pages project, do not add a custom deploy command.
