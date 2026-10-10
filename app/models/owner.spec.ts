import { Owner } from "./owner";

const createOwner = (props: Partial<ConstructorParameters<typeof Owner>[0]>) =>
  new Owner({
    did: "did:plc:dummy",
    avatarCid: null,
    description: null,
    displayName: null,
    handle: "example.com",
    active: true,
    status: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...props,
  });

describe("isHidden", () => {
  test.each`
    active   | expected
    ${true}  | ${false}
    ${false} | ${true}
  `(
    "active=$active",
    ({ active, expected }: { active: boolean; expected: boolean }) => {
      expect(createOwner({ active }).isHidden()).toBe(expected);
    },
  );
});
