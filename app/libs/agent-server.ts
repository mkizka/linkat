import { Agent } from "@atproto/api";

import { DevNS } from "~/generated/api";
import { boardScheme } from "~/models/board";

export class LinkatOAuthAgent extends Agent {
  dev: DevNS;

  constructor(options: ConstructorParameters<typeof Agent>[0]) {
    super(options);
    this.dev = new DevNS(this);
  }

  async getSessionProfile() {
    return await this.getProfile({ actor: this.assertDid });
  }

  async getBoard(
    params: Omit<Parameters<typeof this.dev.mkizka.test.board.get>[0], "rkey">,
  ) {
    return await this.dev.mkizka.test.board.get({
      ...params,
      rkey: "self",
    });
  }

  async getSessionBoard() {
    return await this.getBoard({ repo: this.assertDid });
  }

  async updateBoard(board: unknown) {
    // dev.mkizka.test.profile.boardにはなぜかputがないので、com.atproto.repoを使う
    return await this.com.atproto.repo.putRecord({
      repo: this.assertDid,
      validate: false,
      collection: "dev.mkizka.test.board",
      rkey: "self",
      record: boardScheme.parse(board),
    });
  }

  async deleteBoard() {
    return await this.dev.mkizka.test.board.delete({
      repo: this.assertDid,
      rkey: "self",
    });
  }
}
