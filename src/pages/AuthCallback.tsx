import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { supabase } from "../lib/supabase";
import AuthShell from "../components/AuthShell";
import { btnPrimary } from "../ui";

// Supabase sends people here after they click the confirmation link in their email.
function readLinkError(): string {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  return hash.get("error_description") ?? query.get("error_description") ?? "";
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [linkError] = useState(readLinkError);
  const [waitedLong, setWaitedLong] = useState(false);

  useEffect(() => {
    if (linkError) return;
    let active = true;

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) navigate("/dashboard", { replace: true });
    });

    supabase.auth.getSession().then(({ data: s }) => {
      if (active && s.session) navigate("/dashboard", { replace: true });
    });

    const timer = window.setTimeout(() => active && setWaitedLong(true), 5000);

    return () => {
      active = false;
      window.clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, [linkError, navigate]);

  if (linkError) {
    return (
      <AuthShell title="That link didn't work" subtitle="It may have expired or already been used.">
        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-500 flex items-center justify-center mx-auto mb-4">
            <TriangleAlert size={32} />
          </div>
          <p className="text-muted text-sm mb-5">{linkError}</p>
          <Link to="/login" className={`${btnPrimary} w-full`}>
            Go to log in
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (waitedLong) {
    return (
      <AuthShell title="Email confirmed" subtitle="You're all set. Log in to continue.">
        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl bg-mint-50 text-mint-600 flex items-center justify-center mx-auto mb-4">
            <CircleCheck size={32} />
          </div>
          <Link to="/login" className={`${btnPrimary} w-full`}>
            Log in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Confirming your email" subtitle="Just a moment...">
      <div className="flex justify-center py-6">
        <div
          role="status"
          aria-label="Confirming"
          className="w-10 h-10 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin"
        />
      </div>
    </AuthShell>
  );
}
