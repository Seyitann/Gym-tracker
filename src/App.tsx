import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedLayout from "./components/ProtectedLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Workout from "./pages/Workout";
import Exercises from "./pages/Exercises";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import PersonalInfo from "./pages/PersonalInfo";
import ChangePassword from "./pages/ChangePassword";
import UnitsSettings from "./pages/UnitsSettings";
import RestTimerSettings from "./pages/RestTimerSettings";
import Help from "./pages/Help";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Signed in, onboarding not required yet */}
        <Route element={<ProtectedLayout requireOnboarding={false} showNav={false} />}>
          <Route path="/onboarding" element={<Onboarding />} />
        </Route>

        {/* Signed in and onboarded */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/workouts" element={<Exercises />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/profile" element={<PersonalInfo />} />
          <Route path="/settings/password" element={<ChangePassword />} />
          <Route path="/settings/units" element={<UnitsSettings />} />
          <Route path="/settings/rest-timer" element={<RestTimerSettings />} />
          <Route path="/settings/help" element={<Help />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
