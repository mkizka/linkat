import type { AtpAgentLoginOpts, AtpSessionData } from "@atproto/api";
import { BskyAgent } from "@atproto/api";
import { TID } from "@atproto/common-web";

import type {
  AtpServiceClient,
  DevMkizkaTestProfileBoard,
  DevMkizkaTestProfileCard,
} from "~/.client/generated/api";
import { AtpBaseClient } from "~/.client/generated/api";
import type { ValidBoard } from "~/models/board";
import type { ValidCard } from "~/models/card";

export type LinkatAgentOptions = {
  service: string;
  session?: AtpSessionData;
};

export class LinkatAgent {
  readonly client: AtpServiceClient;
  readonly bskyAgent: BskyAgent;

  constructor({ service, session }: LinkatAgentOptions) {
    this.client = new AtpBaseClient().service(service);
    this.bskyAgent = new BskyAgent({
      service,
      persistSession: (_, newSession) => {
        if (newSession) this._updateAccessJwt(newSession);
      },
    });
    if (session) {
      this.bskyAgent.session = session;
      this._updateAccessJwt(session);
    }
  }

  protected _updateAccessJwt(session: AtpSessionData) {
    this.client.setHeader("Authorization", `Bearer ${session.accessJwt}`);
  }

  get dev() {
    return this.client.dev;
  }

  hasSession() {
    return this.bskyAgent.hasSession;
  }

  get session() {
    return this.bskyAgent.session;
  }

  async resumeSession(session: AtpSessionData) {
    return await this.bskyAgent.resumeSession(session);
  }

  async login(options: AtpAgentLoginOpts) {
    return await this.bskyAgent.login(options);
  }

  async getSessionProfile() {
    if (!this.bskyAgent.session) {
      throw new Error("Not logged in");
    }
    return await this.bskyAgent.getProfile({
      actor: this.bskyAgent.session.did,
    });
  }

  async getSessionBoard() {
    if (!this.bskyAgent.session) {
      throw new Error("Not logged in");
    }
    return await this.dev.mkizka.test.profile.board.get({
      repo: this.bskyAgent.session.did,
      rkey: "self",
    });
  }

  async getBoard({ repo }: { repo: string }) {
    return await this.dev.mkizka.test.profile.board.get({
      repo,
      rkey: "self",
    });
  }

  async updateCard(card: ValidCard) {
    if (!this.bskyAgent.session) {
      throw new Error("Not logged in");
    }
    return await this.bskyAgent.com.atproto.repo.putRecord({
      repo: this.bskyAgent.session.did,
      validate: false,
      collection: "dev.mkizka.test.profile.card",
      rkey: TID.next().str,
      record: {
        url: card.url,
        text: card.text,
      } satisfies DevMkizkaTestProfileCard.Record,
    });
  }

  async updateBoard(board: ValidBoard) {
    if (!this.bskyAgent.session) {
      throw new Error("Not logged in");
    }
    // dev.mkizka.test.profile.boardにはなぜかputがないので、com.atproto.repoを使う
    return await this.bskyAgent.com.atproto.repo.putRecord({
      repo: this.bskyAgent.session.did,
      validate: false,
      collection: "dev.mkizka.test.profile.board",
      rkey: "self",
      record: {
        ...board,
        cards: board.cards.map((card) => ({
          cid: "",
          uri: "",
        })),
      } satisfies DevMkizkaTestProfileBoard.Record,
    });
  }

  async deleteBoard() {
    if (!this.bskyAgent.session) {
      throw new Error("Not logged in");
    }
    await this.dev.mkizka.test.profile.board.delete({
      repo: this.bskyAgent.session.did,
      validate: false,
      rkey: "self",
    });
  }
}
