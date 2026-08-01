'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ArrowLeft,
  Users,
  Gift,
  UserPlus,
  UserMinus,
  Globe,
  Package,
  List,
  Loader2,
  Sparkles,
  Lock,
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { useAppStore } from '@/store/use-app-store';
import { useToast } from '@/hooks/use-toast';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface UserProfileData {
  id: string;
  name: string;
  username: string;
  email: string;
  image: string | null;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  wishlistCount: number;
  followStatus?: 'NONE' | 'PENDING' | 'ACCEPTED';
  isFollowingByCurrentUser: boolean;
  createdAt: string;
}

interface Wishlist {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  isPublic: boolean;
  occasion: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Follow Button                                                        */
/* ------------------------------------------------------------------ */

function FollowButton({
  followStatus = 'NONE',
  loading,
  onToggle,
}: {
  followStatus?: 'NONE' | 'PENDING' | 'ACCEPTED';
  loading: boolean;
  onToggle: () => void;
}) {
  if (loading) {
    return (
      <Button disabled size="lg">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (followStatus === 'ACCEPTED') {
    return (
      <Button
        onClick={onToggle}
        size="lg"
        variant="outline"
        className="border-rose-200 bg-white text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:bg-card dark:text-rose-400 dark:hover:bg-rose-950/40"
      >
        <UserMinus className="mr-2 h-4 w-4" />
        Following
      </Button>
    );
  }

  if (followStatus === 'PENDING') {
    return (
      <Button
        onClick={onToggle}
        size="lg"
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
      >
        <Clock className="mr-2 h-4 w-4" />
        Requested
      </Button>
    );
  }

  return (
    <Button
      onClick={onToggle}
      size="lg"
      className="bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600"
    >
      <UserPlus className="mr-2 h-4 w-4" />
      Follow
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Wishlist Card                                                        */
/* ------------------------------------------------------------------ */

function PublicWishlistCard({
  wishlist,
  onClick,
}: {
  wishlist: Wishlist;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className="group relative cursor-pointer overflow-hidden p-0 transition-shadow hover:shadow-lg"
        onClick={onClick}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          {wishlist.coverImage ? (
            <img
              src={wishlist.coverImage}
              alt={wishlist.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-100 to-amber-50 dark:from-rose-950 dark:to-amber-950">
              <Gift className="h-12 w-12 text-rose-400/70" />
            </div>
          )}
          <div className="absolute right-2 top-2">
            <Badge
              variant="secondary"
              className="gap-1 bg-white/85 text-xs shadow-sm backdrop-blur dark:bg-black/50"
            >
              {wishlist.isPublic ? (
                <>
                  <Globe className="h-3 w-3" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  Private
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Content & Metadata */}
        <div className="flex flex-col p-4">
          <div className="mb-3 space-y-1">
            <h3 className="line-clamp-1 text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-rose-600">
              {wishlist.name}
            </h3>
            <p className="line-clamp-2 min-h-[2rem] text-xs leading-relaxed text-muted-foreground">
              {wishlist.description || 'No description provided.'}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/50 pt-2.5 text-xs text-muted-foreground">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {wishlist.occasion && (
                <Badge
                  variant="outline"
                  className="gap-1 border-rose-200 bg-rose-50/80 px-2 py-0.5 text-[11px] text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  <Sparkles className="h-3 w-3" />
                  {wishlist.occasion}
                </Badge>
              )}
              <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[11px]">
                <Package className="h-3 w-3" />
                {wishlist.itemCount ?? 0} {wishlist.itemCount === 1 ? 'item' : 'items'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeletons                                                            */
/* ------------------------------------------------------------------ */

function ProfileHeaderSkeleton() {
  return (
    <Card className="border-0 bg-white/80 shadow-sm backdrop-blur dark:bg-card/60">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <Skeleton className="mx-auto h-8 w-48 sm:mx-0" />
            <Skeleton className="mx-auto h-4 w-28 sm:mx-0" />
            <Skeleton className="mx-auto h-4 w-60 sm:mx-0" />
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-6 sm:justify-start">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="mt-4 flex justify-center sm:justify-start">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function WishlistCardSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="p-4 pb-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex gap-2 px-4 pb-4">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Main View                                                           */
/* ------------------------------------------------------------------ */

export function UserProfileView() {
  const { toast } = useToast();
  const user = useAppStore((s) => s.user);
  const selectedUsername = useAppStore((s) => s.selectedUsername);
  const navigate = useAppStore((s) => s.navigate);
  const goBack = useAppStore((s) => s.goBack);
  const setSelectedWishlistId = useAppStore((s) => s.setSelectedWishlistId);

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- Redirect if own profile ---------------- */
  useEffect(() => {
    if (selectedUsername && user && selectedUsername === user.username) {
      navigate('profile');
    }
  }, [selectedUsername, user, navigate]);

  /* ---------------- Fetch profile + wishlists ---------------- */
  const fetchProfile = useCallback(async () => {
    if (!selectedUsername || (user && selectedUsername === user.username)) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch profile first (need userId and isFollowingByCurrentUser for wishlists query)
      const profileData = await apiGet('/api/users/' + selectedUsername);
      setProfile(profileData);

      // Only fetch public wishlists if current user is following this user
      if (profileData.isFollowingByCurrentUser) {
        const wlList = await apiGet('/api/wishlists?userId=' + profileData.id);
        const list: Wishlist[] = Array.isArray(wlList) ? wlList : wlList?.wishlists ?? [];
        setWishlists(list);
      } else {
        setWishlists([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      setError(message);
      toast({
        title: 'Could not load profile',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedUsername, user, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /* ---------------- Follow / Unfollow / Cancel Request ---------------- */
  const handleFollowToggle = async () => {
    if (!profile) return;
    const currentStatus = profile.followStatus ?? (profile.isFollowingByCurrentUser ? 'ACCEPTED' : 'NONE');
    setFollowLoading(true);

    try {
      if (currentStatus === 'ACCEPTED') {
        // Unfollow
        await apiDelete('/api/follow', { followingId: profile.id });
        setWishlists([]);
        setProfile((p) =>
          p
            ? {
                ...p,
                followStatus: 'NONE',
                isFollowingByCurrentUser: false,
                followerCount: Math.max(0, p.followerCount - 1),
              }
            : null
        );
        toast({ title: 'Unfollowed', description: `You are no longer following @${profile.username}.` });
      } else if (currentStatus === 'PENDING') {
        // Cancel follow request
        await apiDelete('/api/follow', { followingId: profile.id });
        setProfile((p) =>
          p
            ? {
                ...p,
                followStatus: 'NONE',
                isFollowingByCurrentUser: false,
              }
            : null
        );
        toast({ title: 'Request cancelled', description: `Cancelled follow request to @${profile.username}.` });
      } else {
        // Send follow request
        await apiPost('/api/follow', { followingId: profile.id });
        setProfile((p) =>
          p
            ? {
                ...p,
                followStatus: 'PENDING',
                isFollowingByCurrentUser: false,
              }
            : null
        );
        toast({
          title: 'Follow request sent',
          description: `Wait for @${profile.username} to accept your request.`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast({ title: 'Could not update follow status', description: message, variant: 'destructive' });
    } finally {
      setFollowLoading(false);
    }
  };

  /* ---------------- Open wishlist ---------------- */
  const handleOpenWishlist = (wl: Wishlist) => {
    setSelectedWishlistId(wl.id);
    navigate('wishlist-detail');
  };

  /* ---------------- Render ---------------- */
  if (user && selectedUsername === user.username) {
    return null; // Redirected away
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-background to-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className="mb-6 -ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Error State */}
        {error && !loading && !profile && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-amber-50 dark:from-rose-950 dark:to-amber-950">
                <Users className="h-7 w-7 text-rose-400" />
              </div>
              <p className="font-medium">Could not load this profile</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={goBack} className="mt-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go back
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading Skeleton */}
        {loading && <ProfileHeaderSkeleton />}

        {/* Profile Content */}
        {!loading && profile && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <Card className="border-0 bg-white/80 shadow-sm backdrop-blur dark:bg-card/60">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                    {/* Avatar */}
                    <Avatar className="ring-4 ring-rose-200 h-24 w-24 dark:ring-rose-900">
                      {profile.image ? (
                        <AvatarImage src={profile.image} alt={profile.name} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-rose-400 to-orange-400 text-2xl font-bold text-white">
                        {getInitials(profile.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left">
                      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        {profile.name}
                      </h1>
                      <p className="mt-1 text-sm font-medium text-muted-foreground">
                        @{profile.username}
                      </p>

                      {profile.bio && (
                        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                          {profile.bio}
                        </p>
                      )}

                      {/* Stats inline */}
                      <div className="mt-4 flex items-center justify-center gap-6 sm:justify-start">
                        <div className="text-center">
                          <p className="text-lg font-bold leading-none">
                            {profile.wishlistCount}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">Wishlists</p>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div className="text-center">
                          <p className="text-lg font-bold leading-none">
                            {profile.followerCount}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">Followers</p>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div className="text-center">
                          <p className="text-lg font-bold leading-none">
                            {profile.followingCount}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">Following</p>
                        </div>
                      </div>

                      {/* Follow Button */}
                      <div className="mt-5 flex justify-center sm:justify-start">
                        <FollowButton
                          followStatus={profile.followStatus ?? (profile.isFollowingByCurrentUser ? 'ACCEPTED' : 'NONE')}
                          loading={followLoading}
                          onToggle={handleFollowToggle}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <Separator className="mb-8" />

            {/* Public Wishlists (Followers Only) */}
            <section>
              <div className="mb-5 space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">
                    Public Wishlists
                  </h2>
                  {profile.isFollowingByCurrentUser && (
                    <Badge variant="secondary" className="gap-1">
                      <List className="h-3 w-3" />
                      {wishlists.length}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Wishlists @{profile.username} has shared with followers
                </p>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <WishlistCardSkeleton key={i} />
                  ))}
                </div>
              ) : !profile.isFollowingByCurrentUser ? (
                <Card className="border-2 border-dashed bg-gradient-to-br from-rose-50/50 via-background to-amber-50/50 dark:from-rose-950/20 dark:to-amber-950/20">
                  <CardContent className="flex flex-col items-center justify-center gap-3 p-8 sm:p-10 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/60 dark:to-amber-900/60">
                      {profile.followStatus === 'PENDING' ? (
                        <Clock className="h-7 w-7 text-amber-500" />
                      ) : (
                        <Lock className="h-7 w-7 text-rose-500" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">
                        {profile.followStatus === 'PENDING'
                          ? 'Follow Request Sent'
                          : 'Wishlists are visible to followers only'}
                      </h3>
                      <p className="max-w-md text-sm text-muted-foreground">
                        {profile.followStatus === 'PENDING'
                          ? `Waiting for @${profile.username} to accept your follow request to unlock their public wishlists.`
                          : `Send a follow request to @${profile.username} to view their public wishlists once accepted.`}
                      </p>
                    </div>
                    <div className="mt-2">
                      <FollowButton
                        followStatus={profile.followStatus ?? 'NONE'}
                        loading={followLoading}
                        onToggle={handleFollowToggle}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : wishlists.length === 0 ? (
                <Card className="border-dashed bg-white/40 dark:bg-card/30">
                  <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-amber-50 dark:from-rose-950 dark:to-amber-950">
                      <Gift className="h-7 w-7 text-rose-400" />
                    </div>
                    <div>
                      <p className="font-medium">No public wishlists yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        @{profile.username} hasn&apos;t shared any public wishlists
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {wishlists.map((wl) => (
                    <PublicWishlistCard
                      key={wl.id}
                      wishlist={wl}
                      onClick={() => handleOpenWishlist(wl)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default UserProfileView;
