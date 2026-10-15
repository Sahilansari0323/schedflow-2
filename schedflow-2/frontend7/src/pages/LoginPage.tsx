import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import ThreeBackground from '../components/ThreeBackground';
import { useAuth } from '../shared/auth';

const DEMO_ACCOUNTS = [
  { name: 'Administrator', email: 'admin@schedflow.edu', role: 'Super Admin', pass: 'admin123', color: '#74C947' },
  { name: 'Dr. D. Okafor', email: 'coordinator@schedflow.edu', role: 'Academic Coordinator', pass: 'admin123', color: '#38BDF8' },
  { name: 'Prof. S. Menon', email: 'teacher@schedflow.edu', role: 'Faculty Member', pass: 'admin123', color: '#A78BFA' },
];

export default function LoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/admin/dashboard';

  useEffect(() => {
    // Zero-Trust Security Gate: Visiting the login view terminates any cached session
    // ensuring that access to administrative cockpit always requires password authorization.
    logout();
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [pulseBtn, setPulseBtn] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide institution email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid institution credentials. Please check password.');
    } finally {
      setLoading(false);
    }
  };

  const typeWriter = (text: string, setter: (val: string) => void, onComplete?: () => void) => {
    let i = 0;
    setter('');
    const timer = setInterval(() => {
      i++;
      setter(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 24);
  };

  const handleAutofill = (acc: typeof DEMO_ACCOUNTS[0]) => {
    if (typing) return;
    setTyping(true);
    setError(null);
    setEmail('');
    setPassword('');
    setPulseBtn(false);

    typeWriter(acc.email, setEmail, () => {
      typeWriter(acc.pass, setPassword, () => {
        setTyping(false);
        setPulseBtn(true);
        setToastMsg(`${acc.name} credentials loaded — hit Authorize Session`);
        setTimeout(() => setToastMsg(null), 4000);
      });
    });
  };

  return (
    <div className="relative min-h-screen text-[#E9EEF5] bg-black flex flex-col justify-between selection:bg-[#74C947] selection:text-[#081a05]">
      {/* 3D Living Three.js Background */}
      <ThreeBackground blur={false} />

      {/* Top Bar */}
      <header className="relative z-40 w-full px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <svg className="w-6 h-6 transition-transform group-hover:scale-110" viewBox="0 0 24 24" aria-hidden="true">
            <rect width="24" height="24" rx="6" fill="#0B101A" />
            <rect x="4.5" y="4.5" width="7" height="7" rx="2" fill="#38BDF8" />
            <rect x="12.5" y="4.5" width="7" height="7" rx="2" fill="#74C947" />
            <rect x="4.5" y="12.5" width="7" height="7" rx="2" fill="#34D399" />
            <rect x="12.5" y="12.5" width="7" height="7" rx="2" fill="#A78BFA" />
          </svg>
          <span className="font-extrabold text-base tracking-wide text-white font-['Outfit']">
            SchedFlow <span className="text-[#74C947]">Aura</span>
          </span>
        </Link>

        <Link
          to="/timetable"
          className="btn-glass rounded-full px-4 py-2 text-xs tracking-wider uppercase font-semibold text-[#74C947] flex items-center gap-2"
        >
          <span>Live Timetable</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 w-full max-w-[440px] mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass border border-[#FF4D5E]/30 text-[10px] font-mono uppercase tracking-wider text-[#FF4D5E] mb-3">
            <Lock className="w-3 h-3" />
            <span>Restricted · Staff Only</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-['Outfit']">
            Administrative <span className="text-[#74C947]">Access</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#E9EEF5]/55 max-w-xs mx-auto leading-relaxed">
            Sign in with institutional credentials to launch the SchedFlow solver cockpit.
          </p>
        </div>

        <div className="glass-strong rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mono-label block mb-2 text-[#E9EEF5]/60">Institution Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@schedflow.edu"
                  className="mfield has-icon-left text-xs tracking-wide"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mono-label block mb-2 text-[#E9EEF5]/60">Security Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="mfield has-icon-left has-icon-right text-xs tracking-wider"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#FF4D5E]/10 border border-[#FF4D5E]/20 text-[#FF4D5E] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-none" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || typing}
              className={`btn-primary w-full py-4 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 font-bold shadow-xl transition-all duration-300 ${
                pulseBtn ? 'pulseGlow ring-2 ring-[#74C947]' : ''
              }`}
            >
              <span className="shine" />
              <span>{loading ? 'Authenticating...' : typing ? 'Auto-typing...' : 'Authorize Session'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Autofill Roster with Typewriter Trigger */}
          <div className="pt-4 border-t border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between">
              <span className="mono-label text-white/40">Quick Demo Access</span>
              {typing && (
                <span className="font-mono text-[10px] text-[#74C947] animate-pulse">Typing...</span>
              )}
            </div>
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={typing}
                  onClick={() => handleAutofill(acc)}
                  className={`w-full text-left p-2.5 rounded-2xl glass hover:border-white/20 transition flex items-center justify-between group ${
                    typing ? 'opacity-40 pointer-events-none' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center font-mono text-[11px] font-bold"
                      style={{ backgroundColor: `${acc.color}20`, color: acc.color }}
                    >
                      {acc.name[0]}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-[#74C947] transition-colors">
                        {acc.name}
                      </div>
                      <div className="font-mono text-[10px] text-white/40">{acc.email}</div>
                    </div>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-white/30 group-hover:text-[#74C947] transition-colors">
                    Type →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Floating Demo Toast */}
      {toastMsg && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 glass-strong px-5 py-3 rounded-full text-xs font-bold tracking-wider text-white border border-[#74C947]/50 shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="w-4 h-4 text-[#74C947]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-40 w-full py-4 text-center text-[10px] font-mono text-white/30">
        SCHEDFLOW AURA · RBAC PROTECTED · HARDENED JWT COCKPIT
      </footer>
    </div>
  );
}
