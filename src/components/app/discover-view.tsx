'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Users,
  Heart,
  Gift,
  Globe,
  UserPlus,
  UserMinus,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Package,
  Loader2,
  Calendar,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { useAppStore } from '@/store/use-app-store';
import { useToast } from '@/hooks/use-toast';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface SearchUser {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  bio: string | null;
  followerCount: number;
  isFollowingByCurrentUser: boolean;
}

interface FollowingUser {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  bio: string | null;
}

interface FeedWishlist {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  isPublic: boolean;
  occasion: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
  _count: {
    items: number;
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  } catch {
    return '';
  }
}

function initials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1][0] : '';
  const out = (first + second).toUpperCase();
  return out || '?';
}

/* ------------------------------------------------------------------ */
/* Follow Button (used inside search results)                          */
/* ------------------------------------------------------------------ */

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onToggle: (userId: string, next: boolean) => void;
  size?: 'sm' | 'default';
}

function FollowButton({ userId, isFollowing, onToggle, size = 'sm' }: FollowButtonProps) {
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    const previous = isFollowing;
    // Optimistic update
    onToggle(userId, !isFollowing);
    try {
      if (!isFollowing) {
        await apiPost('/api/follow', { followingId: userId });
        toast({
          title: 'Following',
          description: 'You will now see their wishlists in your feed.',
        });
      } else {
        await apiDelete('/api/follow', { followingId: userId });
        toast({
          title: 'Unfollowed',
          description: 'Their wishlists will no longer appear in your feed.',
        });
      }
    } catch (err) {
      // Revert on failure
      onToggle(userId, previous);
      const message = err instanceof Error ? err.message : 'Could not update follow status';
      toast({
        title: 'Something went wrong',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setPending(false);
    }
  };

  if (isFollowing) {
    return (
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={handleClick}
        disabled={pending}
        className="gap-1.5"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <UserMinus className="size-3.5" />}
        Following
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size={size}
      onClick={handleClick}
      disabled={pending}
      className="gap-1.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
      Follow
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* User Search Result Card                                             */
/* ------------------------------------------------------------------ */

interface UserSearchCardProps {
  user: SearchUser;
  onFollowToggle: (userId: string, next: boolean) => void;
  onOpenProfile: (username: string) => void;
}

function UserSearchCard({ user, onFollowToggle, onOpenProfile }: UserSearchCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="cursor-pointer transition-all hover:shadow-md hover:border-rose-200"
        onClick={() => onOpenProfile(user.username)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 ring-2 ring-rose-100">
              {user.image ? (
                <AvatarImage src={user.image} alt={user.name ?? user.username} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-rose-100 to-amber-100 text-rose-700 text-sm font-semibold">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user.name ?? user.username}
                </p>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                @{user.username}
              </p>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3" />
                <span>
                  {user.followerCount} {user.followerCount === 1 ? 'follower' : 'followers'}
                </span>
              </div>
            </div>

            <FollowButton
              userId={user.id}
              isFollowing={user.isFollowingByCurrentUser}
              onToggle={onFollowToggle}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Following List Item                                                 */
/* ------------------------------------------------------------------ */

interface FollowingListItemProps {
  user: FollowingUser;
  onOpenProfile: (username: string) => void;
}

function FollowingListItem({ user, onOpenProfile }: FollowingListItemProps) {
  return (
    <button
      type="button"
      onClick={() => onOpenProfile(user.username)}
      className="group flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
    >
      <Avatar className="size-9 ring-2 ring-rose-50 group-hover:ring-rose-200 transition-all">
        {user.image ? (
          <AvatarImage src={user.image} alt={user.name ?? user.username} />
        ) : null}
        <AvatarFallback className="bg-gradient-to-br from-rose-100 to-amber-100 text-rose-700 text-xs font-semibold">
          {initials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {user.name ?? user.username}
        </p>
        <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
      </div>
      <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Feed Wishlist Card                                                  */
/* ------------------------------------------------------------------ */

interface FeedWishlistCardProps {
  wishlist: FeedWishlist;
  onOpenProfile: (username: string) => void;
  onOpenWishlist: (id: string) => void;
}

function FeedWishlistCard({ wishlist, onOpenProfile, onOpenWishlist }: FeedWishlistCardProps) {
  const owner = wishlist.user;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -2 }}
    >
      <Card
        className="cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:border-rose-200"
        onClick={() => onOpenWishlist(wishlist.id)}
      >
        {/* Cover */}
        <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-rose-100 via-orange-50 to-amber-100">
          {wishlist.coverImage ? (
            <img
              src={wishlist.coverImage}
              alt={wishlist.name}
              className="size-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Gift className="size-10 text-rose-300" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <Badge className="bg-white/90 text-rose-700 shadow-sm hover:bg-white">
              <Package className="mr-1 size-3" />
              {wishlist._count.items} {wishlist._count.items === 1 ? 'item' : 'items'}
            </Badge>
          </div>
        </div>

        <CardHeader className="pb-2">
          {/* Owner */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfile(owner.username);
            }}
            className="mb-2 flex w-fit items-center gap-2 rounded-full pr-2 transition-colors hover:bg-rose-50"
          >
            <Avatar className="size-6 ring-1 ring-rose-100">
              {owner.image ? (
                <AvatarImage src={owner.image} alt={owner.name} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-rose-100 to-amber-100 text-rose-700 text-[10px] font-semibold">
                {initials(owner.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-muted-foreground hover:text-rose-700">
              {owner.name}
            </span>
          </button>

          <CardTitle className="text-base leading-snug text-foreground line-clamp-1">
            {wishlist.name}
          </CardTitle>
          {wishlist.description ? (
            <CardDescription className="line-clamp-2">
              {wishlist.description}
            </CardDescription>
          ) : null}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {wishlist.occasion ? (
                <Badge variant="secondary" className="gap-1 bg-rose-50 text-rose-700">
                  <Sparkles className="size-3" />
                  {wishlist.occasion}
                </Badge>
              ) : null}
              <Badge variant="outline" className="gap-1 text-emerald-700">
                <Globe className="size-3" />
                Public
              </Badge>
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              {formatRelative(wishlist.updatedAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeletons                                                           */
/* ------------------------------------------------------------------ */

function SearchCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-2.5 w-32" />
      </div>
      <Skeleton className="h-7 w-20 rounded-md" />
    </div>
  );
}

function FeedCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-32 w-full rounded-none" />
      <CardHeader className="pb-2">
        <Skeleton className="mb-2 h-4 w-20 rounded-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Empty States                                                        */
/* ------------------------------------------------------------------ */

function NoFollowingEmptyState({ onSearchFocus }: { onSearchFocus: () => void }) {
  return (
    <Card className="border-dashed border-2 bg-gradient-to-br from-rose-50/50 to-amber-50/50">
      <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-amber-100">
          <Users className="size-8 text-rose-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Follow people to see their wishlists here</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Search for friends and family by name or username, then follow them to discover what they are wishing for.
          </p>
        </div>
        <Button
          onClick={onSearchFocus}
          className="mt-2 gap-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600"
        >
          <Search className="size-4" />
          Search for people
        </Button>
      </CardContent>
    </Card>
  );
}

function NoFeedResultsEmptyState() {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-amber-50">
          <Gift className="size-8 text-amber-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">No wishlists from people you follow yet</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            When the people you follow create public wishlists, they will appear here. Check back soon!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function NoSearchResultsEmptyState({ query }: { query: string }) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center">
      <Search className="mx-auto mb-2 size-6 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">No users found</p>
      <p className="mt-1 text-xs text-muted-foreground">
        We could not find anyone matching &ldquo;{query}&rdquo;.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Discover View                                                  */
/* ------------------------------------------------------------------ */

export function DiscoverView() {
  const { toast } = useToast();
  const navigate = useAppStore((s) => s.navigate);
  const setSelectedUsername = useAppStore((s) => s.setSelectedUsername);
  const setSelectedWishlistId = useAppStore((s) => s.setSelectedWishlistId);
  const refreshKey = useAppStore((s) => s.refreshKey);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Following list state
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(true);

  // Feed state
  const [feed, setFeed] = useState<FeedWishlist[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Explore state - reuses followed users' wishlists (newest by createdAt)
  const [explore, setExplore] = useState<FeedWishlist[]>([]);
  const [loadingExplore, setLoadingExplore] = useState(true);

  const [activeTab, setActiveTab] = useState<'feed' | 'explore'>('feed');

  /* ----------------------- Debounced search ----------------------- */
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setDebouncedQuery('');
      setSearchResults([]);
      setSearching(false);
      setSearchError(null);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      setDebouncedQuery(q);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedQuery) return;
    let cancelled = false;
    (async () => {
      try {
        setSearching(true);
        setSearchError(null);
        const results = (await apiGet(`/api/users?q=${encodeURIComponent(debouncedQuery)}`)) as SearchUser[];
        if (!cancelled) {
          setSearchResults(results);
        }
      } catch (err) {
        if (!cancelled) {
          setSearchError(err instanceof Error ? err.message : 'Failed to search users');
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  /* ----------------------- Fetch following list ----------------------- */
  const fetchFollowing = useCallback(async () => {
    setLoadingFollowing(true);
    try {
      const data = (await apiGet('/api/follow')) as FollowingUser[];
      setFollowing(data);
    } catch (err) {
      // Non-fatal: keep empty list
      setFollowing([]);
      const message = err instanceof Error ? err.message : 'Failed to load your followed users';
      toast({
        title: 'Could not load your followed users',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoadingFollowing(false);
    }
  }, [toast]);

  /* ----------------------- Fetch feed ----------------------- */
  const fetchFeed = useCallback(async () => {
    setLoadingFeed(true);
    setFeedError(null);
    try {
      const data = (await apiGet('/api/feed')) as FeedWishlist[];
      setFeed(data);
    } catch (err) {
      setFeed([]);
      setFeedError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setLoadingFeed(false);
    }
  }, []);

  /* ----------------------- Fetch explore ----------------------- */
  // Simplified: reuse feed data, sorted by createdAt desc (newest first).
  const fetchExplore = useCallback(async () => {
    setLoadingExplore(true);
    try {
      const data = (await apiGet('/api/feed')) as FeedWishlist[];
      // Sort by creation date (newest first) to differ from the feed (which is by update)
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setExplore(sorted);
    } catch {
      setExplore([]);
    } finally {
      setLoadingExplore(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowing();
    fetchFeed();
    fetchExplore();
  }, [fetchFollowing, fetchFeed, fetchExplore, refreshKey]);

  /* ----------------------- Handlers ----------------------- */
  const handleOpenProfile = useCallback(
    (username: string) => {
      setSelectedUsername(username);
      navigate('user-profile');
    },
    [navigate, setSelectedUsername],
  );

  const handleOpenWishlist = useCallback(
    (id: string) => {
      setSelectedWishlistId(id);
      navigate('wishlist-detail');
    },
    [navigate, setSelectedWishlistId],
  );

  // Toggle follow state in both search results and following list (optimistic).
  const handleFollowToggle = useCallback(
    (userId: string, nextIsFollowing: boolean) => {
      // Update search results
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                isFollowingByCurrentUser: nextIsFollowing,
                followerCount: Math.max(0, u.followerCount + (nextIsFollowing ? 1 : -1)),
              }
            : u,
        ),
      );

      // Update following list
      setFollowing((prev) => {
        if (nextIsFollowing) {
          // Find user in search results to add to following list
          const found = searchResults.find((u) => u.id === userId);
          if (!found) return prev;
          if (prev.some((u) => u.id === userId)) return prev;
          return [
            {
              id: found.id,
              name: found.name,
              username: found.username,
              image: found.image,
              bio: found.bio,
            },
            ...prev,
          ];
        } else {
          return prev.filter((u) => u.id !== userId);
        }
      });

      // After follow/unfollow changes, refresh feed + explore in background
      fetchFeed();
      fetchExplore();
    },
    [searchResults, fetchFeed, fetchExplore],
  );

  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /* ----------------------- Derived ----------------------- */
  const isSearching = searchQuery.trim().length > 0;
  const showFollowingList = !isSearching;
  const hasFollowing = following.length > 0;

  /* ----------------------- Render ----------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/30 via-background to-amber-50/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            <Badge className="gap-1 bg-rose-100 text-rose-700 hover:bg-rose-100">
              <Sparkles className="size-3" />
              Discover
            </Badge>
            <span className="text-xs text-muted-foreground">
              Find people, follow their wishes
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Explore Wishlists
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Search for friends and family, follow them, and stay in the loop with the gifts they are dreaming about.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[350px_1fr]">
          {/* ----------------------- Left Sidebar ----------------------- */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search className="size-4 text-rose-500" />
                  Find People
                </CardTitle>
                <CardDescription className="text-xs">
                  Search by name or @username
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Search input */}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="pl-9"
                    aria-label="Search users"
                  />
                  {searching ? (
                    <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  ) : null}
                </div>

                {/* Search results or following list */}
                {isSearching ? (
                  <div className="space-y-2">
                    {searchError ? (
                      <p className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                        {searchError}
                      </p>
                    ) : null}

                    {!searchError && !searching && searchResults.length === 0 ? (
                      <NoSearchResultsEmptyState query={searchQuery.trim()} />
                    ) : null}

                    {searching
                      ? Array.from({ length: 4 }).map((_, i) => <SearchCardSkeleton key={i} />)
                      : searchResults.map((u) => (
                          <UserSearchCard
                            key={u.id}
                            user={u}
                            onFollowToggle={handleFollowToggle}
                            onOpenProfile={handleOpenProfile}
                          />
                        ))}
                  </div>
                ) : null}

                {showFollowingList ? (
                  <div>
                    <Separator className="mb-3" />
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <Users className="size-4 text-rose-500" />
                        People You Follow
                      </h3>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {following.length}
                      </Badge>
                    </div>

                    {loadingFollowing ? (
                      <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-lg p-2">
                            <Skeleton className="size-9 rounded-full" />
                            <div className="flex-1 space-y-1.5">
                              <Skeleton className="h-3 w-24" />
                              <Skeleton className="h-2.5 w-20" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : hasFollowing ? (
                      <ScrollArea className="max-h-96 pr-2">
                        <div className="space-y-0.5">
                          {following.map((u) => (
                            <FollowingListItem
                              key={u.id}
                              user={u}
                              onOpenProfile={handleOpenProfile}
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="rounded-lg border border-dashed p-4 text-center">
                        <UserPlus className="mx-auto mb-2 size-6 text-muted-foreground" />
                        <p className="text-xs font-medium text-foreground">
                          You are not following anyone yet
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Use the search above to find people.
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </aside>

          {/* ----------------------- Right Main ----------------------- */}
          <main className="min-w-0">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'feed' | 'explore')}
              className="w-full"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <TabsList className="grid w-full max-w-xs grid-cols-2">
                  <TabsTrigger value="feed" className="gap-1.5">
                    <Heart className="size-3.5" />
                    Feed
                  </TabsTrigger>
                  <TabsTrigger value="explore" className="gap-1.5">
                    <TrendingUp className="size-3.5" />
                    Explore
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ----------------------- Feed Tab ----------------------- */}
              <TabsContent value="feed" className="mt-0">
                {!hasFollowing && !loadingFollowing ? (
                  <NoFollowingEmptyState onSearchFocus={focusSearch} />
                ) : feedError ? (
                  <Card className="border-destructive/30">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm text-destructive">{feedError}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchFeed}
                        className="mt-3"
                      >
                        Try again
                      </Button>
                    </CardContent>
                  </Card>
                ) : loadingFeed ? (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <FeedCardSkeleton key={i} />
                    ))}
                  </div>
                ) : feed.length === 0 ? (
                  <NoFeedResultsEmptyState />
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {feed.map((w) => (
                      <FeedWishlistCard
                        key={w.id}
                        wishlist={w}
                        onOpenProfile={handleOpenProfile}
                        onOpenWishlist={handleOpenWishlist}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ----------------------- Explore Tab ----------------------- */}
              <TabsContent value="explore" className="mt-0">
                {!hasFollowing ? (
                  <NoFollowingEmptyState onSearchFocus={focusSearch} />
                ) : loadingExplore ? (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <FeedCardSkeleton key={i} />
                    ))}
                  </div>
                ) : explore.length === 0 ? (
                  <NoFeedResultsEmptyState />
                ) : (
                  <>
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-50 to-amber-50 p-3 text-sm text-rose-700">
                      <Sparkles className="size-4 shrink-0" />
                      <span>
                        Newest wishlists shared by the {following.length}{' '}
                        {following.length === 1 ? 'person' : 'people'} you follow.
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {explore.map((w) => (
                        <FeedWishlistCard
                          key={w.id}
                          wishlist={w}
                          onOpenProfile={handleOpenProfile}
                          onOpenWishlist={handleOpenWishlist}
                        />
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
}
