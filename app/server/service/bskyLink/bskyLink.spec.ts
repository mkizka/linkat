import { asDid } from "@atproto/did";
import { mock, mockReset } from "vitest-mock-extended";

import type { IBoardRepository } from "~/server/infrastructure/board/boardRepository";
import type { IBskyLinkPdsRepository } from "~/server/infrastructure/bskyLink/bskyLinkPdsRepository";

import { BskyLinkSelectionError, bskyLinkServiceFactory } from "./bskyLink";

const boardRepository = mock<IBoardRepository>();
const bskyLinkPdsRepository = mock<IBskyLinkPdsRepository>();
const bskyLinkService = bskyLinkServiceFactory({
  boardRepository,
  bskyLinkPdsRepository,
});

const did = asDid("did:plc:dummy");

beforeEach(() => {
  mockReset(boardRepository);
  mockReset(bskyLinkPdsRepository);
  boardRepository.find.mockResolvedValue({
    ownerDid: did,
    cards: [
      { url: "https://example.com/a", text: "A" },
      { url: "https://example.com/b" },
      { url: "http://example.com/c" },
    ],
  });
});

describe("bskyLinkService", () => {
  describe("exportCards", () => {
    test("選んだカードをボードの順に書き出す", async () => {
      // arrange
      const expected = [
        { url: "https://example.com/a", text: "A" },
        { url: "https://example.com/b" },
        { url: "http://example.com/c" },
      ];
      // act
      await bskyLinkService.exportCards(did, [2, 1, 0]);
      // assert
      expect(bskyLinkPdsRepository.replace).toHaveBeenCalledWith(did, expected);
    });
    test.each([[[]], [[0, 5]]])(
      "書き出せないカードを選んだらBskyLinkSelectionErrorを投げる(%j)",
      async (cardIndexes) => {
        // act
        const actual = bskyLinkService.exportCards(did, cardIndexes);
        // assert
        await expect(actual).rejects.toThrow(BskyLinkSelectionError);
        expect(bskyLinkPdsRepository.replace).not.toHaveBeenCalled();
      },
    );
    test("ボードが無ければBskyLinkSelectionErrorを投げる", async () => {
      // arrange
      boardRepository.find.mockResolvedValue(null);
      // act
      const actual = bskyLinkService.exportCards(did, [0]);
      // assert
      await expect(actual).rejects.toThrow(BskyLinkSelectionError);
    });
  });
});
