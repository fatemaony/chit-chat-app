"use client";

import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import { ThreadSummary } from "@/types/thread";
import { ThreadService } from "@/services/thread.service";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  ImageIcon,
  MessageCircle,
  MoreVertical,
  Pencil,
  ThumbsUp,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { CircularLoader } from "../ui/circular-loader";
import { useThreadsCache } from "@/hooks/use-threads-cache";
import { cn } from "@/lib/utils";

// Per-card like state type
type LikeState = { isLiked: boolean; likeCount: number; isToggling: boolean };

function ThreadsHomePage() {
  const { getToken, userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  // The search query comes from the URL (?q=…), set by the navbar search bar
  const q = searchParams.get("q") ?? "";

  const {
    cachedThreads,
    cachedLikeStates,
    cachedMyHandle,
    hasLoaded,
    needsRefetch,
    setCachedThreads,
    setCachedLikeStates,
    setCachedMyHandle,
    updateCachedLikeState,
    removeCachedThread,
    markRefetchDone,
  } = useThreadsCache();

  // Seed local state from cache (only when there is no search query)
  const [threads, setThreads] = useState<ThreadSummary[]>(
    q ? [] : (cachedThreads ?? [])
  );
  const [isLoading, setIsLoading] = useState(!!q || !hasLoaded);
  const [myHandle, setMyHandle] = useState<string | null>(cachedMyHandle);
  const [likeStates, setLikeStates] = useState<Record<number, LikeState>>(
    q ? {} : cachedLikeStates
  );

  // Three-dot menu state
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deletingThreadId, setDeletingThreadId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the three-dot menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    if (openMenuId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  // ── Load / refetch ────────────────────────────────────────────────────────
  // Skip the network call only when:
  //   • there is no search query (unfiltered view)
  //   • data was already loaded
  //   • nothing has been created / edited / deleted since last fetch
  useEffect(() => {
    if (!q && hasLoaded && !needsRefetch) return;

    let isMounted = true;

    async function load() {
      setIsLoading(true);

      try {
        const extractThreads = await apiGet<ThreadSummary[]>(
          apiClient,
          "/api/threads/threads",
          { params: { q: q || undefined } }
        );

        if (!isMounted) return;
        setThreads(extractThreads);

        // Fetch like counts for each thread
        if (userId && extractThreads.length > 0) {
          const details = await Promise.allSettled(
            extractThreads.map((t) => ThreadService.getThread(apiClient, t.id))
          );
          if (!isMounted) return;

          const newLikes: Record<number, LikeState> = {};
          details.forEach((result, i) => {
            if (result.status === "fulfilled") {
              newLikes[extractThreads[i].id] = {
                isLiked: result.value.viewerHasLikedThisPostOrNot,
                likeCount: result.value.likeCount,
                isToggling: false,
              };
            }
          });
          setLikeStates(newLikes);
          // Only persist to cache for the unfiltered view
          if (!q) setCachedLikeStates(newLikes);
        }

        // Load the current user's handle for ownership checks
        if (userId) {
          try {
            const me = await ThreadService.getMe(apiClient);
            if (!isMounted) return;
            const handle = me?.handle ?? null;
            setMyHandle(handle);
            if (!q) setCachedMyHandle(handle);
          } catch {
            if (!isMounted) return;
            setMyHandle(null);
            if (!q) setCachedMyHandle(null);
          }
        }

        // Persist to cache and mark as done only for the unfiltered view
        if (!q) {
          setCachedThreads(extractThreads);
          markRefetchDone();
        }
      } catch (error) {
        console.log(error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiClient, userId, q, needsRefetch]);

  // ── Like toggle ───────────────────────────────────────────────────────────
  async function handleToggleLike(threadId: number) {
    const current = likeStates[threadId] ?? {
      isLiked: false,
      likeCount: 0,
      isToggling: false,
    };
    if (current.isToggling) return;

    setLikeStates((prev) => ({ ...prev, [threadId]: { ...current, isToggling: true } }));

    try {
      if (current.isLiked) {
        await ThreadService.unlikeThread(apiClient, threadId);
        const next: LikeState = {
          isLiked: false,
          likeCount: Math.max(0, current.likeCount - 1),
          isToggling: false,
        };
        setLikeStates((prev) => ({ ...prev, [threadId]: next }));
        updateCachedLikeState(threadId, next);
      } else {
        await ThreadService.likeThread(apiClient, threadId);
        const next: LikeState = {
          isLiked: true,
          likeCount: current.likeCount + 1,
          isToggling: false,
        };
        setLikeStates((prev) => ({ ...prev, [threadId]: next }));
        updateCachedLikeState(threadId, next);
      }
    } catch (e) {
      console.log(e);
      setLikeStates((prev) => ({
        ...prev,
        [threadId]: { ...current, isToggling: false },
      }));
    }
  }

  // ── Delete thread ─────────────────────────────────────────────────────────
  async function handleDeleteThread(threadId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this thread? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setDeletingThreadId(threadId);
      await ThreadService.deleteThread(apiClient, threadId);
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      removeCachedThread(threadId);
      toast.success("Thread deleted", {
        description: "Your thread has been removed.",
      });
    } catch (e) {
      console.log(e);
      toast.error("Failed to delete thread", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setDeletingThreadId(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex max-w-4xl mx-auto flex-col">
      {/* Search results header */}
      {q && !isLoading && (
        <p className="mb-4 text-sm text-muted-foreground">
          {threads.length === 0
            ? "No results"
            : `${threads.length} result${threads.length !== 1 ? "s" : ""}`}{" "}
          for{" "}
          <span className="font-medium text-foreground">"{q}"</span>
        </p>
      )}

      <div className="space-y-4">
        {/* Loading */}
        {isLoading && (
          <CircularLoader
            label="Loading Threads…"
            className="py-10"
          />
        )}

        {/* Empty state */}
        {!isLoading && threads.length === 0 && (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {q
                  ? `No threads found for "${q}". Try a different keyword.`
                  : "No threads yet. Be the first to create one!"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Thread cards */}
        {!isLoading &&
          threads.map((thread) => {
            const isOwner =
              !!myHandle &&
              !!thread.author?.handle &&
              myHandle === thread.author.handle;
            const isMenuOpen = openMenuId === thread.id;
            const isDeleting = deletingThreadId === thread.id;

            return (
              <Card
                key={thread.id}
                className="group border-border/70 bg-card transition-colors duration-150 hover:border-primary/90 hover:bg-card/90"
              >
                {/* Thread image */}
                {thread.imageUrl && (
                  <div data-card-image className="relative w-full aspect-video overflow-hidden rounded-t-xl bg-muted/20">
                    <Image
                      src={thread.imageUrl}
                      alt={thread.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <Link href={`threads/${thread.id}`} className="flex-1 min-w-0">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {/* Author chip — display only (no author filter) */}
                          {thread?.author?.handle && (
                            <span className="flex items-center gap-1 rounded-full border border-border/70 bg-secondary/60 px-2 py-0.5 text-muted-foreground/90">
                              <User className="h-3 w-3" />
                              @{thread.author.handle}
                            </span>
                          )}
                          <span className="text-muted-foreground/85">
                            {new Date(thread.createdAt).toLocaleDateString()}
                          </span>
                          {!thread.imageUrl && (
                            <span className="flex items-center gap-1 text-muted-foreground/60">
                              <ImageIcon className="h-3 w-3" />
                              No image
                            </span>
                          )}
                        </div>

                        <CardTitle className="text-lg font-semibold text-foreground  line-clamp-2">
                          {thread.title}
                        </CardTitle>
                      </div>
                    </Link>

                    {/* Three-dot menu (owner only) */}
                    {isOwner && (
                      <div
                        className="relative shrink-0"
                        ref={isMenuOpen ? menuRef : undefined}
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          id={`thread-menu-btn-${thread.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : thread.id);
                          }}
                          className="h-8 w-8 rounded-full border border-transparent hover:border-border/70 hover:bg-accent/60"
                          aria-label="Thread options"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>

                        {isMenuOpen && (
                          <div className="absolute right-0 top-9 z-50 min-w-[150px] overflow-hidden rounded-lg border border-border bg-card shadow-lg shadow-black/20 animate-in fade-in slide-in-from-top-2 duration-150">
                            <button
                              id={`thread-edit-btn-${thread.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpenMenuId(null);
                                router.push(`/threads/${thread.id}?edit=true`);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/60"
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                              Edit Thread
                            </button>

                            <div className="mx-3 border-t border-border/60" />

                            <button
                              id={`thread-delete-btn-${thread.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpenMenuId(null);
                                handleDeleteThread(thread.id);
                              }}
                              disabled={isDeleting}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              {isDeleting ? "Deleting…" : "Delete Thread"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pb-4">
                  <Link href={`threads/${thread.id}`}>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {thread.excerpt}
                    </p>
                  </Link>

                  <div className="flex items-center gap-2 pt-1">
                    {userId && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={likeStates[thread.id]?.isToggling}
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleLike(thread.id);
                        }}
                        className="border-border/70 bg-card hover:bg-accent/60 text-foreground"
                      >
                        <ThumbsUp
                          className={cn(
                            "mr-1.5 h-3.5 w-3.5",
                            likeStates[thread.id]?.isLiked && "fill-blue-500 text-blue-500"
                          )}
                        />
                        {likeStates[thread.id]?.isToggling
                          ? "…"
                          : likeStates[thread.id]?.likeCount > 0
                            ? `${likeStates[thread.id].likeCount}`
                            : "Like"}
                      </Button>
                    )}
                    <Link
                      href={`threads/${thread.id}#comments`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-border/70 bg-card hover:bg-accent/60"
                      >
                        <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                        Comment
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}

export default ThreadsHomePage;
