import { useState } from "react";
import { useListMemories, useCreateMemory, useDeleteMemory, getListMemoriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Search, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Memory() {
  const [activeTab, setActiveTab] = useState<"short_term" | "long_term">("short_term");
  const [searchQuery, setSearchQuery] = useState("");
  const [newContent, setNewContent] = useState("");
  
  const { data: memories = [], isLoading } = useListMemories({ type: activeTab, search: searchQuery });
  const createMemory = useCreateMemory();
  const deleteMemory = useDeleteMemory();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    
    createMemory.mutate({
      data: { type: activeTab, content: newContent, tags: [] }
    }, {
      onSuccess: () => {
        setNewContent("");
        queryClient.invalidateQueries({ queryKey: getListMemoriesQueryKey({ type: activeTab }) });
        toast({ title: "Memory synthesized" });
      }
    });
  };

  const handleDelete = (id: string) => {
    deleteMemory.mutate({ memoryId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMemoriesQueryKey({ type: activeTab }) });
        toast({ title: "Memory purged" });
      }
    });
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          Neural Core
        </h1>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Query memories..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card/50 border-border/50"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col">
        <TabsList className="w-full max-w-md grid grid-cols-2 bg-card/50 border border-border/50 p-1">
          <TabsTrigger value="short_term" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Volatile RAM (Short Term)
          </TabsTrigger>
          <TabsTrigger value="long_term" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Deep Storage (Long Term)
          </TabsTrigger>
        </TabsList>

        <Card className="mt-4 p-4 bg-card/50 backdrop-blur-sm border-border/50">
          <form onSubmit={handleCreate} className="flex gap-4">
            <Input 
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Inject new knowledge..." 
              className="flex-1 bg-background"
              disabled={createMemory.isPending}
            />
            <Button type="submit" disabled={createMemory.isPending || !newContent.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Encode
            </Button>
          </form>
        </Card>

        <Card className="flex-1 mt-4 bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
          <ScrollArea className="h-full p-6">
            <div className="grid gap-4">
              {isLoading ? (
                <div className="text-center text-muted-foreground animate-pulse py-8">Accessing memory banks...</div>
              ) : memories.map(memory => (
                <div key={memory.id} className="group flex flex-col gap-2 p-4 bg-background/50 border border-border/50 rounded-lg hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <p className="text-foreground leading-relaxed">{memory.content}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(memory.id)}
                      className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border">
                      ID: {memory.id.slice(0, 8)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(memory.createdAt).toLocaleString()}
                    </span>
                    {memory.source && (
                      <Badge variant="secondary" className="text-[10px] ml-auto">
                        SRC: {memory.source}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {!isLoading && memories.length === 0 && (
                <div className="text-center text-muted-foreground font-mono py-12 border border-dashed border-border/50 rounded-lg">
                  MEMORY SECTOR EMPTY
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </Tabs>
    </div>
  );
}
