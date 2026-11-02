import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await registerUser(email, name, password);
      if (!result.session) {
        // "Confirm email" is still switched on in Supabase
        setError("Account created. Check your email to confirm it, then log in.");
        return;
      }
      navigate("/onboarding");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const code = (err as { code?: string }).code;
      if (code === "user_already_exists" || /already registered/i.test(message)) {
        setError("An account with this email already exists");
      } else {
        setError(message || "Something went wrong. Please try again");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <h2 className="text-3xl font-bold text-yellow-400 text-center mb-6">Create Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <p className="text-gray-500 text-xs mt-1">At least 6 characters</p>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-gray-900 font-semibold py-2 rounded-lg transition"
          >
            {submitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-gray-400 text-sm text-center mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-yellow-400 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
