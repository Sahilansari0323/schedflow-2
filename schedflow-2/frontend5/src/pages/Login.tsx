import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Mail, ArrowLeft, Sparkles, Shield, ChevronRight } from 'lucide-react';
import { useAuth } from '../auth';
import { getErrorMessage } from '../api';
import GlassCard from '../components/GlassCard';
import { SchedFlowMark } from '../components/AppleButton';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);
    try {
      const res = await login(email, password);
      if (res?.user?.role === 'teacher') {
        navigate('/teacher/portal');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Invalid administrative credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const fillTestCredentials = (role: 'admin' | 'dean' | 'teacher') => {
    if (role === 'admin') {
      setEmail('admin@schedflow.edu');
      setPassword('admin123');
    } else if (role === 'dean') {
      setEmail('coordinator@schedflow.edu');
      setPassword('admin123');
    } else {
      setEmail('teacher@schedflow.edu');
      setPassword('admin123');
    }
  };

  return (
    <div className="page-login relative min-h-screen text-white font-sans flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-white px-4 py-2 rounded-full liquid-glass border border-white/10 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Landing</span>
        </Link>

        <div className="flex items-center gap-2">
          <SchedFlowMark className="w-5 h-5 text-[#00d2ff]" />
          <span className="font-semibold text-sm">SchedFlow Aura</span>
        </div>
      </header>

      {/* Center Glassmorphic Card */}
      <div className="max-w-md mx-auto w-full my-auto">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <GlassCard variant="pro" className="!p-8 sm:!p-10 !min-h-0 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#00d2ff]/10 border border-[#00d2ff]/30 flex items-center justify-center text-[#00d2ff] mx-auto shadow-[0_0_24px_rgba(0,210,255,0.3)]">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Administrative Access
              </h1>
              <p className="text-xs text-white/50">
                Authenticate with institutional credentials to access the Chrono engine.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl border border-red-500/40 bg-red-950/40 text-red-200 text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@schedflow.edu"
                    required
                    className="w-full h-11 pl-11 pr-4 rounded-2xl bg-black/60 border border-white/15 text-white text-sm focus:outline-none focus:border-[#00d2ff] transition-colors placeholder:text-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                  Cryptographic Key / Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full h-11 pl-11 pr-4 rounded-2xl bg-black/60 border border-white/15 text-white text-sm focus:outline-none focus:border-[#00d2ff] transition-colors placeholder:text-white/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_24px_rgba(255,255,255,0.25)] disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Authenticating Key...' : 'Authorize Session'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>

            {/* Test Credentials Quick Fill */}
            <div className="pt-4 border-t border-white/10 space-y-2.5">
              <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider text-center">
                Demo Operator Credentials
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fillTestCredentials('admin')}
                  className="flex-1 py-2 px-3 rounded-xl liquid-glass border border-white/10 text-[11px] text-white/70 hover:text-white hover:border-[#00d2ff]/40 transition-all text-center cursor-pointer"
                >
                  Admin Roster
                </button>
                <button
                  type="button"
                  onClick={() => fillTestCredentials('dean')}
                  className="flex-1 py-2 px-3 rounded-xl liquid-glass border border-white/10 text-[11px] text-white/70 hover:text-white hover:border-[#00d2ff]/40 transition-all text-center cursor-pointer"
                >
                  Coordinator
                </button>
                <button
                  type="button"
                  onClick={() => fillTestCredentials('teacher')}
                  className="flex-1 py-2 px-3 rounded-xl liquid-glass border border-white/10 text-[11px] text-white/70 hover:text-white hover:border-[#00d2ff]/40 transition-all text-center cursor-pointer"
                >
                  Faculty
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-white/40 py-2">
        SchedFlow Aura v5.0 · 256-Bit SHA Bearer Authentication
      </footer>
    </div>
  );
}
