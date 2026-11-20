import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Plus, Trash2 } from 'lucide-react';
import type { WorkSchedule } from '../../types/hrm';
import { saveWorkSchedule } from '../../services/hrmService';
import { formatDateDDMMMYYYY } from '../../utils/formatters';

interface Props {
  schedule: WorkSchedule | null;
}

const ALL_DAYS = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
] as const;

export const WorkScheduleView: React.FC<Props> = ({ schedule }) => {
  const [name, setName] = useState(schedule?.name ?? 'Jam Kerja Reguler Kantor');
  const [workDays, setWorkDays] = useState<string[]>(
    schedule?.workDays ?? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
  );
  const [clockInTime, setClockInTime] = useState(schedule?.clockInTime ?? '08:00');
  const [clockOutTime, setClockOutTime] = useState(schedule?.clockOutTime ?? '17:00');
  const [tolerance, setTolerance] = useState(schedule?.lateToleranceMinutes ?? 15);
  const [holidays, setHolidays] = useState<string[]>(schedule?.holidays ?? []);
  const [newHoliday, setNewHoliday] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (schedule) {
      setName(schedule.name);
      setWorkDays(schedule.workDays);
      setClockInTime(schedule.clockInTime);
      setClockOutTime(schedule.clockOutTime);
      setTolerance(schedule.lateToleranceMinutes);
      setHolidays(schedule.holidays || []);
    }
  }, [schedule]);

  const toggleDay = (day: string) => {
    setWorkDays((prev) => {
      if (prev.includes(day)) {
        return prev.length > 1 ? prev.filter((d) => d !== day) : prev;
      }
      return [...prev, day];
    });
  };

  const handleAddHoliday = () => {
    if (!newHoliday) return;
    if (!holidays.includes(newHoliday)) {
      setHolidays((prev) => [...prev, newHoliday].sort());
    }
    setNewHoliday('');
  };

  const handleRemoveHoliday = (dateISO: string) => {
    setHolidays((prev) => prev.filter((d) => d !== dateISO));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(false);
    try {
      await saveWorkSchedule(
        {
          id: schedule?.id ?? 'sched_reguler',
          name,
          workDays,
          clockInTime,
          clockOutTime,
          lateToleranceMinutes: tolerance,
          holidays,
          isActive: true,
        },
        !schedule
      );
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="grid lg:grid-cols-12 gap-6 items-start">
      {/* Left: Working Days & Shift Hours */}
      <section className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Pengaturan Hari & Jam Kerja
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Menjadi acuan otomatis status Hadir atau Terlambat pada Mobile PWA
            </p>
          </div>
          <Clock className="w-5 h-5 text-emerald-700" />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Nama Kebijakan Jadwal Kerja
          </label>
          <input
            type="text"
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">
            Hari Kerja Aktif
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => {
              const active = workDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`min-h-[40px] px-3.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#062C22] border-[#062C22] text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Jam Masuk (Clock-In)
            </label>
            <input
              type="time"
              required
              value={clockInTime}
              onChange={(e) => setClockInTime(e.target.value)}
              className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Jam Pulang (Clock-Out)
            </label>
            <input
              type="time"
              required
              value={clockOutTime}
              onChange={(e) => setClockOutTime(e.target.value)}
              className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Toleransi Telat (Menit)
            </label>
            <input
              type="number"
              min={0}
              max={180}
              required
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm font-mono"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between gap-4">
          {savedNotice ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              Jadwal kerja tersimpan & tersinkronisasi ke seluruh perangkat
            </span>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={saving}
            className="min-h-[44px] px-5 rounded-xl bg-[#062C22] hover:bg-[#09382B] text-white text-sm font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan Jam Kerja'}
          </button>
        </div>
      </section>

      {/* Right: Holiday Calendar */}
      <section className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Daftar Hari Libur
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Format tanggal DD-MMM-YYYY
            </p>
          </div>
          <Calendar className="w-5 h-5 text-emerald-700" />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={newHoliday}
            onChange={(e) => setNewHoliday(e.target.value)}
            className="flex-1 min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm font-mono"
          />
          <button
            type="button"
            onClick={handleAddHoliday}
            className="min-h-[40px] px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </div>

        {holidays.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">
            Belum ada hari libur ditambahkan.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {holidays.map((dateISO) => (
              <div
                key={dateISO}
                className="px-4 py-2.5 flex items-center justify-between bg-white"
              >
                <span className="font-mono text-sm font-medium text-slate-900">
                  {formatDateDDMMMYYYY(dateISO)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveHoliday(dateISO)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                  aria-label={`Hapus hari libur ${formatDateDDMMMYYYY(dateISO)}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </form>
  );
};
