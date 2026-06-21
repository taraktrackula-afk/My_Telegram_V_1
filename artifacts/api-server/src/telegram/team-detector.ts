import { teamMembers, teamMemberNotes, makeId, type NoteCategory } from "../mock/data";

// Map lowercase keywords → note category
const CATEGORY_PATTERNS: Array<{ category: NoteCategory; patterns: RegExp }> = [
  { category: "sick_leave", patterns: /sick|unwell|ill|hospital|medical|doctor|fever|leave.*sick|took.*off.*sick/i },
  { category: "attendance", patterns: /late|absent|tardy|on time|punctual|attendance|didn't show|not.*present|arrived/i },
  { category: "performance", patterns: /perform|deliver|output|result|produc|quality|efficient|slow|fast|deadline|KPI|metric/i },
  { category: "training", patterns: /train|course|certif|workshop|seminar|learn|skill|upskill/i },
  { category: "incident", patterns: /incident|conflict|issue|complaint|problem|dispute|escalat/i },
  { category: "recognition", patterns: /good job|well done|excellent|amazing|outstanding|award|bonus|kudos|praise/i },
  { category: "appraisal_note", patterns: /apprais|review|evaluat|assessment|rating|score|grade/i },
  { category: "feedback", patterns: /feedback|comment|suggest|improve|noted|mention/i },
];

function detectCategory(text: string): NoteCategory {
  for (const { category, patterns } of CATEGORY_PATTERNS) {
    if (patterns.test(text)) return category;
  }
  return "general";
}

export interface DetectedMention {
  member: (typeof teamMembers)[0];
  note: (typeof teamMemberNotes)[0];
  isNew: boolean;
}

/**
 * Scans a Telegram message for team member name mentions.
 * When found, auto-creates a TeamMemberNote with the detected category.
 * Returns an array of all detected mentions (for confirmation reply).
 */
export function detectAndSaveTeamMentions(
  text: string,
  source: "telegram" | "manual" | "dashboard",
  chatContext: string,
  recordedBy: string
): DetectedMention[] {
  const detected: DetectedMention[] = [];

  for (const member of teamMembers) {
    // Match first name, full name, or employee ID
    const firstName = member.fullName.split(" ")[0]!;
    const nameParts = [
      member.fullName,
      firstName,
      member.employeeId,
    ].map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); // escape regex chars

    const nameRegex = new RegExp(`\\b(${nameParts.join("|")})\\b`, "i");
    if (!nameRegex.test(text)) continue;

    const category = detectCategory(text);

    // Avoid duplicate notes with identical content for same member within 30s
    const recentDuplicate = teamMemberNotes.find(
      (n) =>
        n.memberId === member.id &&
        n.content === text &&
        Date.now() - new Date(n.recordedAt).getTime() < 30_000
    );
    if (recentDuplicate) continue;

    const note = {
      id: makeId(),
      memberId: member.id,
      category,
      content: text,
      source,
      chatContext,
      recordedAt: new Date().toISOString(),
      recordedBy,
    };
    teamMemberNotes.push(note);
    detected.push({ member, note, isNew: true });
  }

  return detected;
}

export function getNotesForMember(memberId: string) {
  return teamMemberNotes
    .filter((n) => n.memberId === memberId)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
}

export function getNotesSummaryForAppraisal(memberId: string): string {
  const notes = getNotesForMember(memberId);
  if (notes.length === 0) return "No notes recorded yet.";

  const byCategory: Partial<Record<NoteCategory, string[]>> = {};
  for (const n of notes) {
    if (!byCategory[n.category]) byCategory[n.category] = [];
    byCategory[n.category]!.push(`• [${new Date(n.recordedAt).toLocaleDateString()}] ${n.content.slice(0, 120)}`);
  }

  const sections = Object.entries(byCategory).map(([cat, lines]) =>
    `${cat.toUpperCase().replace(/_/g, " ")} (${lines.length})\n${lines.slice(0, 5).join("\n")}`
  );
  return sections.join("\n\n");
}
