import { cardSchema } from "./card";

const successCard = {
  url: "https://example.com",
  text: "text",
  emoji: "😀",
};

describe("cardSchema", () => {
  test.each`
    card                              | expected                          | description
    ${successCard}                    | ${successCard}                    | ${"正しい形式のカードをパースできる"}
    ${{ url: "http://example.com" }}  | ${{ url: "http://example.com" }}  | ${"httpのURLをパースで切る"}
    ${{ url: "https://example.com" }} | ${{ url: "https://example.com" }} | ${"httpsのURLをパースで切る"}
    ${{ url: "" }}                    | ${{ url: "" }}                    | ${"urlは空文字でもパース成功"}
    ${{ text: "" }}                   | ${{ text: "" }}                   | ${"textは空文字でもパース成功"}
    ${{ emoji: "" }}                  | ${{ emoji: "" }}                  | ${"emojiは空文字でもパース成功"}
  `("$description", ({ card, expected }) => {
    expect(cardSchema.safeParse(card).data).toEqual(expected);
  });
  test.each`
    card                                     | description
    ${{ url: "mailto:example@example.com" }} | ${"http(s)以外のURLはパース失敗"}
    ${{ emoji: "emoji" }}                    | ${"有効な絵文字以外はパース失敗"}
    ${[]}                                    | ${"オブジェクトでなければパース失敗"}
  `("$description", ({ card }) => {
    expect(() => cardSchema.parse(card)).toThrow();
  });
});
