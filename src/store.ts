import { create } from 'zustand';

export type Difficulty = 'Demo' | 'Medium' | 'Hard' | 'Nightmare';
export type LayoutType = 'SaaS' | 'Ecommerce' | 'Analytics' | 'Settings';
export type UserRole = 'detective' | 'architect' | 'admin';

export interface GameError {
  id: string;
  description: string;
  category?: string;
  points: number;
  fixed: boolean;
  errorClass: string;
  fixedClass: string;
  explanation?: string;
}

export interface CaseNote {
  id: string;
  author: string;
  role: UserRole;
  content: string;
  createdAt: string;
}

export interface CaseDefinition {
  id: string;
  title: string;
  difficulty: Difficulty;
  layoutType: LayoutType;
  roleTitle: string;
  timeLimit: number;
  attemptsLimit: number;
  author: string;
  isOfficial: boolean;
  errors: Omit<GameError, 'fixed'>[];
  notes: CaseNote[];
}

export interface UserProfile {
  id: string;
  username: string;
  name?: string;
  uid?: string;
  branch?: string;
  contact?: string;
  email: string;
  role: UserRole;
  avatar: string;
  badge: string;
  totalXp: number;
  gamesPlayed: number;
  victories: number;
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
  layoutType: LayoutType;
  activeCase: CaseDefinition | null;
  cases: CaseDefinition[];
  errors: GameError[];
  hintsLeft: number;
  hintTargetId: string | null;
  activeRoomCode: string | null;

  // Auth state
  user: UserProfile | null;
  token: string | null;
  setUser: (user: UserProfile | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  setActiveRoomCode: (code: string | null) => void;

  fetchCases: () => Promise<void>;
  setCases: (cases: CaseDefinition[]) => void;
  startGame: (target: Difficulty | CaseDefinition) => void;
  fixError: (id: string) => void;
  missClick: () => void;
  tick: () => void;
  resetGame: () => void;
  triggerHint: () => void;
}

export const DEFAULT_CASES: CaseDefinition[] = [
  {
    id: 'case-demo',
    title: 'SaaS Landing Page Audit',
    difficulty: 'Demo',
    layoutType: 'SaaS',
    roleTitle: 'Junior UI Detective (Introductory)',
    timeLimit: 60,
    attemptsLimit: 10,
    author: 'GarvitBhutani',
    isOfficial: true,
    errors: [
      { id: 'err-1', description: 'Uneven button padding', category: 'Spacing', points: 100, errorClass: 'px-2 py-4', fixedClass: 'px-6 py-3', explanation: 'Horizontal padding (px-2) was narrower than vertical padding (py-4), violating 2:1 button aspect ratios.' },
      { id: 'err-2', description: 'Misaligned icon container', category: 'Alignment', points: 100, errorClass: '-mt-2', fixedClass: 'mt-0', explanation: 'Negative top margin (-mt-2) pulled the icon out of its card baseline.' },
      { id: 'err-3', description: 'Different border radius on one card', category: 'Border', points: 100, errorClass: 'rounded-sm', fixedClass: 'rounded-2xl', explanation: 'Card #2 used rounded-sm while sibling cards used consistent framing.' },
      { id: 'err-4', description: 'Incorrect font weight in heading', category: 'Typography', points: 100, errorClass: 'font-light', fixedClass: 'font-bold', explanation: 'Hero display headings require font-bold to maintain visual hierarchy.' },
      { id: 'err-5', description: 'Wrong secondary button color', category: 'Color', points: 100, errorClass: 'bg-blue-400', fixedClass: 'bg-blue-600', explanation: 'Low-contrast fill clashed with the ghost button border.' },
    ],
    notes: [],
  },
  {
    id: 'case-medium',
    title: 'Neural E-Commerce Product Render',
    difficulty: 'Medium',
    layoutType: 'Ecommerce',
    roleTitle: 'Mid-Level Frontend Engineer',
    timeLimit: 45,
    attemptsLimit: 10,
    author: 'GarvitBhutani',
    isOfficial: true,
    errors: [
      { id: 'med-err-1', description: 'Incorrect flex direction', category: 'Layout', points: 150, errorClass: 'flex-row', fixedClass: 'flex-col md:flex-row', explanation: 'Responsive stacking (flex-col md:flex-row) prevents narrow viewport overflow.' },
      { id: 'med-err-2', description: 'Missing hover transition', category: 'Interaction', points: 150, errorClass: 'transition-none', fixedClass: 'transition-all duration-300', explanation: 'Interactive CTAs require smooth state transitions.' },
      { id: 'med-err-3', description: 'Inconsistent typography tracking', category: 'Typography', points: 150, errorClass: 'tracking-tight', fixedClass: 'tracking-widest', explanation: 'Uppercase display headers require wider letter-spacing.' },
      { id: 'med-err-4', description: 'Z-index clipping issue', category: 'Stacking', points: 150, errorClass: 'z-0', fixedClass: 'z-50', explanation: 'Rating stars were occluded by background glow layers.' },
      { id: 'med-err-5', description: 'Broken gradient stop', category: 'Color', points: 150, errorClass: 'to-transparent', fixedClass: 'to-[#10b981]', explanation: 'Missing terminal color stop caused uneven button background rendering.' },
    ],
    notes: [],
  },
  {
    id: 'case-hard',
    title: 'Nexus Telemetry Analytics Dashboard',
    difficulty: 'Hard',
    layoutType: 'Analytics',
    roleTitle: 'Senior Frontend Architect',
    timeLimit: 30,
    attemptsLimit: 10,
    author: 'CaseArchitect',
    isOfficial: true,
    errors: [
      { id: 'hard-err-1', description: 'Improper semantic state color', category: 'Theming', points: 200, errorClass: 'bg-red-500/10 text-red-500', fixedClass: 'bg-emerald-500/10 text-emerald-500', explanation: 'Destructive red alert classes leaked onto the primary navigation sidebar.' },
      { id: 'hard-err-2', description: 'Unoptimized rendering blur', category: 'Rendering', points: 200, errorClass: 'opacity-50 blur-sm', fixedClass: 'opacity-100 blur-none', explanation: 'Stale skeleton blur filter remained active on the chart container.' },
      { id: 'hard-err-3', description: 'Contrast ratio accessibility failure', category: 'Accessibility', points: 200, errorClass: 'text-slate-600 bg-slate-700', fixedClass: 'text-white bg-slate-900', explanation: 'Slate-600 on Slate-700 fails WCAG AA minimum 4.5:1 contrast ratio.' },
      { id: 'hard-err-4', description: 'Missing focus ring outline', category: 'Accessibility', points: 200, errorClass: 'outline-none', fixedClass: 'ring-2 ring-[#f59e0b]', explanation: 'Removing outline without a focus ring breaks keyboard accessibility.' },
      { id: 'hard-err-5', description: 'Incorrect box-sizing model', category: 'Box Model', points: 200, errorClass: 'box-content', fixedClass: 'box-border', explanation: 'box-content caused padding and border to overflow the fixed width.' },
    ],
    notes: [],
  },
  {
    id: 'case-nightmare',
    title: 'Root Kernel Preferences Override',
    difficulty: 'Nightmare',
    layoutType: 'Settings',
    roleTitle: 'Principal Staff Engineer',
    timeLimit: 20,
    attemptsLimit: 10,
    author: 'GarvitBhutani',
    isOfficial: true,
    errors: [
      { id: 'night-err-1', description: 'Runaway animation in avatar state', category: 'Animation', points: 500, errorClass: 'animate-bounce text-red-500', fixedClass: 'animate-none text-[#10b981]', explanation: 'Infinite bounce keyframe on avatar triggers continuous layout thrashing.' },
      { id: 'night-err-2', description: 'Oversized GPU shadow bleed', category: 'Performance', points: 500, errorClass: 'shadow-[0_0_100px_red]', fixedClass: 'shadow-[0_0_15px_#6366f1]', explanation: '100px red shadow bleeds across adjacent DOM nodes.' },
      { id: 'night-err-3', description: 'Corrupted micro-typography kerning', category: 'Typography', points: 500, errorClass: 'text-[8px] tracking-[1rem]', fixedClass: 'text-sm tracking-normal', explanation: '8px font with 1rem tracking renders label text illegible.' },
      { id: 'night-err-4', description: 'Inverted transform matrix', category: 'Transform', points: 500, errorClass: 'rotate-180 scale-50', fixedClass: 'rotate-0 scale-100', explanation: '180deg rotation and 50% scale broke button usability.' },
      { id: 'night-err-5', description: 'Ghost DOM node (opacity-0)', category: 'Visibility', points: 500, errorClass: 'opacity-0 pointer-events-none', fixedClass: 'opacity-100 pointer-events-auto', explanation: 'Hidden preference row still occupied layout space while blocking interaction.' },
    ],
    notes: [],
  },
];

const savedToken = localStorage.getItem('detective_token');
const savedUserStr = localStorage.getItem('detective_user');
const savedUser: UserProfile | null = savedUserStr
  ? { role: 'detective', ...JSON.parse(savedUserStr) }
  : null;

export const useGameStore = create<GameState>((set, get) => ({
  isPlaying: false,
  isGameOver: false,
  isVictory: false,
  attemptsLeft: 10,
  timeLeft: 60,
  xp: 0,
  combo: 0,
  difficulty: 'Demo',
  layoutType: 'SaaS',
  activeCase: DEFAULT_CASES[0],
  cases: DEFAULT_CASES,
  errors: [],
  hintsLeft: 1,
  hintTargetId: null,
  activeRoomCode: null,

  user: savedUser,
  token: savedToken,

  setUser: (user) => {
    if (user) {
      const normalized = { ...user, role: user.role || 'detective' };
      localStorage.setItem('detective_user', JSON.stringify(normalized));
      set({ user: normalized });
    } else {
      localStorage.removeItem('detective_user');
      set({ user: null });
    }
  },

  setToken: (token) => {
    if (token) localStorage.setItem('detective_token', token);
    else localStorage.removeItem('detective_token');
    set({ token });
  },

  logout: () => {
    localStorage.removeItem('detective_token');
    localStorage.removeItem('detective_user');
    set({ user: null, token: null });
  },

  setActiveRoomCode: (code) => {
    set({ activeRoomCode: code });
  },

  fetchCases: async () => {
    try {
      const res = await fetch('/api/cases');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          set({ cases: data });
        }
      }
    } catch {
      // Fallback to DEFAULT_CASES already in state
    }
  },

  setCases: (cases) => set({ cases }),

  startGame: (target) => {
    const { cases } = get();
    let chosenCase: CaseDefinition;

    if (typeof target === 'string') {
      chosenCase =
        cases.find((c) => c.difficulty === target) ||
        DEFAULT_CASES.find((c) => c.difficulty === target) ||
        DEFAULT_CASES[0];
    } else {
      chosenCase = target;
    }

    set({
      isPlaying: true,
      isGameOver: false,
      isVictory: false,
      attemptsLeft: chosenCase.attemptsLimit || 10,
      timeLeft: chosenCase.timeLimit || 60,
      xp: 0,
      combo: 0,
      difficulty: chosenCase.difficulty,
      layoutType: chosenCase.layoutType || 'SaaS',
      activeCase: chosenCase,
      errors: chosenCase.errors.map((e) => ({ ...e, fixed: false })),
      hintsLeft: 1,
      hintTargetId: null,
    });
  },

  fixError: (id: string) => {
    set((state) => {
      const targetErr = state.errors.find((e) => e.id === id);
      const basePoints = targetErr?.points || 100;
      const newErrors = state.errors.map((e) => (e.id === id ? { ...e, fixed: true } : e));
      const allFixed = newErrors.every((e) => e.fixed);
      const newXp = state.xp + basePoints + state.combo * 50;

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
        ...state,
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

  triggerHint: () => {
    set((state) => {
      if (state.hintsLeft > 0) {
        const unfixed = state.errors.filter((e) => !e.fixed);
        if (unfixed.length === 0) return state;

        const randomTarget = unfixed[Math.floor(Math.random() * unfixed.length)].id;
        setTimeout(() => set({ hintTargetId: null }), 3000);
        return { hintsLeft: state.hintsLeft - 1, hintTargetId: randomTarget };
      }
      return state;
    });
  },
}));
