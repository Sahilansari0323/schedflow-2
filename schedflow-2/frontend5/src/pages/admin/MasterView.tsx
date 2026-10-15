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
import api, { getErrorMessage } from '../../api';
import GlassCard from '../../components/GlassCard';

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

  const loadMasterView = async () => {
    setLoadingMaster(true);
    try {
      const params: any = { day: selectedDay };
      if (selectedDeptId) params.department_id = selectedDeptId;
      const res = await api.get('/views/master', { params });
      setMasterData(res.data);
    } catch (err: any) {
      console.error('Failed to fetch master view', err);
    } finally {
      setLoadingMaster(false);
    }
  };

  const loadRoomView = async () => {
    if (!selectedRoomId) return;
    setLoadingRoom(true);
    try {
      const res = await api.get(`/views/room/${selectedRoomId}`);
      setRoomData(res.data);
    } catch (err: any) {
      console.error('Failed to fetch room view', err);
    } finally {
      setLoadingRoom(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'master') loadMasterView();
    else loadRoomView();
  }, [viewMode, selectedDay, selectedDeptId, selectedRoomId]);

  return (
    <div className="space-y-8 select-none pb-12">
      {/* Header */}
      <GlassCard variant="compact" className="!p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#00d2ff]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SYNCHRONIZED MULTI-DIMENSIONAL SCHEDULES</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Cross-Section & Venue Views</h1>
            <p className="text-xs text-white/60">
              Inspect all sections side-by-side on any day, or explore complete weekly schedules for individual physical venues.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/60 border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('master')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === 'master'
                  ? 'bg-[#00d2ff] text-black shadow-md'
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
                  ? 'bg-[#00d2ff] text-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Room Weekly Plan</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* -------------------------------------------------------------------- */}
      {/* 1. MASTER DAY VIEW (All Sections Side-by-Side)                        */}
      {/* -------------------------------------------------------------------- */}
      {viewMode === 'master' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl liquid-glass border border-white/10">
            {/* Day Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {DAYS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setSelectedDay(d.value)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 ${
                    selectedDay === d.value
                      ? 'bg-gradient-to-r from-[#00d2ff] to-[#3D81E3] text-black font-semibold shadow-md'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-3">
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-medium focus:outline-none focus:border-[#00d2ff]"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id} className="bg-neutral-900">
                    {dept.code} — {dept.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={loadMasterView}
                className="p-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Refresh Grid"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMaster ? 'animate-spin text-[#00d2ff]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Master Grid Table */}
          {loadingMaster && !masterData ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#00d2ff] border-t-transparent animate-spin" />
              <div className="text-xs text-white/50 font-mono">Synchronizing cross-section master timetable...</div>
            </div>
          ) : masterData?.sections?.length === 0 ? (
            <GlassCard variant="compact" className="text-center py-20 text-white/50 text-xs">
              No sections registered for this department.
            </GlassCard>
          ) : (
            <GlassCard variant="compact" className="!p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.04]">
                      <th className="py-3.5 px-4 font-mono text-white/70 uppercase text-xs sticky left-0 bg-neutral-950 z-20 min-w-[140px]">
                        Section Division
                      </th>
                      {PERIODS.map((p) => (
                        <th key={p} className="py-3 px-3 font-mono text-white/50 uppercase text-center min-w-[150px]">
                          Period {p}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {masterData?.sections?.map((sec: any) => (
                      <tr key={sec.id} className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4 font-semibold text-white sticky left-0 bg-neutral-950/90 backdrop-blur-md z-10 border-r border-white/10">
                          <div>Section {sec.name}</div>
                          <div className="text-[10px] text-[#00d2ff] font-mono font-normal">Semester {sec.semester}</div>
                        </td>

                        {PERIODS.map((p) => {
                          const slot = sec.periods?.[String(p)] || sec.periods?.[p];
                          return (
                            <td key={p} className="p-2 align-top">
                              {slot ? (
                                <div className="p-2.5 rounded-2xl liquid-glass border border-white/15 bg-black/40 space-y-1 hover:border-[#00d2ff]/60 transition-all">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono text-[10px] text-[#00d2ff] font-bold">
                                      {slot.code}
                                    </span>
                                    {slot.elective && (
                                      <span className="text-[8px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                                        ELECTIVE
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-white/90 truncate flex items-center gap-1 font-medium">
                                    <User className="w-3 h-3 text-white/40 shrink-0" />
                                    <span className="truncate">{slot.teacher}</span>
                                  </div>
                                  <div className="text-[10px] text-cyan-300 flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                                    <span className="truncate">{slot.room}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-full min-h-[64px] rounded-2xl border border-dashed border-white/5 flex items-center justify-center text-white/20 text-[10px]">
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
            </GlassCard>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 2. ROOM WEEKLY PLAN VIEW                                             */}
      {/* -------------------------------------------------------------------- */}
      {viewMode === 'room' && (
        <div className="space-y-6">
          {/* Room Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl liquid-glass border border-white/10">
            <div className="flex items-center gap-3">
              <DoorOpen className="w-5 h-5 text-[#00d2ff]" />
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="px-4 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-semibold focus:outline-none focus:border-[#00d2ff]"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id} className="bg-neutral-900">
                    {r.name} ({r.room_type}, capacity {r.capacity})
                  </option>
                ))}
              </select>
            </div>

            {roomData?.room && (
              <div className="flex items-center gap-3 text-xs text-white/60 font-mono">
                <span>Capacity: <b className="text-white">{roomData.room.capacity}</b></span>
                <span>•</span>
                <span className="uppercase text-[#00d2ff]">{roomData.room.room_type}</span>
              </div>
            )}
          </div>

          {/* Room Weekly Grid */}
          {loadingRoom && !roomData ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#00d2ff] border-t-transparent animate-spin" />
              <div className="text-xs text-white/50 font-mono">Loading venue weekly schedule...</div>
            </div>
          ) : (
            <GlassCard variant="compact" className="!p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.04]">
                      <th className="py-3.5 px-4 font-mono text-white/70 uppercase text-xs sticky left-0 bg-neutral-950 z-20 min-w-[120px]">
                        Day of Week
                      </th>
                      {PERIODS.map((p) => (
                        <th key={p} className="py-3 px-3 font-mono text-white/50 uppercase text-center min-w-[140px]">
                          Period {p}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day) => {
                      const dayEntries = roomData?.entries?.filter((e: any) => e.day_of_week === day.value) || [];
                      return (
                        <tr key={day.value} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                          <td className="py-4 px-4 font-semibold text-white whitespace-nowrap sticky left-0 bg-neutral-950/90 backdrop-blur-md z-10 border-r border-white/10">
                            {day.label}
                          </td>
                          {PERIODS.map((period) => {
                            const entry = dayEntries.find((e: any) => e.period === period);
                            return (
                              <td key={period} className="p-2 align-top">
                                {entry ? (
                                  <div className="p-2.5 rounded-2xl liquid-glass border border-white/15 bg-black/40 space-y-1 hover:border-[#00d2ff]/60 transition-all">
                                    <div className="font-mono text-[10px] text-[#00d2ff] font-bold">
                                      {entry.subject_code}
                                    </div>
                                    <div className="text-[11px] text-white/90 truncate flex items-center gap-1 font-medium">
                                      <User className="w-3 h-3 text-white/40 shrink-0" />
                                      <span className="truncate">{entry.teacher_name}</span>
                                    </div>
                                    <div className="text-[10px] text-cyan-300">
                                      Sec {entry.section_name}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-full min-h-[64px] rounded-2xl border border-dashed border-white/5 flex items-center justify-center text-white/20 text-[10px]">
                                    Free
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
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
