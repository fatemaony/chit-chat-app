import { createBrowserApiClient } from "@/lib/api-client";
import { ThreadService } from "@/services/thread.service";
import type { ThreadDetail } from "@/types/thread";
import { useAuth } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const NewThreadSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters"),
  body: z.string().trim().min(15, "Description must be at least 15 characters"),
});

export type NewThreadFormValues = z.infer<typeof NewThreadSchema>;

export function useNewThread() {
  const { getToken } = useAuth();
  const router = useRouter();
  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<NewThreadFormValues>({
    resolver: zodResolver(NewThreadSchema),
    defaultValues: { title: "", body: "" },
  });

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type", { description: "Please select an image file." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", { description: "Image must be under 10 MB." });
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleImageRemove() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onThreadSubmit(values: NewThreadFormValues) {
    try {
      setIsSubmitting(true);

      let uploadedImageUrl: string | null = null;

      if (imageFile) {
        setIsUploadingImage(true);
        try {
          const result = await ThreadService.uploadImage(apiClient, imageFile);
          uploadedImageUrl = result.url;
        } catch {
          toast.error("Image upload failed", {
            description: "Could not upload the image. Please try again.",
          });
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      await ThreadService.createThread(apiClient, {
        title: values.title,
        body: values.body,
        imageUrl: uploadedImageUrl,
      });

      toast.success("Thread created!", { description: "Your thread is now live!" });
      router.push("/");
    } catch (e) {
      console.log(e);
      toast.error("Failed to create thread", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    form,
    isSubmitting,
    isUploadingImage,
    imagePreview,
    fileInputRef,
    handleImageSelect,
    handleImageRemove,
    onSubmit: form.handleSubmit(onThreadSubmit),
  };
}
