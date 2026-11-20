import React, { useState } from 'react';
import {
  BatteryFull,
  Camera,
  FileSpreadsheet,
  Home,
  LogOut,
  Monitor,
  ShieldCheck,
  Signal,
  Smartphone,
  User,
  Wifi,
} from 'lucide-react';
import type {
  Attendance,
  Employee,
  EmployeePrivateContact,
  LeaveRequest,
  Payroll,
  WorkSchedule,
} from '../../types/hrm';
import { formatDateDDMMMYYYY, getTodayISO } from '../../utils/formatters';
import { AvatarWithFallback } from '../AvatarWithFallback';
import { LiveClock } from '../LiveClock';
import { PWAInstallButton } from '../PWAInstallButton';
import { BerandaTab } from './BerandaTab';
import { LaporanTab } from './LaporanTab';
import { PresensiTab } from './PresensiTab';
import { ProfilTab } from './ProfilTab';

type PWATab = 'beranda' | 'presensi' | 'laporan' | 'profil';

interface Props {
  employee: Employee;
  privateContact: EmployeePrivateContact | null;
  userEmail: string;
  actorUid: string;
  isAdmin: boolean;
  attendances: Attendance[];
  leaveRequests: LeaveRequest[];
  payrolls: Payroll[];
  schedule: WorkSchedule | null;
  onSwitchToAdmin: () => void;
  onSignOut: () => void;
}

export const EmployeePWA: React.FC<Props> = ({
  employee,
  privateContact,
  userEmail,
  actorUid,
  isAdmin,
  attendances,
  leaveRequests,
  payrolls,
  schedule,
  onSwitchToAdmin,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<PWATab>('beranda');
  const [profilSubTab, setProfilSubTab] = useState<'biodata' | 'gaji'>('biodata');
  const [desktopPhoneFrame, setDesktopPhoneFrame] = useState<boolean>(true);

  const todayISO = getTodayISO();
  const myAttendances = attendances.filter((a) => a.employeeId === employee.id);
  const allTodayAttendances = attendances.filter((a) => a.date === todayISO);
  const myLeaveRequests = leaveRequests.filter(
    (l) => l.employeeId === employee.id
  );
  const myPayrolls = payrolls.filter((p) => p.employeeId === employee.id);
  const todayAttendance = myAttendances.find((a) => a.date === todayISO);

  const navItems: {
    id: PWATab;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'presensi', label: 'Presensi', icon: Camera },
    { id: 'laporan', label: 'Laporan', icon: FileSpreadsheet },
    { id: 'profil', label: 'Profil', icon: User },
  ];

  const handleOpenSalary = () => {
    setProfilSubTab('gaji');
    setActiveTab('profil');
  };

  const renderTabBody = () => (
    <>
      {/* Native Mobile App Header inside Viewport */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setActiveTab('profil')}
            className="shrink-0 rounded-full ring-2 ring-emerald-700/15 cursor-pointer"
            title="Buka Profil"
          >
            <AvatarWithFallback
              src={employee.avatarUrl}
              alt={employee.fullName}
              sizeClass="w-10 h-10"
            />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500">
              {employee.positionTitle}
            </p>
            <h1 className="text-base font-bold text-slate-900 truncate">
              {employee.fullName}
            </h1>
          </div>
        </div>
        <div className="text-right shrink-0">
          <LiveClock
            showSeconds
            suffix="WIB"
            className="block text-xs font-bold text-emerald-800"
          />
          <span className="block text-[11px] font-mono text-slate-500 tabular-nums">
            {formatDateDDMMMYYYY(todayISO)}
          </span>
        </div>
      </div>

      {activeTab === 'beranda' && (
        <BerandaTab
          employee={employee}
          actorUid={actorUid}
          attendances={myAttendances}
          allTodayAttendances={allTodayAttendances}
          leaveRequests={myLeaveRequests}
          schedule={schedule}
          onGoToPresensi={() => setActiveTab('presensi')}
          onGoToLaporan={() => setActiveTab('laporan')}
          onGoToSalary={handleOpenSalary}
        />
      )}

      {activeTab === 'presensi' && (
        <PresensiTab
          employee={employee}
          actorUid={actorUid}
          todayAttendance={todayAttendance}
          schedule={schedule}
        />
      )}

      {activeTab === 'laporan' && <LaporanTab attendances={myAttendances} />}

      {activeTab === 'profil' && (
        <ProfilTab
          employee={employee}
          privateContact={privateContact}
          userEmail={userEmail}
          actorUid={actorUid}
          attendances={myAttendances}
          payrolls={myPayrolls}
          initialSubTab={profilSubTab}
        />
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Compact Sticky Top Bar */}
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 ${
              isAdmin
                ? 'bg-slate-900 text-emerald-400'
                : 'bg-[#062C22] text-emerald-300'
            }`}
          >
            {isAdmin ? <ShieldCheck className="w-4 h-4" /> : 'N'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900 truncate">
                {isAdmin ? 'Mode HP · Akun Admin' : 'Portal Karyawan'}
              </p>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${
                  isAdmin
                    ? 'bg-slate-900 text-emerald-400'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {isAdmin ? 'Admin' : 'Karyawan'}
              </span>
            </div>
            <LiveClock
              showDate
              showSeconds
              suffix="WIB"
              className="hidden sm:block text-[11px] text-slate-500"
            />
          </div>
        </div>

        {/* Mode switcher: Tampilan HP vs Layar Penuh */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setDesktopPhoneFrame(true)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              desktopPhoneFrame
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden xs:inline sm:inline">Tampilan HP</span>
          </button>
          <button
            type="button"
            onClick={() => setDesktopPhoneFrame(false)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              !desktopPhoneFrame
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden xs:inline sm:inline">Layar Penuh</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <button
              type="button"
              onClick={onSwitchToAdmin}
              className="min-h-[38px] px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Backoffice Admin</span>
              <span className="sm:hidden">Admin</span>
            </button>
          )}
          <PWAInstallButton compact />
          <button
            type="button"
            onClick={onSignOut}
            className="min-h-[38px] px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 inline-flex items-center gap-1.5 cursor-pointer"
            aria-label="Keluar akun"
            title="Keluar"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Authentic Smartphone (HP) View + Live Multi-Device Activity Feed */}
      {desktopPhoneFrame ? (
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Authentic Smartphone Device Chassis */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative mx-auto w-full max-w-[392px]">
              {/* Left Hardware Buttons: Silent + Volume Up/Down */}
              <div
                aria-hidden="true"
                className="hidden sm:block absolute -left-[5px] top-24 w-[4px] h-7 rounded-l-md bg-slate-700 border-l border-slate-600"
              />
              <div
                aria-hidden="true"
                className="hidden sm:block absolute -left-[5px] top-36 w-[4px] h-12 rounded-l-md bg-slate-700 border-l border-slate-600"
              />
              <div
                aria-hidden="true"
                className="hidden sm:block absolute -left-[5px] top-52 w-[4px] h-12 rounded-l-md bg-slate-700 border-l border-slate-600"
              />
              {/* Right Hardware Button: Power */}
              <div
                aria-hidden="true"
                className="hidden sm:block absolute -right-[5px] top-40 w-[4px] h-16 rounded-r-md bg-slate-700 border-r border-slate-600"
              />

              {/* Outer Metallic Smartphone Bezel */}
              <div className="w-full h-[760px] max-h-[calc(100vh-100px)] min-h-[600px] rounded-[44px] sm:rounded-[52px] bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 p-[9px] sm:p-[11px] shadow-2xl ring-1 ring-slate-700/80 flex flex-col relative">
                {/* Inner OLED Screen */}
                <div className="flex-1 bg-slate-50 rounded-[35px] sm:rounded-[40px] overflow-hidden flex flex-col relative border border-slate-950">
                  {/* Authentic Smartphone Status Bar + Dynamic Island */}
                  <div className="h-11 px-5 sm:px-6 bg-white flex items-center justify-between text-[11px] font-semibold text-slate-900 shrink-0 select-none">
                    <LiveClock
                      showSeconds
                      className="text-[11px] font-bold text-slate-900"
                    />
                    {/* Dynamic Island + Camera Lens */}
                    <div className="w-24 h-6 bg-slate-950 rounded-full flex items-center justify-end pr-2 shadow-inner">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ring-1 ring-slate-700 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-emerald-400/60" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-slate-800">
                      <Signal className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">5G</span>
                      <Wifi className="w-3.5 h-3.5" />
                      <BatteryFull className="w-4 h-4" />
                    </div>
                  </div>

                  {/* App Sub-header inside HP */}
                  <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center justify-between text-[11px] shrink-0">
                    <span className="font-bold text-emerald-800 tracking-tight">
                      NusaHR Mobile
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-md ${
                        isAdmin
                          ? 'bg-slate-900 text-emerald-400'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {isAdmin ? 'Admin' : 'Karyawan'} · {activeTab}
                    </span>
                  </div>

                  {/* Scrollable Phone App Viewport */}
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    {renderTabBody()}
                  </div>

                  {/* Anchored Mobile Bottom Navigation + Home Gesture Indicator */}
                  <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 shrink-0">
                    <nav
                      aria-label="Navigasi Layar HP"
                      className="h-15 grid grid-cols-4 items-center"
                    >
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveTab(item.id)}
                            className={`min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                              isActive
                                ? 'text-emerald-700'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 ${isActive ? 'stroke-[2.25]' : ''}`}
                            />
                            <span className="text-[10px] font-semibold">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </nav>
                    {/* Authentic Smartphone Home Gesture Bar */}
                    <div className="h-4 flex items-center justify-center pb-1">
                      <div className="w-28 h-1 rounded-full bg-slate-900/75" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right / Bottom Column: Role-Differentiated Live Companion Panel */}
          <div className="lg:col-span-6 space-y-5">
            {isAdmin ? (
              <>
                <div className="rounded-2xl bg-slate-900 text-white border border-slate-800 p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                        Hak Akses Admin Aktif
                      </p>
                      <h2 className="text-xl font-bold mt-1">
                        Mode Mobile HP (Admin Manajemen)
                      </h2>
                    </div>
                    <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Anda masuk sebagai Admin. Selain bisa melakukan absensi di layar HP, Anda tetap memiliki akses penuh untuk membuka Backoffice Manajemen Karyawan, Jadwal Kerja, Persetujuan Izin, dan Payroll Harian.
                  </p>
                  <button
                    type="button"
                    onClick={onSwitchToAdmin}
                    className="min-h-[42px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Buka Panel Backoffice Admin</span>
                  </button>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Monitor Kehadiran Live Semua Karyawan
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Khusus tampilan Admin · Real-time seluruh perangkat
                      </p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-emerald-700">
                      {attendances.length} log
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[440px] overflow-y-auto">
                    {attendances.slice(0, 8).map((att) => (
                      <div
                        key={att.id}
                        className="px-6 py-3.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <AvatarWithFallback
                            src={att.clockInPhoto}
                            alt={att.employeeName}
                            sizeClass="w-10 h-10"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {att.employeeName}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">
                              {formatDateDDMMMYYYY(att.date)} · In{' '}
                              {att.clockInTime || '—'} · Out{' '}
                              {att.clockOutTime || 'Belum'}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-semibold shrink-0 ${
                            att.status === 'Terlambat'
                              ? 'text-amber-700'
                              : att.status === 'Hadir'
                              ? 'text-emerald-700'
                              : 'text-rose-600'
                          }`}
                        >
                          {att.status}
                        </span>
                      </div>
                    ))}
                    {attendances.length === 0 && (
                      <p className="py-8 text-center text-sm text-slate-500">
                        Belum ada catatan kehadiran.
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                    Akun Karyawan · Sinkronisasi Real-Time
                  </p>
                  <h2 className="text-xl font-bold text-slate-900">
                    Portal Mobile HP Karyawan
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Gunakan layar HP di samping untuk Clock-In/Out dengan kamera selfie, memantau akumulasi gaji harian, dan mengajukan izin atau cuti pribadi Anda. Pengaturan karyawan & payroll perusahaan dikelola terpisah di Portal Admin.
                  </p>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Riwayat Kehadiran Pribadi ({employee.fullName})
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Menampilkan catatan presensi dan shift Anda sendiri
                      </p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-emerald-700">
                      {myAttendances.length} hari
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[440px] overflow-y-auto">
                    {myAttendances.slice(0, 8).map((att) => (
                      <div
                        key={att.id}
                        className="px-6 py-3.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <AvatarWithFallback
                            src={att.clockInPhoto}
                            alt={att.employeeName}
                            sizeClass="w-10 h-10"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {formatDateDDMMMYYYY(att.date)}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">
                              Masuk {att.clockInTime || '—'} · Pulang{' '}
                              {att.clockOutTime || 'Belum'}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-semibold shrink-0 ${
                            att.status === 'Terlambat'
                              ? 'text-amber-700'
                              : att.status === 'Hadir'
                              ? 'text-emerald-700'
                              : 'text-rose-600'
                          }`}
                        >
                          {att.status}
                        </span>
                      </div>
                    ))}
                    {myAttendances.length === 0 && (
                      <p className="py-8 text-center text-sm text-slate-500">
                        Belum ada catatan kehadiran pribadi Anda.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Full-Screen Responsive Mode */
        <div className="pb-24 lg:pb-10">
          <div className="hidden lg:flex max-w-4xl mx-auto px-4 pt-4 gap-6 border-b border-slate-200">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[40px] text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === item.id
                    ? 'text-emerald-800 font-semibold border-b-2 border-emerald-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <main className="max-w-lg lg:max-w-4xl mx-auto px-4 pt-5">
            {renderTabBody()}
          </main>

          <nav
            aria-label="Navigasi Utama Mobile"
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
          >
            <div className="max-w-lg mx-auto grid grid-cols-4 h-16 items-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                      isActive
                        ? 'text-emerald-700'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.25]' : ''}`} />
                    <span className="text-[11px] font-medium tracking-tight">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
};
