/**
 * Type stubs for optional production-only dependencies.
 *
 * These packages are not installed in development — they live on the Firebase
 * Functions runtime. Declaring them here lets TypeScript compile without errors.
 * At runtime, the dynamic imports in lib/firebase.ts, lib/google.ts, and lib/ai.ts
 * will succeed only when the packages are actually installed (i.e. in production).
 */

declare module "firebase-admin/app";
declare module "firebase-admin/firestore";
declare module "firebase-admin/storage";
declare module "firebase-admin/auth";
declare module "firebase-functions";
declare module "firebase-functions/v2/https";
declare module "googleapis";
declare module "@google/generative-ai";
declare module "openai";
