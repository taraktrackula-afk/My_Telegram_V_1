import {
  tasks,
  reminders,
  memories,
  makeId,
  getMockAiResponse,
} from "../mock/data";
import type { TelegramMessage, BotReply } from "./types";

interface IntentContext {
  message: TelegramMessage;
  accountId: string;
  text: string;
}

// Simple keyword-based intent detection — replaces with real NLP/LLM in production
function detectIntent(text: string): string {
  const lower = text.toLowerCase();

  if (/remind|reminder|remind me/.test(lower)) return "set_reminder";
  if (/task|todo|to-do|add task/.test(lower)) return "add_task";
  if (/remember|save|note|write down|keep in mind/.test(lower)) return "save_memory";
  if (/what.*task|list.*task|show.*task|tasks/.test(lower)) return "list_tasks";
  if (/what.*reminder|show.*reminder|upcoming/.test(lower)) return "list_reminders";
  if (/search|find|look up|look for/.test(lower)) return "search";
  if (/done|complete|finished|mark.*done/.test(lower)) return "mark_done";
  if (/team|member|employee|staff/.test(lower)) return "team_info";
  if (/status|how.*doing|system/.test(lower)) return "status_query";
  return "general_chat";
}

// Quick time parsing for common natural language patterns
function parseTimeFromText(text: string): string | undefined {
  const lower = text.toLowerCase();
  const now = new Date();

  if (/tomorrow/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d.toISOString();
  }
  if (/next week/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    d.setHours(9, 0, 0, 0);
    return d.toISOString();
  }
  if (/tonight/.test(lower)) {
    const d = new Date(now);
    d.setHours(20, 0, 0, 0);
    return d.toISOString();
  }
  if (/friday/.test(lower)) {
    const d = new Date(now);
    const daysUntilFriday = (5 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilFriday);
    d.setHours(9, 0, 0, 0);
    return d.toISOString();
  }
  return undefined;
}

// Extract task title from natural language
function extractTaskTitle(text: string): string {
  return text
    .replace(/(?:add|create|make|set up|new)\s+(?:a\s+)?task(?:\s+to\s+|\s+for\s+|\s*:\s*)?/gi, "")
    .replace(/(?:remind me to|i need to|i have to|i should)\s+/gi, "")
    .trim()
    .slice(0, 120);
}

// Extract reminder title from natural language
function extractReminderTitle(text: string): string {
  return text
    .replace(/remind(?:er)?\s+(?:me\s+)?(?:about\s+|to\s+|for\s+)?/gi, "")
    .replace(/(?:tomorrow|tonight|next week|on friday|at \d+[ap]m)/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export async function handleIntent(ctx: IntentContext): Promise<BotReply> {
  const intent = detectIntent(ctx.text);

  switch (intent) {
    case "set_reminder": {
      const title = extractReminderTitle(ctx.text);
      const scheduledAt = parseTimeFromText(ctx.text) ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const reminder = {
        id: makeId(),
        title: title || "Reminder from Telegram",
        scheduledAt,
        isRecurring: false,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
      };
      reminders.push(reminder);
      return {
        text: `<b>Reminder Set</b>\n\n"${reminder.title}"\n${new Date(scheduledAt).toLocaleString()}\n\nUse /reminders to see all.`,
        parseMode: "HTML",
      };
    }

    case "add_task": {
      const title = extractTaskTitle(ctx.text);
      const dueDate = parseTimeFromText(ctx.text);
      const now = new Date().toISOString();
      const task = {
        id: makeId(),
        title: title || "New task from Telegram",
        status: "pending" as const,
        priority: "medium" as const,
        dueDate,
        createdAt: now,
        updatedAt: now,
        tags: ["telegram"],
      };
      tasks.push(task);
      const dueStr = dueDate ? `\nDue: ${new Date(dueDate).toLocaleDateString()}` : "";
      return {
        text: `<b>Task Added</b>\n\n"${task.title}"${dueStr}\n\nUse /tasks to see all tasks.`,
        parseMode: "HTML",
      };
    }

    case "save_memory": {
      const content = ctx.text
        .replace(/(?:remember|save|note|write down|keep in mind)\s*(?:that\s+|:?\s*)?/gi, "")
        .trim();
      const memory = {
        id: makeId(),
        type: "long_term" as const,
        content: content || ctx.text,
        tags: ["telegram"],
        source: "telegram",
        createdAt: new Date().toISOString(),
      };
      memories.push(memory);
      return {
        text: `<b>Saved to Memory</b>\n\n"${memory.content}"\n\nThis will be recalled automatically in future conversations.`,
        parseMode: "HTML",
      };
    }

    case "list_tasks": {
      const active = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
      if (active.length === 0) return { text: "No active tasks. Tell me what you need to do and I'll add it." };
      const lines = active.slice(0, 8).map((t, i) => `${i + 1}. ${t.title} [${t.priority}]`);
      return {
        text: `<b>Active Tasks (${active.length})</b>\n\n${lines.join("\n")}`,
        parseMode: "HTML",
      };
    }

    case "list_reminders": {
      const upcoming = reminders
        .filter((r) => r.status === "pending")
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 5);
      if (upcoming.length === 0) return { text: "No upcoming reminders." };
      const lines = upcoming.map((r) => `• ${r.title} — ${new Date(r.scheduledAt).toLocaleDateString()}`);
      return {
        text: `<b>Upcoming Reminders</b>\n\n${lines.join("\n")}`,
        parseMode: "HTML",
      };
    }

    case "search": {
      const query = ctx.text.replace(/(?:search|find|look\s+(?:up|for))\s+/gi, "").trim().toLowerCase();
      const hits = memories.filter(
        (m) => m.content.toLowerCase().includes(query) || m.tags.some((t) => t.includes(query))
      );
      if (hits.length === 0) return { text: `No results for "${query}" in memory.` };
      const lines = hits.slice(0, 5).map((m) => `• ${m.content.slice(0, 100)}`);
      return {
        text: `<b>Search: "${query}"</b>\n\n${lines.join("\n")}`,
        parseMode: "HTML",
      };
    }

    case "mark_done": {
      // Try to find a matching task by keyword
      const keyword = ctx.text.replace(/done|complete|finished|mark/gi, "").trim().toLowerCase();
      const match = tasks.find(
        (t) =>
          (t.status === "pending" || t.status === "in_progress") &&
          t.title.toLowerCase().includes(keyword)
      );
      if (match) {
        match.status = "done";
        match.updatedAt = new Date().toISOString();
        return {
          text: `<b>Task Complete!</b>\n\n"${match.title}" marked as done.`,
          parseMode: "HTML",
        };
      }
      return { text: `I couldn't find an active task matching that. Use /tasks to see the list and /done [number] to mark one complete.` };
    }

    case "team_info": {
      const active = teamMembers.filter((m) => m.status === "active");
      const lines = active.map((m) => `• ${m.fullName} — ${m.position}`);
      return {
        text: `<b>Active Team Members (${active.length})</b>\n\n${lines.join("\n")}\n\nUse /team for full details.`,
        parseMode: "HTML",
      };
    }

    case "status_query": {
      const provider = aiProviders.find((p) => p.isActive);
      return {
        text: `<b>System Online</b>\n\nAI: ${provider?.name ?? "Mock"} — ${provider?.model ?? "mock"}\nMode: Development\nAll systems operational.\n\nUse /status for full details.`,
        parseMode: "HTML",
      };
    }

    default: {
      // General conversational AI response
      const aiResponse = getMockAiResponse();

      // Auto-save conversation to short-term memory
      memories.push({
        id: makeId(),
        type: "short_term",
        content: `User said: "${ctx.text.slice(0, 200)}"`,
        tags: ["telegram", "conversation"],
        source: "telegram",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      return { text: aiResponse };
    }
  }
}

// Re-export for use in routes
import { aiProviders, teamMembers } from "../mock/data";
