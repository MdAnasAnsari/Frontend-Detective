import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, type CaseDefinition, type CaseNote } from './store';
import {
  Terminal,
  Crosshair,
  Cpu,
  ShieldAlert,
  Wifi,
  Battery,
  Maximize2,
  Info,
  ChevronRight,
  X,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  BarChart2,
  Activity,
  Settings,
  User,
  Users,
  LogIn,
  Trophy,
  Sliders,
  MonitorPlay,
  Radio,
  MessageSquarePlus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import AuthModal from './AuthModal';
import LeaderboardModal from './LeaderboardModal';
import AdminStudioModal from './AdminStudioModal';
import HostScreen from './HostScreen';

gsap.registerPlugin(ScrollTrigger);

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function HUD({
  onOpenAuth,
  onOpenStudio,
}: {
  onOpenAuth: () => void;
  onOpenStudio: () => void;
}) {
  const { attemptsLeft, timeLeft, xp, difficulty, combo, errors, user, activeRoomCode, resetGame } = useGameStore();
  const foundErrors = errors.filter((e) => e.fixed).length;
  const totalErrors = errors.length;
  const progress = totalErrors === 0 ? 0 : (foundErrors / totalErrors) * 100;
  const canAccessStudio = user && (user.role === 'admin' || user.role === 'architect');

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 w-full z-40 pointer-events-none"
    >
      <div className="bg-slate-900/70 border-b border-transparent [border-image:linear-gradient(to_right,#00f2ff,#bc00ff,#ffaa00)_1] backdrop-blur-md px-6 py-3 flex items-center justify-between font-mono crt-flicker shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-6">
          <button
            onClick={resetGame}
            className="flex items-center space-x-2 text-[#f59e0b] pointer-events-auto hover:opacity-80 transition-opacity"
            title="Return to Mission Select"
          >
            <Terminal className="w-5 h-5 animate-pulse text-[#10b981]" />
            <span className="font-bold tracking-widest uppercase text-sm bg-clip-text text-transparent bg-gradient-to-r from-[#f59e0b] to-[#6366f1]">
              DECODER_SYSTEM_v4.2
            </span>
          </button>
          <div className="hidden md:flex items-center space-x-4 text-xs">
            <span className="flex items-center space-x-1 text-[#06b6d4]">
              <Wifi className="w-3 h-3" /> <span>LINK: STABLE</span>
            </span>
            <span className="flex items-center space-x-1 text-[#06b6d4]">
              <Battery className="w-3 h-3" /> <span>PWR: 98%</span>
            </span>
            <span className="text-[#6366f1]">MOD: {difficulty.toUpperCase()}</span>
            {activeRoomCode && (
              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                ROOM: {activeRoomCode}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-[#f59e0b]/70 uppercase tracking-widest mb-0.5">Bugs Located</span>
              <div className="text-lg font-bold flex items-baseline space-x-1 text-[#f59e0b]">
                <span>{foundErrors}</span>
                <span className="text-[#f59e0b]/40 text-xs">/ {totalErrors}</span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] text-[#f43f5e]/70 uppercase tracking-widest mb-0.5">Integrity</span>
              <div className="text-lg font-bold text-[#f43f5e]">{attemptsLeft} ATK</div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] text-[#10b981]/70 uppercase tracking-widest mb-0.5">Uplink Time</span>
              <div className={cn('text-lg font-bold', timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-[#10b981]')}>
                {timeLeft}s
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] text-[#6366f1]/70 uppercase tracking-widest mb-0.5">Bounty (CR)</span>
              <motion.div
                key={xp}
                initial={{ scale: 1.2, color: '#fff' }}
                animate={{ scale: 1, color: '#6366f1' }}
                className="text-lg font-bold text-[#6366f1] flex items-center space-x-2"
              >
                <span>{xp.toString().padStart(4, '0')}</span>
                {combo > 1 && (
                  <span className="text-[10px] bg-[#6366f1]/20 text-[#6366f1] px-1.5 py-0.5 border border-[#6366f1]/30">
                    x{combo}
                  </span>
                )}
              </motion.div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pointer-events-auto">
            {canAccessStudio && (
              <button
                onClick={onOpenStudio}
                className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/20 text-amber-400 text-xs font-bold font-mono rounded flex items-center space-x-1.5 transition-colors"
                title="Open Command Studio (RBAC & CRUD)"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">STUDIO</span>
              </button>
            )}

            <button
              onClick={onOpenAuth}
              className="px-3 py-1.5 bg-[#6366f1]/10 border border-[#6366f1]/40 hover:bg-[#6366f1]/20 text-[#6366f1] text-xs font-bold font-mono rounded flex items-center space-x-1.5 transition-colors shadow-[0_0_10px_rgba(99,102,241,0.2)]"
              title={user ? `Profile (${user.username} - ${user.role})` : 'Login / Register'}
            >
              {user ? (
                <>
                  <span>{user.avatar}</span>
                  <span className="hidden md:inline">{user.username}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">LOGIN</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="w-full h-1 bg-[#06050b]">
        <motion.div
          className="h-full bg-gradient-to-r from-[#f59e0b] via-[#6366f1] to-[#10b981] shadow-[0_0_10px_#6366f1]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

function MistakeElement({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { errors, fixError, hintTargetId } = useGameStore();
  const errorDef = errors.find((e) => e.id === id);
  const isFixed = errorDef?.fixed;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (errorDef && !isFixed) {
      fixError(id);
    }
  };

  if (!errorDef) return <>{children}</>;

  const currentClass = isFixed ? errorDef.fixedClass : errorDef.errorClass;
  const isSingleElement = React.Children.count(children) === 1 && React.isValidElement(children);

  const wrapperClass = cn(
    'relative transition-all duration-300',
    !isFixed && 'mistake-target hover:scale-[1.05] hover:rotate-1 hover:shadow-2xl hover:z-50 duration-300 transition-all',
    !isFixed && hintTargetId === id && 'ring-4 ring-[#f59e0b] shadow-[0_0_30px_#f59e0b] animate-pulse z-50',
    className,
    !isSingleElement && currentClass
  );

  const renderedChildren = isSingleElement
    ? React.cloneElement(children as React.ReactElement, {
        className: cn((children as React.ReactElement<any>).props.className, currentClass),
      } as any)
    : children;

  return (
    <motion.div
      layout
      onClick={handleClick}
      className={wrapperClass}
      animate={isFixed ? { scale: [1, 1.05, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] } : {}}
      transition={{ duration: 0.4 }}
    >
      {renderedChildren}
      {isFixed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-10 -right-4 bg-[#06b6d4] text-black text-xs font-mono font-bold px-3 py-2 z-[60] border border-black shadow-[0_0_15px_#06b6d4] flex flex-col items-center"
        >
          <span>FIXED (+{errorDef.points} CR)</span>
          <span className="text-[9px] mt-1 opacity-80 whitespace-nowrap">{errorDef.description}</span>
        </motion.div>
      )}
    </motion.div>
  );
}

function SaasLayout() {
  const { missClick, isPlaying, errors, activeCase } = useGameStore();

  const handlePageClick = () => {
    if (isPlaying) {
      missClick();
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex justify-center items-center" onClick={handlePageClick}>
      {/* Central Viewport framing */}
      <div className="relative w-full max-w-5xl bracket-corner p-2">
        <div className="absolute -top-6 left-4 text-[#10b981] font-mono text-xs flex items-center space-x-2">
          <Maximize2 className="w-3 h-3" />
          <span>{activeCase?.title.toUpperCase() || 'SAAS LANDING // VIEWPORT 1'}</span>
        </div>

        <div className="glass-panel p-10 bg-slate-900/60 shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden relative border-t-[#f59e0b] border-r-[#6366f1] border-b-[#f43f5e] border-l-[#10b981] border-2">
          <div className="text-center max-w-3xl mx-auto mb-20 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 bg-[#06b6d4]/10 text-[#06b6d4] px-4 py-1.5 mb-8 font-mono text-xs border border-[#06b6d4]/30 backdrop-blur-sm shadow-[0_0_15px_rgba(0,255,136,0.2)]"
            >
              <span className="w-1.5 h-1.5 bg-[#06b6d4] animate-pulse"></span>
              <span>INSPECTION ENVIRONMENT ONLINE</span>
            </motion.div>

            <MistakeElement id={errors[3]?.id || 'err-4'} className="mb-6">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                Perfect the layout.
              </h1>
            </MistakeElement>

            <p className="text-lg text-[#e5e1e4]/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              Detect anomalies in the Document Object Model. Ensure all components meet the strict visual guidelines of modern web design.
            </p>

            <div className="flex items-center justify-center space-x-6">
              <MistakeElement id={errors[0]?.id || 'err-1'}>
                <button className="bg-gradient-to-r from-[#f59e0b] to-[#6366f1] text-white font-bold font-mono tracking-widest shadow-[0_0_15px_#6366f1] hover:shadow-[0_0_25px_#f59e0b] transition-all cursor-crosshair border-none">
                  DEPLOY
                </button>
              </MistakeElement>

              <MistakeElement id={errors[4]?.id || 'err-5'}>
                <button className="font-mono tracking-widest text-[#10b981] border border-[#10b981]/50 hover:bg-[#10b981]/20 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#10b981]/20 duration-300 transition-all cursor-crosshair px-6 py-3 shadow-[0_0_10px_rgba(255,170,0,0.1)]">
                  VIEW CONSOLE
                </button>
              </MistakeElement>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {[1, 2, 3].map((i) => (
              <MistakeElement id={i === 2 ? errors[2]?.id || 'err-3' : `no-err-${i}`} key={i} className={i !== 2 ? 'rounded-none' : ''}>
                <div className="bg-[#06050b]/60 border border-[#6366f1]/30 p-6 h-full backdrop-blur-md group hover:border-[#f43f5e] hover:-translate-y-3 hover:shadow-2xl duration-300 transition-all shadow-lg">
                  <MistakeElement id={i === 1 ? errors[1]?.id || 'err-2' : `no-icon-err-${i}`}>
                    <div className="w-10 h-10 bg-[#10b981]/10 text-[#10b981] flex items-center justify-center mb-5 border border-[#10b981]/40 group-hover:bg-[#f43f5e]/20 group-hover:text-[#f43f5e] transition-colors">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                  </MistakeElement>
                  <h3 className="text-lg font-bold mb-2 text-white group-hover:text-[#f59e0b] transition-colors">Component State</h3>
                  <p className="text-[#e5e1e4]/60 text-sm leading-relaxed font-mono">
                    Advanced React lifecycle protection. Re-renders are isolated and optimized for maximum framerate.
                  </p>
                </div>
              </MistakeElement>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MediumLayout() {
  const { missClick, isPlaying, errors, activeCase } = useGameStore();
  const handlePageClick = () => {
    if (isPlaying) missClick();
  };
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex justify-center items-center" onClick={handlePageClick}>
      <div className="relative w-full max-w-5xl bracket-corner p-2">
        <div className="absolute -top-6 left-4 text-[#10b981] font-mono text-xs flex items-center space-x-2">
          <ShoppingCart className="w-3 h-3" />
          <span>{activeCase?.title.toUpperCase() || 'E-COMMERCE // PRODUCT RENDER'}</span>
        </div>
        <div className="glass-panel p-10 bg-slate-900/60 shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden relative border-t-[#f59e0b] border-r-[#6366f1] border-b-[#f43f5e] border-l-[#10b981] border-2">
          <div className="flex flex-col md:flex-row gap-12 relative z-10">
            <MistakeElement
              id={errors[0]?.id || 'med-err-1'}
              className="w-full md:w-1/2 flex items-center justify-center bg-black/40 border border-[#6366f1]/30 p-8 min-h-[400px]"
            >
              <div className="w-64 h-64 bg-gradient-to-tr from-[#6366f1] to-[#f43f5e] rounded-full blur-3xl opacity-20 absolute" />
              <img
                src="/favicon.svg"
                className="w-40 h-40 object-contain relative z-10 drop-shadow-[0_0_25px_rgba(99,102,241,0.6)]"
                alt="Neural Module"
              />
            </MistakeElement>
            <div className="w-full md:w-1/2 flex flex-col justify-center">
              <MistakeElement id={errors[3]?.id || 'med-err-4'} className="relative">
                <div className="inline-flex items-center space-x-1 text-[#f59e0b] mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                  <span className="text-white/50 text-xs ml-2 font-mono">(128 reviews)</span>
                </div>
              </MistakeElement>
              <MistakeElement id={errors[2]?.id || 'med-err-3'}>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 uppercase">Neural Interface V.4</h1>
              </MistakeElement>
              <p className="text-[#e5e1e4]/70 mb-8 font-mono text-sm leading-relaxed">
                Direct brain-to-machine connectivity module. Increases typing speed by 400% through synaptic prediction algorithms.
              </p>
              <div className="text-3xl font-bold text-[#10b981] mb-8 font-mono">2,499 CR</div>
              <div className="flex space-x-4">
                <MistakeElement id={errors[1]?.id || 'med-err-2'}>
                  <button className="bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold px-8 py-4 uppercase tracking-widest font-mono">
                    Add to Cart
                  </button>
                </MistakeElement>
                <MistakeElement id={errors[4]?.id || 'med-err-5'}>
                  <button className="border border-[#f43f5e] text-[#f43f5e] hover:bg-[#f43f5e]/10 font-bold px-8 py-4 uppercase tracking-widest font-mono bg-gradient-to-r from-[#f43f5e]/5">
                    Wishlist
                  </button>
                </MistakeElement>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HardLayout() {
  const { missClick, isPlaying, errors, activeCase } = useGameStore();
  const handlePageClick = () => {
    if (isPlaying) missClick();
  };
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex justify-center items-center" onClick={handlePageClick}>
      <div className="relative w-full max-w-6xl bracket-corner p-2">
        <div className="absolute -top-6 left-4 text-[#f59e0b] font-mono text-xs flex items-center space-x-2">
          <BarChart2 className="w-3 h-3" />
          <span>{activeCase?.title.toUpperCase() || 'DATA_ANALYTICS // DASHBOARD'}</span>
        </div>
        <div className="glass-panel bg-slate-900/60 shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden relative border-t-[#f59e0b] border-r-[#6366f1] border-b-[#f43f5e] border-l-[#10b981] border-2 flex flex-col md:flex-row">
          <MistakeElement
            id={errors[0]?.id || 'hard-err-1'}
            className="w-full md:w-64 border-r border-[#6366f1]/30 p-6 flex flex-col space-y-6"
          >
            <div className="text-[#6366f1] font-black tracking-widest text-xl mb-8">NEXUS_OS</div>
            <div className="space-y-4 font-mono text-sm uppercase tracking-widest text-white/50">
              <div className="flex items-center space-x-3 text-white bg-[#6366f1]/20 p-2 rounded">
                <Activity className="w-4 h-4 text-[#6366f1]" />
                <span>Overview</span>
              </div>
              <div className="flex items-center space-x-3 hover:text-white transition-colors p-2">
                <Users className="w-4 h-4" />
                <span>Users</span>
              </div>
              <div className="flex items-center space-x-3 hover:text-white transition-colors p-2">
                <Settings className="w-4 h-4" />
                <span>Config</span>
              </div>
            </div>
          </MistakeElement>
          <div className="flex-1 p-8">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-bold text-white uppercase">System Metrics</h2>
              <MistakeElement
                id={errors[4]?.id || 'hard-err-5'}
                className="w-32 h-10 border border-white/20 bg-black/40 flex items-center px-4 text-xs font-mono text-white/50"
              >
                Last 24 Hours
              </MistakeElement>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {[
                { label: 'Active Nodes', val: '8,249', color: 'text-[#10b981]' },
                { label: 'Data Transfer', val: '4.2 PB', color: 'text-[#6366f1]' },
                { label: 'Threats Detected', val: '0', color: 'text-[#f59e0b]' },
              ].map((stat, i) => (
                <MistakeElement
                  key={i}
                  id={i === 1 ? errors[2]?.id || 'hard-err-3' : `no-err-stat-${i}`}
                  className="bg-black/50 border border-white/10 p-6"
                >
                  <div className="text-xs font-mono uppercase tracking-widest text-white/40 mb-2">{stat.label}</div>
                  <div className={`${stat.color} text-4xl font-black`}>{stat.val}</div>
                </MistakeElement>
              ))}
            </div>
            <MistakeElement
              id={errors[1]?.id || 'hard-err-2'}
              className="w-full h-64 bg-black/50 border border-[#6366f1]/30 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoOTksIDEwMiwgMjQxLCAwLjIpIi8+PC9zdmc+')] opacity-50" />
              <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#6366f1]/20 to-transparent" />
              <MistakeElement id={errors[3]?.id || 'hard-err-4'} className="absolute bottom-8 left-8 right-8 h-px bg-white/20">
                <div className="absolute -top-1.5 left-1/4 w-3 h-3 bg-[#f43f5e] rounded-full shadow-[0_0_10px_#f43f5e]" />
                <div className="absolute -top-1.5 left-1/2 w-3 h-3 bg-[#10b981] rounded-full shadow-[0_0_10px_#10b981]" />
                <div className="absolute -top-1.5 right-1/4 w-3 h-3 bg-[#f59e0b] rounded-full shadow-[0_0_10px_#f59e0b]" />
              </MistakeElement>
            </MistakeElement>
          </div>
        </div>
      </div>
    </div>
  );
}

function NightmareLayout() {
  const { missClick, isPlaying, errors, activeCase } = useGameStore();
  const handlePageClick = () => {
    if (isPlaying) missClick();
  };
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex justify-center items-center" onClick={handlePageClick}>
      <div className="relative w-full max-w-4xl bracket-corner p-2">
        <div className="absolute -top-6 left-4 text-[#f43f5e] font-mono text-xs flex items-center space-x-2">
          <Settings className="w-3 h-3 animate-spin" />
          <span>{activeCase?.title.toUpperCase() || 'USER_PREFERENCES // ROOT_ACCESS'}</span>
        </div>
        <div className="glass-panel p-10 bg-slate-900/80 shadow-[0_0_50px_rgba(244,63,94,0.3)] relative border-t-[#f59e0b] border-r-[#6366f1] border-b-[#f43f5e] border-l-[#10b981] border-2">
          <div className="flex items-center space-x-8 mb-12 border-b border-white/10 pb-8">
            <MistakeElement
              id={errors[0]?.id || 'night-err-1'}
              className="w-24 h-24 bg-black border-2 border-[#f43f5e] flex items-center justify-center relative overflow-hidden group"
            >
              <User className="w-12 h-12 text-[#f43f5e]" />
              <div className="absolute inset-0 bg-[#f43f5e]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[8px] font-mono uppercase text-white font-bold">Upload</span>
              </div>
            </MistakeElement>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-wider">Administrator</h2>
              <div className="text-[#f59e0b] font-mono text-sm uppercase tracking-widest mt-1">Access Level: Maximum</div>
            </div>
          </div>

          <div className="space-y-8">
            {[
              { title: 'Enable Telemetry', desc: 'Send anonymous usage data to central command.', id: 1 },
              { title: 'Auto-Purge Logs', desc: 'Clear system logs every 24 hours to save memory.', id: 2 },
              { title: 'Override Protocols', desc: 'Bypass safety checks on unverified code execution.', id: 3 },
            ].map((setting, i) => (
              <MistakeElement
                key={i}
                id={i === 1 ? errors[4]?.id || 'night-err-5' : `no-err-set-${i}`}
                className="flex items-start justify-between p-4 bg-black/40 border border-white/5 hover:border-white/20 transition-colors"
              >
                <div className="pr-8">
                  <MistakeElement id={i === 0 ? errors[2]?.id || 'night-err-3' : `no-err-txt-${i}`}>
                    <h3 className="text-lg font-bold text-white mb-1 uppercase">{setting.title}</h3>
                  </MistakeElement>
                  <p className="text-white/50 text-sm font-mono">{setting.desc}</p>
                </div>
                <div className="w-12 h-6 bg-white/10 rounded-full relative cursor-pointer border border-white/20">
                  <div className="w-4 h-4 bg-white/50 rounded-full absolute top-1 left-1" />
                </div>
              </MistakeElement>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex justify-end space-x-4">
            <MistakeElement id={errors[3]?.id || 'night-err-4'}>
              <button className="px-6 py-3 font-mono text-sm uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                Cancel
              </button>
            </MistakeElement>
            <MistakeElement id={errors[1]?.id || 'night-err-2'}>
              <button className="bg-[#f43f5e] hover:bg-red-600 text-white font-bold px-8 py-3 uppercase tracking-widest font-mono shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                Save Changes
              </button>
            </MistakeElement>
          </div>
        </div>
      </div>
    </div>
  );
}

function TutorialOverlay({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-950/80 backdrop-blur-sm p-6 crt-flicker pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-xl w-full bg-slate-900/80 backdrop-blur-md border-2 border-[#10b981] p-8 shadow-[0_0_30px_rgba(16,185,129,0.3)] relative"
      >
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 text-[#e5e1e4]/50 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center space-x-3 mb-6 border-b border-[#10b981]/30 pb-4">
          <Info className="w-8 h-8 text-[#10b981]" />
          <h2 className="text-2xl font-bold uppercase text-white tracking-widest">Training Module</h2>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h3 className="text-[#f59e0b] font-mono text-lg mb-2">1. The Objective</h3>
              <p className="text-[#e5e1e4]/80 font-mono text-sm leading-relaxed mb-6">
                You are a Frontend Detective. Your job is to find visual inconsistencies (bugs) in the UI. Things like misaligned buttons, wrong colors, or broken borders.
              </p>
              <div className="flex justify-end">
                <button onClick={() => setStep(2)} className="cyber-button px-6 py-2 border-[#f59e0b] text-[#f59e0b]">
                  Next <ChevronRight className="inline w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h3 className="text-[#6366f1] font-mono text-lg mb-2">2. The Execution</h3>
              <p className="text-[#e5e1e4]/80 font-mono text-sm leading-relaxed mb-6">
                Click on the anomalous elements to fix them. But be careful: clicking on the wrong element will reduce your <strong className="text-[#f43f5e]">Integrity (Attempts)</strong>. If Integrity reaches 0, you fail.
              </p>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="text-[#e5e1e4]/50 hover:text-white font-mono text-sm uppercase">
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="cyber-button px-6 py-2 border-[#6366f1] text-[#6366f1] shadow-[0_0_10px_rgba(188,0,255,0.3)]"
                >
                  Next <ChevronRight className="inline w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h3 className="text-[#10b981] font-mono text-lg mb-2">3. The Mission</h3>
              <p className="text-[#e5e1e4]/80 font-mono text-sm leading-relaxed mb-6">
                Chain fixes together quickly to earn a higher <strong>Bounty Multiplier</strong>, then inspect the Post-Mortem Debrief after completing the assignment!
              </p>
              <div className="flex justify-between items-center">
                <button onClick={() => setStep(2)} className="text-[#e5e1e4]/50 hover:text-white font-mono text-sm uppercase">
                  Back
                </button>
                <button
                  onClick={onComplete}
                  className="bg-[#10b981] text-black font-bold font-mono px-6 py-2 shadow-[0_0_15px_#10b981] hover:bg-white transition-colors"
                >
                  START MISSION
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex justify-center space-x-2">
          <div className={cn('w-2 h-2 rounded-full', step === 1 ? 'bg-[#10b981]' : 'bg-[#10b981]/20')} />
          <div className={cn('w-2 h-2 rounded-full', step === 2 ? 'bg-[#10b981]' : 'bg-[#10b981]/20')} />
          <div className={cn('w-2 h-2 rounded-full', step === 3 ? 'bg-[#10b981]' : 'bg-[#10b981]/20')} />
        </div>
      </motion.div>
    </div>
  );
}

function StartScreen({
  onStart,
  onOpenAuth,
  onOpenLeaderboard,
  onOpenStudio,
  onOpenHost,
}: {
  onStart: (target: CaseDefinition) => void;
  onOpenAuth: () => void;
  onOpenLeaderboard: () => void;
  onOpenStudio: () => void;
  onOpenHost: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const { user, cases, fetchCases, casesError, activeRoomCode, setActiveRoomCode } = useGameStore();
  const [roomInput, setRoomInput] = useState(activeRoomCode || '');
  const [roomBanner, setRoomBanner] = useState('');

  const canAccessStudio = user && (user.role === 'admin' || user.role === 'architect');

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  useGSAP(
    () => {
      gsap.to('.hero-text', {
        y: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.2,
        ease: 'power4.out',
      });

      const scrollEl = document.querySelector('.horizontal-scroll') as HTMLElement;
      if (scrollEl) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: '.sticky-container',
            start: 'top top',
            end: '+=4000',
            scrub: 1,
            pin: true,
          },
        });

        tl.to('.horizontal-scroll', {
          x: () => -(scrollEl.scrollWidth - window.innerWidth),
          ease: 'none',
          duration: 2,
        });

        tl.to({}, { duration: 1 });
      }
    },
    { scope: container }
  );

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim()) {
      setActiveRoomCode(null);
      setRoomBanner('Cleared active room filter');
      setTimeout(() => setRoomBanner(''), 2500);
      return;
    }
    const clean = roomInput.trim().toUpperCase();
    setActiveRoomCode(clean);
    setRoomBanner(`Linked to Live Room: ${clean}`);
    setTimeout(() => setRoomBanner(''), 3000);
  };

  return (
    <div ref={container} className="relative selection:bg-indigo-500/30 selection:text-indigo-900 bg-slate-50 text-slate-900 w-full min-h-screen z-50">
      {/* Light Animated Backgrounds */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, #f8fafc 0%, #e2e8f0 100%)' }} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.15), transparent 40%), radial-gradient(circle at 85% 30%, rgba(14, 165, 233, 0.15), transparent 40%), radial-gradient(circle at 50% 80%, rgba(168, 85, 247, 0.15), transparent 40%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(14, 165, 233, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(circle at 50% 50%, black 40%, transparent 80%)',
        }}
      />

      {/* Top Header Bar for Login, Leaderboard, Studio & Host Mode */}
      <div className="fixed top-4 right-4 md:right-6 z-[60] flex flex-wrap items-center justify-end gap-2 md:gap-3 font-mono text-xs">
        {canAccessStudio && (
          <>
            <button
              onClick={onOpenStudio}
              className="bg-slate-900/90 border border-indigo-400/50 hover:bg-indigo-950 text-indigo-300 shadow-lg backdrop-blur-md px-3 py-2 md:px-4 rounded-full font-bold uppercase tracking-wider flex items-center space-x-2 transition-all hover:scale-105"
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden sm:inline">Command Studio</span>
            </button>

            <button
              onClick={onOpenHost}
              className="bg-slate-900/90 border border-emerald-400/50 hover:bg-emerald-950 text-emerald-300 shadow-lg backdrop-blur-md px-3 py-2 md:px-4 rounded-full font-bold uppercase tracking-wider flex items-center space-x-2 transition-all hover:scale-105"
            >
              <MonitorPlay className="w-4 h-4" />
              <span className="hidden sm:inline">Live Host</span>
            </button>
          </>
        )}

        <button
          onClick={onOpenLeaderboard}
          className="bg-slate-900/80 border border-[#f59e0b]/50 hover:bg-[#f59e0b]/20 text-[#f59e0b] shadow-lg backdrop-blur-md px-3 py-2 md:px-4 rounded-full font-bold uppercase tracking-wider flex items-center space-x-2 transition-all hover:scale-105"
        >
          <Trophy className="w-4 h-4" />
          <span className="hidden sm:inline">Leaderboard</span>
        </button>

        <button
          onClick={onOpenAuth}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg backdrop-blur-md px-3 py-2 md:px-4 rounded-full font-bold uppercase tracking-wider flex items-center space-x-2 transition-all hover:scale-105"
        >
          {user ? (
            <>
              <span className="text-base">{user.avatar}</span>
              <span className="hidden sm:inline">{user.username}</span>
              <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full uppercase">{user.role}</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In / RBAC</span>
            </>
          )}
        </button>
      </div>

      {/* Hero Section */}
      <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Floating Background Developer Badges */}
        {[
          { text: 'const isFlawless = false;', top: '20%', left: '5%', delay: 0.5, rotate: -10, color: 'text-rose-500' },
          { text: 'CSS Object Model', top: '70%', left: '10%', delay: 0.8, rotate: 5, color: 'text-indigo-500' },
          { text: 'DOM Integrity: 99%', top: '30%', right: '5%', delay: 0.6, rotate: 15, color: 'text-emerald-500' },
          { text: '<React.StrictMode>', top: '60%', right: '8%', delay: 0.9, rotate: -5, color: 'text-sky-500' },
          { text: 'useEffect(() => scan(), [])', top: '85%', left: '40%', delay: 1.1, rotate: 2, color: 'text-purple-500' },
          { text: 'z-index: 9999;', top: '15%', right: '30%', delay: 0.7, rotate: -15, color: 'text-amber-500' },
        ].map((badge, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0, y: 50, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: badge.delay, type: 'spring', damping: 10 }}
            className="absolute z-0 hidden md:block"
            style={{ top: badge.top, left: badge.left, right: badge.right }}
          >
            <motion.div
              animate={{ y: [-5, 5, -5], rotate: [badge.rotate - 2, badge.rotate + 2, badge.rotate - 2] }}
              transition={{ repeat: Infinity, duration: 4 + i, ease: 'easeInOut' }}
              className={cn(
                'bg-white/60 backdrop-blur-md border border-white/80 font-mono text-xs px-4 py-2 rounded-xl shadow-[0_8px_16px_rgba(0,0,0,0.05)] font-bold',
                badge.color
              )}
            >
              {badge.text}
            </motion.div>
          </motion.div>
        ))}

        <div className="text-center z-10 w-full max-w-6xl relative">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.5, ease: 'easeOut' }}>
            <div className="flex flex-col items-center mb-8 pt-20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '2px' }}
                className="h-16 bg-gradient-to-b from-transparent to-indigo-500 mb-4"
                transition={{ duration: 1, delay: 0.2 }}
              />
              <div className="inline-flex items-center space-x-2 bg-white/90 border border-indigo-100 shadow-[0_0_20px_rgba(99,102,241,0.2)] rounded-full px-5 py-2 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                <span className="text-xs font-bold font-mono tracking-widest text-indigo-600 uppercase">System Initialized</span>
              </div>
            </div>

            <div className="flex flex-col items-center relative w-full mb-12">
              <motion.div
                animate={{ y: [-10, 10, -10], rotate: [-1, 1, -1] }}
                transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                className="self-start md:ml-12"
              >
                <motion.h1
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
                    },
                  }}
                  initial="hidden"
                  animate="visible"
                  className="text-[7rem] md:text-[12rem] leading-[0.8] font-cursive drop-shadow-[0_20px_30px_rgba(14,165,233,0.3)] font-bold flex flex-wrap"
                >
                  {'Frontend'.split('').map((char, index) => (
                    <motion.span
                      key={index}
                      variants={{
                        hidden: { opacity: 0, y: 100, rotate: -20, filter: 'blur(10px)' },
                        visible: {
                          opacity: 1,
                          y: 0,
                          rotate: 0,
                          filter: 'blur(0px)',
                          transition: { type: 'spring', damping: 12, stiffness: 100 },
                        },
                      }}
                      className={cn('inline-block', char === ' ' && 'w-[2rem] md:w-[4rem]')}
                      style={{
                        background: 'linear-gradient(to bottom right, #0284c7, #0ea5e9, #38bdf8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </motion.h1>
              </motion.div>

              <motion.div
                animate={{ y: [10, -10, 10], rotate: [1, -1, 1] }}
                transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
                className="self-end md:mr-12 -mt-4 md:-mt-12"
              >
                <motion.h1
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.08, delayChildren: 0.8 },
                    },
                  }}
                  initial="hidden"
                  animate="visible"
                  className="text-[7rem] md:text-[12rem] leading-[0.8] font-cursive drop-shadow-[0_20px_30px_rgba(99,102,241,0.3)] font-bold flex flex-wrap"
                >
                  {'Detective'.split('').map((char, index) => (
                    <motion.span
                      key={index}
                      variants={{
                        hidden: { opacity: 0, y: -100, rotate: 20, filter: 'blur(10px)' },
                        visible: {
                          opacity: 1,
                          y: 0,
                          rotate: 0,
                          filter: 'blur(0px)',
                          transition: { type: 'spring', damping: 12, stiffness: 100 },
                        },
                      }}
                      className={cn('inline-block', char === ' ' && 'w-[2rem] md:w-[4rem]')}
                      style={{
                        background: 'linear-gradient(to bottom right, #4338ca, #6366f1, #8b5cf6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </motion.h1>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2, duration: 1 }} className="flex flex-col items-center">
              <p className="text-xl md:text-3xl font-bold mb-8 max-w-3xl mx-auto leading-relaxed bg-white/60 p-6 rounded-3xl backdrop-blur-md border border-white/80 shadow-[0_10px_40px_-10px_rgba(99,102,241,0.2)] text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-purple-800">
                Solve the web's greatest mysteries. Prove your eye for detail in an immersive, high-performance UI environment.
              </p>

              <div className="flex flex-wrap justify-center gap-4 font-mono text-sm uppercase tracking-widest font-black mb-16">
                <span className="flex items-center text-sky-600 bg-sky-50 px-4 py-2 rounded-full border border-sky-200 shadow-sm">
                  <Search className="w-4 h-4 mr-2" /> Scan
                </span>
                <span className="flex items-center text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 shadow-sm">
                  <Crosshair className="w-4 h-4 mr-2" /> Identify
                </span>
                <span className="flex items-center text-rose-600 bg-rose-50 px-4 py-2 rounded-full border border-rose-200 shadow-sm">
                  <ShieldCheck className="w-4 h-4 mr-2" /> Resolve
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* GSAP Sticky Scroll Section */}
      <div className="sticky-container h-screen flex items-center bg-white/70 backdrop-blur-xl border-y-4 border-white/50 overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.1)]">
        <div className="horizontal-scroll whitespace-nowrap text-[18vw] font-black tracking-tighter pl-[10vw] pr-[10vw] flex space-x-16 inline-block w-max">
          <span className="text-slate-900">OBSERVE.</span>
          <span className="text-slate-900">ANALYZE.</span>
          <span className="text-slate-900">PERFECT.</span>
        </div>
      </div>

      {/* Start Game Section */}
      <div className="min-h-screen flex flex-col justify-center py-32 px-6 relative">
        <div className="w-full max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-14 gap-6">
            <div>
              <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight drop-shadow-sm">Select Case Assignment</h2>
              <p className="font-mono text-sm text-slate-600 mt-2">
                {canAccessStudio
                  ? 'You have Architect/Admin clearance — use Command Studio in the top bar to create or edit Cases!'
                  : 'Sign in with an Architect or Admin account to unlock the live Case Builder & RBAC Console.'}
              </p>
            </div>

            {/* Live Room Join Box */}
            <form
              onSubmit={handleJoinRoom}
              className="bg-white/80 p-4 rounded-2xl backdrop-blur-md border border-slate-200 shadow-lg flex flex-col space-y-2 w-full md:w-auto font-mono text-xs"
            >
              <div className="flex items-center justify-between text-slate-600 font-bold uppercase">
                <span className="flex items-center space-x-1.5">
                  <Radio className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Join Live Event Room</span>
                </span>
                {activeRoomCode && <span className="text-emerald-600 font-black">ACTIVE: {activeRoomCode}</span>}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  placeholder="Room code (e.g. FD-2026)"
                  className="bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold uppercase outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold uppercase rounded-xl transition-colors"
                >
                  {roomInput.trim() ? 'Link' : 'Clear'}
                </button>
              </div>
              {roomBanner && <span className="text-[11px] text-emerald-600 font-bold">{roomBanner}</span>}
            </form>
          </div>

          {casesError && (
            <div className="w-full px-6 py-5 border-t-[3px] border-red-500/30 bg-red-50 text-red-700">
              <div className="font-bold uppercase text-sm tracking-wider mb-1">Case files unavailable</div>
              <div className="text-xs font-mono">{casesError}</div>
              <button
                type="button"
                onClick={() => fetchCases()}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase rounded-lg"
              >
                Retry
              </button>
            </div>
          )}

          {!casesError && cases.length === 0 && (
            <div className="w-full px-6 py-5 border-t-[3px] border-slate-900/10 text-xs font-mono text-slate-500">
              Loading case files from the server...
            </div>
          )}

          <div className="flex flex-col w-full border-t-[3px] border-slate-900/10">
            {cases.map((caseItem, i) => {
              const colorPalette = {
                Demo: { accent: 'text-blue-600', bg: 'hover:bg-blue-50', borderHover: 'hover:border-blue-300' },
                Medium: { accent: 'text-emerald-600', bg: 'hover:bg-emerald-50', borderHover: 'hover:border-emerald-300' },
                Hard: { accent: 'text-purple-600', bg: 'hover:bg-purple-50', borderHover: 'hover:border-purple-300' },
                Nightmare: { accent: 'text-rose-600', bg: 'hover:bg-rose-50', borderHover: 'hover:border-rose-300' },
              }[caseItem.difficulty] || { accent: 'text-indigo-600', bg: 'hover:bg-indigo-50', borderHover: 'hover:border-indigo-300' };

              return (
                <div
                  key={caseItem.id}
                  onClick={() => onStart(caseItem)}
                  className={cn(
                    'group flex flex-col md:flex-row items-start md:items-center justify-between py-10 border-b-[3px] border-slate-900/10 cursor-pointer transition-all duration-500 px-4 md:px-12 rounded-2xl',
                    colorPalette.bg,
                    colorPalette.borderHover
                  )}
                >
                  <div className="flex items-center space-x-8 md:space-x-12 mb-6 md:mb-0">
                    <span className={cn('font-mono font-black text-2xl opacity-60 group-hover:opacity-100 transition-opacity', colorPalette.accent)}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-4xl md:text-6xl font-black text-slate-900 transition-all uppercase tracking-tight">
                          {caseItem.difficulty === 'Demo' && caseItem.id === 'case-demo' ? 'Demo Level' : caseItem.title}
                        </h3>
                        {!caseItem.isOfficial && (
                          <span className="px-2.5 py-1 text-xs font-mono uppercase font-bold bg-indigo-100 text-indigo-700 rounded-full">
                            Custom Case
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-mono text-slate-500 mt-1">
                        {caseItem.title} • {caseItem.errors.length} DOM Anomalies • Layout: {caseItem.layoutType}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-14 w-full md:w-auto">
                    <div className="flex flex-col text-left">
                      <span className="font-mono text-xs font-bold uppercase tracking-widest text-slate-500">Clearance Role</span>
                      <span className="text-lg font-black transition-colors text-slate-700 group-hover:text-slate-900">
                        {caseItem.roleTitle}
                      </span>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-mono text-xs font-bold uppercase tracking-widest text-slate-500">Time Limit</span>
                      <span className="text-lg font-black font-mono transition-colors text-slate-800 group-hover:text-slate-900">
                        {caseItem.timeLimit}s
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-slate-900/5 bg-white/40 backdrop-blur-md z-10 relative mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="w-10 h-10 flex items-center justify-center border border-slate-300 shadow-sm bg-slate-900 text-emerald-400 rounded-lg p-1.5">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="text-slate-500 font-mono text-sm font-bold tracking-widest">
              © {new Date().getFullYear()} Frontend Detective.
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-slate-600 font-mono text-xs uppercase tracking-widest font-bold bg-slate-100 px-4 py-2 rounded-full shadow-sm border border-slate-200">
              Developed by Garvit Amit Bhutani
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function EndScreen({ isVictory }: { isVictory: boolean }) {
  const { xp, timeLeft, difficulty, resetGame, user, token, activeCase, errors, activeRoomCode, cases, setCases } = useGameStore();
  const timeOut = timeLeft <= 0;

  const [showPostMortem, setShowPostMortem] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [notes, setNotes] = useState<CaseNote[]>(activeCase?.notes || []);
  const scoreSubmittedRef = useRef(false);

  useEffect(() => {
    setNotes(activeCase?.notes || []);
  }, [activeCase]);

  useEffect(() => {
    if (isVictory && user && !scoreSubmittedRef.current) {
      scoreSubmittedRef.current = true;
      // Identity (userId / username / avatar) is derived server-side from the
      // bearer token, so it can no longer be spoofed from the client.
      fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          xp,
          difficulty,
          caseId: activeCase?.id,
          caseTitle: activeCase?.title,
          roomCode: activeRoomCode,
          timeLeft,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Score submit failed (${res.status})`);
          setSyncError(null);
        })
        .catch((err) => {
          console.error('Failed to submit score', err);
          setSyncError('Your run could not be saved to the leaderboard. Check that the server is running.');
        });
    }
  }, [xp, difficulty, timeLeft, isVictory, user, token, activeCase, activeRoomCode]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim() || !activeCase || !user) return;

    try {
      const res = await fetch(`/api/cases/${activeCase.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: noteInput.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const createdNote = await res.json();
      const updatedNotes = [createdNote, ...notes];
      setNotes(updatedNotes);
      setCases(cases.map((c) => (c.id === activeCase.id ? { ...c, notes: updatedNotes } : c)));
      setNoteInput('');
      setSyncError(null);
    } catch (err) {
      // No local fallback: a note that never reached the database must not
      // appear in the UI as though it had been saved.
      setSyncError(err instanceof Error ? err.message : 'Could not post field note.');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!activeCase) return;
    try {
      const res = await fetch(`/api/cases/${activeCase.id}/notes/${noteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      // Only drop it from the UI once the server confirms the delete.
      const updatedNotes = notes.filter((n) => n.id !== noteId);
      setNotes(updatedNotes);
      setCases(cases.map((c) => (c.id === activeCase.id ? { ...c, notes: updatedNotes } : c)));
      setSyncError(null);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Could not delete field note.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-950/85 backdrop-blur-md p-4 crt-flicker overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel max-w-2xl w-full p-8 text-center border-t-4 border-b-4 bracket-corner my-auto max-h-[92vh] overflow-y-auto"
        style={{ borderColor: isVictory ? '#06b6d4' : '#f43f5e' }}
      >
        <div
          className={cn(
            'w-16 h-16 mx-auto flex items-center justify-center mb-4 shadow-2xl border',
            isVictory
              ? 'bg-[#06b6d4]/10 border-[#06b6d4] text-[#06b6d4] shadow-[#06b6d4]/50'
              : 'bg-[#f43f5e]/10 border-[#f43f5e] text-[#f43f5e] shadow-[#f43f5e]/50'
          )}
        >
          {isVictory ? <Cpu className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
        </div>

        <h2 className="text-3xl font-black mb-1 uppercase text-white tracking-widest">
          {isVictory ? 'System Restored' : 'System Failure'}
        </h2>
        <div className="font-mono text-xs text-[#e5e1e4]/60 mb-6">
          {isVictory
            ? 'ALL ANOMALIES PURGED.'
            : timeOut
            ? 'TIME LIMIT EXCEEDED. UPLINK SEVERED.'
            : 'INTEGRITY DEPLETED. ACCESS DENIED.'}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 font-mono">
          <div className="bg-black/50 border border-[#6366f1]/30 p-4">
            <div className="text-[10px] text-[#6366f1]/80 uppercase tracking-widest mb-1">Final Bounty</div>
            <div className="text-2xl font-bold text-[#6366f1]">{xp} CR</div>
          </div>
          <div className="bg-black/50 border border-[#10b981]/30 p-4">
            <div className="text-[10px] text-[#10b981]/80 uppercase tracking-widest mb-1">Time Left</div>
            <div className="text-2xl font-bold text-[#10b981]">{timeLeft}s</div>
          </div>
        </div>

        {/* Toggle Post-Mortem Technical Debrief & Notes CRUD */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowPostMortem(!showPostMortem)}
            className="w-full py-2.5 px-4 bg-slate-900/90 hover:bg-slate-800 border border-indigo-500/40 text-indigo-300 font-mono text-xs uppercase font-bold tracking-wider rounded flex items-center justify-center space-x-2 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{showPostMortem ? 'Hide Case Post-Mortem & Notes' : 'Inspect DOM Post-Mortem & Field Notes'}</span>
          </button>

          {showPostMortem && (
            <div className="mt-4 text-left font-mono space-y-4 bg-black/50 p-4 border border-white/10 rounded-xl">
              <div className="text-xs font-bold uppercase text-amber-400 tracking-wider">
                Technical Anomaly Breakdown ({errors.filter((e) => e.fixed).length}/{errors.length} Resolved)
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {errors.map((err) => (
                  <div key={err.id} className="p-2.5 bg-slate-900/90 border border-white/10 rounded-lg text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-white">{err.description}</span>
                      <span className={err.fixed ? 'text-emerald-400 text-[10px]' : 'text-rose-400 text-[10px]'}>
                        {err.fixed ? 'RESOLVED' : 'MISSED'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1 text-[10px]">
                      <span className="px-1.5 py-0.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded">
                        Broken: {err.errorClass}
                      </span>
                      <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded">
                        Fixed: {err.fixedClass}
                      </span>
                    </div>
                    {err.explanation && <p className="text-[11px] text-slate-400 mt-1">{err.explanation}</p>}
                  </div>
                ))}
              </div>

              {/* Community Post-Mortem Notes CRUD */}
              <div className="pt-3 border-t border-white/10">
                <div className="text-xs font-bold uppercase text-indigo-300 mb-2 flex items-center space-x-1.5">
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>Detective Field Notes ({notes.length})</span>
                </div>

                {syncError && (
                  <div className="mb-3 px-3 py-2 rounded-lg border border-red-500/40 bg-red-950/40 text-[11px] text-red-300">
                    {syncError}
                  </div>
                )}

                {user && (
                  <form onSubmit={handleAddNote} className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Share a debugging tip for this case..."
                      className="flex-1 bg-slate-900 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase rounded-lg"
                    >
                      Post
                    </button>
                  </form>
                )}

                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {notes.length === 0 ? (
                    <div className="text-[11px] text-slate-500">No field notes logged yet. Be the first!</div>
                  ) : (
                    notes.map((n) => (
                      <div key={n.id} className="p-2 bg-slate-900/70 border border-white/10 rounded-lg flex items-start justify-between text-xs">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white">{n.author}</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded uppercase">
                              {n.role}
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px] mt-0.5">{n.content}</p>
                        </div>
                        {user && (user.username === n.author || user.role === 'admin' || user.role === 'architect') && (
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(n.id)}
                            className="text-rose-400 hover:text-rose-300 p-1"
                            title="Delete Note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={resetGame}
            className="w-full py-4 cyber-button"
            style={{
              borderColor: isVictory ? '#06b6d4' : '#f43f5e',
              color: isVictory ? '#06b6d4' : '#f43f5e',
              boxShadow: `0 0 10px ${isVictory ? 'rgba(0,255,136,0.2)' : 'rgba(255,0,85,0.2)'}`,
            }}
          >
            {isVictory ? 'NEXT ASSIGNMENT' : 'REBOOT SYSTEM'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const { startGame, isPlaying, isGameOver, isVictory, tick, hintsLeft, triggerHint, hintTargetId, layoutType, user, validateAuth } = useGameStore();
  const [magnifier, setMagnifier] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseDefinition | null>(null);

  // Global Modals & Screens
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isHostMode, setIsHostMode] = useState(false);

  useEffect(() => {
    validateAuth();
  }, [validateAuth]);

  const handleStart = (chosenCase: CaseDefinition) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setSelectedCase(chosenCase);
    setShowTutorial(true);
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    if (selectedCase) {
      startGame(selectedCase);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && !isGameOver && !isVictory && !showTutorial) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isGameOver, isVictory, tick, showTutorial]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') setMagnifier((prev) => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isHostMode) {
    return <HostScreen onExit={() => setIsHostMode(false)} />;
  }

  return (
    <div
      className={cn(
        'min-h-screen transition-colors duration-500 bg-gradient-to-br from-blue-950 via-cyan-900 to-teal-950',
        magnifier ? 'cursor-magnifier' : ''
      )}
    >
      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onOpenStudio={() => setIsStudioOpen(true)}
      />
      <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
      <AdminStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        onOpenHostScreen={() => setIsHostMode(true)}
      />

      <AnimatePresence mode="wait">
        {!isPlaying && !isGameOver && !isVictory && !showTutorial ? (
          <motion.div key="start" exit={{ opacity: 0, scale: 1.1 }}>
            <StartScreen
              onStart={handleStart}
              onOpenAuth={() => setIsAuthOpen(true)}
              onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
              onOpenStudio={() => setIsStudioOpen(true)}
              onOpenHost={() => setIsHostMode(true)}
            />
          </motion.div>
        ) : (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
            {showTutorial && <TutorialOverlay onComplete={handleTutorialComplete} />}

            <HUD onOpenAuth={() => setIsAuthOpen(true)} onOpenStudio={() => setIsStudioOpen(true)} />

            <div className="fixed bottom-16 right-6 z-50 flex space-x-3">
              <button
                onClick={() => {
                  if (hintsLeft > 0) triggerHint();
                }}
                disabled={hintsLeft <= 0}
                className={cn(
                  'p-3 shadow-xl transition-all border font-mono text-xs flex items-center space-x-2',
                  hintTargetId !== null
                    ? 'bg-[#f59e0b] text-black border-[#f59e0b]'
                    : hintsLeft > 0
                    ? 'bg-[#06050b]/80 text-[#f59e0b] border-[#f59e0b]/30 hover:border-[#f59e0b] backdrop-blur-md'
                    : 'bg-[#06050b]/80 text-[#f59e0b]/30 border-[#f59e0b]/10 cursor-not-allowed backdrop-blur-md'
                )}
                title={hintsLeft > 0 ? 'Use Scan Mode (1 Hint)' : 'No Hints Remaining'}
              >
                <Crosshair className="w-4 h-4" />
                <span className="hidden md:inline">SCAN_MODE ({hintsLeft})</span>
              </button>
            </div>

            {layoutType === 'SaaS' && <SaasLayout />}
            {layoutType === 'Ecommerce' && <MediumLayout />}
            {layoutType === 'Analytics' && <HardLayout />}
            {layoutType === 'Settings' && <NightmareLayout />}

            {/* Game Footer */}
            <div className="fixed bottom-0 left-0 w-full z-40 bg-slate-900/90 border-t border-[#6366f1]/30 backdrop-blur-md px-6 py-3 flex items-center justify-between font-mono pointer-events-auto shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 flex items-center justify-center border border-[#6366f1]/50 bg-black/50 p-1.5 text-[#10b981]">
                  <Terminal className="w-4 h-4" />
                </div>
                <span className="text-[#6366f1] text-[10px] md:text-xs tracking-widest uppercase font-bold">
                  © {new Date().getFullYear()} Frontend Detective
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-[#10b981] text-[10px] md:text-xs tracking-widest uppercase font-bold px-3 py-1.5 bg-[#10b981]/10 border border-[#10b981]/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  Developed by Garvit Amit Bhutani
                </div>
              </div>
            </div>

            <AnimatePresence>{(isGameOver || isVictory) && <EndScreen isVictory={isVictory} />}</AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
