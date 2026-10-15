import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  CalendarDays,
  DoorOpen,
  Layers,
  Filter,
  RefreshCw,
  Sparkles,
  MapPin,
  User,
  Clock,
  ChevronRight,
} from 'lucide-react';
import api, { getErrorMessage } from '../../shared/api';
import GlassCard from '../../shared/components/GlassCard';
import AppleButton, { CTAButton, ReplyButton } from '../../shared/components/AppleButton';

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function MasterView() {
  const [viewMode, setViewMode] = useState<'master' | 'room'>('master');

  // Master Day View State
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [masterData, setMasterData] = useState<any | null>(null);
  const [loadingMaster, setLoadingMaster] = useState(false);

  // Room View State
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [roomData, setRoomData] = useState<any | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(false);

  useEffect(() => {
    api.get('/departments').then((r) => setDepartments(r.data || [])).catch(() => {});
    api.get('/rooms').then((r) => {
      const rmList = r.data || [];
      setRooms(rmList);
      if (rmList.length > 0) setSelectedRoomId(String(rmList[0].id));
    }).catch(() => {});
  }, []);

  const loadMasterView = async (isBackground = false) => {
    if (!isBackground) setLoadingMaster(true);
    try {
      const params: any = { day: Number(selectedDay) };
      if (selectedDeptId) params.department_id = Number(selectedDeptId);
      const res = await api.get('/views/master', { params });
      setMasterData(res.data);
    } catch (err: any) {
      console.error('Failed to fetch master view', err);
    } finally {
      if (!isBackground) setLoadingMaster(false);
    }
  };

  const loadRoomView = async (isBackground = false) => {
    if (!selectedRoomId) return;
    if (!isBackground) setLoadingRoom(true);
    try {
      const res = await api.get(`/views/room/${Number(selectedRoomId)}`);
      setRoomData(res.data);
    } catch (err: any) {
      console.error('Failed to fetch room view', err);
    } finally {
      if (!isBackground) setLoadingRoom(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'master') {
      loadMasterView();
      const interval = setInterval(() => loadMasterView(true), 15000);
      return () => clearInterval(interval);
    } else {
      loadRoomView();
      const interval = setInterval(() => loadRoomView(true), 15000);
      return () => clearInterval(interval);
    }
  }, [viewMode, selectedDay, selectedDeptId, selectedRoomId]);

  return (
    <div className="space-y-8 select-none pb-12">
      {/* Header */}
      <GlassCard variant="compact" className="!p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#74C947] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SYNCHRONIZED MULTI-DIMENSIONAL SCHEDULES</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Cross-Section & Venue Views</h1>
            <p className="text-xs text-white/60">
              Inspect all sections side-by-side on any day, or explore complete weekly schedules for individual physical venues.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.05] border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('master')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === 'master'
                  ? 'bg-[#74C947] text-[#081a05] shadow-[0_0_15px_rgba(116,201,71,0.3)] font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Master Grid by Day</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('room')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === 'room'
                  ? 'bg-[#74C947] text-[#081a05] shadow-[0_0_15px_rgba(116,201,71,0.3)] font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Room Weekly Plan</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Mode 1: Master Grid across Sections for a Day */}
      {viewMode === 'master' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <GlassCard variant="compact" className="!p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-white/60 flex items-center gap-1.5 mr-2">
                <Clock className="w-3.5 h-3.5 text-[#74C947]" />
                Day:
              </span>
              {DAYS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setSelectedDay(d.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    selectedDay === d.value
                      ? 'bg-[#74C947] text-[#081a05] font-bold shadow-[0_0_12px_rgba(116,201,71,0.3)]'
                      : 'bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-[#74C947]"
              >
                <option value="" className="bg-[#0e121e] text-white">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#0e121e] text-white">
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>

              <ReplyButton
                type="button"
                size="sm"
                onClick={() => loadMasterView()}
                disabled={loadingMaster}
                className="!text-xs !py-1.5 !px-3 bg-white/[0.06] hover:bg-white/[0.12]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMaster ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </ReplyButton>
            </div>
          </GlassCard>

          {/* Master Table */}
          {loadingMaster ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#74C947] border-t-transparent animate-spin" />
              <div className="text-xs text-white/50 font-mono">Synthesizing master schedule...</div>
            </div>
          ) : !masterData || !masterData.sections || masterData.sections.length === 0 ? (
            <GlassCard variant="compact" className="text-center py-16">
              <div className="text-sm text-white/60">No section timetables found for this day.</div>
            </GlassCard>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-[rgba(16,20,32,0.65)] backdrop-blur-3xl shadow-[0_14px_40px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="p-4 font-semibold text-white/70 w-48 sticky left-0 bg-[#0c101c] backdrop-blur z-10 border-r border-white/10">
                        Section / Stream
                      </th>
                      {PERIODS.map((p) => (
                        <th key={p} className="p-3 font-semibold text-white/70 text-center border-r border-white/10 min-w-[140px]">
                          Period {p}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {masterData.sections.map((sec: any) => (
                      <tr key={sec.section_id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-medium text-white sticky left-0 bg-[#0c101c] backdrop-blur z-10 border-r border-white/10">
                          <div className="font-semibold text-xs text-white">{sec.section_name}</div>
                          <div className="text-[10px] text-white/40 font-mono">
                            {sec.department_code} • Sem {sec.semester_number}
                          </div>
                        </td>

                        {PERIODS.map((period) => {
                          const slotEntries = sec.slots ? sec.slots[String(period)] : null;
                          return (
                            <td key={period} className="p-2 border-r border-white/10 align-top">
                              {slotEntries && slotEntries.length > 0 ? (
                                <div className="space-y-1">
                                  {slotEntries.map((e: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className={`p-2 rounded-xl border text-[11px] leading-tight space-y-0.5 ${
                                        e.is_lab
                                          ? 'bg-purple-500/20 border-purple-500/30 text-purple-200'
                                          : 'bg-white/[0.05] border-white/10 text-white shadow-xs'
                                      }`}
                                    >
                                      <div className="font-semibold truncate text-[#74C947]">{e.subject_code}</div>
                                      <div className="text-[10px] text-white/70 truncate flex items-center gap-1">
                                        <User className="w-2.5 h-2.5 text-[#74C947] shrink-0" />
                                        <span>{e.teacher_name}</span>
                                      </div>
                                      <div className="text-[10px] text-white/40 truncate flex items-center gap-1 font-mono">
                                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                                        <span>{e.room_name}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="h-14 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-[10px] text-white/20 font-mono">
                                  Free
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Room Weekly Schedule */}
      {viewMode === 'room' && (
        <div className="space-y-6">
          {/* Room Selector */}
          <GlassCard variant="compact" className="!p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <DoorOpen className="w-4 h-4 text-[#74C947]" />
              <span className="text-xs font-semibold text-white">Select Physical Venue:</span>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-[#74C947]"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#0e121e] text-white">
                    {r.name} ({r.room_type || 'Lecture Hall'}) - Cap: {r.capacity}
                  </option>
                ))}
              </select>
            </div>

            {roomData?.room && (
              <div className="flex items-center gap-2 text-xs font-mono text-white/60">
                <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10">
                  Capacity: {roomData.room.capacity}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10">
                  Type: {roomData.room.room_type}
                </span>
              </div>
            )}
          </GlassCard>

          {/* Room Weekly Grid */}
          {loadingRoom ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#74C947] border-t-transparent animate-spin" />
              <div className="text-xs text-white/50 font-mono">Loading venue schedule...</div>
            </div>
          ) : !roomData ? (
            <GlassCard variant="compact" className="text-center py-16">
              <div className="text-sm text-white/60">No schedule data for this room.</div>
            </GlassCard>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-[rgba(16,20,32,0.65)] backdrop-blur-3xl shadow-[0_14px_40px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="p-4 font-semibold text-white/70 w-36 sticky left-0 bg-[#0c101c] backdrop-blur z-10 border-r border-white/10">
                        Day
                      </th>
                      {PERIODS.map((p) => (
                        <th key={p} className="p-3 font-semibold text-white/70 text-center border-r border-white/10 min-w-[130px]">
                          Period {p}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {DAYS.map((d) => {
                      const daySchedule = roomData.schedule ? roomData.schedule[String(d.value)] : null;
                      return (
                        <tr key={d.value} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 font-semibold text-white sticky left-0 bg-[#0c101c] backdrop-blur z-10 border-r border-white/10">
                            {d.label}
                          </td>

                          {PERIODS.map((period) => {
                            const entry = daySchedule ? daySchedule[String(period)] : null;
                            return (
                              <td key={period} className="p-2 border-r border-white/10 align-top">
                                {entry ? (
                                  <div className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-[11px] shadow-xs space-y-0.5">
                                    <div className="font-semibold text-[#74C947] truncate">{entry.subject_code}</div>
                                    <div className="text-[10px] text-white/70 font-medium truncate">
                                      Sec {entry.section_name} (Sem {entry.semester_number})
                                    </div>
                                    <div className="text-[10px] text-white/40 truncate flex items-center gap-1">
                                      <User className="w-2.5 h-2.5 text-[#74C947] shrink-0" />
                                      <span>{entry.teacher_name}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-14 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-[10px] text-white/20 font-mono">
                                    Vacant
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
