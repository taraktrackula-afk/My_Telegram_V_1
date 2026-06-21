import { userPreferences, type UserPreference, makeId, memories } from "../mock/data";

// Patterns we track about the user's working style
const PREFERENCE_PATTERNS: Array<{
  key: string;
  detect: (text: string) => string | null;
}> = [
  {
    key: "response_length",
    detect: (t) => {
      if (/keep.{0,20}(short|brief|concise)|tldr|just.{0,10}summary/i.test(t)) return "concise";
      if (/more detail|elaborate|explain more|full breakdown/i.test(t)) return "detailed";
      return null;
    },
  },
  {
    key: "agenda_format",
    detect: (t) => {
      if (/bullet|list format|bullet points/i.test(t)) return "bullets";
      if (/numbered|number.{0,5}list/i.test(t)) return "numbered";
      if (/paragraph|prose|narrative/i.test(t)) return "prose";
      return null;
    },
  },
  {
    key: "task_priority_default",
    detect: (t) => {
      if (/always.{0,20}urgent|everything.{0,10}urgent/i.test(t)) return "urgent";
      if (/default.{0,10}high priority/i.test(t)) return "high";
      return null;
    },
  },
  {
    key: "meeting_agenda_focus",
    detect: (t) => {
      if (/always include.{0,20}(pending|open) (tasks|items)/i.test(t)) return "tasks_first";
      if (/start with.{0,20}(update|news|announcement)/i.test(t)) return "updates_first";
      if (/end with.{0,20}(action|decision)/i.test(t)) return "actions_last";
      return null;
    },
  },
  {
    key: "team_note_reminder",
    detect: (t) => {
      if (/remind me.{0,30}(appraisal|review|evaluation)/i.test(t)) return "wants_appraisal_reminders";
      return null;
    },
  },
];

export function learnFromMessage(text: string, accountId: string): void {
  for (const pattern of PREFERENCE_PATTERNS) {
    const value = pattern.detect(text);
    if (!value) continue;

    const existing = userPreferences.find((p) => p.key === pattern.key);
    if (existing) {
      // Reinforce existing preference
      existing.value = value;
      existing.confidence = Math.min(1, existing.confidence + 0.15);
      existing.learnedAt = new Date().toISOString();
      existing.examples.push(text.slice(0, 100));
      if (existing.examples.length > 5) existing.examples.shift();
    } else {
      // New preference learned
      userPreferences.push({
        key: pattern.key,
        value,
        learnedAt: new Date().toISOString(),
        confidence: 0.4,
        examples: [text.slice(0, 100)],
      });

      // Save to memory so AI can reference it
      memories.push({
        id: makeId(),
        type: "long_term",
        content: `User preference learned: ${pattern.key} = "${value}"`,
        tags: ["preference", "ai_learning"],
        source: "ai_learning",
        createdAt: new Date().toISOString(),
      });
    }
  }
}

export function getPreference(key: string): string | undefined {
  return userPreferences.find((p) => p.key === key && p.confidence >= 0.3)?.value;
}

export function buildPersonalizedContext(): string {
  if (userPreferences.length === 0) return "";
  const lines = userPreferences
    .filter((p) => p.confidence >= 0.3)
    .map((p) => `- ${p.key}: ${p.value} (confidence: ${Math.round(p.confidence * 100)}%)`);
  return lines.length ? `\n[Learned preferences]\n${lines.join("\n")}` : "";
}
