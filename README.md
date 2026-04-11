## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values in `.env.local`
3. In Supabase SQL Editor, run [supabase/schema.sql](/c:/Users/Lenovo/Desktop/MangoBD/supabase/schema.sql)
4. Run the app:
   `npm run dev`

Local product/order fallbacks and the admin test login only run on localhost in development mode.

## Deploy To Namecheap as Node Server

This app runs as a Node.js server that serves the built Vite React frontend.

### Setup in cPanel

1. Go to **Web Applications** (or **Create Application**)
2. Configure the app:
   - **Node.js version:** 20.x
   - **Application mode:** Development (or Production)
   - **Application root:** `/home/bongcgmc/repositories/HarivangaTest`
   - **Application startup file:** `server.js`
   - **Application URL:** `banglamail.xyz`
3. Click **Create** or **Save**
4. Go to **Git Version Control**
5. Find **HarivangaTest** repository
6. Click **Pull or Deploy**
7. Click **Update from Remote** then **Deploy HEAD Commit**
8. Wait for deployment to complete
9. Open **banglamail.xyz** in your browser

The `server.js` file handles all requests and serves the built React app from `dist/`. SPA routing is handled automatically.

Keep your Supabase environment variables available during the build process.

## (Optional) Netlify

The project also includes `netlify.toml` for Netlify deployment, but Namecheap hosting does not use that configuration.

Enable email/password authentication in Supabase Authentication before going live.

## Production Notes

- Admin access is controlled by the `users.role = 'admin'` value in Supabase, not by a hardcoded email.
- Order reads are production-locked to the customer who placed the order or an admin account.
- Guest customers can still complete checkout, and their confirmation page is preserved in the current browser session immediately after purchase.
- If you previously used the older open order-read policy, re-run the updated [supabase/schema.sql](/c:/Users/Lenovo/Desktop/MangoBD/supabase/schema.sql) before deploying.
