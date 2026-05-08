export interface OnlineUser {
  username: string;
  interests: string[];
}

export interface QueueUser {
  socketId: string;
  username: string;
  interests: string[];
}

export const onlineUsers = new Map<
  string,
  OnlineUser
>();

// waiting users
export const waitingQueue: QueueUser[] = [];

// active rooms
export const activeRooms = new Map<
  string,
  string[]
>();

// skip memory
// socketId -> skipped socketIds
export const recentSkips = new Map<
  string,
  Set<string>
>();
