import { useGetDashboardSummary, useAiChat } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Brain, CheckSquare, Bell, Users, FileText, Cpu, Activity, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();
  const [message, setMessage] = useState("");
  const aiChat = useAiChat();
  const { toast } = useToast();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    aiChat.mutate({
      data: { message, accountId: "default" }
    }, {
      onSuccess: () => {
        setMessage("");
        toast({ title: "Command sent to AI Assistant" });
      },
      onError: () => {
        toast({ title: "Failed to send command", variant: "destructive" });
      }
    });
  };

  if (isLoading) return <div className="p-8 text-muted-foreground animate-pulse">Initializing telemetry...</div>;
  if (!summary) return null;

  return (
    <div className="flex flex-col h-full gap-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
            <Cpu className="w-3 h-3 mr-2" />
            {summary.activeProvider}
          </Badge>
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1">
            <Activity className="w-3 h-3 mr-2" />
            {summary.accountsActive} Accounts Online
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Chats", value: summary.totalChats, icon: MessageSquare, color: "text-blue-500" },
          { label: "Total Memories", value: summary.totalMemories, icon: Brain, color: "text-purple-500" },
          { label: "Pending Tasks", value: summary.pendingTasks, icon: CheckSquare, color: "text-yellow-500" },
          { label: "Upcoming Reminders", value: summary.upcomingReminders, icon: Bell, color: "text-red-500" },
          { label: "Team Members", value: summary.teamMembersCount, icon: Users, color: "text-green-500" },
          { label: "Indexed Docs", value: summary.documentsIndexed, icon: FileText, color: "text-orange-500" },
          { label: "Total Messages", value: summary.totalMessages, icon: MessageSquare, color: "text-pink-500" },
        ].map((stat, i) => (
          <Card key={i} className="p-6 bg-card/50 border-border/50 backdrop-blur-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <span className="text-3xl font-bold">{stat.value}</span>
          </Card>
        ))}
      </div>

      <Card className="flex-1 bg-card/50 border-border/50 backdrop-blur-sm p-6 flex flex-col gap-4 overflow-hidden min-h-[300px]">
        <h2 className="text-lg font-semibold uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Recent Telemetry
        </h2>
        <ScrollArea className="flex-1 -mx-4 px-4">
          <div className="flex flex-col gap-3">
            {summary.recentActivity.map((activity) => (
              <div key={activity.id} className="flex flex-col gap-1 p-3 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">{activity.type}</Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-foreground/90">{activity.description}</p>
              </div>
            ))}
            {summary.recentActivity.length === 0 && (
              <div className="text-center text-muted-foreground py-8">No recent activity detected.</div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Quick Command Input */}
      <div className="absolute bottom-6 left-8 right-8">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto bg-card border border-border p-2 rounded-full shadow-2xl shadow-primary/10">
          <Input 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Command your AI Chief of Staff..." 
            className="flex-1 border-0 focus-visible:ring-0 bg-transparent text-lg px-4"
            disabled={aiChat.isPending}
          />
          <Button type="submit" size="icon" className="rounded-full h-12 w-12 shrink-0" disabled={aiChat.isPending || !message.trim()}>
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
