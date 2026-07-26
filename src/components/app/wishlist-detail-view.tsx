'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Plus,
  Share2,
  Pencil,
  Trash2,
  Package,
  ExternalLink,
  Gift,
  Heart,
  ArrowRight,
  Star,
  MapPin,
  Tag,
  Users,
  Loader2,
  Globe,
  Lock,
  CheckCircle2,
} from 'lucide-react';

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { useAppStore } from '@/store/use-app-store';
import { useToast } from '@/hooks/use-toast';

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  productUrl: string | null;
  priority: number;
  quantity: number;
  isPurchased?: boolean;
  wishlistId: string;
  createdAt: string;
  updatedAt: string;
  reservationCount: number;
  reservedByCurrentUser: boolean;
}

interface WishlistOwner {
  id: string;
  name: string;
  username: string;
  image: string | null;
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
  userId: string;
  user: WishlistOwner;
  items: WishlistItem[];
}

interface ItemFormData {
  title: string;
  description: string;
  imageUrl: string;
  price: string;
  currency: string;
  productUrl: string;
  quantity: string;
  priority: string;
}

const EMPTY_ITEM_FORM: ItemFormData = {
  title: '',
  description: '',
  imageUrl: '',
  price: '',
  currency: 'USD',
  productUrl: '',
  quantity: '1',
  priority: '2',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case 'INR':
      return '₹';
    case 'USD':
    case 'CAD':
    case 'AUD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'JPY':
    case 'CNY':
      return '¥';
    default:
      return '$';
  }
}

function formatPrice(price: number | null, currency: string) {
  if (price == null) return null;
  try {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${price}`;
  }
}

function priorityConfig(priority: number) {
  switch (priority) {
    case 1:
      return { label: 'High', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-200 dark:border-red-800' };
    case 2:
      return { label: 'Medium', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-200 dark:border-amber-800' };
    case 3:
      return { label: 'Low', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950', border: 'border-emerald-200 dark:border-emerald-800' };
    default:
      return null;
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function WishlistDetailView() {
  const { selectedWishlistId, goBack, refreshKey, triggerRefresh, user } = useAppStore();
  const { toast } = useToast();

  // Data state
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemDialogMode, setItemDialogMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormData>(EMPTY_ITEM_FORM);
  const [itemSubmitting, setItemSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<WishlistItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [reservingItem, setReservingItem] = useState<WishlistItem | null>(null);
  const [reserveMessage, setReserveMessage] = useState('');
  const [reserveAnonymous, setReserveAnonymous] = useState(false);
  const [reserveQuantity, setReserveQuantity] = useState(1);
  const [reserveSubmitting, setReserveSubmitting] = useState(false);

  // Heart animation state
  const [heartAnimations, setHeartAnimations] = useState<Record<string, boolean>>({});
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'purchased'>('all');

  const isOwner = user && wishlist ? user.id === wishlist.userId : false;

  // ── Fetch wishlist ──
  const fetchWishlist = useCallback(async () => {
    if (!selectedWishlistId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet('/api/wishlists/' + selectedWishlistId);
      setWishlist(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }, [selectedWishlistId]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist, refreshKey]);

  // ── Share ──
  const handleShare = async () => {
    if (!wishlist) return;
    const shareUrl = `${window.location.origin}/?wishlistId=${wishlist.id}`;
    const shareData = {
      title: wishlist.name,
      text: `Check out my wishlist "${wishlist.name}" on WishGift!`,
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard if share sheet closed/dismissed
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Link copied to clipboard! 📋',
        description: 'Direct wishlist link has been copied.',
      });
    } catch {
      toast({
        title: 'Wishlist Link',
        description: shareUrl,
      });
    }
  };

  // ── Item Form ──
  const openCreateItem = () => {
    setItemDialogMode('create');
    setEditingItem(null);
    setItemForm(EMPTY_ITEM_FORM);
    setItemDialogOpen(true);
  };

  const openEditItem = (item: WishlistItem) => {
    setItemDialogMode('edit');
    setEditingItem(item);
    setItemForm({
      title: item.title,
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      price: item.price != null ? String(item.price) : '',
      currency: item.currency || 'USD',
      productUrl: item.productUrl || '',
      quantity: String(item.quantity),
      priority: String(item.priority),
    });
    setItemDialogOpen(true);
  };

  const handleItemFormSubmit = async () => {
    if (!selectedWishlistId || !itemForm.title.trim()) return;
    setItemSubmitting(true);
    try {
      const body: Record<string, any> = {
        title: itemForm.title.trim(),
        description: itemForm.description.trim() || undefined,
        imageUrl: itemForm.imageUrl.trim() || undefined,
        price: itemForm.price ? parseFloat(itemForm.price) : null,
        currency: itemForm.currency || 'USD',
        productUrl: itemForm.productUrl.trim() || undefined,
        priority: parseInt(itemForm.priority) || 2,
        quantity: Math.max(1, parseInt(itemForm.quantity) || 1),
      };

      if (itemDialogMode === 'create') {
        await apiPost(`/api/wishlists/${selectedWishlistId}/items`, body);
        toast({ title: 'Item added!', description: `"${body.title}" was added to your wishlist.` });
      } else if (editingItem) {
        await apiPut(`/api/wishlists/items/${editingItem.id}`, body);
        toast({ title: 'Item updated!', description: `"${body.title}" was updated.` });
      }

      setItemDialogOpen(false);
      triggerRefresh();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save item', variant: 'destructive' });
    } finally {
      setItemSubmitting(false);
    }
  };

  // ── Delete Item ──
  const openDeleteItem = (item: WishlistItem) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    setDeleteSubmitting(true);
    try {
      await apiDelete(`/api/wishlists/items/${deletingItem.id}`);
      toast({ title: 'Item deleted', description: `"${deletingItem.title}" was removed.` });
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      triggerRefresh();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete item', variant: 'destructive' });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // ── Reserve Gift ──
  const openReserveDialog = (item: WishlistItem) => {
    setReservingItem(item);
    setReserveMessage('');
    setReserveAnonymous(false);
    setReserveQuantity(1);
    setReserveDialogOpen(true);
  };

  const handleReserve = async () => {
    if (!reservingItem) return;
    setReserveSubmitting(true);
    try {
      await apiPost('/api/gifts/reserve', {
        wishlistItemId: reservingItem.id,
        quantity: reserveQuantity,
        message: reserveMessage.trim() || undefined,
        isAnonymous: reserveAnonymous,
      });
      toast({ title: 'Gift reserved! 🎁', description: `You reserved "${reservingItem.title}"` });
      setReserveDialogOpen(false);

      // Trigger heart animation
      setHeartAnimations((prev) => ({ ...prev, [reservingItem.id]: true }));
      setTimeout(() => {
        setHeartAnimations((prev) => ({ ...prev, [reservingItem.id]: false }));
      }, 1500);

      triggerRefresh();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to reserve gift', variant: 'destructive' });
    } finally {
      setReserveSubmitting(false);
    }
  };

  // ── Unreserve ──
  const handleUnreserve = async (item: WishlistItem) => {
    try {
      await apiPost('/api/gifts/unreserve', { wishlistItemId: item.id });
      toast({ title: 'Unreserved', description: `"${item.title}" is now available again.` });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to unreserve item',
        variant: 'destructive',
      });
    }
  };

  const handleTogglePurchased = async (item: WishlistItem) => {
    try {
      const nextPurchasedState = !item.isPurchased;
      await apiPut(`/api/wishlists/items/${item.id}`, { isPurchased: nextPurchasedState });
      setWishlist((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map((i) => (i.id === item.id ? { ...i, isPurchased: nextPurchasedState } : i)),
        };
      });
      toast({
        title: nextPurchasedState ? 'Marked as Purchased 🎉' : 'Marked as Available',
        description: `"${item.title}" status has been updated.`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update item status',
        variant: 'destructive',
      });
    }
  };

  // ── Render ──
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-orange-50/30 to-amber-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Back Button ── */}
        <button
          onClick={goBack}
          className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/80 hover:text-foreground dark:hover:bg-gray-800"
          aria-label="Go back"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        {/* ── Loading State ── */}
        {loading && <LoadingSkeleton />}

        {/* ── Error State ── */}
        {error && !loading && (
          <Card className="border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/30">
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Package className="h-12 w-12 text-rose-300" />
              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchWishlist}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Loaded Content ── */}
        {wishlist && !loading && !error && (
          <>
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mb-8"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {wishlist.name}
                  </h1>
                  {wishlist.description && (
                    <p className="mt-1.5 line-clamp-2 text-muted-foreground">
                      {wishlist.description}
                    </p>
                  )}
                  {/* Badges */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {wishlist.occasion && (
                      <Badge variant="secondary" className="gap-1 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        <Star className="h-3 w-3" />
                        {wishlist.occasion}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="gap-1">
                      {wishlist.isPublic ? (
                        <><Globe className="h-3 w-3" /> Public</>
                      ) : (
                        <><Lock className="h-3 w-3" /> Private</>
                      )}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Package className="h-3 w-3" />
                      {wishlist.items.length} {wishlist.items.length === 1 ? 'item' : 'items'}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="gap-1.5"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                  {isOwner && (
                    <>
                      <Button
                        size="sm"
                        onClick={openCreateItem}
                        className="gap-1.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Item</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setItemDialogMode('edit');
                          setEditingItem(null);
                          setItemForm({
                            title: wishlist.name,
                            description: wishlist.description || '',
                            imageUrl: '',
                            price: '',
                            currency: 'USD',
                            productUrl: '',
                            quantity: '1',
                            priority: '2',
                          });
                        }}
                        className="gap-1.5"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="hidden sm:inline">Edit Wishlist</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            <Separator className="mb-8" />

            {/* Items Section */}
            {wishlist.items.length === 0 ? (
              <EmptyState isOwner={isOwner} onAddItem={openCreateItem} />
            ) : (
              <div>
                {/* Filter Tabs */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant={filterStatus === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('all')}
                    >
                      All ({wishlist.items.length})
                    </Button>
                    <Button
                      variant={filterStatus === 'available' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('available')}
                    >
                      Available ({wishlist.items.filter((i) => !i.isPurchased).length})
                    </Button>
                    <Button
                      variant={filterStatus === 'purchased' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('purchased')}
                    >
                      Purchased / Done ({wishlist.items.filter((i) => i.isPurchased).length})
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {wishlist.items
                      .filter((item) => {
                        if (filterStatus === 'available') return !item.isPurchased;
                        if (filterStatus === 'purchased') return !!item.isPurchased;
                        return true;
                      })
                      .map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <ItemCard
                            item={item}
                            isOwner={isOwner}
                            onEdit={openEditItem}
                            onDelete={openDeleteItem}
                            onTogglePurchased={handleTogglePurchased}
                            onReserve={openReserveDialog}
                            onUnreserve={handleUnreserve}
                            heartAnimating={!!heartAnimations[item.id]}
                          />
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Item Form Dialog ── */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {itemDialogMode === 'create' ? 'Add New Item' : 'Edit Item'}
            </DialogTitle>
            <DialogDescription>
              {itemDialogMode === 'create'
                ? 'Add a new item to your wishlist.'
                : 'Update the item details.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="item-title">Title *</Label>
              <Input
                id="item-title"
                placeholder="e.g. Wireless Headphones"
                value={itemForm.title}
                onChange={(e) => setItemForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="item-desc">Description</Label>
              <Textarea
                id="item-desc"
                placeholder="Any details or notes..."
                value={itemForm.description}
                onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Image URL */}
            <div className="grid gap-2">
              <Label htmlFor="item-image" className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Image URL
              </Label>
              <Input
                id="item-image"
                placeholder="https://example.com/image.jpg"
                value={itemForm.imageUrl}
                onChange={(e) => setItemForm((f) => ({ ...f, imageUrl: e.target.value }))}
              />
            </div>

            {/* Price + Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="item-price" className="flex items-center gap-1.5">
                  <span className="font-semibold">{getCurrencySymbol(itemForm.currency)}</span>
                  Price
                </Label>
                <Input
                  id="item-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="29.99"
                  value={itemForm.price}
                  onChange={(e) => setItemForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-currency">Currency</Label>
                <Select
                  value={itemForm.currency}
                  onValueChange={(v) => setItemForm((f) => ({ ...f, currency: v }))}
                >
                  <SelectTrigger id="item-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                    <SelectItem value="AUD">AUD ($)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                    <SelectItem value="CNY">CNY (¥)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product URL */}
            <div className="grid gap-2">
              <Label htmlFor="item-url" className="flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Product URL
              </Label>
              <Input
                id="item-url"
                placeholder="https://store.example.com/product"
                value={itemForm.productUrl}
                onChange={(e) => setItemForm((f) => ({ ...f, productUrl: e.target.value }))}
              />
            </div>

            {/* Quantity + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="item-qty">Quantity</Label>
                <Input
                  id="item-qty"
                  type="number"
                  min="1"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select
                  value={itemForm.priority}
                  onValueChange={(v) => setItemForm((f) => ({ ...f, priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        High
                      </span>
                    </SelectItem>
                    <SelectItem value="2">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Medium
                      </span>
                    </SelectItem>
                    <SelectItem value="3">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Low
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleItemFormSubmit}
              disabled={!itemForm.title.trim() || itemSubmitting}
              className="bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600"
            >
              {itemSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {itemDialogMode === 'create' ? 'Add Item' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Item Dialog ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingItem?.title}&quot;? This action cannot be
              undone. Any existing reservations for this item will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              disabled={deleteSubmitting}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {deleteSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Reserve Gift Dialog ── */}
      <Dialog open={reserveDialogOpen} onOpenChange={setReserveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-rose-500" />
              Reserve This Gift
            </DialogTitle>
            <DialogDescription>
              Let the wishlist owner know you&apos;d like to gift this item.
            </DialogDescription>
          </DialogHeader>

          {reservingItem && (
            <div className="space-y-4 py-2">
              {/* Item preview */}
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                {reservingItem.imageUrl ? (
                  <img
                    src={reservingItem.imageUrl}
                    alt={reservingItem.title}
                    className="h-14 w-14 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-950 dark:to-amber-950">
                    <Package className="h-6 w-6 text-rose-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-tight">{reservingItem.title}</p>
                  {reservingItem.price != null && (
                    <p className="mt-0.5 text-sm font-semibold text-rose-600 dark:text-rose-400">
                      {formatPrice(reservingItem.price, reservingItem.currency)}
                    </p>
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="grid gap-2">
                <Label htmlFor="reserve-msg">Message (optional)</Label>
                <Textarea
                  id="reserve-msg"
                  placeholder="Leave a note for the wishlist owner..."
                  value={reserveMessage}
                  onChange={(e) => setReserveMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Quantity */}
              <div className="grid gap-2">
                <Label htmlFor="reserve-qty">Quantity</Label>
                <Select
                  value={String(reserveQuantity)}
                  onValueChange={(v) => setReserveQuantity(parseInt(v))}
                >
                  <SelectTrigger id="reserve-qty" className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: Math.max(1, reservingItem.quantity - reservingItem.reservationCount) },
                      (_, i) => i + 1
                    ).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Anonymous toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="reserve-anon" className="text-sm font-medium">
                    Reserve Anonymously
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    The owner won&apos;t see your name
                  </p>
                </div>
                <Switch
                  id="reserve-anon"
                  checked={reserveAnonymous}
                  onCheckedChange={setReserveAnonymous}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReserveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReserve}
              disabled={reserveSubmitting}
              className="bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600"
            >
              {reserveSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Heart className="mr-1.5 h-4 w-4" />
              Reserve Gift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Item Card ───────────────────────────────────────────────────────────────

function ItemCard({
  item,
  isOwner,
  onEdit,
  onDelete,
  onTogglePurchased,
  onReserve,
  onUnreserve,
  heartAnimating,
}: {
  item: WishlistItem;
  isOwner: boolean;
  onEdit: (item: WishlistItem) => void;
  onDelete: (item: WishlistItem) => void;
  onTogglePurchased: (item: WishlistItem) => void;
  onReserve: (item: WishlistItem) => void;
  onUnreserve: (item: WishlistItem) => void;
  heartAnimating: boolean;
}) {
  const pConfig = priorityConfig(item.priority);
  const isReserved = item.reservedByCurrentUser || item.reservationCount > 0;
  const isFullyReserved = item.reservationCount >= item.quantity;
  const isReservedByMe = item.reservedByCurrentUser;
  const isReservedByOther = isReserved && !isReservedByMe;

  return (
    <Card
      className={`group relative flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg ${
        isFullyReserved
          ? 'border-rose-200 bg-rose-50/30 dark:border-rose-900 dark:bg-rose-950/10'
          : isReservedByMe
          ? 'border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/10'
          : ''
      }`}
    >
      {/* Image / Placeholder */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-100 via-orange-50 to-amber-100 dark:from-rose-950 dark:via-orange-950 dark:to-amber-950">
            <Package className="h-12 w-12 text-rose-300/70 dark:text-rose-700/50" />
          </div>
        )}

        {/* Priority badge & Purchased badge */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5 z-10">
          {pConfig && (
            <Badge
              variant="secondary"
              className={`${pConfig.bg} ${pConfig.color} border ${pConfig.border} text-xs font-semibold`}
            >
              {pConfig.label}
            </Badge>
          )}
          {item.isPurchased && (
            <Badge className="gap-1 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Purchased / Done
            </Badge>
          )}
        </div>

        {/* Owner dropdown menu */}
        {isOwner && (
          <div className="absolute right-2 top-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-white/80 shadow-sm backdrop-blur-sm hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
                  aria-label="Item options"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && (
                  <DropdownMenuItem
                    onClick={() => onTogglePurchased(item)}
                    className="gap-2 text-emerald-600 focus:text-emerald-600 dark:text-emerald-400 dark:focus:text-emerald-400 font-medium"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {item.isPurchased ? 'Mark as Available' : 'Mark as Purchased / Done'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEdit(item)} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(item)}
                  className="gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Heart animation overlay */}
        <AnimatePresence>
          {heartAnimating && (
            <motion.div
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1] }}
                transition={{ duration: 0.5 }}
              >
                <Heart className="h-16 w-16 fill-rose-500 text-rose-500" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-tight">{item.title}</h3>
          {item.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {item.description}
            </p>
          )}
        </div>

        {/* Price + Quantity */}
        <div className="flex items-center justify-between">
          {item.price != null ? (
            <span className="text-lg font-semibold text-rose-600 dark:text-rose-400">
              {formatPrice(item.price, item.currency)}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Price not set</span>
          )}
          {item.quantity > 1 && (
            <Badge variant="outline" className="text-xs">
              Qty: {item.quantity}
            </Badge>
          )}
        </div>

        {/* Product URL */}
        {item.productUrl && (
          <a
            href={item.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 transition-colors hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Product
            <ArrowRight className="h-3 w-3" />
          </a>
        )}

        <Separator />

        {/* Reservation / Purchased Status */}
        <div className="flex flex-wrap items-center gap-2">
          {item.isPurchased ? (
            <Badge
              variant="secondary"
              className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Gifted / Purchased
            </Badge>
          ) : (
            <>
              {/* Owner sees reservation info */}
              {isOwner && (
                <>
                  {item.reservationCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    >
                      <Users className="h-3 w-3" />
                      {item.reservationCount} {item.reservationCount === 1 ? 'gifter' : 'gifters'}
                    </Badge>
                  )}
                  {isFullyReserved && (
                    <Badge
                      variant="secondary"
                      className="bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    >
                      Fully reserved
                    </Badge>
                  )}
                </>
              )}

              {/* Non-owner sees reservation controls */}
              {!isOwner && (
                <>
                  {isReservedByMe && (
                    <>
                      <Badge
                        variant="secondary"
                        className="gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      >
                        <Heart className="h-3 w-3" />
                        Reserved by You
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUnreserve(item)}
                        className="text-xs"
                      >
                        Unreserve
                      </Button>
                    </>
                  )}
                  {isReservedByOther && !isReservedByMe && (
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-muted text-muted-foreground"
                    >
                      Reserved
                    </Badge>
                  )}
                  {!isReserved && (
                    <Button
                      size="sm"
                      onClick={() => onReserve(item)}
                      disabled={isFullyReserved}
                      className="gap-1.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600"
                    >
                      <Gift className="h-4 w-4" />
                      Gift This
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ isOwner, onAddItem }: { isOwner: boolean; onAddItem: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-950 dark:to-amber-950">
        <Package className="h-12 w-12 text-rose-400 dark:text-rose-600" />
      </div>
      <h3 className="text-xl font-semibold">No items yet</h3>
      <p className="mt-1.5 max-w-sm text-center text-muted-foreground">
        {isOwner
          ? 'Start adding items to your wishlist so your friends and family know what you’d love.'
          : 'This wishlist is empty. Check back later!'}
      </p>
      {isOwner && (
        <Button
          onClick={onAddItem}
          className="mt-6 gap-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600"
        >
          <Plus className="h-4 w-4" />
          Add Your First Item
        </Button>
      )}
    </motion.div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full" />
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-8 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
