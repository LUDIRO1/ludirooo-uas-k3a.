export type EmployeeStatus = 'Aktif' | 'Nonaktif';
export type AttendanceStatus = 'Hadir' | 'Terlambat' | 'Izin' | 'Alpa';
export type PayrollStatus = 'Draft' | 'Disetujui' | 'Dibayarkan';
export type LeaveType = 'Izin' | 'Sakit' | 'Cuti';
export type LeaveStatus = 'Menunggu' | 'Disetujui' | 'Ditolak';
export type AppMode = 'pwa' | 'admin';

export const WORKSPACE_ID = 'NUSAHR-CORP';

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  passcode?: string;
  createdAt?: unknown;
}

export interface Position {
  id: string;
  workspaceId: string;
  title: string;
  department: string;
  dailyRate: number;
  description: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Employee {
  id: string;
  workspaceId: string;
  nip: string;
  ownerUid: string;
  fullName: string;
  email?: string; // Hydrated from private/contact when authorized
  phone?: string; // Hydrated from private/contact when authorized
  positionId: string;
  positionTitle: string;
  department: string;
  dailyRate: number;
  joinDate: string; // YYYY-MM-DD
  status: EmployeeStatus;
  avatarUrl: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface EmployeePrivateContact {
  employeeId: string;
  ownerUid: string;
  email: string;
  phone: string;
  updatedAt?: unknown;
}

export interface WorkSchedule {
  id: string;
  workspaceId: string;
  name: string;
  workDays: string[];
  clockInTime: string; // HH:mm
  clockOutTime: string; // HH:mm
  lateToleranceMinutes: number;
  holidays: string[]; // YYYY-MM-DD[]
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Attendance {
  id: string;
  workspaceId: string;
  employeeId: string;
  ownerUid: string;
  employeeName: string;
  employeeNip: string;
  positionTitle: string;
  date: string; // YYYY-MM-DD
  clockInTime: string; // HH:mm
  clockOutTime: string; // HH:mm or ''
  clockInPhoto: string; // base64 JPEG data URL
  clockOutPhoto: string; // base64 JPEG data URL or ''
  clockInLocation: string;
  clockOutLocation: string;
  status: AttendanceStatus;
  dailyRateSnapshot: number;
  earnedAmount: number;
  workDurationMinutes: number;
  notes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LeaveRequest {
  id: string;
  workspaceId: string;
  employeeId: string;
  ownerUid: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  status: LeaveStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Payroll {
  id: string;
  workspaceId: string;
  employeeId: string;
  ownerUid: string;
  employeeName: string;
  employeeNip: string;
  positionTitle: string;
  periodLabel: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  dailyRate: number;
  daysPresent: number;
  daysLate: number;
  basePay: number;
  bonus: number;
  deduction: number;
  totalPay: number;
  status: PayrollStatus;
  paidDate: string; // YYYY-MM-DD or ''
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const BLUEPRINT_LIMITS = {
  ID_MAX: 128,
  NIP_MAX: 30,
  NAME_MAX: 100,
  EMAIL_MAX: 120,
  PHONE_MAX: 30,
  TITLE_MAX: 80,
  DEPARTMENT_MAX: 80,
  DESCRIPTION_MAX: 300,
  NOTES_MAX: 250,
  REASON_MAX: 250,
  LOCATION_MAX: 120,
  PHOTO_MAX: 250000,
  AVATAR_MAX: 150000,
  HOLIDAYS_MAX: 50,
  ID_REGEX: /^[a-zA-Z0-9_-]+$/,
  TIME_REGEX: /^([01]\d|2[0-3]):[0-5]\d$/,
  DATE_ISO_REGEX: /^\d{4}-\d{2}-\d{2}$/,
} as const;
