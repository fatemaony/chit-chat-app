import { createBrowserApiClient } from "@/lib/api-client";
import { ThreadService } from "@/services/thread.service";
import type { Category, ThreadDetail } from "@/types/thread";
import { useAuth } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const NewThreadSchema = z.object({
  title: z.string().trim().min(5, "Title is too short"),
  body: z.string().trim().min(15, "Body is too short"),
  categorySlug: z.string().trim().min(1, "Category is required"),
});

export type NewThreadFormValues = z.infer<typeof NewThreadSchema>;

export function useNewThread() {
  const { getToken } = useAuth();
  const router = useRouter();
  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NewThreadFormValues>({
    resolver: zodResolver(NewThreadSchema),
    defaultValues: { title: "", body: "", categorySlug: "" },
  });

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const extractCats = await ThreadService.getCategories(apiClient);
        if (!isMounted) return;
        setCategories(extractCats);
        if (extractCats.length > 0) {
          form.setValue("categorySlug", extractCats[0]?.slug);
        }
      } catch (e) {
        console.log(e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [apiClient, form]);

  async function onThreadSubmit(values: NewThreadFormValues) {
    try {
      setIsSubmitting(true);
      await ThreadService.createThread(apiClient, values);
      toast.success("New thread created successfully!", {
        description: "Your thread is now live!",
      });
      router.push("/");
    } catch (e) {
      console.log(e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    form,
    categories,
    isLoading,
    isSubmitting,
    onSubmit: form.handleSubmit(onThreadSubmit),
  };
}
