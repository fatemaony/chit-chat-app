import { createBrowserApiClient } from "@/lib/api-client";
import type { Comment, ThreadDetail } from "@/types/thread";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ThreadService } from "@/services/thread.service";
import { useRouter, useSearchParams } from "next/navigation";

export function useThreadDetail(id: number) {
  const { getToken, userId } = useAuth();
  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [myHandle, setMyHandle] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [commentBeingDeletedId, setCommentBeingDeletedId] = useState<number | null>(null);

  const [isDeletingThread, setIsDeletingThread] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-open edit modal when ?edit=true is present in the URL (e.g. from home page)
  useEffect(() => {
    if (searchParams.get("edit") === "true" && thread && !isEditModalOpen) {
      openEditModal();
      // Remove the query param cleanly without a full navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("edit");
      window.history.replaceState(null, "", url.toString());
    }
  // openEditModal is stable (defined outside render loop), thread triggers when loaded
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread, searchParams]);

  // ── Edit helpers ──────────────────────────────────────────────────────────

  function openEditModal() {
    if (!thread) return;
    setEditTitle(thread.title);
    setEditBody(thread.body);
    setEditImageUrl(thread.imageUrl ?? null);
    setEditImagePreview(thread.imageUrl ?? null);
    setEditImageFile(null);
    setIsEditModalOpen(true);
  }

  function closeEditModal() {
    setIsEditModalOpen(false);
    setEditImageFile(null);
    setEditImagePreview(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  }

  function handleEditImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file", { description: "Please select an image file." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", { description: "Image must be under 10 MB." });
      return;
    }
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  }

  function handleEditImageRemove() {
    setEditImageFile(null);
    setEditImagePreview(null);
    setEditImageUrl(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  }

  async function handleSaveEdit() {
    if (!thread) return;

    const trimmedTitle = editTitle.trim();
    const trimmedBody = editBody.trim();

    if (trimmedTitle.length < 5) {
      toast.error("Title too short", { description: "Title must be at least 5 characters." });
      return;
    }
    if (trimmedBody.length < 10) {
      toast.error("Description too short", { description: "Description must be at least 10 characters." });
      return;
    }

    try {
      setIsSavingEdit(true);

      let finalImageUrl: string | null = editImageUrl;

      // Upload new image if one was selected
      if (editImageFile) {
        setIsUploadingEditImage(true);
        try {
          const result = await ThreadService.uploadImage(apiClient, editImageFile);
          finalImageUrl = result.url;
        } catch {
          toast.error("Image upload failed", {
            description: "Could not upload the image. Please try again.",
          });
          return;
        } finally {
          setIsUploadingEditImage(false);
        }
      }

      const updated = await ThreadService.updateThread(apiClient, thread.id, {
        title: trimmedTitle,
        body: trimmedBody,
        imageUrl: finalImageUrl,
      });

      setThread(updated);
      closeEditModal();
      toast.success("Thread updated!", { description: "Your changes have been saved." });
    } catch (e) {
      console.log(e);
      toast.error("Failed to update thread", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSavingEdit(false);
      setIsUploadingEditImage(false);
    }
  }

  // ── Comment handlers ──────────────────────────────────────────────────────

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

  async function handleDeleteThread() {
    if (!thread) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this thread? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setIsDeletingThread(true);
      await ThreadService.deleteThread(apiClient, thread.id);
      toast.success("Thread deleted", {
        description: "Your thread has been deleted.",
      });
      router.push("/");
    } catch (e) {
      console.log(e);
      toast.error("Failed to delete thread", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsDeletingThread(false);
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
    isDeletingThread,
    userId,
    handleAddComment,
    handleDeleteComment,
    handleDeleteThread,
    // edit
    isEditModalOpen,
    editTitle,
    setEditTitle,
    editBody,
    setEditBody,
    editImagePreview,
    editFileInputRef,
    isUploadingEditImage,
    isSavingEdit,
    openEditModal,
    closeEditModal,
    handleEditImageSelect,
    handleEditImageRemove,
    handleSaveEdit,
  };
}
