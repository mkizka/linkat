import { User } from "./user";

const createUser = (props: Partial<ConstructorParameters<typeof User>[0]>) =>
  new User({
    did: "did:plc:dummy",
    avatar: null,
    description: null,
    displayName: null,
    handle: "example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...props,
  });

describe("shouldRefetch", () => {
  test.each`
    updatedAt                                | expected | description
    ${new Date()}                            | ${false} | ${"直近に取得済み"}
    ${new Date(Date.now() - 11 * 60 * 1000)} | ${true}  | ${"10分以上経過している"}
  `(
    "$description",
    ({ updatedAt, expected }: { updatedAt: Date; expected: boolean }) => {
      expect(createUser({ updatedAt }).shouldRefetch()).toBe(expected);
    },
  );
});

describe("isOwnedBy", () => {
  test.each`
    did      | viewerDid  | expected | description
    ${"did"} | ${"did"}   | ${true}  | ${"同じDID"}
    ${"did"} | ${"other"} | ${false} | ${"異なるDID"}
    ${"did"} | ${null}    | ${false} | ${"未ログイン"}
  `(
    "$description",
    ({
      did,
      viewerDid,
      expected,
    }: {
      did: string;
      viewerDid: string | null;
      expected: boolean;
    }) => {
      expect(createUser({ did }).isOwnedBy(viewerDid)).toBe(expected);
    },
  );
});
