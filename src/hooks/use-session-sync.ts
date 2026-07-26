'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/use-app-store';

export function useSessionSync() {
  const { data: session, status } = useSession();
  const setAuth = useAppStore((s) => s.setAuth);
  const navigate = useAppStore((s) => s.navigate);
  const currentView = useAppStore((s) => s.currentView);
  const setSelectedWishlistId = useAppStore((s) => s.setSelectedWishlistId);

  useEffect(() => {
    // Check for shared URL params (e.g. ?wishlistId=...)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sharedWishlistId = params.get('wishlistId');
      if (sharedWishlistId) {
        setSelectedWishlistId(sharedWishlistId);
        if (currentView !== 'wishlist-detail') {
          navigate('wishlist-detail');
        }
      }
    }

    if (status === 'authenticated' && session?.user) {
      const user = session.user as Record<string, unknown>;
      const userData = {
        id: (user.id as string) || '',
        name: (user.name as string) || '',
        username: (user.username as string) || '',
        email: (user.email as string) || '',
        image: (user.image as string | null) || null,
      };
      setAuth(userData);
      localStorage.setItem('userId', userData.id);
      
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const sharedWishlistId = params?.get('wishlistId');
      
      if (!sharedWishlistId && currentView === 'landing') {
        navigate('my-wishlists');
      }
    } else if (status === 'unauthenticated') {
      setAuth(null);
      localStorage.removeItem('userId');
      
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const sharedWishlistId = params?.get('wishlistId');
      
      if (!sharedWishlistId && currentView !== 'landing') {
        navigate('landing');
      }
    }
  }, [session, status, setAuth, navigate, currentView, setSelectedWishlistId]);

  return { session, status };
}
