import React, { useState } from 'react';
import { Calendar, Eye, X } from 'lucide-react';
import type { Attendance } from '../../types/hrm';
import {
  formatDateDDMMMYYYY,
  formatDuration,
  formatMonthYearMMMYYYY,
  formatRupiah,
  getCurrentMonthISO,
} from '../../utils/formatters';

interface Props {
  attendances: Attendance[];
}

export const LaporanTab: React.FC<Props> = ({ attendances }) => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthISO());
  const [previewItem, setPreviewItem] = useState<Attendance | null>(null);

  const filtered = attendances.filter((a) => a.date.startsWith(selectedMonth));
  const totalPresent = filtered.filter(
    (a) => a.status === 'Hadir' || a.status === 'Terlambat'
  ).length;
  const totalLate = filtered.filter((a) => a.status === 'Terlambat').length;
  const totalEarned = filtered.reduce((sum, a) => sum + (a.earnedAmount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Period Selector */}
      <section className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-emerald-700" />
          <div>
            <p className="text-xs text-slate-500">Periode Laporan</p>
            <p className="text-sm font-semibold text-slate-900">
              {formatMonthYearMMMYYYY(selectedMonth)}
            </p>
          </div>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          aria-label="Pilih bulan laporan"
          className="min-h-[40px] rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
        />
      </section>

      {/* Summary Strip */}
      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white border border-slate-200 p-3.5">
          <p className="text-[11px] font-medium text-slate-500">Hari Masuk</p>
          <p className="mt-1 font-mono text-xl font-bold text-slate-900 tabular-nums">
            {totalPresent}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-3.5">
          <p className="text-[11px] font-medium text-slate-500">Terlambat</p>
          <p className="mt-1 font-mono text-xl font-bold text-amber-700 tabular-nums">
            {totalLate}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-3.5">
          <p className="text-[11px] font-medium text-slate-500">Total Upah</p>
          <p className="mt-1 font-mono text-base sm:text-lg font-bold text-emerald-700 tabular-nums truncate">
            {formatRupiah(totalEarned)}
          </p>
        </div>
      </section>

      {/* Chronological Attendance List */}
      <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            Rincian Kehadiran Harian
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ketuk baris untuk melihat foto selfie Clock-In & Clock-Out
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            Tidak ada data kehadiran pada periode {formatMonthYearMMMYYYY(selectedMonth)}.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPreviewItem(item)}
                className="w-full text-left px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {formatDateDDMMMYYYY(item.date)}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        item.status === 'Terlambat'
                          ? 'text-amber-700'
                          : item.status === 'Alpa' || item.status === 'Izin'
                          ? 'text-rose-600'
                          : 'text-emerald-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
                    {item.clockInTime || '—'} – {item.clockOutTime || '—'} ·{' '}
                    {formatDuration(item.workDurationMinutes)}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                    {formatRupiah(item.earnedAmount)}
                  </span>
                  <Eye className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Selfie & Detail Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {formatDateDDMMMYYYY(previewItem.date)}
                </h3>
                <p className="text-xs text-slate-500">
                  {previewItem.status} · Upah Harian {formatRupiah(previewItem.earnedAmount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Tutup detail"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">
                  Clock-In ({previewItem.clockInTime || '—'})
                </p>
                {previewItem.clockInPhoto ? (
                  <img
                    src={previewItem.clockInPhoto}
                    alt="Foto selfie Clock-In"
                    referrerPolicy="no-referrer"
                    className="w-full aspect-square object-cover rounded-xl border border-slate-200"
                  />
                ) : (
                  <div className="w-full aspect-square rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                    Tidak ada foto
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">
                  Clock-Out ({previewItem.clockOutTime || 'Belum'})
                </p>
                {previewItem.clockOutPhoto ? (
                  <img
                    src={previewItem.clockOutPhoto}
                    alt="Foto selfie Clock-Out"
                    referrerPolicy="no-referrer"
                    className="w-full aspect-square object-cover rounded-xl border border-slate-200"
                  />
                ) : (
                  <div className="w-full aspect-square rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                    Belum Clock-Out
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 space-y-1">
              <p>Lokasi Masuk: {previewItem.clockInLocation || '—'}</p>
              <p>Catatan: {previewItem.notes || '—'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
