import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from "firebase/app-check";
import type { FirebaseApp } from "firebase/app";

/**
 * App Check (plan §7 / §12 Phase 6). Enabled only when a reCAPTCHA site key is
 * provided — the console-side step (register the key under App Check in the
 * Firebase console) is documented in docs/HANDOVER.md.
 */
export function getAppCheck(app: FirebaseApp): AppCheck | null {
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY;
  if (!siteKey) return null;
  return initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
}
