import {
  waitingQueue,
} from "../memory/store";

import {
  findCommonInterests,
} from "../utils/helpers";

export const findBestMatch = (
  interests: string[]
) => {
  if (waitingQueue.length === 0) {
    return null;
  }

  let bestMatch = null;

  let bestScore = 0;

  for (const user of waitingQueue) {
    const common = findCommonInterests(
      interests,
      user.interests
    );

    if (common.length > bestScore) {
      bestScore = common.length;
      bestMatch = user;
    }
  }

  // fallback random
  if (!bestMatch) {
    bestMatch = waitingQueue[0];
  }

  return bestMatch;
};
