'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Gift,
  Users,
  Heart,
  ArrowRight,
  ListPlus,
  Sparkles,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppStore } from '@/store/use-app-store';
import { useToast } from '@/hooks/use-toast';

/* ------------------------------------------------------------------ */
/* Validation schemas                                                  */
/* ------------------------------------------------------------------ */

const signInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type SignInValues = z.infer<typeof signInSchema>;

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type RegisterValues = z.infer<typeof registerSchema>;

/* ------------------------------------------------------------------ */
/* Static content                                                      */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: Gift,
    title: 'Create Wishlists',
    description:
      'Organize the items you truly want into beautiful wishlists for birthdays, holidays, weddings, or any occasion.',
    accent: 'from-rose-500 to-pink-500',
    glow: 'bg-rose-500/10',
  },
  {
    icon: Users,
    title: 'Share with Loved Ones',
    description:
      'Send your wishlists to friends and family with a single link. They can browse and reserve gifts without an account.',
    accent: 'from-orange-500 to-amber-500',
    glow: 'bg-orange-500/10',
  },
  {
    icon: Heart,
    title: 'Receive Perfect Gifts',
    description:
      'No more unwanted presents or awkward duplicates. Friends can reserve items so everyone knows what is already taken.',
    accent: 'from-amber-500 to-yellow-500',
    glow: 'bg-amber-500/10',
  },
] as const;

const STEPS = [
  {
    icon: Sparkles,
    title: 'Create Account',
    description: 'Sign up for free and set up your profile in seconds.',
  },
  {
    icon: ListPlus,
    title: 'Build Your Wishlist',
    description: 'Add the items you want with photos, prices, and notes.',
  },
  {
    icon: Heart,
    title: 'Share & Receive',
    description: 'Share your list with loved ones and receive perfect gifts.',
  },
] as const;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function LandingView() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<'signin' | 'register'>('signin');

  const navigate = useAppStore((s) => s.navigate);
  const { toast } = useToast();

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', username: '', email: '', password: '' },
  });

  const openSignIn = () => {
    setMode('signin');
    setDialogOpen(true);
  };

  const openRegister = () => {
    setMode('register');
    setDialogOpen(true);
  };

  const switchMode = (next: 'signin' | 'register') => {
    setMode(next);
  };

  const onSignIn = async (values: SignInValues) => {
    try {
      const res = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (res?.error) {
        toast({
          title: 'Sign in failed',
          description: 'Invalid email or password. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      signInForm.reset();
      setDialogOpen(false);
      // Session sync hook will handle navigation to the app.
      navigate('my-wishlists');
    } catch {
      toast({
        title: 'Something went wrong',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const onRegister = async (values: RegisterValues) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Something went wrong' }));
        toast({
          title: 'Registration failed',
          description: err.error || 'Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Auto sign-in after successful registration.
      const signInRes = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (signInRes?.error) {
        toast({
          title: 'Account created',
          description: 'Please sign in with your new credentials.',
        });
        registerForm.reset();
        switchMode('signin');
        return;
      }

      toast({
        title: 'Welcome to WishGift!',
        description: 'Your account has been created successfully.',
      });
      registerForm.reset();
      setDialogOpen(false);
      // Session sync hook will handle navigation to the app.
      navigate('my-wishlists');
    } catch {
      toast({
        title: 'Something went wrong',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ============================================================= */}
      {/* Hero                                                          */}
      {/* ============================================================= */}
      <section className="relative overflow-hidden">
        {/* Warm gradient backdrop */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:from-rose-950/30 dark:via-orange-950/20 dark:to-amber-950/10" />
        {/* Decorative blurred blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 -z-10 h-96 w-96 rounded-full bg-rose-300/30 blur-3xl dark:bg-rose-500/20" />
        <div className="pointer-events-none absolute top-1/3 -left-32 -z-10 h-96 w-96 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-500/20" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 -z-10 h-72 w-72 rounded-full bg-orange-300/20 blur-3xl dark:bg-orange-500/10" />

        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-24 text-center sm:py-32 md:py-40">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-200/60 bg-white/70 px-4 py-1.5 text-sm font-medium text-rose-700 shadow-sm backdrop-blur dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
          >
            <Sparkles className="size-4" />
            Welcome to WishGift
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Share Your{' '}
            <span className="bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 bg-clip-text text-transparent">
              Wishes
            </span>
            , Receive{' '}
            <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
              Love
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl"
          >
            Create beautiful wishlists for any occasion, share them with friends
            and family, and let your loved ones pick the perfect gift. No more
            unwanted presents — just thoughtful surprises.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
          >
            <Button
              size="lg"
              onClick={openRegister}
              className="w-full gap-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/25 transition-all hover:from-rose-600 hover:to-orange-600 hover:shadow-rose-500/40 sm:w-auto"
            >
              Get Started
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={openSignIn}
              className="w-full border-rose-200 bg-white/70 text-rose-700 backdrop-blur hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-950/50 sm:w-auto"
            >
              Sign In
            </Button>
          </motion.div>

          {/* Trust line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 text-sm text-muted-foreground"
          >
            Free to use · No credit card required · Share with anyone
          </motion.p>
        </div>
      </section>

      {/* ============================================================= */}
      {/* Features                                                      */}
      {/* ============================================================= */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to gift better
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            WishGift makes it effortless to share what you truly want, so the
            people who love you always know what to give.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group h-full overflow-hidden border-border/60 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/5">
                  <CardHeader>
                    <div className="relative mb-2 inline-flex">
                      <div
                        className={`absolute inset-0 rounded-2xl ${feature.glow}`}
                      />
                      <div
                        className={`relative inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.accent} text-white shadow-lg`}
                      >
                        <Icon className="size-7" />
                      </div>
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ============================================================= */}
      {/* How It Works                                                  */}
      {/* ============================================================= */}
      <section className="relative overflow-hidden border-y border-border/60 bg-gradient-to-b from-rose-50/50 to-orange-50/50 py-20 dark:from-rose-950/10 dark:to-orange-950/10 sm:py-24">
        <div className="mx-auto w-full max-w-7xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              <ListPlus className="size-3.5" />
              Simple Process
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Three easy steps to thoughtful gifting.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, delay: index * 0.12 }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="relative mb-5">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 blur-lg opacity-40" />
                    <div className="relative flex size-20 items-center justify-center rounded-full border border-rose-200 bg-white shadow-md dark:border-rose-900/40 dark:bg-rose-950/30">
                      <Icon className="size-9 text-rose-600 dark:text-rose-300" />
                    </div>
                    <span className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 text-sm font-bold text-white shadow-md">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                    {step.description}
                  </p>

                  {/* Connector arrow (desktop only, between steps) */}
                  {index < STEPS.length - 1 && (
                    <div className="absolute top-10 -right-4 hidden h-px w-8 bg-gradient-to-r from-rose-300 to-orange-300 md:block" />
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-14 flex justify-center">
            <Button
              size="lg"
              onClick={openRegister}
              className="gap-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/25 transition-all hover:from-rose-600 hover:to-orange-600 hover:shadow-rose-500/40"
            >
              Start your first wishlist
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* Footer                                                        */}
      {/* ============================================================= */}
      <footer className="mt-auto border-t border-border/60 bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-sm">
              <Gift className="size-4" />
            </div>
            <span className="font-semibold text-foreground">WishGift</span>
          </div>
          <p>
            Made with{' '}
            <Heart className="inline size-3.5 fill-rose-500 text-rose-500" /> for
            thoughtful gifters.
          </p>
          <p>© {new Date().getFullYear()} WishGift. All rights reserved.</p>
        </div>
      </footer>

      {/* ============================================================= */}
      {/* Auth Dialog                                                   */}
      {/* ============================================================= */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/25">
              <Gift className="size-6" />
            </div>
            <DialogTitle className="text-center text-2xl">
              {mode === 'signin' ? 'Welcome back' : 'Join WishGift'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {mode === 'signin'
                ? 'Sign in to access your wishlists and shared gifts.'
                : 'Create a free account and start sharing your wishes.'}
            </DialogDescription>
          </DialogHeader>

          {mode === 'signin' ? (
            <form
              onSubmit={signInForm.handleSubmit(onSignIn)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={signInForm.formState.isSubmitting}
                  {...signInForm.register('email')}
                />
                {signInForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {signInForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={signInForm.formState.isSubmitting}
                  {...signInForm.register('password')}
                />
                {signInForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {signInForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={signInForm.formState.isSubmitting}
                className="w-full gap-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md shadow-rose-500/25 hover:from-rose-600 hover:to-orange-600"
              >
                {signInForm.formState.isSubmitting && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Sign In
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-semibold text-rose-600 underline-offset-4 hover:underline dark:text-rose-400"
                >
                  Sign up
                </button>
              </p>
            </form>
          ) : (
            <form
              onSubmit={registerForm.handleSubmit(onRegister)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="register-name">Full Name</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Jane Doe"
                  autoComplete="name"
                  disabled={registerForm.formState.isSubmitting}
                  {...registerForm.register('name')}
                />
                {registerForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {registerForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-username">Username</Label>
                <Input
                  id="register-username"
                  type="text"
                  placeholder="janedoe"
                  autoComplete="username"
                  disabled={registerForm.formState.isSubmitting}
                  {...registerForm.register('username')}
                />
                {registerForm.formState.errors.username && (
                  <p className="text-sm text-destructive">
                    {registerForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={registerForm.formState.isSubmitting}
                  {...registerForm.register('email')}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  disabled={registerForm.formState.isSubmitting}
                  {...registerForm.register('password')}
                />
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={registerForm.formState.isSubmitting}
                className="w-full gap-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md shadow-rose-500/25 hover:from-rose-600 hover:to-orange-600"
              >
                {registerForm.formState.isSubmitting && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Create Account
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="font-semibold text-rose-600 underline-offset-4 hover:underline dark:text-rose-400"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
