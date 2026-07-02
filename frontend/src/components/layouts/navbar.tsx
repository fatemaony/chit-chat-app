"use client";

import { Show, useAuth, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "../ui/button";
import { Bell, Menu, MessageSquare, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import { Notification } from "@/types/notification";
import { useNotificationCount } from "@/hooks/use-notification-count";
import { toast } from "sonner";
import { RawDirectMessage, mapDirectMessage } from "@/types/chat";
import { usePathname } from "next/navigation";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { getToken, userId } = useAuth();
  const { socket } = useSocket();
  const pathname = usePathname();

  const {
    unreadCount,
    setUnreadCount,
    incrementUnread,
    unreadDmCount,
    incrementUnreadDm,
    currentDbUserId,
    setCurrentDbUserId,
  } = useNotificationCount();

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  // ── Fetch current user's DB id once on sign-in ───────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function loadMe() {
      if (!userId) { setCurrentDbUserId(null); return; }
      try {
        const profile = await apiGet<{ id: number }>(apiClient, "/api/me");
        if (isMounted) setCurrentDbUserId(Number(profile.id));
      } catch {
        // ignore
      }
    }
    loadMe();
    return () => { isMounted = false; };
  }, [userId]);

  // ── Load initial unread app-notification count ────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadUnreadNotifications() {
      if (!userId) {
        if (isMounted) setUnreadCount(0);
        return;
      }

      try {
        const data = await apiGet<Notification[]>(
          apiClient,
          "/api/notifications?unreadOnly=true"
        );
        if (!isMounted) return;
        setUnreadCount(data.length);
      } catch {
        // silently ignore
      }
    }

    loadUnreadNotifications();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // ── Real-time: app notifications ──────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (payload: Notification) => {
      incrementUnread();
      toast("New Notification", {
        description:
          payload.type === "REPLY_ON_THREAD"
            ? `${payload.actor.handle ?? "Someone"} commented on your thread`
            : `${payload.actor.handle ?? "Someone"} liked your thread`,
      });
    };

    socket.on("notification:new", handleNewNotification);
    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [socket, incrementUnread]);

  // ── Real-time: unread DM badge ────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleDmMessage = (payload: RawDirectMessage) => {
      const msg = mapDirectMessage(payload);

      // ✅ Only count for the recipient — never for the sender
      if (currentDbUserId === null || msg.recipientUserId !== currentDbUserId) {
        return;
      }

      // Don't badge if the user is already viewing this conversation on /chat
      if (pathname?.startsWith("/chat")) return;

      incrementUnreadDm(msg.senderUserId);

      toast("New message", {
        description: msg.body
          ? msg.body.length > 60
            ? `${msg.body.slice(0, 60)}…`
            : msg.body
          : "📷 Image",
        action: {
          label: "Open chat",
          onClick: () => {
            window.location.href = "/chat";
          },
        },
      });
    };

    socket.on("dm:message", handleDmMessage);
    return () => {
      socket.off("dm:message", handleDmMessage);
    };
  }, [socket, pathname, currentDbUserId, incrementUnreadDm]);

  const navItems = [
    {
      href: "/chat",
      label: "Chat",
      icon: MessageSquare,
      badge: unreadDmCount,
      match: (p?: string | null) => p?.startsWith("/chat"),
    },
    {
      href: "/profile",
      label: "Profile",
      icon: null,
      badge: 0,
      match: (p?: string | null) => p?.startsWith("/profile"),
    },
  ];

  const renderNavLinks = (item: (typeof navItems)[number]) => {
    const isActive = item.match(pathname);
    return (
      <Link
        key={item.href}
        href={item.href}
        className="relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors bg-primary/20 text-primary shadow-sm"
      >
        {item.icon && <item.icon className="h-3.5 w-3.5 shrink-0" />}
        {item.label}
        {item.badge > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] min-h-[18px] items-center justify-center rounded-full bg-black text-[10px] font-bold text-white shadow-sm shadow-black animate-in zoom-in-75 duration-200">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-sidebar-border bg-sidebar/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6 lg:px-15">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-sidebar-foreground"
          >
           <h1>Chit-Chat</h1>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(renderNavLinks)}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Show when="signed-in">
            <Link href="/notifications">
              <Button
                size="icon"
                variant="ghost"
                className="relative h-9 w-9 text-muted-foreground hover:bg-card/10 hover:text-foreground"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-5 min-h-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm shadow-primary/40">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </Link>
            <UserButton />
          </Show>
          <Show when="signed-out">
            <Link href="/sign-in">
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/90"
              >
                Sign In
              </Button>
            </Link>
          </Show>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-accent text-muted-foreground transition-colors md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="border-t border-sidebar-border bg-sidebar/90 md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 pb-4 pt-2">
            {navItems.map(renderNavLinks)}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
