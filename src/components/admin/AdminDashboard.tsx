import React, { useState } from 'react';
import {
  Banknote,
  CalendarClock,
  CalendarPlus,
  Check,
  CheckCircle2,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import type {
  Attendance,
  Employee,
  LeaveRequest,
  Payroll,
  Position,
  WorkSchedule,
} from '../../types/hrm';
import { updateLeaveRequestStatus } from '../../services/hrmService';
import {
  formatDateDDMMMYYYY,
  formatRupiah,
  getCurrentMonthISO,
  getTodayISO,
} from '../../utils/formatters';
import { LiveClock } from '../LiveClock';
import { AttendanceManagementView } from './AttendanceManagementView';
import { EmployeesPositionsView } from './EmployeesPositionsView';
import { PayrollManagementView } from './PayrollManagementView';
import { WorkScheduleView } from './WorkScheduleView';

type AdminSection =
  | 'overview'
  | 'employees'
  | 'schedule'
  | 'attendance'
  | 'leaves'
  | 'payroll';

interface Props {
  adminEmail: string;
  employees: Employee[];
  positions: Position[];
  schedules: WorkSchedule[];
  attendances: Attendance[];
  leaveRequests: LeaveRequest[];
  payrolls: Payroll[];
  onSwitchToPWA: () => void;
  onSignOut: () => void;
}

export const AdminDashboard: React.FC<Props> = ({
  adminEmail,
  employees,
  positions,
  schedules,
  attendances,
  leaveRequests,
  payrolls,
  onSwitchToPWA,
  onSignOut,
}) => {
  const [section, setSection] = useState<AdminSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeSchedule = schedules.find((s) => s.isActive) ?? schedules[0] ?? null;
  const todayISO = getTodayISO();
  const currentMonth = getCurrentMonthISO();

  const activeEmployees = employees.filter((e) => e.status === 'Aktif');
  const todayAttendances = attendances.filter((a) => a.date === todayISO);
  const todayPresent = todayAttendances.filter(
    (a) => a.status === 'Hadir' || a.status === 'Terlambat'
  ).length;
  const todayLate = todayAttendances.filter(
    (a) => a.status === 'Terlambat'
  ).length;
  const pendingLeavesCount = leaveRequests.filter(
    (l) => l.status === 'Menunggu'
  ).length;
  const monthPayrollEstimate = attendances
    .filter((a) => a.date.startsWith(currentMonth))
    .reduce((sum, a) => sum + (a.earnedAmount || 0), 0);

  const navItems: {
    id: AdminSection;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'employees', label: 'Karyawan & Jabatan', icon: Users },
    { id: 'schedule', label: 'Hari & Jam Kerja', icon: CalendarClock },
    { id: 'attendance', label: 'Data Kehadiran', icon: ClipboardCheck },
    {
      id: 'leaves',
      label: 'Persetujuan Izin',
      icon: CalendarPlus,
      badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined,
    },
    { id: 'payroll', label: 'Payroll Harian', icon: Banknote },
  ];

  const currentLabel =
    navItems.find((n) => n.id === section)?.label ?? 'Ringkasan';

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Desktop Executive Dark Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-slate-900 border-r border-slate-800 text-slate-200 shrink-0">
        <div className="h-16 px-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">
              Portal Admin
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              NusaHR Backoffice
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`w-full min-h-[44px] px-3.5 rounded-xl text-sm font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  active
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge !== undefined && (
                  <span
                    className={`font-mono text-xs font-bold ${
                      active ? 'text-slate-950' : 'text-amber-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2.5">
          <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-semibold text-emerald-300">
              Akses Penuh Admin Manajemen
            </span>
          </div>
          <button
            type="button"
            onClick={onSwitchToPWA}
            className="w-full min-h-[40px] px-3.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-100 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Buka Mode HP Karyawan</span>
          </button>
          <div className="px-2 pt-1 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 truncate">
              {adminEmail}
            </span>
            <button
              type="button"
              onClick={onSignOut}
              className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
              aria-label="Keluar"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 w-64 bg-slate-900 text-slate-200 h-full flex flex-col border-r border-slate-800">
            <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
              <span className="text-sm font-bold text-white">
                Portal Admin NusaHR
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full min-h-[44px] px-3.5 rounded-xl text-sm font-medium flex items-center gap-3 ${
                      active
                        ? 'bg-emerald-500 text-slate-950 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSwitchToPWA();
                }}
                className="w-full min-h-[40px] px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mode HP Karyawan</span>
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="w-full min-h-[40px] px-3 rounded-xl text-xs font-semibold text-rose-400 hover:bg-slate-800"
              >
                Keluar Akun
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 px-4 lg:px-8 bg-white border-b border-slate-200 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-900 text-emerald-400 hidden sm:inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <h1 className="font-bold text-slate-900 truncate">
                {currentLabel}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <LiveClock
              showDate
              suffix="WIB"
              className="hidden sm:inline text-xs font-medium text-slate-700"
            />
            <button
              type="button"
              onClick={onSwitchToPWA}
              className="min-h-[38px] px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mode HP Karyawan</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {section === 'overview' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white border border-slate-200 p-5">
                  <p className="text-xs font-medium text-slate-500">
                    Karyawan Aktif
                  </p>
                  <p className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums">
                    {activeEmployees.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {positions.length} master jabatan terdaftar
                  </p>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 p-5">
                  <p className="text-xs font-medium text-slate-500">
                    Hadir Hari Ini ({formatDateDDMMMYYYY(todayISO)})
                  </p>
                  <p className="mt-2 font-mono text-3xl font-bold text-emerald-700 tabular-nums">
                    {todayPresent}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {todayLate} karyawan terlambat
                  </p>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 p-5">
                  <p className="text-xs font-medium text-slate-500">
                    Jam Kerja Aktif
                  </p>
                  <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    {activeSchedule?.clockInTime ?? '08:00'} –{' '}
                    {activeSchedule?.clockOutTime ?? '17:00'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 truncate">
                    {activeSchedule?.workDays.join(', ') ?? 'Senin–Jumat'}
                  </p>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 p-5">
                  <p className="text-xs font-medium text-slate-500">
                    Akumulasi Payroll Bulan Ini
                  </p>
                  <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    {formatRupiah(monthPayrollEstimate)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Model perhitungan harian
                  </p>
                </div>
              </div>

              <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Presensi Terbaru (Real-Time Multi-Device)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Otomatis diperbarui saat pengguna melakukan Clock-In / Clock-Out di Mobile HP
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSection('attendance')}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    Kelola Semua Kehadiran →
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {attendances.slice(0, 6).map((att) => (
                    <div
                      key={att.id}
                      className="px-6 py-3.5 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            att.status === 'Terlambat'
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {att.employeeName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDateDDMMMYYYY(att.date)} · Masuk{' '}
                            <span className="font-mono">{att.clockInTime}</span> ·
                            Pulang{' '}
                            <span className="font-mono">
                              {att.clockOutTime || 'Belum'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                          {formatRupiah(att.earnedAmount)}
                        </p>
                        <p className="text-[11px] text-slate-500">{att.status}</p>
                      </div>
                    </div>
                  ))}
                  {attendances.length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-500">
                      Belum ada aktivitas presensi tercatat.
                    </p>
                  )}
                </div>
              </section>
            </div>
          )}

          {section === 'employees' && (
            <EmployeesPositionsView employees={employees} positions={positions} />
          )}

          {section === 'schedule' && (
            <WorkScheduleView schedule={activeSchedule} />
          )}

          {section === 'attendance' && (
            <AttendanceManagementView
              attendances={attendances}
              employees={employees}
            />
          )}

          {section === 'leaves' && (
            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900">
                  Persetujuan Pengajuan Izin / Sakit / Cuti
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Terkirim langsung dari Mobile HP Karyawan secara real-time
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Karyawan</th>
                      <th className="py-3 px-4">Jenis</th>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Alasan</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {leaveRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-500">
                          Belum ada pengajuan izin atau cuti dari karyawan.
                        </td>
                      </tr>
                    ) : (
                      leaveRequests.map((lr) => (
                        <tr key={lr.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {lr.employeeName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {lr.leaveType}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                            {formatDateDDMMMYYYY(lr.startDate)} –{' '}
                            {formatDateDDMMMYYYY(lr.endDate)}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                            {lr.reason}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`text-xs font-semibold ${
                                lr.status === 'Disetujui'
                                  ? 'text-emerald-700'
                                  : lr.status === 'Ditolak'
                                  ? 'text-rose-600'
                                  : 'text-amber-700'
                              }`}
                            >
                              {lr.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {lr.status === 'Menunggu' ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateLeaveRequestStatus(lr.id, 'Disetujui')
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Setujui</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateLeaveRequestStatus(lr.id, 'Ditolak')
                                  }
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                                >
                                  Tolak
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Selesai
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'payroll' && (
            <PayrollManagementView
              employees={employees}
              attendances={attendances}
              payrolls={payrolls}
            />
          )}
        </main>
      </div>
    </div>
  );
};
