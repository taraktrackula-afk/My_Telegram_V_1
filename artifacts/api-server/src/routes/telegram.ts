import { Router } from "express";
import { accounts, settings } from "../mock/data";
import { routeMessage } from "../telegram/router";
import type { TelegramUpdate } from "../telegram/types";

const router = Router();

/**
 * Telegram Webhook Endpoint
 *
 * Register this URL with BotFather:
 *   POST https://api.telegram.org/bot<TOKEN>/setWebhook
 *   { "url": "https://<your-domain>/api/telegram/webhook/<accountId>" }
 *
 * accountId must be one of: acc-main, acc-secondary, acc-backup
 */
router.post("/telegram/webhook/:accountId", async (req, res) => {
  const { accountId } = req.params as { accountId: string };

  // Validate account exists
  const account = accounts.find((a) => a.id === accountId);
  if (!account) {
    res.status(403).json({ error: "Unknown account" });
    return;
  }

  const update = req.body as TelegramUpdate;

  // Only handle messages (ignore other update types for now)
  const message = update.message ?? update.edited_message;
  if (!message) {
    res.json({ ok: true });
    return;
  }

  // Whitelist check — verify sender is whitelisted
  const senderId = message.from?.id?.toString();
  if (senderId && !settings.whitelistedAccounts.includes(senderId)) {
    req.log.warn({ senderId, accountId }, "Unauthorized Telegram sender");
    res.json({ ok: true }); // silently ignore unauthorized senders
    return;
  }

  try {
    const { reply, chatId } = await routeMessage(message, accountId);

    // In production: call Telegram Bot API to send reply
    // await sendTelegramMessage(account.botToken, chatId, reply);
    // For now, return the reply in the response (useful for testing via curl/webhook.site)
    req.log.info(
      { accountId, chatId, intent: message.text?.startsWith("/") ? "command" : "natural" },
      "Telegram message processed"
    );

    res.json({
      ok: true,
      // method: "sendMessage",  // Telegram inline reply format (optional)
      // chat_id: chatId,
      // text: reply.text,
      // parse_mode: reply.parseMode,
      _debug: {
        processedBy: account.displayName,
        reply: reply.text.slice(0, 200),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Error processing Telegram message");
    res.status(500).json({ ok: false, error: "Internal error" });
  }
});

/**
 * Bot Status Endpoint
 * Returns configuration info for connecting real bot tokens
 */
router.get("/telegram/status", (_req, res) => {
  const status = accounts.map((a) => ({
    id: a.id,
    label: a.label,
    displayName: a.displayName,
    webhookUrl: `/api/telegram/webhook/${a.id}`,
    isActive: a.isActive,
    botConfigured: false, // Will be true when TELEGRAM_BOT_TOKEN_<LABEL> is set
    instructions: `To connect this account:\n1. Create a bot via @BotFather\n2. Copy the token\n3. Add TELEGRAM_BOT_TOKEN_${a.label.toUpperCase()} to your environment\n4. Register webhook: POST https://api.telegram.org/bot<TOKEN>/setWebhook with url=<your-domain>/api/telegram/webhook/${a.id}`,
  }));

  res.json({
    mode: "development",
    whitelistCount: settings.whitelistedAccounts.length,
    accounts: status,
  });
});

/**
 * Test endpoint — simulate a Telegram message without a real bot
 * POST /api/telegram/test { accountId, text }
 */
router.post("/telegram/test", async (req, res) => {
  const { accountId, text } = req.body as { accountId?: string; text?: string };

  if (!accountId || !text) {
    res.status(400).json({ error: "accountId and text are required" });
    return;
  }

  const account = accounts.find((a) => a.id === accountId);
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  // Simulate a Telegram message object
  const fakeMessage = {
    message_id: Math.floor(Math.random() * 100000),
    from: {
      id: parseInt(account.telegramId.replace("mock_", ""), 10) || 123456789,
      is_bot: false,
      first_name: account.displayName,
      username: account.username,
    },
    chat: {
      id: parseInt(account.telegramId.replace("mock_", ""), 10) || 123456789,
      type: "private" as const,
      first_name: account.displayName,
    },
    date: Math.floor(Date.now() / 1000),
    text,
  };

  try {
    const { reply } = await routeMessage(fakeMessage, accountId);
    res.json({
      input: { accountId, text },
      output: reply,
      account: account.displayName,
    });
  } catch (err) {
    res.status(500).json({ error: "Processing failed" });
  }
});

export default router;
