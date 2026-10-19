import { bskyLinkUrlSchema } from "./bskyLink";

describe("bskyLinkUrlSchema", () => {
  test.each([
    { url: "https://example.com", expected: true },
    { url: "http://example.com", expected: false },
    { url: "", expected: false },
    { url: undefined, expected: false },
  ])("$url はBlueskyのリンクにできるか: $expected", ({ url, expected }) => {
    expect(bskyLinkUrlSchema.safeParse(url).success).toBe(expected);
  });
});
