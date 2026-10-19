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
      { text: "テキストだけ" },
      { url: "https://example.com/b" },
      { url: "http://example.com/c", text: "http" },
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
      ];
      // act
      await bskyLinkService.exportCards(did, [2, 0]);
      // assert
      expect(bskyLinkPdsRepository.replace).toHaveBeenCalledWith(did, expected);
    });
    test.each([[[]], [[1]], [[3]], [[0, 5]]])(
      "書き出せないカードを選んだらBskyLinkSelectionErrorを投げる(%j)",
      async (cardIndexes) => {
        // act
        const actual = bskyLinkService.exportCards(did, cardIndexes);
        // assert
        await expect(actual).rejects.toThrow(BskyLinkSelectionError);
        expect(bskyLinkPdsRepository.replace).not.toHaveBeenCalled();
      },
    );
    test("11枚以上選んだらBskyLinkSelectionErrorを投げる", async () => {
      // arrange
      boardRepository.find.mockResolvedValue({
        ownerDid: did,
        cards: Array.from({ length: 11 }, (_, i) => ({
          url: `https://example.com/${i}`,
        })),
      });
      // act
      const actual = bskyLinkService.exportCards(
        did,
        Array.from({ length: 11 }, (_, i) => i),
      );
      // assert
      await expect(actual).rejects.toThrow(BskyLinkSelectionError);
    });
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
