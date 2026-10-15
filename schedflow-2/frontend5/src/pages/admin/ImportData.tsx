import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Users,
  BookOpen,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';
import api, { getErrorMessage } from '../../api';
import GlassCard from '../../components/GlassCard';

export default function ImportData() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedSemId, setSelectedSemId] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'teachers' | 'subjects'>('teachers');
  const [rawText, setRawText] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    teachers_created: number;
    subjects_created: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    api.get('/departments').then((r) => {
      const d = r.data || [];
      setDepartments(d);
      if (d.length > 0) setSelectedDeptId(String(d[0].id));
    }).catch(() => {});

    api.get('/semesters').then((r) => {
      const s = r.data || [];
      setSemesters(s);
      if (s.length > 0) setSelectedSemId(String(s[0].id));
    }).catch(() => {});
  }, []);

  const deptSemesters = semesters.filter(
    (s) => String(s.department_id) === String(selectedDeptId)
  );

  useEffect(() => {
    if (deptSemesters.length > 0 && !deptSemesters.some((s) => String(s.id) === String(selectedSemId))) {
      setSelectedSemId(String(deptSemesters[0].id));
    }
  }, [selectedDeptId, semesters]);

  const teacherTemplate = `Dr. Robert Vance, robert.vance@college.edu, CSE101, Professor, 20
Prof. Sarah Connor, sarah.c@college.edu, CSE102, Assistant Professor, 24
Dr. Alan Turing, alan.turing@college.edu, CSE103, Associate Professor, 18`;

  const subjectTemplate = `CS401, Database Management Systems, 4, no
CS402, Computer Networks, 3, no
CS403, Database Management Systems Lab, 2, lab
CS404, Operating Systems Lab, 2, yes`;

  const loadSample = () => {
    setRawText(activeTab === 'teachers' ? teacherTemplate : subjectTemplate);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId || !selectedSemId || !rawText.trim()) return;

    setSubmitting(true);
    setResult(null);

    try {
      const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
      const payload: any = {
        department_id: Number(selectedDeptId),
        semester_id: Number(selectedSemId),
        teachers: [],
        subjects: [],
      };

      if (activeTab === 'teachers') {
        payload.teachers = lines.map((line) => {
          const parts = line.split(',').map((p) => p.trim());
          return {
            name: parts[0] || '',
            email: parts[1] || '',
            employee_code: parts[2] || '',
            designation: parts[3] || 'Assistant Professor',
            max_weekly_load: parts[4] || 24,
          };
        });
      } else {
        payload.subjects = lines.map((line) => {
          const parts = line.split(',').map((p) => p.trim());
          return {
            code: parts[0] || '',
            name: parts[1] || '',
            hours_per_week: parts[2] || 3,
            requires_lab: parts[3] || 'no',
          };
        });
      }

      const res = await api.post('/import', payload);
      setResult(res.data);
    } catch (err: any) {
      alert(getErrorMessage(err, 'Bulk import failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 select-none pb-12">
      {/* Header */}
      <GlassCard variant="compact" className="!p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#00d2ff]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RAPID INSTITUTIONAL ONBOARDING</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Bulk Data Importer</h1>
            <p className="text-xs text-white/60">
              Batch create faculty rosters and course catalogs via comma-separated entries with live duplicate verification.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form: 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard variant="compact" className="!p-6 space-y-5">
            {/* Target Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-white/10">
              <div className="space-y-1 text-xs">
                <label className="text-white/70 font-medium">Target Academic Department</label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white font-medium focus:outline-none focus:border-[#00d2ff]"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id} className="bg-neutral-900">
                      {d.code} — {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-white/70 font-medium">Target Term / Semester</label>
                <select
                  value={selectedSemId}
                  onChange={(e) => setSelectedSemId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white font-medium focus:outline-none focus:border-[#00d2ff]"
                >
                  {deptSemesters.map((s) => (
                    <option key={s.id} value={s.id} className="bg-neutral-900">
                      Semester {s.number} ({s.academic_year})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Entity Tab Switcher */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/60 border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('teachers');
                    setRawText('');
                    setResult(null);
                  }}
                  className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'teachers'
                      ? 'bg-[#00d2ff] text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Import Teachers</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('subjects');
                    setRawText('');
                    setResult(null);
                  }}
                  className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'subjects'
                      ? 'bg-[#00d2ff] text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Import Subjects</span>
                </button>
              </div>

              <button
                type="button"
                onClick={loadSample}
                className="text-xs text-[#00d2ff] hover:underline cursor-pointer flex items-center gap-1 font-mono"
              >
                <span>Load Sample Data</span>
              </button>
            </div>

            {/* Input Area */}
            <form onSubmit={handleImport} className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-white/50 text-[11px] font-mono">
                  <span>
                    Format: {activeTab === 'teachers' ? 'Name, Email, EmpCode, Designation, WeeklyCap' : 'Code, Name, HoursPerWeek, RequiresLab'}
                  </span>
                  <span>1 record per line</span>
                </div>
                <textarea
                  rows={9}
                  required
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={activeTab === 'teachers' ? teacherTemplate : subjectTemplate}
                  className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#00d2ff] resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-white/40">
                  Duplicates and format issues will be reported in the feedback panel without blocking valid rows.
                </div>
                <button
                  type="submit"
                  disabled={submitting || !rawText.trim()}
                  className="px-6 py-2.5 rounded-xl bg-[#00d2ff] text-black font-semibold hover:bg-[#3D81E3] hover:text-white disabled:opacity-40 transition-all cursor-pointer shadow-[0_0_24px_rgba(0,210,255,0.35)] flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{submitting ? 'Processing Batch...' : `Batch Import ${activeTab === 'teachers' ? 'Faculty' : 'Courses'}`}</span>
                </button>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* Right Column: Instructions & Results */}
        <div className="space-y-6">
          {/* Result Card */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard
                variant="compact"
                className={`!p-6 space-y-4 ${
                  result.errors.length === 0
                    ? '!border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                    : '!border-amber-500/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      result.errors.length === 0
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {result.errors.length === 0 ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">Import Batch Complete</h3>
                    <div className="text-[11px] text-white/50">
                      {result.teachers_created > 0 && `${result.teachers_created} faculty created. `}
                      {result.subjects_created > 0 && `${result.subjects_created} courses created.`}
                    </div>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                    <div className="font-mono text-amber-300 text-[11px]">
                      {result.errors.length} skipped row(s):
                    </div>
                    <ul className="space-y-1 text-white/70 max-h-40 overflow-y-auto font-mono text-[10px]">
                      {result.errors.map((err, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-rose-300">
                          <span>•</span>
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {/* Guide Card */}
          <GlassCard variant="compact" className="!p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Info className="w-4 h-4 text-[#00d2ff]" />
              <span>Import Formatting Rules</span>
            </div>

            <div className="space-y-3 text-white/70 leading-relaxed">
              <p>
                <b>Teachers CSV:</b> Name is required. If weekly cap is omitted, the institutional default of 24 periods will be applied automatically.
              </p>
              <p>
                <b>Subjects CSV:</b> Subject codes (e.g. <code>CS301</code>) must be unique within the selected department. Lab flag accepts <code>lab</code>, <code>yes</code>, or <code>true</code>.
              </p>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-[10px] text-cyan-300">
                Tip: You can export data from Excel as CSV and paste directly into the box.
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
