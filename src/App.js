import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import Meetings from "./pages/Meetings";
import ICPAnalysis from "./pages/ICPAnalysis";
import ICPSettingsPage from "./pages/ICPSettings";
import DataEnrichment from "./pages/DataEnrichment";
import Services from "./pages/Services";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import SharedBrief from "./pages/SharedBrief";
import ConnectCalendar from "./pages/ConnectCalendar";
import Onboarding from "./pages/Onboarding";

function App() {
  console.log('[App] Rendering, current path:', window.location.pathname, 'hash:', window.location.hash);
  
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/shared/:token" element={<SharedBrief />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meetings"
            element={
              <ProtectedRoute>
                <Meetings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/icp-analysis"
            element={
              <ProtectedRoute>
                <ICPAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/icp-settings"
            element={
              <ProtectedRoute>
                <ICPSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/data-enrichment"
            element={
              <ProtectedRoute>
                <DataEnrichment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services"
            element={
              <ProtectedRoute>
                <Services />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/connect-calendar"
            element={
              <ProtectedRoute>
                <ConnectCalendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
