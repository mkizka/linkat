import { Board, BOARD_CARDS_MAX_LENGTH, BoardParseError } from "./board";

const maxLengthCards = Array.from({ length: BOARD_CARDS_MAX_LENGTH }, () => ({
  url: "https://example.com",
}));
const tooManyCards = Array.from({ length: BOARD_CARDS_MAX_LENGTH + 1 }, () => ({
  url: "https://example.com",
}));

describe("Board.parseCards", () => {
  test.each`
    input                                                                                 | expected                            | description
    ${{ cards: [] }}                                                                      | ${[]}                               | ${"カードが0個"}
    ${{ cards: [{ url: "https://example.com" }] }}                                        | ${[{ url: "https://example.com" }]} | ${"カードが1個"}
    ${{ cards: [{ url: "https://example.com", id: "dummy" }] }}                           | ${[{ url: "https://example.com" }]} | ${"不要なフィールドは削除する"}
    ${{ cards: [{ url: "https://example.com" }, { url: "mailto:example@example.com" }] }} | ${[{ url: "https://example.com" }]} | ${"不正なカードがあればフィルタする"}
    ${{ cards: maxLengthCards }}                                                          | ${maxLengthCards}                   | ${"カードが上限個数ちょうどならパース成功"}
  `("$description", ({ input, expected }) => {
    expect(Board.parseCards(input)).toEqual(expected);
  });
  test.each`
    input                      | description
    ${{}}                      | ${"配列でなければパース失敗"}
    ${{ cards: tooManyCards }} | ${"カードが上限個数を超えるとパース失敗"}
  `("$description", ({ input }) => {
    expect(() => Board.parseCards(input)).toThrow(BoardParseError);
  });
});
