import { Router } from "express";
import { documents, makeId } from "../mock/data";
import { CreateDocumentBody, SearchDocumentsBody } from "@workspace/api-zod";

const router = Router();

router.get("/documents", (_req, res) => {
  res.json(documents);
});

router.post("/documents", (req, res) => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { name, type, source, storageUrl, tags } = parsed.data;
  const doc = {
    id: makeId(),
    name,
    type,
    source,
    storageUrl,
    size: 0,
    isIndexed: false,
    chunkCount: 0,
    uploadedAt: new Date().toISOString(),
    tags: tags ?? [],
  };
  documents.push(doc);
  res.status(201).json(doc);
});

router.delete("/documents/:documentId", (req, res) => {
  const idx = documents.findIndex((d) => d.id === req.params["documentId"]);
  if (idx === -1) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  documents.splice(idx, 1);
  res.status(204).send();
});

router.post("/documents/search", (req, res) => {
  const parsed = SearchDocumentsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { query, limit } = parsed.data;
  const q = query.toLowerCase();

  // Mock keyword search over document names and tags
  const matches = documents
    .filter(
      (d) =>
        d.isIndexed &&
        (d.name.toLowerCase().includes(q) || d.tags.some((t) => t.toLowerCase().includes(q)))
    )
    .slice(0, limit ?? 5)
    .map((d) => ({
      documentId: d.id,
      documentName: d.name,
      chunk: `[Mock excerpt] This document "${d.name}" contains relevant content about "${query}". In production, this will be a real embedded chunk retrieved via vector similarity search from Google Drive / Sheets.`,
      score: Math.random() * 0.4 + 0.6,
      source: d.source,
    }));

  res.json(matches);
});

export default router;
