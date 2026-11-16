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
  validateAuth: () => Promise<void>;
  setActiveRoomCode: (code: string | null) => void;

  casesError: string | null;
  apiOffline: boolean;
  fetchCases: () => Promise<void>;
  setCases: (cases: CaseDefinition[]) => void;
  startGame: (target: Difficulty | CaseDefinition) => void;
  fixError: (id: string) => void;
  missClick: () => void;
  tick: () => void;
  resetGame: () => void;
  triggerHint: () => void;
}

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
  activeCase: null,
  cases: [],
  errors: [],
  hintsLeft: 1,
  hintTargetId: null,
  activeRoomCode: null,

  user: savedUser,
  token: savedToken,
  casesError: null,
  apiOffline: false,

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

  validateAuth: async () => {
    const { token, logout, setUser } = get();
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
        set({ apiOffline: false });
      } else if (res.status === 401) {
        logout();
      }
    } catch {
      // The session is kept across a transient network error (any action will
      // still fail server-side), but the offline state is recorded rather
      // than swallowed, so the UI can say so.
      set({ apiOffline: true });
    }
  },

  setActiveRoomCode: (code) => {
    set({ activeRoomCode: code });
  },

  fetchCases: async () => {
    try {
      const res = await fetch('/api/cases');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      set({
        cases: Array.isArray(data) ? data : [],
        casesError: null,
        apiOffline: false,
      });
    } catch (err) {
      // Cases are server data. There is no local catalogue to fall back to,
      // so an unreachable API shows an error instead of a playable game that
      // looks backed by a database but is not.
      set({
        cases: [],
        casesError:
          err instanceof Error
            ? `Could not load cases from the server: ${err.message}`
            : 'Could not load cases from the server.',
        apiOffline: true,
      });
    }
  },

  setCases: (cases) => set({ cases }),

  startGame: (target) => {
    const { cases } = get();
    let chosenCase: CaseDefinition | undefined;

    if (typeof target === 'string') {
      chosenCase = cases.find((c) => c.difficulty === target);
    } else {
      chosenCase = target;
    }

    // Refuse to start rather than substituting a hardcoded case.
    if (!chosenCase) {
      set({
        casesError: `No "${String(target)}" case is available from the server. Load cases first.`,
      });
      return;
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
      casesError: null,
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
