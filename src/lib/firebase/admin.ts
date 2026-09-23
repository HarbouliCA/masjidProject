/**
 * Firebase Admin SDK — server-only. Never imported into client bundles
 * (guarded by `server-only`). Credentials come from env, never from client.
 *
 * Configure one of:
 *   FIREBASE_SERVICE_ACCOUNT        = JSON string of the service-account key
 *   GOOGLE_APPLICATION_CREDENTIALS  = path to the key file (local dev / ADC)
 */
import "server-only";
import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getAuth as _getAuth } from "firebase-admin/auth";
import { getFirestore as _getFirestore } from "firebase-admin/firestore";

export function getAdminApp(): App | null {
  if (getApps().length > 0) return getApp();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    return initializeApp({ credential: cert(JSON.parse(raw)) });
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp(); // Application Default Credentials
  }
  return null;
}

export function getAdminAuth() {
  const app = getAdminApp();
  if (!app) throw new Error("Firebase Admin SDK is not configured (missing credentials)");
  return _getAuth(app);
}

export function getAdminFirestore() {
  const app = getAdminApp();
  if (!app) throw new Error("Firebase Admin SDK is not configured (missing credentials)");
  return _getFirestore(app);
}
