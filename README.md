## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values in `.env.local`
3. In Supabase SQL Editor, run [supabase/schema.sql](/c:/Users/Lenovo/Desktop/MangoBD%20-%20TEST/supabase/schema.sql)
4. Run the app:
   `npm run dev`

Local product/order fallbacks and the admin test login only run on localhost in development mode.

## Production Build + Start

1. Build:
   `npm run build:prod`
2. Start server:
   `npm run start:prod`

Health endpoint:
- `GET /health` returns `{ ok: true }` with uptime/env details.

## Deploy to Namecheap (Node.js + Supabase)

This project uses:
- Frontend + Node runtime server on Namecheap (`server.js`)
- Database/Auth/API via Supabase
- Optional AI endpoint via Supabase Edge Function (`chat-assistant`)

### 1) Supabase setup (database/backend)

1. Create a Supabase project.
2. Run SQL from [schema.sql](/c:/Users/Lenovo/Desktop/MangoBD%20-%20TEST/supabase/schema.sql).
3. Enable Auth providers you need (Email, Google, etc.).
4. Set Site URL + Redirect URLs in Supabase Auth to your production domain.
5. (Optional AI assistant) deploy function:
   - `supabase functions deploy chat-assistant`
   - `supabase secrets set GEMINI_API_KEY="..." GEMINI_MODEL="gemini-2.5-flash"`

### 2) Namecheap cPanel setup

1. Go to **Web Applications** (or **Create Application**)
2. Configure the app:
   - **Node.js version:** 20.x
   - **Application mode:** Production
   - **Application root:** your repository path
   - **Application startup file:** `server.js`
   - **Application URL:** your live domain/subdomain
3. Click **Create** or **Save**
4. Add environment variables in cPanel app settings:
   - `NODE_ENV=production`
   - `PORT` (if required by host panel)
   - `VITE_SUPABASE_URL=https://<project-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=<supabase-anon-key>`
5. Deploy latest code from Git.
6. In terminal at app root:
   - `npm ci`
   - `npm run build:prod`
7. Restart the Node app from cPanel.
8. Verify:
   - `https://your-domain/health`
   - frontend loads and can fetch Supabase data

The `server.js` process serves static files from `dist` and handles SPA routing fallback.

## (Optional) Netlify

The project also includes `netlify.toml` for Netlify deployment, but Namecheap hosting does not use that configuration.

## Production Notes

- Admin access is controlled by the `users.role = 'admin'` value in Supabase, not by a hardcoded email.
- Order reads are production-locked to the customer who placed the order or an admin account.
- Guest customers can still complete checkout, and their confirmation page is preserved in the current browser session immediately after purchase.
- If you previously used the older open order-read policy, re-run the updated [schema.sql](/c:/Users/Lenovo/Desktop/MangoBD%20-%20TEST/supabase/schema.sql) before deploying.
- Keep `.env*` files out of git (already enforced by `.gitignore`).
