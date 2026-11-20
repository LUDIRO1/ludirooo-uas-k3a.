import React, { useState } from 'react';
import { Camera, Eye, Plus, Search, Trash2, X } from 'lucide-react';
import type { Attendance, AttendanceStatus, Employee } from '../../types/hrm';
import { removeAttendance, saveAdminAttendance } from '../../services/hrmService';
import {
  formatDateDDMMMYYYY,
  formatDuration,
  formatRupiah,
  getTodayISO,
} from '../../utils/formatters';

interface Props {
  attendances: Attendance[];
  employees: Employee[];
}

export const AttendanceManagementView: React.FC<Props> = ({
  attendances,
  employees,
}) => {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | AttendanceStatus>('Semua');
  const [inspectItem, setInspectItem] = useState<Attendance | null>(null);

  // Manual Entry / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Attendance | null>(null);
  const [formEmpId, setFormEmpId] = useState('');
  const [formDate, setFormDate] = useState(getTodayISO());
  const [formIn, setFormIn] = useState('08:00');
  const [formOut, setFormOut] = useState('17:00');
  const [formStatus, setFormStatus] = useState<AttendanceStatus>('Hadir');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = attendances.filter((a) => {
    const matchSearch =
      a.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      a.employeeNip.toLowerCase().includes(search.toLowerCase());
    const matchDate = !dateFilter || a.date === dateFilter;
    const matchStatus = statusFilter === 'Semua' || a.status === statusFilter;
    return matchSearch && matchDate && matchStatus;
  });

  const openManualCreate = () => {
    setEditingItem(null);
    setFormEmpId(employees[0]?.id ?? '');
    setFormDate(getTodayISO());
    setFormIn('08:00');
    setFormOut('17:00');
    setFormStatus('Hadir');
    setFormNotes('Input manual oleh Backoffice');
    setModalOpen(true);
  };

  const openEditAttendance = (att: Attendance) => {
    setEditingItem(att);
    setFormEmpId(att.employeeId);
    setFormDate(att.date);
    setFormIn(att.clockInTime || '08:00');
    setFormOut(att.clockOutTime || '');
    setFormStatus(att.status);
    setFormNotes(att.notes);
    setModalOpen(true);
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === formEmpId);
    if (!emp) return;
    setSaving(true);
    try {
      await saveAdminAttendance({
        employee: emp,
        date: formDate,
        clockInTime: formStatus === 'Alpa' || formStatus === 'Izin' ? '' : formIn,
        clockOutTime: formStatus === 'Alpa' || formStatus === 'Izin' ? '' : formOut,
        status: formStatus,
        notes: formNotes,
        existing: editingItem ?? undefined,
      });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari karyawan / NIP..."
              className="w-full min-h-[40px] rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter tanggal kehadiran"
              className="min-h-[40px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-mono"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'Semua' | AttendanceStatus)
            }
            className="min-h-[40px] rounded-xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="Semua">Semua Status</option>
            <option value="Hadir">Hadir</option>
            <option value="Terlambat">Terlambat</option>
            <option value="Izin">Izin</option>
            <option value="Alpa">Alpa</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openManualCreate}
          disabled={employees.length === 0}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#062C22] hover:bg-[#09382B] disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Input Kehadiran</span>
        </button>
      </div>

      {/* Attendance Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Clock-In</th>
                <th className="py-3 px-4">Clock-Out</th>
                <th className="py-3 px-4">Selfie</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Upah Harian</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    Belum ada catatan kehadiran untuk filter ini.
                  </td>
                </tr>
              ) : (
                filtered.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">
                        {att.employeeName}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {att.employeeNip} · {att.positionTitle}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-800 whitespace-nowrap">
                      {formatDateDDMMMYYYY(att.date)}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-900 tabular-nums whitespace-nowrap">
                      {att.clockInTime || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-900 tabular-nums whitespace-nowrap">
                      <span>{att.clockOutTime || 'Belum'}</span>
                      {att.workDurationMinutes > 0 && (
                        <span className="block text-[11px] text-slate-500">
                          {formatDuration(att.workDurationMinutes)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {att.clockInPhoto || att.clockOutPhoto ? (
                        <button
                          type="button"
                          onClick={() => setInspectItem(att)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Lihat Foto</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Manual</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold ${
                          att.status === 'Hadir'
                            ? 'text-emerald-700'
                            : att.status === 'Terlambat'
                            ? 'text-amber-700'
                            : 'text-rose-600'
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatRupiah(att.earnedAmount)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setInspectItem(att)}
                          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                          aria-label="Detail kehadiran"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditAttendance(att)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                        >
                          Koreksi
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAttendance(att.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          aria-label="Hapus kehadiran"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selfie Inspection Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Verifikasi Presensi Selfie — {inspectItem.employeeName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatDateDDMMMYYYY(inspectItem.date)} · {inspectItem.status} · Upah{' '}
                  {formatRupiah(inspectItem.earnedAmount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>Selfie Clock-In</span>
                    <span className="font-mono">{inspectItem.clockInTime || '—'}</span>
                  </div>
                  {inspectItem.clockInPhoto ? (
                    <img
                      src={inspectItem.clockInPhoto}
                      alt="Selfie Clock-In"
                      referrerPolicy="no-referrer"
                      className="w-full aspect-square object-cover rounded-xl border border-slate-200"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      Tidak ada foto
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500">
                    {inspectItem.clockInLocation || '—'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>Selfie Clock-Out</span>
                    <span className="font-mono">{inspectItem.clockOutTime || 'Belum'}</span>
                  </div>
                  {inspectItem.clockOutPhoto ? (
                    <img
                      src={inspectItem.clockOutPhoto}
                      alt="Selfie Clock-Out"
                      referrerPolicy="no-referrer"
                      className="w-full aspect-square object-cover rounded-xl border border-slate-200"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      Belum Clock-Out
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500">
                    {inspectItem.clockOutLocation || '—'}
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
                Catatan: {inspectItem.notes || '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Attendance / Correction Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Koreksi Data Kehadiran' : 'Input Kehadiran Manual'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveManual} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Karyawan
                </label>
                <select
                  value={formEmpId}
                  disabled={Boolean(editingItem)}
                  onChange={(e) => setFormEmpId(e.target.value)}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm bg-white disabled:bg-slate-100"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.nip})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tanggal ({formatDateDDMMMYYYY(formDate)})
                  </label>
                  <input
                    type="date"
                    required
                    disabled={Boolean(editingItem)}
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm font-mono disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Status Kehadiran
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as AttendanceStatus)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm bg-white"
                  >
                    <option value="Hadir">Hadir (Dibayar Harian)</option>
                    <option value="Terlambat">Terlambat (Dibayar Harian)</option>
                    <option value="Izin">Izin (Rp 0)</option>
                    <option value="Alpa">Alpa (Rp 0)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Jam Masuk
                  </label>
                  <input
                    type="time"
                    value={formIn}
                    onChange={(e) => setFormIn(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Jam Pulang
                  </label>
                  <input
                    type="time"
                    value={formOut}
                    onChange={(e) => setFormOut(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Catatan
                </label>
                <input
                  type="text"
                  maxLength={250}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[42px] px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[42px] px-5 rounded-xl bg-[#062C22] hover:bg-[#09382B] text-white text-sm font-semibold cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Kehadiran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
