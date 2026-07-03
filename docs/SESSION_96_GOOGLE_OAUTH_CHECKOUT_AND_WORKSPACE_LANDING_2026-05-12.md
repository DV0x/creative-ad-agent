# Session 96 — Google OAuth signup → checkout redirect + workspace landing fix

**Date:** 2026-05-12
**Branch:** `new-ui`
**Staging:** ✅ deployed `55172654-544d-4999-b361-78111ad80828` (4 flows verified by user)
**Production:** ✅ deployed `1e0cdd81-79f9-46fb-8da0-563866a299c7` on `creativemachines.xyz` (4 flows verified by user)
**Commit:** `35e7807` — `fix(auth): route google-oauth signups to checkout, land all signups in workspace`

---

## TL;DR

| Area | What broke | What changed | Verified? |
|---|---|---|---|
| **Google OAuth → paid signup** | New users clicking Starter/Pro/$5-wedge and signing up with Google were stranded on `/` (or `/workspace` for returning users) instead of being bounced to Dodo checkout. Email signup worked. | Added an early `useEffect` in `AppContent` that checks `sessionStorage.pendingCheckout` on `isSignedIn` and redirects to `/checkout/init` regardless of which redirect URL Clerk picked. | ✅ staging + prod |
| **Workspace landing for brand-new signups** | Brand-new users with zero campaigns were left on the marketing landing page, never seeing the S86 editorial welcome hero. Existing users were unaffected (their `appState='workspace'` was already persisted by S91). | Dropped the `campaigns.length > 0` guard in the auto-nav effect. All signed-in users now flip to `appState='workspace'`; workspace renders welcome hero when there's no active campaign. | ✅ staging + prod |

Both fixes live in the same file (`client/src/App.tsx`), one commit, one deploy.

---

## The problem (as user reported)

> "in the staging we need to check the end to end flow when a first user came in and click one of the subscription. right now when a new user clicks on the subscription and then login using google its not redirecting to the payment gateway. its working fine if user enter email."

Asymmetric breakage — **email signup** completed the full pricing → checkout → payment flow, but **Google OAuth** landed the user back on the marketing landing (`/`) with no redirect to Dodo. The pending plan intent was set but never consumed.

A second observation came up during investigation:

> "i guess in the previous sessions we made the decision to land them on the workspace even if its the new user. can you check?"

This turned out to be a separate, latent bug from a previous design decision that was never wired up in routing (see S86/S91 context below).

---

## Investigation

### Step 1 — Map the post-auth flow

The pricing → checkout flow has three actors:

1. **`client/src/components/landing/Pricing.tsx:59-69`** — User clicks Starter/Pro/wedge. Handler writes intent to `sessionStorage` (key: `creative-agent:pendingCheckout`) and navigates to `/sign-up?plan=…&interval=…`.
2. **`client/src/components/auth/SignIn.tsx:13-22, 118-129`** — Reads the `?plan=` query param; renders `<ClerkSignUp forceRedirectUrl="/checkout/init">`. Comment in the file already acknowledges Clerk's history of stripping query params during OAuth (`clerk/javascript#2440, #3796`) — that's why sessionStorage is the primary persistence path, URL is fallback.
3. **`client/src/App.tsx:483-548`** — `CheckoutInit` component at `/checkout/init`. Reads sessionStorage via `readPendingCheckout()`, calls `paymentsApi.checkout(...)` or `paymentsApi.topup(...)`, then `window.location.href = res.checkout_url` to Dodo.

For email signup, this chain works end-to-end: Clerk respects `forceRedirectUrl`, drops the user on `/checkout/init` in the same tab, sessionStorage is intact, checkout fires.

For Google OAuth, **the user lands on `/` instead of `/checkout/init`** — confirmed by the user observing the home page after Google login.

### Step 2 — Why Clerk routes Google OAuth differently

In `client/src/main.tsx:14-21`, the `<ClerkProvider>` is configured with:

```tsx
afterSignInUrl="/"
afterSignUpUrl="/"
```

These provider-level defaults are *supposed* to be overridden by the component-level `forceRedirectUrl="/checkout/init"`, and they are for email signup. But for **social OAuth flows**, the provider-level `afterSignUpUrl` wins. This is a long-standing Clerk quirk (see `clerk/javascript#2440` and `#3796`).

So a Google-signing-up user with a pending checkout ends up at `/` with `sessionStorage.pendingCheckout` still set — nothing on `/` reads it, payment never fires.

### Step 3 — A second, older bug surfaced

While verifying the routing, the user noted: signed-in users *should* land on `/workspace` per the S86 design, but only existing users actually did. New signups stayed on the marketing landing page.

`git blame` on `client/src/App.tsx:165-186` showed:

- The auto-nav block dates from commit `75aa63a` (**2026-01-30**, "Auth-gate WebSocket connection"), when a signed-in-but-no-campaigns user *did* belong on the public-style landing page.
- **S86** (commit `d5d1311`, **2026-05-01**) shipped the editorial welcome hero on `/workspace` with explicit intent: "first sign-in" should see the editorial poster, not the marketing landing.
- **S91** (commit `033f456`, **2026-05-02**) added Zustand `persist`, which is why existing users seamlessly land on `/workspace` (their `appState` was persisted). Brand-new users have no persisted state, so they hit the January gate that requires `campaigns.length > 0` — and fall back to the landing page.

So the workspace-landing decision was made in S86, reinforced in S91, but the upstream routing gate from January was never updated. The welcome hero was built and is on the page; nobody was triggering it.

Cited verbatim from `docs/SESSION_86_WORKSPACE_EMPTY_STATE_UX_2026-05-01.md:442`:
> Land on `/workspace` → editorial welcome hero ("Welcome in, {firstName}. Your studio is open.") with wine accent + long hand-drawn arrow pointing at chat

And `docs/SESSION_91_WORKSPACE_STATE_REFACTOR_2026-05-02.md:128`:
> [Welcome hero] fires for **first sign-in**, every "+ New campaign" click, fork-from-existing, refresh-with-deleted-active-id.

---

## The fix

Two changes, both in `client/src/App.tsx`, in the `AppContent` component:

### Change 1 — New early effect for paying-intent redirect

Added between the data-load effect and the auto-nav effect (around `App.tsx:165-176`):

```tsx
// Paying-intent redirect — fires as soon as auth is ready, before data load.
// Pricing.tsx stores plan/wedge intent in sessionStorage before bouncing through
// Clerk. For email signup, Clerk honors the component's forceRedirectUrl and
// drops the user at /checkout/init directly. For Google OAuth, Clerk's
// ClerkProvider-level afterSignUpUrl="/" wins instead, stranding the user at
// the landing page with their pending checkout unread. This catches that case.
useEffect(() => {
  if (!isLoaded || !isSignedIn) return
  if (sessionStorage.getItem('creative-agent:pendingCheckout')) {
    window.location.href = '/checkout/init'
  }
}, [isLoaded, isSignedIn])
```

Key design decisions:
- **Fires on `isSignedIn`, not `dataLoaded`.** Pay-intent users shouldn't wait for the campaigns/folders/credits/subscription fetch — they have nothing yet. Separate effect keeps the latency tight.
- **`window.location.href` (not `pushState`)** so React state resets cleanly when `CheckoutInit` mounts (it expects a fresh auth-ready environment).
- **Doesn't `removeItem` here** — `readPendingCheckout()` in `CheckoutInit` already does that. Keeps the consumer in one place.
- **`AppContent` doesn't mount on `/checkout/init`** (App.tsx:667-669 returns `<CheckoutInit />` before `AuthenticatedApp`), so this effect can't ping-pong the user.

### Change 2 — Drop the `campaigns.length > 0` guard

Modified the existing auto-nav effect (`App.tsx:188-203`):

```tsx
// Per S86: signed-in users always land in workspace — regardless of whether
// they have campaigns. The workspace renders ResultsView when there's an
// active campaign and the editorial welcome hero otherwise.
if (appState === 'landing' && !isCreatingCampaign) {
  if (campaigns.length > 0) {
    const mostRecent = [...campaigns].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )[0]
    setActiveCampaignId(mostRecent.id)
  }
  setAppState('workspace')
}
```

Behavior:
- User with campaigns → still picks most recent and sets it active (unchanged).
- User without campaigns → no `setActiveCampaignId`, just flips to workspace. `selectWorkspaceReady` selector from S86 handles the gate so the welcome hero renders without flicker.

### Diff stats

```
client/src/App.tsx | 23 insertions(+), 6 deletions(-)
1 file changed, 17 net lines
```

---

## Validation

### Staging (deployed `55172654`)

User tested four flows on `creative-agent-staging.alphasapien17.workers.dev` with fresh Google accounts:

| # | Flow | Expected | Result |
|---|---|---|---|
| 1 | Signed-out → Starter → email signup | Redirect to Dodo checkout | ✅ |
| 2 | Signed-out → Starter → Google OAuth | Redirect to Dodo checkout | ✅ (was broken before fix) |
| 3 | Signed-out → $5 wedge → Google OAuth | Redirect to Dodo top-up | ✅ |
| 4 | Brand-new signup, no pricing intent | Land on `/workspace` with editorial welcome hero | ✅ (S86 intent now actually fires) |

### Production (deployed `1e0cdd81`)

Same four flows re-tested on `creativemachines.xyz` — all four ✅.

### Account-reuse note for testers

`agency5027@gmail.com` and `drkbabu1965@gmail.com` were re-used as fresh test accounts. Steps for reuse: delete the user in the Clerk dashboard (staging Clerk app for staging, production for prod) — old D1 rows become orphaned but harmless because Clerk assigns a new `user_id` on re-signup.

---

## Files touched

```
client/src/App.tsx                            — fix (1 file)
docs/SESSION_96_GOOGLE_OAUTH_CHECKOUT_AND_WORKSPACE_LANDING_2026-05-12.md  — this doc
```

## Commits

```
35e7807 fix(auth): route google-oauth signups to checkout, land all signups in workspace   ← this session
```

Pushed to `origin/new-ui`. Deployed to staging then production.

---

## Memory updated

Saved the Clerk quirk as a reference memory (`reference_clerk_oauth_redirect.md`) so we don't re-debug this next time:

> `<ClerkProvider afterSignUpUrl="/" afterSignInUrl="/">` set globally wins over `<ClerkSignUp forceRedirectUrl="/checkout/init">` on Google/social OAuth flows. Email signup honors `forceRedirectUrl` correctly. Use sessionStorage + a defensive post-auth router instead of trusting `forceRedirectUrl`.

---

## What's next

Nothing blocking from this session. Two adjacent observations that came up but weren't in scope:

1. **Marketing landing page is now effectively unreachable for signed-in users.** Previously a signed-in-no-campaigns user could see it; now everyone goes to `/workspace`. If you want signed-in users to ever revisit the landing (e.g., for pricing/upgrade flows), they currently use `openPricingModal` from inside the app. The landing page itself is only seen by signed-out visitors.
2. **`afterSignUpUrl="/"` and `afterSignInUrl="/"` in `main.tsx` are now somewhat vestigial** — the actual post-auth routing is decided in `AppContent`'s effects. They could be removed for cleanliness, but the defensive router pattern makes them safe to leave. Not worth touching unless we touch this code for another reason.

---

## Lessons / for the next person who debugs Clerk routing

- **Don't trust `forceRedirectUrl` to win for social-login flows.** Provider-level `afterSignUpUrl`/`afterSignInUrl` overrides it in OAuth paths. Build a defensive post-auth router that reads intent from sessionStorage and redirects independently — that's robust against the next Clerk quirk too.
- **sessionStorage *does* survive cross-origin redirects** in the same tab (it's scoped to tab × origin, and the original origin's scope is preserved when you return to it). Earlier hypothesis "sessionStorage cleared during OAuth" was wrong; root cause was Clerk routing to the wrong URL, not storage loss.
- **When a session ships a new UX decision, audit the upstream routing/gates** that enforced the old UX. The S86 welcome hero shipped but the January `campaigns.length > 0` gate kept new users away from it for ~11 days. `git blame` on adjacent code is fast and catches this kind of stale-guard pattern.
