import { atom } from "jotai";

import type { LinkatAgentOptions } from "~/.client/agent";
import { LinkatAgent } from "~/.client/agent";
import { createLogger } from "~/utils/logger";
import { required } from "~/utils/required";

import { userAtom } from "./base";

const updateUserAtom = atom(
  null,
  async (_, set, options: LinkatAgentOptions) => {
    const agent = new LinkatAgent(options);
    const response = await agent.getSessionProfile();
    set(userAtom, {
      profile: response.data,
      session: required(agent.session),
      service: options.service,
    });
  },
);

type LoginOptions = {
  service: string;
  identifier: string;
  password: string;
};

export const loginAtom = atom(
  null,
  async (_, set, { service, ...loginOptions }: LoginOptions) => {
    const agent = new LinkatAgent({ service });
    await agent.login(loginOptions);
    await set(updateUserAtom, {
      service,
      session: agent.session,
    });
  },
);

const logger = createLogger("resumeSessionAtom");

export const resumeSessionAtom = atom(null, async (get, set) => {
  const user = get(userAtom);
  if (!user) {
    logger.debug("保存されたユーザーがありませんでした");
    return;
  }
  const agent = new LinkatAgent(user);
  await agent.resumeSession(user.session);
  await set(updateUserAtom, {
    service: user.service,
    session: agent.session,
  });
});
