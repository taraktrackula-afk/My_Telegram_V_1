import {
  tasks,
  reminders,
  memories,
  personalNotes,
  collectionEntries,
  makeId,
  getMockAiResponse,
  aiProviders,
  teamMembers,
  type PersonalNoteCategory,
  type CollectionType,
} from "../mock/data";
import { findOrCreateCollection } from "../routes/collections";
import type { TelegramMessage, BotReply } from "./types";
import { detectAndSaveTeamMentions } from "./team-detector";
import { learnFromMessage, buildPersonalizedContext } from "./learning";

interface IntentContext {
  message: TelegramMessage;
  accountId: string;
  text: string;
  chatContext: string;
}

// Simple keyword-based intent detection
function detectIntent(text: string): string {
  const lower = text.toLowerCase();

  if (/agenda|meeting agenda|what.*agenda|prepare.*agenda/i.test(lower)) return "agenda";
  if (/\bsnag\b|\bbug found\b|\bissue found\b|log.*snag|add.*snag/i.test(lower)) return "col_snag";
  if (/\breport\b.*(?:for|on)\s+\w|\bproject report\b|sprint report|status report|log.*report/i.test(lower)) return "col_report";
  if (/\bfeedback\b.*(?:for|on|from)\s+\w|log.*feedback|record.*feedback/i.test(lower)) return "col_feedback";
  if (/\bnew collection\b|\bcreate collection\b|\badd collection\b/i.test(lower)) return "col_new";
  if (/\bmy collections\b|\blist collections\b|\bshow collections\b/i.test(lower)) return "col_list";
  if (/note (for|to) (my)?self|personal note|note to self/i.test(lower)) return "self_note";
  if (/my (personal |personal life |life )?goal|personal goal/i.test(lower)) return "personal_goal";
  if (/professional goal|career goal|work goal|i want to achieve|my goal is/i.test(lower)) return "professional_goal";
  if (/i (did|achieved|completed|accomplished|finished)|notable (work|achievement)|i'm proud/i.test(lower)) return "notable_work";
  if (/reflect(ion)?|looking back|lessons? learned|what i learned/i.test(lower)) return "reflection";
  if (/remind|reminder|remind me/.test(lower)) return "set_reminder";
  if (/task|todo|to-do|add task/.test(lower)) return "add_task";
  if (/remember|save|note|write down|keep in mind/.test(lower)) return "save_memory";
  if (/what.*task|list.*task|show.*task|my tasks/.test(lower)) return "list_tasks";
  if (/what.*reminder|show.*reminder|upcoming/.test(lower)) return "list_reminders";
  if (/search|find|look up|look for/.test(lower)) return "search";
  if (/done|complete|finished|mark.*done/.test(lower)) return "mark_done";
  if (/team|member|employee|staff/.test(lower)) return "team_info";
  if (/status|how.*doing|system/.test(lower)) return "status_query";
  if (/apprais|review.*team|performance review/.test(lower)) return "appraisal";
  return "general_chat";
}

// Quick time parsing
function parseTimeFromText(text: string): string | undefined {
  const lower = text.toLowerCase();
  const now = new Date();
  if (/tomorrow/.test(lower)) {
    const d = new Date(now); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d.toISOString();
  }
  if (/next week/.test(lower)) {
    const d = new Date(now); d.setDate(d.getDate() + 7); d.setHours(9, 0, 0, 0); return d.toISOString();
  }
  if (/tonight/.test(lower)) {
    const d = new Date(now); d.setHours(20, 0, 0, 0); return d.toISOString();
  }
  if (/friday/.test(lower)) {
    const d = new Date(now);
    const daysUntilFriday = (5 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilFriday); d.setHours(9, 0, 0, 0); return d.toISOString();
  }
  return undefined;
}

function extractTaskTitle(text: string): string {
  return text
    .replace(/(?:add|create|make|set up|new)\s+(?:a\s+)?task(?:\s+to\s+|\s+for\s+|\s*:\s*)?/gi, "")
    .replace(/(?:remind me to|i need to|i have to|i should)\s+/gi, "")
    .trim().slice(0, 120);
}

function extractReminderTitle(text: string): string {
  return text
    .replace(/remind(?:er)?\s+(?:me\s+)?(?:about\s+|to\s+|for\s+)?/gi, "")
    .replace(/(?:tomorrow|tonight|next week|on friday|at \d+[ap]m)/gi, "")
    .replace(/\s+/g, " ").trim().slice(0, 120);
}

export async function handleIntent(ctx: IntentContext): Promise<BotReply> {
  const { text, accountId } = ctx;

  // Always run learning pass first
  learnFromMessage(text, accountId);

  // Always scan for team member mentions and auto-save notes
  const mentions = detectAndSaveTeamMentions(text, "telegram", ctx.chatContext, accountId);

  const intent = detectIntent(text);

  switch (intent) {
    case "agenda": {
      const { handleCommand } = await import("./commands");
      return handleCommand("/agenda", { message: ctx.message, accountId, args: [] });
    }

    case "col_list": {
      const { handleCommand } = await import("./commands");
      return handleCommand("/collections", { message: ctx.message, accountId, args: [] });
    }

    case "col_snag":
    case "col_report":
    case "col_feedback": {
      const typeMap: Record<string, CollectionType> = { col_snag: "snags", col_report: "report", col_feedback: "feedback" };
      const type = typeMap[intent]!;

      // Extract "for/on [project]: content" or just use the whole text
      const forMatch = /(?:snag|report|feedback)\s+(?:for|on|in)\s+(.+?):\s*(.+)/i.exec(text);
      const colonMatch = /(?:snag|report|feedback)\s+(.+?):\s*(.+)/i.exec(text);
      let project: string | undefined;
      let content: string;

      if (forMatch) { project = forMatch[1].trim(); content = forMatch[2].trim(); }
      else if (colonMatch) { project = colonMatch[1].trim(); content = colonMatch[2].trim(); }
      else {
        content = text
          .replace(/\b(log|add|record|note)\s+(a\s+)?(snag|report|feedback)\b/gi, "")
          .replace(/\b(snag|report|feedback)\b/gi, "")
          .trim();
      }

      const emojis: Record<CollectionType, string> = { snags: "🐛", report: "📋", log: "📓", feedback: "💬", checklist: "✅", other: "📌" };
      const labels: Record<CollectionType, string> = { snags: "Snag", report: "Report", log: "Log", feedback: "Feedback", checklist: "Checklist", other: "Entry" };
      const collectionName = project
        ? `${project} — ${type === "snags" ? "Snags" : labels[type] + "s"}`
        : `General ${labels[type]}s`;
      const col = findOrCreateCollection(collectionName, type, project);
      const now = new Date().toISOString();
      collectionEntries.push({ id: makeId(), collectionId: col.id, content, source: "telegram", severity: type === "snags" ? "medium" : undefined, status: type === "snags" ? "open" : undefined, createdAt: now, updatedAt: now });
      col.updatedAt = now;
      const totalInCol = collectionEntries.filter((e) => e.collectionId === col.id).length;
      return {
        text: `${emojis[type]} <b>${labels[type]} Logged</b>${project ? ` — ${project}` : ""}\n\n"${content}"\n\n<i>Collection: "${col.name}" (${totalInCol} total) · View in dashboard → Collections</i>`,
        parseMode: "HTML",
      };
    }

    case "col_new": {
      const { handleCommand } = await import("./commands");
      const args = text.replace(/(?:new|create|add)\s+collection\s*/i, "").split(/\s+/);
      return handleCommand("/newcollection", { message: ctx.message, accountId, args });
    }

    case "self_note":
    case "general_note": {
      const content = text.replace(/note (for|to) (my)?self:?\s*/i, "").replace(/personal note:?\s*/i, "").trim();
      const now = new Date().toISOString();
      personalNotes.push({ id: makeId(), category: "general_note", content, source: "telegram", isPinned: false, createdAt: now, updatedAt: now });
      return { text: `<b>Personal Note Saved</b>\n\n"${content}"\n\n<i>View all in your Personal section or use /mynotes</i>`, parseMode: "HTML" };
    }

    case "personal_goal": {
      const content = text.replace(/my (personal |life )?goal(s)? (is|are):?\s*/i, "").trim();
      const now = new Date().toISOString();
      personalNotes.push({ id: makeId(), category: "personal_goal", content, source: "telegram", isPinned: false, createdAt: now, updatedAt: now });
      return { text: `<b>🌱 Personal Goal Saved</b>\n\n"${content}"`, parseMode: "HTML" };
    }

    case "professional_goal": {
      const content = text.replace(/(professional|career|work) goal(s)? (is|are):?\s*/i, "").replace(/i want to achieve:?\s*/i, "").replace(/my goal is:?\s*/i, "").trim();
      const now = new Date().toISOString();
      personalNotes.push({ id: makeId(), category: "professional_goal", content, source: "telegram", isPinned: false, createdAt: now, updatedAt: now });
      return { text: `<b>🎯 Professional Goal Saved</b>\n\n"${content}"`, parseMode: "HTML" };
    }

    case "notable_work": {
      const content = text.trim();
      const now = new Date().toISOString();
      personalNotes.push({ id: makeId(), category: "notable_work", content, source: "telegram", isPinned: false, createdAt: now, updatedAt: now });
      return { text: `<b>⭐ Achievement Recorded</b>\n\n"${content}"\n\n<i>This will be available during your next self-review.</i>`, parseMode: "HTML" };
    }

    case "reflection": {
      const content = text.replace(/reflect(ion)?:?\s*/i, "").replace(/looking back:?\s*/i, "").trim();
      const now = new Date().toISOString();
      personalNotes.push({ id: makeId(), category: "reflection", content, source: "telegram", isPinned: false, createdAt: now, updatedAt: now });
      return { text: `<b>💭 Reflection Saved</b>\n\n"${content}"`, parseMode: "HTML" };
    }

    case "set_reminder": {
      const title = extractReminderTitle(text);
      const scheduledAt = parseTimeFromText(text) ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const reminder = {
        id: makeId(), title: title || "Reminder from Telegram",
        scheduledAt, isRecurring: false, status: "pending" as const,
        createdAt: new Date().toISOString(),
      };
      reminders.push(reminder);
      return {
        text: `<b>Reminder Set</b>\n\n"${reminder.title}"\n${new Date(scheduledAt).toLocaleString()}\n\nUse /reminders to see all.`,
        parseMode: "HTML",
      };
    }

    case "add_task": {
      const title = extractTaskTitle(text);
      const dueDate = parseTimeFromText(text);
      const now = new Date().toISOString();
      const task = {
        id: makeId(), title: title || "New task from Telegram",
        status: "pending" as const, priority: "medium" as const,
        dueDate, createdAt: now, updatedAt: now, tags: ["telegram"],
      };
      tasks.push(task);
      const dueStr = dueDate ? `\nDue: ${new Date(dueDate).toLocaleDateString()}` : "";
      return {
        text: `<b>Task Added</b>\n\n"${task.title}"${dueStr}\n\nUse /tasks to see all tasks.`,
        parseMode: "HTML",
      };
    }

    case "save_memory": {
      const content = text.replace(/(?:remember|save|note|write down|keep in mind)\s*(?:that\s+|:?\s*)?/gi, "").trim();
      const memory = {
        id: makeId(), type: "long_term" as const,
        content: content || text, tags: ["telegram"],
        source: "telegram", createdAt: new Date().toISOString(),
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
      return { text: `<b>Active Tasks (${active.length})</b>\n\n${lines.join("\n")}`, parseMode: "HTML" };
    }

    case "list_reminders": {
      const upcoming = reminders
        .filter((r) => r.status === "pending")
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 5);
      if (upcoming.length === 0) return { text: "No upcoming reminders." };
      const lines = upcoming.map((r) => `• ${r.title} — ${new Date(r.scheduledAt).toLocaleDateString()}`);
      return { text: `<b>Upcoming Reminders</b>\n\n${lines.join("\n")}`, parseMode: "HTML" };
    }

    case "search": {
      const query = text.replace(/(?:search|find|look\s+(?:up|for))\s+/gi, "").trim().toLowerCase();
      const hits = memories.filter(
        (m) => m.content.toLowerCase().includes(query) || m.tags.some((t) => t.includes(query))
      );
      if (hits.length === 0) return { text: `No results for "${query}" in memory.` };
      const lines = hits.slice(0, 5).map((m) => `• ${m.content.slice(0, 100)}`);
      return { text: `<b>Search: "${query}"</b>\n\n${lines.join("\n")}`, parseMode: "HTML" };
    }

    case "mark_done": {
      const keyword = text.replace(/done|complete|finished|mark/gi, "").trim().toLowerCase();
      const match = tasks.find(
        (t) => (t.status === "pending" || t.status === "in_progress") && t.title.toLowerCase().includes(keyword)
      );
      if (match) {
        match.status = "done";
        match.updatedAt = new Date().toISOString();
        return { text: `<b>Task Complete!</b>\n\n"${match.title}" marked as done.`, parseMode: "HTML" };
      }
      return { text: `I couldn't find an active task matching that. Use /tasks to see the list.` };
    }

    case "team_info": {
      const active = teamMembers.filter((m) => m.status === "active");
      const lines = active.map((m) => `• ${m.fullName} — ${m.position}`);
      return {
        text: `<b>Active Team Members (${active.length})</b>\n\n${lines.join("\n")}\n\nUse /team for full details.`,
        parseMode: "HTML",
      };
    }

    case "appraisal": {
      const { handleCommand } = await import("./commands");
      return handleCommand("/appraisal", { message: ctx.message, accountId, args: [] });
    }

    case "status_query": {
      const provider = aiProviders.find((p) => p.isActive);
      return {
        text: `<b>System Online</b>\n\nAI: ${provider?.name ?? "Mock"} — ${provider?.model ?? "mock"}\nMode: Development\nAll systems operational.\n\nUse /status for full details.`,
        parseMode: "HTML",
      };
    }

    default: {
      // General conversational AI response — personalized with learned context
      const personalizedContext = buildPersonalizedContext();

      // Auto-save conversation to short-term memory
      memories.push({
        id: makeId(), type: "short_term",
        content: `User said: "${text.slice(0, 200)}"`,
        tags: ["telegram", "conversation"],
        source: "telegram", createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      let reply = getMockAiResponse();

      // Append team mention confirmation if any names were detected
      if (mentions.length > 0) {
        const mentionLines = mentions
          .map((m) => `• ${m.member.fullName} — saved as [${m.note.category}]`)
          .join("\n");
        reply += `\n\n<b>📝 Auto-saved to team data sheets:</b>\n${mentionLines}`;
      }

      if (personalizedContext) {
        reply += `\n${personalizedContext}`;
      }

      return { text: reply, parseMode: "HTML" };
    }
  }
}
