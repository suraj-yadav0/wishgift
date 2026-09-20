# Hyperframes Composition Brief: WishGift

## Objective
Create a short, polished launch brag video for WishGift highlighting wishlist curation and secret gift reservations.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 18 seconds

## Source Material
- Project root: `/home/suraj/Downloads/wishgift`
- Primary files read: `src/components/app/landing-view.tsx`, `src/app/globals.css`, `README.md`, `package.json`
- Product name: WishGift
- Tagline / strongest claim: "No more unwanted presents or awkward duplicates — just thoughtful surprises."
- Key UI or visual moment to recreate:
  - Landing hero: "Share Your Wishes, Receive Love"
  - Wishlist item card with price, priority badge, and secret reservation button
  - Reservation state update: "Reserved by Sarah (Kept secret from list owner)"
- Copy that must appear verbatim:
  - "Share Your Wishes, Receive Love"
  - "No more unwanted presents or awkward duplicates"
  - "Birthday Wishlist 2026"
  - "Thoughtful Gifting. Zero Awkwardness."

## Creative Direction
- Tone preset: polished
- Creative direction: Warm, delightful product launch
- Interpretation: Clean layout, warm rose/orange tones, tactile UI interactions, legible typography, and no generic SaaS fluff.
- Angle: WishGift eliminates duplicate or unwanted gifts through private wishlists and secret coordination among friends.
- Hook: "No more unwanted presents or awkward duplicates."
- Outro / punchline: "Thoughtful Gifting. Zero Awkwardness."
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign

## Visual Identity
- Background: #fbfbfb (warm light) and #0f172a (dark card contrast)
- Accent: #f43f5e (rose-500) and #f97316 (orange-500)
- Text: #0f172a (dark) and #ffffff
- Display font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- Body font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- Visual references from the project:
  - Rose-to-orange gradient text and badges
  - Card with rounded-2xl and soft drop shadows
  - Pill badges with glowing borders

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Scene 1 (0.0s - 4.5s) — Hook: "Share Your Wishes, Receive Love" with "No more unwanted presents or awkward duplicates."
2. Scene 2 (4.5s - 9.0s) — Wishlist Builder: "Birthday Wishlist 2026" card with 3 items sliding in sequentially.
3. Scene 3 (9.0s - 14.0s) — Secret Reservation: Cursor clicks "Reserve Gift" on headphones card; status flips to "Reserved by Sarah (Secret)" to prevent duplicates.
4. Scene 4 (14.0s - 18.0s) — Outro: Logo, "Thoughtful Gifting. Zero Awkwardness.", stack badges (Next.js 16, Tailwind CSS v4, Prisma), and CTA.

## Audio
- Audio role: Warm, upbeat bed with motion-matched UI accents.
- Audio arc: Continuous groove from 0.0s to 18.0s, ending with a clean fade.
- Music: `assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3`
- Music treatment: Starts at 0.0s, volume 0.35, fades out smoothly from 16.5s to 18.0s.
- Audio-coupled moments:
  - 0.3s: `assets/sfx/interface/drop_001.ogg` on badge drop
  - 5.2s, 6.0s, 6.8s: `assets/sfx/casino/card-slide-1.ogg` on each wishlist item entrance
  - 10.5s: `assets/sfx/ui/mouseclick1.ogg` on simulated click
  - 11.0s: `assets/sfx/impact/impactBell_heavy_000.ogg` on reservation confirmation
- Restraint: Keep SFX subtle, aligned to action starts.

## Hyperframes Instructions
- Implement in `brag-output/composition/index.html`.
- Use GSAP seekable timeline registered at `window.__timelines["main"]`.
- Obey determinism and layout rules.
- Run `npx hyperframes check` and ensure it passes with 0 errors.
