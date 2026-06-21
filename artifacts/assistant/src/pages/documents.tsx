import { useState, useRef, useCallback } from "react";
import { useListDocuments, useDeleteDocument } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListDocumentsQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Database,
  FileText,
  Upload,
  Trash2,
  CloudUpload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Tag,
} from "lucide-react";

const TYPE_ICONS: Record<string, string> = { pdf: "📄", docx: "📝", txt: "📃", image: "🖼️", spreadsheet: "📊", other: "📎" };
const SOURCE_LABELS: Record<string, string> = { google_drive: "Google Drive", google_sheets: "Sheets", telegram: "Telegram", manual: "Manual" };
const SOURCE_COLORS: Record<string, string> = {
  google_drive: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  google_sheets: "bg-green-500/10 text-green-400 border-green-500/20",
  telegram: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  manual: "bg-muted text-muted-foreground border-border",
};

interface DocWithSync {
  id: string;
  name: string;
  type: string;
  source: string;
  size?: number;
  isIndexed: boolean;
  chunkCount: number;
  uploadedAt: string;
  tags: string[];
  driveSyncStatus?: string;
  storageUrl?: string;
}

function formatSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents() {
  const { data: docs = [], refetch } = useListDocuments();
  const deleteDoc = useDeleteDocument();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const handleDelete = (id: string) => {
    deleteDoc.mutate({ documentId: id }, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        toast({ title: "Document removed" });
      },
    });
  };

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    setUploading(true);
    let succeeded = 0;
    for (const file of arr) {
      const fd = new FormData();
      fd.append("file", file);
      if (tagInput.trim()) fd.append("tags", tagInput.trim());
      try {
        const res = await fetch("/api/documents/upload", { method: "POST", body: fd });
        if (res.ok) succeeded++;
      } catch { /* ignore */ }
    }
    setUploading(false);
    void queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
    toast({
      title: succeeded === arr.length
        ? `${succeeded} file${succeeded > 1 ? "s" : ""} uploaded`
        : `${succeeded}/${arr.length} files uploaded`,
      description: "Syncing to Google Drive… RAG indexing will complete in a few seconds.",
    });
    // Re-fetch after mock sync delay to show updated status
    setTimeout(() => { void refetch(); }, 3500);
  }, [tagInput, queryClient, refetch, toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) void uploadFiles(e.target.files);
    e.target.value = "";
  };

  const typedDocs = docs as unknown as DocWithSync[];
  const indexed = typedDocs.filter((d) => d.isIndexed).length;
  const pending = typedDocs.filter((d) => d.driveSyncStatus === "pending").length;

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Database className="w-8 h-8 text-primary" />
          Knowledge Base
        </h1>
        <div className="flex gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-400" /> {indexed} indexed</span>
          {pending > 0 && <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-yellow-400" /> {pending} syncing…</span>}
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-3 cursor-pointer transition-all ${
          dragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
        }`}
      >
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onFileChange}
          accept=".pdf,.docx,.doc,.txt,.md,.xlsx,.xls,.csv,.ods,.png,.jpg,.jpeg,.webp" />
        <CloudUpload className={`w-10 h-10 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
        <div className="text-center">
          <p className="font-medium">{uploading ? "Uploading…" : "Drop files here or click to browse"}</p>
          <p className="text-sm text-muted-foreground mt-1">PDF, DOCX, TXT, XLSX, CSV, Images — up to 50 MB each</p>
          <p className="text-xs text-muted-foreground mt-1">Files are synced to Google Drive and indexed for RAG automatically</p>
        </div>
        {/* Tag input inside zone */}
        <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
          <Tag className="w-4 h-4 text-muted-foreground" />
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Optional tags: hr, policy, finance"
            className="w-56 h-8 text-xs"
          />
        </div>
      </div>

      {/* Upload CTA button for mobile */}
      <div className="flex justify-end -mt-2">
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="border-primary/30 text-primary hover:bg-primary/10"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? "Uploading…" : "Upload Files"}
        </Button>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {typedDocs.map((doc) => (
          <Card
            key={doc.id}
            className="p-5 bg-card/50 border-border/50 hover:border-primary/30 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl shrink-0">{TYPE_ICONS[doc.type] ?? "📎"}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-2 leading-tight">{doc.name}</h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="outline" className={`text-[10px] uppercase ${SOURCE_COLORS[doc.source] ?? ""}`}>
                    {SOURCE_LABELS[doc.source] ?? doc.source}
                  </Badge>
                  {doc.driveSyncStatus === "pending" ? (
                    <Badge className="text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                      <Clock className="w-2.5 h-2.5 mr-1" />Syncing…
                    </Badge>
                  ) : doc.driveSyncStatus === "error" ? (
                    <Badge className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">
                      <AlertCircle className="w-2.5 h-2.5 mr-1" />Sync error
                    </Badge>
                  ) : doc.isIndexed ? (
                    <Badge className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20">
                      <CheckCircle2 className="w-2.5 h-2.5 mr-1" />{doc.chunkCount} chunks
                    </Badge>
                  ) : (
                    <Badge className="text-[10px] bg-muted text-muted-foreground border-border">Not indexed</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">{formatSize(doc.size)}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {doc.storageUrl && (
                      <a href={doc.storageUrl} target="_blank" rel="noreferrer">
                        <Button size="icon" variant="ghost" className="w-7 h-7">
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {doc.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {doc.tags.map((t) => (
                      <span key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {typedDocs.length === 0 && (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No documents yet. Upload files above to build your knowledge base.</p>
          </div>
        )}
      </div>
    </div>
  );
}
