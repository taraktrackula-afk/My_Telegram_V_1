/**
 * Firebase Admin SDK initialization.
 *
 * Lazy-initialised — the app only boots Firebase when env vars are present.
 * In development (no env vars), all exports are null and callers should
 * fall back to mock data.
 *
 * PRODUCTION WIRING:
 *   1. Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL
 *   2. The private key value must be the raw PEM string (replace literal \n with newlines)
 *   3. In Firebase Functions, you can use the process.env.FIREBASE_CONFIG auto-variable
 *
 * HOW TO SWAP MOCK DATA FOR FIRESTORE:
 *   - Import `db` from this file in your route handler
 *   - Replace array reads/writes with Firestore operations:
 *       const snap = await db.collection("tasks").get();
 *       return snap.docs.map(d => ({ id: d.id, ...d.data() }));
 */

import { config } from "./config";
import { logger } from "./logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _app: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _storage: any = null;

async function initFirebase() {
  if (!config.firebase.isConfigured) {
    logger.info("Firebase not configured — running with mock data");
    return;
  }

  try {
    // Dynamic imports — these packages are only available in the Firebase Functions runtime
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { initializeApp, getApps, cert, getApp } = await import(
      /* @vite-ignore */ "firebase-admin/app"
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { getFirestore } = await import(/* @vite-ignore */ "firebase-admin/firestore");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { getStorage } = await import(/* @vite-ignore */ "firebase-admin/storage");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    if (getApps().length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      _app = initializeApp({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        credential: cert({
          projectId: config.firebase.projectId,
          privateKey: config.firebase.privateKey.replace(/\\n/g, "\n"),
          clientEmail: config.firebase.clientEmail,
        }),
        storageBucket: config.firebase.storageBucket || undefined,
        databaseURL: config.firebase.databaseUrl || undefined,
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      _app = getApp();
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    _db = getFirestore(_app);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    _storage = getStorage(_app);
    logger.info({ projectId: config.firebase.projectId }, "Firebase Admin initialized");
  } catch (err) {
    logger.error({ err }, "Failed to initialize Firebase — will use mock data");
  }
}

await initFirebase();

export { _app as firebaseApp, _db as db, _storage as storage };

export function isFirebaseReady(): boolean {
  return _db !== null;
}
