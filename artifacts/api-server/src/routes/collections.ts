import { Router } from "express";
import {
  customCollections,
  collectionEntries,
  makeId,
  type CollectionType,
} from "../mock/data";

const router = Router();

const TYPE_EMOJI: Record<CollectionType, string> = {
  snags: "🐛",
  report: "📋",
  log: "📓",
  feedback: "💬",
  checklist: "✅",
  other: "📌",
};

// ─── Collections ───

router.get("/collections", (_req, res) => {
  const result = customCollections.map((col) => ({
    ...col,
    entryCount: collectionEntries.filter((e) => e.collectionId === col.id).length,
  }));
  res.json(result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
});

router.post("/collections", (req, res) => {
  const { name, projectTag, type } = req.body as {
    name?: string;
    projectTag?: string;
    type?: CollectionType;
  };
  if (!name?.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const colType: CollectionType = type ?? "other";
  const now = new Date().toISOString();
  const col: (typeof customCollections)[0] = {
    id: makeId(),
    name: name.trim(),
    projectTag: projectTag?.trim(),
    type: colType,
    emoji: TYPE_EMOJI[colType],
    createdAt: now,
    updatedAt: now,
  };
  customCollections.push(col);
  res.status(201).json({ ...col, entryCount: 0 });
});

router.delete("/collections/:colId", (req, res) => {
  const idx = customCollections.findIndex((c) => c.id === req.params["colId"]);
  if (idx === -1) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }
  customCollections.splice(idx, 1);
  // cascade delete entries
  const entryIdxs = collectionEntries
    .map((e, i) => (e.collectionId === req.params["colId"] ? i : -1))
    .filter((i) => i !== -1)
    .reverse();
  entryIdxs.forEach((i) => collectionEntries.splice(i, 1));
  res.json({ ok: true });
});

// ─── Entries ───

router.get("/collections/:colId/entries", (req, res) => {
  const entries = collectionEntries
    .filter((e) => e.collectionId === req.params["colId"])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(entries);
});

router.post("/collections/:colId/entries", (req, res) => {
  const col = customCollections.find((c) => c.id === req.params["colId"]);
  if (!col) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }
  const { content, source, severity, status } = req.body as {
    content?: string;
    source?: "telegram" | "dashboard";
    severity?: "low" | "medium" | "high";
    status?: "open" | "resolved" | "wontfix";
  };
  if (!content?.trim()) {
    res.status(400).json({ error: "content is required" });
    return;
  }
  const now = new Date().toISOString();
  const entry: (typeof collectionEntries)[0] = {
    id: makeId(),
    collectionId: col.id,
    content: content.trim(),
    source: source ?? "dashboard",
    severity,
    status: status ?? (col.type === "snags" ? "open" : undefined),
    createdAt: now,
    updatedAt: now,
  };
  collectionEntries.push(entry);
  col.updatedAt = now;
  res.status(201).json(entry);
});

router.patch("/collections/:colId/entries/:entryId", (req, res) => {
  const entry = collectionEntries.find(
    (e) => e.id === req.params["entryId"] && e.collectionId === req.params["colId"]
  );
  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  const { content, severity, status } = req.body as {
    content?: string;
    severity?: "low" | "medium" | "high";
    status?: "open" | "resolved" | "wontfix";
  };
  if (content !== undefined) entry.content = content;
  if (severity !== undefined) entry.severity = severity;
  if (status !== undefined) entry.status = status;
  entry.updatedAt = new Date().toISOString();
  res.json(entry);
});

router.delete("/collections/:colId/entries/:entryId", (req, res) => {
  const idx = collectionEntries.findIndex(
    (e) => e.id === req.params["entryId"] && e.collectionId === req.params["colId"]
  );
  if (idx === -1) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  collectionEntries.splice(idx, 1);
  const col = customCollections.find((c) => c.id === req.params["colId"]);
  if (col) col.updatedAt = new Date().toISOString();
  res.json({ ok: true });
});

// ─── Smart "find or create" used by Telegram router ───
export function findOrCreateCollection(
  name: string,
  type: CollectionType,
  projectTag?: string
): (typeof customCollections)[0] {
  const existing = customCollections.find(
    (c) =>
      c.name.toLowerCase() === name.toLowerCase() ||
      (c.type === type && c.projectTag?.toLowerCase() === projectTag?.toLowerCase())
  );
  if (existing) return existing;
  const now = new Date().toISOString();
  const col: (typeof customCollections)[0] = {
    id: makeId(),
    name,
    projectTag,
    type,
    emoji: TYPE_EMOJI[type],
    createdAt: now,
    updatedAt: now,
  };
  customCollections.push(col);
  return col;
}

export default router;
