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
    [busy, setBusy] = useState(false);
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
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await sendEmailVerification(result.user);
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
              minLength={12}
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
                ? "Create account"
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
