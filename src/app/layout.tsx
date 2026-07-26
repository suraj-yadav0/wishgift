import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/app/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WishGift - Share Your Wishes, Receive Love",
  description: "Create wishlists, share with friends and family, and let them pick the perfect gift for you.",
  keywords: ["wishlist", "gifting", "gifts", "wish", "share", "friends", "family"],
  authors: [{ name: "WishGift" }],
  openGraph: {
    title: "WishGift - Share Your Wishes, Receive Love",
    description: "Create wishlists, share with friends and family, and let them pick the perfect gift for you.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WishGift - Share Your Wishes, Receive Love",
    description: "Create wishlists, share with friends and family, and let them pick the perfect gift for you.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
