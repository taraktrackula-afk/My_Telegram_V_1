import { useState } from "react";
import { 
  useListAccounts, 
  useListChats, 
  useListMessages, 
  useSendMessage,
  getListMessagesQueryKey,
  getListChatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Hash, Lock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Chats() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
  const [message, setMessage] = useState("");
  
  const { data: accounts = [] } = useListAccounts();
  const { data: chats = [], isLoading: isLoadingChats } = useListChats({ accountId: selectedAccountId });
  const { data: messages = [], isLoading: isLoadingMessages } = useListMessages(selectedChatId || "", {
    query: { enabled: !!selectedChatId, queryKey: getListMessagesQueryKey(selectedChatId || "") }
  });
  
  const sendMessage = useSendMessage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatId || !message.trim()) return;
    
    sendMessage.mutate({
      chatId: selectedChatId,
      data: { content: message, accountId: selectedAccountId || accounts[0]?.id || "default" }
    }, {
      onSuccess: () => {
        setMessage("");
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(selectedChatId) });
        queryClient.invalidateQueries({ queryKey: getListChatsQueryKey({ accountId: selectedAccountId }) });
      },
      onError: () => toast({ title: "Failed to send", variant: "destructive" })
    });
  };

  return (
    <div className="flex h-full gap-6">
      {/* Accounts & Chats Sidebar */}
      <div className="w-80 flex flex-col gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Badge 
            variant={!selectedAccountId ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setSelectedAccountId(undefined)}
          >
            All Accounts
          </Badge>
          {accounts.map(acc => (
            <Badge 
              key={acc.id}
              variant={selectedAccountId === acc.id ? "default" : "outline"}
              className={`cursor-pointer whitespace-nowrap ${
                acc.label === 'main' ? 'border-primary text-primary hover:bg-primary/10' :
                acc.label === 'secondary' ? 'border-blue-500 text-blue-500 hover:bg-blue-500/10' :
                'border-purple-500 text-purple-500 hover:bg-purple-500/10'
              } ${selectedAccountId === acc.id ? 'bg-current text-white' : ''}`}
              onClick={() => setSelectedAccountId(acc.id)}
            >
              {acc.displayName}
            </Badge>
          ))}
        </div>
        
        <Card className="flex-1 bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            {isLoadingChats ? (
              <div className="p-4 text-center text-muted-foreground animate-pulse">Scanning channels...</div>
            ) : chats.map(chat => (
              <button
                key={chat.id}
                className={`w-full text-left p-4 border-b border-border/50 transition-colors hover:bg-muted/50 ${
                  selectedChatId === chat.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                }`}
                onClick={() => setSelectedChatId(chat.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium truncate flex items-center gap-2">
                    {chat.type === 'private' ? <Lock className="w-3 h-3 text-muted-foreground" /> :
                     chat.type === 'group' ? <Users className="w-3 h-3 text-muted-foreground" /> :
                     <Hash className="w-3 h-3 text-muted-foreground" />}
                    {chat.title}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
              </button>
            ))}
          </ScrollArea>
        </Card>
      </div>

      {/* Main Chat Area */}
      <Card className="flex-1 bg-card/50 backdrop-blur-sm border-border/50 flex flex-col overflow-hidden">
        {!selectedChatId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground font-mono">
            SELECT A COMMUNICATION CHANNEL
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-border/50 bg-background/50">
              <h3 className="font-semibold">{chats.find(c => c.id === selectedChatId)?.title || 'Chat Thread'}</h3>
            </div>
            
            <ScrollArea className="flex-1 p-6">
              <div className="flex flex-col gap-4">
                {isLoadingMessages ? (
                  <div className="text-center text-muted-foreground animate-pulse">Decrypting messages...</div>
                ) : messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[70%] ${
                      msg.role === 'user' ? 'self-end items-end' : 
                      msg.role === 'system' ? 'self-center items-center opacity-50' : 'self-start items-start'
                    }`}
                  >
                    <span className="text-[10px] text-muted-foreground mb-1 px-1">
                      {msg.sender} • {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    <div className={`p-3 rounded-2xl ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 
                      msg.role === 'system' ? 'bg-transparent border border-dashed border-border text-xs' :
                      'bg-secondary text-secondary-foreground rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border/50 bg-background/50">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Transmit message..." 
                  className="bg-card border-border/50 focus-visible:ring-primary"
                  disabled={sendMessage.isPending}
                />
                <Button type="submit" disabled={sendMessage.isPending || !message.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
