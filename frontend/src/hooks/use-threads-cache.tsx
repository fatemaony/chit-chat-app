"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { ThreadSummary } from "@/types/thread";

// ─── Types ────────────────────────────────────────────────────────────────────

type LikeState = { isLiked: boolean; likeCount: number; isToggling: boolean };

type ThreadsCacheContextValue = {
  /** Cached thread list — null means "not loaded yet" */
  cachedThreads: ThreadSummary[] | null;
  /** Cached like-states keyed by thread id */
  cachedLikeStates: Record<number, LikeState>;
  /** Cached handle for the current user */
  cachedMyHandle: string | null;
  /** Whether the initial load has completed at least once */
  hasLoaded: boolean;

  /** Replace the entire cache with fresh data */
  setCachedThreads: (threads: ThreadSummary[]) => void;
  setCachedLikeStates: (states: Record<number, LikeState>) => void;
  setCachedMyHandle: (handle: string | null) => void;
  /** Update a single thread's like state in the cache */
  updateCachedLikeState: (threadId: number, state: LikeState) => void;
  /** Remove a thread from the cache (after delete) */
  removeCachedThread: (threadId: number) => void;
  /**
   * Set the invalidation flag — next mount of ThreadsHomePage will
   * re-fetch even if data is already cached.
   */
  invalidateThreads: () => void;
  /** Whether a fresh fetch is needed on next mount */
  needsRefetch: boolean;
  /** Called by ThreadsHomePage after it finishes a fresh fetch */
  markRefetchDone: () => void;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const ThreadsCacheContext = createContext<ThreadsCacheContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThreadsCacheProvider({ children }: { children: ReactNode }) {
  const [cachedThreads, setCachedThreadsState] = useState<ThreadSummary[] | null>(null);
  const [cachedLikeStates, setCachedLikeStatesState] = useState<Record<number, LikeState>>({});
  const [cachedMyHandle, setCachedMyHandleState] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [needsRefetch, setNeedsRefetch] = useState(false);

  const setCachedThreads = useCallback((threads: ThreadSummary[]) => {
    setCachedThreadsState(threads);
    setHasLoaded(true);
  }, []);

  const setCachedLikeStates = useCallback((states: Record<number, LikeState>) => {
    setCachedLikeStatesState(states);
  }, []);

  const setCachedMyHandle = useCallback((handle: string | null) => {
    setCachedMyHandleState(handle);
  }, []);

  const updateCachedLikeState = useCallback((threadId: number, state: LikeState) => {
    setCachedLikeStatesState((prev) => ({ ...prev, [threadId]: state }));
  }, []);

  const removeCachedThread = useCallback((threadId: number) => {
    setCachedThreadsState((prev) => prev ? prev.filter((t) => t.id !== threadId) : prev);
  }, []);

  const invalidateThreads = useCallback(() => {
    setNeedsRefetch(true);
  }, []);

  const markRefetchDone = useCallback(() => {
    setNeedsRefetch(false);
  }, []);

  const value = useMemo(
    () => ({
      cachedThreads,
      cachedLikeStates,
      cachedMyHandle,
      hasLoaded,
      setCachedThreads,
      setCachedLikeStates,
      setCachedMyHandle,
      updateCachedLikeState,
      removeCachedThread,
      invalidateThreads,
      needsRefetch,
      markRefetchDone,
    }),
    [
      cachedThreads,
      cachedLikeStates,
      cachedMyHandle,
      hasLoaded,
      setCachedThreads,
      setCachedLikeStates,
      setCachedMyHandle,
      updateCachedLikeState,
      removeCachedThread,
      invalidateThreads,
      needsRefetch,
      markRefetchDone,
    ]
  );

  return (
    <ThreadsCacheContext.Provider value={value}>
      {children}
    </ThreadsCacheContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useThreadsCache() {
  const ctx = useContext(ThreadsCacheContext);
  if (!ctx) {
    throw new Error("useThreadsCache must be used inside <ThreadsCacheProvider>");
  }
  return ctx;
}
