"use client";
import { useState } from "react";
import Link from "next/link";
import {
  browserAuth,
  configured,
  establishSession,
} from "@/lib/firebase/client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  sendEmailVerification,
} from "firebase/auth";
export default function Auth({
  mode,
}: {
  mode: "login" | "signup" | "forgot" | "reset";
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [created, setCreated] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const auth = browserAuth();
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        await establishSession();
        location.assign("/dashboard");
      } else if (mode === "signup") {
        const result =
          created && auth.currentUser?.email === email
            ? { user: auth.currentUser }
            : await createUserWithEmailAndPassword(auth, email, password);
        setCreated(true);
        await sendEmailVerification(result.user).catch(() => {});
        await establishSession();
        location.assign("/dashboard");
      } else if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email);
        setMessage("If an account exists, a recovery email is on its way.");
      } else {
        const code = new URLSearchParams(location.search).get("oobCode");
        if (!code)
          throw Error("Open the password recovery link from your email.");
        await confirmPasswordReset(auth, code, password);
        location.assign("/login");
      }
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === "auth/email-already-in-use") {
        setMessage(
          "An account already exists for this email. Choose Back to sign in below, or reset your password.",
        );
        return;
      }
      if (code === "auth/invalid-credential") {
        setMessage(
          "Email or password is incorrect. Try again or reset your password.",
        );
        return;
      }
      setMessage(
        mode === "forgot"
          ? "If an account exists, a recovery email is on its way."
          : e instanceof Error
            ? e.message
            : "Unable to continue.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main-content" className="auth-wrap">
      <Link className="brand" href="/">
        Folio<span>Finance</span>
      </Link>
      <form className="auth-box" onSubmit={submit}>
        <p className="eyebrow">YOUR BUSINESS, CLEARLY PRESENTED</p>
        <h1>
          {mode === "login"
            ? "Welcome back"
            : mode === "signup"
              ? "Create your workspace"
              : mode === "forgot"
                ? "Recover your account"
                : "Choose a new password"}
        </h1>
        <p>Project Reports and CMA Reports, in one private workspace.</p>
        {!configured() && (
          <p role="status" className="notice">
            Firebase is not configured. Add the project configuration to enable
            authentication.
          </p>
        )}
        {mode !== "reset" && (
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        )}
        {mode !== "forgot" && (
          <label>
            Password
            <input
              type="password"
              minLength={mode === "login" ? 1 : 12}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        <button className="primary" disabled={busy || !configured()}>
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : mode === "signup"
                ? created
                  ? "Continue to workspace"
                  : "Create account"
                : mode === "forgot"
                  ? "Send recovery email"
                  : "Update password"}
        </button>
        <div className="auth-links">
          <Link href={mode === "login" ? "/signup" : "/login"}>
            {mode === "login" ? "Create an account" : "Back to sign in"}
          </Link>
          {mode === "login" && (
            <Link href="/forgot-password">Forgot password?</Link>
          )}
        </div>
      </form>
    </main>
  );
}
