import { Router } from "express";
import multer from "multer";
import { documents, makeId } from "../mock/data";
import { CreateDocumentBody, SearchDocumentsBody } from "@workspace/api-zod";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

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

// ─── FILE UPLOAD (mock Google Drive sync) ───
router.post("/documents/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }

  const ext = file.originalname.split(".").pop()?.toLowerCase() ?? "";
  const typeMap: Record<string, "pdf" | "docx" | "txt" | "image" | "spreadsheet" | "other"> = {
    pdf: "pdf", docx: "docx", doc: "docx",
    txt: "txt", md: "txt",
    png: "image", jpg: "image", jpeg: "image", webp: "image",
    xlsx: "spreadsheet", xls: "spreadsheet", csv: "spreadsheet", ods: "spreadsheet",
  };

  const tagsFromForm = (req.body as { tags?: string }).tags
    ? String((req.body as { tags?: string }).tags).split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const doc = {
    id: makeId(),
    name: file.originalname,
    type: typeMap[ext] ?? "other",
    source: "google_drive" as const,
    size: file.size,
    isIndexed: false,
    chunkCount: 0,
    uploadedAt: new Date().toISOString(),
    tags: tagsFromForm,
    driveSyncStatus: "pending" as const,
    mimeType: file.mimetype,
    storageUrl: undefined,
  };
  documents.push(doc);

  // Simulate async Drive sync + indexing (3s mock delay)
  setTimeout(() => {
    const stored = documents.find((d) => d.id === doc.id);
    if (stored) {
      stored.driveSyncStatus = "synced";
      stored.storageUrl = `https://drive.google.com/file/d/mock_${stored.id}`;
      stored.isIndexed = true;
      stored.chunkCount = Math.max(1, Math.ceil(file.size / 4096));
    }
  }, 3000);

  res.status(201).json(doc);
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
