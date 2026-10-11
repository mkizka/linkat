import { formatRelativeTime } from "./relativeTime";

const now = new Date("2026-10-11T12:00:00Z");
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

describe("formatRelativeTime", () => {
  test.each([
    [10, "ja", "今"],
    [3 * 60 * 60, "ja", "3 時間前"],
    [24 * 60 * 60, "ja", "昨日"],
    [3 * 24 * 60 * 60, "ja", "3 日前"],
    [14 * 24 * 60 * 60, "ja", "2 週間前"],
    [30 * 24 * 60 * 60, "ja", "先月"],
    [3 * 60 * 60, "en", "3 hours ago"],
    [24 * 60 * 60, "en", "yesterday"],
  ])("%i秒前は%sで「%s」になる", (seconds, locale, expected) => {
    // act
    const actual = formatRelativeTime(ago(seconds), locale, now);
    // assert
    expect(actual).toBe(expected);
  });
});
