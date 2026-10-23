import { parseOAuthState } from "./oauthClient";

describe("parseOAuthState", () => {
  test("JSONの値を戻せる", () => {
    // arrange
    const state = { redirect: "/edit", from: "/login" };
    // act
    const actual = parseOAuthState(JSON.stringify(state));
    // assert
    expect(actual).toEqual(state);
  });
  test.each([null, "", "not json", "[]", '{"redirect":1}'])(
    "%sなら空の値を返す",
    (state) => {
      // act
      const actual = parseOAuthState(state);
      // assert
      expect(actual).toEqual({});
    },
  );
});
