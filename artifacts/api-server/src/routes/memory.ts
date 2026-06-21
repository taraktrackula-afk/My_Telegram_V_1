import { Router } from "express";
import { memories, makeId } from "../mock/data";
import { ListMemoriesQueryParams, CreateMemoryBody } from "@workspace/api-zod";

const router = Router();

router.get("/memory", (req, res) => {
  const parsed = ListMemoriesQueryParams.safeParse(req.query);
  const { type, search } = parsed.success ? parsed.data : { type: undefined, search: undefined };

  let result = memories;
  if (type) {
    result = result.filter((m) => m.type === type);
  }
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  res.json(result);
});

router.post("/memory", (req, res) => {
  const parsed = CreateMemoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { type, content, tags, source } = parsed.data;
  const memory = {
    id: makeId(),
    type,
    content,
    tags,
    source: source ?? "manual",
    createdAt: new Date().toISOString(),
  };
  memories.push(memory);
  res.status(201).json(memory);
});

router.delete("/memory/:memoryId", (req, res) => {
  const idx = memories.findIndex((m) => m.id === req.params["memoryId"]);
  if (idx === -1) {
    res.status(404).json({ error: "Memory not found" });
    return;
  }
  memories.splice(idx, 1);
  res.status(204).send();
});

export default router;
