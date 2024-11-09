import type { LoaderFunctionArgs } from "@remix-run/node";
import { ImageResponse } from "@vercel/og";
import fs from "fs";
import { z } from "zod";

const fontData = fs.readFileSync("./fonts/Murecho-Bold.ttf");

const schema = z.object({
  handle: z.string(),
  displayName: z.string(),
  avatar: z.string().optional(),
});

export function loader({ request }: LoaderFunctionArgs) {
  const query = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = schema.safeParse(query);
  if (!parsed.success) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw new Response(null, { status: 404 });
  }
  //
  // カード内の割合
  // 100px(padding) + 200px(avatar) + 50px(mariginLeft) + 650px(handle/displayName) + 100px(padding) = 1100px
  //
  return new ImageResponse(
    (
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
            {parsed.data.avatar ? (
              <img
                src={parsed.data.avatar}
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
                {parsed.data.displayName}
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
                @{parsed.data.handle}
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
      </div>
    ),
    {
      width: 1200,
      height: 630,
      // fonts: [
      //   {
      //     name: "Murecho",
      //     data: fontData,
      //     style: "normal",
      //   },
      // ],
    },
  );
}
