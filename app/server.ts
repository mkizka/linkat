import { createRequestHandler } from "@remix-run/express";
import type { ServerBuild } from "@remix-run/node";
import express from "express";
import morgan from "morgan";

import { firehose } from "./server/firehose/subscription.js";
import { oauthRouter } from "./server/oauth/route.js";
import { env } from "./utils/env.js";
import { createLogger } from "./utils/logger.js";

// import { createServer } from "./generated/server/index.js";

const isProduction = process.env.NODE_ENV === "production";

const viteDevServer = isProduction
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

app.use(
  viteDevServer ? viteDevServer.middlewares : express.static("build/client"),
);

if (!isProduction) {
  // linkat.localhostでOAuthログインを行うと127.0.0.1/oauth/callbackにリダイレクトされるので、
  // そこからさらにlinkat.localhostにリダイレクトさせる
  app.use((req, res, next) => {
    if (req.hostname === "127.0.0.1") {
      res.redirect(new URL(req.originalUrl, env.PUBLIC_URL).toString());
    } else {
      next();
    }
  });
}

app.use(oauthRouter);

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
        "virtual:remix/server-build",
      ) as Promise<ServerBuild>
  : // eslint-disable-next-line
    // @ts-ignore: ビルド成果物はあったりなかったりするのでts-expect-errorを使わない
    ((await import("../build/server/index.js")) as ServerBuild);

app.all("*", createRequestHandler({ build }));

const logger = createLogger("server");

app.listen(3000, "0.0.0.0", () => {
  logger.info(`App listening on ${env.PUBLIC_URL}`);
  logger.info(`Firehose subscription started to ${env.BSKY_FIREHOSE_URL}`);
  firehose.start();
});
