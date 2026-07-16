import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from './store';
import { Terminal, Crosshair, Cpu, ShieldAlert, Wifi, Battery, Maximize2, Info, ChevronRight, X } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function HUD() {
  const { attemptsLeft, timeLeft, xp, difficulty, combo, errors } = useGameStore();
  const foundErrors = errors.filter(e => e.fixed).length;
  const totalErrors = errors.length;
  const progress = totalErrors === 0 ? 0 : (foundErrors / totalErrors) * 100;

  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 w-full z-40 pointer-events-none"
    >
      <div className="bg-slate-900/70 border-b border-transparent [border-image:linear-gradient(to_right,#00f2ff,#bc00ff,#ffaa00)_1] backdrop-blur-md px-6 py-3 flex items-center justify-between font-mono crt-flicker shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-[#f59e0b]">
            <Terminal className="w-5 h-5 animate-pulse text-[#10b981]" />
            <span className="font-bold tracking-widest uppercase text-sm bg-clip-text text-transparent bg-gradient-to-r from-[#f59e0b] to-[#6366f1]">DECODER_SYSTEM_v4.2</span>
          </div>
          <div className="hidden md:flex items-center space-x-4 text-xs">
            <span className="flex items-center space-x-1 text-[#06b6d4]"><Wifi className="w-3 h-3"/> <span>LINK: STABLE</span></span>
            <span className="flex items-center space-x-1 text-[#06b6d4]"><Battery className="w-3 h-3"/> <span>PWR: 98%</span></span>
            <span className="text-[#6366f1]">MOD: {difficulty.toUpperCase()}</span>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-[#f59e0b]/70 uppercase tracking-widest mb-0.5">Bugs Located</span>
            <div className="text-lg font-bold flex items-baseline space-x-1 text-[#f59e0b]">
              <span>{foundErrors}</span>
              <span className="text-[#f59e0b]/40 text-xs">/ {totalErrors}</span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] text-[#f43f5e]/70 uppercase tracking-widest mb-0.5">Integrity</span>
            <div className="text-lg font-bold text-[#f43f5e]">
              {attemptsLeft} ATK
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] text-[#10b981]/70 uppercase tracking-widest mb-0.5">Uplink Time</span>
            <div className={cn("text-lg font-bold", timeLeft <= 10 ? "text-[#f43f5e] animate-pulse" : "text-[#10b981]")}>
              0:{timeLeft.toString().padStart(2, '0')}
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
              {combo > 1 && <span className="text-[10px] bg-[#6366f1]/20 text-[#6366f1] px-1.5 py-0.5 border border-[#6366f1]/30">x{combo}</span>}
            </motion.div>
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

function MistakeElement({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
  const { errors, fixError } = useGameStore();
  const errorDef = errors.find(e => e.id === id);
  const isFixed = errorDef?.fixed;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (errorDef && !isFixed) {
      fixError(id);
    }
  };

  if (!errorDef) return <>{children}</>;

  const currentClass = isFixed ? errorDef.fixedClass : errorDef.errorClass;

  return (
    <motion.div
      layout
      onClick={handleClick}
      className={cn(
        "relative transition-all duration-300", 
        !isFixed && "mistake-target hover:scale-[1.05] hover:rotate-1 hover:shadow-2xl hover:z-50 duration-300 transition-all",
        className,
        currentClass
      )}
      animate={isFixed ? { scale: [1, 1.05, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] } : {}}
      transition={{ duration: 0.4 }}
    >
      {children}
      {isFixed && (
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-3 -right-3 bg-[#06b6d4] text-black text-xs font-mono font-bold px-2 py-1 z-10 border border-black shadow-[0_0_15px_#06b6d4]"
        >
          FIXED
        </motion.div>
      )}
    </motion.div>
  );
}

function SaasLayout() {
  const { missClick, isPlaying } = useGameStore();

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
          <span>TARGET_UI_RENDER // SECTOR 7G</span>
        </div>
        
        <div className="glass-panel p-10 bg-slate-900/60 shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden relative border-t-[#f59e0b] border-r-[#6366f1] border-b-[#f43f5e] border-l-[#10b981] border-2">
          
          <div className="text-center max-w-3xl mx-auto mb-20 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center space-x-2 bg-[#06b6d4]/10 text-[#06b6d4] px-4 py-1.5 mb-8 font-mono text-xs border border-[#06b6d4]/30 backdrop-blur-sm shadow-[0_0_15px_rgba(0,255,136,0.2)]">
              <span className="w-1.5 h-1.5 bg-[#06b6d4] animate-pulse"></span>
              <span>SYSTEM ONLINE</span>
            </motion.div>
            
            <MistakeElement id="err-4" className="mb-6">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                Secure the grid.
              </h1>
            </MistakeElement>
            
            <p className="text-lg text-[#e5e1e4]/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              Detect anomalies in the neural net interface. Ensure all components meet the strict visual regulations of the megacorp.
            </p>
            
            <div className="flex items-center justify-center space-x-6">
              <MistakeElement id="err-1">
                <button className="bg-gradient-to-r from-[#f59e0b] to-[#6366f1] text-white font-bold font-mono tracking-widest shadow-[0_0_15px_#6366f1] hover:shadow-[0_0_25px_#f59e0b] transition-all cursor-crosshair border-none">
                  INITIALIZE
                </button>
              </MistakeElement>
              
              <MistakeElement id="err-5">
                <button className="font-mono tracking-widest text-[#10b981] border border-[#10b981]/50 hover:bg-[#10b981]/20 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#10b981]/20 duration-300 transition-all transition-all cursor-crosshair px-6 py-3 shadow-[0_0_10px_rgba(255,170,0,0.1)]">
                  ACCESS LOGS
                </button>
              </MistakeElement>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {[1, 2, 3].map((i) => (
              <MistakeElement id={i === 2 ? 'err-3' : `no-err-${i}`} key={i} className={i !== 2 ? 'rounded-none' : ''}>
                <div className="bg-[#06050b]/60 border border-[#6366f1]/30 p-6 h-full backdrop-blur-md group hover:border-[#f43f5e] hover:-translate-y-3 hover:shadow-2xl duration-300 transition-all transition-colors shadow-lg">
                  <MistakeElement id={i === 1 ? 'err-2' : `no-icon-err-${i}`}>
                    <div className="w-10 h-10 bg-[#10b981]/10 text-[#10b981] flex items-center justify-center mb-5 border border-[#10b981]/40 group-hover:bg-[#f43f5e]/20 group-hover:text-[#f43f5e] transition-colors">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                  </MistakeElement>
                  <h3 className="text-lg font-bold mb-2 text-white group-hover:text-[#f59e0b] transition-colors">Data Encryption</h3>
                  <p className="text-[#e5e1e4]/60 text-sm leading-relaxed font-mono">
                    Advanced quantum protection for all nodes. Anomalies are isolated and purged upon detection.
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
                You are a Frontend Detective. Your job is to find visual inconsistencies (bugs) in the UI. 
                Things like misaligned buttons, wrong colors, or broken borders.
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
                Click on the anomalous elements to fix them. But be careful: clicking on the wrong element will reduce your <strong className="text-[#f43f5e]">Integrity (Attempts)</strong>.
                If Integrity reaches 0, you fail.
              </p>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="text-[#e5e1e4]/50 hover:text-white font-mono text-sm uppercase">Back</button>
                <button onClick={() => setStep(3)} className="cyber-button px-6 py-2 border-[#6366f1] text-[#6366f1] shadow-[0_0_10px_rgba(188,0,255,0.3)]">
                  Next <ChevronRight className="inline w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h3 className="text-[#10b981] font-mono text-lg mb-2">3. The Clock</h3>
              <p className="text-[#e5e1e4]/80 font-mono text-sm leading-relaxed mb-6">
                You are on the clock. Fix all bugs before the <strong>Uplink Time</strong> runs out. 
                Chain fixes together quickly to earn a higher <strong>Bounty Multiplier</strong>.
              </p>
              <div className="flex justify-between items-center">
                <button onClick={() => setStep(2)} className="text-[#e5e1e4]/50 hover:text-white font-mono text-sm uppercase">Back</button>
                <button onClick={onComplete} className="bg-[#10b981] text-black font-bold font-mono px-6 py-2 shadow-[0_0_15px_#10b981] hover:bg-white transition-colors">
                  START MISSION
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex justify-center space-x-2">
          <div className={cn("w-2 h-2 rounded-full", step === 1 ? "bg-[#10b981]" : "bg-[#10b981]/20")} />
          <div className={cn("w-2 h-2 rounded-full", step === 2 ? "bg-[#10b981]" : "bg-[#10b981]/20")} />
          <div className={cn("w-2 h-2 rounded-full", step === 3 ? "bg-[#10b981]" : "bg-[#10b981]/20")} />
        </div>
      </motion.div>
    </div>
  );
}

function StartScreen({ onStart }: { onStart: (diff: any) => void }) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.to('.marquee-top', {
      xPercent: -50,
      repeat: -1,
      duration: 20,
      ease: "linear",
    });
    gsap.to('.marquee-bottom', {
      xPercent: -50,
      repeat: -1,
      duration: 25,
      ease: "linear",
    });
  }, { scope: container });

  return (
    <div ref={container} className="min-h-screen flex flex-col items-center justify-center relative bg-gradient-to-br from-blue-950 via-cyan-900 to-teal-950 p-6 crt-flicker overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#f59e0b]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#6366f1]/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#10b981]/5 rounded-full blur-[120px]" />
        
        {/* GSAP Rolling Text Background */}
        <div className="absolute top-10 left-0 w-[200%] flex whitespace-nowrap text-[#f59e0b]/10 font-black text-8xl md:text-9xl uppercase tracking-tighter opacity-50 select-none marquee-top">
          <div className="flex-1">FRONTEND DETECTIVE // SECTOR 7G // ANOMALY DETECTED // SYSTEM COMPROMISED // </div>
          <div className="flex-1">FRONTEND DETECTIVE // SECTOR 7G // ANOMALY DETECTED // SYSTEM COMPROMISED // </div>
        </div>
        
        <div className="absolute bottom-10 left-0 w-[200%] flex whitespace-nowrap text-[#f43f5e]/10 font-black text-8xl md:text-9xl uppercase tracking-tighter opacity-50 select-none marquee-bottom" style={{ transform: 'rotate(180deg)' }}>
          <div className="flex-1">SECURITY BREACH // INITIATE PURGE // INTEGRITY COMPROMISED // ACCESS LOGS // </div>
          <div className="flex-1">SECURITY BREACH // INITIATE PURGE // INTEGRITY COMPROMISED // ACCESS LOGS // </div>
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 text-center max-w-3xl glass-panel p-12 bracket-corner border-t-[#f59e0b] border-b-[#6366f1]"
      >
        <div className="mb-6 inline-flex justify-center p-4 bg-gradient-to-br from-[#f59e0b]/20 to-[#6366f1]/20 border border-[#6366f1]/50 text-white shadow-[0_0_20px_rgba(188,0,255,0.3)]">
          <Cpu className="w-12 h-12" />
        </div>
        
        <motion.h1 
          animate={{ y: [-15, 15, -15] }} 
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="text-7xl md:text-8xl mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-teal-400 to-green-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          style={{ fontFamily: "'Dancing Script', cursive" }}
        >
          Frontend Detective
        </motion.h1>
        <div className="text-[#10b981] font-mono text-sm tracking-[0.3em] mb-10">DIGITAL FORENSICS DECK</div>
        
        <p className="text-[#e5e1e4]/80 mb-12 leading-relaxed max-w-xl mx-auto font-mono text-sm border-l-2 border-[#f43f5e] pl-4 text-left">
          System compromised. Unauthorized visual mutations detected in sector 7G. Identify and patch the UI inconsistencies before the system crashes. Precision is mandatory.
        </p>
        
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          {(['Easy', 'Medium', 'Hard', 'Nightmare'] as const).map((diff, i) => {
            const colors = [
              "border-[#06b6d4] text-[#06b6d4] shadow-[0_0_10px_rgba(0,255,136,0.3)] hover:bg-[#06b6d4]/20 hover:text-white",
              "border-[#f59e0b] text-[#f59e0b] shadow-[0_0_10px_rgba(0,242,255,0.3)] hover:bg-[#f59e0b]/20 hover:text-white",
              "border-[#10b981] text-[#10b981] shadow-[0_0_10px_rgba(255,170,0,0.3)] hover:bg-[#10b981]/20 hover:text-white",
              "border-[#f43f5e] text-[#f43f5e] shadow-[0_0_10px_rgba(255,0,85,0.3)] hover:bg-[#f43f5e]/20 hover:text-white"
            ];
            return (
              <motion.button
                key={diff}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onStart(diff)}
                className={cn(
                  "py-3 px-6 font-mono font-bold text-sm tracking-widest uppercase transition-all border bg-black/50 backdrop-blur-sm",
                  colors[i]
                )}
              >
                {diff}
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </div>
  );
}

function EndScreen({ isVictory }: { isVictory: boolean }) {
  const { xp, timeLeft, resetGame } = useGameStore();
  const timeOut = timeLeft <= 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-950/80 backdrop-blur-md p-6 crt-flicker">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel max-w-md w-full p-10 text-center border-t-4 border-b-4 bracket-corner"
        style={{ borderColor: isVictory ? '#06b6d4' : '#f43f5e' }}
      >
        <div className={cn(
          "w-20 h-20 mx-auto flex items-center justify-center mb-6 shadow-2xl border",
          isVictory ? "bg-[#06b6d4]/10 border-[#06b6d4] text-[#06b6d4] shadow-[#06b6d4]/50" : "bg-[#f43f5e]/10 border-[#f43f5e] text-[#f43f5e] shadow-[#f43f5e]/50"
        )}>
          {isVictory ? <Cpu className="w-10 h-10" /> : <ShieldAlert className="w-10 h-10" />}
        </div>

        <h2 className="text-3xl font-black mb-2 uppercase text-white tracking-widest">
          {isVictory ? 'System Restored' : 'System Failure'}
        </h2>
        <div className="font-mono text-sm text-[#e5e1e4]/60 mb-8">
          {isVictory 
            ? 'ALL ANOMALIES PURGED.' 
            : timeOut ? 'TIME LIMIT EXCEEDED. UPLINK SEVERED.' : 'INTEGRITY DEPLETED. ACCESS DENIED.'}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 font-mono">
          <div className="bg-black/50 border border-[#6366f1]/30 p-4">
            <div className="text-[10px] text-[#6366f1]/80 uppercase tracking-widest mb-1">Final Bounty</div>
            <div className="text-2xl font-bold text-[#6366f1]">{xp} CR</div>
          </div>
          <div className="bg-black/50 border border-[#10b981]/30 p-4">
            <div className="text-[10px] text-[#10b981]/80 uppercase tracking-widest mb-1">Time Left</div>
            <div className="text-2xl font-bold text-[#10b981]">0:{timeLeft.toString().padStart(2, '0')}</div>
          </div>
        </div>

        <button 
          onClick={resetGame}
          className="w-full py-4 cyber-button"
          style={{ borderColor: isVictory ? '#06b6d4' : '#f43f5e', color: isVictory ? '#06b6d4' : '#f43f5e', boxShadow: `0 0 10px ${isVictory ? 'rgba(0,255,136,0.2)' : 'rgba(255,0,85,0.2)'}` }}
        >
          {isVictory ? 'NEXT ASSIGNMENT' : 'REBOOT SYSTEM'}
        </button>
      </motion.div>
    </div>
  );
}

export default function App() {
  const { startGame, isPlaying, isGameOver, isVictory, tick } = useGameStore();
  const [magnifier, setMagnifier] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<any>(null);

  const handleStart = (diff: any) => {
    setSelectedDifficulty(diff);
    setShowTutorial(true);
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    startGame(selectedDifficulty);
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
      if (e.key.toLowerCase() === 'm') setMagnifier(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 bg-gradient-to-br from-blue-950 via-cyan-900 to-teal-950",
      magnifier ? "cursor-magnifier" : ""
    )}>
      <AnimatePresence mode="wait">
        {!isPlaying && !isGameOver && !isVictory && !showTutorial ? (
          <motion.div key="start" exit={{ opacity: 0, scale: 1.1 }}>
            <StartScreen onStart={handleStart} />
          </motion.div>
        ) : (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
            
            {showTutorial && <TutorialOverlay onComplete={handleTutorialComplete} />}

            <HUD />
            
            <div className="fixed bottom-6 right-6 z-50 flex space-x-3">
              <button 
                onClick={() => setMagnifier(!magnifier)}
                className={cn(
                  "p-3 shadow-xl transition-all border font-mono text-xs flex items-center space-x-2",
                  magnifier 
                    ? "bg-[#f59e0b] text-black border-[#f59e0b]" 
                    : "bg-[#06050b]/80 text-[#f59e0b] border-[#f59e0b]/30 hover:border-[#f59e0b] backdrop-blur-md"
                )}
                title="Toggle Crosshair (M)"
              >
                <Crosshair className="w-4 h-4" />
                <span className="hidden md:inline">SCAN_MODE</span>
              </button>
            </div>

            <SaasLayout />
            
            <AnimatePresence>
              {(isGameOver || isVictory) && <EndScreen isVictory={isVictory} />}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
