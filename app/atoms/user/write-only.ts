import type { AtpAgentLoginOpts } from "@atproto/api";
import { atom } from "jotai";

import { linkatAgentAtom } from "~/atoms/agent/base";
import { LinkatAgent } from "~/libs/agent";
import { createLogger } from "~/utils/logger";
import { required } from "~/utils/required";

import { userAtom } from "./base";

const logger = createLogger("userAtom");

const updateUserAtom = atom(null, async (_, set, agent: LinkatAgent) => {
  set(linkatAgentAtom, agent);
  const response = await agent.getSessionProfile();
  set(userAtom, {
    profile: response.data,
    session: required(agent.session),
    service: agent.serviceUrl.toString(),
  });
});

const resetUserAtom = atom(null, (_, set) => {
  set(userAtom, null);
});

type LoginOptions = AtpAgentLoginOpts & {
  service: string;
};

export const loginAtom = atom(
  null,
  async (_, set, { service, ...loginOptions }: LoginOptions) => {
    const agent = new LinkatAgent({ service });
    await agent.login(loginOptions);
    await set(updateUserAtom, agent);
  },
);

export const resumeSessionAtom = atom(null, async (get, set) => {
  const user = get(userAtom);
  if (!user) {
    logger.debug("セッション情報がないため再開をスキップ");
    return;
  }
  const currentAgent = get(linkatAgentAtom);
  if (currentAgent) {
    logger.debug("セッション再開済みなので再開をスキップ");
    return;
  }
  const agent = new LinkatAgent({ service: user.service });
  try {
    await agent.resumeSession(user.session);
    await set(updateUserAtom, agent);
  } catch (e) {
    logger.debug("セッションの再開に失敗しました", { e });
    set(resetUserAtom);
  }
});
