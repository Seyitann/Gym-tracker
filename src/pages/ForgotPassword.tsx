import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, MailCheck } from "lucide-react";
import { sendPasswordReset } from "../api/auth";
import AuthShell from "../components/AuthShell";
import TextField from "../components/TextField";
import { btnPrimary, btnSoft } from "../ui";

const COOLDOWN = 60;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function send() {
    setError("");
    setSubmitting(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
      setCooldown(COOLDOWN);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void send();
  }

  return (
    <AuthShell
      title={sent ? "Check your inbox" : "Forgot your password?"}
      subtitle={
        sent
          ? "If an account exists for that address, a reset link is on its way."
          : "Enter your email and we'll send you a link to choose a new one."
      }
      footer={
        <Link to="/login" className="font-bold text-brand-600">
          Back to log in
        </Link>
      }
    >
      {sent ? (
        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl bg-mint-50 text-mint-600 flex items-center justify-center mx-auto mb-4">
            <MailCheck size={32} />
          </div>
          <p className="text-ink font-semibold break-words">{email.trim()}</p>
          <p className="text-muted text-sm mt-1">
            The link works once and expires after a while. Check spam or junk too.
          </p>
          {error && (
            <p role="alert" className="mt-4 text-sm text-brand-600 bg-brand-50 rounded-2xl px-4 py-3">
              {error}
            </p>
          )}
          <button
            onClick={() => void send()}
            disabled={cooldown > 0 || submitting}
            className={`${btnSoft} w-full mt-5`}
          >
            {cooldown > 0 ? `Send again in ${cooldown}s` : "Send again"}
          </button>
        </div>
      ) : (
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
          {error && (
            <p role="alert" className="text-sm text-brand-600 bg-brand-50 rounded-2xl px-4 py-3">
              {error}
            </p>
          )}
          <button type="submit" disabled={submitting} className={`${btnPrimary} w-full`}>
            {submitting ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
