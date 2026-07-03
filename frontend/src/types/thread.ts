export type ThreadSummary = {
  id: number;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  createdAt: string;
  author: {
    displayName: string | null;
    handle: string | null;
  };
};

export type ThreadDetail = {
  id: number;
  title: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    displayName: string | null;
    handle: string | null;
  };

  likeCount: number;
  replyCount: number;
  viewerHasLikedThisPostOrNot: boolean;
};

export type Comment = {
  id: number;
  body: string;
  createdAt: string;
  author: {
    displayName: string | null;
    handle: string | null;
  };
};

export type MeResponse = {
  id: number;
  handle: string | null;
};
