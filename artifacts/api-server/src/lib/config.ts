/**
 * Centralized environment variable configuration.
 * All env vars are read here — routes and lib files import from this module.
 *
 * In development: most vars are optional and fall back to mock/disabled behaviour.
 * In production: required vars throw at startup if missing, so you know immediately.
 */

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

function optional(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

const isProd = process.env.NODE_ENV === "production";

export const config = {
  env: isProd ? "production" : "development",
  isProduction: isProd,

  server: {
    port: parseInt(process.env.PORT ?? "8080", 10),
    sessionSecret: optional("SESSION_SECRET", "dev-session-secret-change-in-prod"),
    corsOrigin: optional("CORS_ORIGIN", "*"),
  },

  firebase: {
    projectId: optional("FIREBASE_PROJECT_ID"),
    privateKey: optional("FIREBASE_PRIVATE_KEY"),
    clientEmail: optional("FIREBASE_CLIENT_EMAIL"),
    storageBucket: optional("FIREBASE_STORAGE_BUCKET"),
    databaseUrl: optional("FIREBASE_DATABASE_URL"),
    get isConfigured() {
      return !!(this.projectId && this.privateKey && this.clientEmail);
    },
  },

  google: {
    serviceAccountJson: optional("GOOGLE_SERVICE_ACCOUNT_JSON"),
    sheetsId: optional("GOOGLE_SHEETS_ID"),
    driveFolderId: optional("GOOGLE_DRIVE_FOLDER_ID"),
    get isConfigured() {
      return !!this.serviceAccountJson;
    },
  },

  ai: {
    geminiApiKey: optional("GEMINI_API_KEY"),
    openAiApiKey: optional("OPENAI_API_KEY"),
    get hasGemini() {
      return !!this.geminiApiKey;
    },
    get hasOpenAi() {
      return !!this.openAiApiKey;
    },
  },

  telegram: {
    tokenMain: optional("TELEGRAM_BOT_TOKEN_MAIN"),
    tokenSecondary: optional("TELEGRAM_BOT_TOKEN_SECONDARY"),
    tokenBackup: optional("TELEGRAM_BOT_TOKEN_BACKUP"),
    webhookSecret: optional("TELEGRAM_WEBHOOK_SECRET"),
    get tokensConfigured() {
      return {
        main: !!this.tokenMain,
        secondary: !!this.tokenSecondary,
        backup: !!this.tokenBackup,
      };
    },
  },
} as const;

export type Config = typeof config;
