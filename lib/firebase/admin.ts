import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
export function firebaseAdmin() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (
    !projectId ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  )
    throw Error("CONFIG: Firebase server credentials are missing.");
  return (
    getApps().find((a) => a.name === "folio") ||
    initializeApp(
      {
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
        projectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      },
      "folio",
    )
  );
}
export const authAdmin = () => getAuth(firebaseAdmin());
export const firestore = () => getFirestore(firebaseAdmin());
export function privateBucket() {
  if (!process.env.FIREBASE_STORAGE_BUCKET)
    throw Error("CONFIG: Firebase private storage bucket is not configured.");
  return getStorage(firebaseAdmin()).bucket();
}
