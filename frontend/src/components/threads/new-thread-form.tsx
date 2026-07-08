"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNewThread } from "@/hooks/useNewThread";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";

export function NewThreadForm() {
  const {
    form,
    isSubmitting,
    isUploadingImage,
    imagePreview,
    fileInputRef,
    handleImageSelect,
    handleImageRemove,
    onSubmit,
  } = useNewThread();

  const isBusy = isSubmitting || isUploadingImage;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Start a new thread
        </h1>
        <p className="text-sm text-muted-foreground">
          Share something with the community.
        </p>
      </div>

      <Card className="border-border/70 bg-card">
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground" htmlFor="title">
                Thread Title
              </label>
              <Input
                id="title"
                placeholder="Give your thread a clear title..."
                {...form.register("title")}
                disabled={isBusy}
                className="border-border mt-1 bg-background/70 text-sm"
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground" htmlFor="body">
                Description
              </label>
              <Textarea
                id="body"
                rows={8}
                placeholder="Describe your thread in detail..."
                disabled={isBusy}
                className="border-border mt-1 bg-background/70 text-sm"
                {...form.register("body")}
              />
              {form.formState.errors.body && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.body.message}
                </p>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Image{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </label>

              {imagePreview ? (
                <div className="relative mt-1 overflow-hidden rounded-xl border border-border/70 bg-background/50">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={800}
                    height={400}
                    className="max-h-72 w-full object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={handleImageRemove}
                    disabled={isBusy}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border/70 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                  className="mt-1 flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border/70 bg-background/30 px-6 py-10 text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/80">
                    <ImagePlus className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-sm font-medium">Click to upload an image</p>
                    <p className="text-xs text-muted-foreground/70">
                      PNG, JPG, GIF up to 10 MB
                    </p>
                  </div>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
                disabled={isBusy}
              />
            </div>

            <CardFooter className="flex items-center justify-between border-t border-border px-0 pt-5">
              <p className="text-xs text-muted-foreground">
                {isUploadingImage
                  ? "Uploading image..."
                  : isSubmitting
                  ? "Publishing thread..."
                  : ""}
              </p>
              <Button
                type="submit"
                disabled={isBusy}
                className="min-w-[140px]"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploadingImage ? "Uploading..." : "Publishing..."}
                  </>
                ) : (
                  "Publish Thread"
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
