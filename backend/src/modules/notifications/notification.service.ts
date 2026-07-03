import { prisma } from "../../db/db.js";
import { getIo } from "../../realtime/io.js";
import { Notification } from "./notifications.types.js";

export async function createReplyNotification(params: {
  threadId: number;
  actorUserId: number;
}) {
  const { threadId, actorUserId } = params;

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    select: { authorUserId: true }
  });

  if (!thread) {
    return;
  }

  const authorUserId = thread.authorUserId;
  if (authorUserId === actorUserId) return;

  const noti = await prisma.notification.create({
    data: {
      userId: authorUserId,
      actorUserId,
      threadId,
      type: 'REPLY_ON_THREAD'
    },
    include: {
      actor: true,
      thread: true
    }
  });

  const payload: Notification = {
    id: noti.id,
    type: noti.type as "REPLY_ON_THREAD" | "LIKE_ON_THREAD",
    threadId: noti.threadId,
    createdAt: noti.createdAt.toISOString(),
    readAt: noti.readAt ? noti.readAt.toISOString() : null,
    actor: {
      displayName: noti.actor.displayName,
      handle: noti.actor.handle,
    },
    thread: {
      title: noti.thread.title,
    },
  };

  const io = getIo();
  if (io) {
    io.to(`notifications:user:${authorUserId}`).emit(
      "notification:new",
      payload
    );
  }
}

export async function createLikeNotification(params: {
  threadId: number;
  actorUserId: number;
}) {
  const { threadId, actorUserId } = params;

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    select: { authorUserId: true }
  });

  if (!thread) {
    return;
  }

  const authorUserId = thread.authorUserId;
  if (authorUserId === actorUserId) return;

  const noti = await prisma.notification.create({
    data: {
      userId: authorUserId,
      actorUserId,
      threadId,
      type: 'LIKE_ON_THREAD'
    },
    include: {
      actor: true,
      thread: true
    }
  });

  const payload: Notification = {
    id: noti.id,
    type: noti.type as "REPLY_ON_THREAD" | "LIKE_ON_THREAD",
    threadId: noti.threadId,
    createdAt: noti.createdAt.toISOString(),
    readAt: noti.readAt ? noti.readAt.toISOString() : null,
    actor: {
      displayName: noti.actor.displayName,
      handle: noti.actor.handle,
    },
    thread: {
      title: noti.thread.title,
    },
  };

  const io = getIo();
  if (io) {
    io.to(`notifications:user:${authorUserId}`).emit(
      "notification:new",
      payload
    );
  }
}

export async function listNotificationsForUser(params: {
  userId: number;
  unreadOnly: boolean;
}) {
  try {
    const { unreadOnly, userId } = params;

    const where: any = { userId };
    
    if (unreadOnly) {
      where.readAt = null;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        actor: true,
        thread: true
      }
    });

    return notifications.map((noti) => ({
      id: noti.id,
      type: noti.type as "REPLY_ON_THREAD" | "LIKE_ON_THREAD",
      threadId: noti.threadId,
      createdAt: noti.createdAt.toISOString(),
      readAt: noti.readAt ? noti.readAt.toISOString() : null,
      actor: {
        displayName: noti.actor.displayName,
        handle: noti.actor.handle,
      },
      thread: {
        title: noti.thread.title,
      },
    }));
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
}

export async function markNotificationRead(params: {
  userId: number;
  notificationId: number;
}) {
  const { userId, notificationId } = params;

  // We read first to see if readAt is null
  const noti = await prisma.notification.findUnique({
    where: { id: notificationId }
  });

  if (noti && noti.userId === userId && !noti.readAt) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() }
    });
  }
}

export async function markAllNotificationsRead(params: { userId: number }) {
  const { userId } = params;

  await prisma.notification.updateMany({
    where: { 
      userId,
      readAt: null
    },
    data: {
      readAt: new Date()
    }
  });
}
