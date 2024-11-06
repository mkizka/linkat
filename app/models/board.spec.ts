import { boardScheme } from "./board";

describe("boardSchema", () => {
  test.each`
    board                                                                                 | expected                                       | description
    ${{ cards: [] }}                                                                      | ${{ cards: [] }}                               | ${"カードが0個"}
    ${{ cards: [{ url: "https://example.com" }] }}                                        | ${{ cards: [{ url: "https://example.com" }] }} | ${"カードが1個"}
    ${{ cards: [{ url: "https://example.com", id: "dummy" }] }}                           | ${{ cards: [{ url: "https://example.com" }] }} | ${"不要なフィールドは削除する"}
    ${{ cards: [{ url: "https://example.com" }, { url: "mailto:example@example.com" }] }} | ${{ cards: [{ url: "https://example.com" }] }} | ${"不正なカードがあればフィルタする"}
  `("$description", ({ board, expected }) => {
    expect(boardScheme.safeParse(board).data).toEqual(expected);
  });
  test.each`
    board | description
    ${{}} | ${"配列でなければパース失敗"}
  `("$description", ({ board, expected }) => {
    expect(() => boardScheme.parse(board)).toThrow();
  });
});
