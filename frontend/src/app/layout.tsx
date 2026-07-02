import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import Navbar from "@/components/layouts/navbar";
import { NotificationCountProvider } from "@/hooks/use-notification-count";
import { SocketProvider } from "@/hooks/use-socket";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chit-Chat",
  description: "Real-time chat and social app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex-col">
          <NotificationCountProvider>
            <SocketProvider>
              <div className="flex min-h-screen flex-col bg-background text-foreground">
                <Navbar />
                <main className="flex flex-1 flex-col">
                  <div className="w-full flex mx-auto flex-1 flex-col px-4 lg:px-15 py-8 md:py-10">
                    {children}
                  </div>
                </main>
              </div>
              <Toaster />
            </SocketProvider>
          </NotificationCountProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
