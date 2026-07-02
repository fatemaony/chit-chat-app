import { createBrowserApiClient } from "@/lib/api-client";
import type { Comment, ThreadDetail } from "@/types/thread";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ThreadService } from "@/services/thread.service";

export function useThreadDetail(id: number) {
  const { getToken, userId } = useAuth();
  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [myHandle, setMyHandle] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [commentBeingDeletedId, setCommentBeingDeletedId] = useState<number | null>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isTogglingLike, setIsTogglingLike] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);

      try {
        const [extractThreadDetails, extractCommentsList] = await Promise.all([
          ThreadService.getThread(apiClient, id),
          ThreadService.getReplies(apiClient, id),
        ]);

        if (!isMounted) return;

        setThread(extractThreadDetails);
        setLikeCount(extractThreadDetails?.likeCount);
        setIsLiked(extractThreadDetails?.viewerHasLikedThisPostOrNot);
        setComments(extractCommentsList);

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
      } catch (e) {
        console.log(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (Number.isFinite(id)) {
      load();
    }

    return () => {
      isMounted = false;
    };
  }, [apiClient, id, userId]);

  async function handleAddComment() {
    const trimmedComment = newComment.trim();
    if (trimmedComment.length < 2) return;

    if (!userId) {
      toast.error("Sign in is needed", {
        description: "Please sign in to add a comment!!!",
      });
      return;
    }

    try {
      setIsPostingComment(true);
      const created = await ThreadService.createReply(apiClient, id, trimmedComment);
      setComments((prev) => [...prev, created]);
      setNewComment("");
      toast.success("Comment added!!!", {
        description: "Your reply has been posted.",
      });
    } catch (e) {
      console.log(e);
    } finally {
      setIsPostingComment(false);
    }
  }

  async function handleDeleteComment(commentId: number) {
    const confirmed = window.confirm("Delete this comment? This can't be undone");
    if (!confirmed) return;

    if (!userId) {
      toast.error("Sign in is needed", {
        description: "Please sign in to add a comment!!!",
      });
      return;
    }

    try {
      setCommentBeingDeletedId(commentId);
      await ThreadService.deleteReply(apiClient, commentId);
      setComments((prev) => prev.filter((cmt) => cmt.id !== commentId));
      toast.success("Comment deleted", {
        description: "This comment has been deleted",
      });
    } catch (e) {
      console.log(e);
    } finally {
      setCommentBeingDeletedId(null);
    }
  }

  async function handleToggleLike() {
    if (!thread) return;

    if (!userId) {
      toast.error("Sign in is needed", {
        description: "Please sign in to add a comment!!!",
      });
      return;
    }

    try {
      setIsTogglingLike(true);

      if (isLiked) {
        await ThreadService.unlikeThread(apiClient, thread.id);
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
        toast.success("Like removed", { description: "Yout upvote has been removed" });
      } else {
        await ThreadService.likeThread(apiClient, thread.id);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
        toast.success("Like added", { description: "Yout upvote has been added" });
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsTogglingLike(false);
    }
  }

  return {
    thread,
    loading,
    myHandle,
    comments,
    newComment,
    setNewComment,
    isPostingComment,
    commentBeingDeletedId,
    isLiked,
    likeCount,
    isTogglingLike,
    userId,
    handleAddComment,
    handleDeleteComment,
    handleToggleLike,
  };
}
