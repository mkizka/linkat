import type { AppBskyActorDefs, AtpSessionData } from "@atproto/api";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { LinkatAgent } from "~/.client/agent";
import { createLogger } from "~/utils/logger";
import { required } from "~/utils/required";

import { linkatAgentAtom } from "./agentAtom";

const logger = createLogger("userAtom");

type UserState = {
  user: AppBskyActorDefs.ProfileViewDetailed;
  session: AtpSessionData;
  createdAt: number;
};

const userAtom = atomWithStorage<UserState | null>("user", null, undefined, {
  getOnInit: true,
});

const pdsAtom = atom<string | null>((get) => {
  try {
    // @ts-expect-error
    // eslint-disable-next-line
    return get(userAtom)?.session.didDoc.service[0].serviceEndpoint ?? null;
  } catch {
    return null;
  }
});

const updateUserAtom = atom(null, async (get, set) => {
  const agent = required(get(linkatAgentAtom));
  const response = await agent.getSessionProfile();
  set(userAtom, {
    user: response.data,
    session: required(agent.session),
    createdAt: Date.now(),
  });
});

export const loginAtom = atom(
  null,
  async (
    _,
    set,
    {
      service,
      ...loginOptions
    }: {
      service: string;
      identifier: string;
      password: string;
    },
  ) => {
    const agent = new LinkatAgent({ service });
    await agent.login(loginOptions);
    set(linkatAgentAtom, agent);
    await set(updateUserAtom);
  },
);

const SESSION_EXPIRE_TIME =
  process.env.NODE_ENV === "production"
    ? 1000 * 60 * 60 * 24 * 7 // 1 week
    : 1000;

const getResumableUserAtom = atom((get) => {
  const user = get(userAtom);
  if (!user) {
    logger.debug("userAtomがnullなのでresumeSessionしませんでした");
    return null;
  }
  if (Date.now() - user.createdAt < SESSION_EXPIRE_TIME) {
    logger.debug("セッションが期限内だったのでresumeSessionしませんでした");
    return null;
  }
  const pds = get(pdsAtom);
  if (!pds) {
    logger.debug("PDSが見つからなかったのでresumeSessionしませんでした");
    return null;
  }
  return { session: user.session, pds };
});

export const resumeSessionAtom = atom(null, async (get, set) => {
  const user = get(getResumableUserAtom);
  if (!user) {
    return;
  }
  const linkatAgent = new LinkatAgent({ service: user.pds });
  await linkatAgent.resumeSession(user.session);
  set(linkatAgentAtom, linkatAgent);
  await set(updateUserAtom);
});
