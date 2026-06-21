import { Router } from "express";
import { chats, messages, makeId, getMockAiResponse } from "../mock/data";
import { ListChatsQueryParams, SendMessageBody } from "@workspace/api-zod";

const router = Router();

router.get("/chats", (req, res) => {
  const parsed = ListChatsQueryParams.safeParse(req.query);
  const { accountId, limit } = parsed.success ? parsed.data : { accountId: undefined, limit: 50 };
  let result = chats;
  if (accountId) {
    result = result.filter((c) => c.accountId === accountId);
  }
  res.json(result.slice(0, limit ?? 50));
});

router.get("/chats/:chatId/messages", (req, res) => {
  const chatId = req.params["chatId"];
  const chat = chats.find((c) => c.id === chatId);
  if (!chat) {
    res.status(404).json({ error: "Chat not found" });
    return;
  }
  const result = messages.filter((m) => m.chatId === chatId);
  res.json(result);
});

router.post("/chats/:chatId/send", (req, res) => {
  const chatId = req.params["chatId"];
  const chat = chats.find((c) => c.id === chatId);
  if (!chat) {
    res.status(404).json({ error: "Chat not found" });
    return;
  }

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { content, accountId } = parsed.data;
  const now = new Date().toISOString();

  const userMsg = {
    id: makeId(),
    chatId,
    role: "user" as const,
    content,
    sender: "Owner",
    timestamp: now,
    hasAttachment: false,
  };
  messages.push(userMsg);

  const aiResponse = {
    id: makeId(),
    chatId,
    role: "assistant" as const,
    content: getMockAiResponse(),
    sender: "AI Assistant",
    timestamp: new Date(Date.now() + 1000).toISOString(),
    hasAttachment: false,
  };
  messages.push(aiResponse);

  // Update the chat's last message
  chat.lastMessage = content;
  chat.lastMessageAt = now;
  chat.messageCount += 2;

  res.json(aiResponse);
});

export default router;
