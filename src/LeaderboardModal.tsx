import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Trophy, Medal, Search, Flame, Clock, RefreshCw } from 'lucide-react';
import { useGameStore } from './store';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatar: string;
  xp: number;
  difficulty: string;
  timeLeft: number;
  date: string;
}

export default function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
  const { user } = useGameStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDiff, setFilterDiff] = useState<string>('All');

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://frontend-detective-test.onrender.com/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      } else {
        throw new Error('Failed to fetch leaderboard');
      }
    } catch (err) {
      console.warn('Backend unavailable, using fallback leaderboard data', err);
      // Fallback local storage or default items
      const local = localStorage.getItem('detective_leaderboard');
      if (local) {
        setEntries(JSON.parse(local));
      } else {
        setEntries([
          { id: '1', username: 'GarvitBhutani', avatar: '🕵️‍♂️', xp: 1250, difficulty: 'Nightmare', timeLeft: 8, date: new Date().toISOString() },
          { id: '2', username: 'CyberNinja', avatar: '🥷', xp: 950, difficulty: 'Hard', timeLeft: 12, date: new Date().toISOString() },
          { id: '3', username: 'CodeSherlock', avatar: '🔎', xp: 750, difficulty: 'Medium', timeLeft: 22, date: new Date().toISOString() },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEntries = entries.filter((e) => {
    const matchesSearch = e.username.toLowerCase().includes(search.toLowerCase());
    const matchesDiff = filterDiff === 'All' || e.difficulty.toLowerCase() === filterDiff.toLowerCase();
    return matchesSearch && matchesDiff;
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-indigo-950/80 backdrop-blur-md p-4 crt-flicker">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-3xl bg-slate-900 border-2 border-[#f59e0b] p-6 md:p-8 shadow-[0_0_50px_rgba(245,158,11,0.3)] relative text-white rounded-xl max-h-[90vh] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center space-x-3 border-b border-white/10 pb-4 mb-6">
          <Trophy className="w-8 h-8 text-[#f59e0b] animate-bounce" />
          <div>
            <h2 className="text-2xl font-black uppercase text-white tracking-widest flex items-center space-x-2">
              <span>HALL OF DETECTIVES</span>
              <span className="text-xs bg-[#f59e0b]/20 border border-[#f59e0b]/50 text-[#f59e0b] px-2 py-0.5 rounded font-mono">GLOBAL</span>
            </h2>
            <p className="text-xs font-mono text-white/50">Top Ranking Frontend Detectives Worldwide</p>
          </div>

          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="ml-auto p-2 bg-black/40 border border-white/20 hover:border-[#f59e0b] text-white/70 hover:text-white rounded transition-colors"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 font-mono text-xs">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search agent name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/60 border border-white/20 focus:border-[#f59e0b] pl-9 pr-3 py-2 rounded text-white outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
            <span className="text-white/40 uppercase font-bold">Scope:</span>
            {['All', 'Medium', 'Hard', 'Nightmare'].map((diff) => (
              <button
                key={diff}
                onClick={() => setFilterDiff(diff)}
                className={`px-3 py-1.5 rounded uppercase font-bold transition-colors border ${
                  filterDiff === diff
                    ? 'bg-[#f59e0b] text-black border-[#f59e0b]'
                    : 'bg-black/40 text-white/70 border-white/10 hover:border-white/30'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Table / List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-2 font-mono">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-white/40 font-mono">
              No detectives registered in this level yet.
            </div>
          ) : (
            filteredEntries.map((entry, index) => {
              const isCurrentUser = user && user.username.toLowerCase() === entry.username.toLowerCase();
              return (
                <div
                  key={entry.id || index}
                  className={`flex items-center justify-between p-3.5 rounded-lg border transition-all ${
                    isCurrentUser
                      ? 'bg-gradient-to-r from-[#6366f1]/20 to-[#f59e0b]/20 border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-black/40 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className="w-8 flex items-center justify-center font-bold text-base">
                      {index === 0 && <Medal className="w-6 h-6 text-yellow-400" />}
                      {index === 1 && <Medal className="w-6 h-6 text-slate-300" />}
                      {index === 2 && <Medal className="w-6 h-6 text-amber-600" />}
                      {index > 2 && <span className="text-white/50">#{index + 1}</span>}
                    </div>

                    {/* Avatar & Name */}
                    <div className="text-2xl">{entry.avatar || '🕵️'}</div>
                    <div>
                      <div className="font-bold text-white text-sm flex items-center space-x-2">
                        <span>{entry.username}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] bg-[#10b981] text-black font-bold px-1.5 py-0.2 rounded uppercase">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-white/40 flex items-center space-x-2">
                        <span>Level: {entry.difficulty}</span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-white/30" />
                          <span>{entry.timeLeft}s left</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* XP & Score */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#f59e0b] flex items-center justify-end space-x-1">
                      <Flame className="w-4 h-4 text-[#f59e0b]" />
                      <span>{entry.xp} CR</span>
                    </div>
                    <div className="text-[10px] text-white/30">
                      {new Date(entry.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
