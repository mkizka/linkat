import { asDid } from "@atproto/did";
import { mock, mockReset } from "vitest-mock-extended";

import type { IBskyLinkPdsRepository } from "~/server/infrastructure/bskyLink/bskyLinkPdsRepository";
import type { IFaviconFetcher } from "~/server/infrastructure/favicon/faviconFetcher";

import { BskyLinkSelectionError, bskyLinkServiceFactory } from "./bskyLink";

const bskyLinkPdsRepository = mock<IBskyLinkPdsRepository>();
const faviconFetcher = mock<IFaviconFetcher>();
const bskyLinkService = bskyLinkServiceFactory({
  bskyLinkPdsRepository,
  faviconFetcher,
});
const icon = Buffer.from([1, 2, 3]);

const did = asDid("did:plc:dummy");

beforeEach(() => {
  mockReset(bskyLinkPdsRepository);
  mockReset(faviconFetcher);
  faviconFetcher.fetchPng.mockImplementation((url) =>
    Promise.resolve(url === "https://example.com/a" ? icon : null),
  );
});

describe("bskyLinkService", () => {
  describe("exportCards", () => {
    test("選んだカードを順にファビコンと合わせて書き出す", async () => {
      // arrange
      const cards = [
        { url: "https://example.com/a", text: "A" },
        { url: "https://example.com/b", text: "" },
      ];
      const expected = [
        { url: "https://example.com/a", title: "A", icon },
        { url: "https://example.com/b", icon: null },
      ];
      // act
      await bskyLinkService.exportCards(did, cards);
      // assert
      expect(bskyLinkPdsRepository.replace).toHaveBeenCalledWith(did, expected);
    });
    test.each([
      { name: "カードが無い", cards: [] },
      { name: "URLが無いカードがある", cards: [{ url: "", text: "A" }] },
      {
        name: "11枚以上",
        cards: Array.from({ length: 11 }, () => ({
          url: "https://example.com/a",
        })),
      },
    ])(
      "$nameときはファビコンを取らずBskyLinkSelectionErrorを投げる",
      async ({ cards }) => {
        // act
        const actual = bskyLinkService.exportCards(did, cards);
        // assert
        await expect(actual).rejects.toThrow(BskyLinkSelectionError);
        expect(faviconFetcher.fetchPng).not.toHaveBeenCalled();
        expect(bskyLinkPdsRepository.replace).not.toHaveBeenCalled();
      },
    );
  });
});
