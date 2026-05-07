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

export const waitingQueue: QueueUser[] = [];

export const activeRooms = new Map<
  string,
  string[]
>();
