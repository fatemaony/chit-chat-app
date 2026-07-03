import { prisma } from "../../db/db.js";
import { User } from "./user.types.js";

async function generateUniqueHandle(baseName: string): Promise<string> {
  const sanitizedBase = baseName.toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
  let currentHandle = sanitizedBase;
  let counter = 1;

  while (true) {
    const existing = await prisma.user.findUnique({
      where: { handle: currentHandle }
    });
    if (!existing) {
      return currentHandle;
    }
    currentHandle = `${sanitizedBase}${counter}`;
    counter++;
  }
}

export async function upsertUserFromClerkProfile(params: {
  clerkUserId: string;
  displayName: string | null;
  avatarUrl: string | null;
  firstName: string;
}): Promise<User> {
  const { clerkUserId, displayName, avatarUrl, firstName } = params;

  let user = await prisma.user.findUnique({ where: { clerkUserId } });

  if (user) {
    user = await prisma.user.update({
      where: { clerkUserId },
      data: {
        displayName,
        avatarUrl,
        updatedAt: new Date()
      }
    });
  } else {
    const handle = await generateUniqueHandle(firstName);
    user = await prisma.user.create({
      data: {
        clerkUserId,
        displayName,
        avatarUrl,
        handle
      }
    });
  }

  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    displayName: user.displayName,
    handle: user.handle,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function repoUpdateUserProfile(params: {
  clerkUserId: string;
  displayName?: string;
  handle?: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<User> {
  const { clerkUserId, displayName, handle, bio, avatarUrl } = params;

  console.log(clerkUserId, displayName, handle, bio, avatarUrl);

  const updateData: any = {};
  if (displayName !== undefined) updateData.displayName = displayName;
  if (handle !== undefined) updateData.handle = handle;
  if (bio !== undefined) updateData.bio = bio;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
  
  updateData.updatedAt = new Date();

  const user = await prisma.user.update({
    where: { clerkUserId },
    data: updateData
  });

  console.log(user);

  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    displayName: user.displayName,
    handle: user.handle,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
