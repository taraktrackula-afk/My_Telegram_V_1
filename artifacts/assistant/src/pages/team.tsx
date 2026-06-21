import { useState } from "react";
import { useListTeamMembers } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Building2,
  ChevronLeft,
  FileText,
  Plus,
  Trash2,
  Activity,
  BookOpen,
  ClipboardList,
  Star,
} from "lucide-react";

type NoteCategory =
  | "performance"
  | "attendance"
  | "sick_leave"
  | "general"
  | "appraisal_note"
  | "recognition"
  | "incident"
  | "training"
  | "feedback";

interface TeamMemberNote {
  id: string;
  memberId: string;
  category: NoteCategory;
  content: string;
  source: "telegram" | "manual" | "dashboard";
  chatContext?: string;
  recordedAt: string;
  recordedBy: string;
}

const CATEGORY_COLORS: Record<NoteCategory, string> = {
  performance: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  attendance: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  sick_leave: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  general: "bg-muted text-muted-foreground border-border",
  appraisal_note: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  recognition: "bg-green-500/10 text-green-400 border-green-500/20",
  incident: "bg-red-500/10 text-red-400 border-red-500/20",
  training: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  feedback: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

const NOTE_CATEGORIES: NoteCategory[] = [
  "performance", "attendance", "sick_leave", "appraisal_note",
  "recognition", "training", "incident", "feedback", "general",
];

const SOURCE_ICONS: Record<string, string> = {
  telegram: "📱",
  manual: "✍️",
  dashboard: "🖥️",
};

export default function Team() {
  const { data: team = [] } = useListTeamMembers();
  const { toast } = useToast();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [notes, setNotes] = useState<TeamMemberNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [activeTab, setActiveTab] = useState<"notes" | "appraisals" | "recognitions">("notes");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState<NoteCategory>("general");
  const [filterCategory, setFilterCategory] = useState<NoteCategory | "all">("all");
  const [addingNote, setAddingNote] = useState(false);

  const selectedMember = team.find((m) => m.id === selectedMemberId);

  async function openMember(id: string) {
    setSelectedMemberId(id);
    setActiveTab("notes");
    setLoadingNotes(true);
    try {
      const res = await fetch(`/api/team/members/${id}/notes`);
      const data = (await res.json()) as TeamMemberNote[];
      setNotes(data);
    } catch {
      toast({ title: "Failed to load notes", variant: "destructive" });
    } finally {
      setLoadingNotes(false);
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoteContent.trim() || !selectedMemberId) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/team/members/${selectedMemberId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNoteContent, category: newNoteCategory, source: "dashboard" }),
      });
      const note = (await res.json()) as TeamMemberNote;
      setNotes((prev) => [note, ...prev]);
      setNewNoteContent("");
      toast({ title: "Note saved to data sheet" });
    } catch {
      toast({ title: "Failed to add note", variant: "destructive" });
    } finally {
      setAddingNote(false);
    }
  }

  async function deleteNote(noteId: string) {
    if (!selectedMemberId) return;
    try {
      await fetch(`/api/team/members/${selectedMemberId}/notes/${noteId}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast({ title: "Note removed" });
    } catch {
      toast({ title: "Failed to remove note", variant: "destructive" });
    }
  }

  const filteredNotes =
    filterCategory === "all" ? notes : notes.filter((n) => n.category === filterCategory);

  const noteCounts = notes.reduce<Record<string, number>>((acc, n) => {
    acc[n.category] = (acc[n.category] ?? 0) + 1;
    return acc;
  }, {});

  // ─── Member List ───
  if (!selectedMemberId || !selectedMember) {
    return (
      <div className="flex flex-col h-full gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Personnel Roster
          </h1>
          <p className="text-sm text-muted-foreground">Click a member to open their data sheet</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member) => (
            <Card
              key={member.id}
              className="p-6 bg-card/50 border-border/50 hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => openMember(member.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {member.fullName}
                  </h3>
                  <p className="text-sm text-muted-foreground">{member.position}</p>
                </div>
                <Badge
                  variant={member.status === "active" ? "default" : "secondary"}
                  className="bg-primary/10 text-primary"
                >
                  {member.status}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Building2 className="w-3 h-3" />
                {member.department}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
                <span className="flex items-center gap-1">
                  <ClipboardList className="w-3 h-3" />
                  {member.appraisals?.length ?? 0} appraisals
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {member.recognitions?.length ?? 0} recognitions
                </span>
                <span className="flex items-center gap-1 text-primary/70">
                  <FileText className="w-3 h-3" />
                  Data sheet →
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ─── Member Data Sheet ───
  return (
    <div className="flex flex-col h-full gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedMemberId(null)}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{selectedMember.fullName}</h1>
          <p className="text-sm text-muted-foreground">
            {selectedMember.position} · {selectedMember.department} ·{" "}
            <span className="text-xs">{selectedMember.employeeId}</span>
          </p>
        </div>
        <Badge
          variant={selectedMember.status === "active" ? "default" : "secondary"}
          className="bg-primary/10 text-primary"
        >
          {selectedMember.status}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/50 pb-0">
        {(["notes", "appraisals", "recognitions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "notes" && <span>Data Sheet ({notes.length})</span>}
            {tab === "appraisals" && <span>Appraisals ({selectedMember.appraisals?.length ?? 0})</span>}
            {tab === "recognitions" && <span>Recognitions ({selectedMember.recognitions?.length ?? 0})</span>}
          </button>
        ))}
      </div>

      {/* ── Notes / Data Sheet Tab ── */}
      {activeTab === "notes" && (
        <div className="flex flex-col gap-4 flex-1">
          {/* Add Note Form */}
          <Card className="p-4 bg-card/50 border-border/50">
            <form onSubmit={addNote} className="flex flex-col gap-3">
              <div className="flex gap-3">
                <select
                  value={newNoteCategory}
                  onChange={(e) => setNewNoteCategory(e.target.value as NoteCategory)}
                  className="bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground"
                >
                  {NOTE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <Input
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder={`Add a note about ${selectedMember.fullName.split(" ")[0]}...`}
                  className="flex-1"
                />
                <Button type="submit" disabled={addingNote || !newNoteContent.trim()}>
                  <Plus className="w-4 h-4 mr-1" />
                  {addingNote ? "Saving..." : "Save"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Notes are auto-saved when you mention this person's name in any Telegram chat.
              </p>
            </form>
          </Card>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory("all")}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                filterCategory === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              All ({notes.length})
            </button>
            {NOTE_CATEGORIES.filter((c) => noteCounts[c]).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  filterCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {cat.replace(/_/g, " ")} ({noteCounts[cat]})
              </button>
            ))}
          </div>

          {/* Notes List */}
          <ScrollArea className="flex-1 h-96">
            {loadingNotes ? (
              <p className="text-sm text-muted-foreground p-4">Loading data sheet…</p>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No notes yet.</p>
                <p className="text-xs mt-1">Add a note above or mention this person in Telegram.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pr-3">
                {filteredNotes.map((note) => (
                  <Card
                    key={note.id}
                    className="p-4 bg-card/40 border-border/50 flex gap-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`text-xs ${CATEGORY_COLORS[note.category]}`}>
                          {note.category.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {SOURCE_ICONS[note.source]} {note.source}
                          {note.chatContext && ` · ${note.chatContext}`}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(note.recordedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{note.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* ── Appraisals Tab ── */}
      {activeTab === "appraisals" && (
        <ScrollArea className="flex-1 h-[60vh]">
          {(selectedMember.appraisals ?? []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No formal appraisals yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 pr-3">
              {[...(selectedMember.appraisals ?? [])]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((apr) => (
                  <Card key={apr.id} className="p-5 bg-card/50 border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{new Date(apr.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < apr.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{apr.feedback}</p>
                    <p className="text-xs text-muted-foreground mt-2">Reviewer: {apr.reviewer}</p>
                  </Card>
                ))}
            </div>
          )}
        </ScrollArea>
      )}

      {/* ── Recognitions Tab ── */}
      {activeTab === "recognitions" && (
        <ScrollArea className="flex-1 h-[60vh]">
          {(selectedMember.recognitions ?? []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No recognitions yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 pr-3">
              {[...(selectedMember.recognitions ?? [])]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((rec) => (
                  <Card key={rec.id} className="p-5 bg-card/50 border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-primary">{rec.type}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(rec.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">Awarded by: {rec.awardedBy}</p>
                  </Card>
                ))}
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
}
