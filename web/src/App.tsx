import { Suspense, lazy, useEffect } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Munich2026 from "./pages/Munich2026";
import Program from "./pages/Program";

// Season 01 pages pull in recharts; load them only when opened.
const Dashboard = lazy(() => import("./legacy/Dashboard"));
const Journal = lazy(() => import("./legacy/Journal"));
const RacePlan = lazy(() => import("./legacy/RacePlan"));
const TrainingPlan = lazy(() => import("./legacy/TrainingPlan"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/program" element={<Program />} />
          <Route path="/munich-2026" element={<Munich2026 />} />
          <Route path="/munich-2026/dashboard" element={<Dashboard />} />
          <Route path="/munich-2026/journal" element={<Journal />} />
          <Route path="/munich-2026/race-plan" element={<RacePlan />} />
          <Route path="/munich-2026/plan" element={<TrainingPlan />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
