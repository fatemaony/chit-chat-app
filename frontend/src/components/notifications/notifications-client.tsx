"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNotificationCount } from "@/hooks/use-notification-count";
import { createBrowserApiClient } from "@/lib/api-client";
import { formatNotificationText } from "@/lib/notification-utils";
import { Notification } from "@/types/notification";
import { useAuth } from "@clerk/nextjs";
import { CheckCheck, Inbox, MessageCircle, ThumbsUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Props = {
  initialNotifications: Notification[];
};

export function NotificationsClient({ initialNotifications }: Props) {
  const { getToken } = useAuth();
  const router = useRouter();

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const { decrementUnread, setUnreadCount } = useNotificationCount();

  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  async function openNoti(n: Notification) {
    try {
      if (!n.readAt) {
        await apiClient.post(`/api/notifications/${n.id}/read`);
        setNotifications((prev) =>
          prev.map((noti) =>
            noti.id === n.id ? { ...n, readAt: new Date().toISOString() } : noti
          )
        );
        decrementUnread();
      }
    } catch (err) {
      console.log(err);
    }

    router.push(`/threads/${n.threadId}`);
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.readAt);
    if (unread.length === 0) return;

    try {
      setIsMarkingAll(true);
      await apiClient.post("/api/notifications/read-all");

      const now = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => (n.readAt ? n : { ...n, readAt: now }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.log(err);
    } finally {
      setIsMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="mx-auto flex w-full flex-col gap-6 py-8 px-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
          <Inbox className="h-7 w-7 text-primary" />
          Notifications
        </h1>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={isMarkingAll}
            className="flex items-center gap-2 text-sm"
          >
            <CheckCheck className="h-4 w-4" />
            {isMarkingAll ? "Marking..." : "Mark all as read"}
          </Button>
        )}
      </div>

      <Card className="border-border/70 bg-card">
        {notifications.length === 0 && (
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No new notifications...
            </p>
          </CardContent>
        )}

        {notifications.length > 0 && (
          <CardContent className="divide-y divide-border/70">
            {notifications.map((n) => {
              const text = formatNotificationText(n);
              const icon =
                n.type === "REPLY_ON_THREAD" ? (
                  <MessageCircle className="h-4 w-4 text-chart-2" />
                ) : (
                  <ThumbsUp className="h-4 w-4 text-primary" />
                );

              const isUnread = !n.readAt;

              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openNoti(n)}
                  className={`flex w-full items-start gap-4 px-3 py-4 text-left transition-colors duration-200 ${
                    isUnread
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-primary/20"
                  }`}
                >
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-background/60">
                    {icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <p
                        className={`text-sm ${
                          isUnread
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {text}
                      </p>
                      <span
                        className={`shrink-0 text-xs ${
                          isUnread
                            ? "text-primary font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {new Date(n.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {n.thread.title}
                    </p>
                    {isUnread && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge
                          className="border-primary/30 bg-primary/10 text-[12px text-primary]"
                          variant="outline"
                        >
                          New
                        </Badge>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
