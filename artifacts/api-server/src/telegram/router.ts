import type { TelegramMessage, BotReply } from "./types";
import { handleCommand } from "./commands";
import { handleIntent } from "./intent";
import { chats, messages, makeId } from "../mock/data";

export interface RouteResult {
  reply: BotReply;
  chatId: number;
}

export async function routeMessage(
  message: TelegramMessage,
  accountId: string
): Promise<RouteResult> {
  const text = message.text ?? message.caption ?? "";
  const chatId = message.chat.id;

  // Persist incoming message to chat history
  persistMessage(message, accountId, text);

  let reply: BotReply;

  if (text.startsWith("/")) {
    // Command routing
    const parts = text.trim().split(/\s+/);
    const command = (parts[0] ?? "").toLowerCase().split("@")[0]!; // strip @BotUsername
    const args = parts.slice(1);
    reply = await handleCommand(command, { message, accountId, args });
  } else if (text.trim()) {
    // Natural language intent routing
    const chatContext = message.chat.title ?? message.chat.first_name ?? "Telegram";
    reply = await handleIntent({ message, accountId, text, chatContext });
  } else {
    // Non-text message (media, sticker, etc.)
    reply = {
      text: "I received your file. In production, files are automatically stored in Google Drive and indexed for RAG. For now, you can register them manually in the Documents section of the dashboard.",
    };
  }

  // Persist AI reply to chat history
  persistReply(chatId.toString(), reply.text);

  return { reply, chatId };
}

function persistMessage(message: TelegramMessage, accountId: string, text: string) {
  const telegramChatId = message.chat.id.toString();
  const chatTitle = message.chat.title ?? message.chat.first_name ?? "Telegram Chat";

  // Find or create chat record
  let chat = chats.find((c) => c.id === `tg-${telegramChatId}`);
  if (!chat) {
    chat = {
      id: `tg-${telegramChatId}`,
      accountId,
      title: chatTitle,
      type: message.chat.type === "private" ? "private" : message.chat.type === "channel" ? "channel" : "group",
      lastMessage: text,
      lastMessageAt: new Date().toISOString(),
      messageCount: 0,
      isArchived: false,
    };
    chats.push(chat);
  }

  // Store the incoming message
  if (text) {
    messages.push({
      id: makeId(),
      chatId: chat.id,
      role: "user",
      content: text,
      sender: message.from?.first_name ?? "User",
      timestamp: new Date().toISOString(),
      hasAttachment: !!(message.document || message.photo || message.audio || message.video),
      attachmentType: message.document
        ? "document"
        : message.photo
        ? "image"
        : message.audio
        ? "audio"
        : message.video
        ? "video"
        : undefined,
    });

    chat.lastMessage = text;
    chat.lastMessageAt = new Date().toISOString();
    chat.messageCount += 1;
  }
}

function persistReply(telegramChatId: string, replyText: string) {
  const chat = chats.find((c) => c.id === `tg-${telegramChatId}`);
  if (!chat) return;

  messages.push({
    id: makeId(),
    chatId: chat.id,
    role: "assistant",
    content: replyText,
    sender: "AI Assistant",
    timestamp: new Date().toISOString(),
    hasAttachment: false,
  });

  chat.lastMessage = replyText;
  chat.lastMessageAt = new Date().toISOString();
  chat.messageCount += 1;
}
