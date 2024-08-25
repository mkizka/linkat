import { AtpAgent } from "@atproto/api";

import { DevNS } from "~/generated/api";
import { boardScheme } from "~/models/board";

export type LinkatAgentOptions = {
  service: string;
};

export class LinkatAgent extends AtpAgent {
  dev: DevNS;

  constructor(options: LinkatAgentOptions) {
    super(options);
    this.dev = new DevNS(this);
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

  async updateBoard(board: unknown) {
    // dev.mkizka.test.profile.boardにはなぜかputがないので、com.atproto.repoを使う
    return await this.com.atproto.repo.putRecord({
      repo: this.accountDid,
      validate: false,
      collection: "dev.mkizka.test.profile.board",
      rkey: "self",
      record: boardScheme.parse(board),
    });
  }

  async deleteBoard() {
    return await this.dev.mkizka.test.profile.board.delete({
      repo: this.accountDid,
      rkey: "self",
    });
  }
}
