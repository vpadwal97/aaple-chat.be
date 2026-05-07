export const generateRoomId = () => {
  return `room-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
};

export const findCommonInterests = (
  a: string[],
  b: string[]
) => {
  return a.filter((item) => b.includes(item));
};
