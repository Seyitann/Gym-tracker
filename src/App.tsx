import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedLayout from "./components/ProtectedLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Exercises from "./pages/Exercises";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import PersonalInfo from "./pages/PersonalInfo";
import UnitsSettings from "./pages/UnitsSettings";
import RestTimerSettings from "./pages/RestTimerSettings";
import Help from "./pages/Help";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedLayout requireOnboarding={false} showNav={false} />}>
          <Route path="/onboarding" element={<Onboarding />} />
        </Route>

        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workouts" element={<Exercises />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/profile" element={<PersonalInfo />} />
          <Route path="/settings/units" element={<UnitsSettings />} />
          <Route path="/settings/rest-timer" element={<RestTimerSettings />} />
          <Route path="/settings/help" element={<Help />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
