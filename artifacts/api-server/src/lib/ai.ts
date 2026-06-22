/**
 * AI provider abstraction layer.
 *
 * Priority:
 *   1. Gemini (GEMINI_API_KEY) — primary
 *   2. OpenAI / GPT-4o (OPENAI_API_KEY) — fallback
 *   3. Mock provider — development fallback (no keys needed)
 *
 * PRODUCTION WIRING:
 *   - Set GEMINI_API_KEY in Firebase Functions secrets
 *   - Optionally set OPENAI_API_KEY for code/reasoning tasks
 *   - Import `generateAiResponse` in your AI route and replace getMockAiResponse()
 */

import { config } from "./config";
import { logger } from "./logger";

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiResponse {
  text: string;
  provider: string;
  model: string;
}

async function callGemini(messages: AiMessage[], systemPrompt?: string): Promise<AiResponse> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { GoogleGenerativeAI } = await import(/* @vite-ignore */ "@google/generative-ai");
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-001",
    systemInstruction: systemPrompt,
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const chat = model.startChat({ history });
  const lastMessage = messages.at(-1)?.content ?? "";
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const result = await chat.sendMessage(lastMessage);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const text: string = result.response.text();

  return { text, provider: "gemini", model: "gemini-2.0-flash-001" };
}

async function callOpenAi(messages: AiMessage[], systemPrompt?: string): Promise<AiResponse> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const OpenAI = (await import(/* @vite-ignore */ "openai")).default;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const client = new OpenAI({ apiKey: config.ai.openAiApiKey });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const text = (response.choices[0]?.message.content as string) ?? "";
  return { text, provider: "openai", model: "gpt-4o" };
}

function mockResponse(messages: AiMessage[]): AiResponse {
  const last = messages.at(-1)?.content ?? "";
  return {
    text: `[Mock AI] You said: "${last.slice(0, 100)}". In production, this will use Gemini or GPT-4o.`,
    provider: "mock",
    model: "mock-v1",
  };
}

/**
 * Generate an AI response. Automatically picks the best available provider.
 *
 * @param messages  Conversation history (last message is the user turn to respond to)
 * @param systemPrompt  Optional system/instruction prompt
 */
export async function generateAiResponse(
  messages: AiMessage[],
  systemPrompt?: string,
): Promise<AiResponse> {
  if (config.ai.hasGemini) {
    try {
      return await callGemini(messages, systemPrompt);
    } catch (err) {
      logger.error({ err }, "Gemini call failed, falling back");
    }
  }

  if (config.ai.hasOpenAi) {
    try {
      return await callOpenAi(messages, systemPrompt);
    } catch (err) {
      logger.error({ err }, "OpenAI call failed, falling back to mock");
    }
  }

  return mockResponse(messages);
}

export function getActiveProvider(): string {
  if (config.ai.hasGemini) return "gemini";
  if (config.ai.hasOpenAi) return "openai";
  return "mock";
}
