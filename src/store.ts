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
  
  startGame: (difficulty: Difficulty) => void;
  fixError: (id: string) => void;
  missClick: () => void;
  tick: () => void;
  resetGame: () => void;
}

const EASY_ERRORS: GameError[] = [
  { id: 'err-1', description: 'Uneven button padding', points: 100, fixed: false, errorClass: 'px-2 py-4', fixedClass: 'px-6 py-3' },
  { id: 'err-2', description: 'Misaligned icon', points: 100, fixed: false, errorClass: '-mt-2', fixedClass: 'mt-0' },
  { id: 'err-3', description: 'Different border radius on one card', points: 100, fixed: false, errorClass: 'rounded-sm', fixedClass: 'rounded-2xl' },
  { id: 'err-4', description: 'Incorrect font weight in heading', points: 100, fixed: false, errorClass: 'font-light', fixedClass: 'font-bold' },
  { id: 'err-5', description: 'Wrong primary button color', points: 100, fixed: false, errorClass: 'bg-blue-400', fixedClass: 'bg-blue-600' },
];

export const useGameStore = create<GameState>((set, get) => ({
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

  startGame: (difficulty: Difficulty) => {
    const timeLimits = { Easy: 60, Medium: 45, Hard: 30, Nightmare: 15 };
    set({
      isPlaying: true,
      isGameOver: false,
      isVictory: false,
      attemptsLeft: 10,
      timeLeft: timeLimits[difficulty],
      xp: 0,
      combo: 0,
      difficulty,
      errors: EASY_ERRORS.map(e => ({ ...e, fixed: false })),
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
    });
  },
}));
