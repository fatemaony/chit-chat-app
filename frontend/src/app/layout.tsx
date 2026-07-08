import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/layouts/navbar";
import { NotificationCountProvider } from "@/hooks/use-notification-count";
import { SocketProvider } from "@/hooks/use-socket";
import { ThreadsCacheProvider } from "@/hooks/use-threads-cache";
import { ThemeProvider } from "@/components/layouts/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
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
        className={`${inter.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex-col">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange={false}
            storageKey="chit-chat-theme"
          >
            <NotificationCountProvider>
              <ThreadsCacheProvider>
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
              </ThreadsCacheProvider>
            </NotificationCountProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
