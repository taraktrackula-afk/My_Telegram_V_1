/**
 * Firebase Cloud Functions entry point.
 *
 * This file wraps the Express app as a Firebase HTTPS function.
 *
 * USAGE — In your Firebase Functions index.ts, add:
 *
 *   import * as functions from "firebase-functions";
 *   import app from "../../artifacts/api-server/src/app";
 *   export const api = functions.https.onRequest(app);
 *
 * Or use the v2 API for better cold start performance:
 *
 *   import { onRequest } from "firebase-functions/v2/https";
 *   import app from "../../artifacts/api-server/src/app";
 *   export const api = onRequest(app);
 *
 * NOTES:
 *   - Firebase Functions auto-provides PORT via the runtime; you do not set it.
 *   - Env vars are set via `firebase functions:secrets:set VAR_NAME`
 *     and declared in firebase.json under secretEnvironmentVariables.
 *   - The function name "api" becomes part of the URL:
 *       https://<region>-<project>.cloudfunctions.net/api
 *     Your Express routes are mounted at /api, so the full path is:
 *       https://<region>-<project>.cloudfunctions.net/api/api/tasks
 *     To avoid the double /api, you can either:
 *       a) Change Express to mount at "/" and remove the /api prefix, OR
 *       b) Name the Firebase function something other than "api" (e.g. "nexus")
 *          → https://<region>-<project>.cloudfunctions.net/nexus/api/tasks
 */

export { default as app } from "./app";
