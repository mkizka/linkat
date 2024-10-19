/* eslint-disable no-console */
import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";

const logger = createLogger("jetstream");

export const jetstream = new Jetstream({
  ws: WebSocket,
  endpoint: env.JETSTREAM_URL,
  wantedCollections: ["blue.linkat.board"],
});

jetstream.on("open", () => {
  logger.info(`Jetstream subscription started to ${env.JETSTREAM_URL}`);
});

jetstream.on("close", () => {
  logger.info(`Jetstream subscription closed`);
});

jetstream.on("error", (error) => {
  logger.error("Jetstreamでエラーが発生しました", {
    error: String(error),
  });
});

jetstream.onCreate("blue.linkat.board", (event) => {
  console.log("create", JSON.stringify(event));
});

jetstream.onUpdate("blue.linkat.board", (event) => {
  console.log("update", JSON.stringify(event));
});

jetstream.onDelete("blue.linkat.board", (event) => {
  console.log("delete", JSON.stringify(event));
});
