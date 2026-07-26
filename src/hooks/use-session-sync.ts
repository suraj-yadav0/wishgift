'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/use-app-store';

export function useSessionSync() {
  const { data: session, status } = useSession();
  const setAuth = useAppStore((s) => s.setAuth);
  const navigate = useAppStore((s) => s.navigate);
  const currentView = useAppStore((s) => s.currentView);

  useEffect(() => {
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
      if (currentView === 'landing') {
        navigate('my-wishlists');
      }
    } else if (status === 'unauthenticated') {
      setAuth(null);
      localStorage.removeItem('userId');
      if (currentView !== 'landing') {
        navigate('landing');
      }
    }
  }, [session, status, setAuth, navigate, currentView]);

  return { session, status };
}
