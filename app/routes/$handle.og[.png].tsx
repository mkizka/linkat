import type { LoaderFunctionArgs } from "@remix-run/node";
import { ImageResponse } from "@vercel/og";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { userService } from "~/server/service/userService";
import { env } from "~/utils/env";
import { required } from "~/utils/required";

// https://github.com/orgs/vercel/discussions/1567#discussioncomment-5854851
const fontData = fs.readFileSync(
  path.join(fileURLToPath(import.meta.url), "../../../public/Murecho-Bold.ttf"),
);

export async function loader({ params }: LoaderFunctionArgs) {
  const user = await userService.findOrFetchUser({
    handleOrDid: required(params.handle),
  });
  if (!user) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw new Response(null, { status: 404 });
  }
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
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
            padding: "4rem",
            width: "90%",
            height: "90%",
            backgroundColor: "#f2f2f2",
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
            {user.avatar ? (
              <img width={300} height={300} src={user.avatar} />
            ) : (
              <div
                style={{
                  width: "250px",
                  height: "250px",
                  backgroundColor: "#aaa",
                }}
              />
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: "4rem",
              }}
            >
              <p
                style={{
                  fontSize: "5rem",
                  fontWeight: "bold",
                }}
              >
                {user.displayName}
              </p>
              <p
                style={{
                  fontSize: "3rem",
                  color: "#6b7280",
                  marginTop: "-1rem",
                }}
              >
                @{user.handle}
              </p>
            </div>
          </div>
          <img
            width={150}
            height={150}
            src={env.PUBLIC_URL + "/icon.png"}
            style={{
              position: "absolute",
              right: "3rem",
              top: "3rem",
            }}
          />
        </div>
      </div>
    ),
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
}
