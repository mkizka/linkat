import markdownit from "markdown-it";
import { describe, expect, it } from "vitest";

import { externalLinkAttributes } from "./markdown";

describe("externalLinkAttributes", () => {
  it("adds security attributes to rendered links", () => {
    const html = markdownit()
      .use(externalLinkAttributes)
      .render("[Linkat](https://linkat.blue)");

    expect(html).toBe(
      '<p><a href="https://linkat.blue" target="_blank" rel="noopener noreferrer">Linkat</a></p>\n',
    );
  });
});
