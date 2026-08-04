import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Mail, ShieldCheck, LogOut, Award, Zap, Trophy, Hash, Phone, Building2 } from 'lucide-react';
import { useGameStore } from './store';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATARS = ['🕵️‍♂️', '🕵️‍♀️', '🥷', '🔎', '⚡', '🤖', '👾', '💻'];

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { user, setUser, setToken, logout } = useGameStore();
  const [mode, setMode] = useState<'register' | 'profile'>('register');
  
  useEffect(() => {
    if (user) setMode('profile');
    else setMode('register');
  }, [user]);

  // Form states
  const [name, setName] = useState('');
  const [uid, setUid] = useState('');
  const [branch, setBranch] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('https://frontend-detective-test.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          uid,
          branch,
          email,
          contact,
          avatar
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setToken(data.token);
      setUser(data.user);
      setMode('profile');
      
    } catch (err: any) {
      setError(err.message);
      // Fallback to local storage if API fails
      if (err.message === 'Failed to fetch') {
        const dummyUser = {
          id: `local-${Date.now()}`,
          username: name,
          email,
          avatar,
          badge: 'Rookie Detective',
          totalXp: 0,
          gamesPlayed: 0,
          victories: 0
        };
        setUser(dummyUser);
        setToken(`dummy-token-${Date.now()}`);
        setMode('profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setMode('register');
    onClose();
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
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-24 h-24 bg-slate-800 border border-indigo-500 rounded-full flex items-center justify-center text-5xl mb-4 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                {user.avatar}
              </div>
              <h2 className="text-2xl font-bold text-white font-mono">{user.username}</h2>
              <p className="text-indigo-400 font-mono text-sm">{user.badge}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
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
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl"
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center space-x-2 text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="text-xl font-bold uppercase tracking-widest font-mono text-white">Event Registration</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm mb-6 font-mono text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 bg-black/60 border border-white/20 rounded-lg py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Student UID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  className="block w-full pl-10 bg-black/60 border border-white/20 rounded-lg py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  placeholder="e.g. 21BCS1234"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Branch</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="block w-full pl-10 bg-black/60 border border-white/20 rounded-lg py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    placeholder="CSE / IT"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Contact</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="tel"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="block w-full pl-10 bg-black/60 border border-white/20 rounded-lg py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    placeholder="Phone number"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 bg-black/60 border border-white/20 rounded-lg py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  placeholder="name@university.edu"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Select Avatar</label>
              <div className="grid grid-cols-4 gap-2">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className={`text-2xl p-2 rounded-xl transition-all ${
                      avatar === emoji
                        ? 'bg-indigo-600 border border-indigo-400 scale-110 shadow-lg shadow-indigo-500/30'
                        : 'bg-black/40 border border-white/10 hover:bg-black/60 hover:scale-105'
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed font-mono uppercase tracking-wider mt-4"
            >
              {loading ? 'Initializing Agent...' : 'Join Event'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
