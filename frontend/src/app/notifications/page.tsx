import { Notification } from "@/types/notification";
import { auth } from "@clerk/nextjs/server";
import { NotificationsClient } from "../../components/notifications/notifications-client";

async function fetchNotifications(token: string): Promise<Notification[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://chit-chat-backend-0bjd.onrender.com";

  const res = await fetch(`${baseUrl}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store", // always fresh — notifications must not be stale
  });

  if (!res.ok) return [];

  const json = (await res.json()) as { data: Notification[] };
  return json.data ?? [];
}

export default async function NotificationsPage() {
  const { getToken } = await auth();
  const token = await getToken();

  const initialNotifications = token ? await fetchNotifications(token) : [];

  return <NotificationsClient initialNotifications={initialNotifications} />;
}
