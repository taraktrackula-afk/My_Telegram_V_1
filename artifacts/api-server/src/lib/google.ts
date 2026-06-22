/**
 * Google Workspace API client (Sheets + Drive).
 *
 * Lazy-initialised — only active when GOOGLE_SERVICE_ACCOUNT_JSON is set.
 * In development, all exports are null and callers should skip sync silently.
 *
 * PRODUCTION WIRING:
 *   1. Create a service account in Google Cloud Console
 *   2. Grant it "Editor" access to your target Sheet and Drive folder
 *   3. Download the service account JSON key file
 *   4. Set GOOGLE_SERVICE_ACCOUNT_JSON = the full JSON file content (as a string)
 *   5. Set GOOGLE_SHEETS_ID = your spreadsheet ID (from the URL)
 *   6. Set GOOGLE_DRIVE_FOLDER_ID = your Drive folder ID (from the URL)
 */

import { config } from "./config";
import { logger } from "./logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _auth: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sheets: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _drive: any = null;

async function initGoogle() {
  if (!config.google.isConfigured) {
    logger.info("Google APIs not configured — sync disabled");
    return;
  }

  try {
    // Dynamic import — only available in production
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { google } = await import(/* @vite-ignore */ "googleapis");

    let credentials: Record<string, unknown>;
    try {
      credentials = JSON.parse(config.google.serviceAccountJson) as Record<string, unknown>;
    } catch {
      logger.error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    _auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    _sheets = google.sheets({ version: "v4", auth: _auth });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    _drive = google.drive({ version: "v3", auth: _auth });

    logger.info("Google APIs initialized (Sheets + Drive)");
  } catch (err) {
    logger.error({ err }, "Failed to initialize Google APIs — sync will be disabled");
  }
}

await initGoogle();

export { _auth as googleAuth, _sheets as sheets, _drive as drive };

export function isGoogleReady(): boolean {
  return _sheets !== null && _drive !== null;
}

/**
 * Append rows to a named sheet tab.
 * No-op if Google is not configured.
 */
export async function appendToSheet(
  tabName: string,
  rows: (string | number | boolean | null)[][],
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (!_sheets || !config.google.sheetsId) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await _sheets.spreadsheets.values.append({
      spreadsheetId: config.google.sheetsId,
      range: `${tabName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rows },
    });
  } catch (err) {
    logger.error({ err, tabName }, "Failed to append to Google Sheet");
  }
}

/**
 * Upload a buffer to Google Drive and return the file URL.
 * Returns null if Google is not configured.
 */
export async function uploadToDrive(
  fileName: string,
  mimeType: string,
  buffer: Buffer,
): Promise<string | null> {
  if (!_drive) return null;

  const { Readable } = await import("node:stream");

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const res = await _drive.files.create({
      requestBody: {
        name: fileName,
        parents: config.google.driveFolderId ? [config.google.driveFolderId] : undefined,
      },
      media: { mimeType, body: Readable.from(buffer) },
      fields: "id,webViewLink",
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return (res.data.webViewLink as string) ?? null;
  } catch (err) {
    logger.error({ err, fileName }, "Failed to upload to Google Drive");
    return null;
  }
}
