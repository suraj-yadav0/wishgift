'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Gift,
  Globe,
  Lock,
  Calendar,
  Package,
  Sparkles,
  Loader2,
  Share2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { useAppStore } from '@/store/use-app-store';
import { useToast } from '@/hooks/use-toast';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

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

interface WishlistFormValues {
  name: string;
  description: string;
  occasion: string;
  isPublic: boolean;
}

const emptyForm: WishlistFormValues = {
  name: '',
  description: '',
  occasion: '',
  isPublic: false,
};

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

/* ------------------------------------------------------------------ */
/* Wishlist Form Dialog (used for both create + edit)                  */
/* ------------------------------------------------------------------ */

interface WishlistFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initial?: Wishlist | null;
  onSuccess: () => void;
}

function WishlistFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSuccess,
}: WishlistFormDialogProps) {
  const { toast } = useToast();
  const [values, setValues] = useState<WishlistFormValues>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Sync form values when dialog opens / initial changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initial) {
        setValues({
          name: initial.name ?? '',
          description: initial.description ?? '',
          occasion: initial.occasion ?? '',
          isPublic: !!initial.isPublic,
        });
      } else {
        setValues(emptyForm);
      }
    }
  }, [open, mode, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please give your wishlist a name.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        occasion: values.occasion.trim() || undefined,
        isPublic: values.isPublic,
      };

      if (mode === 'create') {
        await apiPost('/api/wishlists', payload);
        toast({
          title: 'Wishlist created',
          description: `"${payload.name}" is ready to be filled with gifts.`,
        });
      } else if (mode === 'edit' && initial) {
        await apiPut(`/api/wishlists/${initial.id}`, payload);
        toast({
          title: 'Wishlist updated',
          description: `Changes to "${payload.name}" were saved.`,
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast({
        title: 'Could not save wishlist',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create a new wishlist' : 'Edit wishlist'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wl-name">
              Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="wl-name"
              placeholder="e.g. Birthday 2025"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              required
              maxLength={80}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wl-desc">Description</Label>
            <Textarea
              id="wl-desc"
              placeholder="A few words about this wishlist..."
              value={values.description}
              onChange={(e) =>
                setValues((v) => ({ ...v, description: e.target.value }))
              }
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wl-occasion">Occasion</Label>
            <Input
              id="wl-occasion"
              placeholder="e.g. Birthday, Wedding, Holiday..."
              value={values.occasion}
              onChange={(e) =>
                setValues((v) => ({ ...v, occasion: e.target.value }))
              }
              maxLength={60}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-3">
            <div className="space-y-0.5 pr-3">
              <Label
                htmlFor="wl-public"
                className="flex items-center gap-1.5 text-sm font-medium"
              >
                {values.isPublic ? (
                  <Globe className="h-3.5 w-3.5 text-rose-500" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                Public wishlist
              </Label>
              <p className="text-xs text-muted-foreground">
                {values.isPublic
                  ? 'Only your followers can see this wishlist.'
                  : 'Only you can see this wishlist.'}
              </p>
            </div>
            <Switch
              id="wl-public"
              checked={values.isPublic}
              onCheckedChange={(checked) =>
                setValues((v) => ({ ...v, isPublic: checked }))
              }
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create wishlist' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Delete confirmation dialog                                          */
/* ------------------------------------------------------------------ */

interface DeleteDialogProps {
  wishlist: Wishlist | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function DeleteDialog({ wishlist, open, onOpenChange, onSuccess }: DeleteDialogProps) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!wishlist) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/wishlists/${wishlist.id}`);
      toast({
        title: 'Wishlist deleted',
        description: `"${wishlist.name}" and its items have been removed.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      toast({
        title: 'Could not delete wishlist',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this wishlist?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{' '}
            <span className="font-medium text-foreground">
              &quot;{wishlist?.name}&quot;
            </span>{' '}
            and all of its items and reservations. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleting}
            className="bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-600"
          >
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ------------------------------------------------------------------ */
/* Wishlist Card                                                       */
/* ------------------------------------------------------------------ */

interface WishlistCardProps {
  wishlist: Wishlist;
  onOpen: (wl: Wishlist) => void;
  onEdit: (wl: Wishlist) => void;
  onDelete: (wl: Wishlist) => void;
}

function WishlistCard({ wishlist, onOpen, onEdit, onDelete }: WishlistCardProps) {
  const { toast } = useToast();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className="group relative cursor-pointer overflow-hidden p-0 transition-shadow hover:shadow-lg"
        onClick={() => onOpen(wishlist)}
      >
        {/* Cover image / gradient placeholder */}
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

          {/* Public / private indicator */}
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

          {/* Dropdown menu trigger - stops propagation so card click doesn't fire */}
          <div
            className="absolute left-2 top-2"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-white/85 shadow-sm backdrop-blur hover:bg-white dark:bg-black/50 dark:hover:bg-black/70"
                  aria-label="Wishlist actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={async (e) => {
                    e.stopPropagation();
                    const shareUrl = `${window.location.origin}/?wishlistId=${wishlist.id}`;
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: wishlist.name,
                          text: `Check out my wishlist "${wishlist.name}" on WishGift!`,
                          url: shareUrl,
                        });
                        return;
                      } catch {}
                    }
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      toast({ title: 'Link copied! 📋', description: 'Wishlist link copied to clipboard.' });
                    } catch {
                      toast({ title: 'Wishlist Link', description: shareUrl });
                    }
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4 text-rose-500" />
                  Share Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(wishlist)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(wishlist)}
                  className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 dark:focus:bg-rose-950/40"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <span className="flex shrink-0 items-center gap-1 text-[11px]">
              <Calendar className="h-3 w-3" />
              {formatDate(wishlist.createdAt)}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton card                                                       */
/* ------------------------------------------------------------------ */

function WishlistCardSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="mt-1 h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Main View                                                           */
/* ------------------------------------------------------------------ */

export function MyWishlistsView() {
  const { toast } = useToast();
  const navigate = useAppStore((s) => s.navigate);
  const setSelectedWishlistId = useAppStore((s) => s.setSelectedWishlistId);
  const refreshKey = useAppStore((s) => s.refreshKey);
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);

  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<Wishlist | null>(null);
  const [deletingTarget, setDeletingTarget] = useState<Wishlist | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  /* ---------------- Fetch wishlists ---------------- */
  const fetchWishlists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/wishlists');
      const raw: Wishlist[] = Array.isArray(data) ? data : data?.wishlists ?? [];
      // Map _count.items → itemCount
      const list: Wishlist[] = raw.map((wl) => ({
        ...wl,
        itemCount: (wl as unknown as Record<string, unknown>)._count
          ? ((wl as unknown as Record<string, unknown>)._count as Record<string, number>).items
          : wl.itemCount ?? 0,
      }));
      setWishlists(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load wishlists';
      if (message !== 'Unauthorized') {
        toast({
          title: 'Could not load your wishlists',
          description: message,
          variant: 'destructive',
        });
      }
      setWishlists([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWishlists();
  }, [fetchWishlists, refreshKey]);

  /* ---------------- Handlers ---------------- */
  const handleOpenWishlist = (wl: Wishlist) => {
    setSelectedWishlistId(wl.id);
    navigate('wishlist-detail');
  };

  const handleNewWishlist = () => {
    setFormMode('create');
    setEditing(null);
    setFormOpen(true);
  };

  const handleEditWishlist = (wl: Wishlist) => {
    setFormMode('edit');
    setEditing(wl);
    setFormOpen(true);
  };

  const handleDeleteWishlist = (wl: Wishlist) => {
    setDeletingTarget(wl);
    setDeleteOpen(true);
  };

  const handleFormSuccess = () => {
    triggerRefresh();
  };

  const handleDeleteSuccess = () => {
    setDeletingTarget(null);
    triggerRefresh();
  };

  /* ---------------- Render ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-background to-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              <Gift className="h-3.5 w-3.5" />
              Your collections
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              My Wishlists
            </h1>
            <p className="text-sm text-muted-foreground">
              Curate the gifts you dream of and share them with the people you love.
            </p>
          </div>
          <Button
            onClick={handleNewWishlist}
            className="self-start bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600 sm:self-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Wishlist
          </Button>
        </header>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <WishlistCardSkeleton key={i} />
            ))}
          </div>
        ) : wishlists.length === 0 ? (
          <EmptyState onCreate={handleNewWishlist} />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {wishlists.map((wl) => (
              <WishlistCard
                key={wl.id}
                wishlist={wl}
                onOpen={handleOpenWishlist}
                onEdit={handleEditWishlist}
                onDelete={handleDeleteWishlist}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <WishlistFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initial={editing}
        onSuccess={handleFormSuccess}
      />
      <DeleteDialog
        wishlist={deletingTarget}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-rose-200 bg-white/60 px-6 py-16 text-center dark:border-rose-900/50 dark:bg-card/40"
    >
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-amber-50 text-rose-400 dark:from-rose-950 dark:to-amber-950 dark:text-rose-500">
        <Gift className="h-10 w-10" />
      </div>
      <h2 className="text-xl font-semibold">No wishlists yet</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Start by creating your first wishlist. Add the gifts you&apos;ve been
        dreaming of and share them with friends and family.
      </p>
      <Button
        onClick={onCreate}
        className="mt-6 bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600"
      >
        <Plus className="mr-2 h-4 w-4" />
        Create your first wishlist
      </Button>
    </motion.div>
  );
}

export default MyWishlistsView;
