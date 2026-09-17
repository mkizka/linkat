export type User = {
  did: string;
  avatar: string | null;
  description: string | null;
  displayName: string | null;
  handle: string;
  createdAt: Date;
  updatedAt: Date;
};

const REFETCH_INTERVAL_MS = 10 * 60 * 1000;

// 最後の取得から10分以上経過していたら再取得する
export const shouldRefetchUser = (user: Pick<User, "updatedAt">) => {
  return user.updatedAt.getTime() <= Date.now() - REFETCH_INTERVAL_MS;
};

export const isOwnedBy = (
  user: Pick<User, "did">,
  viewerDid: string | null,
) => {
  return user.did === viewerDid;
};
