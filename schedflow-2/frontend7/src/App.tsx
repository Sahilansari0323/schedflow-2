import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './shared/auth';
import ProtectedRoute from './shared/ProtectedRoute';

// Public pages
import LandingPage from './pages/LandingPage';
import PublicTimetablePage from './pages/PublicTimetablePage';
import LoginPage from './pages/LoginPage';

// Admin Cockpit & Pages
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import Builder from './admin/pages/Builder';
import MasterView from './admin/pages/MasterView';
import Timetables from './admin/pages/Timetables';
import Topology from './admin/pages/Topology';
import ConflictDetection from './admin/pages/ConflictDetection';
import AIResolver from './admin/pages/AIResolver';
import Analytics from './admin/pages/Analytics';
import Announcements from './admin/pages/Announcements';
import Feedback from './admin/pages/Feedback';
import Substitutions from './admin/pages/Substitutions';
import Schedules from './admin/pages/Schedules';
import ImportData from './admin/pages/ImportData';
import History from './admin/pages/History';
import Users from './admin/pages/Users';
import Settings from './admin/pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/timetable" element={<PublicTimetablePage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Legacy .html redirects to modern SPA routes */}
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="/timetable.html" element={<Navigate to="/timetable" replace />} />
          <Route path="/login.html" element={<Navigate to="/login" replace />} />
          <Route path="/admin.html" element={<Navigate to="/login" replace />} />

          {/* Protected Institutional Admin Cockpit */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="builder" element={<Builder />} />
            <Route path="master-view" element={<MasterView />} />
            <Route path="timetables" element={<Timetables />} />
            <Route path="topology" element={<Topology />} />
            <Route path="conflicts" element={<ConflictDetection />} />
            <Route path="resolver" element={<AIResolver />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="substitutions" element={<Substitutions />} />
            <Route path="schedules" element={<Schedules />} />
            <Route path="import" element={<ImportData />} />
            <Route path="history" element={<History />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
