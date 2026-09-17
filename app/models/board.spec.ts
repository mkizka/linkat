import { Board, BoardParseError } from "./board";

describe("Board", () => {
  test.each`
    board                                                                                 | expected                                       | description
    ${{ cards: [] }}                                                                      | ${{ cards: [] }}                               | ${"カードが0個"}
    ${{ cards: [{ url: "https://example.com" }] }}                                        | ${{ cards: [{ url: "https://example.com" }] }} | ${"カードが1個"}
    ${{ cards: [{ url: "https://example.com", id: "dummy" }] }}                           | ${{ cards: [{ url: "https://example.com" }] }} | ${"不要なフィールドは削除する"}
    ${{ cards: [{ url: "https://example.com" }, { url: "mailto:example@example.com" }] }} | ${{ cards: [{ url: "https://example.com" }] }} | ${"不正なカードがあればフィルタする"}
  `("$description", ({ board, expected }) => {
    expect(Board.parse(board)).toEqual(expected);
  });
  test.each`
    board | description
    ${{}} | ${"配列でなければパース失敗"}
  `("$description", ({ board, _expected }) => {
    expect(() => Board.parse(board)).toThrow(BoardParseError);
  });
});
