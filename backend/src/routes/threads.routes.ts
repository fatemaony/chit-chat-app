import { Router } from "express";
import {
  createdThread,
  deleteThreadById,
  findThreadAuthor,
  listThreads,
  parseThreadListFilter,
  updateThreadById,
} from "../modules/threads/threads.repository.js";
import { getAuth } from "../config/clerk.js";
import { BadRequestError, UnauthorizedError } from "../lib/errors.js";
import { z } from "zod";
import { getUserFromClerk } from "../modules/users/user.service.js";
import {
  createReply,
  deleteReplyById,
  findReplyAuthor,
  getThreadDetailsWithCounts,
  likeThreadOnce,
  listRepliesForThread,
  removeThreadOnce,
} from "../modules/threads/replies.repository.js";
import {
  createLikeNotification,
  createReplyNotification,
} from "../modules/notifications/notification.service.js";

export const threadsRouter = Router();

const CreatedThreadSchema = z.object({
  title: z.string().trim().min(5).max(200),
  body: z.string().trim().min(10).max(2000),
  imageUrl: z.string().url().nullable().optional(),
});

threadsRouter.post("/threads", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const parsedBody = CreatedThreadSchema.parse(req.body);

    const profile = await getUserFromClerk(auth.userId);

    const newlyCreatedThread = await createdThread({
      authorUserId: profile.user.id,
      title: parsedBody.title,
      body: parsedBody.body,
      imageUrl: parsedBody.imageUrl ?? null,
    });

    res.status(201).json({ data: newlyCreatedThread });
  } catch (e) {
    next(e);
  }
});

threadsRouter.get("/threads/:threadId", async (req, res, next) => {
  try {
    const threadId = Number(req.params.threadId);

    if (!Number.isInteger(threadId) || threadId <= 0) {
      throw new BadRequestError("Invalid thread id");
    }

    const auth = getAuth(req);

    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const profile = await getUserFromClerk(auth.userId);
    const viewerUserId = profile.user.id;

    const thread = await getThreadDetailsWithCounts({
      threadId,
      viewerUserId,
    });
    res.json({ data: thread });
  } catch (err) {
    next(err);
  }
});

threadsRouter.get("/threads", async (req, res, next) => {
  try {
    const filter = parseThreadListFilter({
      page: req.query.page,
      pageSize: req.query.pageSize,
      author: req.query.author,
      q: req.query.q,
      sort: req.query.sort,
    });

    const extractListOfThreads = await listThreads(filter);

    res.json({ data: extractListOfThreads });
  } catch (err) {
    next(err);
  }
});

// replies & likes endpoints

threadsRouter.get("/threads/:threadId/replies", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const threadId = Number(req.params.threadId);
    const replies = await listRepliesForThread(threadId);

    res.json({ data: replies });
  } catch (err) {
    next(err);
  }
});

threadsRouter.post("/threads/:threadId/replies", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const threadId = Number(req.params.threadId);
    if (!Number.isInteger(threadId) || threadId <= 0) {
      throw new BadRequestError("Invalid thread Id");
    }

    const bodyRaw = typeof req.body?.body === "string" ? req.body.body : "";
    if (bodyRaw.trim().length <= 2) {
      throw new BadRequestError("Reply is too short!");
    }

    const profile = await getUserFromClerk(auth.userId);

    const reply = await createReply({
      threadId,
      authorUserId: profile.user.id,
      body: bodyRaw,
    });

    await createReplyNotification({
      threadId,
      actorUserId: profile.user.id,
    });

    res.status(201).json({ data: reply });
  } catch (err) {
    next(err);
  }
});

threadsRouter.delete("/replies/:replyId", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const replyId = Number(req.params.replyId);
    if (!Number.isInteger(replyId) || replyId <= 0) {
      throw new BadRequestError("Invalid replyId");
    }

    const profile = await getUserFromClerk(auth.userId);
    const authorUserId = await findReplyAuthor(replyId);

    if (authorUserId !== profile.user.id) {
      throw new UnauthorizedError("You can only delete your own replies");
    }

    await deleteReplyById(replyId);

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

threadsRouter.post("/threads/:threadId/like", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const threadId = Number(req.params.threadId);
    if (!Number.isInteger(threadId) || threadId <= 0) {
      throw new BadRequestError("Invalid thread Id");
    }

    const profile = await getUserFromClerk(auth.userId);

    await likeThreadOnce({
      threadId,
      userId: profile.user.id,
    });

    await createLikeNotification({
      threadId,
      actorUserId: profile.user.id,
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

threadsRouter.delete("/threads/:threadId/like", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }
    const threadId = Number(req.params.threadId);
    if (!Number.isInteger(threadId) || threadId <= 0) {
      throw new BadRequestError("Invalid thread Id");
    }

    const profile = await getUserFromClerk(auth.userId);

    await removeThreadOnce({
      threadId,
      userId: profile.user.id,
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

threadsRouter.patch("/threads/:threadId", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const threadId = Number(req.params.threadId);
    if (!Number.isInteger(threadId) || threadId <= 0) {
      throw new BadRequestError("Invalid thread id");
    }

    const UpdateThreadSchema = z.object({
      title: z.string().trim().min(5).max(200),
      body: z.string().trim().min(10).max(2000),
      imageUrl: z.string().url().nullable().optional(),
    });

    const parsedBody = UpdateThreadSchema.parse(req.body);

    const profile = await getUserFromClerk(auth.userId);
    const authorUserId = await findThreadAuthor(threadId);

    if (authorUserId !== profile.user.id) {
      throw new UnauthorizedError("You can only edit your own threads");
    }

    const updated = await updateThreadById({
      threadId,
      title: parsedBody.title,
      body: parsedBody.body,
      imageUrl: parsedBody.imageUrl ?? null,
    });

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

threadsRouter.delete("/threads/:threadId", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const threadId = Number(req.params.threadId);
    if (!Number.isInteger(threadId) || threadId <= 0) {
      throw new BadRequestError("Invalid thread id");
    }

    const profile = await getUserFromClerk(auth.userId);
    const authorUserId = await findThreadAuthor(threadId);

    if (authorUserId !== profile.user.id) {
      throw new UnauthorizedError("You can only delete your own threads");
    }

    await deleteThreadById(threadId);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
