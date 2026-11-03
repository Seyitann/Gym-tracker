import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { errorCode, loginUser, resendConfirmation } from "../api/auth";
import { supabase } from "../lib/supabase";
import AuthShell from "../components/AuthShell";
import TextField from "../components/TextField";
import { btnPrimary } from "../ui";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Already signed in? Go straight to the app.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard", { replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setNeedsConfirm(false);
    setSubmitting(true);
    try {
      await loginUser(email.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (errorCode(err) === "email_not_confirmed" || /not confirmed/i.test(message)) {
        setNeedsConfirm(true);
        setError("Please confirm your email first. We sent you a link when you signed up.");
      } else if (/invalid login/i.test(message)) {
        setError("That email and password don't match.");
      } else {
        setError(message || "Could not log in. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setInfo("");
    try {
      await resendConfirmation(email.trim());
      setInfo("A new confirmation email is on its way.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend the email.");
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to pick up where you left off."
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className="font-bold text-brand-600">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
          autoComplete="email"
          placeholder="you@example.com"
          icon={<Mail size={18} />}
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
          placeholder="Your password"
        />

        <div className="text-right -mt-1">
          <Link to="/forgot-password" className="text-sm font-semibold text-brand-600">
            Forgot password?
          </Link>
        </div>

        {error && (
          <p role="alert" className="text-sm text-brand-600 bg-brand-50 rounded-2xl px-4 py-3">
            {error}
          </p>
        )}
        {needsConfirm && (
          <button type="button" onClick={handleResend} className="text-sm font-bold text-brand-600">
            Resend confirmation email
          </button>
        )}
        {info && <p className="text-sm text-mint-600 bg-mint-50 rounded-2xl px-4 py-3">{info}</p>}

        <button type="submit" disabled={submitting} className={`${btnPrimary} w-full`}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
