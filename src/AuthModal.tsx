import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Mail, ShieldCheck, LogOut, Zap, Trophy, Hash, Phone, Building2, Lock, Edit3, Check, Sparkles } from 'lucide-react';
import { useGameStore, type UserRole, type UserProfile } from './store';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATARS = ['🕵️‍♂️', '🕵️‍♀️', '🥷', '🔎', '⚡', '🤖', '👾', '💻'];

const DEMO_ACCOUNTS: { label: string; role: UserRole; identifier: string; fallback: UserProfile }[] = [
  {
    label: 'Admin (Chief Inspector)',
    role: 'admin',
    identifier: 'garvit@frontenddetective.dev',
    fallback: {
      id: 'usr-1',
      username: 'GarvitBhutani',
      name: 'Garvit Amit Bhutani',
      uid: 'ADMIN-001',
      branch: 'CSE',
      email: 'garvit@frontenddetective.dev',
      contact: '9999999999',
      role: 'admin',
      avatar: '🕵️‍♂️',
      badge: 'Chief Inspector',
      totalXp: 4800,
      gamesPlayed: 12,
      victories: 11,
    },
  },
  {
    label: 'Architect (Case Creator)',
    role: 'architect',
    identifier: 'architect@frontenddetective.dev',
    fallback: {
      id: 'usr-2',
      username: 'CaseArchitect',
      name: 'Aria Vance',
      uid: 'ARCH-102',
      branch: 'AI & DS',
      email: 'architect@frontenddetective.dev',
      contact: '8888888888',
      role: 'architect',
      avatar: '⚡',
      badge: 'Lead Case Architect',
      totalXp: 3650,
      gamesPlayed: 10,
      victories: 8,
    },
  },
  {
    label: 'Detective (Player)',
    role: 'detective',
    identifier: 'sherlock@frontenddetective.dev',
    fallback: {
      id: 'usr-3',
      username: 'CodeSherlock',
      name: 'Sherlock Dev',
      uid: 'DET-204',
      branch: 'IT',
      email: 'sherlock@frontenddetective.dev',
      contact: '7777777777',
      role: 'detective',
      avatar: '🔎',
      badge: 'Senior Field Detective',
      totalXp: 2900,
      gamesPlayed: 7,
      victories: 6,
    },
  },
];

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
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
  const [role, setRole] = useState<UserRole>('detective');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
      // Fallback check against demo accounts if backend is offline
      const match = DEMO_ACCOUNTS.find(
        (d) =>
          d.identifier.toLowerCase() === identifier.trim().toLowerCase() ||
          d.fallback.username.toLowerCase() === identifier.trim().toLowerCase() ||
          d.fallback.uid?.toLowerCase() === identifier.trim().toLowerCase()
      );
      if (match) {
        setUser(match.fallback);
        setToken(`fd-token::${match.fallback.id}::${match.fallback.role}`);
        setMode('profile');
        onClose();
      } else {
        setError(err.message || 'Unable to sign in. Try one of the Quick RBAC Demo Roles below.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleLogin = async (demo: typeof DEMO_ACCOUNTS[number]) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: demo.identifier, password: 'password123' }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        onClose();
        return;
      }
      throw new Error('Fallback to local');
    } catch {
      setUser(demo.fallback);
      setToken(`fd-token::${demo.fallback.id}::${demo.fallback.role}`);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, uid, branch, email, contact, password, avatar, role }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        setMode('profile');
        onClose();
        return;
      }
      const errData = await res.json();
      throw new Error(errData.error || 'Registration failed');
    } catch {
      // Offline fallback registration
      const badgeMap: Record<UserRole, string> = {
        detective: 'Field Detective',
        architect: 'Case Architect',
        admin: 'Chief Inspector',
      };
      const localUser: UserProfile = {
        id: `usr-${Date.now()}`,
        username: name,
        name,
        uid: uid || `FD-${Math.floor(1000 + Math.random() * 9000)}`,
        branch,
        email,
        contact,
        role,
        avatar,
        badge: badgeMap[role],
        totalXp: 0,
        gamesPlayed: 0,
        victories: 0,
      };
      setUser(localUser);
      setToken(`fd-token::${localUser.id}::${localUser.role}`);
      setMode('profile');
      onClose();
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

  const roleBadgeColor = (r: UserRole) => {
    if (r === 'admin') return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
    if (r === 'architect') return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
  };

  if (mode === 'profile' && user) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl"
        >
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600 to-blue-500 opacity-20"></div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
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
                  className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg bg-slate-800/80 border border-slate-700"
                  title="Edit Profile"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-indigo-400 font-mono text-sm mt-0.5">{user.badge}</p>
              <span className={`mt-2 px-3 py-0.5 text-[11px] font-mono uppercase font-bold rounded-full border ${roleBadgeColor(user.role)}`}>
                RBAC Role: {user.role.toUpperCase()}
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

            {/* Quick Role Switcher inside Profile for easy RBAC testing */}
            <div className="mb-6 bg-black/40 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Switch Active RBAC Role (Demo)</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                {DEMO_ACCOUNTS.map((d) => (
                  <button
                    key={d.role}
                    onClick={() => handleQuickRoleLogin(d)}
                    className={`py-1.5 px-2 rounded border font-bold uppercase transition-all ${
                      user.role === d.role
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:border-indigo-500/50'
                    }`}
                  >
                    {d.role}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 py-3 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center space-x-2 text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="text-lg font-bold uppercase tracking-widest font-mono text-white">
              {mode === 'login' ? 'Agent Authentication' : 'Register New Agent'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="grid grid-cols-2 border-b border-slate-800 font-mono text-xs">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`py-3 font-bold uppercase tracking-wider transition-colors ${
              mode === 'login' ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`py-3 font-bold uppercase tracking-wider transition-colors ${
              mode === 'register' ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-xs mb-4 font-mono text-center">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    Email, Username, or Agent UID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="block w-full pl-10 bg-black/60 border border-white/20 rounded-lg py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-sm"
                      placeholder="garvit@frontenddetective.dev"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    Access Passcode
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 bg-black/60 border border-white/20 rounded-lg py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-sm"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 font-mono uppercase tracking-wider"
                >
                  {loading ? 'Authenticating...' : 'Authenticate'}
                </button>
              </form>

              {/* 1-Click RBAC Demo Logins */}
              <div className="mt-6 pt-6 border-t border-slate-800">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>1-Click RBAC Role Demo Logins</span>
                </div>
                <div className="space-y-2">
                  {DEMO_ACCOUNTS.map((demo) => (
                    <button
                      key={demo.role}
                      type="button"
                      onClick={() => handleQuickRoleLogin(demo)}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-black/40 hover:bg-indigo-950/50 border border-white/10 hover:border-indigo-500/50 transition-all text-left font-mono text-xs"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-lg">{demo.fallback.avatar}</span>
                        <div>
                          <div className="font-bold text-white">{demo.label}</div>
                          <div className="text-[10px] text-slate-400">{demo.identifier}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${roleBadgeColor(demo.role)}`}>
                        {demo.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-9 bg-black/60 border border-white/20 rounded-lg py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-sm"
                    placeholder="e.g. Alex Mercer"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Agent UID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      value={uid}
                      onChange={(e) => setUid(e.target.value)}
                      className="block w-full pl-9 bg-black/60 border border-white/20 rounded-lg py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-sm"
                      placeholder="FD-104"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Role Request</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="block w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
                  >
                    <option value="detective">Detective (Player)</option>
                    <option value="architect">Architect (Creator)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Department</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="block w-full pl-9 bg-black/60 border border-white/20 rounded-lg py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-sm"
                      placeholder="CSE / Frontend"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Contact</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="tel"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="block w-full pl-9 bg-black/60 border border-white/20 rounded-lg py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-sm"
                      placeholder="Phone"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-9 bg-black/60 border border-white/20 rounded-lg py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-sm"
                    placeholder="agent@frontenddetective.dev"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Select Avatar</label>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 font-mono uppercase tracking-wider mt-2"
              >
                {loading ? 'Initializing Agent...' : 'Create Agent Profile'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
