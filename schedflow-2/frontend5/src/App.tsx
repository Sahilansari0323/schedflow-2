import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import AuraBackground from './components/AuraBackground';
import AdminLayout from './components/AdminLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import PublicTimetable from './pages/PublicTimetable';
import Login from './pages/Login';

// Admin Portal Pages
import Dashboard from './pages/admin/Dashboard';
import Analytics from './pages/admin/Analytics';
import Teachers from './pages/admin/Teachers';
import Subjects from './pages/admin/Subjects';
import Semesters from './pages/admin/Semesters';
import Sections from './pages/admin/Sections';
import Rooms from './pages/admin/Rooms';
import ImportData from './pages/admin/ImportData';
import Timetables from './pages/admin/Timetables';
import Builder from './pages/admin/Builder';
import MasterView from './pages/admin/MasterView';
import Schedules from './pages/admin/Schedules';
import Substitutions from './pages/admin/Substitutions';
import ConflictDetection from './pages/admin/ConflictDetection';
import AIResolver from './pages/admin/AIResolver';
import Announcements from './pages/admin/Announcements';
import Feedback from './pages/admin/Feedback';
import UserDirectory from './pages/admin/Users';
import VersionHistory from './pages/admin/History';
import Settings from './pages/admin/Settings';
import Topology from './pages/admin/Topology';

// Teacher Portal
import TeacherPortal from './pages/teacher/TeacherPortal';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl text-white/70 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          Verifying SchedFlow JWT session…
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'teacher') {
      return <Navigate to="/teacher/portal" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Persistent Blue Aura Video/Mesh Background with 1px border lines on all pages */}
        <AuraBackground />

        {/* Application View Layer */}
        <div className="relative z-10 min-h-screen">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/timetable" element={<PublicTimetable />} />
            <Route path="/login" element={<Login />} />

            {/* Dedicated Faculty Portal */}
            <Route
              path="/teacher/portal"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin', 'coordinator']}>
                  <TeacherPortal />
                </ProtectedRoute>
              }
            />

            {/* Admin Portal — Staff Only Routes */}
            {/* 1. Overview */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <Dashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <Dashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <Analytics />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* 2. Manage */}
            <Route
              path="/admin/teachers"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <Teachers />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subjects"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <Subjects />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/semesters"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <Semesters />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sections"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <Sections />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/rooms"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <Rooms />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/import"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <ImportData />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/topology"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <Topology />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* 3. Scheduling */}
            <Route
              path="/admin/timetables"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <Timetables />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/builder"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <Builder />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/master-view"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <MasterView />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/schedules"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <Schedules />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/substitutions"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <Substitutions />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* 4. Diagnostics */}
            <Route
              path="/admin/conflicts"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <ConflictDetection />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/resolver"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <AIResolver />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* 5. Campus & Student */}
            <Route
              path="/admin/announcements"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <Announcements />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/feedback"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <Feedback />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* 6. System */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <UserDirectory />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/history"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <VersionHistory />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                  <AdminLayout>
                    <Settings />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
