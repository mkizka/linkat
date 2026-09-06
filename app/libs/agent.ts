import type { AtIdentifierString } from "@atproto/lex";
import { Client } from "@atproto/lex";

import boardLexicon from "~/generated/blue/linkat/board";
import { boardScheme } from "~/models/board";

export class LinkatAgent extends Client {
  static credential(serviceUrl: string = "https://public.api.bsky.app") {
    return new LinkatAgent(serviceUrl);
  }

  async getBoard(params: { repo: string }) {
    return await this.getRecord(boardLexicon.$type, "self", {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      repo: params.repo as AtIdentifierString,
    });
  }

  async getSessionBoard() {
    return await this.getBoard({ repo: this.assertDid });
  }

  async updateBoard(board: unknown) {
    // blue.linkat.profile.boardにはなぜかputがないので、com.atproto.repoを使う
    return await this.putRecord(
      { $type: boardLexicon.$type, ...boardScheme.parse(board) },
      "self",
      { repo: this.assertDid, validate: false },
    );
  }

  async deleteBoard() {
    return await this.deleteRecord(boardLexicon.$type, "self", {
      repo: this.assertDid,
    });
  }
}
