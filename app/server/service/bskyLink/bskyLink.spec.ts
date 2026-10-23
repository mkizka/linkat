import { asDid } from "@atproto/did";
import { mock, mockReset } from "vitest-mock-extended";

import type { IBoardRepository } from "~/server/infrastructure/board/boardRepository";
import type { IBskyLinkPdsRepository } from "~/server/infrastructure/bskyLink/bskyLinkPdsRepository";
import type { IFaviconFetcher } from "~/server/infrastructure/favicon/faviconFetcher";

import { BskyLinkSelectionError, bskyLinkServiceFactory } from "./bskyLink";

const boardRepository = mock<IBoardRepository>();
const bskyLinkPdsRepository = mock<IBskyLinkPdsRepository>();
const faviconFetcher = mock<IFaviconFetcher>();
const bskyLinkService = bskyLinkServiceFactory({
  boardRepository,
  bskyLinkPdsRepository,
  faviconFetcher,
});
const icon = Buffer.from([1, 2, 3]);

const did = asDid("did:plc:dummy");

beforeEach(() => {
  mockReset(boardRepository);
  mockReset(bskyLinkPdsRepository);
  mockReset(faviconFetcher);
  faviconFetcher.fetchPng.mockImplementation((url) =>
    Promise.resolve(url === "https://example.com/a" ? icon : null),
  );
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
    test("選んだカードをボードの順にファビコンと合わせて書き出す", async () => {
      // arrange
      const expected = [
        {
          record: expect.objectContaining({
            url: "https://example.com/a",
            title: "A",
          }),
          icon,
        },
        {
          record: expect.objectContaining({ url: "https://example.com/b" }),
          icon: null,
        },
        {
          record: expect.objectContaining({ url: "http://example.com/c" }),
          icon: null,
        },
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
    test.each([
      { name: "URLが無い", card: { text: "A" } },
      {
        name: "タイトルが40書記素を超える",
        card: { url: "https://example.com", text: "あ".repeat(41) },
      },
      {
        name: "タイトルが320バイトを超える",
        card: { url: "https://example.com", text: "👨‍👩‍👧".repeat(18) },
      },
    ])(
      "$nameカードを選んだらファビコンを取らずBskyLinkSelectionErrorを投げる",
      async ({ card }) => {
        // arrange
        boardRepository.find.mockResolvedValue({
          ownerDid: did,
          cards: [card],
        });
        // act
        const actual = bskyLinkService.exportCards(did, [0]);
        // assert
        await expect(actual).rejects.toThrow(BskyLinkSelectionError);
        expect(faviconFetcher.fetchPng).not.toHaveBeenCalled();
      },
    );
    test("11枚以上選んだらBskyLinkSelectionErrorを投げる", async () => {
      // arrange
      boardRepository.find.mockResolvedValue({
        ownerDid: did,
        cards: Array.from({ length: 11 }, () => ({
          url: "https://example.com",
        })),
      });
      // act
      const actual = bskyLinkService.exportCards(
        did,
        Array.from({ length: 11 }, (_, index) => index),
      );
      // assert
      await expect(actual).rejects.toThrow(BskyLinkSelectionError);
      expect(bskyLinkPdsRepository.replace).not.toHaveBeenCalled();
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
