import { Board, BoardParseError } from "./board";

const dummyUserDid = "did:plc:fuphupq2ha3kk45osfummw42";

describe("Board", () => {
  test.each`
    board                                                                                 | expected                                       | description
    ${{ cards: [] }}                                                                      | ${{ cards: [] }}                               | ${"カードが0個"}
    ${{ cards: [{ url: "https://example.com" }] }}                                        | ${{ cards: [{ url: "https://example.com" }] }} | ${"カードが1個"}
    ${{ cards: [{ url: "https://example.com", id: "dummy" }] }}                           | ${{ cards: [{ url: "https://example.com" }] }} | ${"不要なフィールドは削除する"}
    ${{ cards: [{ url: "https://example.com" }, { url: "mailto:example@example.com" }] }} | ${{ cards: [{ url: "https://example.com" }] }} | ${"不正なカードがあればフィルタする"}
  `("$description", ({ board, expected }) => {
    expect(Board.parse(dummyUserDid, board)).toEqual({
      userDid: dummyUserDid,
      ...expected,
    });
  });
  test.each`
    board | description
    ${{}} | ${"配列でなければパース失敗"}
  `("$description", ({ board, _expected }) => {
    expect(() => Board.parse(dummyUserDid, board)).toThrow(BoardParseError);
  });
});
