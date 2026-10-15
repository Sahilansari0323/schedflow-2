import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Users,
  MapPin,
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
} from 'lucide-react';
import api, { getErrorMessage } from '../../api';
import GlassCard from '../../components/GlassCard';

type TabType = 'teachers' | 'rooms' | 'subjects' | 'sections' | 'semesters';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

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
    } else if (activeTab === 'subjects') {
      api.get('/subjects', { params }).then((r) => setSubjects(r.data)).catch(() => {});
    } else if (activeTab === 'sections') {
      api.get('/sections').then((r) => setSections(r.data)).catch(() => {});
      api.get('/semesters').then((r) => setSemesters(r.data)).catch(() => {});
    } else if (activeTab === 'semesters') {
      api.get('/semesters').then((r) => setSemesters(r.data)).catch(() => {});
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, filterDept]);

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
        };
        if (editingItem) await api.put(`/rooms/${editingItem.id}`, payload);
        else await api.post('/rooms', payload);
      } else if (activeTab === 'subjects') {
        const payload = {
          name: formData.name,
          code: formData.code,
          department_id: Number(formData.department_id),
          hours_per_week: Number(formData.hours_per_week || formData.weekly_hours || 4),
          requires_lab: Boolean(formData.requires_lab),
          credits: Number(formData.credits || 3),
        };
        if (editingItem) await api.put(`/subjects/${editingItem.id}`, payload);
        else await api.post('/subjects', payload);
      } else if (activeTab === 'sections') {
        const payload = {
          name: formData.name,
          semester_id: Number(formData.semester_id),
          student_strength: Number(formData.student_strength || 60),
        };
        if (editingItem) await api.put(`/sections/${editingItem.id}`, payload);
        else await api.post('/sections', payload);
      } else if (activeTab === 'semesters') {
        const payload = {
          number: Number(formData.number || 1),
          academic_year: String(formData.academic_year || '2026-2027'),
          department_id: Number(formData.department_id || departments[0]?.id),
        };
        if (editingItem) await api.put(`/semesters/${editingItem.id}`, payload);
        else await api.post('/semesters', payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Operation failed.'));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Layers className="w-3 h-3 text-cyan-300" />
              Structural Schema
            </span>
            <span className="text-xs text-white/40 tracking-wider uppercase font-mono">
              Academic Topology
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Topology Entities
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Configure the foundational campus building blocks: faculty rosters, physical lecture
            halls, labs, course catalogs, student cohorts, and academic calendars.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:brightness-110 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add {activeTab.slice(0, -1)}
        </button>
      </div>

      {/* Tabs bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
          {[
            { key: 'teachers', label: 'Faculty Rosters', icon: Users },
            { key: 'rooms', label: 'Venues & Labs', icon: MapPin },
            { key: 'subjects', label: 'Course Catalog', icon: BookOpen },
            { key: 'sections', label: 'Cohort Sections', icon: Grid },
            { key: 'semesters', label: 'Semesters', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as TabType);
                  setSearchQuery('');
                }}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition ${
                  active ? 'text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="topology-tab-pill"
                    className="absolute inset-0 rounded-xl bg-blue-500/20 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 relative z-10 ${active ? 'text-blue-400' : ''}`} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeTab}…`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500 w-44 sm:w-56"
            />
          </div>

          {activeTab !== 'sections' && (
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white/80 focus:outline-none focus:border-blue-500 [&>option]:bg-slate-900"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <GlassCard className="overflow-hidden">
        {/* Teachers Tab */}
        {activeTab === 'teachers' && (
          <div className="divide-y divide-white/5">
            <div className="p-4 bg-white/[0.02] grid grid-cols-12 text-xs font-mono uppercase text-white/40 font-semibold">
              <div className="col-span-4">Faculty Member</div>
              <div className="col-span-3">Department & Code</div>
              <div className="col-span-3">Weekly Load</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {teachers
              .filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((t) => {
                const wl = workload[t.id];
                const currentLoad = wl?.current_load ?? 0;
                const maxLoad = t.max_weekly_load || 20;
                const loadRatio = Math.min(100, Math.round((currentLoad / maxLoad) * 100));

                return (
                  <div
                    key={t.id}
                    className="p-4 grid grid-cols-12 items-center hover:bg-white/[0.02] transition"
                  >
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-300 uppercase">
                        {t.name.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{t.name}</div>
                        <div className="text-xs text-white/50">{t.email || 'No email registered'}</div>
                      </div>
                    </div>

                    <div className="col-span-3">
                      <div className="text-xs font-medium text-white/90">
                        {departments.find((d) => d.id === t.department_id)?.name || 'General Dept'}
                      </div>
                      <div className="text-[11px] text-white/40 font-mono">
                        {t.employee_code || 'EMP-UNSET'} • {t.designation || 'Lecturer'}
                      </div>
                    </div>

                    <div className="col-span-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-white/70">
                          {currentLoad} / {maxLoad} hrs
                        </span>
                        <span
                          className={`font-mono text-[11px] ${
                            loadRatio > 90
                              ? 'text-rose-400'
                              : loadRatio > 70
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {loadRatio}%
                        </span>
                      </div>
                      <div className="w-36 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            loadRatio > 90
                              ? 'bg-rose-500'
                              : loadRatio > 70
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${loadRatio}%` }}
                        />
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition"
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
            <div className="p-4 bg-white/[0.02] grid grid-cols-12 text-xs font-mono uppercase text-white/40 font-semibold">
              <div className="col-span-4">Venue Identifier</div>
              <div className="col-span-3">Type Specification</div>
              <div className="col-span-3">Capacity</div>
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
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{r.name}</div>
                      <div className="text-xs text-white/50">
                        {departments.find((d) => d.id === r.department_id)?.name || 'General Hall'}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-white/80 uppercase font-mono tracking-wider text-[10px]">
                      {r.room_type}
                    </span>
                  </div>

                  <div className="col-span-3 text-xs text-white/80 font-mono">
                    {r.capacity} seats
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(r)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Subjects Tab */}
        {activeTab === 'subjects' && (
          <div className="divide-y divide-white/5">
            <div className="p-4 bg-white/[0.02] grid grid-cols-12 text-xs font-mono uppercase text-white/40 font-semibold">
              <div className="col-span-4">Course Title & Code</div>
              <div className="col-span-3">Department</div>
              <div className="col-span-3">Weekly Hours & Lab</div>
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
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-300 font-mono text-xs font-bold">
                      {s.code.slice(0, 3)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{s.name}</div>
                      <div className="text-xs text-blue-400 font-mono">{s.code}</div>
                    </div>
                  </div>

                  <div className="col-span-3 text-xs text-white/70">
                    {departments.find((d) => d.id === s.department_id)?.name || 'General'}
                  </div>

                  <div className="col-span-3 flex items-center gap-2">
                    <span className="text-xs text-white/80">
                      {s.hours_per_week || s.weekly_hours || 4} hrs/wk
                    </span>
                    {s.requires_lab && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        Lab Req
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition"
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
            <div className="p-4 bg-white/[0.02] grid grid-cols-12 text-xs font-mono uppercase text-white/40 font-semibold">
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
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold text-xs">
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
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sec)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition"
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
            <div className="p-4 bg-white/[0.02] grid grid-cols-12 text-xs font-mono uppercase text-white/40 font-semibold">
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
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300">
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
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sem)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </GlassCard>

      {/* Unified Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-2xl bg-slate-900/90 border border-white/20 p-6 shadow-2xl backdrop-blur-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {editingItem ? 'Edit' : 'Add'} {activeTab.slice(0, -1).toUpperCase()}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-white/40 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-4 text-xs">
                {/* TEACHERS FORM */}
                {activeTab === 'teachers' && (
                  <>
                    <div>
                      <label className="block text-white/70 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Dr. Alan Turing"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-white/70 mb-1">Email</label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                          placeholder="turing@schedflow.edu"
                        />
                      </div>
                      <div>
                        <label className="block text-white/70 mb-1">Employee Code</label>
                        <input
                          type="text"
                          value={formData.employee_code || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, employee_code: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                          placeholder="CS-101"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-white/70 mb-1">Department</label>
                        <select
                          value={formData.department_id || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, department_id: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 [&>option]:bg-slate-900"
                        >
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-white/70 mb-1">Max Weekly Hours</label>
                        <input
                          type="number"
                          value={formData.max_weekly_load || 20}
                          onChange={(e) =>
                            setFormData({ ...formData, max_weekly_load: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Unavailable slots interactive grid */}
                    <div>
                      <label className="block text-white/70 mb-1.5">
                        Unavailable Slots Matrix (Click to block)
                      </label>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 overflow-x-auto">
                        <div className="grid grid-cols-8 gap-1 text-[10px] text-center font-mono">
                          <div className="text-white/40">Slot</div>
                          {PERIODS.map((p) => (
                            <div key={p} className="text-white/60">
                              P{p}
                            </div>
                          ))}
                          {DAYS.map((d, dIdx) => (
                            <>
                              <div key={d} className="font-semibold text-white/80 py-1">
                                {d}
                              </div>
                              {PERIODS.map((p) => {
                                const code = `${dIdx + 1}-${p}`;
                                const blocked = (formData.unavailable_slots || []).includes(code);
                                return (
                                  <button
                                    type="button"
                                    key={code}
                                    onClick={() => toggleSlot(dIdx + 1, p)}
                                    className={`h-6 rounded transition ${
                                      blocked
                                        ? 'bg-rose-500/40 text-rose-200 border border-rose-500/50'
                                        : 'bg-white/5 hover:bg-white/15 text-white/40'
                                    }`}
                                  >
                                    {blocked ? '✕' : ''}
                                  </button>
                                );
                              })}
                            </>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ROOMS FORM */}
                {activeTab === 'rooms' && (
                  <>
                    <div>
                      <label className="block text-white/70 mb-1">Room Name / Room Code</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="LH-301"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-white/70 mb-1">Room Type</label>
                        <select
                          value={formData.room_type || 'classroom'}
                          onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 [&>option]:bg-slate-900"
                        >
                          <option value="classroom">Classroom</option>
                          <option value="lab">Computer / Hardware Lab</option>
                          <option value="lecture_hall">Auditorium / Hall</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-white/70 mb-1">Capacity</label>
                        <input
                          type="number"
                          value={formData.capacity || 60}
                          onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-white/70 mb-1">Department</label>
                      <select
                        value={formData.department_id || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, department_id: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 [&>option]:bg-slate-900"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* SUBJECTS FORM */}
                {activeTab === 'subjects' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-white/70 mb-1">Subject Name</label>
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                          placeholder="Database Management Systems"
                        />
                      </div>
                      <div>
                        <label className="block text-white/70 mb-1">Course Code</label>
                        <input
                          type="text"
                          value={formData.code || ''}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                          placeholder="CS301"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-white/70 mb-1">Weekly Hours</label>
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
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-white/70 mb-1">Credits</label>
                        <input
                          type="number"
                          value={formData.credits || 3}
                          onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
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
                            className="rounded bg-white/10 border-white/20 text-blue-500"
                          />
                          <span className="text-white/80">Requires Lab</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-white/70 mb-1">Department</label>
                      <select
                        value={formData.department_id || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, department_id: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 [&>option]:bg-slate-900"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
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
                      <label className="block text-white/70 mb-1">Section Identifier</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="A"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-white/70 mb-1">Semester</label>
                        <select
                          value={formData.semester_id || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, semester_id: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 [&>option]:bg-slate-900"
                        >
                          {semesters.map((s) => (
                            <option key={s.id} value={s.id}>
                              Semester {s.number} ({s.academic_year})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-white/70 mb-1">Student Strength</label>
                        <input
                          type="number"
                          value={formData.student_strength || 60}
                          onChange={(e) =>
                            setFormData({ ...formData, student_strength: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
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
                        <label className="block text-white/70 mb-1">Semester Number (1-12)</label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={formData.number || 1}
                          onChange={(e) =>
                            setFormData({ ...formData, number: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-white/70 mb-1">Academic Year</label>
                        <input
                          type="text"
                          value={formData.academic_year || '2026-2027'}
                          onChange={(e) =>
                            setFormData({ ...formData, academic_year: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                          placeholder="2026-2027"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-white/70 mb-1">Department</label>
                      <select
                        value={formData.department_id || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, department_id: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 [&>option]:bg-slate-900"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Modal footer buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={busy || !formData.name}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:brightness-110 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {busy ? 'Saving…' : 'Save Entity'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
