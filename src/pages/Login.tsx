import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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
    setSubmitting(true);
    try {
      await loginUser(email, password);
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(
        /invalid login/i.test(message) ? "Invalid email or password" : message || "Could not log in"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <h2 className="text-3xl font-bold text-yellow-400 text-center mb-6">Welcome Back</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              autoComplete="current-password"
              className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-gray-900 font-semibold py-2 rounded-lg transition"
          >
            {submitting ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="text-gray-400 text-sm text-center mt-4">
          Don't have an account?{" "}
          <Link to="/signup" className="text-yellow-400 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
