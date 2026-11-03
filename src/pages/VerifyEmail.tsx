import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { resendConfirmation } from "../api/auth";
import { supabase } from "../lib/supabase";
import AuthShell from "../components/AuthShell";
import { btnQuiet, btnSoft } from "../ui";

const COOLDOWN = 60;

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as { email?: string } | null)?.email ?? "";

  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  // If the link is opened in another tab of this browser, this tab moves on by itself
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate("/dashboard", { replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function handleResend() {
    setMessage(null);
    try {
      await resendConfirmation(email);
      setMessage({ type: "ok", text: "Sent! Check your inbox again." });
      setCooldown(COOLDOWN);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Could not resend the email.",
      });
    }
  }

  return (
    <AuthShell
      title="Check your inbox"
      subtitle={
        email
          ? `We sent a confirmation link to ${email}.`
          : "We sent you a confirmation link."
      }
      footer={
        <>
          Wrong address?{" "}
          <Link to="/signup" className="font-bold text-brand-600">
            Start again
          </Link>
        </>
      }
    >
      <div className="text-center">
        <div className="w-16 h-16 rounded-3xl bg-mint-50 text-mint-600 flex items-center justify-center mx-auto mb-4">
          <MailCheck size={32} />
        </div>
        <p className="text-ink font-semibold">Tap the link in the email to finish.</p>
        <p className="text-muted text-sm mt-1">
          It can take a minute to arrive. Look in spam or junk if you don't see it.
        </p>

        {message && (
          <p
            role={message.type === "error" ? "alert" : "status"}
            className={`mt-4 text-sm rounded-2xl px-4 py-3 ${
              message.type === "ok" ? "text-mint-600 bg-mint-50" : "text-brand-600 bg-brand-50"
            }`}
          >
            {message.text}
          </p>
        )}

        <div className="mt-5 space-y-3">
          {email && (
            <button
              onClick={handleResend}
              disabled={cooldown > 0}
              className={`${btnSoft} w-full`}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend the email"}
            </button>
          )}
          <Link to="/login" className={`${btnQuiet} w-full`}>
            Back to log in
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
