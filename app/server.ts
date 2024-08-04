import { createRequestHandler } from "@remix-run/express";
import type { ServerBuild } from "@remix-run/node";
import express from "express";

// import { createServer } from "./generated/server/index.js";

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? null
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        }),
      );

const app = express();
app.use(
  viteDevServer ? viteDevServer.middlewares : express.static("build/client"),
);

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
  ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
  : await import("../build/server/index.js");

app.all("*", createRequestHandler({ build: build as ServerBuild }));

// const subscription = new FirehoseSubscription({
//   service: "http://localhost:2583",
// });
// subscription
//   .run({ reconnectDelay: 1000 })
//   // eslint-disable-next-line
//   .catch(console.error);

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`App listening on http://localhost:${port}`);
});
