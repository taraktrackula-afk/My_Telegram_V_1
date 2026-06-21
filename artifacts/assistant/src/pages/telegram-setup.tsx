import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Bot,
  CheckCircle2,
  Circle,
  Send,
  Copy,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";

interface BotStatus {
  mode: string;
  whitelistCount: number;
  accounts: Array<{
    id: string;
    label: string;
    displayName: string;
    webhookUrl: string;
    isActive: boolean;
    botConfigured: boolean;
    instructions: string;
  }>;
}

interface TestResult {
  input: { accountId: string; text: string };
  output: { text: string; parseMode?: string };
  account: string;
}

export default function TelegramSetup() {
  const { toast } = useToast();
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [testAccountId, setTestAccountId] = useState("acc-main");
  const [testMessage, setTestMessage] = useState("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/telegram/status");
      const data = (await res.json()) as BotStatus;
      setStatus(data);
    } catch {
      toast({ title: "Failed to load bot status", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function sendTestMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!testMessage.trim()) return;
    setTesting(true);
    try {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: testAccountId, text: testMessage }),
      });
      const data = (await res.json()) as TestResult;
      setTestResults((prev) => [data, ...prev.slice(0, 9)]);
      setTestMessage("");
    } catch {
      toast({ title: "Test failed", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  }

  function copyToClipboard(text: string) {
    void navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  }

  const accounts = [
    { id: "acc-main", label: "Main", envVar: "TELEGRAM_BOT_TOKEN_MAIN" },
    { id: "acc-secondary", label: "Work", envVar: "TELEGRAM_BOT_TOKEN_SECONDARY" },
    { id: "acc-backup", label: "Backup", envVar: "TELEGRAM_BOT_TOKEN_BACKUP" },
  ];

  return (
    <div className="flex flex-col h-full gap-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Bot className="w-8 h-8 text-primary" />
          Telegram Bot Setup
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={loadStatus}
          disabled={loading}
          className="border-primary/30 text-primary hover:bg-primary/10"
        >
          <Zap className="w-4 h-4 mr-2" />
          {loading ? "Checking..." : "Check Status"}
        </Button>
      </div>

      {/* Account Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const live = status?.accounts.find((a) => a.id === acc.id);
          const configured = live?.botConfigured ?? false;
          const active = live?.isActive ?? false;
          return (
            <Card
              key={acc.id}
              className="p-5 bg-card/50 border-border/50 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{acc.label} Account</span>
                <div className="flex gap-2">
                  {configured ? (
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Connected</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-muted-foreground">Not Connected</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {active ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span>{active ? "Active" : "Inactive"}</span>
              </div>
              <div className="mt-1">
                <p className="text-xs text-muted-foreground mb-1">Webhook path:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    /api/telegram/webhook/{acc.id}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-6 h-6 shrink-0"
                    onClick={() => copyToClipboard(`/api/telegram/webhook/${acc.id}`)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <button
                className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 mt-1"
                onClick={() => setExpandedAccount(expandedAccount === acc.id ? null : acc.id)}
              >
                Setup instructions
                {expandedAccount === acc.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {expandedAccount === acc.id && (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3 space-y-2">
                  <p className="font-medium text-foreground">To connect this account:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Open <code>@BotFather</code> in Telegram</li>
                    <li>Send <code>/newbot</code> and follow the prompts</li>
                    <li>Copy the bot token</li>
                    <li>
                      Add to Replit secrets:
                      <div className="flex items-center gap-1 mt-1">
                        <code className="bg-muted px-1 rounded">{acc.envVar}</code>
                        <Button size="icon" variant="ghost" className="w-5 h-5" onClick={() => copyToClipboard(acc.envVar)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </li>
                    <li>
                      Register webhook with Telegram:
                      <div className="flex items-center gap-1 mt-1">
                        <code className="bg-muted px-1 rounded break-all">
                          {"POST https://api.telegram.org/bot<TOKEN>/setWebhook"}
                        </code>
                      </div>
                      Body: <code className="bg-muted px-1 rounded">{`{"url":"https://<domain>/api/telegram/webhook/${acc.id}"}`}</code>
                    </li>
                  </ol>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Message Simulator */}
      <Card className="p-6 bg-card/50 border-border/50 flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Message Simulator</h2>
          <p className="text-sm text-muted-foreground">
            Test the AI routing without a real Telegram bot. Try commands like <code className="bg-muted px-1 rounded">/help</code>, <code className="bg-muted px-1 rounded">/tasks</code>, or natural language.
          </p>
        </div>

        <form onSubmit={sendTestMessage} className="flex gap-3">
          <select
            value={testAccountId}
            onChange={(e) => setTestAccountId(e.target.value)}
            className="bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
          <Input
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder='Try: /help, /tasks, "remind me to call Ali tomorrow", "agenda for team meeting"'
            className="flex-1"
          />
          <Button type="submit" disabled={testing || !testMessage.trim()}>
            <Send className="w-4 h-4 mr-2" />
            {testing ? "Sending..." : "Send"}
          </Button>
        </form>

        <ScrollArea className="h-96 rounded-md border border-border/50 bg-background/50">
          <div className="p-4 flex flex-col gap-4">
            {testResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Send a message above to see the AI response here.
              </p>
            )}
            {testResults.map((r, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="self-end max-w-[70%]">
                  <div className="text-xs text-muted-foreground mb-1 text-right">{r.account}</div>
                  <div className="bg-primary/20 border border-primary/30 rounded-xl rounded-tr-sm px-4 py-2 text-sm">
                    {r.input.text}
                  </div>
                </div>
                <div className="self-start max-w-[75%]">
                  <div className="text-xs text-muted-foreground mb-1">NEXUS AI</div>
                  <div className="bg-muted border border-border rounded-xl rounded-tl-sm px-4 py-3 text-sm whitespace-pre-wrap">
                    {r.output.text.replace(/<[^>]+>/g, "")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Supported Commands Reference */}
      <Card className="p-6 bg-card/50 border-border/50">
        <h2 className="text-lg font-semibold mb-4">Supported Commands</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {[
            ["/help", "Full command reference"],
            ["/tasks", "List active tasks"],
            ["/addtask", "Create a task"],
            ["/done", "Mark task complete"],
            ["/reminders", "Upcoming reminders"],
            ["/remember", "Save to long-term memory"],
            ["/forget", "Delete memory by keyword"],
            ["/search", "Search memory + docs"],
            ["/team", "Team directory"],
            ["/agenda", "Generate meeting agenda"],
            ["/status", "System health stats"],
            ["/security_status", "Whitelist & session"],
          ].map(([cmd, desc]) => (
            <div key={cmd} className="flex gap-2 items-start">
              <code className="bg-muted px-2 py-0.5 rounded text-xs text-primary shrink-0">{cmd}</code>
              <span className="text-muted-foreground text-xs">{desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Natural language also works — mention a team member's name and it auto-saves the context to their data sheet.
        </p>
      </Card>
    </div>
  );
}
