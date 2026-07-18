import { create } from 'zustand';

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Nightmare';

export interface GameError {
  id: string;
  description: string;
  points: number;
  fixed: boolean;
  // Visuals for the error state and fixed state
  errorClass: string;
  fixedClass: string;
}

interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  attemptsLeft: number;
  timeLeft: number;
  xp: number;
  combo: number;
  difficulty: Difficulty;
  theme: string;
  errors: GameError[];
  hintsLeft: number;
  hintTargetId: string | null;
  
  startGame: (difficulty: Difficulty) => void;
  fixError: (id: string) => void;
  missClick: () => void;
  tick: () => void;
  resetGame: () => void;
  useHint: () => void;
}

const EASY_ERRORS: GameError[] = [
  { id: 'err-1', description: 'Uneven button padding', points: 100, fixed: false, errorClass: 'px-2 py-4', fixedClass: 'px-6 py-3' },
  { id: 'err-2', description: 'Misaligned icon', points: 100, fixed: false, errorClass: '-mt-2', fixedClass: 'mt-0' },
  { id: 'err-3', description: 'Different border radius on one card', points: 100, fixed: false, errorClass: 'rounded-sm', fixedClass: 'rounded-2xl' },
  { id: 'err-4', description: 'Incorrect font weight in heading', points: 100, fixed: false, errorClass: 'font-light', fixedClass: 'font-bold' },
  { id: 'err-5', description: 'Wrong primary button color', points: 100, fixed: false, errorClass: 'bg-blue-400', fixedClass: 'bg-blue-600' },
];

const MEDIUM_ERRORS: GameError[] = [
  { id: 'med-err-1', description: 'Incorrect flex direction', points: 150, fixed: false, errorClass: 'flex-row', fixedClass: 'flex-col md:flex-row' },
  { id: 'med-err-2', description: 'Missing hover transition', points: 150, fixed: false, errorClass: 'transition-none', fixedClass: 'transition-all duration-300' },
  { id: 'med-err-3', description: 'Inconsistent typography tracking', points: 150, fixed: false, errorClass: 'tracking-tight', fixedClass: 'tracking-widest' },
  { id: 'med-err-4', description: 'Z-index clipping issue', points: 150, fixed: false, errorClass: 'z-0', fixedClass: 'z-50' },
  { id: 'med-err-5', description: 'Broken gradient stop', points: 150, fixed: false, errorClass: 'to-transparent', fixedClass: 'to-[#10b981]' },
];

const HARD_ERRORS: GameError[] = [
  { id: 'hard-err-1', description: 'Improper semantic tag usage', points: 200, fixed: false, errorClass: 'bg-red-500/10 text-red-500', fixedClass: 'bg-emerald-500/10 text-emerald-500' },
  { id: 'hard-err-2', description: 'Unoptimized rendering priority', points: 200, fixed: false, errorClass: 'opacity-50 blur-sm', fixedClass: 'opacity-100 blur-none' },
  { id: 'hard-err-3', description: 'Contrast ratio accessibility failure', points: 200, fixed: false, errorClass: 'text-slate-600 bg-slate-700', fixedClass: 'text-white bg-slate-900' },
  { id: 'hard-err-4', description: 'Missing focus ring outline', points: 200, fixed: false, errorClass: 'outline-none', fixedClass: 'ring-2 ring-[#f59e0b]' },
  { id: 'hard-err-5', description: 'Incorrect box-sizing model', points: 200, fixed: false, errorClass: 'box-content', fixedClass: 'box-border' },
];

const NIGHTMARE_ERRORS: GameError[] = [
  { id: 'night-err-1', description: 'Race condition in state update', points: 500, fixed: false, errorClass: 'animate-bounce text-red-500', fixedClass: 'animate-none text-[#10b981]' },
  { id: 'night-err-2', description: 'Memory leak in event listener', points: 500, fixed: false, errorClass: 'shadow-[0_0_100px_red]', fixedClass: 'shadow-[0_0_15px_#6366f1]' },
  { id: 'night-err-3', description: 'Unsanitized innerHTML rendering', points: 500, fixed: false, errorClass: 'text-[8px] tracking-[1rem]', fixedClass: 'text-sm tracking-normal' },
  { id: 'night-err-4', description: 'Infinite render loop detected', points: 500, fixed: false, errorClass: 'rotate-180 scale-50', fixedClass: 'rotate-0 scale-100' },
  { id: 'night-err-5', description: 'Null pointer exception in layout', points: 500, fixed: false, errorClass: 'opacity-0 pointer-events-none', fixedClass: 'opacity-100 pointer-events-auto' },
];

export const useGameStore = create<GameState>((set) => ({
  isPlaying: false,
  isGameOver: false,
  isVictory: false,
  attemptsLeft: 10,
  timeLeft: 60,
  xp: 0,
  combo: 0,
  difficulty: 'Easy',
  theme: 'SaaS',
  errors: [],
  hintsLeft: 1,
  hintTargetId: null,

  startGame: (difficulty: Difficulty) => {
    const timeLimits = { Easy: 60, Medium: 45, Hard: 30, Nightmare: 15 };
    const errorsMap = { Easy: EASY_ERRORS, Medium: MEDIUM_ERRORS, Hard: HARD_ERRORS, Nightmare: NIGHTMARE_ERRORS };
    
    set({
      isPlaying: true,
      isGameOver: false,
      isVictory: false,
      attemptsLeft: 10,
      timeLeft: timeLimits[difficulty],
      xp: 0,
      combo: 0,
      difficulty,
      errors: errorsMap[difficulty].map(e => ({ ...e, fixed: false })),
      hintsLeft: 1,
    });
  },

  fixError: (id: string) => {
    set((state) => {
      const newErrors = state.errors.map(e => e.id === id ? { ...e, fixed: true } : e);
      const allFixed = newErrors.every(e => e.fixed);
      const newXp = state.xp + 100 + (state.combo * 50);
      
      return {
        errors: newErrors,
        xp: newXp,
        combo: state.combo + 1,
        isVictory: allFixed,
        isPlaying: !allFixed,
      };
    });
  },

  missClick: () => {
    set((state) => {
      const newAttempts = state.attemptsLeft - 1;
      const isGameOver = newAttempts <= 0;
      return {
        attemptsLeft: newAttempts,
        combo: 0,
        xp: Math.max(0, state.xp - 25),
        isGameOver,
        isPlaying: !isGameOver,
      };
    });
  },

  tick: () => {
    set((state) => {
      if (!state.isPlaying) return state;
      const newTime = state.timeLeft - 1;
      const isGameOver = newTime <= 0;
      return {
        timeLeft: newTime,
        isGameOver: isGameOver ? true : state.isGameOver,
        isPlaying: isGameOver ? false : state.isPlaying,
      };
    });
  },

  resetGame: () => {
    set({
      isPlaying: false,
      isGameOver: false,
      isVictory: false,
      attemptsLeft: 10,
      timeLeft: 60,
      xp: 0,
      combo: 0,
      errors: [],
      hintsLeft: 1,
      hintTargetId: null,
    });
  },

  useHint: () => {
    set((state) => {
      if (state.hintsLeft > 0) {
        const unfixed = state.errors.filter(e => !e.fixed);
        if (unfixed.length === 0) return state;
        
        const randomTarget = unfixed[Math.floor(Math.random() * unfixed.length)].id;
        setTimeout(() => set({ hintTargetId: null }), 3000);
        return { hintsLeft: state.hintsLeft - 1, hintTargetId: randomTarget };
      }
      return state;
    });
  },
}));
