import { Agent, CredentialSession } from "@atproto/api";

import boardLexicon from "~/generated/blue/linkat/board";
import { boardScheme } from "~/models/board";

export class LinkatAgent extends Agent {
  static credential(serviceUrl: string = "https://public.api.bsky.app") {
    const session = new CredentialSession(new URL(serviceUrl));
    return new LinkatAgent(session);
  }

  async getSessionProfile() {
    return await this.getProfile({ actor: this.assertDid });
  }

  async getBoard(params: { repo: string }) {
    return await this.com.atproto.repo.getRecord({
      ...params,
      collection: boardLexicon.$type,
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
      collection: boardLexicon.$type,
      rkey: "self",
      record: boardScheme.parse(board),
    });
  }

  async deleteBoard() {
    return await this.com.atproto.repo.deleteRecord({
      repo: this.assertDid,
      collection: boardLexicon.$type,
      rkey: "self",
    });
  }
}
