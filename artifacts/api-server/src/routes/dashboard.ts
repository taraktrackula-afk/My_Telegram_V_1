import { Router } from "express";
import {
  accounts,
  chats,
  memories,
  tasks,
  reminders,
  teamMembers,
  documents,
  aiProviders,
  getRecentActivity,
} from "../mock/data";

const router = Router();

router.get("/dashboard/summary", (_req, res) => {
  const activeProvider = aiProviders.find((p) => p.isActive);
  const totalMessages = chats.reduce((sum, c) => sum + c.messageCount, 0);
  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;
  const now = new Date();
  const upcomingReminders = reminders.filter(
    (r) => r.status === "pending" && new Date(r.scheduledAt) > now
  ).length;
  const documentsIndexed = documents.filter((d) => d.isIndexed).length;
  const accountsActive = accounts.filter((a) => a.isActive).length;

  res.json({
    totalChats: chats.length,
    totalMessages,
    totalMemories: memories.length,
    pendingTasks,
    upcomingReminders,
    teamMembersCount: teamMembers.length,
    documentsIndexed,
    activeProvider: activeProvider?.name ?? "None",
    accountsActive,
    recentActivity: getRecentActivity(),
  });
});

export default router;
