import type { AtpSessionData } from "@atproto/api";
import { AtpAgent } from "@atproto/api";

import { DevNS } from "~/generated/api";
import type { ValidBoard } from "~/models/board";

export type LinkatAgentOptions = {
  service: string;
  session?: AtpSessionData;
};

export class LinkatAgent extends AtpAgent {
  dev: DevNS;

  constructor(options: LinkatAgentOptions) {
    super(options);
    this.dev = new DevNS(this);
    if (options.session) {
      this.sessionManager.session = options.session;
    }
  }

  async getSessionProfile() {
    return await this.getProfile({ actor: this.accountDid });
  }

  async getBoard(
    params: Omit<
      Parameters<typeof this.dev.mkizka.test.profile.board.get>[0],
      "rkey"
    >,
  ) {
    return await this.dev.mkizka.test.profile.board.get({
      ...params,
      rkey: "self",
    });
  }

  async getSessionBoard() {
    return await this.getBoard({ repo: this.accountDid });
  }

  async updateBoard(board: ValidBoard) {
    // dev.mkizka.test.profile.boardにはなぜかputがないので、com.atproto.repoを使う
    return await this.com.atproto.repo.putRecord({
      repo: this.accountDid,
      validate: false,
      collection: "dev.mkizka.test.profile.board",
      rkey: "self",
      record: board,
    });
  }

  async deleteBoard() {
    return await this.dev.mkizka.test.profile.board.delete({
      repo: this.accountDid,
      rkey: "self",
    });
  }
}
