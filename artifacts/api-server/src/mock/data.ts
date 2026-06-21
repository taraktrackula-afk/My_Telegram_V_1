import { randomUUID } from "crypto";

export interface TelegramAccount {
  id: string;
  label: "main" | "secondary" | "backup";
  telegramId: string;
  username: string;
  displayName: string;
  isActive: boolean;
  lastSeen: string;
}

export interface Chat {
  id: string;
  accountId: string;
  title: string;
  type: "private" | "group" | "channel";
  lastMessage?: string;
  lastMessageAt?: string;
  messageCount: number;
  isArchived: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  sender: string;
  timestamp: string;
  hasAttachment: boolean;
  attachmentType?: "image" | "document" | "audio" | "video";
  attachmentUrl?: string;
}

export interface Memory {
  id: string;
  type: "short_term" | "long_term";
  content: string;
  tags: string[];
  source: string;
  createdAt: string;
  expiresAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "done" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  isRecurring: boolean;
  recurrence?: "daily" | "weekly" | "monthly";
  status: "pending" | "sent" | "dismissed";
  createdAt: string;
}

export interface AppraisalRecord {
  id: string;
  date: string;
  rating: number;
  feedback: string;
  reviewer: string;
}

export interface RecognitionRecord {
  id: string;
  date: string;
  type: string;
  description: string;
  awardedBy: string;
}

export interface TeamMember {
  id: string;
  employeeId: string;
  fullName: string;
  department: string;
  position: string;
  joiningDate: string;
  supervisor?: string;
  status: "active" | "inactive" | "on_leave";
  notes?: string;
  appraisals: AppraisalRecord[];
  recognitions: RecognitionRecord[];
  createdAt: string;
  updatedAt: string;
}

export type NoteCategory =
  | "performance"
  | "attendance"
  | "sick_leave"
  | "general"
  | "appraisal_note"
  | "recognition"
  | "incident"
  | "training"
  | "feedback";

export interface TeamMemberNote {
  id: string;
  memberId: string;
  category: NoteCategory;
  content: string;
  source: "telegram" | "manual" | "dashboard";
  chatContext?: string;
  recordedAt: string;
  recordedBy: string;
}

export interface UserPreference {
  key: string;
  value: string;
  learnedAt: string;
  confidence: number;
  examples: string[];
}

export interface AiProvider {
  id: string;
  name: string;
  model: string;
  isActive: boolean;
  isConfigured: boolean;
  status: "active" | "inactive" | "error" | "mock";
  requestCount: number;
}

export interface Document {
  id: string;
  name: string;
  type: "pdf" | "docx" | "txt" | "image" | "spreadsheet" | "other";
  source: "google_drive" | "google_sheets" | "telegram" | "manual";
  storageUrl?: string;
  size?: number;
  isIndexed: boolean;
  chunkCount: number;
  uploadedAt: string;
  tags: string[];
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  accountId?: string;
}

export interface Settings {
  appMode: "development" | "production";
  defaultAiProvider: string;
  memoryRetentionDays: number;
  autoSaveToSheets: boolean;
  autoSaveToDrive: boolean;
  ragEnabled: boolean;
  notificationsEnabled: boolean;
  telegramBotUsername?: string;
  whitelistedAccounts: string[];
}

// ─── ACCOUNTS ───
export const accounts: TelegramAccount[] = [
  {
    id: "acc-main",
    label: "main",
    telegramId: "mock_123456789",
    username: "owner_main",
    displayName: "Owner (Main)",
    isActive: true,
    lastSeen: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "acc-secondary",
    label: "secondary",
    telegramId: "mock_987654321",
    username: "owner_work",
    displayName: "Owner (Work)",
    isActive: true,
    lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "acc-backup",
    label: "backup",
    telegramId: "mock_111222333",
    username: "owner_backup",
    displayName: "Owner (Backup)",
    isActive: false,
    lastSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── CHATS ───
export const chats: Chat[] = [
  {
    id: "chat-1",
    accountId: "acc-main",
    title: "AI Assistant",
    type: "private",
    lastMessage: "Remind me about the team meeting tomorrow at 9am",
    lastMessageAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    messageCount: 247,
    isArchived: false,
  },
  {
    id: "chat-2",
    accountId: "acc-main",
    title: "Engineering Team",
    type: "group",
    lastMessage: "Sprint review is at 3pm",
    lastMessageAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    messageCount: 1842,
    isArchived: false,
  },
  {
    id: "chat-3",
    accountId: "acc-main",
    title: "Product Updates",
    type: "channel",
    lastMessage: "v2.4.0 released with new memory features",
    lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    messageCount: 523,
    isArchived: false,
  },
  {
    id: "chat-4",
    accountId: "acc-secondary",
    title: "Work AI Bot",
    type: "private",
    lastMessage: "Draft the Q3 performance review for Ali Hassan",
    lastMessageAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    messageCount: 89,
    isArchived: false,
  },
  {
    id: "chat-5",
    accountId: "acc-secondary",
    title: "Management Group",
    type: "group",
    lastMessage: "Budget review scheduled for Friday",
    lastMessageAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    messageCount: 674,
    isArchived: false,
  },
  {
    id: "chat-6",
    accountId: "acc-main",
    title: "Old Project Chat",
    type: "group",
    lastMessage: "Project completed",
    lastMessageAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    messageCount: 2310,
    isArchived: true,
  },
];

// ─── MESSAGES ───
export const messages: Message[] = [
  {
    id: "msg-1",
    chatId: "chat-1",
    role: "user",
    content: "What tasks do I have due this week?",
    sender: "Owner (Main)",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    hasAttachment: false,
  },
  {
    id: "msg-2",
    chatId: "chat-1",
    role: "assistant",
    content: "You have 3 tasks due this week:\n1. Q3 Performance Reviews (Due: Thursday) — High priority\n2. Update team handbook (Due: Friday) — Medium priority\n3. Review Ali's training records (Due: Friday) — Low priority\n\nWould you like me to reschedule any of them?",
    sender: "AI Assistant",
    timestamp: new Date(Date.now() - 29 * 60 * 1000).toISOString(),
    hasAttachment: false,
  },
  {
    id: "msg-3",
    chatId: "chat-1",
    role: "user",
    content: "Add a reminder for the team standup at 9am daily",
    sender: "Owner (Main)",
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    hasAttachment: false,
  },
  {
    id: "msg-4",
    chatId: "chat-1",
    role: "assistant",
    content: "Done! I've set a daily reminder for Team Standup at 9:00 AM. It will repeat every day starting tomorrow.",
    sender: "AI Assistant",
    timestamp: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
    hasAttachment: false,
  },
  {
    id: "msg-5",
    chatId: "chat-1",
    role: "user",
    content: "Remember: the quarterly board report is due on July 15th",
    sender: "Owner (Main)",
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    hasAttachment: false,
  },
  {
    id: "msg-6",
    chatId: "chat-1",
    role: "assistant",
    content: "Saved to long-term memory: Quarterly board report due July 15th. I'll remind you 3 days before the deadline.",
    sender: "AI Assistant",
    timestamp: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    hasAttachment: false,
  },
  {
    id: "msg-7",
    chatId: "chat-1",
    role: "user",
    content: "Remind me about the team meeting tomorrow at 9am",
    sender: "Owner (Main)",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    hasAttachment: false,
  },
  {
    id: "msg-8",
    chatId: "chat-4",
    role: "user",
    content: "Draft the Q3 performance review for Ali Hassan",
    sender: "Owner (Work)",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    hasAttachment: false,
  },
  {
    id: "msg-9",
    chatId: "chat-4",
    role: "assistant",
    content: "Here's a draft Q3 Performance Review for Ali Hassan (EMP002):\n\n**Overall Rating: 4/5**\n\nStrengths:\n- Consistently delivered tasks on time\n- Strong collaboration with the engineering team\n- Led 2 successful training sessions\n\nAreas for Improvement:\n- Documentation could be more thorough\n- Proactive communication on blockers\n\nShall I save this as an official appraisal record?",
    sender: "AI Assistant",
    timestamp: new Date(Date.now() - 44 * 60 * 1000).toISOString(),
    hasAttachment: false,
  },
];

// ─── MEMORIES ───
export const memories: Memory[] = [
  {
    id: "mem-1",
    type: "long_term",
    content: "Quarterly board report is due on July 15th",
    tags: ["deadline", "report", "board"],
    source: "telegram",
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "mem-2",
    type: "long_term",
    content: "Team uses Google Meet for video calls, not Zoom",
    tags: ["team", "tools", "communication"],
    source: "telegram",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mem-3",
    type: "long_term",
    content: "Ali Hassan's contract renewal is up in September 2026",
    tags: ["team", "hr", "contract"],
    source: "telegram",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mem-4",
    type: "short_term",
    content: "Currently working on Q3 performance reviews for all team members",
    tags: ["current", "hr", "appraisal"],
    source: "telegram",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mem-5",
    type: "long_term",
    content: "Preferred AI for coding tasks: GPT-4. Preferred AI for summaries: Gemini Pro",
    tags: ["preferences", "ai", "workflow"],
    source: "manual",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mem-6",
    type: "short_term",
    content: "Budget meeting is on Friday at 2pm with the finance team",
    tags: ["meeting", "budget", "finance"],
    source: "telegram",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── TASKS ───
export const tasks: Task[] = [
  {
    id: "task-1",
    title: "Q3 Performance Reviews",
    description: "Complete performance appraisals for all 3 team members before end of quarter",
    status: "in_progress",
    priority: "high",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["hr", "quarterly"],
  },
  {
    id: "task-2",
    title: "Update team handbook",
    description: "Add new remote work policies and updated onboarding checklist",
    status: "pending",
    priority: "medium",
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["documentation", "team"],
  },
  {
    id: "task-3",
    title: "Review Ali's training records",
    description: "Check completion of mandatory compliance training",
    status: "pending",
    priority: "low",
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["hr", "training"],
  },
  {
    id: "task-4",
    title: "Set up Firebase integration",
    description: "Configure Firebase Firestore as production backend to replace mock data",
    status: "pending",
    priority: "urgent",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["technical", "backend"],
  },
  {
    id: "task-5",
    title: "Connect Telegram webhooks",
    description: "Configure real Telegram bot tokens for all 3 accounts",
    status: "pending",
    priority: "high",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["technical", "telegram"],
  },
  {
    id: "task-6",
    title: "Board quarterly report",
    description: "Compile Q2 financials and team performance metrics for the board",
    status: "pending",
    priority: "urgent",
    dueDate: new Date("2026-07-15").toISOString(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["report", "board"],
  },
  {
    id: "task-7",
    title: "Onboard new developer",
    description: "Set up accounts, share documentation, and schedule intro calls",
    status: "done",
    priority: "high",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["hr", "onboarding"],
  },
];

// ─── REMINDERS ───
export const reminders: Reminder[] = [
  {
    id: "rem-1",
    title: "Team Standup",
    description: "Daily engineering standup",
    scheduledAt: new Date(new Date().setHours(9, 0, 0, 0) + 24 * 60 * 60 * 1000).toISOString(),
    isRecurring: true,
    recurrence: "daily",
    status: "pending",
    createdAt: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
  },
  {
    id: "rem-2",
    title: "Team Meeting",
    description: "Weekly team sync",
    scheduledAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    isRecurring: false,
    status: "pending",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "rem-3",
    title: "Board Report Deadline",
    description: "Quarterly board report due — 3 days warning",
    scheduledAt: new Date("2026-07-12").toISOString(),
    isRecurring: false,
    status: "pending",
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "rem-4",
    title: "Budget Meeting",
    description: "Finance team budget review",
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    isRecurring: false,
    status: "pending",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "rem-5",
    title: "Weekly Report",
    description: "Compile and send weekly team report to management",
    scheduledAt: new Date(new Date().setHours(17, 0, 0, 0) + 5 * 24 * 60 * 60 * 1000).toISOString(),
    isRecurring: true,
    recurrence: "weekly",
    status: "pending",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── TEAM ───
export const teamMembers: TeamMember[] = [
  {
    id: "emp-001",
    employeeId: "EMP001",
    fullName: "John Doe",
    department: "Engineering",
    position: "Senior Software Engineer",
    joiningDate: "2023-03-15",
    supervisor: "Owner",
    status: "active",
    notes: "Strong technical lead, mentoring junior devs",
    appraisals: [
      {
        id: "appr-1",
        date: "2026-03-15",
        rating: 5,
        feedback: "Exceptional performance this quarter. Delivered the new auth system ahead of schedule.",
        reviewer: "Owner",
      },
      {
        id: "appr-2",
        date: "2025-09-15",
        rating: 4,
        feedback: "Good performance. Could improve documentation habits.",
        reviewer: "Owner",
      },
    ],
    recognitions: [
      {
        id: "rec-1",
        date: "2026-05-20",
        type: "Star Performer",
        description: "Led the successful migration to the new infrastructure with zero downtime",
        awardedBy: "Owner",
      },
    ],
    createdAt: "2023-03-15T00:00:00Z",
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "emp-002",
    employeeId: "EMP002",
    fullName: "Ali Hassan",
    department: "Product",
    position: "Product Manager",
    joiningDate: "2023-08-01",
    supervisor: "Owner",
    status: "active",
    notes: "Contract renewal up September 2026",
    appraisals: [
      {
        id: "appr-3",
        date: "2026-03-01",
        rating: 4,
        feedback: "Consistent delivery. Strong collaboration with engineering. Documentation needs improvement.",
        reviewer: "Owner",
      },
    ],
    recognitions: [
      {
        id: "rec-2",
        date: "2026-02-14",
        type: "Team Player",
        description: "Bridged the gap between engineering and design during Q1 product launch",
        awardedBy: "Owner",
      },
    ],
    createdAt: "2023-08-01T00:00:00Z",
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "emp-003",
    employeeId: "EMP003",
    fullName: "Priya Sharma",
    department: "Design",
    position: "UX Designer",
    joiningDate: "2024-01-10",
    supervisor: "Owner",
    status: "on_leave",
    notes: "Currently on maternity leave, returning September 2026",
    appraisals: [
      {
        id: "appr-4",
        date: "2026-01-10",
        rating: 5,
        feedback: "Outstanding design work. Completely revamped the product UI. Users love the new experience.",
        reviewer: "Owner",
      },
    ],
    recognitions: [
      {
        id: "rec-3",
        date: "2025-12-01",
        type: "Innovation Award",
        description: "Redesigned the entire user onboarding flow, increasing conversion by 40%",
        awardedBy: "Owner",
      },
    ],
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── AI PROVIDERS ───
export const aiProviders: AiProvider[] = [
  {
    id: "mock",
    name: "Mock Provider",
    model: "mock-v1",
    isActive: true,
    isConfigured: true,
    status: "active",
    requestCount: 156,
  },
  {
    id: "gemini-1",
    name: "Gemini Pro 1",
    model: "gemini-2.0-flash",
    isActive: false,
    isConfigured: false,
    status: "inactive",
    requestCount: 0,
  },
  {
    id: "gemini-2",
    name: "Gemini Pro 2",
    model: "gemini-2.0-flash",
    isActive: false,
    isConfigured: false,
    status: "inactive",
    requestCount: 0,
  },
  {
    id: "gemini-3",
    name: "Gemini Ultra 3",
    model: "gemini-2.5-pro",
    isActive: false,
    isConfigured: false,
    status: "inactive",
    requestCount: 0,
  },
  {
    id: "gpt-4",
    name: "GPT-4o",
    model: "gpt-4o",
    isActive: false,
    isConfigured: false,
    status: "inactive",
    requestCount: 0,
  },
];

// ─── DOCUMENTS ───
export const documents: Document[] = [
  {
    id: "doc-1",
    name: "Team Handbook v2.pdf",
    type: "pdf",
    source: "google_drive",
    size: 245000,
    isIndexed: true,
    chunkCount: 48,
    uploadedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["hr", "policy"],
  },
  {
    id: "doc-2",
    name: "Employee Records",
    type: "spreadsheet",
    source: "google_sheets",
    size: 0,
    isIndexed: true,
    chunkCount: 12,
    uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["hr", "team"],
  },
  {
    id: "doc-3",
    name: "Q2 Financial Report.docx",
    type: "docx",
    source: "google_drive",
    size: 178000,
    isIndexed: false,
    chunkCount: 0,
    uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["finance", "quarterly"],
  },
  {
    id: "doc-4",
    name: "Product Roadmap.pdf",
    type: "pdf",
    source: "telegram",
    size: 520000,
    isIndexed: true,
    chunkCount: 73,
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["product", "planning"],
  },
  {
    id: "doc-5",
    name: "Meeting Notes 2026-06.txt",
    type: "txt",
    source: "manual",
    size: 8200,
    isIndexed: true,
    chunkCount: 8,
    uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["meetings", "notes"],
  },
];

// ─── TEAM MEMBER NOTES (one "sheet" per member, auto-saved from Telegram) ───
export const teamMemberNotes: TeamMemberNote[] = [
  {
    id: "tn-1",
    memberId: "emp-001",
    category: "performance",
    content: "John delivered the new auth system two days ahead of schedule. Exceptional focus and code quality.",
    source: "manual",
    recordedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    recordedBy: "Owner",
  },
  {
    id: "tn-2",
    memberId: "emp-001",
    category: "sick_leave",
    content: "John was sick and took two days off — 2026-05-12 and 2026-05-13. Doctor's note provided.",
    source: "manual",
    recordedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    recordedBy: "Owner",
  },
  {
    id: "tn-3",
    memberId: "emp-002",
    category: "performance",
    content: "Ali completed all Q2 deliverables on time. Customer satisfaction rating improved by 18%.",
    source: "manual",
    recordedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    recordedBy: "Owner",
  },
  {
    id: "tn-4",
    memberId: "emp-002",
    category: "appraisal_note",
    content: "Ali needs to improve documentation practices. Code is good but comments are sparse.",
    source: "telegram",
    chatContext: "Work AI Bot",
    recordedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    recordedBy: "Owner",
  },
  {
    id: "tn-5",
    memberId: "emp-003",
    category: "recognition",
    content: "Aisha redesigned the onboarding flow and increased conversion by 40%. Outstanding initiative.",
    source: "manual",
    recordedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    recordedBy: "Owner",
  },
];

// ─── AI LEARNED USER PREFERENCES ───
export const userPreferences: UserPreference[] = [];

// ─── SETTINGS ───
export let settings: Settings = {
  appMode: "development",
  defaultAiProvider: "mock",
  memoryRetentionDays: 30,
  autoSaveToSheets: false,
  autoSaveToDrive: false,
  ragEnabled: false,
  notificationsEnabled: true,
  telegramBotUsername: "",
  whitelistedAccounts: ["mock_123456789", "mock_987654321", "mock_111222333"],
};

// ─── MOCK AI RESPONSES ───
const mockResponses = [
  "I've processed your request and updated the relevant records. Is there anything else you'd like me to help with?",
  "Based on your previous conversations, I recall that you prefer concise summaries. Here's what I found: the task has been updated successfully.",
  "I've saved this to your long-term memory for future reference. I'll bring it up when relevant.",
  "Done! I've added that to your task list with high priority. Would you like me to set a reminder as well?",
  "I searched your documents and memory: this aligns with the policy in your Team Handbook (page 12). Want me to pull the relevant section?",
  "Noted! I'll keep this in mind for our future conversations. Your preferences help me give better responses.",
];

export function getMockAiResponse(): string {
  return mockResponses[Math.floor(Math.random() * mockResponses.length)];
}

export function makeId(): string {
  return randomUUID();
}

// Recent activity (computed from existing data)
export function getRecentActivity(): ActivityItem[] {
  return [
    {
      id: "act-1",
      type: "chat",
      description: 'New message in "AI Assistant" chat',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      accountId: "acc-main",
    },
    {
      id: "act-2",
      type: "memory",
      description: "New long-term memory saved: Board report deadline",
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      accountId: "acc-main",
    },
    {
      id: "act-3",
      type: "reminder",
      description: "Reminder set: Team Meeting tomorrow at 9am",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      accountId: "acc-main",
    },
    {
      id: "act-4",
      type: "chat",
      description: 'AI drafted Q3 review for Ali Hassan',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      accountId: "acc-secondary",
    },
    {
      id: "act-5",
      type: "task",
      description: "Task updated: Q3 Performance Reviews → In Progress",
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      accountId: "acc-main",
    },
  ];
}
