"use client";
import { getApp, getApps, initializeApp } from "firebase/app";
import { readJSON } from "@/lib/http";
import { getAuth } from "firebase/auth";
export const configured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  );
export function browserAuth() {
  if (!configured())
    throw Error("CONFIG: Firebase authentication is not configured.");
  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      });
  return getAuth(app);
}
export async function establishSession() {
  const user = browserAuth().currentUser;
  if (!user) throw Error("Sign in first.");
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: await user.getIdToken() }),
  });
  await readJSON(response);
}
export async function uploadPrivateFile(path: string, file: File) {
  const { getStorage, ref, uploadBytes } = await import("firebase/storage");
  const auth = browserAuth();
  if (!auth.currentUser) throw Error("Sign in before uploading.");
  if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
    throw Error("CONFIG: Firebase Storage is not configured.");
  await uploadBytes(
    ref(
      getStorage(
        auth.app,
        `gs://${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}`,
      ),
      path,
    ),
    file,
    { contentType: file.type || "application/octet-stream" },
  );
}
