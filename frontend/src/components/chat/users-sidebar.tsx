"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotificationCount } from "@/hooks/use-notification-count";
import { cn } from "@/lib/utils";
import { ChatUser } from "@/types/chat";
import { MessageSquare } from "lucide-react";
import { CircularLoader } from "../ui/circular-loader";

interface UsersSidebarProps {
  users: ChatUser[];
  onlineUserIds: number[];
  activeUserId: number | null;
  loadingUsers: boolean;
  onSelectUser: (userId: number) => void;
}

export default function UsersSidebar({
  users,
  onlineUserIds,
  activeUserId,
  loadingUsers,
  onSelectUser,
}: UsersSidebarProps) {
  const { unreadDmBySender } = useNotificationCount();
  const onlineCount = users.filter((u) => onlineUserIds.includes(u.id)).length;

  return (
    <aside className="w-full shrink-0 md:w-72">
      <Card className="h-full border-border/70 bg-card md:sticky md:top-24">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <CardTitle className="text-sm text-foreground">
              Direct Messages
            </CardTitle>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {onlineCount} Online · {users.length} total
          </p>
        </CardHeader>

        <CardContent className="flex max-h-[calc(100vh-12rem)] flex-col gap-1 overflow-y-auto">
          {loadingUsers && (
            <CircularLoader label="Loading users…" className="py-8" />
          )}

          {!loadingUsers &&
            users.map((user) => {
              const isOnline = onlineUserIds.includes(user.id);
              const isActive = activeUserId === user.id;
              const label =
                user.handle && user.handle !== ""
                  ? `@${user.handle}`
                  : user.displayName ?? "User";
              const dmBadge = unreadDmBySender[user.id] ?? 0;

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onSelectUser(user.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-xs transition-colors duration-150",
                    isActive
                      ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                      : "text-muted-foreground hover:bg-card/90"
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-8 w-8">
                      {user.avatarUrl && (
                        <AvatarImage src={user.avatarUrl} alt={label} />
                      )}
                    </Avatar>
                    {isOnline && (
                      <span
                        aria-label="Online"
                        className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card animate-in zoom-in-75 duration-200"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex flex-1 flex-col">
                    <span className="truncate text-[12px] font-medium text-foreground">
                      {label}
                    </span>
                    <span
                      className={cn(
                        "text-[12px]",
                        isOnline ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                  {dmBadge > 0 && !isActive && (
                    <span className="ml-auto inline-flex min-w-[18px] min-h-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-in zoom-in-75 duration-200">
                      {dmBadge > 99 ? "99+" : dmBadge}
                    </span>
                  )}
                </button>
              );
            })}
        </CardContent>
      </Card>
    </aside>
  );
}
