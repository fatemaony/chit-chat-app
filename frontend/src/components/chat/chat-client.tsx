"use client";

import DirectChatPanel from "@/components/chat/direct-chat-panel";
import UsersSidebar from "@/components/chat/users-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { useSocket } from "@/hooks/use-socket";
import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import { useNotificationCount } from "@/hooks/use-notification-count";
import { ChatUser, RawDirectMessage, mapDirectMessage } from "@/types/chat";
import { useAuth } from "@clerk/nextjs";
import { Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function ChatClient() {
  const { getToken } = useAuth();
  const { connected, socket } = useSocket();
  const { clearUnreadDm, incrementUnreadDm, currentDbUserId } = useNotificationCount();

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const [users, setUsers] = useState<ChatUser[]>([]);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);

  // ── Fetch chat users ─────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoadingUsers(true);
      try {
        const res = await apiGet<ChatUser[]>(apiClient, "/api/chat/users");
        if (!isMounted) return;

        const finalRes = res.map((row) => ({
          id: Number(row.id),
          displayName: row.displayName ?? null,
          handle: row.handle ?? null,
          avatarUrl: row.avatarUrl ?? null,
        }));

        setUsers(finalRes);

        if (res.length > 0 && activeUserId === null) {
          setActiveUserId(res[0].id);
        }
      } catch (err) {
        console.error("Failed to load chat users:", err);
      } finally {
        if (isMounted) setLoadingUsers(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getToken]);

  // ── Clear DM badge when a conversation becomes active ────────────────────
  useEffect(() => {
    if (activeUserId !== null) {
      clearUnreadDm(activeUserId);
    }
  }, [activeUserId, clearUnreadDm]);

  // ── Handle incoming DMs while /chat is open ───────────────────────────────
  // Messages for the *active* conversation are shown immediately (no badge).
  // Messages from *other* senders still increment their badge — but only
  // if the current user is the recipient (never badge the sender).
  useEffect(() => {
    if (!socket) return;

    function handleDmMessage(payload: RawDirectMessage) {
      const msg = mapDirectMessage(payload);

      // ✅ Only the recipient should get a badge
      if (currentDbUserId === null || msg.recipientUserId !== currentDbUserId) return;

      // Active conversation is already visible — no badge needed
      if (msg.senderUserId === activeUserId) return;

      // Bump badge for the sender (visible in the sidebar)
      incrementUnreadDm(msg.senderUserId);
    }

    socket.on("dm:message", handleDmMessage);
    return () => {
      socket.off("dm:message", handleDmMessage);
    };
  }, [socket, activeUserId, currentDbUserId, incrementUnreadDm]);

  // ── Track online presence via socket ─────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    function handlePresence(payload: { onlineUserIds?: number[] }) {
      setOnlineUserIds(payload?.onlineUserIds ?? []);
    }

    socket.on("presence:update", handlePresence);
    return () => {
      socket.off("presence:update", handlePresence);
    };
  }, [socket]);

  const activeUser =
    activeUserId !== null
      ? users.find((u) => u.id === activeUserId) ?? null
      : null;

  // ── Handle selecting a user: clear their badge ───────────────────────────
  function handleSelectUser(userId: number) {
    setActiveUserId(userId);
    clearUnreadDm(userId);
  }

  return (
    <div className="max-auto max-w-6xl flex w-full flex-col gap-4 py-6 md:flex-row md:gap-6">
      {/* ── Server-side: user list sidebar ── */}
      <UsersSidebar
        users={users}
        onlineUserIds={onlineUserIds}
        activeUserId={activeUserId}
        loadingUsers={loadingUsers}
        onSelectUser={handleSelectUser}
      />

      {/* ── Client-side: active conversation panel ── */}
      <main className="min-h-[calc(100vh-8rem)] flex-1 md:min-h-auto">
        {activeUserId && activeUser ? (
          <DirectChatPanel
            otherUserId={activeUserId}
            otherUser={activeUser}
            socket={socket}
            connected={connected}
          />
        ) : (
          <Card className="flex h-full items-center justify-center border-border/70 bg-card">
            <CardContent className="text-center">
              <Users className="mx-auto mb-3 w-12 h-12 opacity-55 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Select a user to start chatting…
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
