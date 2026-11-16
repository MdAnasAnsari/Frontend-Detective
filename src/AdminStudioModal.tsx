import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Save,
  Shield,
  Layers,
  Users,
  Radio,
  Edit3,
  CheckCircle2,
  MonitorPlay,
  Sparkles,
  BarChart2,
  Clock,
  Flame,
} from 'lucide-react';
import { useGameStore, type CaseDefinition, type Difficulty, type LayoutType, type UserProfile, type UserRole } from './store';

interface AdminStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHostScreen: (roomCode?: string) => void;
}

export default function AdminStudioModal({ isOpen, onClose, onOpenHostScreen }: AdminStudioModalProps) {
  const { user, token, cases, setCases, fetchCases, setActiveRoomCode } = useGameStore();
  const isAdmin = user?.role === 'admin';
  const isArchitectOrAdmin = user?.role === 'admin' || user?.role === 'architect';

  const [activeTab, setActiveTab] = useState<'cases' | 'rooms' | 'users' | 'analytics'>('cases');
  const [statusBanner, setStatusBanner] = useState<string>('');
  const [bannerIsError, setBannerIsError] = useState(false);

  // --- CASES CRUD STATE ---
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || 'case-demo');
  const [editingCase, setEditingCase] = useState<CaseDefinition | null>(null);
  const [isCreatingNewCase, setIsCreatingNewCase] = useState(false);

  // --- ROOMS CRUD STATE ---
  const [rooms, setRooms] = useState<any[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDiff, setNewRoomDiff] = useState('All');

  // --- USERS RBAC CRUD STATE ---
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // --- MONITORING / LEADERBOARD STATE ---
  const [scores, setScores] = useState<any[]>([]);

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setScores(await res.json());
    } catch (err) {
      setScores([]);
      console.error('Could not load telemetry', err);
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms');
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setRooms(await res.json());
    } catch (err) {
      setRooms([]);
      console.error('Could not load rooms', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setAllUsers(await res.json());
    } catch (err) {
      // No hardcoded roster: the RBAC console shows real accounts or none.
      setAllUsers([]);
      console.error('Could not load users', err);
    }
  }, [token]);

  useEffect(() => {
    if (!isOpen) return;
    fetchCases();
    fetchRooms();
    fetchScores();
    if (isAdmin) {
      fetchUsers();
    }
  }, [isOpen, isAdmin, fetchCases, fetchRooms, fetchScores, fetchUsers]);

  useEffect(() => {
    const found = cases.find((c) => c.id === selectedCaseId) || cases[0];
    if (found && !isCreatingNewCase) {
      setEditingCase(JSON.parse(JSON.stringify(found)));
    }
  }, [selectedCaseId, cases, isCreatingNewCase]);

  const notify = (msg: string) => {
    setBannerIsError(false);
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(''), 3500);
  };

  // Reports a failed API call. Admin actions must never claim success when
  // the request did not reach the database.
  const notifyError = (err: unknown, context: string) => {
    const detail = err instanceof Error ? err.message : 'Request failed';
    setBannerIsError(true);
    setStatusBanner(`${context}: ${detail}`);
    setTimeout(() => setStatusBanner(''), 6000);
  };

  // Turns a non-2xx response into an Error carrying the server's message.
  const assertOk = async (res: Response) => {
    if (res.ok) return res;
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  };

  // --- ROOMS API ---

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newRoomName, difficulty: newRoomDiff }),
      });
      await assertOk(res);
      const created = await res.json();
      setRooms([created, ...rooms]);
      setNewRoomName('');
      notify(`Room ${created.code} created!`);
    } catch (err) {
      notifyError(err, 'Could not create room');
    }
  };

  const handleToggleRoom = async (room: any) => {
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !room.isActive }),
      });
      await assertOk(res);
      const updated = await res.json();
      setRooms(rooms.map((r) => (r.id === room.id ? updated : r)));
    } catch (err) {
      notifyError(err, 'Could not update room');
    }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      const res = await fetch(`/api/rooms/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await assertOk(res);
      setRooms(rooms.filter((r) => r.id !== id));
      notify('Room deleted.');
    } catch (err) {
      notifyError(err, 'Could not delete room');
    }
  };

  // --- USERS RBAC API ---

  const handleUpdateUserRole = async (targetUser: UserProfile, newRole: UserRole, newBadge: string) => {
    try {
      const res = await fetch(`/api/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole, badge: newBadge }),
      });
      await assertOk(res);
      const data = await res.json();
      setAllUsers(allUsers.map((u) => (u.id === targetUser.id ? data.user : u)));
      notify(`Updated ${targetUser.username} to ${newRole.toUpperCase()}`);
    } catch (err) {
      // A role change that the server rejected must not be shown as applied.
      notifyError(err, `Could not update ${targetUser.username}`);
    }
  };

  const handleDeleteUser = async (targetId: string) => {
    if (targetId === user?.id) {
      notify('Cannot delete your own active admin account.');
      return;
    }
    try {
      const res = await fetch(`/api/users/${targetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await assertOk(res);
      setAllUsers(allUsers.filter((u) => u.id !== targetId));
      notify('Agent removed from system.');
    } catch (err) {
      notifyError(err, 'Could not delete agent');
    }
  };

  // --- CASES CRUD HANDLERS ---
  const handleStartNewCase = () => {
    setIsCreatingNewCase(true);
    const template: CaseDefinition = {
      id: `case-${Date.now()}`,
      title: 'Custom UI Anomaly Mission',
      difficulty: 'Medium',
      layoutType: 'SaaS',
      roleTitle: 'Custom Case Specialist',
      timeLimit: 45,
      attemptsLimit: 10,
      author: user?.username || 'Architect',
      isOfficial: isAdmin,
      errors: [
        { id: 'err-1', description: 'Uneven CTA button padding', category: 'Spacing', points: 150, errorClass: 'px-2 py-4', fixedClass: 'px-6 py-3', explanation: 'Button padding is unbalanced.' },
        { id: 'err-2', description: 'Misaligned card icon', category: 'Alignment', points: 150, errorClass: '-mt-2', fixedClass: 'mt-0', explanation: 'Negative top margin shifts icon.' },
        { id: 'err-3', description: 'Mismatched card border radius', category: 'Border', points: 150, errorClass: 'rounded-sm', fixedClass: 'rounded-2xl', explanation: 'Border radius differs from sibling cards.' },
        { id: 'err-4', description: 'Low-weight hero heading', category: 'Typography', points: 150, errorClass: 'font-light', fixedClass: 'font-bold', explanation: 'Heading weight is too light.' },
        { id: 'err-5', description: 'Broken secondary button color', category: 'Color', points: 150, errorClass: 'bg-blue-400', fixedClass: 'bg-blue-600', explanation: 'Contrast fails design tokens.' },
      ],
      notes: [],
    };
    setEditingCase(template);
  };

  const handleSaveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCase) return;

    try {
      if (isCreatingNewCase) {
        const res = await fetch('/api/cases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editingCase),
        });
        await assertOk(res);
        const created = await res.json();
        setCases([...cases, created]);
        setSelectedCaseId(created.id);
        setIsCreatingNewCase(false);
        notify(`Created new case: ${created.title}`);
      } else {
        const res = await fetch(`/api/cases/${editingCase.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editingCase),
        });
        await assertOk(res);
        const updated = await res.json();
        setCases(cases.map((c) => (c.id === updated.id ? updated : c)));
        notify(`Saved changes to: ${updated.title}`);
      }
    } catch (err) {
      // Previously this said "Created new case locally" and kept the case in
      // React state only, so an architect could build a whole mission that
      // never existed server-side.
      notifyError(err, 'Could not save case');
    }
  };

  const handleDeleteCase = async (id: string) => {
    if (cases.length <= 1) {
      notify('Cannot delete the last remaining case.');
      return;
    }
    try {
      const res = await fetch(`/api/cases/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await assertOk(res);
      const remaining = cases.filter((c) => c.id !== id);
      setCases(remaining);
      setSelectedCaseId(remaining[0].id);
      setIsCreatingNewCase(false);
      notify('Case deleted.');
    } catch (err) {
      notifyError(err, 'Could not delete case');
    }
  };

  if (!isOpen || !isArchitectOrAdmin) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl bg-slate-900 border-2 border-indigo-500/60 rounded-2xl shadow-[0_0_60px_rgba(99,102,241,0.3)] text-white max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Top Header */}
        <div className="px-6 py-4 bg-black/50 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-indigo-400" />
            <div>
              <h2 className="text-lg md:text-xl font-black uppercase tracking-widest font-mono flex items-center space-x-2">
                <span>COMMAND STUDIO // RBAC & CRUD CONSOLE</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  ROLE: {user?.role.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Manage UI Anomaly Cases, Live Hackathon Rooms, and Agent Access Control
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-slate-950/60 font-mono text-xs px-6 space-x-2 pt-2">
          <button
            onClick={() => setActiveTab('cases')}
            className={`px-4 py-2.5 rounded-t-lg font-bold uppercase flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'cases'
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Case & Bug Builder (CRUD)</span>
          </button>

          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-4 py-2.5 rounded-t-lg font-bold uppercase flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'rooms'
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Live Event Rooms (CRUD)</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2.5 rounded-t-lg font-bold uppercase flex items-center space-x-2 border-b-2 transition-all ${
                activeTab === 'users'
                  ? 'bg-rose-600/20 text-rose-300 border-rose-400'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User RBAC Console (Admin Only)</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-t-lg font-bold uppercase flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'analytics'
                ? 'bg-amber-600/20 text-amber-300 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Level Monitoring & Telemetry</span>
          </button>
        </div>

        {statusBanner && (
          <div
            className={`border-b px-6 py-2 text-xs font-mono flex items-center space-x-2 ${
              bannerIsError
                ? 'bg-red-500/15 border-red-500/40 text-red-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusBanner}</span>
          </div>
        )}

        {/* Main Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 font-mono">
          {/* TAB 1: CASES & ANOMALIES CRUD */}
          {activeTab === 'cases' && editingCase && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Sidebar: Case List */}
              <div className="lg:col-span-4 space-y-3 border-r border-white/10 pr-0 lg:pr-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-bold text-slate-400">Available Cases ({cases.length})</span>
                  <button
                    type="button"
                    onClick={handleStartNewCase}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Case</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {cases.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setIsCreatingNewCase(false);
                        setSelectedCaseId(c.id);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        !isCreatingNewCase && editingCase.id === c.id
                          ? 'bg-indigo-600/20 border-indigo-400 shadow-lg'
                          : 'bg-black/40 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{c.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-indigo-300 uppercase">
                          {c.difficulty}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                        <span>Layout: {c.layoutType}</span>
                        <span>{c.errors.length} Bugs • {c.timeLimit}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel: Case & Bug Editor Form */}
              <form onSubmit={handleSaveCase} className="lg:col-span-8 space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <Edit3 className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold uppercase text-white">
                      {isCreatingNewCase ? 'Creating New Case Mission' : `Editing: ${editingCase.title}`}
                    </h3>
                  </div>

                  {!isCreatingNewCase && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCase(editingCase.id)}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Case</span>
                    </button>
                  )}
                </div>

                {/* Case Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="md:col-span-2">
                    <label className="block text-slate-400 uppercase mb-1">Case Title</label>
                    <input
                      type="text"
                      value={editingCase.title}
                      onChange={(e) => setEditingCase({ ...editingCase, title: e.target.value })}
                      className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Difficulty Tier</label>
                    <select
                      value={editingCase.difficulty}
                      onChange={(e) => setEditingCase({ ...editingCase, difficulty: e.target.value as Difficulty })}
                      className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="Demo">Demo</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                      <option value="Nightmare">Nightmare</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1">UI Layout Template</label>
                    <select
                      value={editingCase.layoutType}
                      onChange={(e) => setEditingCase({ ...editingCase, layoutType: e.target.value as LayoutType })}
                      className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="SaaS">SaaS Landing</option>
                      <option value="Ecommerce">E-Commerce Product</option>
                      <option value="Analytics">Analytics Dashboard</option>
                      <option value="Settings">Root Settings</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Time Limit (sec)</label>
                    <input
                      type="number"
                      min={10}
                      max={300}
                      value={editingCase.timeLimit}
                      onChange={(e) => setEditingCase({ ...editingCase, timeLimit: Number(e.target.value) })}
                      className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase mb-1">Integrity (Attempts)</label>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      value={editingCase.attemptsLimit}
                      onChange={(e) => setEditingCase({ ...editingCase, attemptsLimit: Number(e.target.value) })}
                      className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                {/* Anomaly / Bug Definitions */}
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase text-indigo-300 flex items-center justify-between">
                    <span>DOM Anomaly Targets ({editingCase.errors.length})</span>
                    <span className="text-[10px] text-slate-400">Configure broken vs. fixed Tailwind classes</span>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {editingCase.errors.map((err, idx) => (
                      <div key={err.id || idx} className="p-3 bg-black/50 border border-white/10 rounded-xl space-y-2 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                          <div className="md:col-span-2">
                            <label className="text-[10px] text-slate-400 uppercase">Bug Description #{idx + 1}</label>
                            <input
                              type="text"
                              value={err.description}
                              onChange={(e) => {
                                const next = [...editingCase.errors];
                                next[idx] = { ...next[idx], description: e.target.value };
                                setEditingCase({ ...editingCase, errors: next });
                              }}
                              className="w-full bg-slate-900 border border-white/15 rounded px-2.5 py-1.5 text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-rose-400 uppercase">Broken Class</label>
                            <input
                              type="text"
                              value={err.errorClass}
                              onChange={(e) => {
                                const next = [...editingCase.errors];
                                next[idx] = { ...next[idx], errorClass: e.target.value };
                                setEditingCase({ ...editingCase, errors: next });
                              }}
                              className="w-full bg-slate-900 border border-rose-500/30 rounded px-2.5 py-1.5 text-rose-300"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-emerald-400 uppercase">Fixed Class</label>
                            <input
                              type="text"
                              value={err.fixedClass}
                              onChange={(e) => {
                                const next = [...editingCase.errors];
                                next[idx] = { ...next[idx], fixedClass: e.target.value };
                                setEditingCase({ ...editingCase, errors: next });
                              }}
                              className="w-full bg-slate-900 border border-emerald-500/30 rounded px-2.5 py-1.5 text-emerald-300"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase">Post-Mortem Technical Explanation</label>
                          <input
                            type="text"
                            value={err.explanation || ''}
                            onChange={(e) => {
                              const next = [...editingCase.errors];
                              next[idx] = { ...next[idx], explanation: e.target.value };
                              setEditingCase({ ...editingCase, errors: next });
                            }}
                            className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1 text-slate-300 text-[11px]"
                            placeholder="Explain why this CSS/DOM state is a bug..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase text-xs flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isCreatingNewCase ? 'Publish New Case' : 'Save Case Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: LIVE EVENT ROOMS CRUD */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              <form onSubmit={handleCreateRoom} className="bg-black/40 border border-white/10 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs text-slate-400 uppercase mb-1">New Hackathon / Classroom Room Name</label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="e.g. Frontend Engineering Lab — Section A"
                    className="w-full bg-slate-900 border border-white/20 rounded-lg px-3 py-2 text-sm text-white"
                    required
                  />
                </div>
                <div className="w-full md:w-44">
                  <label className="block text-xs text-slate-400 uppercase mb-1">Allowed Scope</label>
                  <select
                    value={newRoomDiff}
                    onChange={(e) => setNewRoomDiff(e.target.value)}
                    className="w-full bg-slate-900 border border-white/20 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="All">All Difficulties</option>
                    <option value="Demo">Demo Only</option>
                    <option value="Medium">Medium Only</option>
                    <option value="Hard">Hard Only</option>
                    <option value="Nightmare">Nightmare Only</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-xs rounded-lg flex items-center space-x-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Room</span>
                </button>
              </form>

              <div className="space-y-3">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 bg-black/40 border border-white/10 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 rounded-lg">
                          {room.code}
                        </span>
                        <h4 className="text-base font-bold text-white">{room.name}</h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                            room.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {room.isActive ? 'LIVE' : 'CLOSED'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Host: {room.hostName} • Scope: {room.difficulty}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRoomCode(room.code);
                          onClose();
                          onOpenHostScreen(room.code);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5"
                      >
                        <MonitorPlay className="w-3.5 h-3.5" />
                        <span>Launch Host View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleRoom(room)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold"
                      >
                        {room.isActive ? 'Pause' : 'Activate'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRoom(room.id)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: USER RBAC MANAGEMENT (ADMIN ONLY) */}
          {activeTab === 'users' && isAdmin && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-xs text-slate-400 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  <span>Promote or demote agents between Detective, Case Architect, and Chief Inspector (Admin)</span>
                </div>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Filter agents..."
                  className="bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white w-full sm:w-56"
                />
              </div>

              <div className="space-y-2.5">
                {allUsers
                  .filter(
                    (u) =>
                      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map((u) => (
                    <div
                      key={u.id}
                      className="p-3.5 bg-black/40 border border-white/10 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{u.avatar || '🕵️‍♂️'}</span>
                        <div>
                          <div className="font-bold text-white flex items-center space-x-2">
                            <span>{u.username}</span>
                            <span className="text-[10px] text-indigo-400">({u.email})</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Badge: {u.badge} • Total XP: {u.totalXp} CR • Victories: {u.victories}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={u.role}
                          onChange={(e) => {
                            const nextRole = e.target.value as UserRole;
                            const defaultBadge =
                              nextRole === 'admin'
                                ? 'Chief Inspector'
                                : nextRole === 'architect'
                                ? 'Case Architect'
                                : 'Field Detective';
                            handleUpdateUserRole(u, nextRole, defaultBadge);
                          }}
                          className="bg-slate-900 border border-white/20 rounded-lg px-2.5 py-1.5 text-white font-bold uppercase text-xs"
                        >
                          <option value="detective">Role: Detective</option>
                          <option value="architect">Role: Architect</option>
                          <option value="admin">Role: Admin</option>
                        </select>

                        {u.id !== user?.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 4: LEVEL MONITORING & TELEMETRY */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/50 border border-white/10 p-4 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total Levels / Cases</div>
                  <div className="text-3xl font-black text-indigo-400">{cases.length}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Active case assignments</div>
                </div>
                <div className="bg-black/50 border border-white/10 p-4 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total Submissions</div>
                  <div className="text-3xl font-black text-emerald-400">{scores.length}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Completed audit runs</div>
                </div>
                <div className="bg-black/50 border border-white/10 p-4 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Active Agents</div>
                  <div className="text-3xl font-black text-amber-400">{allUsers.length || 3}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Registered investigators</div>
                </div>
                <div className="bg-black/50 border border-white/10 p-4 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Live Event Rooms</div>
                  <div className="text-3xl font-black text-rose-400">{rooms.filter((r) => r.isActive).length}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Active broadcast rooms</div>
                </div>
              </div>

              {/* Per-Level Breakdown Table */}
              <div className="space-y-3">
                <div className="text-xs uppercase font-bold text-slate-400 flex items-center justify-between">
                  <span>Level-by-Level Clear Rates & Performance</span>
                  <span className="text-[10px] text-slate-500">Live Telemetry Metrics</span>
                </div>

                <div className="space-y-2.5">
                  {cases.map((c) => {
                    const levelScores = scores.filter(
                      (s) => (s.caseId && s.caseId === c.id) || (s.difficulty && s.difficulty.toLowerCase() === c.difficulty.toLowerCase())
                    );
                    const avgXp = levelScores.length > 0 ? Math.round(levelScores.reduce((sum, s) => sum + (s.xp || 0), 0) / levelScores.length) : 0;
                    const avgTimeLeft = levelScores.length > 0 ? Math.round(levelScores.reduce((sum, s) => sum + (s.timeLeft || 0), 0) / levelScores.length) : 0;

                    return (
                      <div key={c.id} className="p-4 bg-black/40 border border-white/10 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-white">{c.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-indigo-300 uppercase font-mono">
                              {c.difficulty}
                            </span>
                            {c.isOfficial ? (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                OFFICIAL
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                CUSTOM
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            <span>Layout: {c.layoutType}</span>
                            <span>Anomalies: {c.errors.length}</span>
                            <span>Time Limit: {c.timeLimit}s</span>
                            <span>Author: {c.author}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 text-xs font-mono">
                          <div className="text-right">
                            <div className="text-slate-400 text-[10px] uppercase">Audit Runs</div>
                            <div className="text-base font-bold text-white">{levelScores.length}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-slate-400 text-[10px] uppercase flex items-center justify-end space-x-1">
                              <Flame className="w-3 h-3 text-amber-400" />
                              <span>Avg Bounty</span>
                            </div>
                            <div className="text-base font-bold text-amber-400">{avgXp} CR</div>
                          </div>
                          <div className="text-right">
                            <div className="text-slate-400 text-[10px] uppercase flex items-center justify-end space-x-1">
                              <Clock className="w-3 h-3 text-emerald-400" />
                              <span>Avg Pace</span>
                            </div>
                            <div className="text-base font-bold text-emerald-400">{avgTimeLeft}s left</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
