import {
  waitingQueue,
  recentSkips,
  QueueUser,
} from "../memory/store";

import {
  findCommonInterests,
} from "../utils/helpers";

export const findBestMatch = (
  currentSocketId: string,
  interests: string[]
): QueueUser | null => {
  if (waitingQueue.length === 0) {
    return null;
  }

  let bestMatch: QueueUser | null =
    null;

  let highestScore = -1;

  for (const user of waitingQueue) {
    // =========================
    // DON'T MATCH SELF
    // =========================
    if (
      user.socketId === currentSocketId
    ) {
      continue;
    }

    // =========================
    // SKIP LOOP PREVENTION
    // =========================
    const skippedUsers =
      recentSkips.get(
        currentSocketId
      );

    if (
      skippedUsers?.has(
        user.socketId
      )
    ) {
      continue;
    }

    // =========================
    // INTEREST SCORE
    // =========================
    const commonInterests =
      findCommonInterests(
        interests,
        user.interests
      );

    const score =
      commonInterests.length;

    // =========================
    // BEST MATCH
    // =========================
    if (score > highestScore) {
      highestScore = score;

      bestMatch = user;
    }
  }

  // =========================
  // RANDOM FALLBACK
  // =========================
  if (!bestMatch) {
    for (const user of waitingQueue) {
      if (
        user.socketId !==
        currentSocketId
      ) {
        return user;
      }
    }
  }

  return bestMatch;
};
