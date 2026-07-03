import { apiGet } from "@/lib/api-client";
import type { Comment, MeResponse, ThreadDetail } from "@/types/thread";
import type { AxiosInstance } from "axios";

export const ThreadService = {
  getThread: (client: AxiosInstance, id: number): Promise<ThreadDetail> =>
    apiGet<ThreadDetail>(client, `/api/threads/threads/${id}`),

  getReplies: (client: AxiosInstance, id: number): Promise<Comment[]> =>
    apiGet<Comment[]>(client, `/api/threads/threads/${id}/replies`),

  getMe: (client: AxiosInstance): Promise<MeResponse> =>
    apiGet<MeResponse>(client, "/api/me"),

  createThread: (
    client: AxiosInstance,
    payload: { title: string; body: string; imageUrl?: string | null }
  ): Promise<ThreadDetail> =>
    client
      .post<{ data: ThreadDetail }>("/api/threads/threads", payload)
      .then((res) => res.data.data),

  createReply: (
    client: AxiosInstance,
    threadId: number,
    body: string
  ): Promise<Comment> =>
    client
      .post<{ data: Comment }>(`/api/threads/threads/${threadId}/replies`, { body })
      .then((res) => res.data.data),

  deleteReply: (client: AxiosInstance, replyId: number): Promise<void> =>
    client.delete(`/api/threads/replies/${replyId}`).then(() => undefined),

  likeThread: (client: AxiosInstance, threadId: number): Promise<void> =>
    client.post(`/api/threads/threads/${threadId}/like`).then(() => undefined),

  unlikeThread: (client: AxiosInstance, threadId: number): Promise<void> =>
    client.delete(`/api/threads/threads/${threadId}/like`).then(() => undefined),

  deleteThread: (client: AxiosInstance, threadId: number): Promise<void> =>
    client.delete(`/api/threads/threads/${threadId}`).then(() => undefined),

  updateThread: (
    client: AxiosInstance,
    threadId: number,
    payload: { title: string; body: string; imageUrl?: string | null }
  ): Promise<ThreadDetail> =>
    client
      .patch<{ data: ThreadDetail }>(`/api/threads/threads/${threadId}`, payload)
      .then((res) => res.data.data),

  uploadImage: (client: AxiosInstance, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    return client
      .post<{ url: string }>("/api/upload/image-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },
};
