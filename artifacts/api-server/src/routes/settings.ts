import { Router } from "express";
import { settings } from "../mock/data";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router = Router();

router.get("/settings", (_req, res) => {
  res.json(settings);
});

router.patch("/settings", (req, res) => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  Object.assign(settings, parsed.data);
  res.json(settings);
});

export default router;
