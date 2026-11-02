import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Flame, Users, QrCode, MonitorPlay, ChevronLeft, Radio } from 'lucide-react';
import { useGameStore } from './store';

export default function HostScreen({ onExit }: { onExit: () => void }) {
  const { activeRoomCode } = useGameStore();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const query = activeRoomCode ? `?roomCode=${encodeURIComponent(activeRoomCode)}` : '';
      const res = await fetch(`/api/leaderboard${query}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      } else {
        const local = localStorage.getItem('detective_leaderboard');
        if (local) setEntries(JSON.parse(local));
      }
    } catch {
      const local = localStorage.getItem('detective_leaderboard');
      if (local) setEntries(JSON.parse(local));
    } finally {
      setLoading(false);
    }
  }, [activeRoomCode]);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 3000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  const topEntries = entries.slice(0, 10);

  const joinUrl = window.location.origin;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}&bgcolor=1e293b&color=ffffff&margin=10`;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 text-white flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="p-6 md:p-8 flex items-center justify-between border-b border-white/10 bg-black/20">
        <div className="flex items-center space-x-4">
          <MonitorPlay className="w-10 h-10 text-indigo-500 animate-pulse" />
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                Frontend Detective LIVE
              </h1>
              {activeRoomCode && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-sm font-bold flex items-center space-x-1.5">
                  <Radio className="w-4 h-4 animate-ping" />
                  <span>ROOM: {activeRoomCode}</span>
                </span>
              )}
            </div>
            <p className="text-sm font-mono text-white/50 uppercase tracking-widest mt-1">
              Live Event Presenter & Telemetry Mode
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-center font-mono">
            <div className="text-xs text-white/50 uppercase">Active Submissions</div>
            <div className="text-2xl font-bold flex items-center justify-center space-x-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>{entries.length}</span>
            </div>
          </div>
          <button
            onClick={onExit}
            className="px-4 py-2 border border-white/20 hover:bg-white/10 rounded flex items-center space-x-2 transition-colors font-mono text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Exit Host Mode</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
        {/* Left: Join Instructions (QR) */}
        <div className="w-full lg:w-1/3 p-4 md:p-8 flex flex-col items-center justify-center bg-black/40 border-r border-white/10">
          <div className="bg-indigo-600/20 w-full max-w-sm mx-auto border border-indigo-500/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(99,102,241,0.2)]">
            <QrCode className="w-12 h-12 text-indigo-400 mb-4" />
            <h2 className="text-3xl font-bold mb-1">Join the Mission!</h2>
            <p className="text-white/60 font-mono text-sm mb-4">Scan or enter room code</p>

            {activeRoomCode && (
              <div className="mb-4 px-5 py-2 bg-emerald-500/20 border border-emerald-400 rounded-xl font-mono text-2xl font-black text-emerald-300 tracking-widest">
                {activeRoomCode}
              </div>
            )}

            <div className="bg-white p-4 rounded-xl shadow-2xl mb-6 flex items-center justify-center">
              <img
                src={qrUrl}
                alt="Join QR Code"
                className="w-full max-w-[180px] md:max-w-[220px] aspect-square object-contain rounded-lg"
              />
            </div>

            <div className="text-base md:text-lg font-mono text-white/80 bg-black/50 px-4 py-3 rounded-xl border border-white/10 w-full break-all">
              {joinUrl.replace(/^https?:\/\//, '')}
            </div>
          </div>
        </div>

        {/* Right: Live Leaderboard */}
        <div className="w-full lg:w-2/3 p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider flex items-center space-x-4">
              <Trophy className="w-10 h-10 text-[#f59e0b]" />
              <span>{activeRoomCode ? `Room ${activeRoomCode} Rankings` : 'Live Global Rankings'}</span>
            </h2>
            {loading && <div className="text-sm font-mono text-white/50 animate-pulse">Syncing...</div>}
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
            {topEntries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/30 font-mono text-xl">
                Waiting for agents to complete missions...
              </div>
            ) : (
              topEntries.map((entry, idx) => (
                <motion.div
                  key={entry.id || idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="bg-slate-800/80 border border-white/10 rounded-2xl p-5 flex items-center justify-between shadow-lg"
                >
                  <div className="flex items-center space-x-6">
                    <div className="w-12 text-center text-3xl font-black">
                      {idx === 0 ? (
                        <Medal className="w-10 h-10 text-yellow-400 mx-auto drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                      ) : idx === 1 ? (
                        <Medal className="w-10 h-10 text-slate-300 mx-auto" />
                      ) : idx === 2 ? (
                        <Medal className="w-10 h-10 text-amber-600 mx-auto" />
                      ) : (
                        <span className="text-white/40">#{idx + 1}</span>
                      )}
                    </div>
                    <div className="text-4xl">{entry.avatar}</div>
                    <div>
                      <h3 className="text-2xl font-bold">{entry.username}</h3>
                      <div className="text-xs font-mono text-white/50 uppercase tracking-widest mt-1">
                        Cleared: <span className="text-white">{entry.difficulty}</span>
                        {entry.caseTitle && <span> • {entry.caseTitle}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-[#f59e0b] flex items-center justify-end space-x-2">
                      <span>{entry.xp}</span>
                      <Flame className="w-7 h-7" />
                    </div>
                    <div className="text-xs font-mono text-white/40 uppercase mt-1">Total CR</div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
