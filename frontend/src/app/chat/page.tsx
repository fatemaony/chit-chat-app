import ChatClient from "@/components/chat/chat-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat · Chit Chat",
  description: "Send and receive direct messages in real time.",
};

/**
 * Server Component — no hooks, no "use client".
 * Renders the static shell and hands off interactivity to ChatClient.
 */
export default function ChatPage() {
  return <ChatClient />;
}
