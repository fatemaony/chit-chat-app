import { UserProfile } from "./user.types.js";
import { clerkClient } from "../../config/clerk.js";
import {
  repoUpdateUserProfile,
  upsertUserFromClerkProfile,
} from "./user.repository.js";

async function fetchClerkProfile(clerkUserId: string) {
  const clerkUser = await clerkClient.users.getUser(clerkUserId);

  const getFullName =
    (clerkUser.firstName || "") +
    (clerkUser.lastName ? ` ${clerkUser.lastName}` : "");

  const fullName = getFullName.trim().length > 0 ? getFullName : null;

  const primaryEmail =
    clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    ) ?? clerkUser.emailAddresses[0];

  const email = primaryEmail?.emailAddress ?? null;
  const avatarUrl = clerkUser?.imageUrl || null;
  const firstName = clerkUser?.firstName || "user";

  return {
    fullName,
    email,
    avatarUrl,
    firstName,
  };
}

export async function getUserFromClerk(
  clerkUserId: string
): Promise<UserProfile> {
  const { fullName, email, avatarUrl, firstName } = await fetchClerkProfile(clerkUserId);

  const user = await upsertUserFromClerkProfile({
    clerkUserId,
    displayName: fullName,
    avatarUrl,
    firstName,
  });

  return {
    user,
    clerkEmail: email,
    clerkFullName: fullName,
  };
}

export async function updateUserProfile(params: {
  clerkUserId: string;
  displayName?: string;
  handle?: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<UserProfile> {
  const { clerkUserId, displayName, handle, bio, avatarUrl } = params;

  const updatedUser = await repoUpdateUserProfile({
    clerkUserId,
    displayName,
    bio,
    handle,
    avatarUrl,
  });

  const { fullName, email } = await fetchClerkProfile(clerkUserId);

  return {
    user: updatedUser,
    clerkEmail: email,
    clerkFullName: fullName,
  };
}
