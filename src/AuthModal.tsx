import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  User,
  Mail,
  ShieldCheck,
  LogOut,
  Zap,
  Trophy,
  Hash,
  Phone,
  Building2,
  Lock,
  Edit3,
  Check,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { useGameStore, type UserRole, type UserProfile } from './store';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStudio?: () => void;
}

const AVATARS = ['🕵️‍♂️', '🕵️‍♀️', '🥷', '🔎', '⚡', '🤖', '👾', '💻'];

const DEMO_CREDENTIALS: {
  role: UserRole;
  title: string;
  email: string;
  pass: string;
  avatar: string;
  desc: string;
}[] = [
  {
    role: 'admin',
    title: 'Chief Inspector (Admin)',
    email: 'garvit@frontenddetective.dev',
    pass: 'password123',
    avatar: '🕵️‍♂️',
    desc: 'Full platform admin privileges, User RBAC Console, and case authoring.',
  },
  {
    role: 'architect',
    title: 'Case Architect',
    email: 'architect@frontenddetective.dev',
    pass: 'password123',
    avatar: '⚡',
    desc: 'Case & Anomaly builder permissions and live hackathon rooms.',
  },
  {
    role: 'detective',
    title: 'Field Detective (Player)',
    email: 'sherlock@frontenddetective.dev',
    pass: 'password123',
    avatar: '🔎',
    desc: 'Standard gameplay, bug inspection, and leaderboard tracking.',
  },
];

export default function AuthModal({ isOpen, onClose, onOpenStudio }: AuthModalProps) {
  const { user, token, setUser, setToken, logout } = useGameStore();
  const [mode, setMode] = useState<'login' | 'register' | 'profile'>('login');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [uid, setUid] = useState('');
  const [branch, setBranch] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setMode('profile');
      setName(user.username || user.name || '');
      setBranch(user.branch || '');
      setContact(user.contact || '');
      setAvatar(user.avatar || AVATARS[0]);
    } else {
      setMode('login');
    }
    setError('');
    setSuccessMsg('');
    setIsEditingProfile(false);
  }, [user, isOpen]);

  if (!isOpen) return null;

  const roleBadgeColor = (r: UserRole) => {
    if (r === 'admin') return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
    if (r === 'architect') return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
  };

  const handleFillDemo = (demo: typeof DEMO_CREDENTIALS[number]) => {
    setIdentifier(demo.email);
    setPassword(demo.pass);
    setError('');
    setSuccessMsg(`Credentials populated for ${demo.title}. Click Authenticate to sign in.`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      setUser(data.user);
      setToken(data.token);
      setMode('profile');
      onClose();
    } catch (err: any) {
      // Local fallback verification only if password matches demo account
      const demoMatch = DEMO_CREDENTIALS.find(
        (d) =>
          d.email.toLowerCase() === identifier.trim().toLowerCase() ||
          d.title.toLowerCase().includes(identifier.trim().toLowerCase())
      );

      if (demoMatch && password === demoMatch.pass) {
        const fallbackUser: UserProfile = {
          id: demoMatch.role === 'admin' ? 'usr-1' : demoMatch.role === 'architect' ? 'usr-2' : 'usr-3',
          username: demoMatch.role === 'admin' ? 'GarvitBhutani' : demoMatch.role === 'architect' ? 'CaseArchitect' : 'CodeSherlock',
          name: demoMatch.role === 'admin' ? 'Garvit Amit Bhutani' : demoMatch.role === 'architect' ? 'Aria Vance' : 'Sherlock Dev',
          uid: demoMatch.role === 'admin' ? 'ADMIN-001' : demoMatch.role === 'architect' ? 'ARCH-102' : 'DET-204',
          branch: demoMatch.role === 'admin' ? 'CSE' : demoMatch.role === 'architect' ? 'AI & DS' : 'IT',
          email: demoMatch.email,
          contact: '9999999999',
          role: demoMatch.role,
          avatar: demoMatch.avatar,
          badge: demoMatch.role === 'admin' ? 'Chief Inspector' : demoMatch.role === 'architect' ? 'Lead Case Architect' : 'Senior Field Detective',
          totalXp: demoMatch.role === 'admin' ? 4800 : demoMatch.role === 'architect' ? 3650 : 2900,
          gamesPlayed: demoMatch.role === 'admin' ? 12 : demoMatch.role === 'architect' ? 10 : 7,
          victories: demoMatch.role === 'admin' ? 11 : demoMatch.role === 'architect' ? 8 : 6,
        };
        setUser(fallbackUser);
        setToken(`fd-token::${fallbackUser.id}::${fallbackUser.role}`);
        setMode('profile');
        onClose();
      } else {
        setError(err.message || 'Invalid credentials. Please verify your passcode.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (!registerPassword || registerPassword.length < 6) {
      setError('Access passcode must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          uid,
          branch,
          email,
          contact,
          password: registerPassword,
          avatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setUser(data.user);
      setToken(data.token);
      setMode('profile');
      onClose();
    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        setError(err.message);
      } else {
        // Offline fallback registration strictly as 'detective'
        const localUser: UserProfile = {
          id: `usr-${Date.now()}`,
          username: name,
          name,
          uid: uid || `FD-${Math.floor(1000 + Math.random() * 9000)}`,
          branch: branch || 'Frontend Engineering',
          email,
          contact: contact || 'N/A',
          role: 'detective',
          avatar,
          badge: 'Field Detective',
          totalXp: 0,
          gamesPlayed: 0,
          victories: 0,
        };
        setUser(localUser);
        setToken(`fd-token::${localUser.id}::detective`);
        setMode('profile');
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, avatar, branch, contact }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser({ ...user, username: name, name, avatar, branch, contact });
      }
      setIsEditingProfile(false);
      setSuccessMsg('Agent profile updated!');
    } catch {
      setUser({ ...user, username: name, name, avatar, branch, contact });
      setIsEditingProfile(false);
      setSuccessMsg('Agent profile updated locally!');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setMode('login');
    onClose();
  };

  // --- PROFILE VIEW ---
  if (mode === 'profile' && user) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl max-h-[92vh] overflow-y-auto"
        >
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600 to-blue-500 opacity-20"></div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10 p-1"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-8 relative z-10">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 bg-slate-800 border-2 border-indigo-500 rounded-full flex items-center justify-center text-5xl mb-3 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                {user.avatar}
              </div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold text-white font-mono">{user.username}</h2>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg bg-slate-800/80 border border-slate-700 transition-colors"
                  title="Edit Profile"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-indigo-400 font-mono text-sm mt-0.5">{user.badge}</p>
              <span className={`mt-2 px-3 py-0.5 text-[11px] font-mono uppercase font-bold rounded-full border ${roleBadgeColor(user.role)}`}>
                SECURITY ROLE: {user.role.toUpperCase()}
              </span>
            </div>

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 px-3 py-2 rounded-lg text-xs font-mono text-center mb-4">
                {successMsg}
              </div>
            )}

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-3 mb-6 font-mono text-xs">
                <div>
                  <label className="block text-slate-400 uppercase mb-1">Agent Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/60 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Department</label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full bg-black/60 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Contact</label>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full bg-black/60 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 uppercase mb-1">Avatar</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {AVATARS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setAvatar(emoji)}
                        className={`text-xl p-1.5 rounded-lg border ${
                          avatar === emoji ? 'bg-indigo-600 border-indigo-400' : 'bg-black/40 border-white/10'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold uppercase flex items-center justify-center space-x-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <div className="flex items-center space-x-2 text-slate-400 mb-1">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs uppercase tracking-wider font-bold">Total XP</span>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">{user.totalXp}</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <div className="flex items-center space-x-2 text-slate-400 mb-1">
                    <Trophy className="w-4 h-4 text-[#f59e0b]" />
                    <span className="text-xs uppercase tracking-wider font-bold">Victories</span>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">{user.victories}</div>
                </div>
              </div>
            )}

            {/* Authentication & Clearance Box (Authentication-Based RBAC) */}
            <div className="mb-6 bg-black/40 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-indigo-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Security Clearance</span>
                </div>
                <span className="text-slate-500 font-mono">UID: {user.uid}</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                {user.role === 'admin'
                  ? '🔒 Chief Inspector clearance active. You have full access to promote/demote users in the User RBAC Console and manage all official case audits.'
                  : user.role === 'architect'
                  ? '⚡ Case Architect clearance active. You have authorization to create and edit UI anomaly assignments and manage live event rooms.'
                  : '🔍 Field Detective recruit clearance active. Role promotions to Architect or Chief Inspector are strictly granted by an Admin.'}
              </p>

              {(user.role === 'admin' || user.role === 'architect') && onOpenStudio && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStudio();
                  }}
                  className="w-full mt-2 py-2 px-3 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 rounded-lg text-indigo-300 font-mono text-xs font-bold uppercase flex items-center justify-center space-x-2 transition-all"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Open Command Studio & RBAC</span>
                </button>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 py-3 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors font-mono text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- SIGN IN & REGISTRATION VIEW ---
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl max-h-[92vh] flex flex-col"
      >
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center space-x-2 text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="text-base md:text-lg font-bold uppercase tracking-widest font-mono text-white">
              {mode === 'login' ? 'Agent Authentication' : 'Recruit Registration'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="grid grid-cols-2 border-b border-slate-800 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
              setSuccessMsg('');
            }}
            className={`py-3 font-bold uppercase tracking-wider transition-colors ${
              mode === 'login' ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
              setSuccessMsg('');
            }}
            className={`py-3 font-bold uppercase tracking-wider transition-colors ${
              mode === 'register' ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-xs mb-4 font-mono text-center flex items-center justify-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 p-3 rounded-lg text-xs mb-4 font-mono text-center">
              {successMsg}
            </div>
          )}

          {mode === 'login' ? (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    Email, Username, or Agent UID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="block w-full pl-10 bg-black/60 border border-white/20 rounded-lg py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-sm"
                      placeholder="garvit@frontenddetective.dev"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    Access Passcode
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 bg-black/60 border border-white/20 rounded-lg py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-sm"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 font-mono uppercase tracking-wider text-xs"
                >
                  {loading ? 'Authenticating...' : 'Authenticate'}
                </button>
              </form>

              {/* Demo Credentials Helper */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Demo Accounts & Passcodes</span>
                </div>
                <div className="space-y-2">
                  {DEMO_CREDENTIALS.map((demo) => (
                    <div
                      key={demo.role}
                      className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-xl">{demo.avatar}</span>
                        <div>
                          <div className="font-bold text-white text-[11px] flex items-center space-x-1.5">
                            <span>{demo.title}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold border ${roleBadgeColor(demo.role)}`}>
                              {demo.role}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">{demo.email} • pass: {demo.pass}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleFillDemo(demo)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded border border-slate-700 text-[10px] font-bold uppercase transition-all flex items-center space-x-1"
                      >
                        <span>Fill</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 uppercase mb-1">Full Agent Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-9 bg-black/60 border border-white/20 rounded-lg py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                    placeholder="e.g. Alex Mercer"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase mb-1">Agent UID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      value={uid}
                      onChange={(e) => setUid(e.target.value)}
                      className="block w-full pl-9 bg-black/60 border border-white/20 rounded-lg py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                      placeholder="FD-104"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase mb-1">Department</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="block w-full pl-9 bg-black/60 border border-white/20 rounded-lg py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                      placeholder="CSE / Frontend"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase mb-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-9 bg-black/60 border border-white/20 rounded-lg py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                      placeholder="agent@frontenddetective.dev"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase mb-1">Contact</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="tel"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="block w-full pl-9 bg-black/60 border border-white/20 rounded-lg py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                      placeholder="Phone"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase mb-1">Access Passcode</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="block w-full pl-9 bg-black/60 border border-white/20 rounded-lg py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                    placeholder="Min 6 characters"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase mb-1">Select Avatar</label>
                <div className="grid grid-cols-4 gap-2">
                  {AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      className={`text-2xl p-2 rounded-xl transition-all ${
                        avatar === emoji
                          ? 'bg-indigo-600 border border-indigo-400 scale-105 shadow-lg shadow-indigo-500/30'
                          : 'bg-black/40 border border-white/10 hover:bg-black/60'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-950/40 border border-indigo-500/30 p-2.5 rounded-lg text-[10px] text-slate-400 leading-tight">
                🛡️ <strong className="text-indigo-300">Authentication-Based RBAC:</strong> All new recruits start with <strong>Field Detective</strong> clearance. Upgrades to <strong>Case Architect</strong> or <strong>Chief Inspector</strong> must be authorized by an Admin.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 font-mono uppercase tracking-wider text-xs"
              >
                {loading ? 'Initializing Agent...' : 'Create Agent Account'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
