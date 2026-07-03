import { prisma } from "../../db/db.js";
import { BadRequestError, NotFoundError } from "../../lib/errors.js";
import { getThreadById } from "./threads.repository.js";

export async function listRepliesForThread(threadId: number) {
  if (!Number.isInteger(threadId) || threadId <= 0) {
    throw new BadRequestError("Invalid thread Id");
  }

  const replies = await prisma.reply.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    include: { author: true }
  });

  return replies.map((reply) => ({
    id: reply.id,
    body: reply.body,
    createdAt: reply.createdAt,
    author: {
      displayName: reply.author.displayName,
      handle: reply.author.handle,
    },
  }));
}

export async function createReply(params: {
  threadId: number;
  authorUserId: number;
  body: string;
}) {
  const { body, threadId, authorUserId } = params;

  const reply = await prisma.reply.create({
    data: {
      threadId,
      authorUserId,
      body,
    },
    include: { author: true }
  });

  return {
    id: reply.id,
    body: reply.body,
    createdAt: reply.createdAt,
    author: {
      displayName: reply.author.displayName,
      handle: reply.author.handle,
    },
  };
}

export async function findReplyAuthor(replyId: number) {
  const reply = await prisma.reply.findUnique({
    where: { id: replyId },
    select: { authorUserId: true }
  });

  if (!reply) {
    throw new NotFoundError("Reply not found!!!");
  }

  return reply.authorUserId;
}

export async function deleteReplyById(replyId: number) {
  await prisma.reply.delete({
    where: { id: replyId }
  });
}

export async function likeThreadOnce(params: {
  threadId: number;
  userId: number;
}) {
  const { threadId, userId } = params;

  try {
    await prisma.threadReaction.create({
      data: {
        threadId,
        userId
      }
    });
  } catch (err: any) {
    // Ignore unique constraint violation (P2002) which acts like ON CONFLICT DO NOTHING
    if (err.code !== 'P2002') {
      throw err;
    }
  }
}

export async function removeThreadOnce(params: {
  threadId: number;
  userId: number;
}) {
  const { threadId, userId } = params;

  await prisma.threadReaction.deleteMany({
    where: {
      threadId,
      userId
    }
  });
}

export async function getThreadDetailsWithCounts(params: {
  threadId: number;
  viewerUserId: number | null;
}) {
  const { threadId, viewerUserId } = params;

  const thread = await getThreadById(threadId);

  const likeCount = await prisma.threadReaction.count({
    where: { threadId }
  });

  const replyCount = await prisma.reply.count({
    where: { threadId }
  });

  let viewerHasLikedThisPostOrNot = false;

  if (viewerUserId) {
    const reaction = await prisma.threadReaction.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId: viewerUserId
        }
      }
    });

    if (reaction) {
      viewerHasLikedThisPostOrNot = true;
    }
  }

  return {
    ...thread,
    likeCount,
    replyCount,
    viewerHasLikedThisPostOrNot,
  };
}
