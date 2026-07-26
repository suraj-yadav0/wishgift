'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import {
  Pencil,
  Mail,
  Gift,
  Heart,
  Users,
  ListPlus,
  Edit,
  Globe,
  Lock,
  Package,
  Sparkles,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

import { apiGet } from '@/lib/api';
import { useAppStore } from '@/store/use-app-store';
import { useToast } from '@/hooks/use-toast';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface UserProfile {
  followerCount: number;
  followingCount: number;
  wishlistCount: number;
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

interface ProfileFormValues {
  name: string;
  username: string;
  bio: string;
  image: string;
}

const profileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(80, 'Name must be 80 characters or less'),
  username: z
    .string()
    .min(1, 'Username is required')
    .max(40, 'Username must be 40 characters or less')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  bio: z.string().max(300, 'Bio must be 300 characters or less').optional().default(''),
  image: z.string().url('Must be a valid URL').optional().default('').or(z.literal('')),
});

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

/* ------------------------------------------------------------------ */
/* Edit Profile Dialog                                                  */
/* ------------------------------------------------------------------ */

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    image: string | null;
  };
  bio: string;
}

/* ------------------------------------------------------------------ */
/* Edit Profile Form (separate so it remounts via key)                  */
/* ------------------------------------------------------------------ */

interface EditProfileFormProps {
  user: EditProfileDialogProps['user'];
  initialBio: string;
  onSubmit: () => void;
  onCancel: () => void;
}

function EditProfileForm({ user, initialBio, onSubmit, onCancel }: EditProfileFormProps) {
  const { toast } = useToast();
  const [values, setValues] = useState<ProfileFormValues>({
    name: user.name ?? '',
    username: user.username ?? '',
    bio: initialBio ?? '',
    image: user.image ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormValues, string>>>({});

  const handleChange = (field: keyof ProfileFormValues, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = profileSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ProfileFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ProfileFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    // UI-ready: just close the dialog and show a toast
    toast({
      title: 'Profile updated',
      description: 'Your profile changes have been saved (demo mode).',
    });
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">
          Name <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="edit-name"
          placeholder="Your display name"
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
          maxLength={80}
          autoFocus
        />
        {errors.name && (
          <p className="text-xs text-rose-500">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-username">
          Username <span className="text-rose-500">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            @
          </span>
          <Input
            id="edit-username"
            className="pl-7"
            placeholder="username"
            value={values.username}
            onChange={(e) => handleChange('username', e.target.value)}
            maxLength={40}
          />
        </div>
        {errors.username && (
          <p className="text-xs text-rose-500">{errors.username}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-bio">Bio</Label>
        <Textarea
          id="edit-bio"
          placeholder="Tell people a little about yourself..."
          value={values.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          rows={3}
          maxLength={300}
        />
        {errors.bio && (
          <p className="text-xs text-rose-500">{errors.bio}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-image">Image URL</Label>
        <Input
          id="edit-image"
          placeholder="https://example.com/avatar.jpg"
          value={values.image}
          onChange={(e) => handleChange('image', e.target.value)}
        />
        {errors.image && (
          <p className="text-xs text-rose-500">{errors.image}</p>
        )}
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600"
        >
          Save changes
        </Button>
      </DialogFooter>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Edit Profile Dialog                                                  */
/* ------------------------------------------------------------------ */

function EditProfileDialog({ open, onOpenChange, user, bio: initialBio }: EditProfileDialogProps) {
  const [formKey, setFormKey] = useState(0);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) setFormKey((k) => k + 1);
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information.
          </DialogDescription>
        </DialogHeader>
        <EditProfileForm
          key={formKey}
          user={user}
          initialBio={initialBio}
          onSubmit={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Stats Card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className={`relative overflow-hidden border-0 ${gradient} p-4`}>
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 shadow-sm backdrop-blur-sm dark:bg-black/20">
            <Icon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none text-rose-900 dark:text-rose-100">
              {value}
            </p>
            <p className="mt-1 text-xs font-medium text-rose-700/70 dark:text-rose-300/70">
              {label}
            </p>
          </div>
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/20 dark:bg-white/5" />
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Wishlist Preview Card (same style as my-wishlists-view)              */
/* ------------------------------------------------------------------ */

function WishlistPreviewCard({
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

        <Card className="rounded-t-none border-t-0 p-0">
          <div className="p-4 pb-3">
            <h3 className="line-clamp-1 text-base font-semibold">
              {wishlist.name}
            </h3>
            <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
              {wishlist.description || 'No description yet.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-4 pb-4 pt-0">
            {wishlist.occasion && (
              <Badge
                variant="outline"
                className="gap-1 border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
              >
                <Sparkles className="h-3 w-3" />
                {wishlist.occasion}
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1">
              <Package className="h-3 w-3" />
              {wishlist.itemCount ?? 0} items
            </Badge>
          </div>
        </Card>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Wishlist Skeleton                                                    */
/* ------------------------------------------------------------------ */

function WishlistCardSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="p-4 pb-3">
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
/* Main Profile View                                                    */
/* ------------------------------------------------------------------ */

export function ProfileView() {
  const { toast } = useToast();
  const user = useAppStore((s) => s.user);
  const navigate = useAppStore((s) => s.navigate);
  const setSelectedWishlistId = useAppStore((s) => s.setSelectedWishlistId);
  const refreshKey = useAppStore((s) => s.refreshKey);

  const [profileStats, setProfileStats] = useState<UserProfile | null>(null);
  const [bio, setBio] = useState<string>('');
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);

  /* ---------------- Fetch data ---------------- */
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileData, wishlistsData] = await Promise.all([
        apiGet('/api/users/' + user.username),
        apiGet('/api/wishlists'),
      ]);

      // Profile stats
      setProfileStats({
        followerCount: profileData.followerCount ?? 0,
        followingCount: profileData.followingCount ?? 0,
        wishlistCount: profileData.wishlistCount ?? 0,
      });
      setBio(profileData.bio ?? '');

      // Wishlists
      const list: Wishlist[] = Array.isArray(wishlistsData)
        ? wishlistsData
        : wishlistsData?.wishlists ?? [];
      setWishlists(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      toast({
        title: 'Could not load your profile',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  /* ---------------- Handlers ---------------- */
  const handleOpenWishlist = (wl: Wishlist) => {
    setSelectedWishlistId(wl.id);
    navigate('wishlist-detail');
  };

  /* ---------------- Render ---------------- */
  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-background to-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Profile Header */}
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
                <div className="relative flex-shrink-0">
                  <Avatar className="ring-4 ring-rose-200 h-24 w-24 dark:ring-rose-900">
                    {user.image ? (
                      <AvatarImage src={user.image} alt={user.name} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-rose-400 to-orange-400 text-2xl font-bold text-white">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                      {user.name}
                    </h1>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditOpen(true)}
                      className="gap-1.5"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Profile
                    </Button>
                  </div>

                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    @{user.username}
                  </p>

                  <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{user.email}</span>
                  </div>

                  {bio && (
                    <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                      {bio}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {loading ? (
            <>
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </>
          ) : (
            <>
              <StatCard
                icon={ListPlus}
                label="Wishlists"
                value={profileStats?.wishlistCount ?? 0}
                gradient="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/60 dark:to-rose-900/40"
              />
              <StatCard
                icon={Users}
                label="Followers"
                value={profileStats?.followerCount ?? 0}
                gradient="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/30"
              />
              <StatCard
                icon={Heart}
                label="Following"
                value={profileStats?.followingCount ?? 0}
                gradient="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/20"
              />
            </>
          )}
        </div>

        <Separator className="mb-8" />

        {/* My Wishlists Preview */}
        <section className="mb-10">
          <div className="mb-5 flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight">My Wishlists</h2>
              <p className="text-sm text-muted-foreground">
                Your gift collections at a glance
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('my-wishlists')}
              className="gap-1.5"
            >
              View all
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <WishlistCardSkeleton key={i} />
              ))}
            </div>
          ) : wishlists.length === 0 ? (
            <Card className="border-dashed bg-white/40 dark:bg-card/30">
              <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-amber-50 dark:from-rose-950 dark:to-amber-950">
                  <Gift className="h-7 w-7 text-rose-400" />
                </div>
                <div>
                  <p className="font-medium">No wishlists yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create your first wishlist to get started
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {wishlists.slice(0, 6).map((wl) => (
                <WishlistPreviewCard
                  key={wl.id}
                  wishlist={wl}
                  onClick={() => handleOpenWishlist(wl)}
                />
              ))}
            </div>
          )}
        </section>

        <Separator className="mb-8" />

        {/* Gifts You're Giving Section */}
        <section>
          <div className="mb-5 space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">
                Gifts You&apos;re Giving
              </h2>
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
              >
                <Gift className="mr-1 h-3 w-3" />
                Coming soon
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Track the gifts you&apos;ve reserved for friends and family
            </p>
          </div>

          <Card className="border-dashed bg-white/40 dark:bg-card/30">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-950 dark:to-orange-950">
                <Gift className="h-7 w-7 text-amber-400" />
              </div>
              <div>
                <p className="font-medium">Your gift reservations will appear here</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  When you reserve gifts for others from their wishlists, they&apos;ll show up in this section so you can keep track.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={user}
        bio={bio}
      />
    </div>
  );
}

export default ProfileView;
