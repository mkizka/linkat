import { encodeIco } from "icojs";

import { icoConverterFactory } from "./icoConverter";

const icoConverter = icoConverterFactory();

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

describe("icoConverter", () => {
  describe("toPng", () => {
    test("ICOをPNGに変換する", async () => {
      // arrange
      const ico = Buffer.from(await encodeIco([{ buffer: png }]));
      // act
      const actual = await icoConverter.toPng(ico, 100000);
      // assert
      expect(actual?.subarray(0, 8)).toEqual(png.subarray(0, 8));
    });
    test("上限を超える画像しか無ければnullを返す", async () => {
      // arrange
      const ico = Buffer.from(await encodeIco([{ buffer: png }]));
      // act
      const actual = await icoConverter.toPng(ico, 1);
      // assert
      expect(actual).toBeNull();
    });
    test("ICOでなければnullを返す", async () => {
      // arrange
      const bytes = png;
      // act
      const actual = await icoConverter.toPng(bytes, 100000);
      // assert
      expect(actual).toBeNull();
    });
  });
});
