export type ThreadDetail = {
  id: number;
  title: string;
  body: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    displayName: string | null;
    handle: string | null;
  };
};

export type ThreadDetailRow = {
  id: number;
  title: string;
  body: string;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
  author_handle: string | null;
  author_display_name: string | null;
};

export function mapThreadDetailRow(row: ThreadDetailRow): ThreadDetail {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    imageUrl: row.image_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      displayName: row.author_display_name,
      handle: row.author_handle,
    },
  };
}

export type ThreadListFilter = {
  page: number;
  pageSize: number;
  authorHandle?: string;
  search?: string;
  sort: "new" | "old";
};

export type ThreadSummary = {
  id: number;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  createdAt: Date;
  author: {
    displayName: string | null;
    handle: string | null;
  };
};

export type ThreadSummaryRow = {
  id: number;
  title: string;
  excerpt: string;
  image_url: string | null;
  created_at: Date;
  author_display_name: string | null;
  author_handle: string | null;
};

export function mapThreadSummaryRow(row: ThreadSummaryRow): ThreadSummary {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    imageUrl: row.image_url ?? null,
    createdAt: row.created_at,
    author: {
      displayName: row.author_display_name,
      handle: row.author_handle,
    },
  };
}
