import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { User, Pin, PinOff, Trash2, Plus, Pencil, Check, X } from "lucide-react";

type PersonalNoteCategory =
  | "personal_goal"
  | "professional_goal"
  | "notable_work"
  | "reflection"
  | "general_note";

interface PersonalNote {
  id: string;
  category: PersonalNoteCategory;
  content: string;
  source: "telegram" | "dashboard";
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_META: Record<PersonalNoteCategory, { label: string; emoji: string; color: string; description: string }> = {
  professional_goal: { label: "Professional Goal", emoji: "🎯", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", description: "Career targets and work ambitions" },
  personal_goal:    { label: "Personal Goal",     emoji: "🌱", color: "bg-green-500/10 text-green-400 border-green-500/20", description: "Life goals and personal growth" },
  notable_work:     { label: "Achievement",        emoji: "⭐", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", description: "Things you did well or completed" },
  reflection:       { label: "Reflection",         emoji: "💭", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", description: "Lessons learned and looking back" },
  general_note:     { label: "Note",               emoji: "📝", color: "bg-muted text-muted-foreground border-border", description: "Miscellaneous personal notes" },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as PersonalNoteCategory[];

export default function Personal() {
  const { toast } = useToast();
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PersonalNoteCategory | "all">("all");

  // Add note form
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<PersonalNoteCategory>("general_note");
  const [adding, setAdding] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/personal/notes");
      setNotes((await res.json()) as PersonalNote[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newContent.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/personal/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent.trim(), category: newCategory, source: "dashboard" }),
      });
      const note = (await res.json()) as PersonalNote;
      setNotes((prev) => [note, ...prev]);
      setNewContent("");
      toast({ title: "Note saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  }

  async function togglePin(note: PersonalNote) {
    const res = await fetch(`/api/personal/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !note.isPinned }),
    });
    const updated = (await res.json()) as PersonalNote;
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)).sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }));
  }

  async function saveEdit(noteId: string) {
    if (!editContent.trim()) return;
    const res = await fetch(`/api/personal/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent.trim() }),
    });
    const updated = (await res.json()) as PersonalNote;
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setEditingId(null);
    toast({ title: "Note updated" });
  }

  async function deleteNote(noteId: string) {
    await fetch(`/api/personal/notes/${noteId}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    toast({ title: "Note deleted" });
  }

  const filtered = filter === "all" ? notes : notes.filter((n) => n.category === filter);
  const counts = notes.reduce<Record<string, number>>((acc, n) => { acc[n.category] = (acc[n.category] ?? 0) + 1; return acc; }, {});
  const pinnedNotes = filtered.filter((n) => n.isPinned);
  const unpinnedNotes = filtered.filter((n) => !n.isPinned);

  return (
    <div className="flex flex-col h-full gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <User className="w-8 h-8 text-primary" />
          Personal Space
        </h1>
        <p className="text-sm text-muted-foreground">Your goals, achievements, and reflections</p>
      </div>

      {/* Category summary cards */}
      <div className="grid grid-cols-5 gap-3">
        {ALL_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat];
          return (
            <button
              key={cat}
              onClick={() => setFilter(filter === cat ? "all" : cat)}
              className={`rounded-xl border p-3 text-left transition-all ${
                filter === cat ? "border-primary bg-primary/10" : "border-border/50 bg-card/50 hover:border-primary/40"
              }`}
            >
              <div className="text-2xl mb-1">{meta.emoji}</div>
              <div className="text-xs font-medium leading-tight">{meta.label}</div>
              <div className="text-lg font-bold text-primary mt-1">{counts[cat] ?? 0}</div>
            </button>
          );
        })}
      </div>

      {/* Add note */}
      <Card className="p-4 bg-card/50 border-border/50">
        <form onSubmit={addNote} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as PersonalNoteCategory)}
              className="bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground shrink-0"
            >
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
                </option>
              ))}
            </select>
            <Input
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={`${CATEGORY_META[newCategory].description}…`}
              className="flex-1"
            />
            <Button type="submit" disabled={adding || !newContent.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              {adding ? "Saving…" : "Add"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 You can also add notes from Telegram: <code className="bg-muted px-1 rounded">/note</code> <code className="bg-muted px-1 rounded">/goal</code> <code className="bg-muted px-1 rounded">/achievement</code> <code className="bg-muted px-1 rounded">/reflect</code>
          </p>
        </form>
      </Card>

      {/* Notes list */}
      <ScrollArea className="flex-1 h-[50vh]">
        {loading ? (
          <p className="text-muted-foreground text-sm p-4">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No notes yet in this category.</p>
            <p className="text-xs mt-1">Add one above or send <code>/note</code> in Telegram.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pr-3">
            {pinnedNotes.length > 0 && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Pin className="w-3 h-3" /> Pinned
                </p>
                {pinnedNotes.map((note) => <NoteCard key={note.id} note={note} editingId={editingId} editContent={editContent} setEditContent={setEditContent} setEditingId={setEditingId} saveEdit={saveEdit} togglePin={togglePin} deleteNote={deleteNote} />)}
                {unpinnedNotes.length > 0 && <div className="border-t border-border/40 my-1" />}
              </>
            )}
            {unpinnedNotes.map((note) => <NoteCard key={note.id} note={note} editingId={editingId} editContent={editContent} setEditContent={setEditContent} setEditingId={setEditingId} saveEdit={saveEdit} togglePin={togglePin} deleteNote={deleteNote} />)}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function NoteCard({
  note,
  editingId, editContent, setEditContent, setEditingId,
  saveEdit, togglePin, deleteNote,
}: {
  note: PersonalNote;
  editingId: string | null;
  editContent: string;
  setEditContent: (v: string) => void;
  setEditingId: (v: string | null) => void;
  saveEdit: (id: string) => Promise<void>;
  togglePin: (n: PersonalNote) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}) {
  const meta = CATEGORY_META[note.category];
  const isEditing = editingId === note.id;

  return (
    <Card className={`p-4 border-border/50 flex gap-3 group transition-colors ${note.isPinned ? "bg-primary/5 border-primary/20" : "bg-card/40"}`}>
      <div className="text-xl shrink-0 mt-0.5">{meta.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <Badge className={`text-xs ${meta.color}`}>{meta.label}</Badge>
          <span className="text-xs text-muted-foreground">
            {note.source === "telegram" ? "📱" : "🖥️"} {note.source}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
        {isEditing ? (
          <div className="flex gap-2 mt-1">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 text-sm h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveEdit(note.id);
                if (e.key === "Escape") setEditingId(null);
              }}
            />
            <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => void saveEdit(note.id)}>
              <Check className="w-3.5 h-3.5 text-green-400" />
            </Button>
            <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => setEditingId(null)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{note.content}</p>
        )}
      </div>
      {!isEditing && (
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" className="w-7 h-7" title={note.isPinned ? "Unpin" : "Pin"} onClick={() => void togglePin(note)}>
            {note.isPinned ? <PinOff className="w-3.5 h-3.5 text-primary" /> : <Pin className="w-3.5 h-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => { setEditingId(note.id); setEditContent(note.content); }}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="w-7 h-7 text-muted-foreground hover:text-destructive" onClick={() => void deleteNote(note.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </Card>
  );
}
