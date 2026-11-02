import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getProfile } from "../api/data";
import BottomNav from "./BottomNav";
import { LoadingScreen } from "./PageState";

type Status = "loading" | "signed-out" | "needs-onboarding" | "ready";

interface Props {
  requireOnboarding?: boolean;
  showNav?: boolean;
}

// Wraps every page that needs a logged-in user. Signed-out visitors are sent to /login,
// and users who haven't finished onboarding are sent to /onboarding.
export default function ProtectedLayout({ requireOnboarding = true, showNav = true }: Props) {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let active = true;

    async function check() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session) {
        setStatus("signed-out");
        return;
      }
      if (!requireOnboarding) {
        setStatus("ready");
        return;
      }
      try {
        const profile = await getProfile();
        if (active) setStatus(profile ? "ready" : "needs-onboarding");
      } catch {
        // network hiccup: let the page show its own error message
        if (active) setStatus("ready");
      }
    }

    check();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && active) setStatus("signed-out");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [requireOnboarding]);

  if (status === "loading") return <LoadingScreen />;
  if (status === "signed-out") return <Navigate to="/login" replace />;
  if (status === "needs-onboarding") return <Navigate to="/onboarding" replace />;

  return (
    <>
      <Outlet />
      {showNav && <BottomNav />}
    </>
  );
}
