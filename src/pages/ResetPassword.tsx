import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { updatePassword } from "../api/auth";
import { supabase } from "../lib/supabase";
import AuthShell from "../components/AuthShell";
import TextField from "../components/TextField";
import { btnPrimary } from "../ui";

type Status = "checking" | "ready" | "invalid" | "done";

function readLinkError(): string {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  return hash.get("error_description") ?? query.get("error_description") ?? "";
}

// The reset email links here. Supabase signs the person in with a short-lived
// "recovery" session so they are allowed to set a new password.
export default function ResetPassword() {
  const navigate = useNavigate();
  const [linkError] = useState(readLinkError);
  const [status, setStatus] = useState<Status>(linkError ? "invalid" : "checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (linkError) return;
    let active = true;

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (active && event === "PASSWORD_RECOVERY") setStatus("ready");
    });

    supabase.auth.getSession().then(({ data: s }) => {
      if (active && s.session) setStatus((cur) => (cur === "checking" ? "ready" : cur));
    });

    const timer = window.setTimeout(() => {
      if (active) setStatus((cur) => (cur === "checking" ? "invalid" : cur));
    }, 5000);

    return () => {
      active = false;
      window.clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, [linkError]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      setStatus("done");
      window.setTimeout(() => navigate("/dashboard", { replace: true }), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your password.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "invalid") {
    return (
      <AuthShell
        title="That link didn't work"
        subtitle="Reset links expire and can only be used once."
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-500 flex items-center justify-center mx-auto mb-4">
            <TriangleAlert size={32} />
          </div>
          {linkError && <p className="text-muted text-sm mb-4">{linkError}</p>}
          <Link to="/forgot-password" className={`${btnPrimary} w-full`}>
            Get a new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (status === "done") {
    return (
      <AuthShell title="Password updated" subtitle="Taking you to the app...">
        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl bg-mint-50 text-mint-600 flex items-center justify-center mx-auto">
            <CircleCheck size={32} />
          </div>
        </div>
      </AuthShell>
    );
  }

  if (status === "checking") {
    return (
      <AuthShell title="Checking your link" subtitle="Just a moment...">
        <div className="flex justify-center py-6">
          <div
            role="status"
            aria-label="Checking"
            className="w-10 h-10 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin"
          />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Pick something you haven't used before.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="New password"
          type="password"
          value={password}
          onChange={setPassword}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
        <TextField
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={setConfirm}
          required
          autoComplete="new-password"
          placeholder="Type it again"
        />
        {error && (
          <p role="alert" className="text-sm text-brand-600 bg-brand-50 rounded-2xl px-4 py-3">
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting} className={`${btnPrimary} w-full`}>
          {submitting ? "Saving..." : "Save new password"}
        </button>
      </form>
    </AuthShell>
  );
}
