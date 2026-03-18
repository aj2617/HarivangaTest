## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the Firebase and optional `GEMINI_API_KEY` values in `.env.local`
3. Run the app:
   `npm run dev`

## Deploy To Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20`

Add the same Firebase-related environment values in Netlify if you use environment-based secrets there.

Also add your Netlify domain in Firebase Authentication -> Authorized domains before testing Google login on the deployed site.
