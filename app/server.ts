import { createRequestHandler } from "@react-router/express";
import express from "express";
import morgan from "morgan";
import type { ServerBuild } from "react-router";

import { jetstream } from "./server/jetstream/subscription.js";
import { env } from "./utils/env.js";
import { createLogger } from "./utils/logger.js";

// import { createServer } from "./generated/server/index.js";

// OAuthログインを行うためにE2Eテスト実行時のprocess.env.NODE_ENVはdevelopmentになっている
// 代わりにprocess.env.E2Eが設定されているので、その場合はviteを使わない
const viteDevServer =
  process.env.NODE_ENV === "production" || process.env.E2E
    ? null
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        }),
      );

const app = express();

app.use(
  morgan("combined", {
    skip: (req) => {
      return (
        req.get("User-Agent") === "Consul Health Check" ||
        req.hostname === "localhost" ||
        req.ip === "127.0.0.1"
      );
    },
  }),
);

if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  app.use(express.static("build/client"));
}

// 開発環境でのOAuthログイン時 http://127.0.0.1/oauth/callback にリダイレクトされるので、
// そこからさらに http://linkat.localhost にリダイレクトさせる
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "development" && req.hostname === "127.0.0.1") {
    res.redirect(new URL(req.originalUrl, env.PUBLIC_URL).toString());
  } else {
    next();
  }
});

// const server = createServer();
// server.dev.mkizka.sample.sampleMethod(() => {
//   return {
//     encoding: "application/json",
//     body: {
//       foo: "bar",
//     },
//   };
// });
// app.use(server.xrpc.router);

const build = viteDevServer
  ? () =>
      viteDevServer.ssrLoadModule(
        "virtual:react-router/server-build",
      ) as Promise<ServerBuild>
  : // eslint-disable-next-line
    // @ts-ignore: ビルド成果物はあったりなかったりするのでts-expect-errorを使わない
    ((await import("../build/server/index.js")) as ServerBuild);

app.all("*", createRequestHandler({ build }));

const logger = createLogger("server");

app.listen(3000, "0.0.0.0", () => {
  logger.info(`App listening on ${env.PUBLIC_URL}`);
  jetstream.start();
});
