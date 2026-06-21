import { Router } from "express";
import { aiProviders, getMockAiResponse, makeId } from "../mock/data";
import { AiChatBody, SetActiveProviderBody } from "@workspace/api-zod";

const router = Router();

router.post("/ai/chat", (req, res) => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const activeProvider = aiProviders.find((p) => p.isActive) ?? aiProviders[0]!;
  activeProvider.requestCount += 1;

  res.json({
    id: makeId(),
    message: getMockAiResponse(),
    provider: activeProvider.name,
    model: activeProvider.model,
    tokensUsed: Math.floor(Math.random() * 500) + 50,
    memoryUsed: parsed.data.useMemory ?? true,
    ragUsed: parsed.data.useRag ?? false,
    timestamp: new Date().toISOString(),
  });
});

router.get("/ai/providers", (_req, res) => {
  res.json(aiProviders);
});

router.patch("/ai/providers/active", (req, res) => {
  const parsed = SetActiveProviderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { providerId } = parsed.data;
  const target = aiProviders.find((p) => p.id === providerId);
  if (!target) {
    res.status(404).json({ error: "Provider not found" });
    return;
  }

  aiProviders.forEach((p) => {
    p.isActive = p.id === providerId;
    if (p.isActive) {
      p.status = p.isConfigured ? "active" : "mock";
    } else {
      if (p.id !== "mock") p.status = "inactive";
    }
  });

  res.json(target);
});

export default router;
