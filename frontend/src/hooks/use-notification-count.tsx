"use client";

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type NotificationCountContextValue = {
  // ── Current user identity ─────────────────────────────────────────────────
  /** The current user's numeric DB id — set by Navbar after /api/me fetch */
  currentDbUserId: number | null;
  setCurrentDbUserId: Dispatch<SetStateAction<number | null>>;

  // ── Bell / app notifications ──────────────────────────────────────────────
  unreadCount: number;
  setUnreadCount: Dispatch<SetStateAction<number>>;
  incrementUnread: (val?: number) => void;
  decrementUnread: (val?: number) => void;

  // ── Unread direct messages ────────────────────────────────────────────────
  /** Total unread DM count across all conversations */
  unreadDmCount: number;
  /** Per-sender unread count map  { senderUserId → count } */
  unreadDmBySender: Record<number, number>;
  /** Call when a new DM arrives from `senderUserId` */
  incrementUnreadDm: (senderUserId: number) => void;
  /** Call when the user opens a conversation with `senderUserId` */
  clearUnreadDm: (senderUserId: number) => void;
  /** Call when the user opens /chat without a specific sender (clears all) */
  clearAllUnreadDm: () => void;
};

const NotificationCountContext =
  createContext<NotificationCountContextValue | null>(null);

export function NotificationCountProvider({
  children,
}: {
  children: ReactNode;
}) {
  // ── Current user DB id (populated by Navbar) ──────────────────────────────
  const [currentDbUserId, setCurrentDbUserId] = useState<number | null>(null);

  // ── App notifications ─────────────────────────────────────────────────────
  const [unreadCount, setUnreadCount] = useState(0);

  const incrementUnread = useCallback((val: number = 1) => {
    if (val <= 0) return;
    setUnreadCount((prev) => prev + val);
  }, []);

  const decrementUnread = useCallback((val: number = 1) => {
    if (val <= 0) return;
    setUnreadCount((prev) => Math.max(0, prev - val));
  }, []);

  // ── Direct-message unread counts ─────────────────────────────────────────
  const [unreadDmBySender, setUnreadDmBySender] = useState<
    Record<number, number>
  >({});

  const unreadDmCount = useMemo(
    () => Object.values(unreadDmBySender).reduce((s, n) => s + n, 0),
    [unreadDmBySender]
  );

  const incrementUnreadDm = useCallback((senderUserId: number) => {
    setUnreadDmBySender((prev) => ({
      ...prev,
      [senderUserId]: (prev[senderUserId] ?? 0) + 1,
    }));
  }, []);

  const clearUnreadDm = useCallback((senderUserId: number) => {
    setUnreadDmBySender((prev) => {
      if (!prev[senderUserId]) return prev;
      const next = { ...prev };
      delete next[senderUserId];
      return next;
    });
  }, []);

  const clearAllUnreadDm = useCallback(() => {
    setUnreadDmBySender({});
  }, []);

  // ── Memoised context value ────────────────────────────────────────────────
  const value = useMemo(
    () => ({
      currentDbUserId,
      setCurrentDbUserId,
      unreadCount,
      setUnreadCount,
      incrementUnread,
      decrementUnread,
      unreadDmCount,
      unreadDmBySender,
      incrementUnreadDm,
      clearUnreadDm,
      clearAllUnreadDm,
    }),
    [
      currentDbUserId,
      unreadCount,
      incrementUnread,
      decrementUnread,
      unreadDmCount,
      unreadDmBySender,
      incrementUnreadDm,
      clearUnreadDm,
      clearAllUnreadDm,
    ]
  );

  return (
    <NotificationCountContext.Provider value={value}>
      {children}
    </NotificationCountContext.Provider>
  );
}

export function useNotificationCount() {
  const ctx = useContext(NotificationCountContext);
  if (!ctx) {
    throw new Error(
      "useNotificationCount must be used inside <NotificationCountProvider>"
    );
  }
  return ctx;
}
