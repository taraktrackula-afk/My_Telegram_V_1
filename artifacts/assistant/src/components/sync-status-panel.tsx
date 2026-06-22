import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  CloudOff, Cloud, RefreshCw, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp,
} from "lucide-react";

type SyncState = "synced" | "pending" | "never" | "error";

interface DataLayer {
  id: string;
  label: string;
  description: string;
  backend: "Google Sheets" | "Google Drive";
  icon: string;
  state: SyncState;
  lastSynced?: string;
  rowCount?: number;
}

const BASE_LAYERS: Omit<DataLayer, "state" | "lastSynced" | "rowCount">[] = [
  { id: "tasks",       label: "Tasks",             description: "Pending, in-progress and completed tasks",        backend: "Google Sheets", icon: "✅" },
  { id: "memory",      label: "Memory",             description: "Long-term and short-term memories",               backend: "Google Sheets", icon: "🧠" },
  { id: "reminders",   label: "Reminders",          description: "One-time and recurring reminders",                backend: "Google Sheets", icon: "🔔" },
  { id: "personal",    label: "Personal Notes",     description: "Goals, achievements and reflections",             backend: "Google Sheets", icon: "🌱" },
  { id: "team",        label: "Team Data Sheets",   description: "Per-member performance, attendance and notes",    backend: "Google Sheets", icon: "👥" },
  { id: "collections", label: "Collections",        description: "Snags, reports, logs and custom project data",    backend: "Google Sheets", icon: "📚" },
  { id: "chats",       label: "Chat Logs",          description: "Telegram message history across 3 accounts",     backend: "Google Sheets", icon: "💬" },
  { id: "ai_prefs",    label: "AI Preferences",     description: "Learned response preferences and confidence scores", backend: "Google Sheets", icon: "🤖" },
  { id: "settings",    label: "Settings & Whitelist","description": "Account whitelist and feature toggles",        backend: "Google Sheets", icon: "⚙️" },
  { id: "documents",   label: "Documents",          description: "Files synced to Google Drive, indexed for RAG",  backend: "Google Drive",  icon: "📄" },
];

function relativeTime(iso?: string) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)  return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

const STATE_META: Record<SyncState, { icon: React.ReactNode; label: string; color: string }> = {
  synced:  { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Synced",   color: "bg-green-500/10 text-green-400 border-green-500/20" },
  pending: { icon: <Clock className="w-3.5 h-3.5 animate-spin" />, label: "Syncing…", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  never:   { icon: <CloudOff className="w-3.5 h-3.5" />, label: "Not connected", color: "bg-muted text-muted-foreground border-border" },
  error:   { icon: <AlertCircle className="w-3.5 h-3.5" />, label: "Error",     color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export function SyncStatusPanel() {
  const { toast } = useToast();
  const [layers, setLayers] = useState<DataLayer[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState(false);

  const buildLayers = useCallback(async (): Promise<DataLayer[]> => {
    // In foundation build: fetch live counts from the API, show "never" sync state
    // When Google integration is connected, this will switch to real sync timestamps
    try {
      const [tasks, memories, reminders, personal, collections, docs, team] = await Promise.all([
        fetch("/api/tasks").then(r => r.json() as Promise<unknown[]>),
        fetch("/api/memory").then(r => r.json() as Promise<{ memories?: unknown[] }>),
        fetch("/api/reminders").then(r => r.json() as Promise<unknown[]>),
        fetch("/api/personal/notes").then(r => r.json() as Promise<unknown[]>),
        fetch("/api/collections").then(r => r.json() as Promise<unknown[]>),
        fetch("/api/documents").then(r => r.json() as Promise<unknown[]>),
        fetch("/api/team/members").then(r => r.json() as Promise<unknown[]>),
      ]);

      const counts: Record<string, number> = {
        tasks:       Array.isArray(tasks)                           ? tasks.length        : 0,
        memory:      Array.isArray((memories as { memories?: unknown[] }).memories) ? (memories as { memories?: unknown[] }).memories!.length : 0,
        reminders:   Array.isArray(reminders)                       ? reminders.length    : 0,
        personal:    Array.isArray(personal)                        ? personal.length     : 0,
        collections: Array.isArray(collections)                     ? collections.length  : 0,
        documents:   Array.isArray(docs)                            ? docs.length         : 0,
        team:        Array.isArray(team)                            ? team.length         : 0,
      };

      return BASE_LAYERS.map(layer => ({
        ...layer,
        rowCount: counts[layer.id],
        state: "never" as SyncState,
        lastSynced: undefined,
      }));
    } catch {
      return BASE_LAYERS.map(l => ({ ...l, state: "never" as SyncState }));
    }
  }, []);

  useEffect(() => {
    void buildLayers().then(setLayers);
  }, [buildLayers]);

  async function handleForceSyncAll() {
    if (!connected) {
      toast({
        title: "Google not connected",
        description: "Connect your Google account in Settings to enable backup sync.",
        variant: "destructive",
      });
      return;
    }
    setSyncing(true);
    setLayers(prev => prev.map(l => ({ ...l, state: "pending" as SyncState })));
    // Simulate sync (replace with real Drive/Sheets calls when connected)
    await new Promise(r => setTimeout(r, 2000));
    const now = new Date().toISOString();
    setLayers(prev => prev.map(l => ({ ...l, state: "synced" as SyncState, lastSynced: now })));
    setSyncing(false);
    toast({ title: "All data synced to Google", description: "Sheets + Drive backup complete." });
  }

  const neverCount  = layers.filter(l => l.state === "never").length;
  const syncedCount = layers.filter(l => l.state === "synced").length;
  const pendingCount = layers.filter(l => l.state === "pending").length;
  const shownLayers = expanded ? layers : layers.slice(0, 4);

  return (
    <Card className="bg-card/50 border-border/50 p-5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-sm uppercase tracking-wider">Backup & Sync</h2>
          {!connected && (
            <Badge className="bg-muted text-muted-foreground border-border text-[10px]">
              <CloudOff className="w-3 h-3 mr-1" /> Google not connected
            </Badge>
          )}
          {connected && syncedCount === layers.length && (
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
              <CheckCircle2 className="w-3 h-3 mr-1" /> All synced
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!connected && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => {
                toast({
                  title: "Connect Google Account",
                  description: "Go to Settings → Integrations to connect Google Sheets & Drive.",
                });
              }}
            >
              Connect Google
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            disabled={syncing || !connected}
            onClick={() => void handleForceSyncAll()}
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync All"}
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-green-400" />
          {syncedCount} synced
        </span>
        {pendingCount > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-yellow-400" />
            {pendingCount} syncing
          </span>
        )}
        <span className="flex items-center gap-1">
          <CloudOff className="w-3 h-3" />
          {neverCount} awaiting connection
        </span>
      </div>

      {/* Data layer rows */}
      <div className="flex flex-col gap-1.5">
        {shownLayers.map(layer => {
          const meta = STATE_META[layer.state];
          return (
            <div
              key={layer.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-background/40 border border-border/40 hover:border-border/70 transition-colors"
            >
              <span className="text-base shrink-0">{layer.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{layer.label}</span>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">{layer.description}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {layer.rowCount !== undefined && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {layer.rowCount} {layer.backend === "Google Drive" ? "files" : "rows"}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground hidden md:inline">
                  → {layer.backend}
                </span>
                {layer.lastSynced && (
                  <span className="text-[10px] text-muted-foreground">{relativeTime(layer.lastSynced)}</span>
                )}
                <Badge className={`text-[10px] flex items-center gap-1 ${meta.color}`}>
                  {meta.icon}
                  {meta.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more / less */}
      {layers.length > 4 && (
        <button
          className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors"
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? (
            <><ChevronUp className="w-3 h-3" /> Show less</>
          ) : (
            <><ChevronDown className="w-3 h-3" /> Show {layers.length - 4} more data layers</>
          )}
        </button>
      )}

      {/* Footer note */}
      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        Connect Google Sheets & Drive to enable automatic backup · All data layers ready to sync
      </p>
    </Card>
  );
}
