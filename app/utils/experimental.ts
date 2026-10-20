import { createCookie } from "react-router";

const experimentalCookie = createCookie("experimental", {
  httpOnly: true,
  maxAge: 365 * 24 * 60 * 60,
  secure: process.env.NODE_ENV === "production",
});

export const isExperimental = async (request: Request) =>
  (await experimentalCookie.parse(request.headers.get("Cookie"))) === true;

export const serializeExperimental = (enabled: boolean) =>
  experimentalCookie.serialize(enabled);
