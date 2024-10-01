import express from "express";

import { oauthClient } from "./client";

const router = express.Router();

router.get("/client-metadata.json", (_req, res) => {
  return res.json(oauthClient.clientMetadata);
});

router.get("/jwks.json", (_req, res) => {
  return res.json(oauthClient.jwks);
});

export { router as oauthRouter };
