import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import { LRUCache } from "lru-cache";
import satori from "satori";

import { getInstance } from "~/i18n/i18n";
import { di } from "~/server/di";
import type { OwnerView } from "~/server/service/owner/ownerView";

import type { Route } from "./+types/$handle.og";

const cache = new LRUCache<string, Uint8Array<ArrayBuffer>>({
  max: 100,
  ttl: 1000 * 60 * 10,
});

const fontData = fs.readFileSync("./fonts/Murecho-Bold.ttf");

const cardStyle = {
  display: "flex",
  width: "900px",
  backgroundColor: "#ffffff",
  borderRadius: "28px",
  boxShadow: "0 6px 18px rgb(0 0 0 / 0.06)",
};

const renderImage = async (owner: OwnerView, displayHandle: string) => {
  const svg = await satori(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "70px",
        gap: "22px",
        backgroundColor: "#eceef1",
        color: "#1d232a",
        fontFamily: '"Murecho"',
      }}
    >
      <div
        style={{
          ...cardStyle,
          alignItems: "center",
          gap: "40px",
          padding: "56px 64px",
        }}
      >
        {owner.avatarUrl ? (
          <img
            src={owner.avatarUrl}
            style={{
              width: "160px",
              height: "160px",
              borderRadius: "80px",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "160px",
              height: "160px",
              borderRadius: "80px",
              backgroundColor: "#2a323c",
            }}
          >
            <svg width="92" height="92" viewBox="0 0 24 24" fill="#e9ecef">
              <path d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" />
            </svg>
          </div>
        )}
        <div
          style={{ display: "flex", flexDirection: "column", width: "570px" }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "64px",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {owner.displayName}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "36px",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden",
              color: "#6b7280",
            }}
          >
            {displayHandle}
          </p>
        </div>
      </div>
      <div
        style={{
          ...cardStyle,
          alignItems: "center",
          gap: "24px",
          height: "110px",
          padding: "0 48px",
          borderRadius: "22px",
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1d232a"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
        </svg>
        <div
          style={{
            width: "320px",
            height: "24px",
            borderRadius: "12px",
            backgroundColor: "#e5e7eb",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          right: "48px",
          bottom: "36px",
          fontSize: "40px",
        }}
      >
        Linkat
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

export async function loader({ params, context }: Route.LoaderArgs) {
  const logger = di.logger.child("$handle.og");
  const result = await di.boardService.findBoardView(params.handle);
  if (result.type !== "ok") {
    throw new Response(null, { status: 404 });
  }
  const { owner } = result;
  const i18next = getInstance(context);
  const cacheKey = `${owner.did}:${i18next.language}`;
  let image = cache.get(cacheKey);
  if (!image) {
    try {
      image = await renderImage(
        owner,
        owner.displayHandle ?? i18next.t("owner.invalid-handle"),
      );
      cache.set(cacheKey, image);
    } catch (error) {
      logger.warn("OGP画像の生成に失敗しました", { error });
      throw new Response(null, { status: 404 });
    }
  }
  return new Response(image, {
    headers: {
      "Content-Type": "image/png",
    },
  });
}
