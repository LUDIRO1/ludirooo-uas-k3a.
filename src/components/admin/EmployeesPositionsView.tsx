import React, { useState } from 'react';
import { Briefcase, Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react';
import type { Employee, EmployeeStatus, Position } from '../../types/hrm';
import {
  fetchEmployeePrivateContact,
  removeEmployee,
  removePosition,
  saveEmployee,
  savePosition,
} from '../../services/hrmService';
import {
  formatDateDDMMMYYYY,
  formatRupiah,
  getTodayISO,
} from '../../utils/formatters';
import { AvatarWithFallback } from '../AvatarWithFallback';

interface Props {
  employees: Employee[];
  positions: Position[];
}

export const EmployeesPositionsView: React.FC<Props> = ({
  employees,
  positions,
}) => {
  const [tab, setTab] = useState<'employees' | 'positions'>('employees');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | EmployeeStatus>('Semua');

  // Employee Modal State
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [empNip, setEmpNip] = useState('');
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empPosId, setEmpPosId] = useState('');
  const [empDailyRate, setEmpDailyRate] = useState(250000);
  const [empJoinDate, setEmpJoinDate] = useState(getTodayISO());
  const [empStatus, setEmpStatus] = useState<EmployeeStatus>('Aktif');
  const [empSaving, setEmpSaving] = useState(false);

  // Position Modal State
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [posTitle, setPosTitle] = useState('');
  const [posDept, setPosDept] = useState('');
  const [posRate, setPosRate] = useState(250000);
  const [posDesc, setPosDesc] = useState('');
  const [posSaving, setPosSaving] = useState(false);

  const filteredEmployees = employees.filter((e) => {
    const matchSearch =
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.nip.toLowerCase().includes(search.toLowerCase()) ||
      e.positionTitle.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'Semua' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openNewEmployee = () => {
    const defaultPos = positions[0];
    setEditingEmp(null);
    setEmpNip(`EMP-2026-${String(employees.length + 1).padStart(3, '0')}`);
    setEmpName('');
    setEmpEmail('');
    setEmpPhone('');
    setEmpPosId(defaultPos?.id ?? '');
    setEmpDailyRate(defaultPos?.dailyRate ?? 250000);
    setEmpJoinDate(getTodayISO());
    setEmpStatus('Aktif');
    setEmpModalOpen(true);
  };

  const openEditEmployee = async (emp: Employee) => {
    setEditingEmp(emp);
    setEmpNip(emp.nip);
    setEmpName(emp.fullName);
    setEmpEmail(emp.email ?? '');
    setEmpPhone(emp.phone ?? '');
    setEmpPosId(emp.positionId);
    setEmpDailyRate(emp.dailyRate);
    setEmpJoinDate(emp.joinDate);
    setEmpStatus(emp.status);
    setEmpModalOpen(true);
    const priv = await fetchEmployeePrivateContact(emp.id);
    if (priv) {
      setEmpEmail(priv.email);
      setEmpPhone(priv.phone);
    }
  };

  const handlePositionSelectChange = (newPosId: string) => {
    setEmpPosId(newPosId);
    const found = positions.find((p) => p.id === newPosId);
    if (found) {
      setEmpDailyRate(found.dailyRate);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const pos = positions.find((p) => p.id === empPosId) ?? positions[0];
    if (!pos) return;
    setEmpSaving(true);
    try {
      await saveEmployee(
        {
          id: editingEmp ? editingEmp.id : `emp_${Date.now()}`,
          nip: empNip,
          ownerUid: editingEmp ? editingEmp.ownerUid : '',
          fullName: empName,
          email: empEmail,
          phone: empPhone,
          positionId: pos.id,
          positionTitle: pos.title,
          department: pos.department,
          dailyRate: empDailyRate,
          joinDate: empJoinDate,
          status: empStatus,
          avatarUrl: editingEmp?.avatarUrl ?? '',
        },
        !editingEmp
      );
      setEmpModalOpen(false);
    } finally {
      setEmpSaving(false);
    }
  };

  const openNewPosition = () => {
    setEditingPos(null);
    setPosTitle('');
    setPosDept('');
    setPosRate(250000);
    setPosDesc('');
    setPosModalOpen(true);
  };

  const openEditPosition = (pos: Position) => {
    setEditingPos(pos);
    setPosTitle(pos.title);
    setPosDept(pos.department);
    setPosRate(pos.dailyRate);
    setPosDesc(pos.description);
    setPosModalOpen(true);
  };

  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosSaving(true);
    try {
      await savePosition(
        {
          id: editingPos ? editingPos.id : `pos_${Date.now()}`,
          title: posTitle,
          department: posDept,
          dailyRate: posRate,
          description: posDesc,
        },
        !editingPos
      );
      setPosModalOpen(false);
    } finally {
      setPosSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
          <button
            type="button"
            onClick={() => setTab('employees')}
            className={`min-h-[40px] px-4 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
              tab === 'employees'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Data Karyawan ({employees.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('positions')}
            className={`min-h-[40px] px-4 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
              tab === 'positions'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Master Jabatan ({positions.length})</span>
          </button>
        </div>

        {tab === 'employees' ? (
          <button
            type="button"
            onClick={openNewEmployee}
            disabled={positions.length === 0}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#062C22] hover:bg-[#09382B] disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Karyawan</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={openNewPosition}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#062C22] hover:bg-[#09382B] text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jabatan</span>
          </button>
        )}
      </div>

      {tab === 'employees' ? (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, NIP, atau jabatan..."
                className="w-full min-h-[40px] rounded-xl border border-slate-200 pl-10 pr-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/25"
              />
            </div>

            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {(['Semua', 'Aktif', 'Nonaktif'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === s
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Employee Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Karyawan</th>
                  <th className="py-3 px-4">NIP</th>
                  <th className="py-3 px-4">Jabatan & Departemen</th>
                  <th className="py-3 px-4">Tgl Bergabung</th>
                  <th className="py-3 px-4 text-right">Tarif Harian</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      Tidak ada data karyawan yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <AvatarWithFallback
                            src={emp.avatarUrl}
                            alt={emp.fullName}
                            sizeClass="w-9 h-9"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {emp.fullName}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {emp.department}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {emp.nip}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">
                          {emp.positionTitle}
                        </p>
                        <p className="text-xs text-slate-500">{emp.department}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {formatDateDDMMMYYYY(emp.joinDate)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatRupiah(emp.dailyRate)}/hr
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold ${
                            emp.status === 'Aktif'
                              ? 'text-emerald-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditEmployee(emp)}
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                            aria-label={`Edit ${emp.fullName}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeEmployee(emp.id)}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            aria-label={`Hapus ${emp.fullName}`}
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
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Nama Jabatan</th>
                  <th className="py-3 px-4">Departemen</th>
                  <th className="py-3 px-4">Deskripsi Tugas</th>
                  <th className="py-3 px-4 text-right">Standar Tarif Harian</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {positions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      Belum ada master jabatan. Tambahkan jabatan pertama terlebih dahulu.
                    </td>
                  </tr>
                ) : (
                  positions.map((pos) => (
                    <tr key={pos.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {pos.title}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{pos.department}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-md">
                        {pos.description || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-800 tabular-nums whitespace-nowrap">
                        {formatRupiah(pos.dailyRate)} / hari
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditPosition(pos)}
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                            aria-label={`Edit jabatan ${pos.title}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removePosition(pos.id)}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            aria-label={`Hapus jabatan ${pos.title}`}
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
      )}

      {/* Employee Modal */}
      {empModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingEmp ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setEmpModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    NIP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={30}
                    value={empNip}
                    onChange={(e) => setEmpNip(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={empStatus}
                    onChange={(e) => setEmpStatus(e.target.value as EmployeeStatus)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm bg-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email Google (Login PWA)
                  </label>
                  <input
                    type="email"
                    required
                    maxLength={120}
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    maxLength={30}
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Jabatan
                  </label>
                  <select
                    value={empPosId}
                    onChange={(e) => handlePositionSelectChange(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm bg-white"
                  >
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tarif Harian (Rp / hari)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={empDailyRate}
                    onChange={(e) => setEmpDailyRate(Number(e.target.value))}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tanggal Bergabung ({formatDateDDMMMYYYY(empJoinDate)})
                </label>
                <input
                  type="date"
                  required
                  value={empJoinDate}
                  onChange={(e) => setEmpJoinDate(e.target.value)}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEmpModalOpen(false)}
                  className="min-h-[42px] px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={empSaving}
                  className="min-h-[42px] px-5 rounded-xl bg-[#062C22] hover:bg-[#09382B] text-white text-sm font-semibold cursor-pointer"
                >
                  {empSaving ? 'Menyimpan...' : 'Simpan Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Position Modal */}
      {posModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingPos ? 'Edit Master Jabatan' : 'Tambah Jabatan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setPosModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePosition} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Jabatan
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={posTitle}
                  onChange={(e) => setPosTitle(e.target.value)}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Departemen
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={posDept}
                  onChange={(e) => setPosDept(e.target.value)}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Standar Tarif Harian (Rp / hari)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={posRate}
                  onChange={(e) => setPosRate(Number(e.target.value))}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={posDesc}
                  onChange={(e) => setPosDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPosModalOpen(false)}
                  className="min-h-[42px] px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={posSaving}
                  className="min-h-[42px] px-5 rounded-xl bg-[#062C22] hover:bg-[#09382B] text-white text-sm font-semibold cursor-pointer"
                >
                  {posSaving ? 'Menyimpan...' : 'Simpan Jabatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
