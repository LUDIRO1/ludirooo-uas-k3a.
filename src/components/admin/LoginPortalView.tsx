import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BatteryFull,
  Camera,
  CheckCircle2,
  Clock,
  KeyRound,
  Monitor,
  ShieldCheck,
  Signal,
  Smartphone,
  User,
  Users,
  Wallet,
  Wifi,
} from 'lucide-react';
import { formatDateDDMMMYYYY, getTodayISO } from '../../utils/formatters';
import { LiveClock } from '../LiveClock';
import { PWAInstallButton } from '../PWAInstallButton';

interface Props {
  activePortal: 'admin' | 'pwa';
  onPortalChange: (portal: 'admin' | 'pwa') => void;
  onGoogleLogin: (options: {
    targetPortal: 'admin' | 'pwa';
    preferredName: string;
    adminPasscode: string;
  }) => Promise<void>;
  loading: boolean;
  errorMessage: string | null;
}

export const LoginPortalView: React.FC<Props> = ({
  activePortal,
  onPortalChange,
  onGoogleLogin,
  loading,
  errorMessage,
}) => {
  const [webPreferredName, setWebPreferredName] = useState('');
  const [hpPreferredName, setHpPreferredName] = useState('');
  const [webAdminPasscode, setWebAdminPasscode] = useState('NUSAHR2026');
  const [hpAdminPasscode, setHpAdminPasscode] = useState('NUSAHR2026');

  const todayISO = getTodayISO();
  const isAdminPortal = activePortal === 'admin';

  const handleWebSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onGoogleLogin({
      targetPortal: activePortal,
      preferredName: isAdminPortal ? '' : webPreferredName.trim(),
      adminPasscode: isAdminPortal ? webAdminPasscode.trim() : '',
    });
  };

  const handleHpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onGoogleLogin({
      targetPortal: activePortal,
      preferredName: isAdminPortal ? '' : hpPreferredName.trim(),
      adminPasscode: isAdminPortal ? hpAdminPasscode.trim() : '',
    });
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors ${
        isAdminPortal ? 'bg-slate-100' : 'bg-slate-50'
      }`}
    >
      {/* Distinct Portal Top Bar */}
      <header
        className={`h-16 px-4 sm:px-6 lg:px-10 border-b flex items-center justify-between gap-4 ${
          isAdminPortal
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 ${
              isAdminPortal
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-[#062C22] text-emerald-300'
            }`}
          >
            {isAdminPortal ? <ShieldCheck className="w-4 h-4" /> : 'N'}
          </div>
          <div className="min-w-0">
            <span className="text-base sm:text-lg font-bold tracking-tight truncate block">
              {isAdminPortal ? 'NusaHR · Portal Admin' : 'NusaHR · Portal Karyawan'}
            </span>
          </div>
        </div>

        {/* Dedicated Switcher between Portal Karyawan & Portal Admin */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <LiveClock
            showDate
            suffix="WIB"
            className={`hidden md:inline text-xs font-medium ${
              isAdminPortal ? 'text-slate-300' : 'text-slate-600'
            }`}
          />

          <div
            className={`flex items-center gap-1 p-1 rounded-xl ${
              isAdminPortal ? 'bg-slate-800' : 'bg-slate-100'
            }`}
          >
            <button
              type="button"
              onClick={() => onPortalChange('pwa')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                !isAdminPortal
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Portal Karyawan</span>
            </button>
            <button
              type="button"
              onClick={() => onPortalChange('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                isAdminPortal
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Portal Admin</span>
            </button>
          </div>

          {!isAdminPortal && <PWAInstallButton compact />}
        </div>
      </header>

      {/* Portal Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 lg:py-10 space-y-8">
        {/* Distinct Portal Hero */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div className="max-w-2xl space-y-2">
            <p
              className={`text-xs font-bold uppercase tracking-wider ${
                isAdminPortal ? 'text-slate-700' : 'text-emerald-800'
              }`}
            >
              {isAdminPortal
                ? 'Backoffice Manajemen SDM & Payroll Harian'
                : 'Aplikasi Karyawan · Absensi Selfie & Gaji Harian'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight [text-wrap:balance]">
              {isAdminPortal
                ? 'Portal Khusus Admin Manajemen'
                : 'Portal Khusus Karyawan'}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {isAdminPortal
                ? 'Admin tetap memiliki akses login penuh (lewat Model Web Biasa maupun Mobile HP) untuk membuka Backoffice Manajemen SDM, Audit Kehadiran, Persetujuan Izin, Payroll Harian, serta beralih ke Mode HP Karyawan.'
                : 'Masuk dengan akun Google Anda melalui Model Web Biasa atau Model Mobile HP. Di dalam aplikasi, akun Karyawan hanya mengakses presensi selfie, izin pribadi, & gaji harian, sedangkan akun Admin memiliki akses Backoffice Manajemen.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onPortalChange(isAdminPortal ? 'pwa' : 'admin')}
            className="self-start md:self-auto min-h-[40px] px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 inline-flex items-center gap-2 shrink-0 cursor-pointer"
          >
            {isAdminPortal ? (
              <>
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-700" />
                <span>Pindah ke Portal Karyawan</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Masuk sebagai Admin? Buka Portal Admin</span>
              </>
            )}
          </button>
        </section>

        {errorMessage && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-700">
            {errorMessage}
          </div>
        )}

        {/* Dual Login Models for the Currently Selected Portal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* MODEL 1: FORM LOGIN BIASA (WEB) */}
          <section className="lg:col-span-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Monitor className="w-4 h-4 text-emerald-700" />
                <span>
                  Model 1 · Login Biasa ({isAdminPortal ? 'Admin' : 'Karyawan'})
                </span>
              </div>
              <span className="text-xs text-slate-500">Versi Desktop / Web</span>
            </div>

            <div
              className={`rounded-3xl border p-6 sm:p-7 shadow-sm ${
                isAdminPortal
                  ? 'bg-slate-900 border-slate-800 text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">
                    {isAdminPortal
                      ? 'Masuk Panel Backoffice Admin'
                      : 'Masuk Karyawan (Versi Web)'}
                  </h2>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      isAdminPortal ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {isAdminPortal
                      ? 'Diperlukan Kode Akses Manajemen untuk masuk ke Portal Admin.'
                      : 'Terbuka untuk siapapun. Akun karyawan baru otomatis dibuat saat pertama kali masuk.'}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    isAdminPortal
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {isAdminPortal ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : (
                    <Users className="w-5 h-5" />
                  )}
                </div>
              </div>

              <form onSubmit={handleWebSubmit} className="space-y-4">
                {!isAdminPortal ? (
                  <div>
                    <label
                      htmlFor="web-preferred-name"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Nama Tampilan Karyawan (Opsional)
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="web-preferred-name"
                        type="text"
                        maxLength={80}
                        value={webPreferredName}
                        onChange={(e) => setWebPreferredName(e.target.value)}
                        placeholder="Otomatis dari nama akun Google jika kosong"
                        className="w-full min-h-[44px] rounded-xl border border-slate-200 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/25 focus:border-emerald-600"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="web-admin-passcode"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Kode Akses Manajemen
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="web-admin-passcode"
                        type="text"
                        required
                        maxLength={64}
                        value={webAdminPasscode}
                        onChange={(e) => setWebAdminPasscode(e.target.value)}
                        placeholder="Masukkan kode akses manajemen"
                        className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 pl-10 pr-3.5 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Kode akses demo:{' '}
                      <span className="font-mono font-semibold text-emerald-400">
                        NUSAHR2026
                      </span>
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full min-h-[48px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-60 ${
                    isAdminPortal
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-[#062C22] hover:bg-[#09382B] text-white'
                  }`}
                >
                  <span>
                    {loading
                      ? 'Menghubungkan...'
                      : isAdminPortal
                      ? 'Masuk Portal Admin dengan Google'
                      : 'Masuk Portal Karyawan dengan Google'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <p
                className={`mt-4 text-[11px] text-center ${
                  isAdminPortal ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Sinkronisasi real-time Cloud Firestore · {formatDateDDMMMYYYY(todayISO)}
              </p>
            </div>

            {/* Portal-specific Capabilities Summary */}
            <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3.5 text-sm text-slate-700">
              {isAdminPortal ? (
                <>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Master Karyawan, Jabatan & Jadwal Kerja
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Atur tarif harian Rp / hari, jam masuk-pulang, toleransi keterlambatan, dan kalender hari libur.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Audit Selfie Kehadiran & Persetujuan Izin
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tinjau foto selfie Clock-In/Out karyawan dan setujui pengajuan izin atau cuti secara real-time.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Wallet className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Payroll Model Gajian Harian
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Hitung otomatis gaji dari jumlah hari masuk, kelola status Draft/Disetujui/Dibayarkan, dan ekspor CSV/slip gaji.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Clock-In & Clock-Out Kamera Selfie
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Presensi langsung dengan kamera selfie lengkap dengan timestamp tanggal & jam detik real-time.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Wallet className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Pantau Akumulasi Gaji Harian
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Setiap presensi masuk langsung menambah saldo pendapatan harian di tab Beranda & Profil Gaji.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Ajukan Izin / Cuti & Lihat Laporan
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kirim pengajuan izin atau cuti langsung dari HP dan lihat status persetujuan manajemen seketika.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* MODEL 2: FORM LOGIN MOBILE HP */}
          <section className="lg:col-span-6 flex flex-col items-center space-y-5">
            <div className="w-full max-w-[384px] flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span>
                  Model 2 · Login Mobile HP ({isAdminPortal ? 'Admin' : 'Karyawan'})
                </span>
              </div>
              <span className="text-xs text-slate-500">Tampilan Layar HP</span>
            </div>

            {/* Authentic Smartphone (HP) Hardware Model */}
            <div className="relative mx-auto w-full max-w-[384px]">
              {/* Left Hardware Buttons */}
              <div
                aria-hidden="true"
                className="hidden sm:block absolute -left-[5px] top-20 w-[4px] h-6 rounded-l-md bg-slate-700 border-l border-slate-600"
              />
              <div
                aria-hidden="true"
                className="hidden sm:block absolute -left-[5px] top-32 w-[4px] h-11 rounded-l-md bg-slate-700 border-l border-slate-600"
              />
              <div
                aria-hidden="true"
                className="hidden sm:block absolute -left-[5px] top-46 w-[4px] h-11 rounded-l-md bg-slate-700 border-l border-slate-600"
              />
              {/* Right Hardware Button */}
              <div
                aria-hidden="true"
                className="hidden sm:block absolute -right-[5px] top-36 w-[4px] h-14 rounded-r-md bg-slate-700 border-r border-slate-600"
              />

              {/* Outer Metallic Smartphone Bezel */}
              <div className="w-full rounded-[44px] sm:rounded-[50px] bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 p-[9px] sm:p-[11px] shadow-2xl ring-1 ring-slate-700/80 flex flex-col">
                {/* Inner OLED Phone Screen */}
                <div className="flex-1 bg-slate-50 rounded-[35px] sm:rounded-[39px] overflow-hidden flex flex-col border border-slate-950">
                  {/* Smartphone Status Bar + Dynamic Island */}
                  <div className="h-10 px-5 bg-white flex items-center justify-between text-[11px] font-semibold text-slate-900 shrink-0 select-none border-b border-slate-100">
                    <LiveClock
                      showSeconds
                      className="text-[11px] font-bold text-slate-900"
                    />
                    <div className="w-22 h-5 bg-slate-950 rounded-full flex items-center justify-end pr-1.5">
                      <div className="w-2 h-2 rounded-full bg-slate-800 ring-1 ring-slate-700 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-emerald-400/60" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-slate-800">
                      <Signal className="w-3 h-3" />
                      <span className="text-[9px] font-bold">5G</span>
                      <Wifi className="w-3 h-3" />
                      <BatteryFull className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Mobile Screen Content */}
                  <div className="p-4 sm:p-5 space-y-4 bg-slate-50">
                    {/* Distinct Portal Banner Card inside HP */}
                    <div
                      className={`rounded-3xl p-4 sm:p-5 text-white shadow-sm ${
                        isAdminPortal
                          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950'
                          : 'bg-gradient-to-br from-[#062C22] via-[#09382B] to-[#0D4A39]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/15 text-emerald-300 font-bold text-sm flex items-center justify-center">
                            {isAdminPortal ? (
                              <ShieldCheck className="w-4 h-4" />
                            ) : (
                              'N'
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold tracking-tight text-white">
                              {isAdminPortal
                                ? 'NusaHR Admin'
                                : 'NusaHR Karyawan'}
                            </p>
                            <p className="text-[10px] text-emerald-200/80">
                              {isAdminPortal
                                ? 'Mobile Backoffice'
                                : 'Absensi & Gaji Harian'}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] text-emerald-200 tabular-nums">
                          {formatDateDDMMMYYYY(todayISO)}
                        </span>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-white/15 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-100">
                          <Clock className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Jam Real-Time</span>
                        </div>
                        <LiveClock
                          showSeconds
                          suffix="WIB"
                          className="text-xs font-bold text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {isAdminPortal
                          ? 'Login Portal Admin via HP'
                          : 'Login Portal Karyawan (HP)'}
                      </h2>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {isAdminPortal
                          ? 'Masukkan kode akses manajemen untuk mengelola SDM & payroll.'
                          : 'Masuk langsung untuk presensi selfie & cek gaji harian.'}
                      </p>
                    </div>

                    <form onSubmit={handleHpSubmit} className="space-y-3">
                      {!isAdminPortal ? (
                        <div>
                          <label
                            htmlFor="hp-preferred-name"
                            className="block text-[11px] font-medium text-slate-700 mb-1"
                          >
                            Nama Tampilan Karyawan (Opsional)
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              id="hp-preferred-name"
                              type="text"
                              maxLength={80}
                              value={hpPreferredName}
                              onChange={(e) => setHpPreferredName(e.target.value)}
                              placeholder="Otomatis dari akun Google"
                              className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/25 focus:border-emerald-600"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label
                            htmlFor="hp-admin-passcode"
                            className="block text-[11px] font-medium text-slate-700 mb-1"
                          >
                            Kode Akses Manajemen
                          </label>
                          <div className="relative">
                            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              id="hp-admin-passcode"
                              type="text"
                              required
                              maxLength={64}
                              value={hpAdminPasscode}
                              onChange={(e) => setHpAdminPasscode(e.target.value)}
                              placeholder="Masukkan kode akses"
                              className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/25 focus:border-emerald-600"
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-slate-500">
                            Kode demo:{' '}
                            <span className="font-mono font-semibold text-emerald-800">
                              NUSAHR2026
                            </span>
                          </p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className={`w-full min-h-[46px] rounded-2xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-60 ${
                          isAdminPortal
                            ? 'bg-slate-900 hover:bg-slate-800 text-white'
                            : 'bg-[#062C22] hover:bg-[#09382B] text-white'
                        }`}
                      >
                        <span>
                          {loading
                            ? 'Menghubungkan...'
                            : isAdminPortal
                            ? 'Masuk Admin dengan Google'
                            : 'Masuk Karyawan dengan Google'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>

                    {/* Mini App Shortcuts Preview */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="rounded-xl bg-white border border-slate-200/80 p-2 text-center">
                        {isAdminPortal ? (
                          <Users className="w-3.5 h-3.5 text-slate-800 mx-auto" />
                        ) : (
                          <Camera className="w-3.5 h-3.5 text-emerald-700 mx-auto" />
                        )}
                        <p className="mt-1 text-[10px] font-semibold text-slate-700">
                          {isAdminPortal ? 'Karyawan' : 'Selfie'}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white border border-slate-200/80 p-2 text-center">
                        <Wallet
                          className={`w-3.5 h-3.5 mx-auto ${
                            isAdminPortal ? 'text-slate-800' : 'text-emerald-700'
                          }`}
                        />
                        <p className="mt-1 text-[10px] font-semibold text-slate-700">
                          {isAdminPortal ? 'Payroll' : 'Gaji Harian'}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white border border-slate-200/80 p-2 text-center">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 mx-auto ${
                            isAdminPortal ? 'text-slate-800' : 'text-emerald-700'
                          }`}
                        />
                        <p className="mt-1 text-[10px] font-semibold text-slate-700">
                          Real-Time
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Smartphone Home Gesture Indicator */}
                  <div className="h-5 bg-slate-50 flex items-center justify-center shrink-0">
                    <div className="w-28 h-1 rounded-full bg-slate-900/75" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
