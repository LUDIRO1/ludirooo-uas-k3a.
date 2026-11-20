const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const DAYS_ID = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;

/**
 * Formats a YYYY-MM-DD string or Date object strictly into DD-MMM-YYYY (e.g. 13-Nov-2026).
 */
export function formatDateDDMMMYYYY(input: string | Date | null | undefined): string {
  if (!input) return '—';
  let year: number;
  let monthIdx: number;
  let day: number;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return '—';
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
    if (isoMatch) {
      year = Number(isoMatch[1]);
      monthIdx = Number(isoMatch[2]) - 1;
      day = Number(isoMatch[3]);
    } else {
      const parsed = new Date(trimmed);
      if (Number.isNaN(parsed.getTime())) return trimmed;
      year = parsed.getFullYear();
      monthIdx = parsed.getMonth();
      day = parsed.getDate();
    }
  } else {
    if (Number.isNaN(input.getTime())) return '—';
    year = input.getFullYear();
    monthIdx = input.getMonth();
    day = input.getDate();
  }

  if (monthIdx < 0 || monthIdx > 11) return '—';
  const dd = String(day).padStart(2, '0');
  const mmm = MONTHS_SHORT[monthIdx];
  return `${dd}-${mmm}-${year}`;
}

export function formatMonthYearMMMYYYY(yearMonth: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(yearMonth);
  if (!match) return yearMonth;
  const year = match[1];
  const monthIdx = Number(match[2]) - 1;
  if (monthIdx < 0 || monthIdx > 11) return yearMonth;
  return `${MONTHS_SHORT[monthIdx]}-${year}`;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getMonthDateBounds(yearMonth: string): { start: string; end: string } {
  const [yStr, mStr] = yearMonth.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    start: `${yStr}-${mStr}-01`,
    end: `${yStr}-${mStr}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function getCurrentTimeHHMM(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function getCurrentTimeHHMMSS(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function getIndonesianDayName(input: string | Date = new Date()): string {
  let d: Date;
  if (typeof input === 'string') {
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
    d = iso ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])) : new Date(input);
  } else {
    d = input;
  }
  return DAYS_ID[d.getDay()] ?? 'Senin';
}

export function formatRupiah(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `Rp ${safe.toLocaleString('id-ID')}`;
}

export function computeDurationMinutes(clockInTime: string, clockOutTime: string): number {
  if (!clockInTime || !clockOutTime) return 0;
  const [inH, inM] = clockInTime.split(':').map(Number);
  const [outH, outM] = clockOutTime.split(':').map(Number);
  if ([inH, inM, outH, outM].some((n) => Number.isNaN(n))) return 0;
  const startTotal = inH * 60 + inM;
  const endTotal = outH * 60 + outM;
  return Math.max(0, endTotal - startTotal);
}

export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '—';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}j ${mins}m`;
}

export function isLateClockIn(
  clockInTime: string,
  scheduleInTime: string,
  toleranceMinutes: number
): boolean {
  const [cH, cM] = clockInTime.split(':').map(Number);
  const [sH, sM] = scheduleInTime.split(':').map(Number);
  if ([cH, cM, sH, sM].some((n) => Number.isNaN(n))) return false;
  return cH * 60 + cM > sH * 60 + sM + toleranceMinutes;
}

export function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128) || `id_${Date.now()}`;
}
