import React, { useState } from 'react';
import {
  ArrowRight,
  Banknote,
  Calendar,
  CalendarPlus,
  Camera,
  CheckCircle2,
  Clock,
  FileText,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import type {
  Attendance,
  Employee,
  LeaveRequest,
  LeaveType,
  WorkSchedule,
} from '../../types/hrm';
import { submitLeaveRequest } from '../../services/hrmService';
import {
  formatDateDDMMMYYYY,
  formatDuration,
  formatMonthYearMMMYYYY,
  formatRupiah,
  getCurrentMonthISO,
  getTodayISO,
} from '../../utils/formatters';
import { AvatarWithFallback } from '../AvatarWithFallback';
import { LiveClock } from '../LiveClock';

interface Props {
  employee: Employee;
  actorUid: string;
  attendances: Attendance[];
  allTodayAttendances: Attendance[];
  leaveRequests: LeaveRequest[];
  schedule: WorkSchedule | null;
  onGoToPresensi: () => void;
  onGoToLaporan: () => void;
  onGoToSalary: () => void;
}

export const BerandaTab: React.FC<Props> = ({
  employee,
  actorUid,
  attendances,
  allTodayAttendances,
  leaveRequests,
  schedule,
  onGoToPresensi,
  onGoToLaporan,
  onGoToSalary,
}) => {
  const [leaveSheetOpen, setLeaveSheetOpen] = useState(false);
  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('Izin');
  const [startDate, setStartDate] = useState(getTodayISO());
  const [endDate, setEndDate] = useState(getTodayISO());
  const [reason, setReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const todayISO = getTodayISO();
  const currentMonthISO = getCurrentMonthISO();
  const todayAttendance = attendances.find((a) => a.date === todayISO);

  const monthAttendances = attendances.filter((a) =>
    a.date.startsWith(currentMonthISO)
  );
  const presentCount = monthAttendances.filter(
    (a) => a.status === 'Hadir' || a.status === 'Terlambat'
  ).length;
  const monthEarnings = monthAttendances.reduce(
    (sum, a) => sum + (a.earnedAmount || 0),
    0
  );
  const totalMinutesMonth = monthAttendances.reduce(
    (sum, a) => sum + (a.workDurationMinutes || 0),
    0
  );

  const hasClockIn = Boolean(todayAttendance?.clockInTime);
  const hasClockOut = Boolean(todayAttendance?.clockOutTime);

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmittingLeave(true);
    try {
      await submitLeaveRequest({
        employee,
        ownerUid: actorUid,
        leaveType,
        startDate,
        endDate: endDate < startDate ? startDate : endDate,
        reason,
      });
      setReason('');
      setLeaveSheetOpen(false);
    } finally {
      setSubmittingLeave(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Premium Fintech Balance / Daily Wage Card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#062C22] via-[#09382B] to-[#0D4A39] p-5 text-white shadow-sm">
        {/* Real-time Digital Clock Bar */}
        <div className="mb-4 rounded-2xl bg-white/10 border border-white/10 px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-emerald-100">
            <Clock className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="font-medium">Waktu Real-Time</span>
          </div>
          <LiveClock
            showDate
            showSeconds
            suffix="WIB"
            className="text-xs font-bold text-white"
          />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-emerald-200/90 tracking-wide">
              Akumulasi Gaji · {formatMonthYearMMMYYYY(currentMonthISO)}
            </p>
            <p className="mt-1.5 font-mono text-3xl font-bold tracking-tight tabular-nums text-white">
              {formatRupiah(monthEarnings)}
            </p>
            <p className="mt-1 text-xs text-emerald-100/80 font-mono tabular-nums">
              {presentCount} hari masuk × {formatRupiah(employee.dailyRate)} / hari
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-emerald-300" />
          </div>
        </div>

        <div className="mt-4 pt-3.5 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-100/90">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-300" />
            <span>Shift</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">
              {schedule?.clockInTime ?? '08:00'}–{schedule?.clockOutTime ?? '17:00'}
            </span>
          </div>
          <span className="font-medium text-emerald-200">
            {!hasClockIn
              ? 'Belum Clock-In'
              : !hasClockOut
              ? `Masuk ${todayAttendance?.clockInTime}`
              : `Selesai ${todayAttendance?.clockInTime}–${todayAttendance?.clockOutTime}`}
          </span>
        </div>

        {/* Dominant Mobile CTA */}
        <div className="mt-4">
          {!hasClockIn ? (
            <button
              type="button"
              onClick={onGoToPresensi}
              className="w-full min-h-[48px] rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Clock-In Selfie Sekarang</span>
            </button>
          ) : !hasClockOut ? (
            <button
              type="button"
              onClick={onGoToPresensi}
              className="w-full min-h-[48px] rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Clock-Out Selfie Sekarang</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onGoToPresensi}
              className="w-full min-h-[48px] rounded-2xl bg-white/15 hover:bg-white/20 text-white font-medium text-sm flex items-center justify-center gap-2 border border-white/15 active:scale-[0.98] transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Presensi Hari Ini Lengkap</span>
            </button>
          )}
        </div>
      </section>

      {/* Fintech Mobile 4-Icon Quick Actions Bar */}
      <section className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={onGoToPresensi}
          className="rounded-2xl bg-white border border-slate-200 py-3 px-1 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 active:scale-[0.97] transition-all cursor-pointer min-h-[76px]"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-800">Selfie</span>
        </button>

        <button
          type="button"
          onClick={() => setLeaveSheetOpen(true)}
          className="rounded-2xl bg-white border border-slate-200 py-3 px-1 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 active:scale-[0.97] transition-all cursor-pointer min-h-[76px]"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <CalendarPlus className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-800">Izin / Cuti</span>
        </button>

        <button
          type="button"
          onClick={() => setScheduleSheetOpen(true)}
          className="rounded-2xl bg-white border border-slate-200 py-3 px-1 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 active:scale-[0.97] transition-all cursor-pointer min-h-[76px]"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-800">Jadwal</span>
        </button>

        <button
          type="button"
          onClick={onGoToSalary}
          className="rounded-2xl bg-white border border-slate-200 py-3 px-1 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 active:scale-[0.97] transition-all cursor-pointer min-h-[76px]"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Banknote className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-800">Slip Gaji</span>
        </button>
      </section>

      {/* Live Multi-Device Colleague Feed */}
      <section className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Rekan Hadir Hari Ini ({formatDateDDMMMYYYY(todayISO)})
            </h2>
          </div>
          <span className="font-mono text-xs font-semibold text-emerald-700 tabular-nums">
            {allTodayAttendances.length} online
          </span>
        </div>

        {allTodayAttendances.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            Jadilah yang pertama melakukan Clock-In selfie hari ini.
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {allTodayAttendances.map((att) => (
              <div
                key={att.id}
                className="shrink-0 w-24 rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-center space-y-1.5"
              >
                <div className="mx-auto w-10 h-10">
                  <AvatarWithFallback
                    src={att.clockInPhoto}
                    alt={att.employeeName}
                    sizeClass="w-10 h-10"
                  />
                </div>
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {att.employeeName.split(' ')[0]}
                </p>
                <p className="font-mono text-[10px] text-emerald-700 tabular-nums">
                  {att.clockInTime} · {att.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Fintech Quick Stats */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500">Tarif Harian</p>
          <p className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
            {formatRupiah(employee.dailyRate)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">Per hari masuk</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500">Total Jam Kerja</p>
          <p className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
            {formatDuration(totalMinutesMonth)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {presentCount} hari bulan ini
          </p>
        </div>
      </section>

      {/* My Leave Requests Status */}
      {leaveRequests.length > 0 && (
        <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>Pengajuan Izin & Cuti Saya</span>
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {leaveRequests.slice(0, 3).map((lr) => (
              <div
                key={lr.id}
                className="px-4 py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {lr.leaveType} · {formatDateDDMMMYYYY(lr.startDate)}
                  </p>
                  <p className="text-slate-500 truncate mt-0.5">{lr.reason}</p>
                </div>
                <span
                  className={`font-semibold shrink-0 ${
                    lr.status === 'Disetujui'
                      ? 'text-emerald-700'
                      : lr.status === 'Ditolak'
                      ? 'text-rose-600'
                      : 'text-amber-700'
                  }`}
                >
                  {lr.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Attendance Activity */}
      <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Riwayat Presensi Saya
            </h2>
          </div>
          <button
            type="button"
            onClick={onGoToLaporan}
            className="min-h-[36px] px-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {attendances.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Clock className="w-7 h-7 text-slate-300 mx-auto" />
            <p className="mt-2 text-xs font-medium text-slate-700">
              Belum ada catatan presensi
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {attendances.slice(0, 4).map((item) => {
              const isLate = item.status === 'Terlambat';
              const isAbsent = item.status === 'Alpa' || item.status === 'Izin';
              return (
                <div
                  key={item.id}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                      <span>{formatDateDDMMMYYYY(item.date)}</span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span
                        className={
                          isAbsent
                            ? 'text-rose-600'
                            : isLate
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500 font-mono tabular-nums">
                      {item.clockInTime || '—'} – {item.clockOutTime || 'Belum'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                      +{formatRupiah(item.earnedAmount)}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono tabular-nums">
                      {formatDuration(item.workDurationMinutes)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom Sheet: Pengajuan Izin / Sakit / Cuti */}
      {leaveSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Ajukan Izin / Sakit / Cuti
              </h3>
              <button
                type="button"
                onClick={() => setLeaveSheetOpen(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(['Izin', 'Sakit', 'Cuti'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLeaveType(t)}
                    className={`min-h-[40px] rounded-xl text-xs font-semibold border cursor-pointer ${
                      leaveType === t
                        ? 'bg-[#062C22] border-[#062C22] text-white'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mulai ({formatDateDDMMMYYYY(startDate)})
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Sampai ({formatDateDDMMMYYYY(endDate)})
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Alasan / Keterangan
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={3}
                  maxLength={250}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tuliskan keterangan izin atau cuti Anda..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submittingLeave}
                className="w-full min-h-[46px] rounded-2xl bg-[#062C22] hover:bg-[#09382B] text-white font-semibold text-sm cursor-pointer"
              >
                {submittingLeave ? 'Mengirim...' : 'Kirim Pengajuan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Sheet: Jadwal Kerja & Hari Libur */}
      {scheduleSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Jadwal Kerja & Hari Libur
              </h3>
              <button
                type="button"
                onClick={() => setScheduleSheetOpen(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
              <p className="font-semibold text-slate-900 text-sm">
                {schedule?.name ?? 'Jam Kerja Reguler Kantor'}
              </p>
              <p className="text-slate-600">
                Hari Kerja: <strong>{schedule?.workDays.join(', ') ?? 'Senin–Jumat'}</strong>
              </p>
              <p className="text-slate-600 font-mono">
                Jam Kerja: {schedule?.clockInTime ?? '08:00'} – {schedule?.clockOutTime ?? '17:00'} WIB
              </p>
              <p className="text-slate-600">
                Toleransi Keterlambatan: {schedule?.lateToleranceMinutes ?? 15} menit
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">
                Daftar Hari Libur Terjadwal
              </p>
              {schedule?.holidays && schedule.holidays.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {schedule.holidays.map((h) => (
                    <span
                      key={h}
                      className="font-mono text-xs px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800"
                    >
                      {formatDateDDMMMYYYY(h)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Tidak ada hari libur terdekat.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
