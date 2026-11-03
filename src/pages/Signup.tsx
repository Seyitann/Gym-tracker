import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, User } from "lucide-react";
import { errorCode, registerUser } from "../api/auth";
import AuthShell from "../components/AuthShell";
import TextField from "../components/TextField";
import { btnPrimary } from "../ui";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [exists, setExists] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setExists(false);
    setSubmitting(true);
    try {
      const cleanEmail = email.trim();
      const result = await registerUser(cleanEmail, name.trim(), password);

      // With email confirmation on, Supabase answers an already-registered address
      // with a user that has no identities, and sends no email.
      if (result.user && (result.user.identities?.length ?? 1) === 0) {
        setExists(true);
        setError("An account with this email already exists.");
        return;
      }

      if (!result.session) {
        navigate("/verify-email", { state: { email: cleanEmail } });
        return;
      }
      navigate("/onboarding");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (errorCode(err) === "user_already_exists" || /already registered/i.test(message)) {
        setExists(true);
        setError("An account with this email already exists.");
      } else {
        setError(message || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Track workouts, weight and progress in one place."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-brand-600">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Name"
          value={name}
          onChange={setName}
          required
          autoComplete="name"
          placeholder="Your name"
          icon={<User size={18} />}
        />
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
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />

        {error && (
          <p role="alert" className="text-sm text-brand-600 bg-brand-50 rounded-2xl px-4 py-3">
            {error}
            {exists && (
              <>
                {" "}
                <Link to="/login" className="font-bold underline">
                  Log in
                </Link>{" "}
                or{" "}
                <Link to="/forgot-password" className="font-bold underline">
                  reset your password
                </Link>
                .
              </>
            )}
          </p>
        )}

        <button type="submit" disabled={submitting} className={`${btnPrimary} w-full`}>
          {submitting ? "Creating account..." : "Sign up"}
        </button>
      </form>
    </AuthShell>
  );
}
