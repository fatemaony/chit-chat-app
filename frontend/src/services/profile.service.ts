import { apiGet, apiPatch } from "@/lib/api-client";
import type { ProfileFormValues, UserResponse } from "@/lib/validations/profile";

export const ProfileService = {
  getProfile: async (apiClient: any): Promise<UserResponse> => {
    return apiGet<UserResponse>(apiClient, "/api/me");
  },

  updateProfile: async (
    apiClient: any,
    payload: Partial<ProfileFormValues>
  ): Promise<UserResponse> => {
    return apiPatch<Partial<ProfileFormValues>, UserResponse>(
      apiClient,
      "/api/me",
      payload
    );
  },
};