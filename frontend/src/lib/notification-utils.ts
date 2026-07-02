import { Notification } from "@/types/notification";

/**
 * Returns a human-readable description of a notification.
 * Pure function — safe to import in both Server and Client Components.
 */
export function formatNotificationText(n: Notification): string {
  const actor =
    n.actor.handle !== null && n.actor.handle !== ""
      ? `@${n.actor.handle}`
      : (n.actor.displayName ?? "Someone");

  if (n.type === "REPLY_ON_THREAD") {
    return `${actor} commented to your thread`;
  }

  if (n.type === "LIKE_ON_THREAD") {
    return `${actor} liked your thread`;
  }

  return `${actor} interacted with your thread`;
}
