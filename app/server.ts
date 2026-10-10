import { createRequestHandler } from "@react-router/express";
import express from "express";
import type { ServerBuild } from "react-router";

import { di } from "~/server/di.js";
import { httpLogger } from "~/server/infrastructure/logger/logger.js";

import { env } from "./utils/env.js";

// OAuthログインを行うためにmedium/largeテスト実行時のprocess.env.NODE_ENVはdevelopmentになっている
// 代わりにprocess.env.PLAYWRIGHTが設定されているので、その場合はviteを使わない
const viteDevServer =
  env.NODE_ENV === "production" || process.env.PLAYWRIGHT
    ? null
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        }),
      );

const logger = di.logger.child("server");

const app = express();
// RailwayのエッジでTLS終端されるため、X-Forwarded-Protoを信頼しないとreq.protocolが常にhttpになり、
// react-routerのCSRFチェック(Origin: httpsとrequest.url: httpの不一致)でログインが400になる
app.set("trust proxy", true);

app.use(httpLogger);

if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  app.use(
    express.static("build/client", {
      setHeaders: (res) => {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      },
    }),
  );
}

// 開発環境でのOAuthログイン時 http://127.0.0.1/oauth/callback にリダイレクトされるので、
// そこからさらに env.PUBLIC_URL (開発環境: http://localhost:3000) にリダイレクトさせる
app.use((req, res, next) => {
  if (env.NODE_ENV === "development" && req.hostname === "127.0.0.1") {
    res.redirect(new URL(req.originalUrl, env.PUBLIC_URL).toString());
  } else {
    next();
  }
});

const build = viteDevServer
  ? () =>
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      viteDevServer.ssrLoadModule(
        "virtual:react-router/server-build",
      ) as Promise<ServerBuild>
  : // eslint-disable-next-line
    // @ts-ignore: ビルド成果物はあったりなかったりするのでts-expect-errorを使わない
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    ((await import("../build/server/index.js")) as ServerBuild);

app.use(createRequestHandler({ build }));

app.listen(env.PORT, "0.0.0.0", () => {
  logger.info(`App listening on ${env.PUBLIC_URL}`);
  if (!env.DISABLE_JETSTREAM) {
    di.ingesterClient.start(di.ingesterService).catch((error: unknown) => {
      logger.error("Ingesterの起動に失敗しました", { error });
    });
  }
});
