# NEXUS — Production Deployment Guide

This guide covers the full deployment path:
**GitHub → Google AI Studio (Firebase wiring) → GitHub → Vercel**

---

## Architecture Overview

```
┌─────────────────────┐   HTTPS   ┌───────────────────────────────┐
│  Vercel (Frontend)  │ ────────► │  Firebase Cloud Functions      │
│  React + Vite SPA   │           │  Express API (Node.js)         │
└─────────────────────┘           └───────────────────────────────┘
                                          │         │         │
                                   ┌──────┘   ┌────┘   ┌─────┘
                                   ▼          ▼        ▼
                               Firestore  Google     Telegram
                                 (DB)   Sheets/Drive  Bot API
                                              │
                                         Gemini API
```

---

## Phase 1 — Firebase Setup (Google AI Studio)

### 1.1 Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → give it a name (e.g. `nexus-ai`)
3. Enable **Firestore Database** → Start in **production mode**
4. Enable **Storage** (for file uploads)

### 1.2 Get Service Account Credentials

1. Firebase Console → **Project Settings** → **Service Accounts**
2. Click **Generate new private key** → download the JSON file
3. You'll need these values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

### 1.3 Enable Firebase Cloud Functions

```bash
npm install -g firebase-tools
firebase login
firebase init functions
# Select your project, TypeScript, no ESLint
```

### 1.4 Wire the Express App as a Firebase Function

In your Firebase Functions `src/index.ts`:

```typescript
import * as functions from "firebase-functions";
import app from "../../artifacts/api-server/src/app";

export const api = functions.https.onRequest(app);
```

> **Important:** The Express app is already configured. You only need to export it.

### 1.5 Set Firebase Secrets

Run these one by one in your terminal:

```bash
firebase functions:secrets:set FIREBASE_PROJECT_ID
firebase functions:secrets:set FIREBASE_CLIENT_EMAIL
firebase functions:secrets:set FIREBASE_PRIVATE_KEY
firebase functions:secrets:set FIREBASE_STORAGE_BUCKET
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set TELEGRAM_BOT_TOKEN_MAIN
firebase functions:secrets:set TELEGRAM_BOT_TOKEN_SECONDARY
firebase functions:secrets:set TELEGRAM_BOT_TOKEN_BACKUP
firebase functions:secrets:set TELEGRAM_WEBHOOK_SECRET
firebase functions:secrets:set SESSION_SECRET
firebase functions:secrets:set CORS_ORIGIN
firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT_JSON
firebase functions:secrets:set GOOGLE_SHEETS_ID
firebase functions:secrets:set GOOGLE_DRIVE_FOLDER_ID
```

### 1.6 Update firebase.json

```json
{
  "functions": {
    "source": ".",
    "runtime": "nodejs20",
    "secretEnvironmentVariables": [
      "FIREBASE_PROJECT_ID",
      "FIREBASE_CLIENT_EMAIL",
      "FIREBASE_PRIVATE_KEY",
      "FIREBASE_STORAGE_BUCKET",
      "GEMINI_API_KEY",
      "OPENAI_API_KEY",
      "TELEGRAM_BOT_TOKEN_MAIN",
      "TELEGRAM_BOT_TOKEN_SECONDARY",
      "TELEGRAM_BOT_TOKEN_BACKUP",
      "TELEGRAM_WEBHOOK_SECRET",
      "SESSION_SECRET",
      "CORS_ORIGIN",
      "GOOGLE_SERVICE_ACCOUNT_JSON",
      "GOOGLE_SHEETS_ID",
      "GOOGLE_DRIVE_FOLDER_ID"
    ]
  }
}
```

### 1.7 Swap Mock Data for Firestore (The Real Wiring)

Each route handler currently reads from `artifacts/api-server/src/mock/data.ts`.
Replace with Firestore calls using the `db` export from `src/lib/firebase.ts`:

```typescript
// BEFORE (mock):
import { tasks } from "../mock/data";
const all = tasks.filter(t => !status || t.status === status);

// AFTER (Firestore):
import { db } from "../lib/firebase";
const snap = await db!.collection("tasks").get();
const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
```

**Collections to create in Firestore:**
| Collection | Description |
|---|---|
| `tasks` | Task manager items |
| `memories` | Long-term + short-term memory |
| `reminders` | Scheduled reminders |
| `chats` | Telegram chat threads |
| `messages` | Messages per chat |
| `team_members` | Employee directory |
| `appraisals` | Performance records |
| `documents` | RAG document library |
| `personal_notes` | Personal notes, goals, reflections |
| `collections` | Custom collections (snags, reports, logs) |
| `collection_entries` | Entries per collection |
| `settings` | App-wide settings |
| `accounts` | Telegram account records |
| `activity` | Recent activity feed |

### 1.8 Deploy to Firebase

```bash
firebase deploy --only functions
```

**Note your Functions URL:** `https://us-central1-<project-id>.cloudfunctions.net/api`

---

## Phase 2 — Vercel Deployment (Frontend)

### 2.1 Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Set **Framework Preset** to `Vite`
4. Set **Root Directory** to `artifacts/assistant`
5. Set **Build Command** to:
   ```
   cd ../.. && pnpm install && pnpm --filter @workspace/assistant run build
   ```
6. Set **Output Directory** to `dist/public`

### 2.2 Add Environment Variables on Vercel

In Vercel → Project → Settings → **Environment Variables**, add:

| Variable | Value | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `https://us-central1-<project>.cloudfunctions.net/api` | Your Firebase Functions URL |
| `VITE_APP_NAME` | `NEXUS` | Optional |
| `NODE_ENV` | `production` | |

> ⚠️ Never put Firebase keys, Telegram tokens, or Gemini keys in Vercel env vars — those are backend secrets. Only `VITE_*` vars belong here.

### 2.3 Deploy

Click **Deploy**. Vercel will build and publish the React app.

**Note your Vercel domain:** `https://nexus-app.vercel.app`

---

## Phase 3 — Connect Firebase CORS to Vercel

Go back to Firebase and update the `CORS_ORIGIN` secret:

```bash
firebase functions:secrets:set CORS_ORIGIN
# Enter: https://nexus-app.vercel.app
```

Then redeploy:
```bash
firebase deploy --only functions
```

---

## Phase 4 — Register Telegram Webhooks

For each of the 3 Telegram bots, run this (replace `<TOKEN>` and `<FUNCTIONS_URL>`):

**Main account:**
```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN_MAIN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://us-central1-<project>.cloudfunctions.net/api/api/telegram/webhook/acc-main","secret_token":"<TELEGRAM_WEBHOOK_SECRET>"}'
```

**Secondary account:**
```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN_SECONDARY>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://us-central1-<project>.cloudfunctions.net/api/api/telegram/webhook/acc-secondary","secret_token":"<TELEGRAM_WEBHOOK_SECRET>"}'
```

**Backup account:**
```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN_BACKUP>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://us-central1-<project>.cloudfunctions.net/api/api/telegram/webhook/acc-backup","secret_token":"<TELEGRAM_WEBHOOK_SECRET>"}'
```

**Verify webhook is registered:**
```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

---

## Phase 5 — Google Sheets + Drive Setup

### 5.1 Create a Service Account

1. [console.cloud.google.com](https://console.cloud.google.com) → **IAM & Admin** → **Service Accounts**
2. **Create Service Account** → give it a name (e.g. `nexus-sync`)
3. Skip role selection (you'll grant access at the resource level)
4. Click the service account → **Keys** → **Add Key** → **Create new key** → JSON
5. Download the JSON file — this is your `GOOGLE_SERVICE_ACCOUNT_JSON`

### 5.2 Create Google Sheet

1. Create a new Google Spreadsheet
2. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`
3. **Share** the spreadsheet with your service account email (e.g. `nexus-sync@project.iam.gserviceaccount.com`) with **Editor** access

**Recommended tab names to create in the sheet:**
- `Tasks` | `Memory` | `Reminders` | `Team` | `Documents` | `Collections` | `Activity`

### 5.3 Create Google Drive Folder

1. Create a folder in Google Drive for document uploads
2. **Share** the folder with your service account email (Editor access)
3. Copy the folder ID from the URL: `https://drive.google.com/drive/folders/<FOLDER_ID>`

### 5.4 Set Secrets

```bash
firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT_JSON
# Paste the entire contents of your service account JSON file on one line

firebase functions:secrets:set GOOGLE_SHEETS_ID
# Paste your spreadsheet ID

firebase functions:secrets:set GOOGLE_DRIVE_FOLDER_ID
# Paste your folder ID
```

---

## Environment Variable Quick Reference

### Backend (Firebase Functions secrets)

| Variable | Where to get it |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase Console → Project Settings |
| `FIREBASE_CLIENT_EMAIL` | Service account JSON |
| `FIREBASE_PRIVATE_KEY` | Service account JSON → private_key field |
| `FIREBASE_STORAGE_BUCKET` | Firebase Console → Storage → bucket name |
| `GEMINI_API_KEY` | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `TELEGRAM_BOT_TOKEN_MAIN` | @BotFather on Telegram |
| `TELEGRAM_BOT_TOKEN_SECONDARY` | @BotFather on Telegram |
| `TELEGRAM_BOT_TOKEN_BACKUP` | @BotFather on Telegram |
| `TELEGRAM_WEBHOOK_SECRET` | Any random 32+ char string |
| `SESSION_SECRET` | Any random 32+ char string |
| `CORS_ORIGIN` | Your Vercel domain (e.g. `https://nexus.vercel.app`) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google Cloud Console → Service Account → Key |
| `GOOGLE_SHEETS_ID` | From Google Sheets URL |
| `GOOGLE_DRIVE_FOLDER_ID` | From Google Drive folder URL |

### Frontend (Vercel environment variables)

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | Your Firebase Functions URL |
| `NODE_ENV` | `production` |

---

## Deployment Checklist

- [ ] Firebase project created with Firestore + Storage enabled
- [ ] Firebase Functions initialized and Express app exported as function
- [ ] All Firebase secrets set (`firebase functions:secrets:set ...`)
- [ ] Mock data replaced with Firestore calls in route handlers
- [ ] Firebase deployed: `firebase deploy --only functions`
- [ ] Firebase Functions URL noted
- [ ] Vercel project created from GitHub repo
- [ ] Vercel build settings configured (root dir, build command, output dir)
- [ ] `VITE_API_BASE_URL` set on Vercel pointing to Firebase URL
- [ ] Vercel deployed
- [ ] Vercel domain noted
- [ ] `CORS_ORIGIN` secret updated in Firebase with Vercel domain
- [ ] Firebase redeployed after CORS update
- [ ] Telegram webhooks registered for all 3 bots
- [ ] Google service account created and JSON key downloaded
- [ ] Google Sheet created with service account as Editor
- [ ] Google Drive folder created with service account as Editor
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEETS_ID`, `GOOGLE_DRIVE_FOLDER_ID` set
- [ ] End-to-end test: send `/tasks` to each Telegram bot, check dashboard
- [ ] End-to-end test: sync button on dashboard triggers Sheets sync

---

## File Reference

| File | Purpose |
|---|---|
| `artifacts/api-server/src/lib/config.ts` | All env var reading — single place to audit |
| `artifacts/api-server/src/lib/firebase.ts` | Firebase Admin init — import `db` here for Firestore |
| `artifacts/api-server/src/lib/google.ts` | Google Sheets + Drive client + `appendToSheet()` / `uploadToDrive()` helpers |
| `artifacts/api-server/src/lib/ai.ts` | `generateAiResponse()` — auto-selects Gemini → OpenAI → Mock |
| `artifacts/api-server/src/firebase-entry.ts` | Firebase Functions entry point — wraps Express app |
| `artifacts/api-server/src/mock/data.ts` | All mock data — swap each array with Firestore in Phase 1.7 |
| `artifacts/api-server/.env.example` | Backend env var template with documentation |
| `artifacts/assistant/.env.example` | Frontend env var template |
