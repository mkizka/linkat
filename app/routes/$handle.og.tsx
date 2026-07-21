import type { User } from "@prisma/client";
import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import { LRUCache } from "lru-cache";
import satori from "satori";
import sharp from "sharp";

import { userService } from "~/server/service/userService";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/$handle.og";

const logger = createLogger("$handle.og");

const cache = new LRUCache<string, Uint8Array<ArrayBuffer>>({
  max: 100,
  ttl: 1000 * 60 * 10,
});

const fontData = fs.readFileSync("./fonts/Murecho-Bold.ttf");

// satoriは画像を自前でfetch/デコードするが対応形式が限られる(webp等は非対応)ため、
// 事前にfetchしてsharpでPNGに変換してから渡す
const fetchAvatarAsPngDataUri = async (avatarUrl: string) => {
  const response = await fetch(avatarUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  const png = await sharp(buffer).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
};

const renderImage = async (user: User, avatar: string | null) => {
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
          {avatar ? (
            <img
              src={avatar}
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
              {user.displayName}
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
              @{user.handle}
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

const createImage = async (user: User) => {
  const avatar = user.avatar
    ? await fetchAvatarAsPngDataUri(user.avatar)
    : null;
  const image = await renderImage(user, avatar);
  cache.set(user.did, image);
  return image;
};

export async function loader({ params }: Route.LoaderArgs) {
  const user = await userService.findOrFetchUser({
    handleOrDid: params.handle,
  });
  if (!user) {
    throw new Response(null, { status: 404 });
  }
  let image = cache.get(user.did);
  if (!image) {
    try {
      image = await createImage(user);
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
