import { asDid } from "@atproto/did";

import { BoardParseError, cardSchema, parseBoardRecord } from "./board";

const ownerDid = asDid("did:plc:dummy");

describe("parseBoardRecord", () => {
  test.each`
    input                                                                                 | expected                            | description
    ${{ cards: [] }}                                                                      | ${[]}                               | ${"カードが0個"}
    ${{ cards: [{ url: "https://example.com" }] }}                                        | ${[{ url: "https://example.com" }]} | ${"カードが1個"}
    ${{ cards: [{ url: "https://example.com", id: "dummy" }] }}                           | ${[{ url: "https://example.com" }]} | ${"不要なフィールドは削除する"}
    ${{ cards: [{ url: "https://example.com" }, { url: "mailto:example@example.com" }] }} | ${[{ url: "https://example.com" }]} | ${"不正なカードがあればフィルタする"}
    ${{ cards: [{ url: "https://example.com" }, { emoji: "😀" }] }}                       | ${[{ url: "https://example.com" }]} | ${"URLもテキストも無いカードはフィルタする"}
  `("$description", ({ input, expected }) => {
    expect(parseBoardRecord(ownerDid, input).cards).toEqual(expected);
  });
  test.each`
    input | description
    ${{}} | ${"配列でなければパース失敗"}
  `("$description", ({ input }) => {
    expect(() => parseBoardRecord(ownerDid, input)).toThrow(BoardParseError);
  });
});

const url = "https://example.com";

describe("cardSchema", () => {
  test.each`
    card                                  | description
    ${{ url, text: "text", emoji: "😀" }} | ${"全て揃ったカード"}
    ${{ url: "http://example.com" }}      | ${"httpのURL"}
    ${{ url }}                            | ${"httpsのURL"}
    ${{ text: "text" }}                   | ${"テキストだけ"}
    ${{ url: "", text: "text" }}          | ${"テキストがあればURLは空文字でもよい"}
    ${{ url, text: "" }}                  | ${"URLがあればテキストは空文字でもよい"}
    ${{ url, emoji: "" }}                 | ${"絵文字は空文字でもよい"}
    ${{ url, emoji: "👍" }}               | ${"単純な絵文字"}
    ${{ url, emoji: "👨‍👩‍👧‍👦" }}               | ${"複数コードポイントの絵文字（家族）"}
    ${{ url, emoji: "🏳️‍🌈" }}               | ${"複数コードポイントの絵文字（虹色の旗）"}
    ${{ url, emoji: "👨🏿‍💻" }}               | ${"肌色修飾子付き絵文字"}
  `("$description", ({ card }) => {
    expect(cardSchema.parse(card)).toEqual(card);
  });
  test.each`
    card                                     | description
    ${{}}                                    | ${"URLもテキストも無い"}
    ${{ url: "", text: "", emoji: "😀" }}    | ${"URLもテキストも空文字"}
    ${{ url: "mailto:example@example.com" }} | ${"http(s)以外のURL"}
    ${{ url, emoji: "emoji" }}               | ${"絵文字でない"}
    ${{ url, emoji: "foo👍" }}               | ${"絵文字の前に文字がある"}
    ${{ url, emoji: "👍foo" }}               | ${"絵文字の後に文字がある"}
    ${{ url, emoji: "😀😀" }}                | ${"絵文字が2文字"}
    ${{ url, emoji: "👍🏻👍🏻" }}                | ${"肌色修飾子付きの絵文字が2文字"}
    ${[]}                                    | ${"オブジェクトでない"}
  `("$description", ({ card }) => {
    expect(() => cardSchema.parse(card)).toThrow();
  });
});
