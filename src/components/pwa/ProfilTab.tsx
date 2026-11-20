import React, { useEffect, useState } from 'react';
import { Banknote, Check, Phone, User } from 'lucide-react';
import type {
  Attendance,
  Employee,
  EmployeePrivateContact,
  Payroll,
} from '../../types/hrm';
import { updateEmployeeOwnContact } from '../../services/hrmService';
import {
  formatDateDDMMMYYYY,
  formatMonthYearMMMYYYY,
  formatRupiah,
  getCurrentMonthISO,
} from '../../utils/formatters';
import { AvatarWithFallback } from '../AvatarWithFallback';

interface Props {
  employee: Employee;
  privateContact: EmployeePrivateContact | null;
  userEmail: string;
  actorUid: string;
  attendances: Attendance[];
  payrolls: Payroll[];
  initialSubTab?: 'biodata' | 'gaji';
}

export const ProfilTab: React.FC<Props> = ({
  employee,
  privateContact,
  userEmail,
  actorUid,
  attendances,
  payrolls,
  initialSubTab = 'biodata',
}) => {
  const [subTab, setSubTab] = useState<'biodata' | 'gaji'>(initialSubTab);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState(privateContact?.phone ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    if (privateContact?.phone !== undefined) {
      setPhoneInput(privateContact.phone);
    }
  }, [privateContact?.phone]);

  const currentMonth = getCurrentMonthISO();
  const monthAttendances = attendances.filter((a) =>
    a.date.startsWith(currentMonth)
  );
  const presentDays = monthAttendances.filter(
    (a) => a.status === 'Hadir' || a.status === 'Terlambat'
  ).length;
  const runningEstimate = presentDays * employee.dailyRate;

  const displayEmail = privateContact?.email || userEmail || '—';
  const displayPhone = privateContact?.phone || '—';

  const handleSavePhone = async () => {
    setSaving(true);
    try {
      await updateEmployeeOwnContact(
        employee.id,
        employee.ownerUid || actorUid,
        displayEmail === '—' ? userEmail : displayEmail,
        phoneInput.trim(),
        employee.avatarUrl
      );
      setEditingPhone(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Profile Identity Header */}
      <section className="rounded-3xl bg-white border border-slate-200 p-5 flex items-center gap-4">
        <AvatarWithFallback
          src={employee.avatarUrl}
          alt={employee.fullName}
          sizeClass="w-16 h-16"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900 truncate">
            {employee.fullName}
          </h2>
          <p className="text-xs text-slate-600 truncate">
            {employee.positionTitle} · {employee.department}
          </p>
          <p className="mt-1 font-mono text-xs text-slate-500">
            NIP {employee.nip} · {employee.status}
          </p>
        </div>
      </section>

      {/* Segmented Control: Biodata | Gaji */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/70 rounded-2xl">
        <button
          type="button"
          onClick={() => setSubTab('biodata')}
          className={`min-h-[44px] rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
            subTab === 'biodata'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Biodata</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('gaji')}
          className={`min-h-[44px] rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
            subTab === 'gaji'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>Rincian Gaji</span>
        </button>
      </div>

      {subTab === 'biodata' ? (
        <section className="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100">
          <div className="px-5 py-3.5 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500">Nomor Induk Pegawai</span>
            <span className="text-sm font-mono font-semibold text-slate-900">
              {employee.nip}
            </span>
          </div>
          <div className="px-5 py-3.5 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500">Email Terdaftar</span>
            <span className="text-sm font-medium text-slate-900 truncate">
              {displayEmail}
            </span>
          </div>
          <div className="px-5 py-3.5 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500">Jabatan</span>
            <span className="text-sm font-medium text-slate-900">
              {employee.positionTitle}
            </span>
          </div>
          <div className="px-5 py-3.5 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500">Departemen</span>
            <span className="text-sm font-medium text-slate-900">
              {employee.department}
            </span>
          </div>
          <div className="px-5 py-3.5 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500">Tanggal Bergabung</span>
            <span className="text-sm font-medium text-slate-900">
              {formatDateDDMMMYYYY(employee.joinDate)}
            </span>
          </div>
          <div className="px-5 py-3.5 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500">Nomor Telepon</span>
              {!editingPhone ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-slate-900">
                    {displayPhone}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneInput(privateContact?.phone ?? '');
                      setEditingPhone(true);
                    }}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    Ubah
                  </button>
                </div>
              ) : null}
            </div>
            {editingPhone && (
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    maxLength={30}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 pl-9 pr-3 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSavePhone}
                  disabled={saving}
                  className="min-h-[40px] px-3.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{saving ? '...' : 'Simpan'}</span>
                </button>
              </div>
            )}
          </div>
        </section>
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Skema Penggajian Harian</p>
                <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                  {formatRupiah(employee.dailyRate)}{' '}
                  <span className="text-xs font-normal text-slate-500">/ hari masuk</span>
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="text-slate-600">
                Estimasi {formatMonthYearMMMYYYY(currentMonth)} ({presentDays} hari)
              </span>
              <span className="font-mono font-bold text-emerald-700 tabular-nums">
                {formatRupiah(runningEstimate)}
              </span>
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                Riwayat Slip Gaji Resmi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Diterbitkan oleh Manajemen Backoffice
              </p>
            </div>

            {payrolls.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-slate-500">
                Belum ada slip gaji resmi untuk periode ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {payrolls.map((pay) => (
                  <div key={pay.id} className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {pay.periodLabel}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                          {pay.daysPresent} hari masuk × {formatRupiah(pay.dailyRate)}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          pay.status === 'Dibayarkan'
                            ? 'text-emerald-700'
                            : pay.status === 'Disetujui'
                            ? 'text-blue-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {pay.status}
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Gaji Pokok Harian</span>
                        <span className="font-mono tabular-nums">
                          {formatRupiah(pay.basePay)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Bonus / Tunjangan</span>
                        <span className="font-mono tabular-nums text-emerald-700">
                          +{formatRupiah(pay.bonus)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Potongan</span>
                        <span className="font-mono tabular-nums text-rose-600">
                          -{formatRupiah(pay.deduction)}
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                        <span>Total Diterima</span>
                        <span className="font-mono tabular-nums">
                          {formatRupiah(pay.totalPay)}
                        </span>
                      </div>
                      {pay.paidDate && (
                        <p className="pt-1 text-[11px] text-slate-500">
                          Dibayarkan pada {formatDateDDMMMYYYY(pay.paidDate)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
