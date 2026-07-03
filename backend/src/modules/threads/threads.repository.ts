import { query } from "../../db/db.js";
import { NotFoundError } from "../../lib/errors.js";
import {
  mapThreadDetailRow,
  mapThreadSummaryRow,
  ThreadDetail,
  ThreadDetailRow,
  ThreadListFilter,
  ThreadSummary,
  ThreadSummaryRow,
} from "./threads.types.js";

export function parseThreadListFilter(queryObj: {
  page?: unknown;
  pageSize?: unknown;
  author?: unknown;
  q?: unknown;
  sort?: unknown;
}): ThreadListFilter {
  const page = Number(queryObj.page) || 1;
  const rawPageSize = Number(queryObj.pageSize) || 20;
  const pageSize = Math.min(Math.max(rawPageSize, 1), 50);

  const authorHandle =
    typeof queryObj.author === "string" && queryObj.author.trim()
      ? queryObj.author.trim()
      : undefined;

  const search =
    typeof queryObj.q === "string" && queryObj.q.trim()
      ? queryObj.q.trim()
      : undefined;

  const sort: "new" | "old" = queryObj.sort === "old" ? "old" : "new";

  return {
    page,
    pageSize,
    search,
    sort,
    authorHandle,
  };
}

export async function createdThread(params: {
  authorUserId: number;
  title: string;
  body: string;
  imageUrl?: string | null;
}): Promise<ThreadDetail> {
  const { authorUserId, title, body, imageUrl } = params;

  // category_id is kept as a placeholder (first seeded category) while the
  // column exists in the schema — no migration needed to drop it yet.
  const categoryRes = await query<{ id: number }>(
    `SELECT id FROM categories ORDER BY id ASC LIMIT 1`
  );
  const placeholderCategoryId = categoryRes.rows[0]?.id ?? 1;

  const insertRes = await query<{ id: number }>(
    `
        INSERT INTO threads (category_id, author_user_id, title, body, image_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        `,
    [placeholderCategoryId, authorUserId, title, body, imageUrl ?? null]
  );

  const threadId = insertRes.rows[0].id;

  return getThreadById(threadId);
}

export async function getThreadById(id: number): Promise<ThreadDetail> {
  const result = await query<ThreadDetailRow>(
    `
        SELECT
          t.id,
          t.title,
          t.body,
          t.image_url,
          t.created_at,
          t.updated_at,
          u.display_name AS author_display_name,
          u.handle AS author_handle
        FROM threads t
        JOIN users u ON u.id = t.author_user_id
        WHERE t.id = $1
        LIMIT 1
        `,
    [id]
  );

  const row = result.rows[0];

  if (!row) {
    throw new NotFoundError("Thread not found");
  }

  return mapThreadDetailRow(row);
}

export async function findThreadAuthor(threadId: number): Promise<number> {
  const result = await query<{ author_user_id: number }>(
    `
        SELECT author_user_id
        FROM threads
        WHERE id = $1
        LIMIT 1
        `,
    [threadId]
  );

  const row = result.rows[0];

  if (!row) {
    throw new NotFoundError("Thread not found");
  }

  return row.author_user_id;
}

export async function deleteThreadById(threadId: number): Promise<void> {
  await query(`DELETE FROM thread_reactions WHERE thread_id = $1`, [threadId]);
  await query(`DELETE FROM replies WHERE thread_id = $1`, [threadId]);
  await query(`DELETE FROM threads WHERE id = $1`, [threadId]);
}

export async function updateThreadById(params: {
  threadId: number;
  title: string;
  body: string;
  imageUrl?: string | null;
}): Promise<ThreadDetail> {
  const { threadId, title, body, imageUrl } = params;

  await query(
    `
    UPDATE threads
    SET title = $1,
        body = $2,
        image_url = $3,
        updated_at = NOW()
    WHERE id = $4
    `,
    [title, body, imageUrl ?? null, threadId]
  );

  return getThreadById(threadId);
}

export async function listThreads(
  filter: ThreadListFilter
): Promise<ThreadSummary[]> {
  const { page, pageSize, authorHandle, sort, search } = filter;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (authorHandle) {
    conditions.push(`u.handle ILIKE $${idx++}`);
    params.push(`%${authorHandle}%`);
  }

  if (search) {
    conditions.push(`(t.title ILIKE $${idx} OR t.body ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const orderClause =
    sort === "old" ? "ORDER BY t.created_at ASC" : "ORDER BY t.created_at DESC";

  const offset = (page - 1) * pageSize;

  params.push(pageSize, offset);

  const result = await query<ThreadSummaryRow>(
    `
    SELECT
      t.id,
      t.title,
      LEFT(t.body, 200) AS excerpt,
      t.image_url,
      t.created_at,
      u.display_name AS author_display_name,
      u.handle AS author_handle
    FROM threads t
    JOIN users u ON u.id = t.author_user_id
    ${whereClause}
    ${orderClause}
    LIMIT $${idx++} OFFSET $${idx}
    `,
    params
  );

  return result.rows.map(mapThreadSummaryRow);
}
