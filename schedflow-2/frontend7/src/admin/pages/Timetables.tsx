import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Plus,
  Copy,
  Trash2,
  Calendar,
  Send,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import api, { getErrorMessage } from '../../shared/api';
import GlassCard from '../../shared/components/GlassCard';
import AppleButton from '../../shared/components/AppleButton';

interface Timetable {
  id: number;
  academic_year: string;
  semester_id: number;
  section_id: number;
  status: string;
  version: number;
  created_at?: string;
  semester?: { number: number; academic_year: string; department?: { name: string; code: string } };
  section?: { name: string };
}

interface MasterStructure {
  departments: Array<{ id: number; name: string; code: string }>;
  semesters: Array<{ id: number; number: number; academic_year: string; department_id: number }>;
  sections: Array<{ id: number; name: string; semester_id: number }>;
}

export default function Timetables() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Master structure for creation
  const [structure, setStructure] = useState<MasterStructure>({
    departments: [],
    semesters: [],
    sections: [],
  });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    department_id: '',
    semester_id: '',
    section_id: '',
    academic_year: '2026-2027',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ttRes, deptRes, semRes, secRes] = await Promise.all([
        api.get('/timetables'),
        api.get('/departments'),
        api.get('/semesters'),
        api.get('/sections'),
      ]);
      setTimetables(ttRes.data);
      setStructure({
        departments: deptRes.data,
        semesters: semRes.data,
        sections: secRes.data,
      });
      if (deptRes.data.length > 0) {
        const firstDept = deptRes.data[0];
        const sems = semRes.data.filter((s: any) => s.department_id === firstDept.id);
        const firstSem = sems[0];
        const secs = secRes.data.filter((sc: any) => sc.semester_id === firstSem?.id);
        setCreateForm({
          department_id: String(firstDept.id),
          semester_id: firstSem ? String(firstSem.id) : '',
          section_id: secs[0] ? String(secs[0].id) : '',
          academic_year: '2026-2027',
        });
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to load timetables.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      try {
        const res = await api.get('/timetables');
        setTimetables(res.data);
      } catch (e) {}
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/timetables', {
        semester_id: Number(createForm.semester_id),
        section_id: Number(createForm.section_id),
        academic_year: createForm.academic_year,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to create timetable.'));
    }
  };

  const handleClone = async (id: number) => {
    if (!confirm('Clone this timetable into a new revision?')) return;
    try {
      await api.post(`/timetables/${id}/clone`);
      loadData();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to clone timetable.'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this timetable? This action is irreversible.'))
      return;
    try {
      await api.delete(`/timetables/${id}`);
      loadData();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to delete timetable.'));
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await api.post(`/timetables/${id}/publish`);
      loadData();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to publish timetable.'));
    }
  };

  const availableSemesters = structure.semesters.filter(
    (s) => String(s.department_id) === createForm.department_id
  );
  const availableSections = structure.sections.filter(
    (s) => String(s.semester_id) === createForm.semester_id
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[rgba(16,20,32,0.65)] border border-white/10 backdrop-blur-3xl shadow-[0_14px_40px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-[#74C947] uppercase font-bold">
              Schedule Registry
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Academic Timetables</h2>
          <p className="text-xs text-white/60 mt-1 max-w-xl">
            Versioned institutional timetable blueprints across departments, semesters, and divisions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AppleButton variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Create Blueprint</span>
          </AppleButton>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs text-center font-medium">
          {error}
        </div>
      )}

      {/* Timetables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {timetables.map((tt) => (
          <GlassCard key={tt.id} variant="pro" className="!p-6 space-y-5" hoverEffect>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-mono text-xs text-[#74C947] font-bold">
                ID #{tt.id} &middot; v{tt.version}
              </span>
              <span
                className={`text-[9px] font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                  tt.status === 'published'
                    ? 'bg-[#74C947]/20 text-[#74C947] border border-[#74C947]/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {tt.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-lg text-white">
                Semester {tt.semester?.number || tt.semester_id} &middot; Section {tt.section?.name || tt.section_id}
              </h3>
              <div className="text-xs text-white/60">
                Academic Year: <span className="text-white font-mono font-semibold">{tt.academic_year}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <Link to={`/admin/builder?id=${tt.id}`}>
                <AppleButton variant="primary" size="sm">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Open Builder</span>
                </AppleButton>
              </Link>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleClone(tt.id)}
                  title="Clone Matrix"
                  className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {tt.status !== 'published' && (
                  <button
                    onClick={() => handlePublish(tt.id)}
                    title="Publish Blueprint"
                    className="p-2 rounded-xl text-[#74C947] hover:text-[#74C947] hover:bg-[#74C947]/10 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(tt.id)}
                  title="Delete Blueprint"
                  className="p-2 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full"
            >
              <GlassCard variant="pro" className="!p-6 space-y-5 bg-[#0e121e]/95 border-white/15">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#74C947]" />
                    <h3 className="font-bold text-white text-sm">Create New Blueprint</h3>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  {/* Department */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-white/60 mb-1.5 font-medium">
                      Department
                    </label>
                    <select
                      value={createForm.department_id}
                      onChange={(e) => {
                        const deptId = e.target.value;
                        const sems = structure.semesters.filter((s) => String(s.department_id) === deptId);
                        const firstSem = sems[0];
                        const secs = structure.sections.filter((sc) => sc.semester_id === firstSem?.id);
                        setCreateForm({
                          ...createForm,
                          department_id: deptId,
                          semester_id: firstSem ? String(firstSem.id) : '',
                          section_id: secs[0] ? String(secs[0].id) : '',
                        });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                    >
                      {structure.departments.map((d) => (
                        <option key={d.id} value={d.id} className="bg-[#0e121e] text-white">
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Semester */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-white/60 mb-1.5 font-medium">
                      Semester
                    </label>
                    <select
                      value={createForm.semester_id}
                      onChange={(e) => {
                        const semId = e.target.value;
                        const secs = structure.sections.filter((sc) => String(sc.semester_id) === semId);
                        setCreateForm({
                          ...createForm,
                          semester_id: semId,
                          section_id: secs[0] ? String(secs[0].id) : '',
                        });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                    >
                      {availableSemesters.map((s) => (
                        <option key={s.id} value={s.id} className="bg-[#0e121e] text-white">
                          Semester {s.number} ({s.academic_year})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Section */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-white/60 mb-1.5 font-medium">
                      Section / Cohort
                    </label>
                    <select
                      value={createForm.section_id}
                      onChange={(e) => setCreateForm({ ...createForm, section_id: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                    >
                      {availableSections.map((sec) => (
                        <option key={sec.id} value={sec.id} className="bg-[#0e121e] text-white">
                          Section {sec.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Academic Year */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-white/60 mb-1.5 font-medium">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      value={createForm.academic_year}
                      onChange={(e) => setCreateForm({ ...createForm, academic_year: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white transition font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <AppleButton variant="primary" size="sm">
                      <span>Create Matrix</span>
                    </AppleButton>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
