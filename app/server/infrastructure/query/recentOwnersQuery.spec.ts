import { asDid } from "@atproto/did";

import { BoardFactory } from "~/server/factories/board";
import { OwnerFactory } from "~/server/factories/owner";
import { db } from "~/server/infrastructure/db/drizzle";

import { recentOwnersQueryFactory } from "./recentOwnersQuery";

const recentOwnersQuery = recentOwnersQueryFactory({ db });

describe("recentOwnersQuery", () => {
  describe("find", () => {
    test("非表示でない持ち主を、ボードの更新日時が新しい順に件数分返す", async () => {
      // arrange
      await BoardFactory.create({ updatedAt: new Date(2000, 0, 1) });
      const newest = await BoardFactory.create({
        updatedAt: new Date(2000, 0, 3),
      });
      const empty = await BoardFactory.create({
        record: JSON.stringify({ cards: [] }),
        updatedAt: new Date(2000, 0, 4),
      });
      const hiddenOwner = await OwnerFactory.create({ active: false });
      await BoardFactory.create({
        ownerDid: hiddenOwner.did,
        updatedAt: new Date(2000, 0, 5),
      });
      const withoutOwner = await BoardFactory.create({
        ownerDid: "did:plc:without-owner",
        updatedAt: new Date(2000, 0, 2),
      });
      // act
      const actual = await recentOwnersQuery.find(3);
      // assert
      expect(actual.map(({ ownerDid }) => ownerDid)).toEqual([
        empty.ownerDid,
        newest.ownerDid,
        withoutOwner.ownerDid,
      ]);
      expect(actual[2]?.owner).toBeNull();
    });
    test("除外したDIDの持ち主は返さない", async () => {
      // arrange
      const excluded = await BoardFactory.create({
        updatedAt: new Date(2000, 0, 2),
      });
      const other = await BoardFactory.create({
        updatedAt: new Date(2000, 0, 1),
      });
      // act
      const actual = await recentOwnersQuery.find(2, asDid(excluded.ownerDid));
      // assert
      expect(actual.map(({ ownerDid }) => ownerDid)).toEqual([other.ownerDid]);
    });
  });
});
