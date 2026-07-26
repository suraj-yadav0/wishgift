# Task 5-b: My Wishlists View Component

**Date:** 2025-01-01
**Task ID:** 5-b
**Agent:** frontend-dev

## File Created
- `src/components/app/my-wishlists-view.tsx` — `'use client'` component rendering the authenticated user's wishlist grid.

## Component Breakdown

### `MyWishlistsView` (default + named export)
- **Header**: Warm "Your collections" badge with Gift icon, "My Wishlists" title, descriptive subtitle, and a gradient "+ New Wishlist" button (`from-rose-500 to-orange-500`).
- **Data fetching**: `useEffect` with `refreshKey` dependency calls `apiGet('/api/wishlists')`. Handles both raw array and `{ wishlists: [] }` response shapes. Errors surfaced via `useToast` (destructive variant).
- **Loading state**: 6 `WishlistCardSkeleton` cards in the same responsive grid layout.
- **Empty state**: Animated dashed-border card with a gradient circle containing a large Gift icon, "No wishlists yet" headline, helper copy, and a gradient CTA button.
- **Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` with `gap-6`.

### `WishlistCard`
- Cover image area with `aspect-[16/9]`: real `<img>` if `coverImage` present, else gradient placeholder (`bg-gradient-to-br from-rose-100 to-amber-50 dark:from-rose-950 dark:to-amber-950`) containing a Gift icon.
- Top-right badge: Public (Globe icon) / Private (Lock icon) indicator on a translucent backdrop.
- Top-left dropdown menu (DropdownMenu + DropdownMenuTrigger as icon button). `stopPropagation` on the wrapper prevents the card's click-to-open from firing when interacting with the menu. Items: Edit (Pencil), Delete (Trash2, rose-colored).
- CardHeader: name (line-clamp-1), description (line-clamp-2, min-height to keep cards aligned).
- CardContent: occasion badge (Sparkles, rose-tinted outline), item count badge (Package), and right-aligned created date (Calendar).
- Card-level `onClick` calls `setSelectedWishlistId(id)` then `navigate('wishlist-detail')` per spec.
- `hover:shadow-lg transition-shadow` plus a subtle cover image scale on hover (`group-hover:scale-105`).
- Framer Motion entrance animation (`opacity`/`y`).

### `WishlistFormDialog` (used for create + edit)
- Controlled by `open` + `onOpenChange` props. `mode: 'create' | 'edit'` toggles title + button labels + endpoint.
- Pre-fills values from `initial` wishlist in edit mode via `useEffect` on `open` change.
- Form fields: name (required, maxLength 80), description (Textarea, maxLength 500), occasion (Input, maxLength 60), isPublic (Switch with Globe/Lock icon label + helper copy in a bordered box).
- Submit: builds `{ name, description, occasion, isPublic }` payload (trims, nulls empties). POST `/api/wishlists` for create, PUT `/api/wishlists/[id]` for edit.
- Submit button shows Loader2 spinner, gradient styling matching the rest of the app.
- On success: calls `onSuccess` (which triggers `triggerRefresh`) and closes dialog. Toast feedback for both success and error cases.

### `DeleteDialog`
- AlertDialog with destructive confirmation copy referencing the wishlist name.
- Confirm action calls `apiDelete('/api/wishlists/[id]')`, shows success toast, then `triggerRefresh`.
- Delete button is rose-colored with spinner during request.

### `WishlistCardSkeleton`
- Mirrors the real card layout: aspect-ratio cover Skeleton, title/description skeletons, two pill skeletons.

### `EmptyState`
- Dashed-border card with gradient circle (Gift icon), "No wishlists yet", helper copy, and gradient CTA button that opens the create dialog.

## Patterns Used
- `'use client'` directive
- Imports: `apiGet`, `apiPost`, `apiPut`, `apiDelete` from `@/lib/api`; `useAppStore` from `@/store/use-app-store`; `useToast` from `@/hooks/use-toast`
- Store actions used: `navigate`, `setSelectedWishlistId`, `refreshKey`, `triggerRefresh`
- shadcn/ui components: Button, Card (+Header/Content/Title/Description), Dialog (+Content/Header/Title/Footer), AlertDialog (+Action/Cancel/Content/Description/Footer/Header/Title/Trigger), DropdownMenu (+Content/Item/Trigger), Input, Label, Textarea, Switch, Badge, Skeleton
- lucide-react icons: Plus, MoreVertical, Pencil, Trash2, Gift, Globe, Lock, Calendar, Package, Sparkles, Loader2
- Warm color palette (rose/orange/amber) — no indigo/blue
- Framer Motion entrance animations
- Responsive: 1 col mobile → 2 cols md → 3 cols lg
- `line-clamp` utilities for graceful text overflow
- Accessible: label/input pairing via `htmlFor`/`id`, `aria-label` on icon-only button, semantic header/section structure
- `stopPropagation` on dropdown wrapper to prevent card click from firing when interacting with the menu

## TypeScript & Lint Status
- `bunx tsc --noEmit`: 0 new errors (5 pre-existing in unrelated files remain: examples/websocket, skills/image-edit, skills/stock-analysis, src/app/api/auth/register)
- `bun run lint`: clean — 0 errors, 0 warnings

## Notes for downstream agents
- The component is exported as both named (`MyWishlistsView`) and default for flexible import.
- API response shape is flexible — handles `Wishlist[]` directly or `{ wishlists: Wishlist[] }`.
- Form validation is light (name required); the server already has Zod validation per Task 3-a.
- `triggerRefresh()` from the store is the single source of truth for re-fetching — both create/edit/delete success handlers call it.
