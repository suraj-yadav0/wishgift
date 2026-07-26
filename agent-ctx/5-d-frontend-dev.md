# Task 5-d: Discover View Component

**Agent:** frontend-dev
**Date:** 2025-01-01
**File created:** `/home/z/my-project/src/components/app/discover-view.tsx`

## Summary

A `'use client'` discovery/feed page where users search and follow other people, then browse wishlists shared by the people they follow. Uses a two-column responsive grid (`lg:grid-cols-[350px_1fr]`) — a sticky left sidebar with search + following list, and a right main area with `Tabs` for "Feed" and "Explore".

## Component Structure

### Main `DiscoverView` (default export)
- **Page header**: "Discover" badge (Sparkles icon), "Explore Wishlists" title, descriptive subtitle.
- **Layout**: `grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6`; left `<aside>` is `lg:sticky lg:top-24 lg:self-start`; right `<main>` holds Tabs.

### Left Sidebar (Card)
- **Search bar**: `Input` with leading `Search` icon, controlled by `searchQuery` state, debounced 300ms via `setTimeout` stored in `useEffect`. A trailing `Loader2` spinner shows during the in-flight request.
- **Search results**: Rendered as `UserSearchCard` list while `searchQuery` is non-empty. Shows skeleton rows during loading, a `NoSearchResultsEmptyState` ("No users found") when no results, and an error banner on failure.
- **People You Follow**: Hidden while the user is actively searching. Shows count badge, then a `ScrollArea` (`max-h-96`) of `FollowingListItem` rows. Empty state ("You are not following anyone yet") shown if zero followings. Skeleton list while loading.

### Right Main (Tabs)
- **Feed tab**: Wishlists from followed users (`apiGet('/api/feed')`), sorted by `updatedAt` (server default). Renders a responsive grid (`sm:grid-cols-2 xl:grid-cols-3`) of `FeedWishlistCard`. Shows:
  - `NoFollowingEmptyState` ("Follow people to see their wishlists here") when user follows no one — includes a CTA button that focuses the search input.
  - Skeletons while loading.
  - Error card with "Try again" button on fetch failure.
  - `NoFeedResultsEmptyState` ("No wishlists from people you follow yet") when following has zero wishlists.
- **Explore tab**: Reuses `/api/feed` data but sorts by `createdAt` desc (newest first) to provide a different ordering. Shows an info banner with the following count. Same empty-state handling.

### Subcomponents
- **`FollowButton`** — Self-contained button with optimistic state. Follow = gradient (`from-rose-500 to-orange-500`), Unfollow = outline. Posts to `/api/follow` or DELETEs `/api/follow`. Calls `onToggle(userId, next)` optimistically, reverts on error, surfaces toast notifications, disables while pending.
- **`UserSearchCard`** — Avatar (ring-2 rose-100) + name + @username + follower count + Follow button. Whole card clickable to open profile. Framer Motion fade-up entrance.
- **`FollowingListItem`** — Compact button row with avatar + name + @username, hover bg-rose-50, ArrowRight icon appears on hover. Click navigates to user profile.
- **`FeedWishlistCard`** — Cover header (real `<img>` or rose→amber gradient placeholder with Gift icon), top-left item count Badge. CardHeader shows clickable owner chip (avatar + name) that opens profile, then wishlist name (line-clamp-1) and description (line-clamp-2). CardContent shows occasion Badge + Public Badge + relative time (`formatRelative` for "2d ago" etc.). Whole card navigates to wishlist detail. whileHover y:-2.
- **Skeletons**: `SearchCardSkeleton` and `FeedCardSkeleton` mirror real layouts.
- **Empty states**: `NoFollowingEmptyState` (with CTA), `NoFeedResultsEmptyState`, `NoSearchResultsEmptyState`.

## Data Flow
- All API helpers imported from `@/lib/api` (`apiGet`, `apiPost`, `apiDelete`).
- `useAppStore`: `navigate`, `setSelectedUsername`, `setSelectedWishlistId`, `refreshKey`.
- `useToast` for feedback.
- `useEffect` keyed on `refreshKey` triggers full refetch of following + feed + explore.
- After follow/unfollow, `handleFollowToggle` updates `searchResults` (followerCount +/- and `isFollowingByCurrentUser`), updates `following` list (adds/removes row), then refetches feed + explore in background.

## Patterns Used
- `'use client'` directive.
- `useState`, `useEffect`, `useCallback`, `useRef` for debounce + input focus.
- Simple 300ms debounce: `setTimeout` in `useEffect`, cleared on cleanup.
- Optimistic UI on follow/unfollow with rollback on failure.
- Framer Motion `motion.div` entrance + hover lift on cards.
- Warm color palette (rose/orange/amber) — no indigo/blue.
- shadcn/ui: Button, Card (+Header/Content/Title/Description), Input, Tabs (+List/Trigger/Content), Avatar (+Image/Fallback), Badge, Skeleton, Separator, ScrollArea.
- lucide-react: Search, Users, Heart, Gift, Globe, UserPlus, UserMinus, TrendingUp, Sparkles, ArrowRight, Package, Calendar, Loader2.
- Mobile-first: single column → 2 col sidebar+main at lg; feed grid is 1 → 2 sm → 3 xl.
- Sticky sidebar on desktop (`lg:sticky lg:top-24`).
- ScrollArea with `max-h-96` for the following list (custom-scrollbar styling from shadcn primitive).
- Accessible: `aria-label="Search users"` on input, `<button>` elements for clickable rows, semantic `<aside>`/`<main>`, Label-like heading pairing.

## TypeScript Status
- 0 new errors introduced (verified via `bunx tsc --noEmit`).
- 5 pre-existing errors in unrelated files (examples, skills, auth/register route) remain unchanged.
- ESLint passes cleanly (`bun run lint` — 0 errors, 0 warnings).
