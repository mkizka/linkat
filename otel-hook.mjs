import { register } from "node:module";

register("@opentelemetry/instrumentation/hook.mjs", import.meta.url, {
  data: { exclude: [/\/@atproto\/lex[-/]/] },
});
