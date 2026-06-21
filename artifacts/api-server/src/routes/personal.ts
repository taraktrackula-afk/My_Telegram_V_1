import { Router } from "express";
import { personalNotes, makeId, type PersonalNoteCategory } from "../mock/data";

const router = Router();

router.get("/personal/notes", (_req, res) => {
  const sorted = [...personalNotes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  res.json(sorted);
});

router.post("/personal/notes", (req, res) => {
  const { content, category, source, isPinned } = req.body as {
    content?: string;
    category?: PersonalNoteCategory;
    source?: "telegram" | "dashboard";
    isPinned?: boolean;
  };
  if (!content?.trim()) {
    res.status(400).json({ error: "content is required" });
    return;
  }
  const now = new Date().toISOString();
  const note: (typeof personalNotes)[0] = {
    id: makeId(),
    category: category ?? "general_note",
    content: content.trim(),
    source: source ?? "dashboard",
    isPinned: isPinned ?? false,
    createdAt: now,
    updatedAt: now,
  };
  personalNotes.push(note);
  res.status(201).json(note);
});

router.patch("/personal/notes/:noteId", (req, res) => {
  const note = personalNotes.find((n) => n.id === req.params["noteId"]);
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  const { content, category, isPinned } = req.body as {
    content?: string;
    category?: PersonalNoteCategory;
    isPinned?: boolean;
  };
  if (content !== undefined) note.content = content;
  if (category !== undefined) note.category = category;
  if (isPinned !== undefined) note.isPinned = isPinned;
  note.updatedAt = new Date().toISOString();
  res.json(note);
});

router.delete("/personal/notes/:noteId", (req, res) => {
  const idx = personalNotes.findIndex((n) => n.id === req.params["noteId"]);
  if (idx === -1) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  personalNotes.splice(idx, 1);
  res.json({ ok: true });
});

export default router;
