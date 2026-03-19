## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values in `.env.local`
3. In Supabase SQL Editor, run [supabase/schema.sql](/c:/Users/Lenovo/Desktop/MangoBD/supabase/schema.sql)
4. Run the app:
   `npm run dev`

Local product/order fallbacks and the admin test login only run on localhost in development mode.

## Deploy To Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20`
- SPA redirect is configured in `netlify.toml` so direct visits and refreshes on routes like `/products` or `/admin` resolve to `index.html`

Add the same Supabase environment values in Netlify.

Also configure Google as an auth provider in Supabase and add your Netlify domain plus local origin as allowed redirect URLs.

## Production Notes

- Admin access is controlled by the `users.role = 'admin'` value in Supabase, not by a hardcoded email.
- Order reads are production-locked to the customer who placed the order or an admin account.
- Guest customers can still complete checkout, and their confirmation page is preserved in the current browser session immediately after purchase.
- If you previously used the older open order-read policy, re-run the updated [supabase/schema.sql](/c:/Users/Lenovo/Desktop/MangoBD/supabase/schema.sql) before deploying.
