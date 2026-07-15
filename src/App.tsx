import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from './store';
import { Search, Moon, Sun, CheckCircle, XCircle, Award, ShieldAlert, Target } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function HUD() {
  const { attemptsLeft, timeLeft, xp, difficulty, theme, combo, errors } = useGameStore();
  const foundErrors = errors.filter(e => e.fixed).length;
  const totalErrors = errors.length;
  const progress = totalErrors === 0 ? 0 : (foundErrors / totalErrors) * 100;

  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 pointer-events-none"
    >
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between shadow-2xl backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-500/20 p-2 rounded-xl">
            <Search className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Frontend Detective</h1>
            <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">{difficulty} • {theme}</p>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Errors</span>
            <div className="text-xl font-bold flex items-baseline space-x-1">
              <span className="text-emerald-400">{foundErrors}</span>
              <span className="text-gray-500 text-sm">/ {totalErrors}</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Attempts</span>
            <div className="text-xl font-bold text-rose-400">
              {attemptsLeft}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Time</span>
            <div className={cn("text-xl font-bold", timeLeft <= 10 ? "text-rose-500 animate-pulse" : "text-gray-300")}>
              0:{timeLeft.toString().padStart(2, '0')}
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">XP Score</span>
            <motion.div 
              key={xp}
              initial={{ scale: 1.2, color: '#4ade80' }}
              animate={{ scale: 1, color: 'var(--foreground)' }}
              className="text-xl font-bold text-indigo-400 flex items-center space-x-2"
            >
              <span>{xp}</span>
              {combo > 1 && <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">x{combo}</span>}
            </motion.div>
          </div>
        </div>
      </div>
      <div className="w-full h-1 bg-gray-800/50 mt-2 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
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
        !isFixed && "mistake-target hover:scale-[1.02]",
        className,
        currentClass
      )}
      animate={isFixed ? { scale: [1, 1.1, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] } : {}}
      transition={{ duration: 0.4 }}
    >
      {children}
      {isFixed && (
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-3 -right-3 bg-emerald-500 text-white rounded-full p-1 z-10 shadow-lg shadow-emerald-500/50"
        >
          <CheckCircle className="w-4 h-4" />
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
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto" onClick={handlePageClick}>
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto mb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-full mb-8 font-medium text-sm border border-indigo-500/20">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          <span>Introducing Frontend Detective 2.0</span>
        </motion.div>
        
        <MistakeElement id="err-4" className="mb-6">
          <h1 className="text-6xl md:text-8xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-500 dark:from-white dark:to-gray-500">
            Build better interfaces.
          </h1>
        </MistakeElement>
        
        <p className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          The ultimate platform for investigating UI inconsistencies. Train your eyes, catch subtle errors, and ship pixel-perfect products.
        </p>
        
        <div className="flex items-center justify-center space-x-4">
          <MistakeElement id="err-1">
            <button className="text-white rounded-full font-medium shadow-lg hover:shadow-indigo-500/25 transition-all cursor-pointer">
              Start Building
            </button>
          </MistakeElement>
          
          <MistakeElement id="err-5">
            <button className="rounded-full font-medium text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer px-6 py-3">
              View Documentation
            </button>
          </MistakeElement>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <MistakeElement id={i === 2 ? 'err-3' : `no-err-${i}`} key={i} className={i !== 2 ? 'rounded-2xl' : ''}>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 shadow-xl shadow-gray-200/20 dark:shadow-none h-full">
              <MistakeElement id={i === 1 ? 'err-2' : `no-icon-err-${i}`}>
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center mb-6">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              </MistakeElement>
              <h3 className="text-xl font-bold mb-3">Enterprise Security</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
                Advanced protection for your UI components. We automatically detect and fix visual regressions before they reach production.
              </p>
            </div>
          </MistakeElement>
        ))}
      </div>
    </div>
  );
}

function StartScreen() {
  const { startGame } = useGameStore();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-gray-900 to-black text-white p-6">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 text-center max-w-2xl"
      >
        <div className="mb-8 inline-flex justify-center p-4 bg-indigo-500/20 rounded-full text-indigo-400">
          <Search className="w-12 h-12" />
        </div>
        
        <h1 className="text-6xl font-bold mb-6 tracking-tighter">
          Frontend Detective
        </h1>
        
        <p className="text-xl text-gray-400 mb-12 leading-relaxed">
          The ultimate game for UI engineers. Find the intentional design mistakes hidden in realistic, production-ready interfaces. You only have 10 attempts.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['Easy', 'Medium', 'Hard', 'Nightmare'] as const).map((diff, i) => (
            <motion.button
              key={diff}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startGame(diff)}
              className={cn(
                "py-4 px-6 rounded-2xl font-bold text-sm tracking-wide uppercase transition-all backdrop-blur-md",
                i === 0 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30" :
                i === 1 ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30" :
                i === 2 ? "bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30" :
                "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
              )}
            >
              {diff}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function EndScreen({ isVictory }: { isVictory: boolean }) {
  const { xp, attemptsLeft, timeLeft, resetGame } = useGameStore();
  const timeOut = timeLeft <= 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel max-w-md w-full rounded-3xl p-8 text-center text-white border border-gray-700"
      >
        <div className={cn(
          "w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-2xl",
          isVictory ? "bg-emerald-500 shadow-emerald-500/50" : "bg-rose-500 shadow-rose-500/50"
        )}>
          {isVictory ? <Award className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
        </div>

        <h2 className="text-4xl font-bold mb-2">
          {isVictory ? 'Mission Accomplished' : 'Game Over'}
        </h2>
        <p className="text-gray-400 mb-8">
          {isVictory 
            ? 'You successfully found all UI inconsistencies.' 
            : timeOut ? 'You ran out of time! You must be faster next time.' : 'You ran out of attempts. The designer wins this round.'}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="text-sm text-gray-400 mb-1">Final Score</div>
            <div className="text-3xl font-bold text-indigo-400">{xp}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="text-sm text-gray-400 mb-1">Time Left</div>
            <div className="text-3xl font-bold text-emerald-400">0:{timeLeft.toString().padStart(2, '0')}</div>
          </div>
        </div>

        <button 
          onClick={resetGame}
          className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
        >
          Play Again
        </button>
      </motion.div>
    </div>
  );
}

export default function App() {
  const { isPlaying, isGameOver, isVictory, tick } = useGameStore();
  const [darkMode, setDarkMode] = useState(true);
  const [magnifier, setMagnifier] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isGameOver && !isVictory) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isGameOver, isVictory, tick]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'd') setDarkMode(prev => !prev);
      if (e.key.toLowerCase() === 'm') setMagnifier(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500",
      magnifier ? "cursor-magnifier" : ""
    )}>
      <AnimatePresence mode="wait">
        {!isPlaying && !isGameOver && !isVictory ? (
          <motion.div key="start" exit={{ opacity: 0, scale: 1.1 }}>
            <StartScreen />
          </motion.div>
        ) : (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
            <HUD />
            
            {/* Quick Actions */}
            <div className="fixed bottom-6 right-6 z-50 flex space-x-3">
              <button 
                onClick={() => setMagnifier(!magnifier)}
                className={cn(
                  "p-3 rounded-full shadow-xl transition-all border",
                  magnifier 
                    ? "bg-indigo-500 text-white border-indigo-400" 
                    : "bg-white/10 text-gray-400 border-gray-200/10 backdrop-blur-md hover:bg-white/20"
                )}
                title="Toggle Magnifier (M)"
              >
                <Search className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-3 rounded-full bg-white/10 backdrop-blur-md text-gray-400 hover:bg-white/20 border border-gray-200/10 shadow-xl transition-all"
                title="Toggle Theme (D)"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
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
