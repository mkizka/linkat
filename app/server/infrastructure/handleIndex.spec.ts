import { UserFactory } from "~/server/factories/user";
import { db } from "~/server/infrastructure/drizzle";

import { handleIndexFactory } from "./handleIndex";

const handleIndex = handleIndexFactory({ db });

describe("handleIndex", () => {
  describe("findDid", () => {
    test("写しに無いhandleはnullを返す", async () => {
      // arrange
      // act
      const actual = await handleIndex.findDid("notfound.example.com");
      // assert
      expect(actual).toBeNull();
    });
    test("handleから写しのDIDを返す", async () => {
      // arrange
      const user = await UserFactory.create({ handle: "example.com" });
      // act
      const actual = await handleIndex.findDid("example.com");
      // assert
      expect(actual).toBe(user.did);
    });
  });
});
