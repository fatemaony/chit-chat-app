"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useThreadDetail } from "@/hooks/useThreadDetail";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  MessageCircle,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CircularLoader } from "../ui/circular-loader";

interface ThreadDetailProps {
  id: number;
}

export function ThreadDetail({ id }: ThreadDetailProps) {
  const router = useRouter();
  const {
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
    // edit comment
    editingCommentId,
    editingCommentBody,
    setEditingCommentBody,
    isSavingEditedComment,
    startEditingComment,
    cancelEditingComment,
    handleSaveEditedComment,
    // edit thread
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
  } = useThreadDetail(id);

  const [menuOpen, setMenuOpen] = useState(false);
  const [openCommentMenuId, setOpenCommentMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const commentMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (commentMenuRef.current && !commentMenuRef.current.contains(event.target as Node)) {
        setOpenCommentMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close modal on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isEditModalOpen) closeEditModal();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isEditModalOpen, closeEditModal]);

  const isThreadAuthor =
    !!myHandle && !!thread?.author?.handle && myHandle === thread.author.handle;
  const isBusy = isSavingEdit || isUploadingEditImage;

  if (loading) {
    return (
      <CircularLoader label="Loading Thread..." className="px-4 py-10" />
    );
  }

  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-10">
        <p className="text-sm text-muted-foreground">
          Thread not found or has been removed!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">

        <Card className="border-border/70 bg-card overflow-hidden">
          {/* Thread image */}
          {thread.imageUrl && (
            <div className="relative h-60 w-full md:h-80">
              <Image
                src={thread.imageUrl}
                alt={thread.title}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          )}

          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {thread.author.handle && (
                    <span className="font-bold text-muted-foreground">
                      By @{thread.author.handle}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {new Date(thread.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* actions */}
                {isThreadAuthor && (
                  <div className="relative shrink-0" ref={menuRef}>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setMenuOpen((prev) => !prev)}
                      className="h-8 w-8 rounded-full border border-transparent hover:border-border/70 hover:bg-accent/60"
                      aria-label="Thread options"
                      id={`thread-menu-btn-${id}`}
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    {menuOpen && (
                      <div className="absolute right-0 top-9 z-50 min-w-[150px] overflow-hidden rounded-lg border border-border bg-card shadow-lg shadow-black/20 animate-in fade-in slide-in-from-top-2 duration-150">
                        <button
                          id={`thread-edit-btn-${id}`}
                          onClick={() => {
                            setMenuOpen(false);
                            openEditModal();
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/60"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                          Edit Thread
                        </button>

                        <div className="mx-3 border-t border-border/60" />

                        <button
                          id={`thread-delete-btn-${id}`}
                          onClick={() => {
                            setMenuOpen(false);
                            handleDeleteThread();
                          }}
                          disabled={isDeletingThread}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          {isDeletingThread ? "Deleting..." : "Delete Thread"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {thread.title}
              </h1>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {thread.body}
            </p>
          </CardContent>
        </Card>

        <Card id="comments" className="border-border/70 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="w-5 h-5 text-primary" />
              Comments ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {comments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No Comments yet.
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => {
                  const isCommentAuthor =
                    !!comment.author?.handle &&
                    !!myHandle &&
                    comment.author.handle === myHandle;

                  return (
                    <div
                      className="rounded-lg border border-border/80 bg-background/70 p-5"
                      key={comment.id}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          {comment.author.handle && (
                            <span className="text-sm font-medium text-foreground">
                              @{comment.author.handle}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {isCommentAuthor && (
                          <div className="relative shrink-0" ref={openCommentMenuId === comment.id ? commentMenuRef : null}>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setOpenCommentMenuId((prev) => (prev === comment.id ? null : comment.id))}
                              className="h-8 w-8 rounded-full border border-transparent hover:border-border/70 hover:bg-accent/60"
                              aria-label="Comment options"
                            >
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            {openCommentMenuId === comment.id && (
                              <div className="absolute right-0 top-9 z-50 min-w-[150px] overflow-hidden rounded-lg border border-border bg-card shadow-lg shadow-black/20 animate-in fade-in slide-in-from-top-2 duration-150">
                                <button
                                  onClick={() => {
                                    setOpenCommentMenuId(null);
                                    startEditingComment(comment);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/60"
                                >
                                  <Pencil className="h-4 w-4 text-muted-foreground" />
                                  Edit
                                </button>
                                <div className="mx-3 border-t border-border/60" />
                                <button
                                  onClick={() => {
                                    setOpenCommentMenuId(null);
                                    handleDeleteComment(comment.id);
                                  }}
                                  disabled={commentBeingDeletedId === comment.id}
                                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {editingCommentId === comment.id ? (
                        <div className="space-y-3 mt-2">
                          <Textarea
                            value={editingCommentBody}
                            onChange={(e) => setEditingCommentBody(e.target.value)}
                            rows={3}
                            className="border-border bg-background/70 text-sm"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={handleSaveEditedComment}
                              size="sm"
                              disabled={isSavingEditedComment || !editingCommentBody.trim()}
                            >
                              {isSavingEditedComment ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              onClick={cancelEditingComment}
                              size="sm"
                              variant="ghost"
                              disabled={isSavingEditedComment}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                          {comment.body}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* comment form */}
            <div className="space-y-3 border-t border-border pt-6">
              <label className="block text-sm font-semibold text-foreground">
                Add your reply
              </label>
              <Textarea
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                rows={5}
                placeholder="Enter your comment..."
                disabled={!userId || isPostingComment}
                className="border-border bg-background/70 text-sm"
              />
              <Button
                onClick={handleAddComment}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isPostingComment || !newComment.trim() || !userId}
              >
                {isPostingComment ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Edit thread"
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeEditModal}
          />

          {/* panel */}
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl shadow-black/40 animate-in fade-in zoom-in-95 duration-200">
            {/* header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Edit Thread</h2>
              </div>
              <button
                onClick={closeEditModal}
                disabled={isBusy}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* body */}
            <div className="space-y-5 px-6 py-5">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="edit-title">
                  Title
                </label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={isBusy}
                  placeholder="Thread title..."
                  className="border-border bg-background/70 text-sm"
                />
              </div>

              {/* Body */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="edit-body">
                  Description
                </label>
                <Textarea
                  id="edit-body"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  disabled={isBusy}
                  rows={7}
                  placeholder="Thread description..."
                  className="border-border bg-background/70 text-sm resize-none"
                />
              </div>

              {/* Image */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Image{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </label>

                {editImagePreview ? (
                  <div className="relative overflow-hidden rounded-xl border border-border/70">
                    <Image
                      src={editImagePreview}
                      alt="Preview"
                      width={800}
                      height={300}
                      className="max-h-56 w-full object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    <button
                      type="button"
                      onClick={handleEditImageRemove}
                      disabled={isBusy}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-border/70 bg-background/80 backdrop-blur-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    disabled={isBusy}
                    className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border/70 bg-background/30 px-6 py-8 text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/80">
                      <ImagePlus className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium">Click to upload an image</p>
                  </button>
                )}

                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleEditImageSelect}
                  disabled={isBusy}
                />
              </div>
            </div>

            {/* footer */}
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <p className="text-xs text-muted-foreground">
                {isUploadingEditImage
                  ? "Uploading image..."
                  : isSavingEdit
                  ? "Saving changes..."
                  : ""}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={closeEditModal}
                  disabled={isBusy}
                  className="border border-border/70"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isBusy}
                  className="min-w-[110px]"
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isUploadingEditImage ? "Uploading..." : "Saving..."}
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
