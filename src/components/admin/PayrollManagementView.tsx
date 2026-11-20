import React, { useMemo, useState } from 'react';
import {
  Calculator,
  CheckCircle2,
  Download,
  FileText,
  Pencil,
  X,
} from 'lucide-react';
import type {
  Attendance,
  Employee,
  Payroll,
  PayrollStatus,
} from '../../types/hrm';
import {
  updatePayrollStatusOrAdjustments,
  upsertPayrollBatch,
} from '../../services/hrmService';
import {
  formatDateDDMMMYYYY,
  formatMonthYearMMMYYYY,
  formatRupiah,
  getCurrentMonthISO,
  getMonthDateBounds,
} from '../../utils/formatters';

interface Props {
  employees: Employee[];
  attendances: Attendance[];
  payrolls: Payroll[];
}

export const PayrollManagementView: React.FC<Props> = ({
  employees,
  attendances,
  payrolls,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthISO());
  const [generating, setGenerating] = useState(false);
  const [editPayroll, setEditPayroll] = useState<Payroll | null>(null);
  const [bonusInput, setBonusInput] = useState(0);
  const [deductionInput, setDeductionInput] = useState(0);
  const [statusInput, setStatusInput] = useState<PayrollStatus>('Draft');
  const [slipModal, setSlipModal] = useState<Payroll | null>(null);

  const { start, end } = useMemo(
    () => getMonthDateBounds(selectedMonth),
    [selectedMonth]
  );

  const computedRows = useMemo(() => {
    return employees.map((emp) => {
      const empAttendances = attendances.filter(
        (a) =>
          a.employeeId === emp.id &&
          a.date >= start &&
          a.date <= end &&
          (a.status === 'Hadir' || a.status === 'Terlambat')
      );
      const daysPresent = empAttendances.length;
      const daysLate = empAttendances.filter(
        (a) => a.status === 'Terlambat'
      ).length;
      const basePay = empAttendances.reduce(
        (sum, a) => sum + (a.dailyRateSnapshot || emp.dailyRate),
        0
      );
      const existing = payrolls.find(
        (p) => p.employeeId === emp.id && p.periodStart === start
      );

      return {
        employee: emp,
        daysPresent,
        daysLate,
        basePay,
        existing,
        bonus: existing?.bonus ?? 0,
        deduction: existing?.deduction ?? 0,
        totalPay:
          basePay + (existing?.bonus ?? 0) - (existing?.deduction ?? 0),
        status: existing?.status ?? ('Belum Disimpan' as const),
      };
    });
  }, [employees, attendances, payrolls, start, end]);

  const totalPayoutPeriod = computedRows.reduce(
    (sum, r) => sum + Math.max(0, r.totalPay),
    0
  );

  const handleGenerateBatch = async () => {
    setGenerating(true);
    try {
      await upsertPayrollBatch(
        computedRows.map((row) => ({
          employee: row.employee,
          periodKey: selectedMonth,
          periodStart: start,
          periodEnd: end,
          daysPresent: row.daysPresent,
          daysLate: row.daysLate,
          basePay: row.basePay,
          bonus: row.bonus,
          deduction: row.deduction,
          status: row.existing?.status ?? 'Draft',
        })),
        payrolls
      );
    } finally {
      setGenerating(false);
    }
  };

  const openAdjustModal = (p: Payroll) => {
    setEditPayroll(p);
    setBonusInput(p.bonus);
    setDeductionInput(p.deduction);
    setStatusInput(p.status);
  };

  const handleSaveAdjustments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPayroll) return;
    await updatePayrollStatusOrAdjustments(editPayroll, {
      bonus: bonusInput,
      deduction: deductionInput,
      status: statusInput,
    });
    setEditPayroll(null);
  };

  const handleExportCsv = () => {
    const headers = [
      'NIP',
      'Nama Karyawan',
      'Jabatan',
      'Periode',
      'Tarif Harian (Rp)',
      'Hari Masuk',
      'Gaji Pokok (Rp)',
      'Bonus (Rp)',
      'Potongan (Rp)',
      'Total Gaji (Rp)',
      'Status',
    ];
    const rows = computedRows.map((r) => [
      r.employee.nip,
      r.employee.fullName,
      r.employee.positionTitle,
      `${formatDateDDMMMYYYY(start)} - ${formatDateDDMMMYYYY(end)}`,
      r.employee.dailyRate,
      r.daysPresent,
      r.basePay,
      r.bonus,
      r.deduction,
      Math.max(0, r.totalPay),
      r.status,
    ]);
    const csv = [headers, ...rows]
      .map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payroll_NusaHR_${formatMonthYearMMMYYYY(selectedMonth)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Payroll Period Controls & Formula Summary */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Periode Payroll Harian: {formatDateDDMMMYYYY(start)} s/d{' '}
            {formatDateDDMMMYYYY(end)}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {formatRupiah(totalPayoutPeriod)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Rumus otomatis: Tercatat Masuk (Hadir / Terlambat) × Tarif Harian Rp / hari
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            aria-label="Pilih periode bulan payroll"
            className="min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm font-mono bg-white"
          />
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[42px] px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleGenerateBatch}
            disabled={generating || employees.length === 0}
            className="min-h-[42px] px-4 rounded-xl bg-[#062C22] hover:bg-[#09382B] disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>
              {generating ? 'Memproses...' : 'Hitung & Sinkronkan Payroll'}
            </span>
          </button>
        </div>
      </div>

      {/* Payroll Calculation Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4 text-right">Tarif Harian</th>
                <th className="py-3 px-4 text-right">Masuk</th>
                <th className="py-3 px-4 text-right">Gaji Pokok</th>
                <th className="py-3 px-4 text-right">Bonus / Pot.</th>
                <th className="py-3 px-4 text-right">Total Bersih</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {computedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    Belum ada data karyawan untuk dihitung.
                  </td>
                </tr>
              ) : (
                computedRows.map((row) => (
                  <tr
                    key={row.employee.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">
                        {row.employee.fullName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {row.employee.nip} · {row.employee.positionTitle}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      {formatRupiah(row.employee.dailyRate)}/hr
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                      {row.daysPresent} hr
                      {row.daysLate > 0 && (
                        <span className="block text-[11px] font-normal text-amber-700">
                          {row.daysLate} telat
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-800 tabular-nums whitespace-nowrap">
                      {formatRupiah(row.basePay)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums whitespace-nowrap">
                      <span className="text-emerald-700">
                        +{formatRupiah(row.bonus)}
                      </span>
                      <span className="block text-rose-600">
                        -{formatRupiah(row.deduction)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatRupiah(Math.max(0, row.totalPay))}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold ${
                          row.status === 'Dibayarkan'
                            ? 'text-emerald-700'
                            : row.status === 'Disetujui'
                            ? 'text-blue-700'
                            : row.status === 'Draft'
                            ? 'text-amber-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {row.status}
                      </span>
                      {row.existing?.paidDate && (
                        <span className="block text-[11px] font-mono text-slate-500">
                          {formatDateDDMMMYYYY(row.existing.paidDate)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {row.existing ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSlipModal(row.existing!)}
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                            aria-label="Lihat slip gaji"
                            title="Lihat Slip"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openAdjustModal(row.existing!)}
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                            aria-label="Edit bonus/status"
                            title="Sesuaikan"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {row.existing.status !== 'Dibayarkan' && (
                            <button
                              type="button"
                              onClick={() =>
                                updatePayrollStatusOrAdjustments(row.existing!, {
                                  status: 'Dibayarkan',
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Bayar</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Klik Sinkronkan
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

      {/* Adjust Bonus/Deduction/Status Modal */}
      {editPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Penyesuaian Payroll — {editPayroll.employeeName}
              </h3>
              <button
                type="button"
                onClick={() => setEditPayroll(null)}
                className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAdjustments} className="p-6 space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex justify-between text-xs">
                <span className="text-slate-600">
                  Gaji Pokok ({editPayroll.daysPresent} hr ×{' '}
                  {formatRupiah(editPayroll.dailyRate)})
                </span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatRupiah(editPayroll.basePay)}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Bonus / Tunjangan (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={bonusInput}
                  onChange={(e) => setBonusInput(Number(e.target.value))}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Potongan (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={deductionInput}
                  onChange={(e) => setDeductionInput(Number(e.target.value))}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Status Pembayaran
                </label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as PayrollStatus)}
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-sm bg-white"
                >
                  <option value="Draft">Draft</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Dibayarkan">Dibayarkan</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditPayroll(null)}
                  className="min-h-[42px] px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 rounded-xl bg-[#062C22] hover:bg-[#09382B] text-white text-sm font-semibold cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Slip Gaji Modal */}
      {slipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Slip Gaji Harian · NusaHR
                </p>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {slipModal.employeeName}
                </h3>
                <p className="text-xs text-slate-500">
                  {slipModal.employeeNip} · {slipModal.positionTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSlipModal(null)}
                className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Periode</span>
                <span className="font-medium text-slate-900">
                  {slipModal.periodLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tarif Harian</span>
                <span className="font-mono text-slate-900">
                  {formatRupiah(slipModal.dailyRate)} / hari
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Hari Masuk</span>
                <span className="font-mono text-slate-900">
                  {slipModal.daysPresent} hari
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between">
                <span className="text-slate-600">Gaji Pokok Harian</span>
                <span className="font-mono text-slate-900">
                  {formatRupiah(slipModal.basePay)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Bonus / Tunjangan</span>
                <span className="font-mono text-emerald-700">
                  +{formatRupiah(slipModal.bonus)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Potongan</span>
                <span className="font-mono text-rose-600">
                  -{formatRupiah(slipModal.deduction)}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
                <span>Total Gaji Bersih</span>
                <span className="font-mono text-emerald-800">
                  {formatRupiah(slipModal.totalPay)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs text-slate-500">
              <span>
                Status: <strong>{slipModal.status}</strong>
                {slipModal.paidDate
                  ? ` (${formatDateDDMMMYYYY(slipModal.paidDate)})`
                  : ''}
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Cetak Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
