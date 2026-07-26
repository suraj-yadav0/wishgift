import { create } from 'zustand';

// View types for SPA routing
type AppView = 'landing' | 'my-wishlists' | 'wishlist-detail' | 'discover' | 'profile' | 'user-profile';

interface AppState {
  // Navigation
  currentView: AppView;
  previousView: AppView | null;
  navigate: (view: AppView) => void;
  goBack: () => void;

  // Selected entities
  selectedWishlistId: string | null;
  selectedUsername: string | null;
  setSelectedWishlistId: (id: string | null) => void;
  setSelectedUsername: (username: string | null) => void;

  // Auth state (hydrated from NextAuth session)
  isAuthenticated: boolean;
  user: { id: string; name: string; username: string; email: string; image: string | null } | null;
  setAuth: (user: { id: string; name: string; username: string; email: string; image: string | null } | null) => void;

  // Data caches
  myWishlists: any[]; // Will type properly later
  setMyWishlists: (wishlists: any[]) => void;

  // Refresh triggers
  refreshKey: number;
  triggerRefresh: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'landing',
  previousView: null,
  navigate: (view) =>
    set((state) => ({
      previousView: state.currentView,
      currentView: view,
    })),
  goBack: () =>
    set((state) => ({
      currentView: state.previousView ?? 'landing',
      previousView: null,
    })),

  // Selected entities
  selectedWishlistId: null,
  selectedUsername: null,
  setSelectedWishlistId: (id) => set({ selectedWishlistId: id }),
  setSelectedUsername: (username) => set({ selectedUsername: username }),

  // Auth state
  isAuthenticated: false,
  user: null,
  setAuth: (user) => set({ user, isAuthenticated: !!user }),

  // Data caches
  myWishlists: [],
  setMyWishlists: (wishlists) => set({ myWishlists: wishlists }),

  // Refresh triggers
  refreshKey: 0,
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
}));
