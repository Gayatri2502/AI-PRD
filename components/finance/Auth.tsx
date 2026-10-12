"use client";
import { useRef, useState } from "react";
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
    [created, setCreated] = useState(false),
    [confirmation, setConfirmation] = useState(""),
    [emailTouched, setEmailTouched] = useState(false),
    [success, setSuccess] = useState(false),
    [errorCode, setErrorCode] = useState("");
  const submitting = useRef(false);
  const newPassword = mode === "signup" || mode === "reset";
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const rules = [
    { label: "At least 12 characters", valid: password.length >= 12 },
    { label: "A number", valid: /\d/.test(password) },
    { label: "A special character", valid: /[^\w\s]/.test(password) },
  ];
  const score = rules.filter(rule => rule.valid).length;
  const valid = (mode === "reset" || emailValid) && (mode === "forgot" || (newPassword ? score === 3 && password === confirmation : password.length > 0));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current || !valid || success) return;
    submitting.current = true;
    setBusy(true);
    setMessage("");
    setErrorCode("");
    try {
      const auth = browserAuth();
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        await establishSession();
        setPassword("");
        setSuccess(true);
        setMessage("Signed in successfully. Opening your workspace…");
        location.assign("/dashboard");
      } else if (mode === "signup") {
        const result =
          created && auth.currentUser?.email === email
            ? { user: auth.currentUser }
            : await createUserWithEmailAndPassword(auth, email.trim(), password);
        setCreated(true);
        await sendEmailVerification(result.user).catch(() => {});
        await establishSession();
        setPassword("");
        setConfirmation("");
        setSuccess(true);
        setMessage("Account created. Opening your workspace…");
        location.assign("/dashboard");
      } else if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email.trim());
        setSuccess(true);
        setMessage("If an account exists, a recovery email is on its way.");
      } else {
        const code = new URLSearchParams(location.search).get("oobCode");
        if (!code)
          throw Error("Open the password recovery link from your email.");
        await confirmPasswordReset(auth, code, password);
        setPassword("");
        setConfirmation("");
        setSuccess(true);
        setMessage("Password updated. Returning to sign in…");
        location.assign("/login");
      }
    } catch (e) {
      const code = (e as { code?: string })?.code;
      setErrorCode(code || "session");
      if (mode !== "login" || code !== "auth/network-request-failed") {
        setPassword("");
        setConfirmation("");
      }
      if (code === "auth/email-already-in-use") {
        setMessage(
          "An account already exists for this email. Choose Back to sign in below, or reset your password.",
        );
        return;
      }
      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setMessage(
          "Email or password is incorrect. Try again or reset your password.",
        );
        return;
      }
      const errors: Record<string, string> = {
        "auth/user-not-found": mode === "forgot" ? "If an account exists, a recovery email is on its way." : "No account found with this email. Create an account below.",
        "auth/too-many-requests": "Too many attempts. Please wait before trying again, or recover your password.",
        "auth/network-request-failed": "Unable to connect. Check your connection and try again.",
        "auth/weak-password": "Choose a stronger password that meets the requirements below.",
        "auth/password-does-not-meet-requirements": "Your password does not meet the account security requirements. Choose a stronger password.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/user-disabled": "This account is disabled. Contact support for help.",
        "auth/expired-action-code": "This recovery link has expired. Request a new recovery email.",
        "auth/invalid-action-code": "This recovery link is invalid or has already been used. Request a new one.",
      };
      setMessage(errors[code || ""] || (created ? "Your account was created, but the secure session could not start. Sign in below to continue." : "Unable to complete sign-in securely. Please try again."));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <main id="main-content" className="auth-wrap">
      <Link className="brand" href="/">
        Folio<span>Finance</span>
      </Link>
      <form className="auth-box" onSubmit={submit} aria-busy={busy}>
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
              disabled={busy || success}
              onBlur={() => setEmailTouched(true)}
              aria-invalid={emailTouched && !emailValid}
              aria-describedby={emailTouched && !emailValid ? "email-error" : undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        )}
        {mode !== "reset" && emailTouched && !emailValid && <p id="email-error" className="auth-error">Enter a valid email address.</p>}
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
              disabled={busy || success}
              aria-invalid={errorCode === "auth/invalid-credential" || errorCode === "auth/wrong-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}
        {newPassword && <>
          <div className="password-guidance">
            <meter min={0} max={3} value={score} aria-label="Password requirements met" />
            <span>{score === 3 ? "Requirements met" : score > 1 ? "Getting stronger" : "Choose a strong password"}</span>
            <ul>{rules.map(rule => <li key={rule.label} data-met={rule.valid}>{rule.valid ? "✓" : "○"} {rule.label}</li>)}</ul>
          </div>
          <label>Confirm password<input type="password" autoComplete="new-password" required disabled={busy || success} value={confirmation} onChange={e => setConfirmation(e.target.value)} aria-describedby="password-match" aria-invalid={Boolean(confirmation && password !== confirmation)} /></label>
          {confirmation && <p id="password-match" className={password === confirmation ? "auth-success" : "auth-error"} aria-live="polite">{password === confirmation ? "Passwords match." : "Passwords do not match yet."}</p>}
        </>}
        {message && (
          <p role={success ? "status" : "alert"} className={`notice ${success ? "auth-success" : "auth-error"}`}>
            {message}
          </p>
        )}
        <button className="primary" disabled={busy || success || !valid || !configured()}>
          {busy
            ? mode === "login" ? "Signing in…" : mode === "signup" ? "Creating account…" : "Sending…"
            : success ? "✓ Done"
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
          {mode !== "forgot" && (
            <Link href="/forgot-password">Forgot password?</Link>
          )}
        </div>
      </form>
    </main>
  );
}
