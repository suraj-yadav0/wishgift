'use client';

import { Gift } from 'lucide-react';
import { useSessionSync } from '@/hooks/use-session-sync';
import { useAppStore } from '@/store/use-app-store';
import { AppShell } from '@/components/app/app-shell';
import { LandingView } from '@/components/app/landing-view';
import { MyWishlistsView } from '@/components/app/my-wishlists-view';
import { WishlistDetailView } from '@/components/app/wishlist-detail-view';
import { DiscoverView } from '@/components/app/discover-view';
import { ProfileView } from '@/components/app/profile-view';
import { UserProfileView } from '@/components/app/user-profile-view';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { status } = useSessionSync();
  const currentView = useAppStore((s) => s.currentView);

  // Show loading skeleton while session is loading
  if (status === 'loading') {
    return <LoadingSkeleton />;
  }

  // If not authenticated, show landing
  if (status === 'unauthenticated') {
    return <LandingView />;
  }

  // Authenticated - show app shell with views
  return (
    <AppShell>
      <ViewRouter currentView={currentView} />
    </AppShell>
  );
}

function ViewRouter({ currentView }: { currentView: string }) {
  switch (currentView) {
    case 'my-wishlists':
      return <MyWishlistsView />;
    case 'wishlist-detail':
      return <WishlistDetailView />;
    case 'discover':
      return <DiscoverView />;
    case 'profile':
      return <ProfileView />;
    case 'user-profile':
      return <UserProfileView />;
    default:
      return <MyWishlistsView />;
  }
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="flex items-center gap-3 mb-8">
        <Gift className="h-10 w-10 text-rose-500 animate-pulse" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-4 w-48 mb-2" />
      <Skeleton className="h-4 w-36" />
    </div>
  );
}
