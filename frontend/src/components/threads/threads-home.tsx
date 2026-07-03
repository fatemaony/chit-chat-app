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
  Plus,
  ThumbsUp,
  Trash2,
  User,
} from "lucide-react";
import { Input } from "../ui/input";
import { toast } from "sonner";
import Image from "next/image";

function ThreadsHomePage() {
  const { getToken, userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [authorFilter, setAuthorFilter] = useState(
    searchParams.get("author") ?? ""
  );
  const [myHandle, setMyHandle] = useState<string | null>(null);

  // Per-card like state
  const [likeStates, setLikeStates] = useState<
    Record<number, { isLiked: boolean; likeCount: number; isToggling: boolean }>
  >({});

  // Three-dot menu state
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deletingThreadId, setDeletingThreadId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
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

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);

        const extractThreads = await apiGet<ThreadSummary[]>(
          apiClient,
          "/api/threads/threads",
          {
            params: {
              author: authorFilter.trim() || undefined,
              q: search.trim() || undefined,
            },
          }
        );

        if (!isMounted) return;
        setThreads(extractThreads);

        // Fetch real like counts per thread
        if (userId && extractThreads.length > 0) {
          const details = await Promise.allSettled(
            extractThreads.map((t) => ThreadService.getThread(apiClient, t.id))
          );
          if (!isMounted) return;
          const initialLikes: Record<
            number,
            { isLiked: boolean; likeCount: number; isToggling: boolean }
          > = {};
          details.forEach((result, i) => {
            if (result.status === "fulfilled") {
              initialLikes[extractThreads[i].id] = {
                isLiked: result.value.viewerHasLikedThisPostOrNot,
                likeCount: result.value.likeCount,
                isToggling: false,
              };
            }
          });
          setLikeStates(initialLikes);
        }

        // Load the current user's handle for ownership check
        if (userId) {
          try {
            const me = await ThreadService.getMe(apiClient);
            if (!isMounted) return;
            setMyHandle(me?.handle ?? null);
          } catch {
            if (!isMounted) return;
            setMyHandle(null);
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
  }, [apiClient, userId]);

  async function applyFilters(currentAuthor: string, currentSearch: string) {
    const params = new URLSearchParams();
    if (currentAuthor.trim()) params.set("author", currentAuthor.trim());
    if (currentSearch.trim()) params.set("q", currentSearch.trim());
    router.push(`?${params.toString()}`);

    setIsLoading(true);
    try {
      const filtered = await apiGet<ThreadSummary[]>(
        apiClient,
        "/api/threads/threads",
        {
          params: {
            author: currentAuthor.trim() || undefined,
            q: currentSearch.trim() || undefined,
          },
        }
      );

      setThreads(filtered);
      setLikeStates({});

      if (userId && filtered.length > 0) {
        const details = await Promise.allSettled(
          filtered.map((t) => ThreadService.getThread(apiClient, t.id))
        );
        const newLikes: Record<
          number,
          { isLiked: boolean; likeCount: number; isToggling: boolean }
        > = {};
        details.forEach((result, i) => {
          if (result.status === "fulfilled") {
            newLikes[filtered[i].id] = {
              isLiked: result.value.viewerHasLikedThisPostOrNot,
              likeCount: result.value.likeCount,
              isToggling: false,
            };
          }
        });
        setLikeStates(newLikes);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleLike(threadId: number) {
    const current = likeStates[threadId] ?? {
      isLiked: false,
      likeCount: 0,
      isToggling: false,
    };
    if (current.isToggling) return;

    setLikeStates((prev) => ({
      ...prev,
      [threadId]: { ...current, isToggling: true },
    }));

    try {
      if (current.isLiked) {
        await ThreadService.unlikeThread(apiClient, threadId);
        setLikeStates((prev) => ({
          ...prev,
          [threadId]: {
            isLiked: false,
            likeCount: Math.max(0, current.likeCount - 1),
            isToggling: false,
          },
        }));
      } else {
        await ThreadService.likeThread(apiClient, threadId);
        setLikeStates((prev) => ({
          ...prev,
          [threadId]: {
            isLiked: true,
            likeCount: current.likeCount + 1,
            isToggling: false,
          },
        }));
      }
    } catch (e) {
      console.log(e);
      setLikeStates((prev) => ({
        ...prev,
        [threadId]: { ...current, isToggling: false },
      }));
    }
  }

  async function handleDeleteThread(threadId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this thread? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setDeletingThreadId(threadId);
      await ThreadService.deleteThread(apiClient, threadId);
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
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

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      {/* Sidebar — Author Filter */}
      <aside className="w-full shrink-0 lg:w-72">
        <Card className="sticky top-24 border-sidebar-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Filter by Author
              </CardTitle>
              <Link href="/threads/new">
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/40"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="@handle"
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applyFilters(authorFilter, search);
                  }
                }}
                className="pl-9 bg-secondary/80 text-sm placeholder:text-muted-foreground"
              />
            </div>
            <Button
              onClick={() => applyFilters(authorFilter, search)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="sm"
            >
              Filter
            </Button>
            {authorFilter && (
              <button
                onClick={() => {
                  setAuthorFilter("");
                  applyFilters("", search);
                }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear filter
              </button>
            )}
          </CardContent>
        </Card>
      </aside>

      {/* Main content */}
      <div className="flex-1 space-y-6">


        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center rounded-lg border border-border bg-card py-10">
              <p className="text-sm text-muted-foreground">Loading Threads...</p>
            </div>
          )}

          {!isLoading && threads.length === 0 && (
            <Card className="border-dashed border-border bg-card">
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  {authorFilter
                    ? `No threads found for @${authorFilter}.`
                    : "No threads found. Create your first thread!"}
                </p>
              </CardContent>
            </Card>
          )}

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
                    <div className="relative h-48 w-full overflow-hidden rounded-t-xl">
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
                            {thread?.author?.handle && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setAuthorFilter(thread.author.handle!);
                                  applyFilters(thread.author.handle!, search);
                                }}
                                className="flex items-center gap-1 rounded-full border border-border/70 bg-secondary/60 px-2 py-0.5 text-muted-foreground/90 transition-colors hover:border-primary/50 hover:text-primary"
                              >
                                <User className="h-3 w-3" />
                                @{thread.author.handle}
                              </button>
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

                          <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary line-clamp-2">
                            {thread.title}
                          </CardTitle>
                        </div>
                      </Link>

                      {/* Three-dot menu for thread owner */}
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
                                {isDeleting ? "Deleting..." : "Delete Thread"}
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
                          variant={
                            likeStates[thread.id]?.isLiked ? "default" : "outline"
                          }
                          disabled={likeStates[thread.id]?.isToggling}
                          onClick={(e) => {
                            e.preventDefault();
                            handleToggleLike(thread.id);
                          }}
                          className={
                            likeStates[thread.id]?.isLiked
                              ? "bg-primary text-primary-foreground hover:bg-primary/95"
                              : "border-border/70 bg-card hover:bg-accent/60"
                          }
                        >
                          <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
                          {likeStates[thread.id]?.isToggling
                            ? "..."
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
    </div>
  );
}

export default ThreadsHomePage;
