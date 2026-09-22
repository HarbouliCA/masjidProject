import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseApp } from "../firebase/config";

/** Client Firestore instance, or null when Firebase is unconfigured. */
export function getFirestoreDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;
  return getFirestore(app);
}
