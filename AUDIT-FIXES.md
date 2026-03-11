# Gimme v1 Audit Fixes — Task-Based PRD

> Generated from comprehensive security, performance, and frontend audits.
> Each task is scoped for independent agent execution.
> Priority: P0 (ship-blocker) → P1 (high) → P2 (medium) → P3 (nice-to-have)

---

## T01: Remove Unused Dependencies
**Priority:** P0 | **Scope:** package.json | **Est:** 5 min

`react-hook-form`, `zod`, and `@hookform/resolvers` are imported in package.json but never used anywhere in the codebase. They add ~15-25KB to the bundle for zero value.

**Tasks:**
- [ ] Run `npm uninstall react-hook-form zod @hookform/resolvers`
- [ ] Verify build passes: `node_modules/.bin/tsc --noEmit && node_modules/.bin/vite build`
- [ ] Confirm bundle size decreased

**Files:** `package.json`, `package-lock.json`

---

## T02: Route-Level Code Splitting
**Priority:** P0 | **Scope:** App.tsx, all page imports | **Est:** 15 min

All 9 pages are eagerly imported in App.tsx, meaning the entire app loads on first paint (~134KB gzipped). Pages should be lazy-loaded with React.lazy + Suspense.

**Tasks:**
- [ ] Convert all page imports in `src/App.tsx` to `React.lazy(() => import(...))`
- [ ] Wrap `<Routes>` in `<Suspense fallback={<PageSkeleton />}>`
- [ ] Keep `HomePage` eagerly loaded (it's the landing page)
- [ ] Verify each route still renders correctly
- [ ] Verify build passes and check chunk splitting in output

**Files:** `src/App.tsx`

---

## T03: Self-Host Inter Font
**Priority:** P0 | **Scope:** index.html, index.css | **Est:** 10 min

Google Fonts CDN link in `index.html` is render-blocking. The browser must fetch the CSS, then the font files, before text renders. Self-hosting eliminates this waterfall.

**Tasks:**
- [ ] Download Inter font files (wght 400, 500, 600, 700) in woff2 format
- [ ] Place in `public/fonts/` directory
- [ ] Add `@font-face` declarations in `src/index.css` with `font-display: swap`
- [ ] Remove Google Fonts `<link>` tags from `index.html`
- [ ] Remove `<link rel="preconnect" ...>` tags for Google Fonts
- [ ] Verify text renders correctly in both light and dark mode

**Files:** `index.html`, `src/index.css`, `public/fonts/`

---

## T04: Fix Color Contrast for Accessibility & Sunlight
**Priority:** P0 | **Scope:** index.css, Button.tsx, multiple pages | **Est:** 20 min

Gold (#C4A962) on white fails WCAG AA (2.1:1 ratio). This is critical for a golf app used outdoors in sunlight. Gray-400 text also fails AA.

**Tasks:**
- [ ] Add `--color-gold-text: #8B7530` token (darkened gold that passes AA on white)
- [ ] Add `--color-text-primary: #1a1a1a` and `--color-text-secondary: #4a5568` tokens
- [ ] Update `Button.tsx` secondary variant: use `bg-gold text-night` (dark text on gold background) instead of `bg-gold text-white`
- [ ] Replace all `text-gray-400` used for informational text with `text-gray-500` minimum
- [ ] In dark mode, keep `text-gold` for headings (gold on dark passes AA)
- [ ] Verify all text passes 4.5:1 contrast ratio
- [ ] Test: check scores are readable in Scorecard and ScoreEntry with the updated colors

**Files:** `src/index.css`, `src/components/ui/Button.tsx`, `src/components/scorecard/ScoreEntry.tsx`, `src/components/scorecard/Scorecard.tsx`, all pages with `text-gray-400`

---

## T05: Add Confirmation Dialog for Destructive Actions
**Priority:** P0 | **Scope:** New component + RoundPage | **Est:** 20 min

"Complete Round" is irreversible — it changes round status to `complete`. Currently a single tap triggers it with no confirmation. A mis-tap ends the round.

**Tasks:**
- [ ] Create `src/components/ui/ConfirmDialog.tsx` — a bottom sheet or modal:
  - Props: `open`, `onConfirm`, `onCancel`, `title`, `description`, `confirmText`, `confirmVariant`
  - Overlay backdrop with `bg-black/50`
  - Animate in from bottom (mobile-friendly)
  - Trap focus, close on Escape, close on backdrop click
  - `aria-role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- [ ] Wrap "Complete Round" button in RoundPage with ConfirmDialog:
  - Title: "Complete Round?"
  - Description: "This will finalize scores and calculate settlements. This can't be undone."
  - Confirm button: "Complete Round" (danger variant)
- [ ] Also wrap "Sign Out" in ProfilePage with a simpler confirm
- [ ] Verify dialog works on mobile (proper viewport positioning, doesn't get hidden by keyboard)

**Files:** `src/components/ui/ConfirmDialog.tsx` (new), `src/pages/round/RoundPage.tsx`, `src/pages/profile/ProfilePage.tsx`

---

## T06: Fix Tap Target Sizes
**Priority:** P0 | **Scope:** Scorecard, RoundPage, DemoRoundPage, HomePage | **Est:** 15 min

Multiple interactive elements are below the 44px minimum tap target. On a golf cart, these will be impossible to hit accurately.

**Tasks:**
- [ ] Hole selector circles: increase from `w-9 h-9` (36px) to `w-11 h-11` (44px) in both `RoundPage.tsx` and `DemoRoundPage.tsx`
- [ ] Scorecard `<th>` elements: add `min-h-[44px] min-w-[44px]` and `cursor-pointer` styling
- [ ] "Try the demo round" link in `HomePage.tsx`: wrap in a proper button with `tap-target` class and `py-3 px-4`
- [ ] "Edit" button in `ProfilePage.tsx`: add `tap-target` class
- [ ] Verify all interactive elements meet 44px minimum with browser DevTools

**Files:** `src/pages/round/RoundPage.tsx`, `src/pages/round/DemoRoundPage.tsx`, `src/components/scorecard/Scorecard.tsx`, `src/pages/home/HomePage.tsx`, `src/pages/profile/ProfilePage.tsx`

---

## T07: Add Focus States & ARIA Labels
**Priority:** P0 | **Scope:** Multiple components | **Est:** 20 min

No focus states on buttons/nav. No aria-labels on icon-only buttons. Screen reader users can't navigate the app.

**Tasks:**
- [ ] `Button.tsx`: Add `focus-visible:ring-2 focus-visible:ring-masters-green focus-visible:ring-offset-2` to the base styles
- [ ] `BackButton.tsx`: Add `aria-label="Go back"`. Add `focus-visible:ring-2 focus-visible:ring-masters-green focus-visible:ring-offset-2`
- [ ] `Spinner.tsx`: Add `role="status" aria-label="Loading"` to the SVG
- [ ] `BottomNav.tsx`: Add `aria-label="Main navigation"` to `<nav>`. Each NavLink already has text content, so just add focus-visible styles
- [ ] `Toast.tsx`: Add `role="alert" aria-live="assertive"` to each toast item
- [ ] `Card.tsx`: When used with `onClick`, it needs `role="button" tabIndex={0}` and an `onKeyDown` handler for Enter/Space. Add an `interactive` prop that enables this behavior
- [ ] Update all `<Card onClick={...}>` usages in `HomePage.tsx` to pass `interactive`
- [ ] `Scorecard.tsx`: `<th>` elements with onClick need `role="button" tabIndex={0} onKeyDown`
- [ ] `Input.tsx` and `Button.tsx`: Add `displayName` for React DevTools
- [ ] DemoRoundPage back button (`←` text): replace with `<BackButton />`

**Files:** `src/components/ui/Button.tsx`, `src/components/ui/BackButton.tsx`, `src/components/ui/Spinner.tsx`, `src/components/ui/Card.tsx`, `src/components/ui/Toast.tsx`, `src/components/ui/Input.tsx`, `src/components/layout/BottomNav.tsx`, `src/components/scorecard/Scorecard.tsx`, `src/pages/home/HomePage.tsx`, `src/pages/round/DemoRoundPage.tsx`

---

## T08: Add Offline Indicator Banner
**Priority:** P1 | **Scope:** AppShell, new hook | **Est:** 15 min

The PWA service worker caches assets but there's no user-facing indicator when offline. On a golf course with spotty cell service, the user needs to know scores aren't syncing.

**Tasks:**
- [ ] Create `src/hooks/useOnlineStatus.ts`:
  ```ts
  export function useOnlineStatus(): boolean {
    const [online, setOnline] = useState(navigator.onLine)
    useEffect(() => {
      const on = () => setOnline(true)
      const off = () => setOnline(false)
      window.addEventListener('online', on)
      window.addEventListener('offline', off)
      return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
    }, [])
    return online
  }
  ```
- [ ] In `AppShell.tsx`, show a thin banner below the status bar when offline:
  - Yellow/amber background: `bg-amber-500 text-white text-xs text-center py-1.5 font-medium`
  - Text: "You're offline — scores will sync when connected"
  - Animate in/out with `transition-all`
- [ ] Test by toggling network in DevTools

**Files:** `src/hooks/useOnlineStatus.ts` (new), `src/components/layout/AppShell.tsx`

---

## T09: Add Web Share API for Invite Codes
**Priority:** P1 | **Scope:** RoundPage, CrewsPage | **Est:** 15 min

Currently invite codes only copy to clipboard as raw text. Using Web Share API lets users share via iMessage, WhatsApp, etc. with a deep link.

**Tasks:**
- [ ] Create `src/lib/share.ts`:
  ```ts
  export async function shareInviteCode(code: string, type: 'round' | 'crew') {
    const url = `${window.location.origin}/round/join?code=${code}`
    const title = type === 'round' ? 'Join my round on Gimme' : 'Join my crew on Gimme'
    if (navigator.share) {
      await navigator.share({ title, url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }
  ```
- [ ] In `RoundPage.tsx`, replace clipboard copy with `shareInviteCode(code, 'round')`, fallback to clipboard with toast
- [ ] In `CrewsPage.tsx`, replace clipboard copy with `shareInviteCode(code, 'crew')`
- [ ] In `JoinRoundPage.tsx`, check URL params for `?code=XXX` and auto-fill the input
- [ ] Add route handling in `App.tsx` for `/round/join?code=XXX`

**Files:** `src/lib/share.ts` (new), `src/pages/round/RoundPage.tsx`, `src/pages/crews/CrewsPage.tsx`, `src/pages/round/JoinRoundPage.tsx`

---

## T10: Fix RLS Migration Gap
**Priority:** P1 | **Scope:** Supabase migration | **Est:** 10 min

The initial migration file (`001_initial_schema.sql`) is missing INSERT/UPDATE policies that were added via Management API. The migration file should be the source of truth.

**Tasks:**
- [ ] Create `supabase/migrations/002_insert_update_policies.sql` with all the policies that were added via API:
  - rounds: INSERT (creator), UPDATE (creator)
  - round_players: INSERT (round creator or self)
  - games: INSERT (round creator), UPDATE (round creator)
  - crews: INSERT (creator)
  - crew_members: INSERT (self)
  - game_results: INSERT (round creator)
  - settlements: INSERT (round creator), UPDATE (payer or payee)
  - profiles: INSERT (self)
  - rounds SELECT: allow invite code lookup without being a player
- [ ] Verify SQL syntax is correct by running against the Management API (idempotent — `CREATE POLICY IF NOT EXISTS` or use `DROP POLICY IF EXISTS` + `CREATE POLICY`)

**Files:** `supabase/migrations/002_insert_update_policies.sql` (new)

---

## T11: Restrict Profile Visibility (Payment Handles)
**Priority:** P1 | **Scope:** Supabase RLS | **Est:** 15 min

Profiles are globally readable (`for select using (true)`), which exposes Venmo/CashApp handles to anyone. These should only be visible to crew mates or round participants.

**Tasks:**
- [ ] Create `supabase/migrations/003_restrict_profile_visibility.sql`:
  - Drop the "Public profiles are viewable by everyone" policy
  - Create a new SELECT policy that allows viewing profiles if:
    - You are viewing your own profile, OR
    - The profile belongs to someone in the same round as you, OR
    - The profile belongs to someone in the same crew as you
  - Alternative simpler approach: create a view or column-level security that hides `venmo_handle` and `cashapp_handle` from non-crew/non-round members, but keeps `display_name` and `avatar_url` public
- [ ] Run migration via Management API
- [ ] Test: verify you can see your own payment handles but not a stranger's

**Files:** `supabase/migrations/003_restrict_profile_visibility.sql` (new)

---

## T12: Fix Service Worker API Caching
**Priority:** P1 | **Scope:** vite.config.ts | **Est:** 10 min

The service worker caches Supabase API responses with `NetworkFirst` strategy. On a shared device, authenticated responses could be served to another user. Also, cache TTL of 300s is too long for real-time score data.

**Tasks:**
- [ ] In `vite.config.ts`, remove the Supabase API runtime caching entirely:
  ```ts
  // Remove the runtimeCaching block for supabase
  ```
  Or, if offline support is needed, cache only non-authenticated endpoints and add a `cacheableResponse` plugin that excludes responses with `Authorization` headers
- [ ] Keep static asset caching (CSS, JS, fonts, images)
- [ ] Verify PWA still works in offline mode for cached static assets

**Files:** `vite.config.ts`

---

## T13: Add Input Validation
**Priority:** P1 | **Scope:** Multiple pages | **Est:** 15 min

No client-side validation on form inputs. DB constraints catch the worst, but users get cryptic Supabase errors instead of friendly messages.

**Tasks:**
- [ ] `NewRoundPage.tsx`: Validate course name is 1-100 chars, trimmed, not whitespace-only. Show inline error
- [ ] `AuthPage.tsx`: Validate email format before calling signInWithEmail. Basic regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- [ ] `ProfilePage.tsx`: Validate display_name 1-50 chars. Validate handicap_index 0-54 range. Validate venmo/cashapp handles are alphanumeric + underscores only
- [ ] `JoinRoundPage.tsx`: Validate invite code is 8 chars, alphanumeric only
- [ ] `CrewsPage.tsx`: Validate crew name 1-50 chars
- [ ] Show validation errors inline below the input, not as toasts
- [ ] Add `aria-invalid` and `aria-describedby` for accessibility

**Files:** `src/pages/round/NewRoundPage.tsx`, `src/pages/auth/AuthPage.tsx`, `src/pages/profile/ProfilePage.tsx`, `src/pages/round/JoinRoundPage.tsx`, `src/pages/crews/CrewsPage.tsx`

---

## T14: Centralize Score Color System
**Priority:** P1 | **Scope:** ScoreEntry, Scorecard | **Est:** 10 min

Score-relative colors (eagle, birdie, par, bogey, etc.) are defined independently in both `ScoreEntry.tsx` and `Scorecard.tsx` with different values. This should be a single source of truth.

**Tasks:**
- [ ] Create `src/lib/score-colors.ts`:
  ```ts
  export function getScoreColor(diff: number): { text: string; bg: string; border: string } {
    // Centralized color mapping for score-relative-to-par
  }
  export function getScoreLabel(diff: number): string | null {
    // Albatross, Eagle, Birdie, Par, Bogey, Double, Triple
  }
  ```
- [ ] Add semantic color tokens to `src/index.css`:
  ```css
  --color-eagle: #EAB308;
  --color-birdie: #C41E3A;
  --color-par: #006747;
  --color-bogey: #3B82F6;
  --color-double: #F97316;
  ```
- [ ] Update `ScoreEntry.tsx` and `Scorecard.tsx` to import from the shared module
- [ ] Remove duplicated color functions from both components

**Files:** `src/lib/score-colors.ts` (new), `src/index.css`, `src/components/scorecard/ScoreEntry.tsx`, `src/components/scorecard/Scorecard.tsx`

---

## T15: Add Error Handling to All Data Fetchers
**Priority:** P1 | **Scope:** Multiple pages | **Est:** 15 min

Several pages silently swallow fetch errors, showing misleading empty states instead of error messages.

**Tasks:**
- [ ] `HomePage.tsx`: Add `.catch()` to the active rounds fetch. Show error state or toast
- [ ] `HistoryPage.tsx`: Add error state (not just loading → empty). Add try/catch or .catch() to fetch
- [ ] `CrewsPage.tsx`: Add try/catch around `fetchCrews` calls in useEffect. Show error toast on failure
- [ ] `SettlePage.tsx`: Add error handling to both fetch calls. Add `cancelled` flag for cleanup
- [ ] `stores/auth.ts`: Add error handling to `onAuthStateChange` profile fetch. If profile fetch fails, set user but leave profile null (don't crash the auth flow)
- [ ] Pattern: every `useEffect` that fetches data should have: error state variable, catch block, and either an inline error message or toast

**Files:** `src/pages/home/HomePage.tsx`, `src/pages/history/HistoryPage.tsx`, `src/pages/crews/CrewsPage.tsx`, `src/pages/settle/SettlePage.tsx`, `src/stores/auth.ts`

---

## T16: Add Loading Guards for Submit Buttons
**Priority:** P1 | **Scope:** Multiple pages | **Est:** 10 min

Several forms allow double-submission because submit buttons aren't disabled during async operations.

**Tasks:**
- [ ] `SettlePage.tsx` "Mark Settled" button: Add loading state, disable during `markSettled()`, show Spinner
- [ ] `CrewsPage.tsx` "Create" and "Join" buttons: Add loading states, disable during async operations
- [ ] `ProfilePage.tsx` "Save" button: Already has loading state — verify it works
- [ ] Pattern: every button that triggers an async operation should be `disabled={loading}` and show `<Spinner />` when loading

**Files:** `src/pages/settle/SettlePage.tsx`, `src/pages/crews/CrewsPage.tsx`, `src/pages/profile/ProfilePage.tsx`

---

## T17: Fix Dark Mode Gaps
**Priority:** P2 | **Scope:** Multiple components | **Est:** 10 min

Several components have incomplete dark mode styling.

**Tasks:**
- [ ] `BackButton.tsx`: Add `dark:text-gray-400 dark:hover:text-gray-200`
- [ ] `DemoRoundPage.tsx` view toggle: Add `dark:text-gray-400` to inactive state (line ~86). Currently only `text-gray-600` with no dark variant. Match the `RoundPage.tsx` pattern
- [ ] `Button.tsx` active states: Currently active goes lighter (`active:bg-masters-dark`, `active:bg-gold-light`). These should go darker on press. Fix: `active:bg-[#003D2A]` for primary, `active:bg-[#B09850]` for secondary
- [ ] `Scorecard.tsx` sticky column: Verify `bg-fairway dark:bg-night` matches the page background exactly in both themes
- [ ] Verify: scan every component for `text-gray-*` without `dark:text-gray-*` counterpart
- [ ] Verify: scan every component for `bg-white` without `dark:bg-night-card` counterpart

**Files:** `src/components/ui/BackButton.tsx`, `src/pages/round/DemoRoundPage.tsx`, `src/components/ui/Button.tsx`, `src/components/scorecard/Scorecard.tsx`

---

## T18: Add Scorecard Scroll Indicator
**Priority:** P2 | **Scope:** Scorecard component | **Est:** 10 min

The horizontal scorecard has no visual hint that it scrolls. Users may not realize there are more holes to the right.

**Tasks:**
- [ ] Wrap the Scorecard table in a container div
- [ ] Add a right-edge fade gradient overlay: `absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-fairway dark:from-night pointer-events-none`
- [ ] Use a ref + scroll event to hide the gradient when scrolled to the end
- [ ] Apply `scrollbar-hide` to the container
- [ ] Add `-webkit-overflow-scrolling: touch` for momentum scrolling on older iOS

**Files:** `src/components/scorecard/Scorecard.tsx`

---

## T19: Add Safe Area Top Padding
**Priority:** P2 | **Scope:** index.css, page containers | **Est:** 5 min

No `safe-area-inset-top` handling. On iPhone Dynamic Island or status bar overlap in standalone PWA mode, content may tuck under.

**Tasks:**
- [ ] Add `safe-top` utility to `src/index.css`:
  ```css
  .safe-top { padding-top: env(safe-area-inset-top, 0px); }
  ```
- [ ] Apply `safe-top` to the top-level container in `AppShell.tsx`
- [ ] For pages outside AppShell (auth, round), add `safe-top` to their top-level div
- [ ] Test in Safari responsive mode with "Show Notch" enabled

**Files:** `src/index.css`, `src/components/layout/AppShell.tsx`, `src/pages/auth/AuthPage.tsx`, `src/pages/round/RoundPage.tsx`, `src/pages/round/NewRoundPage.tsx`

---

## T20: Fix Auth Initialization Waterfall
**Priority:** P2 | **Scope:** stores/auth.ts | **Est:** 10 min

Auth initialization creates a 3-request waterfall: `getSession` → `getProfile` → render. This blocks the entire app from rendering.

**Tasks:**
- [ ] In `stores/auth.ts`, make `initialize()` set `loading: false` as soon as the session is determined (even before profile loads):
  - If no session: set `loading: false` immediately
  - If session exists: set `user` and `loading: false`, then fetch profile in background
  - When profile arrives, update `profile` state (non-blocking)
- [ ] This lets unauthenticated users see the app instantly
- [ ] Authenticated users see their name after a brief delay (profile loading)
- [ ] HomePage already handles `authLoading` and `profile` separately — verify it still works

**Files:** `src/stores/auth.ts`

---

## T21: Stabilize handleScore Callback
**Priority:** P2 | **Scope:** RoundPage | **Est:** 10 min

`handleScore` in RoundPage has 6 dependencies including `currentPlayerIdx`, `currentHole`, and `displayPlayers.length`. Every time the user taps a score, these values change, invalidating the callback and causing ScoreEntry to re-render.

**Tasks:**
- [ ] Use `useRef` for `currentPlayerIdx` and `currentHole` to avoid callback invalidation:
  ```ts
  const holeRef = useRef(currentHole)
  const playerIdxRef = useRef(currentPlayerIdx)
  useEffect(() => { holeRef.current = currentHole }, [currentHole])
  useEffect(() => { playerIdxRef.current = currentPlayerIdx }, [currentPlayerIdx])
  ```
- [ ] `handleScore` callback depends only on stable refs + `postScore`
- [ ] Wrap `ScoreEntry` in `React.memo` to prevent unnecessary re-renders
- [ ] Verify score entry still works correctly (auto-advance, haptic feedback)

**Files:** `src/pages/round/RoundPage.tsx`, `src/components/scorecard/ScoreEntry.tsx`

---

## T22: Use Specific Column Selects
**Priority:** P2 | **Scope:** stores/round.ts, multiple pages | **Est:** 10 min

Every Supabase query uses `select('*')`, fetching all columns including ones we don't need. This wastes bandwidth on a golf course with spotty cell service.

**Tasks:**
- [ ] `stores/round.ts` loadRound: Change `select('*')` to select only needed columns:
  - rounds: `id, course_id, crew_id, created_by, status, invite_code, started_at, completed_at`
  - round_players: `round_id, profile_id`
  - scores: `id, round_id, profile_id, hole_number, strokes, updated_at`
  - courses: `id, name, holes, par`
  - profiles: `id, display_name, avatar_url, venmo_handle, cashapp_handle`
  - games: `id, round_id, format, config, status`
- [ ] `pages/home/HomePage.tsx`: Select only `id, status, created_at, courses(name, holes)`
- [ ] `pages/history/HistoryPage.tsx`: Same pattern
- [ ] `pages/settle/SettlePage.tsx`: Select only needed settlement + profile fields

**Files:** `src/stores/round.ts`, `src/pages/home/HomePage.tsx`, `src/pages/history/HistoryPage.tsx`, `src/pages/settle/SettlePage.tsx`

---

## T23: Filter Own Realtime Score Updates
**Priority:** P2 | **Scope:** stores/round.ts | **Est:** 5 min

The realtime subscription fires for ALL score changes, including the user's own scores. This means every score post triggers both an optimistic update (from `postScore`) AND a realtime update, causing a double render.

**Tasks:**
- [ ] In `subscribeToRound`, compare `score.profile_id` against the current user's ID
- [ ] Skip the update if it's the current user's own score (already handled optimistically)
- [ ] Get the current user ID from `supabase.auth.getUser()` once at subscription time
- [ ] This reduces renders by ~50% during active scoring

**Files:** `src/stores/round.ts`

---

## T24: Add Swipe Gesture for Hole Navigation
**Priority:** P2 | **Scope:** RoundPage, DemoRoundPage | **Est:** 20 min

Tapping small hole circles is the only way to navigate between holes. Swiping left/right is more natural and ergonomic on a golf course.

**Tasks:**
- [ ] Create `src/hooks/useSwipe.ts`:
  ```ts
  export function useSwipe(ref: RefObject<HTMLElement>, { onLeft, onRight, threshold = 50 })
  ```
  - Track touchstart/touchmove/touchend
  - Calculate horizontal delta
  - Fire callback if delta exceeds threshold
  - Ignore vertical swipes (don't interfere with scrolling)
- [ ] Apply to the ScoreEntry section in RoundPage:
  - Swipe left → next hole (increment currentHole, reset player index)
  - Swipe right → previous hole
  - Don't advance past hole count or below 1
- [ ] Add subtle visual feedback during swipe (slight translate)
- [ ] Apply same logic to DemoRoundPage

**Files:** `src/hooks/useSwipe.ts` (new), `src/pages/round/RoundPage.tsx`, `src/pages/round/DemoRoundPage.tsx`

---

## T25: Fix Nassau Press Logic (Dead Code)
**Priority:** P2 | **Scope:** nassau.ts | **Est:** 10 min

The Nassau game engine defines a `presses` property in `MatchState` and `NassauResult` but always returns an empty array. The auto-press logic is not implemented despite the config supporting it.

**Tasks:**
- [ ] Either implement press logic properly:
  - Track match play margin during play
  - When a player is down by `autoPressThreshold`, automatically create a new press bet
  - Calculate press payouts independently
  - Add press results to `NassauResult.presses`
- [ ] Or remove the dead code (presses property, autoPressThreshold config) and mark it as a Phase 2 feature
- [ ] If implementing: add unit tests for press calculation
- [ ] Also: the `useNet` property in skins config is defined but never used — either implement handicap-adjusted skins or remove the config option

**Files:** `src/lib/games/nassau.ts`, `src/lib/games/skins.ts`

---

## T26: Add Keyboard Awareness to Profile Form
**Priority:** P2 | **Scope:** ProfilePage | **Est:** 10 min

On mobile, the on-screen keyboard pushes the profile edit form up, potentially hiding the save/cancel buttons.

**Tasks:**
- [ ] Add `pb-48` to the profile edit form container to ensure buttons are visible above keyboard
- [ ] Consider using the `visualViewport` API to detect keyboard height and adjust dynamically
- [ ] Test on iOS Safari and Chrome Android (different keyboard behaviors)
- [ ] Ensure the form scrolls to keep the focused input visible

**Files:** `src/pages/profile/ProfilePage.tsx`

---

## T27: Deduplicate RoundPage / DemoRoundPage
**Priority:** P3 | **Scope:** Shared scorecard components | **Est:** 30 min

RoundPage and DemoRoundPage share ~150 lines of identical UI (hole selector, player tabs, skins results, net position, settle-up cards). Only the data source differs.

**Tasks:**
- [ ] Extract shared presentational components:
  - `src/components/scorecard/HoleSelector.tsx` — hole circle buttons
  - `src/components/scorecard/PlayerTabs.tsx` — player name tabs
  - `src/components/scorecard/SkinsResultCard.tsx` — skins results display
  - `src/components/scorecard/NetPositionCard.tsx` — net position per player
  - `src/components/scorecard/SettleUpCard.tsx` — settlement transactions
- [ ] Refactor both RoundPage and DemoRoundPage to compose these components
- [ ] Verify both pages still work identically
- [ ] This also makes it easier to add Wolf and BBB result displays later

**Files:** `src/components/scorecard/` (5 new files), `src/pages/round/RoundPage.tsx`, `src/pages/round/DemoRoundPage.tsx`

---

## T28: Add Pull-to-Refresh
**Priority:** P3 | **Scope:** AppShell, pages | **Est:** 20 min

`overscroll-behavior: none` prevents native pull-to-refresh. For a PWA with live data, users expect this gesture.

**Tasks:**
- [ ] Change `overscroll-behavior: none` to `overscroll-behavior-x: none` (prevent horizontal overscroll but allow vertical)
- [ ] Create a custom pull-to-refresh component or use a lightweight library
- [ ] On pull, refresh the current page's data:
  - Home: re-fetch active rounds
  - History: re-fetch round history
  - Crews: re-fetch crews
  - Settle: re-fetch settlements
  - Round: re-fetch round data
- [ ] Show a brief spinner indicator during refresh
- [ ] Alternative: just change overscroll-behavior to `contain` and let the browser's native PTR work (simpler, less control)

**Files:** `src/index.css`, `src/components/layout/AppShell.tsx`, potentially a new `src/hooks/usePullToRefresh.ts`

---

## T29: Add Epsilon Constant for Currency Comparisons
**Priority:** P3 | **Scope:** settlement.ts | **Est:** 5 min

Magic number `0.01` used for floating point comparisons in settlement calculations. Should be a named constant.

**Tasks:**
- [ ] Add `const CURRENCY_EPSILON = 0.01` at the top of `settlement.ts`
- [ ] Replace all `0.01` comparisons with the named constant
- [ ] Add brief comment explaining it represents the minimum meaningful currency amount

**Files:** `src/lib/games/settlement.ts`

---

## T30: Fix Unsafe Type Casts
**Priority:** P3 | **Scope:** Multiple pages | **Est:** 10 min

`as unknown as RoundWithCourse[]` bypasses type safety. Supabase's `.select('*, courses(*)')` returns a type that doesn't match our interface.

**Tasks:**
- [ ] Type the Supabase response properly using generics or a type assertion function:
  ```ts
  function assertRoundWithCourse(data: unknown): RoundWithCourse[] {
    if (!Array.isArray(data)) return []
    return data as RoundWithCourse[]
  }
  ```
- [ ] Or use Supabase's built-in type inference with `.returns<RoundWithCourse[]>()`
- [ ] Apply to `HomePage.tsx` and `HistoryPage.tsx`

**Files:** `src/pages/home/HomePage.tsx`, `src/pages/history/HistoryPage.tsx`

---

## Execution Order

**Wave 1 — Ship Blockers (P0):**
T01, T02, T03, T04, T05, T06, T07 — all can run in parallel

**Wave 2 — High Priority (P1):**
T08, T09, T10, T11, T12, T13, T14, T15, T16 — all can run in parallel

**Wave 3 — Medium Priority (P2):**
T17, T18, T19, T20, T21, T22, T23, T24, T25, T26 — all can run in parallel

**Wave 4 — Nice-to-Have (P3):**
T27, T28, T29, T30 — run if time permits

---

## Verification Checklist

After all tasks complete:
- [ ] `node_modules/.bin/tsc --noEmit` — zero errors
- [ ] `node_modules/.bin/vite build` — clean build
- [ ] Bundle size < 130KB gzipped (JS)
- [ ] All pages render in light and dark mode
- [ ] Demo round works without auth
- [ ] Score entry has haptic feedback
- [ ] All tap targets >= 44px
- [ ] Color contrast passes WCAG AA
- [ ] Focus states visible on keyboard navigation
- [ ] PWA installs correctly
- [ ] Offline indicator shows when disconnected
