import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import { LRUCache } from "lru-cache";
import satori from "satori";

import type { Owner, OwnerView } from "~/models/owner";
import { di } from "~/server/di";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/$handle.og";

const logger = createLogger("$handle.og");

const cache = new LRUCache<string, Uint8Array<ArrayBuffer>>({
  max: 100,
  ttl: 1000 * 60 * 10,
});

const fontData = fs.readFileSync("./fonts/Murecho-Bold.ttf");

const renderImage = async (owner: OwnerView) => {
  //
  // カード内の割合
  // 100px(padding) + 200px(avatar) + 50px(mariginLeft) + 650px(handle/displayName) + 100px(padding) = 1100px
  //
  const svg = await satori(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#e5e6e6",
        fontFamily: '"Murecho"',
      }}
    >
      <div
        style={{
          display: "flex",
          padding: "100px",
          width: "1100px",
          height: "500px",
          backgroundColor: "#ffffff",
          borderRadius: "1rem",
          // https://tailwindcss.com/docs/box-shadow
          boxShadow:
            "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          {owner.avatarUrl ? (
            <img
              src={owner.avatarUrl}
              style={{
                width: "200px",
                height: "200px",
              }}
            />
          ) : (
            <div
              style={{
                width: "200px",
                height: "200px",
                backgroundColor: "#aaa",
              }}
            />
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: "50px",
              width: "650px",
            }}
          >
            <p
              style={{
                fontSize: "4rem",
                fontWeight: "bold",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {owner.displayName}
            </p>
            <p
              style={{
                fontSize: "3rem",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                overflow: "hidden",
                color: "#6b7280",
                marginTop: "-1rem",
              }}
            >
              {owner.displayHandle}
            </p>
          </div>
        </div>
        <div
          style={{
            fontSize: "3.5rem",
            fontWeight: "bold",
            position: "absolute",
            right: "4rem",
            bottom: "2rem",
          }}
        >
          Linkat
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Murecho",
          data: fontData,
          style: "normal",
        },
      ],
    },
  );
  const resvg = new Resvg(svg);
  const buffer = resvg.render().asPng();
  return Uint8Array.from(buffer);
};

const createImage = async (owner: Owner) => {
  const image = await renderImage(owner.toView());
  cache.set(owner.did, image);
  return image;
};

export async function loader({ params }: Route.LoaderArgs) {
  const owner = await di.ownerService.findOwner({
    handleOrDid: params.handle,
  });
  if (
    !owner ||
    owner.isHidden() ||
    !(await di.boardService.findBoard(owner.did))
  ) {
    throw new Response(null, { status: 404 });
  }
  let image = cache.get(owner.did);
  if (!image) {
    try {
      image = await createImage(owner);
    } catch (error) {
      logger.warn(error, "OGP画像の生成に失敗しました");
      throw new Response(null, { status: 404 });
    }
  }
  return new Response(image, {
    headers: {
      "Content-Type": "image/png",
    },
  });
}
