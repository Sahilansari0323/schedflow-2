import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 z-50">
        <div className="flex gap-2">
          <span className="w-4 h-4 rounded-md bg-[#38BDF8] animate-pulse" />
          <span className="w-4 h-4 rounded-md bg-[#74C947] animate-pulse [animation-delay:150ms]" />
          <span className="w-4 h-4 rounded-md bg-[#34D399] animate-pulse [animation-delay:300ms]" />
          <span className="w-4 h-4 rounded-md bg-[#A78BFA] animate-pulse [animation-delay:450ms]" />
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#E9EEF5]/40">
          Verifying Security Clearance...
        </span>
      </div>
    );
  }

  // Security guard: Require active token and validated user session
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
