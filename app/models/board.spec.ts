import { Board, BoardParseError } from "./board";

describe("Board.parseCards", () => {
  test.each`
    input                                                                                 | expected                            | description
    ${{ cards: [] }}                                                                      | ${[]}                               | ${"カードが0個"}
    ${{ cards: [{ url: "https://example.com" }] }}                                        | ${[{ url: "https://example.com" }]} | ${"カードが1個"}
    ${{ cards: [{ url: "https://example.com", id: "dummy" }] }}                           | ${[{ url: "https://example.com" }]} | ${"不要なフィールドは削除する"}
    ${{ cards: [{ url: "https://example.com" }, { url: "mailto:example@example.com" }] }} | ${[{ url: "https://example.com" }]} | ${"不正なカードがあればフィルタする"}
  `("$description", ({ input, expected }) => {
    expect(Board.parseCards(input)).toEqual(expected);
  });
  test.each`
    input | description
    ${{}} | ${"配列でなければパース失敗"}
  `("$description", ({ input }) => {
    expect(() => Board.parseCards(input)).toThrow(BoardParseError);
  });
});
