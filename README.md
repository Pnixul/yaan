# YAAN

**Understand the area before making it part of your life.**

YAAN is a mobile-first location risk web application that helps people understand an area before deciding to live, move, or regularly spend time there.

The initial focus is **historical flood information and flood-related risk in Bangkok, Thailand**.

YAAN turns location-related data into information that is easier to understand, while keeping the underlying evidence and limitations accessible.

## Core Experience

**Find a place → Understand the surrounding area → Explore supporting evidence**

YAAN is designed around the location the user cares about rather than a complex data dashboard.

It is not intended to predict floods with certainty or replace general-purpose map applications.

## Tech Direction

The project is built around:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- MapLibre GL JS
- Vercel

Location search, geocoding, map tiles, and other external providers are selected separately based on product requirements.

See [`docs/TECH_STACK.md`](docs/TECH_STACK.md) for technical direction.

## Documentation

Project direction is defined in:

- [`PRODUCT.md`](docs/PRODUCT.md) — product purpose and boundaries
- [`UX.md`](docs/UX.md) — user experience principles
- [`DATA.md`](docs/DATA.md) — data and risk principles
- [`DESIGN.md`](docs/DESIGN.md) — visual and responsive direction
- [`TECH_STACK.md`](docs/TECH_STACK.md) — technical architecture and stack

AI coding agents should also follow [`AGENTS.md`](AGENTS.md).

## Project Structure

```text
yaan-location-risk/
├── AGENTS.md
├── README.md
└── docs/
    ├── PRODUCT.md
    ├── UX.md
    ├── DATA.md
    ├── DESIGN.md
    └── TECH_STACK.md
```

The application structure will evolve with implementation. Avoid creating architecture that is not yet required.

## Development

Use Node.js 20.9+ and npm. Run `npm ci`, then `npm run dev`. Checks are `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`; run `npm start` for the production build.

Home, search, and Explore work without authentication. Saved Places requires a Supabase account; signed-out visitors see a sign-in state. A signed-out Save carries the selected place and Explore URL through Auth and automatically saves before returning. Legacy guest saves are discarded without import.

### Supabase Auth setup

Use the existing YAAN Supabase project; do not create another project. Copy `.env.example` to `.env.local` and set:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL from the project's Connect dialog |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key beginning `sb_publishable_` from that same project |
| `SITE_URL` | `http://localhost:3000` locally; the exact HTTPS app origin in production, without a path |

Never use a service-role or secret key. `.env.local` is ignored. Set the same variables in deployment configuration and rebuild/restart after changing them. An unconfigured app shows an Account-unavailable state rather than pretending authentication works.

In the existing project's Authentication settings:

1. Enable the Email provider and email/password signups. Keep **Confirm email** enabled for production. The app also handles projects where confirmation is disabled, but does not change this setting.
2. Set **Site URL** to the app's canonical origin. Under **Redirect URLs**, allow the exact confirmation URL for each intended environment: `http://localhost:3000/auth/confirm` locally and `https://YOUR_APP_DOMAIN/auth/confirm` in production. `SITE_URL` selects the app origin used by that deployment; do not use broad production wildcards.
3. In **Email Templates → Confirm signup**, the default `{{ .ConfirmationURL }}` link is supported. Supabase confirms the email, then redirects to YAAN with a PKCE code. YAAN exchanges that code for session cookies, completes a matching pending save, and returns to the original Explore URL (or Account/Saved for a normal sign-in). Open the link in the same browser/profile and on the same app origin used to sign up, because the exchange requires the signup verifier cookie. If the email opens in another browser, the email may still be confirmed, but you will need to sign in manually.

   Alternatively, this custom token-hash link is supported:

   ```html
   <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a>
   ```

   Registration supplies the allowlisted `/auth/confirm` URL as `emailRedirectTo`. With the custom link, YAAN verifies the token directly and sets session cookies, then follows the same validated return flow. This token-hash flow supports confirming in another browser, but a pending save stays in the original browser: return there and sign in to finish it. Expired/reused links show recovery guidance; passwords, codes, and confirmation tokens are never echoed in errors.
4. Configure custom SMTP for production email delivery. Supabase's default sender has restrictions and rate limits; verify your test recipient is permitted. Do not disable confirmation to hide a delivery problem.

Account uses the managed `auth.users` identity and email only. Saved Places uses the migration below. See [the implemented architecture](docs/TECH_STACK.md#saved-places-persistence).

### Saved Places database setup

The migration [20261004020906_create_saved_places.sql](supabase/migrations/20261004020906_create_saved_places.sql) has been applied to the existing YAAN project and recorded in its migration history. **Do not reapply it there.** No new environment variables, service-role key, profile table, or Auth configuration changes are required.

For an environment where it has not been applied, open that Supabase project's SQL Editor, paste the entire migration file, and run it once. This creates `public.saved_places`, explicit grants, and owner-only SELECT/INSERT/DELETE RLS policies. SQL Editor does not record CLI migration history; use your normal Supabase CLI migration workflow instead if that environment is managed by CLI migrations.

To verify database isolation, run the complete [Saved Places SQL test](supabase/tests/saved_places.sql) in the SQL Editor as postgres after the migration. It creates test users and records only within a transaction, checks ownership/grants/idempotency/cascade behavior, and rolls everything back. It sends no emails and does not change existing users or their saves.

### Saved Places and pending-save acceptance

1. Signed out, open Saved. Check the primary sign-in/create-account action and secondary Explore link. Legacy browser saves must not appear or be imported.
2. Open a place with a reference, category, or mock route selected. Choose Sign in to save, then authenticate. The exact Explore URL should return with the place already saved, without a second Save click.
3. Repeat through signup and email confirmation in the same browser. Invalid/expired confirmation should preserve recovery; confirm elsewhere and return to the original Account page to sign in if necessary.
4. Enter incorrect credentials, refresh Account, switch auth modes, and cancel. Errors must retain valid intent; cancellation should restore Explore without saving. A request expires after 24 hours, and a newer Save replaces the previous one.
5. Test a failed post-auth save and Retry save and return. Verify one saved row, pending controls, no false success, and no unintended save from normal Account visits or arbitrary return URLs.
6. Verify account A/B isolation, reload persistence, unsaving and keyboard focus, and sign-out. Signed-out users must see the authentication state, never another account's list.

No new environment variables, callback allowlist entries, migrations, or providers are needed. Geographic routing and realtime subscriptions remain deferred. Place details and journeys still use mock fixtures.

### Explore routing verification

Explore supports `area`, `reference`, `place`, `category`, and `view=conditions|route` query parameters. For example, `/explore?area=ari&reference=ari-bts&category=food` restores nearby food around Ari BTS. Existing `/explore?place=…` Saved links open place details without establishing a reference. See `docs/UX.md` and `docs/TECH_STACK.md` for navigation and validation rules. `npm test` includes URL parsing, restoration, and navigation-hook regressions.

Before Deploy, check on mobile and desktop:

1. Open an area from Home, inspect a place, choose “Explore around this place,” select a category, and open another place. Refresh and open a copied URL in a new tab; area, reference, category, and details should match.
2. Use browser Back/Forward across list, detail, “Back to nearby,” and reference changes. Confirm the visible panel matches the URL and repeated selection does not add duplicate steps.
3. Open a place from Saved and refresh. It should have no implicit reference; “Back to area” should work even in a new tab. Confirm saving/unsaving still works for the active account list.
4. Open Directions, refresh, then Clear route and use Back/Forward. The existing mock route and its endpoints should restore; no real navigation claim is introduced. Check Area context restoration as well.
5. Try unknown/repeated IDs and mismatched area/reference/place parameters. The page should resolve safely without crashing or displaying a route between different areas. Check keyboard operation and the mobile detail sheet.

### Auth acceptance checks after configuration

Use a test email you control. On mobile first, then tablet and desktop:

1. Open Account signed out. Check labels, visible keyboard focus, required fields, invalid email, short signup password, and error feedback.
2. Sign up. With email confirmation enabled, check that Account says to check email and does not claim a signed-in session. Follow the email link and confirm Account shows your email. With confirmation disabled, a returned session should show signed-in Account immediately.
3. Sign out, sign in, navigate Home → Search → Explore → Account, and reload. The account should persist until sign out. Check incorrect-password and unconfirmed-email errors too.
4. Sign out and reload; Account should offer sign in. Attempt to save while signed out and verify the Auth handoff. Saved must show its sign-in state; signing out must not delete account saves.
5. Check the confirmation route with missing, invalid, expired, or reused tokens and an external `next` parameter. It must only return to a validated internal destination; invalid callbacks should preserve a valid pending-save recovery path. Check the loading/retry states under slow/offline Auth requests and ensure no horizontal overflow at 320px, tablet, and desktop widths.

Live registration, email delivery, sign in, session refresh/persistence, and sign out require the project configuration above and a confirmed test account. A successful build or a simulated UI check does not verify those live flows.

Run `node --test scripts/auth-confirm.test.mjs` for callback regression checks with a stubbed Supabase boundary. After callback changes, sign up with a fresh test email/alias, open the newly delivered link once in the signup browser, and verify the final URL is `/account`, your email is shown as signed in, and refreshing preserves the session. An already consumed confirmation link cannot verify this success path.

The implementation follows [Supabase SSR guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client) and [password authentication guidance](https://supabase.com/docs/guides/auth/passwords). OAuth, password reset, profile editing, account deletion, remain deferred. Legacy local saves are not imported.

## Status

YAAN is currently in active development.

The initial implementation focuses on establishing the core location-based flood experience before expanding into additional capabilities.

## Principles

YAAN should remain:

- useful;
- understandable;
- trustworthy;
- mobile-first;
- lightweight;
- intentionally designed.

For implementation decisions, prefer the relevant document in `/docs` over assumptions.
