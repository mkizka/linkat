import { Agent } from "@atproto/api";

import { BlueNS } from "~/generated/api";
import { boardScheme } from "~/models/board";

export class LinkatAgent extends Agent {
  blue: BlueNS;

  constructor(options: ConstructorParameters<typeof Agent>[0]) {
    super(options);
    this.blue = new BlueNS(this);
  }

  async getSessionProfile() {
    return await this.getProfile({ actor: this.assertDid });
  }

  async getBoard(
    params: Omit<Parameters<typeof this.blue.linkat.board.get>[0], "rkey">,
  ) {
    return await this.blue.linkat.board.get({
      ...params,
      rkey: "self",
    });
  }

  async getSessionBoard() {
    return await this.getBoard({ repo: this.assertDid });
  }

  async updateBoard(board: unknown) {
    // blue.linkat.profile.boardにはなぜかputがないので、com.atproto.repoを使う
    return await this.com.atproto.repo.putRecord({
      repo: this.assertDid,
      validate: false,
      collection: "blue.linkat.board",
      rkey: "self",
      record: boardScheme.parse(board),
    });
  }

  async deleteBoard() {
    return await this.blue.linkat.board.delete({
      repo: this.assertDid,
      rkey: "self",
    });
  }
}
