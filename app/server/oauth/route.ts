import express from "express";

import { oauthClient } from "./client";

const router = express.Router();

router.get("/client-metadata.json", (_req, res) => {
  return res.json(oauthClient.clientMetadata);
});

export { router as oauthRouter };
