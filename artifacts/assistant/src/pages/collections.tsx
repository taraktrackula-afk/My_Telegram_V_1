import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Layers, Plus, Trash2, ChevronRight, ChevronLeft,
  CheckCircle2, Circle, Ban, AlertTriangle, Pencil, Check, X,
} from "lucide-react";

type CollectionType = "snags" | "report" | "log" | "feedback" | "checklist" | "other";

interface CustomCollection {
  id: string;
  name: string;
  projectTag?: string;
  type: CollectionType;
  emoji: string;
  entryCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CollectionEntry {
  id: string;
  collectionId: string;
  content: string;
  source: "telegram" | "dashboard";
  severity?: "low" | "medium" | "high";
  status?: "open" | "resolved" | "wontfix";
  createdAt: string;
  updatedAt: string;
}

const TYPE_META: Record<CollectionType, { label: string; color: string }> = {
  snags:     { label: "Snags",     color: "bg-red-500/10 text-red-400 border-red-500/20" },
  report:    { label: "Report",    color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  log:       { label: "Log",       color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  feedback:  { label: "Feedback",  color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  checklist: { label: "Checklist", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  other:     { label: "Other",     color: "bg-muted text-muted-foreground border-border" },
};

const SEV_COLORS: Record<string, string> = {
  high:   "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low:    "bg-green-500/10 text-green-400 border-green-500/20",
};

const ALL_TYPES = Object.keys(TYPE_META) as CollectionType[];

export default function Collections() {
  const { toast } = useToast();
  const [collections, setCollections] = useState<CustomCollection[]>([]);
  const [selected, setSelected] = useState<CustomCollection | null>(null);
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entryLoading, setEntryLoading] = useState(false);

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<CollectionType>("snags");
  const [newProject, setNewProject] = useState("");
  const [adding, setAdding] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  const [entryText, setEntryText] = useState("");
  const [entrySeverity, setEntrySeverity] = useState<"low" | "medium" | "high">("medium");
  const [addingEntry, setAddingEntry] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const loadCollections = useCallback(async () => {
    const res = await fetch("/api/collections");
    setCollections((await res.json()) as CustomCollection[]);
    setLoading(false);
  }, []);

  const loadEntries = useCallback(async (colId: string) => {
    setEntryLoading(true);
    const res = await fetch(`/api/collections/${colId}/entries`);
    setEntries((await res.json()) as CollectionEntry[]);
    setEntryLoading(false);
  }, []);

  useEffect(() => { void loadCollections(); }, [loadCollections]);
  useEffect(() => { if (selected) void loadEntries(selected.id); }, [selected, loadEntries]);

  async function createCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    const name = newProject.trim()
      ? `${newProject.trim()} — ${newType === "snags" ? "Snags" : newType.charAt(0).toUpperCase() + newType.slice(1)}s`
      : newName.trim();
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type: newType, projectTag: newProject.trim() || undefined }),
      });
      const col = (await res.json()) as CustomCollection;
      setCollections((prev) => [col, ...prev]);
      setNewName(""); setNewProject(""); setShowNewForm(false);
      toast({ title: `Collection "${col.name}" created` });
    } finally {
      setAdding(false);
    }
  }

  async function deleteCollection(id: string) {
    await fetch(`/api/collections/${id}`, { method: "DELETE" });
    setCollections((prev) => prev.filter((c) => c.id !== id));
    if (selected?.id === id) setSelected(null);
    toast({ title: "Collection deleted" });
  }

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!entryText.trim() || !selected) return;
    setAddingEntry(true);
    try {
      const res = await fetch(`/api/collections/${selected.id}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: entryText.trim(),
          source: "dashboard",
          severity: selected.type === "snags" ? entrySeverity : undefined,
          status: selected.type === "snags" ? "open" : undefined,
        }),
      });
      const entry = (await res.json()) as CollectionEntry;
      setEntries((prev) => [entry, ...prev]);
      setEntryText("");
      setCollections((prev) =>
        prev.map((c) => c.id === selected.id ? { ...c, entryCount: c.entryCount + 1 } : c)
      );
    } finally {
      setAddingEntry(false);
    }
  }

  async function updateEntryStatus(entry: CollectionEntry, status: "open" | "resolved" | "wontfix") {
    const res = await fetch(`/api/collections/${entry.collectionId}/entries/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = (await res.json()) as CollectionEntry;
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }

  async function saveEdit(entry: CollectionEntry) {
    const res = await fetch(`/api/collections/${entry.collectionId}/entries/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    const updated = (await res.json()) as CollectionEntry;
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setEditingId(null);
    toast({ title: "Entry updated" });
  }

  async function deleteEntry(entry: CollectionEntry) {
    await fetch(`/api/collections/${entry.collectionId}/entries/${entry.id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    setCollections((prev) =>
      prev.map((c) => c.id === entry.collectionId ? { ...c, entryCount: Math.max(0, c.entryCount - 1) } : c)
    );
    toast({ title: "Entry deleted" });
  }

  const openCount = entries.filter((e) => e.status === "open").length;

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selected && (
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setSelected(null)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Layers className="w-8 h-8 text-primary" />
            {selected ? (
              <span className="flex items-center gap-2">
                {selected.emoji} {selected.name}
                {openCount > 0 && (
                  <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">
                    {openCount} open
                  </Badge>
                )}
              </span>
            ) : "Collections"}
          </h1>
        </div>
        {!selected && (
          <Button size="sm" onClick={() => setShowNewForm((v) => !v)} className="gap-1">
            <Plus className="w-4 h-4" /> New Collection
          </Button>
        )}
      </div>

      {/* ── COLLECTION LIST VIEW ── */}
      {!selected && (
        <>
          {showNewForm && (
            <Card className="p-4 border-primary/30 bg-primary/5">
              <form onSubmit={createCollection} className="flex flex-col gap-3">
                <div className="flex gap-3 flex-wrap">
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as CollectionType)}
                    className="bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground shrink-0"
                  >
                    {ALL_TYPES.map((t) => (
                      <option key={t} value={t}>{TYPE_META[t].label}</option>
                    ))}
                  </select>
                  <Input
                    value={newProject}
                    onChange={(e) => setNewProject(e.target.value)}
                    placeholder="Project name (optional)"
                    className="flex-1 min-w-40"
                  />
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Collection name"
                    className="flex-1 min-w-40"
                    required
                  />
                  <Button type="submit" disabled={adding || !newName.trim()}>
                    {adding ? "Creating…" : "Create"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 From Telegram: <code className="bg-muted px-1 rounded">/snag Project: issue</code> auto-creates snag collections. Also works with{" "}
                  <code className="bg-muted px-1 rounded">/report</code>{" "}
                  <code className="bg-muted px-1 rounded">/log</code>{" "}
                  <code className="bg-muted px-1 rounded">/feedback</code>
                </p>
              </form>
            </Card>
          )}

          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : collections.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No collections yet.</p>
              <p className="text-xs mt-1">
                Create one above or send{" "}
                <code className="bg-muted px-1 rounded">/snag Project: issue</code> in Telegram.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((col) => {
                const meta = TYPE_META[col.type];
                const lastUpdated = new Date(col.updatedAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric",
                });
                return (
                  <Card
                    key={col.id}
                    onClick={() => setSelected(col)}
                    className="p-5 cursor-pointer hover:border-primary/40 bg-card/50 border-border/50 group transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">{col.emoji}</div>
                      <div
                        className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7 text-muted-foreground hover:text-destructive"
                          onClick={() => void deleteCollection(col.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => setSelected(col)}>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm leading-tight mb-2">{col.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${meta.color}`}>{meta.label}</Badge>
                      {col.projectTag && (
                        <span className="text-[10px] text-muted-foreground">{col.projectTag}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-2xl font-bold text-primary">{col.entryCount}</span>
                      <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── ENTRY DETAIL VIEW ── */}
      {selected && (
        <div className="flex flex-col gap-4 flex-1">
          {/* Add entry */}
          <Card className="p-4 bg-card/50 border-border/50">
            <form onSubmit={addEntry} className="flex gap-3">
              {selected.type === "snags" && (
                <select
                  value={entrySeverity}
                  onChange={(e) => setEntrySeverity(e.target.value as "low" | "medium" | "high")}
                  className="bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground shrink-0"
                >
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              )}
              <Input
                value={entryText}
                onChange={(e) => setEntryText(e.target.value)}
                placeholder={selected.type === "snags" ? "Describe the issue…" : "Add entry…"}
                className="flex-1"
              />
              <Button type="submit" disabled={addingEntry || !entryText.trim()}>
                <Plus className="w-4 h-4 mr-1" />
                {addingEntry ? "Adding…" : "Add"}
              </Button>
            </form>
          </Card>

          {/* Entries */}
          <ScrollArea className="flex-1 h-[55vh]">
            {entryLoading ? (
              <p className="text-muted-foreground text-sm p-4">Loading entries…</p>
            ) : entries.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Layers className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No entries yet. Add one above or send from Telegram.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pr-3">
                {entries.map((entry) => (
                  <Card
                    key={entry.id}
                    className={`p-4 border-border/50 flex gap-3 group transition-colors ${
                      entry.status === "resolved" ? "opacity-60" : "bg-card/40"
                    }`}
                  >
                    {entry.status !== undefined && (
                      <button
                        className="shrink-0 mt-0.5"
                        title={entry.status}
                        onClick={() => {
                          const next = entry.status === "open" ? "resolved" : "open";
                          void updateEntryStatus(entry, next);
                        }}
                      >
                        {entry.status === "resolved" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : entry.status === "wontfix" ? (
                          <Ban className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                        )}
                      </button>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {entry.severity && (
                          <Badge className={`text-[10px] ${SEV_COLORS[entry.severity] ?? ""}`}>
                            {entry.severity === "high" && (
                              <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                            )}
                            {entry.severity}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {entry.source === "telegram" ? "📱 telegram" : "🖥️ dashboard"}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {new Date(entry.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric",
                          })}
                        </span>
                      </div>

                      {editingId === entry.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="flex-1 text-sm h-8"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void saveEdit(entry);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                          />
                          <Button
                            size="icon" variant="ghost" className="w-7 h-7"
                            onClick={() => void saveEdit(entry)}
                          >
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="w-7 h-7"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <p
                          className={`text-sm leading-relaxed ${
                            entry.status === "resolved"
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {entry.content}
                        </p>
                      )}
                    </div>

                    {editingId !== entry.id && (
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button
                          size="icon" variant="ghost" className="w-7 h-7"
                          onClick={() => { setEditingId(entry.id); setEditContent(entry.content); }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {entry.status === "open" && (
                          <Button
                            size="icon" variant="ghost" className="w-7 h-7 text-muted-foreground"
                            title="Won't fix"
                            onClick={() => void updateEntryStatus(entry, "wontfix")}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon" variant="ghost"
                          className="w-7 h-7 text-muted-foreground hover:text-destructive"
                          onClick={() => void deleteEntry(entry)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
