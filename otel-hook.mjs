import { register } from "node:module";

import { createAddHookMessageChannel } from "import-in-the-middle";

const { registerOptions, waitForAllMessagesAcknowledged } =
  createAddHookMessageChannel();
register(
  "@opentelemetry/instrumentation/hook.mjs",
  import.meta.url,
  registerOptions,
);
await import("@opentelemetry/auto-instrumentations-node/register");
await waitForAllMessagesAcknowledged();
