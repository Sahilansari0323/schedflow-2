import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Users,
  DoorOpen,
  BookOpen,
  Calendar,
  Grid,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertCircle,
  Video,
  Clock,
} from 'lucide-react';
import api, { getErrorMessage } from '../../shared/api';
import GlassCard from '../../shared/components/GlassCard';
import AppleButton, { CTAButton, ReplyButton } from '../../shared/components/AppleButton';

type TabType = 'teachers' | 'rooms' | 'finder' | 'subjects' | 'sections' | 'semesters';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function Topology() {
  const [activeTab, setActiveTab] = useState<TabType>('teachers');
  const [departments, setDepartments] = useState<any[]>([]);
  const [filterDept, setFilterDept] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Data lists
  const [teachers, setTeachers] = useState<any[]>([]);
  const [workload, setWorkload] = useState<Record<number, any>>({});
  const [rooms, setRooms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);

  // AI Room Finder State
  const [finderDay, setFinderDay] = useState<number>(1);
  const [finderPeriod, setFinderPeriod] = useState<number>(1);
  const [finderProjector, setFinderProjector] = useState<string>('any');
  const [finderLoading, setFinderLoading] = useState<boolean>(false);
  const [availabilityData, setAvailabilityData] = useState<any>(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Load departments once
  useEffect(() => {
    api
      .get('/departments')
      .then((r) => setDepartments(r.data))
      .catch(() => {});
  }, []);

  // Load active tab data
  const loadData = () => {
    const params = filterDept ? { department_id: filterDept } : {};
    if (activeTab === 'teachers') {
      api.get('/teachers', { params }).then((r) => setTeachers(r.data)).catch(() => {});
      api
        .get('/teachers-workload', { params })
        .then((r) => {
          const map: Record<number, any> = {};
          r.data.forEach((w: any) => {
            map[w.id] = w;
          });
          setWorkload(map);
        })
        .catch(() => {});
    } else if (activeTab === 'rooms') {
      api.get('/rooms', { params }).then((r) => setRooms(r.data)).catch(() => {});
    } else if (activeTab === 'finder') {
      scanAvailability();
    } else if (activeTab === 'subjects') {
      api.get('/subjects', { params }).then((r) => setSubjects(r.data)).catch(() => {});
    } else if (activeTab === 'sections') {
      api.get('/sections').then((r) => setSections(r.data)).catch(() => {});
      api.get('/semesters').then((r) => setSemesters(r.data)).catch(() => {});
    } else if (activeTab === 'semesters') {
      api.get('/semesters').then((r) => setSemesters(r.data)).catch(() => {});
    }
  };

  const scanAvailability = async () => {
    setFinderLoading(true);
    try {
      const params: any = {
        day: finderDay,
        period: finderPeriod,
      };
      if (filterDept) params.department_id = filterDept;
      if (finderProjector === 'yes') params.has_projector = true;
      if (finderProjector === 'no') params.has_projector = false;

      const res = await api.get('/availability', { params });
      setAvailabilityData(res.data);
    } catch (err: any) {
      console.error('Failed to query availability', err);
    } finally {
      setFinderLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [activeTab, filterDept]);

  useEffect(() => {
    if (activeTab === 'finder') {
      scanAvailability();
    }
  }, [finderDay, finderPeriod, finderProjector, filterDept]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setError('');
    setEditingItem(null);
    if (activeTab === 'teachers') {
      setFormData({
        name: '',
        email: '',
        employee_code: '',
        designation: 'Assistant Professor',
        department_id: filterDept || departments[0]?.id || '',
        max_weekly_load: 20,
        unavailable_slots: [],
        is_active: true,
      });
    } else if (activeTab === 'rooms') {
      setFormData({
        name: '',
        room_type: 'classroom',
        capacity: 60,
        has_projector: false,
        department_id: filterDept || departments[0]?.id || '',
      });
    } else if (activeTab === 'subjects') {
      setFormData({
        name: '',
        code: '',
        department_id: filterDept || departments[0]?.id || '',
        hours_per_week: 4,
        requires_lab: false,
        credits: 3,
        elective_group: '',
      });
    } else if (activeTab === 'sections') {
      setFormData({
        name: '',
        semester_id: semesters[0]?.id || '',
        student_strength: 60,
      });
    } else if (activeTab === 'semesters') {
      setFormData({
        number: 1,
        academic_year: '2026-2027',
        department_id: filterDept || departments[0]?.id || '',
      });
    }
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: any) => {
    setError('');
    setEditingItem(item);
    setFormData({ ...item });
    setModalOpen(true);
  };

  // Save Item
  const handleSave = async () => {
    setBusy(true);
    setError('');
    try {
      if (activeTab === 'teachers') {
        const payload = {
          ...formData,
          department_id: Number(formData.department_id),
          max_weekly_load: Number(formData.max_weekly_load),
        };
        if (editingItem) await api.put(`/teachers/${editingItem.id}`, payload);
        else await api.post('/teachers', payload);
      } else if (activeTab === 'rooms') {
        const payload = {
          ...formData,
          department_id: Number(formData.department_id),
          capacity: Number(formData.capacity),
          has_projector: Boolean(formData.has_projector),
        };
        if (editingItem) await api.put(`/rooms/${editingItem.id}`, payload);
        else await api.post('/rooms', payload);
      } else if (activeTab === 'subjects') {
        const payload = {
          ...formData,
          department_id: Number(formData.department_id),
          hours_per_week: Number(formData.hours_per_week || formData.weekly_hours || 4),
          weekly_hours: Number(formData.hours_per_week || formData.weekly_hours || 4),
          credits: Number(formData.credits || 3),
          requires_lab: Boolean(formData.requires_lab),
          elective_group: formData.elective_group?.trim() || null,
        };
        if (editingItem) await api.put(`/subjects/${editingItem.id}`, payload);
        else await api.post('/subjects', payload);
      } else if (activeTab === 'sections') {
        const payload = {
          ...formData,
          semester_id: Number(formData.semester_id),
          student_strength: Number(formData.student_strength),
        };
        if (editingItem) await api.put(`/sections/${editingItem.id}`, payload);
        else await api.post('/sections', payload);
      } else if (activeTab === 'semesters') {
        const payload = {
          ...formData,
          number: Number(formData.number),
          department_id: Number(formData.department_id),
        };
        if (editingItem) await api.put(`/semesters/${editingItem.id}`, payload);
        else await api.post('/semesters', payload);
      }

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to save entity changes.'));
    } finally {
      setBusy(false);
    }
  };

  // Delete Item
  const handleDelete = async (item: any) => {
    if (!confirm(`Are you sure you want to delete "${item.name || item.code || `Semester ${item.number}`}"?`)) return;
    try {
      await api.delete(`/${activeTab}/${item.id}`);
      loadData();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Could not delete entity.'));
    }
  };

  // Toggle Unavailable Slot for Teachers
  const toggleSlot = (day: number, period: number) => {
    const slotCode = `${day}-${period}`;
    const cur = formData.unavailable_slots || [];
    const next = cur.includes(slotCode) ? cur.filter((s: string) => s !== slotCode) : [...cur, slotCode];
    setFormData({ ...formData, unavailable_slots: next });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[rgba(16,20,32,0.65)] border border-white/10 backdrop-blur-3xl shadow-[0_14px_40px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-[#74C947] uppercase font-bold">
              Master Entity Graph
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Campus Topology & AI Rooms</h2>
          <p className="text-xs text-white/60 mt-1 max-w-xl">
            Configure institutional faculties, room capacities, course units, academic cohorts, and AI-powered slot availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab !== 'finder' && (
            <AppleButton variant="primary" size="md" onClick={handleOpenAdd}>
              <Plus className="w-4 h-4" />
              <span>Add {activeTab.slice(0, -1)}</span>
            </AppleButton>
          )}
        </div>
      </div>

      {/* Tabs and Department Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-3xl overflow-x-auto shadow-sm">
          {[
            { key: 'teachers', label: 'Faculty Roster', icon: Users },
            { key: 'rooms', label: 'Venues', icon: DoorOpen },
            { key: 'finder', label: 'AI Room & Slot Finder', icon: Sparkles },
            { key: 'subjects', label: 'Subjects', icon: BookOpen },
            { key: 'sections', label: 'Sections', icon: Grid },
            { key: 'semesters', label: 'Semesters', icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-[#74C947] text-[#081a05] shadow-[0_0_15px_rgba(116,201,71,0.3)]'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search and Dept Filter */}
        <div className="flex items-center gap-3">
          {activeTab !== 'finder' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items…"
                className="pl-9 pr-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#74C947] backdrop-blur-2xl shadow-sm"
              />
            </div>
          )}

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-[#74C947] backdrop-blur-2xl shadow-sm font-medium"
          >
            <option value="" className="bg-[#0e121e] text-white">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id} className="bg-[#0e121e] text-white">
                {d.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Contents Card */}
      <GlassCard variant="pro" className="!p-0 overflow-hidden">
        {/* Teachers Tab */}
        {activeTab === 'teachers' && (
          <div className="divide-y divide-white/5">
            <div className="p-4 bg-white/[0.02] grid grid-cols-12 text-xs font-mono uppercase text-white/50 font-semibold">
              <div className="col-span-4">Faculty Member</div>
              <div className="col-span-3">Department & Designation</div>
              <div className="col-span-3">Workload Commitment</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {teachers
              .filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((t) => {
                const assigned = workload[t.id]?.assigned_periods || 0;
                const maxLoad = t.max_weekly_load || 20;
                const pct = Math.min(100, Math.round((assigned / maxLoad) * 100));

                return (
                  <div
                    key={t.id}
                    className="p-4 grid grid-cols-12 items-center hover:bg-white/[0.02] transition"
                  >
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#74C947]/15 border border-[#74C947]/30 flex items-center justify-center text-[#74C947] font-bold text-xs">
                        {t.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{t.name}</div>
                        <div className="text-xs text-white/50 font-mono">{t.email}</div>
                      </div>
                    </div>

                    <div className="col-span-3 text-xs text-white/70">
                      <div>{t.designation || 'Faculty'}</div>
                      <div className="text-[11px] text-[#74C947] font-semibold">
                        {departments.find((d) => d.id === t.department_id)?.name || 'General'}
                      </div>
                    </div>

                    <div className="col-span-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-white/60 font-mono">
                          {assigned} / {maxLoad} hrs
                        </span>
                        <span className="text-[#74C947] font-mono font-semibold">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            pct >= 100 ? 'bg-rose-500' : pct > 75 ? 'bg-amber-400' : 'bg-[#74C947]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="divide-y divide-white/5">
            <div className="p-4 bg-white/[0.02] grid grid-cols-12 text-xs font-mono uppercase text-white/50 font-semibold">
              <div className="col-span-4">Venue Name</div>
              <div className="col-span-3">Department</div>
              <div className="col-span-3">Type & Capacity</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {rooms
              .filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((r) => (
                <div
                  key={r.id}
                  className="p-4 grid grid-cols-12 items-center hover:bg-white/[0.02] transition"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
                      <DoorOpen className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-semibold text-white">{r.name}</div>
                  </div>

                  <div className="col-span-3 text-xs text-white/70">
                    {departments.find((d) => d.id === r.department_id)?.name || 'Campus Wide'}
                  </div>

                  <div className="col-span-3 flex items-center gap-2">
                    <span className="text-xs font-mono text-[#74C947] font-semibold">{r.capacity} seats</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.06] border border-white/10 uppercase text-white/70">
                      {r.room_type || 'Classroom'}
                    </span>
                    {r.has_projector && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Projector
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(r)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* AI Room & Faculty Finder Tab */}
        {activeTab === 'finder' && (
          <div className="p-6 space-y-6">
            {/* Finder Query Controls */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#74C947] font-bold">
                <Sparkles className="w-4 h-4 text-[#74C947]" />
                <span>AI Live Availability Radar</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-white/60 mb-1">Day of Week</label>
                  <select
                    value={finderDay}
                    onChange={(e) => setFinderDay(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:border-[#74C947]"
                  >
                    {DAYS.map((d, idx) => (
                      <option key={d} value={idx + 1} className="bg-[#0e121e] text-white">
                        {d} ({['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][idx]})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-white/60 mb-1">Period Slot</label>
                  <select
                    value={finderPeriod}
                    onChange={(e) => setFinderPeriod(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:border-[#74C947]"
                  >
                    {PERIODS.map((p) => (
                      <option key={p} value={p} className="bg-[#0e121e] text-white">
                        Period {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-white/60 mb-1">Projector Requirement</label>
                  <select
                    value={finderProjector}
                    onChange={(e) => setFinderProjector(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:border-[#74C947]"
                  >
                    <option value="any" className="bg-[#0e121e] text-white">Any Venue</option>
                    <option value="yes" className="bg-[#0e121e] text-white">Requires Projector</option>
                    <option value="no" className="bg-[#0e121e] text-white">No Projector Required</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <AppleButton
                    variant="primary"
                    size="sm"
                    className="w-full !py-2"
                    onClick={scanAvailability}
                    disabled={finderLoading}
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${finderLoading ? 'animate-spin' : ''}`} />
                    <span>{finderLoading ? 'Scanning…' : 'Scan Slots'}</span>
                  </AppleButton>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            {availabilityData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Rooms Availability */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-[#74C947]" />
                      <h4 className="font-bold text-sm text-white">Venues ({availabilityData.rooms?.length || 0})</h4>
                    </div>
                    <div className="text-xs font-mono text-[#74C947]">
                      {availabilityData.free_rooms_count ?? availabilityData.rooms?.filter((r: any) => !r.busy).length} Available
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[420px] overflow-y-auto no-scrollbar">
                    {availabilityData.rooms?.map((r: any) => (
                      <div
                        key={r.id}
                        className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition ${
                          r.busy
                            ? 'bg-rose-500/10 border-rose-500/20 text-white/80'
                            : 'bg-[#74C947]/10 border-[#74C947]/30 text-white'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{r.name}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10">
                              {r.room_type || 'Classroom'}
                            </span>
                            {r.has_projector && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                                Projector
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-white/60">
                            Capacity: {r.capacity} seats {r.used_by && <span className="text-rose-300 ml-1 font-mono">&bull; {r.used_by}</span>}
                          </div>
                        </div>

                        <div>
                          {r.busy ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              OCCUPIED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#74C947]/20 text-[#74C947] border border-[#74C947]/30">
                              AVAILABLE
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Teachers Availability */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#74C947]" />
                      <h4 className="font-bold text-sm text-white">Instructors ({availabilityData.teachers?.length || 0})</h4>
                    </div>
                    <div className="text-xs font-mono text-[#74C947]">
                      {availabilityData.free_teachers_count ?? availabilityData.teachers?.filter((t: any) => !t.busy).length} Free
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[420px] overflow-y-auto no-scrollbar">
                    {availabilityData.teachers?.map((t: any) => (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition ${
                          t.busy
                            ? 'bg-amber-500/10 border-amber-500/20 text-white/80'
                            : 'bg-white/[0.04] border-white/10 text-white'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-sm">{t.name}</div>
                          <div className="text-[11px] text-white/60">
                            {t.designation || 'Faculty'} {t.teaching && <span className="text-amber-300 ml-1 font-mono">&bull; {t.teaching}</span>}
                          </div>
                        </div>

                        <div>
                          {t.busy ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              TEACHING
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#74C947]/20 text-[#74C947] border border-[#74C947]/30">
                              FREE
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Subjects Tab */}
        {activeTab === 'subjects' && (
          <div className="divide-y divide-white/5">
            <div className="p-4 bg-white/[0.02] grid grid-cols-12 text-xs font-mono uppercase text-white/50 font-semibold">
              <div className="col-span-4">Course Title & Code</div>
              <div className="col-span-3">Department</div>
              <div className="col-span-3">Weekly Commitment</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {subjects
              .filter(
                (s) =>
                  s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.code.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((s) => (
                <div
                  key={s.id}
                  className="p-4 grid grid-cols-12 items-center hover:bg-white/[0.02] transition"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#74C947]/15 border border-[#74C947]/30 flex items-center justify-center text-[#74C947] font-mono text-xs font-bold">
                      {s.code.slice(0, 3)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{s.name}</div>
                      <div className="text-xs text-[#74C947] font-mono font-medium">{s.code}</div>
                    </div>
                  </div>

                  <div className="col-span-3 text-xs text-white/70">
                    {departments.find((d) => d.id === s.department_id)?.name || 'General'}
                  </div>

                  <div className="col-span-3 flex items-center gap-2">
                    <span className="text-xs text-white/80 font-mono">
                      {s.hours_per_week || s.weekly_hours || 4} hrs/wk
                    </span>
                    {s.requires_lab && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Lab Req
                      </span>
                    )}
                    {s.elective_group && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {s.elective_group}
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Sections Tab */}
        {activeTab === 'sections' && (
          <div className="divide-y divide-white/5">
            <div className="p-4 bg-white/[0.02] grid grid-cols-12 text-xs font-mono uppercase text-white/50 font-semibold">
              <div className="col-span-4">Cohort Section</div>
              <div className="col-span-4">Semester Association</div>
              <div className="col-span-2">Strength</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {sections
              .filter((sec) => sec.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((sec) => (
                <div
                  key={sec.id}
                  className="p-4 grid grid-cols-12 items-center hover:bg-white/[0.02] transition"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#74C947]/15 border border-[#74C947]/30 flex items-center justify-center text-[#74C947] font-bold text-xs">
                      {sec.name}
                    </div>
                    <div className="text-sm font-semibold text-white">Section {sec.name}</div>
                  </div>

                  <div className="col-span-4 text-xs text-white/70">
                    {(() => {
                      const sem = semesters.find((s) => s.id === sec.semester_id);
                      return sem
                        ? `Semester ${sem.number} (${sem.academic_year})`
                        : `Semester #${sec.semester_id}`;
                    })()}
                  </div>

                  <div className="col-span-2 text-xs text-white/80 font-mono">
                    {sec.student_strength} students
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(sec)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sec)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Semesters Tab */}
        {activeTab === 'semesters' && (
          <div className="divide-y divide-white/5">
            <div className="p-4 bg-white/[0.02] grid grid-cols-12 text-xs font-mono uppercase text-white/50 font-semibold">
              <div className="col-span-4">Academic Semester</div>
              <div className="col-span-4">Department</div>
              <div className="col-span-2">Academic Year</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {semesters
              .filter((sem) => {
                const label = `Semester ${sem.number} ${sem.academic_year || ''}`;
                return label.toLowerCase().includes(searchQuery.toLowerCase());
              })
              .map((sem) => (
                <div
                  key={sem.id}
                  className="p-4 grid grid-cols-12 items-center hover:bg-white/[0.02] transition"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-semibold text-white">Semester {sem.number}</div>
                  </div>

                  <div className="col-span-4 text-xs text-white/70">
                    {departments.find((d) => d.id === sem.department_id)?.name || 'All'}
                  </div>

                  <div className="col-span-2 text-xs text-white/80 font-mono">
                    {sem.academic_year}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(sem)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sem)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </GlassCard>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full"
            >
              <GlassCard variant="pro" className="!p-6 space-y-4 bg-[#0e121e]/95 border-white/15">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="font-bold text-white text-sm">
                    {editingItem ? 'Edit' : 'Add'} {activeTab.slice(0, -1)}
                  </h3>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="p-1 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  {/* TEACHERS FORM */}
                  {activeTab === 'teachers' && (
                    <>
                      <div>
                        <label className="block text-white/70 mb-1 font-medium">Full Name</label>
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-white/70 mb-1 font-medium">Email</label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-white/70 mb-1 font-medium">Designation</label>
                          <input
                            type="text"
                            value={formData.designation || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, designation: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-white/70 mb-1 font-medium">Max Weekly Load</label>
                          <input
                            type="number"
                            value={formData.max_weekly_load || 20}
                            onChange={(e) =>
                              setFormData({ ...formData, max_weekly_load: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-white/70 mb-1 font-medium">Department</label>
                        <select
                          value={formData.department_id || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, department_id: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                        >
                          {departments.map((d) => (
                            <option key={d.id} value={d.id} className="bg-[#0e121e] text-white">
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* Unavailable Slots Picker */}
                      <div>
                        <label className="block text-white/70 mb-1 font-medium">Unavailable Period Slots</label>
                        <div className="grid grid-cols-6 gap-1 p-2 rounded-xl bg-white/[0.03] border border-white/10 text-[9px] text-center">
                          {DAYS.map((d, dIdx) => (
                            <div key={d} className="space-y-1">
                              <span className="text-white/50 font-mono block font-semibold">{d}</span>
                              {PERIODS.map((p) => {
                                const slotCode = `${dIdx + 1}-${p}`;
                                const isUnavail = (formData.unavailable_slots || []).includes(slotCode);
                                return (
                                  <button
                                    type="button"
                                    key={p}
                                    onClick={() => toggleSlot(dIdx + 1, p)}
                                    className={`w-full py-1 rounded text-[8px] font-mono transition cursor-pointer font-medium ${
                                      isUnavail
                                        ? 'bg-rose-500 text-white font-bold'
                                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                                    }`}
                                  >
                                    P{p}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ROOMS FORM */}
                  {activeTab === 'rooms' && (
                    <>
                      <div>
                        <label className="block text-white/70 mb-1 font-medium">Room Name / Code</label>
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-white/70 mb-1 font-medium">Room Type</label>
                          <select
                            value={formData.room_type || 'classroom'}
                            onChange={(e) =>
                              setFormData({ ...formData, room_type: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                          >
                            <option value="classroom" className="bg-[#0e121e] text-white">Classroom</option>
                            <option value="lab" className="bg-[#0e121e] text-white">Computer / Hardware Lab</option>
                            <option value="auditorium" className="bg-[#0e121e] text-white">Auditorium</option>
                            <option value="seminar" className="bg-[#0e121e] text-white">Seminar Room</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-white/70 mb-1 font-medium">Seating Capacity</label>
                          <input
                            type="number"
                            value={formData.capacity || 60}
                            onChange={(e) =>
                              setFormData({ ...formData, capacity: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-white/70 mb-1 font-medium">Department</label>
                        <select
                          value={formData.department_id || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, department_id: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                        >
                          {departments.map((d) => (
                            <option key={d.id} value={d.id} className="bg-[#0e121e] text-white">
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={!!formData.has_projector}
                            onChange={(e) =>
                              setFormData({ ...formData, has_projector: e.target.checked })
                            }
                            className="rounded border-white/20 text-[#74C947] accent-[#74C947]"
                          />
                          <span className="text-xs text-white font-medium">
                            Venue equipped with Projector / Display System
                          </span>
                        </label>
                      </div>
                    </>
                  )}

                  {/* SUBJECTS FORM */}
                  {activeTab === 'subjects' && (
                    <>
                      <div>
                        <label className="block text-white/70 mb-1 font-medium">Subject Title</label>
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-white/70 mb-1 font-medium">Course Code</label>
                          <input
                            type="text"
                            value={formData.code || ''}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-white/70 mb-1 font-medium">Elective Group (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Elective-I"
                            value={formData.elective_group || ''}
                            onChange={(e) => setFormData({ ...formData, elective_group: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-white/70 mb-1 font-medium">Hours/Week</label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={formData.hours_per_week ?? formData.weekly_hours ?? 4}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                hours_per_week: Number(e.target.value),
                                weekly_hours: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-white/70 mb-1 font-medium">Credits</label>
                          <input
                            type="number"
                            value={formData.credits || 3}
                            onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                          />
                        </div>
                        <div className="flex flex-col justify-end">
                          <label className="flex items-center gap-2 cursor-pointer pb-2">
                            <input
                              type="checkbox"
                              checked={!!formData.requires_lab}
                              onChange={(e) =>
                                setFormData({ ...formData, requires_lab: e.target.checked })
                              }
                              className="rounded border-white/20 text-[#74C947] accent-[#74C947]"
                            />
                            <span className="text-white font-medium">Requires Lab</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-white/70 mb-1 font-medium">Department</label>
                        <select
                          value={formData.department_id || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, department_id: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                        >
                          {departments.map((d) => (
                            <option key={d.id} value={d.id} className="bg-[#0e121e] text-white">
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* SECTIONS FORM */}
                  {activeTab === 'sections' && (
                    <>
                      <div>
                        <label className="block text-white/70 mb-1 font-medium">Section Identifier</label>
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="A"
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-white/70 mb-1 font-medium">Semester</label>
                          <select
                            value={formData.semester_id || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, semester_id: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                          >
                            {semesters.map((s) => (
                              <option key={s.id} value={s.id} className="bg-[#0e121e] text-white">
                                Semester {s.number} ({s.academic_year})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-white/70 mb-1 font-medium">Student Strength</label>
                          <input
                            type="number"
                            value={formData.student_strength || 60}
                            onChange={(e) =>
                              setFormData({ ...formData, student_strength: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* SEMESTERS FORM */}
                  {activeTab === 'semesters' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-white/70 mb-1 font-medium">Semester Number (1-12)</label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={formData.number || 1}
                            onChange={(e) =>
                              setFormData({ ...formData, number: Number(e.target.value) })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-white/70 mb-1 font-medium">Academic Year</label>
                          <input
                            type="text"
                            value={formData.academic_year || '2026-2027'}
                            onChange={(e) =>
                              setFormData({ ...formData, academic_year: e.target.value })
                            }
                            placeholder="2026-2027"
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-white/70 mb-1 font-medium">Department</label>
                        <select
                          value={formData.department_id || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, department_id: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                        >
                          {departments.map((d) => (
                            <option key={d.id} value={d.id} className="bg-[#0e121e] text-white">
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <ReplyButton
                    type="button"
                    size="sm"
                    onClick={() => setModalOpen(false)}
                    className="bg-white/[0.06] hover:bg-white/[0.12]"
                  >
                    Cancel
                  </ReplyButton>
                  <CTAButton size="sm" onClick={handleSave} disabled={busy}>
                    <span>{busy ? 'Saving…' : 'Save Changes'}</span>
                  </CTAButton>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
