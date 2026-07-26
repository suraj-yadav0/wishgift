'use client';

import { type ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useAppStore } from '@/store/use-app-store';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';
import {
  Gift,
  ListTodo,
  Compass,
  User,
  Menu,
  LogOut,
  Heart,
} from 'lucide-react';

type ViewType = 'my-wishlists' | 'discover' | 'profile';

interface NavItem {
  view: ViewType;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { view: 'my-wishlists', label: 'My Wishlists', icon: <ListTodo className="h-4 w-4" /> },
  { view: 'discover', label: 'Discover', icon: <Compass className="h-4 w-4" /> },
  { view: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
];

function NavLinks({ onItemClick }: { onItemClick?: () => void }) {
  const currentView = useAppStore((s) => s.currentView);
  const navigate = useAppStore((s) => s.navigate);

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = currentView === item.view;
        return (
          <button
            key={item.view}
            onClick={() => {
              navigate(item.view);
              onItemClick?.();
            }}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function DesktopNav() {
  const currentView = useAppStore((s) => s.currentView);
  const navigate = useAppStore((s) => s.navigate);

  return (
    <div className="hidden md:flex items-center gap-1">
      {navItems.map((item) => {
        const isActive = currentView === item.view;
        return (
          <button
            key={item.view}
            onClick={() => navigate(item.view)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const user = session?.user as Record<string, unknown> | undefined;
  const navigate = useAppStore((s) => s.navigate);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <button
            onClick={() => navigate('my-wishlists')}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <Gift className="h-6 w-6 text-rose-500" />
            <span className="text-lg font-bold tracking-tight">
              Wish<span className="text-rose-500">Gift</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <DesktopNav />

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Desktop user menu */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={(user?.image as string) || undefined} />
                      <AvatarFallback className="bg-rose-100 text-rose-600 text-xs font-semibold">
                        {getInitials(user?.name as string)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {user?.name as string}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-rose-500" />
                      Wish<span className="text-rose-500">Gift</span>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col gap-4">
                    {/* User info in mobile menu */}
                    <div className="flex items-center gap-3 px-3 py-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={(user?.image as string) || undefined} />
                        <AvatarFallback className="bg-rose-100 text-rose-600">
                          {getInitials(user?.name as string)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user?.name as string}</p>
                        <p className="text-xs text-muted-foreground">
                          @{user?.username as string}
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-border" />
                    <NavLinks />
                    <div className="h-px bg-border" />
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto flex items-center justify-center gap-1 px-4 py-4 text-sm text-muted-foreground">
          <span>Made with</span>
          <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
          <span>by WishGift &copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
