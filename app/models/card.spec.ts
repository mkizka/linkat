import { CARD_TEXT_MAX_LENGTH, cardSchema } from "./card";

const successCard = {
  url: "https://example.com",
  text: "text",
  emoji: "😀",
};

const maxLengthText = "a".repeat(CARD_TEXT_MAX_LENGTH);
const tooLongText = "a".repeat(CARD_TEXT_MAX_LENGTH + 1);

describe("cardSchema", () => {
  test.each`
    card                              | expected                          | description
    ${successCard}                    | ${successCard}                    | ${"正しい形式のカードをパースできる"}
    ${{ url: "http://example.com" }}  | ${{ url: "http://example.com" }}  | ${"httpのURLをパースで切る"}
    ${{ url: "https://example.com" }} | ${{ url: "https://example.com" }} | ${"httpsのURLをパースで切る"}
    ${{ url: "" }}                    | ${{ url: "" }}                    | ${"urlは空文字でもパース成功"}
    ${{ text: "" }}                   | ${{ text: "" }}                   | ${"textは空文字でもパース成功"}
    ${{ text: maxLengthText }}        | ${{ text: maxLengthText }}        | ${"textは上限文字数ちょうどならパース成功"}
    ${{ emoji: "" }}                  | ${{ emoji: "" }}                  | ${"emojiは空文字でもパース成功"}
    ${{ emoji: "👍" }}                | ${{ emoji: "👍" }}                | ${"単純な絵文字をパースできる"}
    ${{ emoji: "👨‍👩‍👧‍👦" }}                | ${{ emoji: "👨‍👩‍👧‍👦" }}                | ${"複数コードポイントの絵文字（家族）をパースできる"}
    ${{ emoji: "🏳️‍🌈" }}                | ${{ emoji: "🏳️‍🌈" }}                | ${"複数コードポイントの絵文字（虹色の旗）をパースできる"}
    ${{ emoji: "👨🏿‍💻" }}                | ${{ emoji: "👨🏿‍💻" }}                | ${"肌色修飾子付き絵文字をパースできる"}
  `("$description", ({ card, expected }) => {
    expect(cardSchema.safeParse(card).data).toEqual(expected);
  });
  test.each`
    card                                     | description
    ${{ url: "mailto:example@example.com" }} | ${"http(s)以外のURLはパース失敗"}
    ${{ text: tooLongText }}                 | ${"textが上限文字数を超えるとパース失敗"}
    ${{ emoji: "emoji" }}                    | ${"有効な絵文字以外はパース失敗"}
    ${{ emoji: "foo👍" }}                    | ${"有効な絵文字があっても2文字以上はパース失敗(前)"}
    ${{ emoji: "👍foo" }}                    | ${"有効な絵文字があっても2文字以上はパース失敗(後)"}
    ${{ emoji: "😀😀" }}                     | ${"2文字の絵文字はパース失敗"}
    ${{ emoji: "👍🏻👍🏻" }}                     | ${"2文字の絵文字（肌色修飾子付き）はパース失敗"}
    ${{ emoji: "😀😀😀" }}                   | ${"3文字以上の絵文字はパース失敗"}
    ${[]}                                    | ${"オブジェクトでなければパース失敗"}
  `("$description", ({ card }) => {
    expect(() => cardSchema.parse(card)).toThrow();
  });
});
