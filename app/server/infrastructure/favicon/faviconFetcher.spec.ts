import { encodeIco } from "icojs";
import { http, HttpResponse } from "msw";

import { server } from "~/mocks/server";

import { faviconFetcherFactory } from "./faviconFetcher";
import { icoConverterFactory } from "./icoConverter";

const faviconFetcher = faviconFetcherFactory({
  icoConverter: icoConverterFactory(),
});

const faviconUrl = "https://icons.duckduckgo.com/ip3/example.com.ico";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
const pngSignature = png.subarray(0, 8);

describe("faviconFetcher", () => {
  describe("fetchPng", () => {
    test("ICOをPNGに変換して返す", async () => {
      // arrange
      const ico = await encodeIco([{ buffer: png }]);
      server.use(
        http.get(faviconUrl, () =>
          HttpResponse.arrayBuffer(ico, {
            headers: { "content-type": "image/x-icon" },
          }),
        ),
      );
      // act
      const actual = await faviconFetcher.fetchPng("https://example.com/a");
      // assert
      expect(actual?.subarray(0, 8)).toEqual(pngSignature);
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
