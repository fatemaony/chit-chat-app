"use client";

import { Show, useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "../ui/button";
import { Bell, Home, Menu, MessageSquare, Plus, Search, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/use-socket";
import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import { Notification } from "@/types/notification";
import { useNotificationCount } from "@/hooks/use-notification-count";
import { toast } from "sonner";
import { RawDirectMessage, mapDirectMessage } from "@/types/chat";
import { usePathname } from "next/navigation";

// ── Tooltip wrapper ───────────────────────────────────────────────────────────
// Shows a small label below the wrapped element on hover/focus (desktop only).
function Tooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="group/tip relative hidden md:inline-flex">
      {children}
      <span
        role="tooltip"
        className="
          pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2
          whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1
          text-xs font-medium text-popover-foreground shadow-md
          opacity-0 scale-95 transition-all duration-150
          group-hover/tip:opacity-100 group-hover/tip:scale-100
          group-focus-within/tip:opacity-100 group-focus-within/tip:scale-100
        "
      >
        {label}
      </span>
    </span>
  );
}

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { getToken, userId } = useAuth();
  const { user } = useUser();
  const { socket } = useSocket();
  const pathname = usePathname();
  const router = useRouter();

  const {
    unreadCount,
    setUnreadCount,
    incrementUnread,
    unreadDmCount,
    incrementUnreadDm,
    currentDbUserId,
    setCurrentDbUserId,
    currentUserAvatarUrl,
    setCurrentUserAvatarUrl,
  } = useNotificationCount();

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  // ── Fetch current user's DB id once on sign-in ───────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function loadMe() {
      if (!userId) { setCurrentDbUserId(null); setCurrentUserAvatarUrl(null); return; }
      try {
        const profile = await apiGet<{ id: number, avatarUrl?: string }>(apiClient, "/api/me");
        if (isMounted) {
          setCurrentDbUserId(Number(profile.id));
          if (profile.avatarUrl) setCurrentUserAvatarUrl(profile.avatarUrl);
        }
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

  // ── Search handlers ───────────────────────────────────────────────────────
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
    setMobileMenuOpen(false);
  }

  function clearSearch() {
    setSearchQuery("");
    router.push("/");
    searchInputRef.current?.focus();
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <header className="sticky top-0 z-40 border-b border-sidebar-border bg-sidebar/95 backdrop-blur-sm">
      {/* ── Desktop Navbar (hidden on mobile) ──────────────────────────── */}
      <div className="hidden md:flex mx-auto h-16 max-w-6xl items-center gap-3 px-4 md:px-6 lg:px-15">
        {/* ── Left: Logo only ─────────────────────────────────────────────── */}
        <div className="flex items-center shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg text-sidebar-foreground"
          >
            <h1 className="font-black tracking-tight">Chit-Chat</h1>
          </Link>
        </div>

        {/* ── Center: Search bar (desktop only) ──────────────────────────── */}
        <Show when="signed-in">
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-sm mx-2"
          >
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search threads…"
                aria-label="Search threads"
                className="w-full rounded-full border border-border bg-accent/50 py-1.5 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>
        </Show>

        {/* ── Right: All icon actions ───────────────────────────────────────── */}
        <div className="flex items-center gap-1 md:gap-2 ml-auto shrink-0">
          {/* Theme toggle with tooltip */}
          <Tooltip label="Toggle theme">
            <ThemeToggle />
          </Tooltip>

          <Show when="signed-in">
            {/* Chat — icon only on desktop, with tooltip */}
            <Tooltip label="Chat">
              <Link href="/chat">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Chat"
                  className="relative h-9 w-9 text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  {unreadDmCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] min-h-[18px] items-center justify-center rounded-full bg-black text-[10px] font-bold text-white shadow-sm shadow-black">
                      {unreadDmCount > 99 ? "99+" : unreadDmCount}
                    </span>
                  )}
                </Button>
              </Link>
            </Tooltip>

            {/* New Thread — with tooltip */}
            <Tooltip label="New thread">
              <Link href="/threads/new">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="New thread"
                  className="h-9 w-9 text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </Tooltip>

            {/* Notifications — with tooltip */}
            <Tooltip label="Notifications">
              <Link href="/notifications">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Notifications"
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
            </Tooltip>

            {/* App Profile */}
            {user && (
              <Tooltip label="Profile">
                <Link href="/profile" className="shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Profile"
                    className="h-8 w-8 rounded-full overflow-hidden border border-border p-0 hover:border-primary/50 transition-colors ml-1"
                  >
                    <img
                      src={currentUserAvatarUrl || user.imageUrl}
                      alt={user.fullName || "User profile"}
                      className="h-full w-full object-cover"
                    />
                  </Button>
                </Link>
              </Tooltip>
            )}
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
        </div>
      </div>

      {/* ── Mobile Navbar (hidden on desktop) ───────────────────────────── */}
      <div className="flex md:hidden flex-col w-full">
        {/* Row 1: Logo and Profile/Search */}
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-lg text-sidebar-foreground">
            <h1 className="font-black tracking-tight">Chit-Chat</h1>
          </Link>

          <Show when="signed-in">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/60"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              {user && (
                <Link href="/profile" className="shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Profile"
                    className="h-8 w-8 rounded-full overflow-hidden border border-border p-0 hover:border-primary/50 transition-colors"
                  >
                    <img
                      src={currentUserAvatarUrl || user.imageUrl}
                      alt={user.fullName || "User profile"}
                      className="h-full w-full object-cover"
                    />
                  </Button>
                </Link>
              )}
            </div>
          </Show>

          <Show when="signed-out">
            <Link href="/sign-in">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/90">
                Sign In
              </Button>
            </Link>
          </Show>
        </div>

        {/* Mobile Search Dropdown (toggled via search icon) */}
        {mobileMenuOpen && (
          <div className="px-4 pb-3">
            <Show when="signed-in">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search threads…"
                    className="w-full rounded-full border border-border bg-accent/50 py-2 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </form>
            </Show>
          </div>
        )}

        {/* Row 2: Navigation Icons */}
        <Show when="signed-in">
          <div className="flex h-12 items-center justify-around border-t border-border/40 px-2 pb-1 pt-1">
            <Link href="/" className="flex flex-1 items-center justify-center py-2 text-muted-foreground hover:text-foreground">
              <Home className="h-6 w-6" />
            </Link>
            <Link href="/chat" className="relative flex flex-1 items-center justify-center py-2 text-muted-foreground hover:text-foreground">
              <MessageSquare className="h-6 w-6" />
              {unreadDmCount > 0 && (
                <span className="absolute right-2 top-1 inline-flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-black text-[9px] font-bold text-white">
                  {unreadDmCount > 99 ? "99+" : unreadDmCount}
                </span>
              )}
            </Link>
            <Link href="/threads/new" className="flex flex-1 items-center justify-center py-2 text-muted-foreground hover:text-foreground">
              <Plus className="h-6 w-6" />
            </Link>
            <Link href="/notifications" className="relative flex flex-1 items-center justify-center py-2 text-muted-foreground hover:text-foreground">
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-1 inline-flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </Link>
            <div className="flex flex-1 items-center justify-center py-2">
              <ThemeToggle />
            </div>
          </div>
        </Show>
      </div>
    </header>
  );
}

export default Navbar;
