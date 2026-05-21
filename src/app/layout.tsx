import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { RealtimeProvider } from "@/lib/supabase/realtime";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Xtube - Premium Streaming Platform",
  description: "Ultra-fast streaming platform with Netflix-style dark UI. Watch trending videos, movies, and more.",
  keywords: ["streaming", "videos", "movies", "trending", "Xtube"],
  authors: [{ name: "Xtube" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#050505] text-white`}
      >
        <ErrorBoundary>
          <RealtimeProvider>
            {children}
          </RealtimeProvider>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
