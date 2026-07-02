import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { createBrowserApiClient } from "@/lib/api-client";
import { ProfileSchema, type ProfileFormValues } from "@/lib/validations/profile";
import { ProfileService } from "@/services/profile.service";

export function useProfileForm() {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      displayName: "",
      handle: "",
      bio: "",
      avatarUrl: "",
    },
  });

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ProfileService.getProfile(apiClient);

      form.reset({
        displayName: data.displayName ?? "",
        handle: data.handle ?? "",
        bio: data.bio ?? "",
        avatarUrl: data.avatarUrl ?? "",
      });
    } catch (error) {
      console.error("Failed to load profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, form.reset]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setIsSaving(true);

      const payload: Partial<ProfileFormValues> = {};
      if (values.displayName) payload.displayName = values.displayName;
      if (values.handle) payload.handle = values.handle.toLowerCase();
      if (values.bio) payload.bio = values.bio;
      if (values.avatarUrl) payload.avatarUrl = values.avatarUrl;

      const data = await ProfileService.updateProfile(apiClient, payload);

      form.reset({
        displayName: data.displayName ?? "",
        handle: data.handle ?? "",
        bio: data.bio ?? "",
        avatarUrl: data.avatarUrl ?? "",
      });

      toast.success("Profile updated", {
        description: "Your changes have been saved successfully!",
      });
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    form,
    isLoading,
    isSaving,
    onSubmit: form.handleSubmit(onSubmit),
    watchValues: {
      displayName: form.watch("displayName"),
      handle: form.watch("handle"),
      avatarUrl: form.watch("avatarUrl"),
    },
  };
}