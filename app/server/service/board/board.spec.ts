import { asDid } from "@atproto/did";

import { BoardFactory, cardsFromFactory } from "~/server/factories/board";
import { OwnerFactory } from "~/server/factories/owner";
import { boardRepositoryFactory } from "~/server/infrastructure/board/boardRepository";
import { db } from "~/server/infrastructure/db/drizzle";
import { moderationRepositoryFactory } from "~/server/infrastructure/moderation/moderationRepository";
import { handleIndexFactory } from "~/server/infrastructure/owner/handleIndex";
import { ownerRepositoryFactory } from "~/server/infrastructure/owner/ownerRepository";
import { moderationServiceFactory } from "~/server/service/moderation/moderation";
import { ownerViewServiceFactory } from "~/server/service/owner/ownerView";

import { boardServiceFactory } from "./board";

const adminDid = asDid("did:plc:admin");
const moderationRepository = moderationRepositoryFactory({ db });
const boardService = boardServiceFactory({
  boardRepository: boardRepositoryFactory({ db }),
  handleIndex: handleIndexFactory({ db }),
  ownerRepository: ownerRepositoryFactory({ db }),
  ownerViewService: ownerViewServiceFactory(),
  moderationRepository,
  moderationService: moderationServiceFactory({
    moderationRepository,
    adminDids: [adminDid],
  }),
});

describe("boardService", () => {
  describe("findBoard", () => {
    test("既存のボードがある場合はそのまま返す", async () => {
      // arrange
      const existing = await BoardFactory.create();
      // act
      const actual = await boardService.findBoard(asDid(existing.ownerDid));
      // assert
      expect(actual).toEqual({
        ownerDid: asDid(existing.ownerDid),
        cards: cardsFromFactory,
      });
    });
    test("DBにボードが無ければnullを返す", async () => {
      // arrange
      const owner = await OwnerFactory.create();
      // act
      const actual = await boardService.findBoard(asDid(owner.did));
      // assert
      expect(actual).toBeNull();
    });
  });

  describe("findBoardView", () => {
    test("持ち主とボードの写しがあればokを返す", async () => {
      // arrange
      const owner = await OwnerFactory.create({ handle: "example.com" });
      await BoardFactory.create({ ownerDid: owner.did });
      // act
      const actual = await boardService.findBoardView("example.com");
      // assert
      expect(actual).toEqual({
        type: "ok",
        owner: expect.objectContaining({ did: owner.did }),
        board: { ownerDid: asDid(owner.did), cards: cardsFromFactory },
      });
    });
    test("写しに無いDIDでもボードがあればokを返す", async () => {
      // arrange
      const did = asDid("did:plc:nocopy");
      await BoardFactory.create({ ownerDid: did });
      // act
      const actual = await boardService.findBoardView(did);
      // assert
      expect(actual).toEqual({
        type: "ok",
        owner: expect.objectContaining({ did, handleOrDid: did }),
        board: { ownerDid: did, cards: cardsFromFactory },
      });
    });
    test("写しに無いハンドルはnot-foundを返す", async () => {
      // arrange
      await BoardFactory.create();
      // act
      const actual = await boardService.findBoardView("unknown.example.com");
      // assert
      expect(actual).toEqual({ type: "not-found" });
    });
    test("持ち主が非表示ならhiddenとstatusを返す", async () => {
      // arrange
      const owner = await OwnerFactory.create({
        active: false,
        status: "takendown",
      });
      await BoardFactory.create({ ownerDid: owner.did });
      // act
      const actual = await boardService.findBoardView(owner.did);
      // assert
      expect(actual).toEqual({ type: "hidden", status: "takendown" });
    });
    test("持ち主が非表示ならボードの写しが無くてもhiddenとstatusを返す", async () => {
      // arrange
      const owner = await OwnerFactory.create({
        active: false,
        status: "deactivated",
      });
      // act
      const actual = await boardService.findBoardView(owner.did);
      // assert
      expect(actual).toEqual({ type: "hidden", status: "deactivated" });
    });
    test("ボードの写しが無ければnot-foundを返す", async () => {
      // arrange
      const owner = await OwnerFactory.create();
      // act
      const actual = await boardService.findBoardView(owner.did);
      // assert
      expect(actual).toEqual({ type: "not-found" });
    });
    test("管理者が非表示にしたボードは管理者以外にはhiddenを返す", async () => {
      // arrange
      const owner = await OwnerFactory.create();
      await BoardFactory.create({ ownerDid: owner.did });
      await moderationRepository.save(asDid(owner.did), "hidden");
      // act
      const actual = await boardService.findBoardView(
        owner.did,
        asDid(owner.did),
      );
      // assert
      expect(actual).toEqual({ type: "hidden", status: null });
    });
    test("管理者が非表示にしたボードも管理者にはokと非表示レベルを返す", async () => {
      // arrange
      const owner = await OwnerFactory.create();
      await BoardFactory.create({ ownerDid: owner.did });
      await moderationRepository.save(asDid(owner.did), "hidden");
      // act
      const actual = await boardService.findBoardView(owner.did, adminDid);
      // assert
      expect(actual).toEqual(
        expect.objectContaining({
          type: "ok",
          admin: { moderationLevel: "hidden" },
        }),
      );
    });
    test("一覧から除外したボードは管理者以外にもadminを含めずにokを返す", async () => {
      // arrange
      const owner = await OwnerFactory.create();
      await BoardFactory.create({ ownerDid: owner.did });
      await moderationRepository.save(asDid(owner.did), "unlisted");
      // act
      const actual = await boardService.findBoardView(owner.did);
      // assert
      expect(actual).toEqual(expect.objectContaining({ type: "ok" }));
      expect(actual).not.toHaveProperty("admin");
    });
  });
});
