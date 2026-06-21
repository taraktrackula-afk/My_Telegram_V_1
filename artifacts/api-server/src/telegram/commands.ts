import {
  tasks,
  reminders,
  memories,
  teamMembers,
  aiProviders,
  accounts,
  documents,
  makeId,
  getMockAiResponse,
} from "../mock/data";
import { getNotesSummaryForAppraisal } from "./team-detector";
import { getPreference } from "./learning";
import type { TelegramMessage, BotReply } from "./types";

interface CommandContext {
  message: TelegramMessage;
  accountId: string;
  args: string[];
}

export async function handleCommand(
  command: string,
  ctx: CommandContext
): Promise<BotReply> {
  switch (command) {
    case "/help":
      return handleHelp();
    case "/status":
      return handleStatus(ctx);
    case "/tasks":
      return handleTasks();
    case "/addtask":
      return handleAddTask(ctx);
    case "/done":
      return handleDone(ctx);
    case "/reminders":
      return handleReminders();
    case "/remember":
      return handleRemember(ctx);
    case "/forget":
      return handleForget(ctx);
    case "/search":
      return handleSearch(ctx);
    case "/team":
      return handleTeam();
    case "/security_status":
      return handleSecurityStatus(ctx);
    case "/agenda":
      return handleAgenda(ctx);
    case "/appraisal":
      return handleAppraisalSummary(ctx);
    default:
      return {
        text: `Unknown command: <code>${command}</code>\n\nSend /help to see available commands.`,
        parseMode: "HTML",
      };
  }
}

function handleHelp(): BotReply {
  return {
    text: `<b>NEXUS AI Assistant</b> — Command Reference

<b>Tasks & Reminders</b>
/tasks — List all pending tasks
/addtask [title] — Create a new task
/done [task #] — Mark task as done
/reminders — List upcoming reminders

<b>Memory</b>
/remember [text] — Save to long-term memory
/forget [keyword] — Delete matching memories
/search [query] — Search memory and documents

<b>Team</b>
/team — List all team members

<b>System</b>
/status — System health and stats
/security_status — Whitelist and session info
/help — Show this menu

<i>Tip: You can also chat naturally — no commands needed. Just say what you need.</i>`,
    parseMode: "HTML",
  };
}

function handleStatus(ctx: CommandContext): BotReply {
  const account = accounts.find((a) => a.id === ctx.accountId);
  const activeProvider = aiProviders.find((p) => p.isActive);
  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;
  const totalMemories = memories.length;
  const upcomingReminders = reminders.filter((r) => r.status === "pending").length;

  return {
    text: `<b>System Status</b>

<b>Account:</b> ${account?.displayName ?? "Unknown"} (${account?.label ?? "?"})
<b>AI Provider:</b> ${activeProvider?.name ?? "None"} — ${activeProvider?.model ?? "N/A"}
<b>Mode:</b> DEVELOPMENT (mock data)

<b>Data Summary</b>
Tasks pending: ${pendingTasks}
Memories stored: ${totalMemories}
Upcoming reminders: ${upcomingReminders}
Team members: ${teamMembers.length}

<b>Integrations</b>
Telegram: Connected (mock)
Firebase: Not configured
Google Drive: Not configured
Google Sheets: Not configured

<i>Use /help to see all commands.</i>`,
    parseMode: "HTML",
  };
}

function handleTasks(): BotReply {
  const activeTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");

  if (activeTasks.length === 0) {
    return { text: "No active tasks. Use /addtask [title] to create one." };
  }

  const priorityEmoji: Record<string, string> = {
    urgent: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🟢",
  };

  const lines = activeTasks.map((t, i) => {
    const emoji = priorityEmoji[t.priority] ?? "⚪";
    const due = t.dueDate ? ` — due ${new Date(t.dueDate).toLocaleDateString()}` : "";
    const statusBadge = t.status === "in_progress" ? " [IN PROGRESS]" : "";
    return `${i + 1}. ${emoji} <b>${t.title}</b>${statusBadge}${due}`;
  });

  return {
    text: `<b>Active Tasks (${activeTasks.length})</b>\n\n${lines.join("\n")}\n\n<i>Say "mark task 1 done" or use /done 1</i>`,
    parseMode: "HTML",
  };
}

function handleAddTask(ctx: CommandContext): BotReply {
  const title = ctx.args.join(" ").trim();
  if (!title) {
    return { text: "Usage: /addtask [task title]\n\nExample: /addtask Review Q3 report by Friday" };
  }

  const now = new Date().toISOString();
  const task = {
    id: makeId(),
    title,
    status: "pending" as const,
    priority: "medium" as const,
    createdAt: now,
    updatedAt: now,
    tags: ["telegram"],
  };
  tasks.push(task);

  return {
    text: `<b>Task Created</b>\n\n"${title}"\n\nStatus: Pending | Priority: Medium\n\nUse /tasks to see all tasks.`,
    parseMode: "HTML",
  };
}

function handleDone(ctx: CommandContext): BotReply {
  const indexStr = ctx.args[0];
  const activeTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");

  if (!indexStr) {
    return { text: "Usage: /done [task number]\n\nUse /tasks to see task numbers." };
  }

  const idx = parseInt(indexStr, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx >= activeTasks.length) {
    return { text: `Invalid task number. There are ${activeTasks.length} active tasks. Use /tasks to see the list.` };
  }

  const task = activeTasks[idx]!;
  task.status = "done";
  task.updatedAt = new Date().toISOString();

  return {
    text: `<b>Task Complete!</b>\n\n"${task.title}" has been marked as done.`,
    parseMode: "HTML",
  };
}

function handleReminders(): BotReply {
  const upcoming = reminders
    .filter((r) => r.status === "pending")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  if (upcoming.length === 0) {
    return { text: "No upcoming reminders." };
  }

  const lines = upcoming.map((r, i) => {
    const when = new Date(r.scheduledAt).toLocaleString();
    const recur = r.isRecurring ? ` (${r.recurrence})` : "";
    return `${i + 1}. <b>${r.title}</b>${recur}\n   ${when}`;
  });

  return {
    text: `<b>Upcoming Reminders</b>\n\n${lines.join("\n\n")}`,
    parseMode: "HTML",
  };
}

function handleRemember(ctx: CommandContext): BotReply {
  const content = ctx.args.join(" ").trim();
  if (!content) {
    return { text: "Usage: /remember [text to remember]\n\nExample: /remember Office Wi-Fi password is nexus2026" };
  }

  const memory = {
    id: makeId(),
    type: "long_term" as const,
    content,
    tags: ["telegram", "manual"],
    source: "telegram",
    createdAt: new Date().toISOString(),
  };
  memories.push(memory);

  return {
    text: `<b>Saved to Memory</b>\n\n"${content}"\n\nThis will be recalled automatically in future conversations.`,
    parseMode: "HTML",
  };
}

function handleForget(ctx: CommandContext): BotReply {
  const keyword = ctx.args.join(" ").trim().toLowerCase();
  if (!keyword) {
    return { text: "Usage: /forget [keyword]\n\nExample: /forget password" };
  }

  const before = memories.length;
  const toDelete = memories.filter(
    (m) => m.content.toLowerCase().includes(keyword) || m.tags.some((t) => t.includes(keyword))
  );

  for (const m of toDelete) {
    const idx = memories.indexOf(m);
    if (idx > -1) memories.splice(idx, 1);
  }

  const deleted = before - memories.length;
  if (deleted === 0) {
    return { text: `No memories found matching "${keyword}".` };
  }

  return {
    text: `<b>Memories Deleted</b>\n\nRemoved ${deleted} memory entry${deleted > 1 ? "ies" : "y"} matching "${keyword}".`,
    parseMode: "HTML",
  };
}

function handleSearch(ctx: CommandContext): BotReply {
  const query = ctx.args.join(" ").trim().toLowerCase();
  if (!query) {
    return { text: "Usage: /search [query]\n\nExample: /search board report" };
  }

  const matchedMemories = memories.filter(
    (m) =>
      m.content.toLowerCase().includes(query) ||
      m.tags.some((t) => t.includes(query))
  );

  const matchedTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(query) ||
      (t.description ?? "").toLowerCase().includes(query)
  );

  if (matchedMemories.length === 0 && matchedTasks.length === 0) {
    return { text: `No results found for "${query}". Try a different keyword.` };
  }

  const parts: string[] = [`<b>Search Results for "${query}"</b>\n`];

  if (matchedMemories.length > 0) {
    parts.push(`<b>Memories (${matchedMemories.length})</b>`);
    matchedMemories.slice(0, 5).forEach((m) => {
      parts.push(`• [${m.type}] ${m.content.slice(0, 100)}${m.content.length > 100 ? "…" : ""}`);
    });
  }

  if (matchedTasks.length > 0) {
    parts.push(`\n<b>Tasks (${matchedTasks.length})</b>`);
    matchedTasks.slice(0, 5).forEach((t) => {
      parts.push(`• [${t.status}] ${t.title}`);
    });
  }

  return { text: parts.join("\n"), parseMode: "HTML" };
}

function handleTeam(): BotReply {
  if (teamMembers.length === 0) {
    return { text: "No team members found." };
  }

  const statusEmoji = { active: "🟢", inactive: "🔴", on_leave: "🟡" };
  const lines = teamMembers.map((m) => {
    const emoji = statusEmoji[m.status] ?? "⚪";
    return `${emoji} <b>${m.fullName}</b> (${m.employeeId})\n   ${m.position} — ${m.department}`;
  });

  return {
    text: `<b>Team Directory (${teamMembers.length} members)</b>\n\n${lines.join("\n\n")}`,
    parseMode: "HTML",
  };
}

function handleAgenda(ctx: CommandContext): BotReply {
  const format = getPreference("agenda_format") ?? "bullets";
  const focus = getPreference("meeting_agenda_focus") ?? "tasks_first";

  // Pull relevant RAG data from memories, tasks, reminders, and documents
  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const upcomingReminders = reminders
    .filter((r) => r.status === "pending")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);
  const recentMemories = memories
    .filter((m) => m.tags.includes("meetings") || m.tags.includes("agenda") || m.type === "long_term")
    .slice(-5);
  const indexedDocs = documents.filter((d) => d.isIndexed && d.tags.some((t) => ["meetings", "hr", "policy", "planning"].includes(t)));

  // Build agenda sections based on learned focus preference
  const sections: string[] = [];

  const header = `<b>📋 Meeting Agenda — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</b>\n`;

  if (focus === "updates_first") {
    sections.push(buildUpdatesSection(recentMemories, indexedDocs, format));
    sections.push(buildTasksSection(pendingTasks, format));
    sections.push(buildActionItemsSection(upcomingReminders, format));
  } else if (focus === "actions_last") {
    sections.push(buildTasksSection(pendingTasks, format));
    sections.push(buildUpdatesSection(recentMemories, indexedDocs, format));
    sections.push(buildActionItemsSection(upcomingReminders, format));
  } else {
    // Default: tasks_first
    sections.push(buildTasksSection(pendingTasks, format));
    sections.push(buildUpdatesSection(recentMemories, indexedDocs, format));
    sections.push(buildActionItemsSection(upcomingReminders, format));
  }

  sections.push(`\n<i>Generated from RAG data: ${memories.length} memories, ${documents.filter(d => d.isIndexed).length} indexed docs, ${pendingTasks.length} active tasks.\nSend /agenda again after any updates to refresh.</i>`);

  return { text: header + sections.join("\n\n"), parseMode: "HTML" };
}

function buildTasksSection(pendingTasks: typeof tasks, format: string): string {
  const urgentAndHigh = pendingTasks.filter((t) => t.priority === "urgent" || t.priority === "high");
  const items = urgentAndHigh.slice(0, 5);
  if (items.length === 0) return "<b>1. Open Tasks</b>\nNo urgent or high-priority items.";

  const lines =
    format === "numbered"
      ? items.map((t, i) => `${i + 1}. ${t.title}${t.dueDate ? ` (due ${new Date(t.dueDate).toLocaleDateString()})` : ""}`)
      : items.map((t) => `• ${t.title}${t.dueDate ? ` (due ${new Date(t.dueDate).toLocaleDateString()})` : ""}`);

  return `<b>1. Open Action Items (${urgentAndHigh.length} urgent/high)</b>\n${lines.join("\n")}`;
}

function buildUpdatesSection(recentMemories: typeof memories, docs: typeof documents, _format: string): string {
  const parts: string[] = [];
  if (recentMemories.length > 0) {
    parts.push(...recentMemories.slice(0, 3).map((m) => `• ${m.content.slice(0, 80)}`));
  }
  if (docs.length > 0) {
    parts.push(...docs.slice(0, 2).map((d) => `• [Doc] ${d.name}`));
  }
  if (parts.length === 0) return "<b>2. Updates & Notes</b>\nNo recent updates found.";
  return `<b>2. Updates & Notes</b>\n${parts.join("\n")}`;
}

function buildActionItemsSection(upcomingReminders: typeof reminders, _format: string): string {
  if (upcomingReminders.length === 0) return "<b>3. Upcoming Deadlines</b>\nNo upcoming deadlines.";
  const lines = upcomingReminders.map(
    (r) => `• ${r.title} — ${new Date(r.scheduledAt).toLocaleDateString()}`
  );
  return `<b>3. Upcoming Deadlines</b>\n${lines.join("\n")}`;
}

function handleAppraisalSummary(ctx: CommandContext): BotReply {
  const memberName = ctx.args.join(" ").trim();
  if (!memberName) {
    const list = teamMembers.map((m, i) => `${i + 1}. ${m.fullName} (${m.employeeId})`).join("\n");
    return {
      text: `<b>Appraisal Summary</b>\n\nUsage: /appraisal [name]\n\nTeam members:\n${list}`,
      parseMode: "HTML",
    };
  }

  const member = teamMembers.find(
    (m) =>
      m.fullName.toLowerCase().includes(memberName.toLowerCase()) ||
      m.employeeId.toLowerCase() === memberName.toLowerCase()
  );

  if (!member) {
    return { text: `No team member found matching "${memberName}". Use /appraisal to list all.` };
  }

  const summary = getNotesSummaryForAppraisal(member.id);
  const latestAppraisal = member.appraisals.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  return {
    text: `<b>Appraisal Summary — ${member.fullName}</b>\n${member.position} | ${member.department}\n\n<b>Last Formal Appraisal</b>\n${latestAppraisal ? `Rating: ${latestAppraisal.rating}/5 — ${latestAppraisal.feedback}` : "No formal appraisal yet."}\n\n<b>Recorded Notes</b>\n${summary}\n\n<i>Use /appraisal ${member.fullName.split(" ")[0]} for a fresh pull after new notes are added.</i>`,
    parseMode: "HTML",
  };
}

function handleSecurityStatus(ctx: CommandContext): BotReply {
  const account = accounts.find((a) => a.id === ctx.accountId);
  return {
    text: `<b>Security Status</b>

<b>Session Account:</b> ${account?.displayName ?? "Unknown"}
<b>Telegram ID:</b> <code>${account?.telegramId ?? "N/A"}</code>
<b>Access Level:</b> Owner (whitelisted)
<b>Mode:</b> Development (mock auth)

<b>Whitelisted Accounts:</b> 3 / 3 configured

<i>In production, session locking and audit logging will be active.</i>`,
    parseMode: "HTML",
  };
}
