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
import api, { getErrorMessage } from '../../shared/api';
import GlassCard from '../../shared/components/GlassCard';
import AppleButton, { CTAButton, ReplyButton } from '../../shared/components/AppleButton';

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
            requires_lab: ['lab', 'yes', 'true', '1'].includes((parts[3] || '').toLowerCase()),
            elective_group: parts[4] || undefined,
          };
        });
      }

      const res = await api.post('/import', payload);
      setResult(res.data);
      if ((res.data.teachers_created > 0 || res.data.subjects_created > 0) && (!res.data.errors || res.data.errors.length === 0)) {
        setRawText('');
      }
    } catch (err: any) {
      alert(getErrorMessage(err, 'Bulk ingestion failed. Please verify syntax.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 select-none pb-12">
      {/* Header */}
      <GlassCard variant="compact" className="!p-8 relative overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#74C947] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>INSTITUTIONAL BATCH INGESTION ENGINE</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Bulk Data Import</h1>
          <p className="text-xs text-white/60">
            Quickly onboard faculty directories and curriculum syllabi by pasting CSV records directly into the engine.
          </p>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ingestion Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard variant="compact" className="!p-6 sm:!p-8 space-y-6">
            {/* Scope Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-white/10">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">Target Department</label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/[0.06] border border-white/15 text-xs text-white focus:outline-none focus:border-[#74C947]"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id} className="bg-[#0e121e] text-white">
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">Target Semester / Cycle</label>
                <select
                  value={selectedSemId}
                  onChange={(e) => setSelectedSemId(e.target.value)}
                  disabled={deptSemesters.length === 0}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/[0.06] border border-white/15 text-xs text-white focus:outline-none focus:border-[#74C947] disabled:opacity-50"
                >
                  {deptSemesters.length === 0 ? (
                    <option className="bg-[#0e121e] text-white">No semesters in department</option>
                  ) : (
                    deptSemesters.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#0e121e] text-white">
                        Semester {s.number} ({s.academic_year})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Type Tabs */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/[0.05] border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('teachers');
                    setResult(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'teachers'
                      ? 'bg-[#74C947] text-[#081a05] shadow-[0_0_12px_rgba(116,201,71,0.3)]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Faculty Directory</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('subjects');
                    setResult(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'subjects'
                      ? 'bg-[#74C947] text-[#081a05] shadow-[0_0_12px_rgba(116,201,71,0.3)]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Curriculum Subjects</span>
                </button>
              </div>

              <ReplyButton
                type="button"
                size="sm"
                onClick={loadSample}
                className="!text-xs !py-1.5 !px-3 bg-white/[0.06]"
              >
                Load Sample CSV
              </ReplyButton>
            </div>

            {/* CSV Input Area */}
            <form onSubmit={handleImport} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-white/60 block font-medium">
                  {activeTab === 'teachers' ? 'Faculty CSV Records (One per line)' : 'Subject CSV Records (One per line)'}
                </label>
                <textarea
                  rows={9}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={activeTab === 'teachers' ? teacherTemplate : subjectTemplate}
                  className="w-full p-4 rounded-2xl bg-white/[0.04] border border-white/10 font-mono text-xs text-white focus:outline-none focus:border-[#74C947] leading-relaxed resize-y"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-white/40 font-mono">
                  {rawText.trim().split('\n').filter(Boolean).length} record(s) queued
                </div>

                <CTAButton
                  type="submit"
                  size="md"
                  disabled={submitting || !rawText.trim() || !selectedSemId}
                >
                  <Upload className="w-4 h-4" />
                  <span>{submitting ? 'Ingesting Data…' : 'Execute Batch Import'}</span>
                </CTAButton>
              </div>
            </form>
          </GlassCard>

          {/* Outcome Feedback Card */}
          {result && (
            <GlassCard variant="compact" className="!p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <CheckCircle2 className="w-4 h-4 text-[#74C947]" />
                <h4 className="font-bold text-sm text-white">Import Ingestion Report</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="text-2xl font-bold text-[#74C947]">
                    {result.teachers_created || result.subjects_created}
                  </div>
                  <div className="text-xs text-white/60">
                    {activeTab === 'teachers' ? 'Faculty profiles added' : 'Curriculum units mapped'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="text-2xl font-bold text-rose-400">
                    {result.errors?.length || 0}
                  </div>
                  <div className="text-xs text-white/60">Row errors or skipped lines</div>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2 text-xs text-rose-300">
                  <div className="font-semibold">Skipped / Failed Records:</div>
                  <ul className="list-disc list-inside space-y-1 font-mono text-[11px]">
                    {result.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </GlassCard>
          )}
        </div>

        {/* Guidance Column (1 col) */}
        <div className="space-y-6">
          <GlassCard variant="compact" className="!p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#74C947] font-bold">
              <Info className="w-3.5 h-3.5" />
              <span>CSV SCHEMA GUIDANCE</span>
            </div>

            <h3 className="font-bold text-base text-white">Expected CSV Format</h3>

            {activeTab === 'teachers' ? (
              <div className="space-y-3 text-xs text-white/70 leading-relaxed">
                <p>Ensure each line follows the comma-separated format:</p>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 font-mono text-[11px] text-[#74C947]">
                  Name, Email, EmployeeCode, Designation, MaxWeeklyLoad
                </div>
                <ul className="space-y-1 list-disc list-inside text-white/60">
                  <li><strong>MaxWeeklyLoad:</strong> defaults to 20 periods if left blank.</li>
                  <li><strong>EmployeeCode:</strong> must be unique across the institution.</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-white/70 leading-relaxed">
                <p>Ensure each line follows the comma-separated format:</p>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 font-mono text-[11px] text-[#74C947]">
                  Code, Subject Name, WeeklyHours, RequiresLab, ElectiveGroup
                </div>
                <ul className="space-y-1 list-disc list-inside text-white/60">
                  <li><strong>RequiresLab:</strong> specify "lab" or "yes" to reserve computer labs.</li>
                  <li><strong>ElectiveGroup:</strong> optional group tag (e.g. Elective-I).</li>
                </ul>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
