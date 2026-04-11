## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values in `.env.local`
3. In Supabase SQL Editor, run [supabase/schema.sql](/c:/Users/Lenovo/Desktop/MangoBD/supabase/schema.sql)
4. Run the app:
   `npm run dev`

Local product/order fallbacks and the admin test login only run on localhost in development mode.

## Deploy To Namecheap

- Build command: `npm run build`
- Publish directory: `dist`
- Upload all files from `dist` into your Namecheap hosting folder (usually `public_html` or the target site folder).
- `public/.htaccess` is included in the build output and rewrites SPA routes to `index.html` so direct refreshes and deep links work.
- Keep your Supabase settings as build-time environment variables when generating the production build.

If you host this app in a subfolder, `vite.config.ts` is already configured with `base: './'` so built assets resolve using relative URLs.

> Note: The Supabase Edge functions and database setup are separate from Namecheap static hosting. The front-end deploys as a static site while Supabase remains your backend.

## (Optional) Netlify

The project also includes `netlify.toml` for Netlify deployment, but Namecheap hosting does not use that configuration.

Enable email/password authentication in Supabase Authentication before going live.

## Production Notes

- Admin access is controlled by the `users.role = 'admin'` value in Supabase, not by a hardcoded email.
- Order reads are production-locked to the customer who placed the order or an admin account.
- Guest customers can still complete checkout, and their confirmation page is preserved in the current browser session immediately after purchase.
- If you previously used the older open order-read policy, re-run the updated [supabase/schema.sql](/c:/Users/Lenovo/Desktop/MangoBD/supabase/schema.sql) before deploying.
