import { http, HttpResponse } from "msw";
import { mock, mockReset } from "vitest-mock-extended";

import { server } from "~/mocks/server";
import type { IIcoConverter } from "~/server/infrastructure/favicon/icoConverter";
import { loggerFactory } from "~/server/infrastructure/logger/logger";

import { faviconFetcherFactory } from "./faviconFetcher";

const icoConverter = mock<IIcoConverter>();
const faviconFetcher = faviconFetcherFactory({
  icoConverter,
  logger: loggerFactory(),
});

const faviconUrl = "https://icons.duckduckgo.com/ip3/example.com.ico";
const png = Buffer.from([1, 2, 3]);

beforeEach(() => {
  mockReset(icoConverter);
  icoConverter.toPng.mockResolvedValue(null);
});

describe("faviconFetcher", () => {
  describe("fetchPng", () => {
    test("ICOはPNGに変換して返す", async () => {
      // arrange
      icoConverter.toPng.mockResolvedValue(png);
      server.use(
        http.get(faviconUrl, () =>
          HttpResponse.arrayBuffer(new ArrayBuffer(3), {
            headers: { "content-type": "image/x-icon" },
          }),
        ),
      );
      // act
      const actual = await faviconFetcher.fetchPng("https://example.com/a");
      // assert
      expect(actual).toEqual(png);
    });
    test("PNGはそのまま返す", async () => {
      // arrange
      server.use(
        http.get(faviconUrl, () =>
          HttpResponse.arrayBuffer(new Uint8Array(png).buffer, {
            headers: { "content-type": "image/png" },
          }),
        ),
      );
      // act
      const actual = await faviconFetcher.fetchPng("https://example.com/a");
      // assert
      expect(actual).toEqual(png);
    });
    test.each([
      {
        name: "見つからない",
        response: () => new HttpResponse(null, { status: 404 }),
      },
      {
        name: "画像でない",
        response: () =>
          HttpResponse.text("<html></html>", {
            headers: { "content-type": "text/html" },
          }),
      },
      {
        name: "100KBを超える",
        response: () =>
          HttpResponse.arrayBuffer(new ArrayBuffer(100001), {
            headers: { "content-type": "image/png" },
          }),
      },
    ])("$nameならnullを返す", async ({ response }) => {
      // arrange
      server.use(http.get(faviconUrl, response));
      // act
      const actual = await faviconFetcher.fetchPng("https://example.com/a");
      // assert
      expect(actual).toBeNull();
    });
  });
});
