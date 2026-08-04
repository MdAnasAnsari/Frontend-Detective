import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Lock, Mail, ShieldCheck, LogOut, Award, Zap, Trophy } from 'lucide-react';
import { useGameStore } from './store';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATARS = ['🕵️‍♂️', '🕵️‍♀️', '🥷', '🔎', '⚡', '🤖', '👾', '💻'];

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { user, setUser, setToken, logout } = useGameStore();
  const [mode, setMode] = useState<'login' | 'register' | 'profile'>(user ? 'profile' : 'login');
  
  // Form states
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🕵️‍♂️');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      setToken(data.token);
      setUser(data.user);
      setSuccessMsg('Authentication successful! Welcome back Agent.');
      setTimeout(() => {
        setMode('profile');
        setSuccessMsg('');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          avatar: selectedAvatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      setToken(data.token);
      setUser(data.user);
      setSuccessMsg('Account created successfully! Clearance Granted.');
      setTimeout(() => {
        setMode('profile');
        setSuccessMsg('');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-indigo-950/80 backdrop-blur-md p-4 crt-flicker">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-slate-900 border-2 border-[#6366f1] p-6 md:p-8 shadow-[0_0_40px_rgba(99,102,241,0.3)] relative text-white rounded-xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header Tabs */}
        <div className="flex justify-around border-b border-white/10 pb-4 mb-6">
          {user ? (
            <div className="flex items-center space-x-2 text-[#10b981] font-mono font-bold tracking-widest text-lg">
              <ShieldCheck className="w-6 h-6" />
              <span>DETECTIVE DOSSIER</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => { setMode('login'); setErrorMsg(''); }}
                className={`font-mono text-sm font-bold uppercase tracking-widest px-4 py-2 transition-colors border-b-2 ${
                  mode === 'login' ? 'border-[#6366f1] text-[#6366f1]' : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                Access Terminal (Login)
              </button>
              <button
                onClick={() => { setMode('register'); setErrorMsg(''); }}
                className={`font-mono text-sm font-bold uppercase tracking-widest px-4 py-2 transition-colors border-b-2 ${
                  mode === 'register' ? 'border-[#10b981] text-[#10b981]' : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                New Agent (Register)
              </button>
            </>
          )}
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-400 font-mono text-xs rounded flex items-center space-x-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-400 font-mono text-xs rounded flex items-center space-x-2">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* PROFILE MODE */}
        {user && mode === 'profile' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 bg-black/40 p-4 border border-white/10 rounded-lg">
              <div className="text-4xl bg-slate-800 p-3 rounded-full border border-[#6366f1]/50">
                {user.avatar}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{user.username}</h3>
                <p className="text-xs font-mono text-white/60">{user.email}</p>
                <div className="inline-block mt-1 px-2.5 py-0.5 bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#6366f1] text-[10px] font-mono font-bold uppercase tracking-wider rounded">
                  {user.badge}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono text-center">
              <div className="bg-black/50 p-3 border border-white/10 rounded">
                <Zap className="w-4 h-4 text-[#f59e0b] mx-auto mb-1" />
                <div className="text-[10px] text-white/50 uppercase">Total XP</div>
                <div className="text-lg font-bold text-[#f59e0b]">{user.totalXp}</div>
              </div>
              <div className="bg-black/50 p-3 border border-white/10 rounded">
                <Trophy className="w-4 h-4 text-[#10b981] mx-auto mb-1" />
                <div className="text-[10px] text-white/50 uppercase">Victories</div>
                <div className="text-lg font-bold text-[#10b981]">{user.victories}</div>
              </div>
              <div className="bg-black/50 p-3 border border-white/10 rounded">
                <Award className="w-4 h-4 text-[#06b6d4] mx-auto mb-1" />
                <div className="text-[10px] text-white/50 uppercase">Missions</div>
                <div className="text-lg font-bold text-[#06b6d4]">{user.gamesPlayed}</div>
              </div>
            </div>

            <button
              onClick={() => { logout(); setMode('login'); }}
              className="w-full py-3 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/50 font-mono text-xs font-bold uppercase tracking-widest rounded flex items-center justify-center space-x-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sever Session (Logout)</span>
            </button>
          </div>
        )}

        {/* LOGIN FORM */}
        {!user && mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 font-mono">
            <div>
              <label className="block text-xs text-white/70 uppercase tracking-wider mb-1">Agent ID / Email</label>
              <div className="relative">
                <User className="w-4 h-4 text-white/40 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Enter username or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 focus:border-[#6366f1] pl-10 pr-4 py-2.5 text-sm rounded outline-none text-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/70 uppercase tracking-wider mb-1">Passcode</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Enter passcode"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 focus:border-[#6366f1] pl-10 pr-4 py-2.5 text-sm rounded outline-none text-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#6366f1] hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest rounded shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate Session</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {!user && mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 font-mono">
            <div>
              <label className="block text-xs text-white/70 uppercase tracking-wider mb-1">Agent Alias (Username)</label>
              <div className="relative">
                <User className="w-4 h-4 text-white/40 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. DetectiveX"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 focus:border-[#10b981] pl-10 pr-4 py-2 text-sm rounded outline-none text-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/70 uppercase tracking-wider mb-1">Secure Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="agent@nexasoul.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 focus:border-[#10b981] pl-10 pr-4 py-2 text-sm rounded outline-none text-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/70 uppercase tracking-wider mb-1">Passcode</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Create passcode"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 focus:border-[#10b981] pl-10 pr-4 py-2 text-sm rounded outline-none text-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/70 uppercase tracking-wider mb-1">Choose Avatar Badge</label>
              <div className="flex space-x-2 overflow-x-auto pb-1">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`text-2xl p-2 rounded-lg border transition-all ${
                      selectedAvatar === av
                        ? 'border-[#10b981] bg-[#10b981]/20 scale-110'
                        : 'border-white/10 bg-black/40 hover:border-white/30'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#10b981] hover:bg-emerald-500 text-black font-bold text-xs uppercase tracking-widest rounded shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Registering Agent...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Register & Obtain Clearance</span>
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
