import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  BLUEPRINT_LIMITS,
  WORKSPACE_ID,
  type Attendance,
  type AttendanceStatus,
  type Employee,
  type EmployeePrivateContact,
  type LeaveRequest,
  type LeaveStatus,
  type LeaveType,
  type Payroll,
  type PayrollStatus,
  type Position,
  type WorkSchedule,
} from '../types/hrm';
import {
  computeDurationMinutes,
  formatDateDDMMMYYYY,
  getTodayISO,
  sanitizeId,
} from '../utils/formatters';

const clampStr = (val: string, max: number): string => (val ?? '').trim().slice(0, max);

// --- Subscriptions (All Real-Time Multi-Device Sync) ---
export function subscribePositions(
  onData: (items: Position[]) => void
): Unsubscribe {
  const path = 'positions';
  const q = query(collection(db, path), where('workspaceId', '==', WORKSPACE_ID));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Position);
      list.sort((a, b) => a.title.localeCompare(b.title));
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeWorkSchedules(
  onData: (items: WorkSchedule[]) => void
): Unsubscribe {
  const path = 'workSchedules';
  const q = query(collection(db, path), where('workspaceId', '==', WORKSPACE_ID));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as WorkSchedule);
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeEmployees(
  onData: (items: Employee[]) => void
): Unsubscribe {
  const path = 'employees';
  const q = query(collection(db, path), where('workspaceId', '==', WORKSPACE_ID));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Employee);
      list.sort((a, b) => a.nip.localeCompare(b.nip));
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribePrivateContact(
  employeeId: string,
  onData: (contact: EmployeePrivateContact | null) => void
): Unsubscribe {
  const path = `employees/${employeeId}/private/contact`;
  return onSnapshot(
    doc(db, 'employees', employeeId, 'private', 'contact'),
    (snap) => {
      onData(snap.exists() ? (snap.data() as EmployeePrivateContact) : null);
    },
    () => {
      // Non-owners do not read private contact docs; return null quietly
      onData(null);
    }
  );
}

export async function fetchEmployeePrivateContact(
  employeeId: string
): Promise<EmployeePrivateContact | null> {
  try {
    const snap = await getDoc(doc(db, 'employees', employeeId, 'private', 'contact'));
    return snap.exists() ? (snap.data() as EmployeePrivateContact) : null;
  } catch {
    return null;
  }
}

export function subscribeAttendances(
  onData: (items: Attendance[]) => void
): Unsubscribe {
  const path = 'attendances';
  const q = query(collection(db, path), where('workspaceId', '==', WORKSPACE_ID));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Attendance);
      list.sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.clockInTime.localeCompare(a.clockInTime);
      });
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeLeaveRequests(
  isAdmin: boolean,
  uid: string,
  onData: (items: LeaveRequest[]) => void
): Unsubscribe {
  const path = 'leaveRequests';
  const q = isAdmin
    ? query(collection(db, path), where('workspaceId', '==', WORKSPACE_ID))
    : query(collection(db, path), where('ownerUid', '==', uid));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as LeaveRequest);
      list.sort((a, b) => b.startDate.localeCompare(a.startDate));
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribePayrolls(
  isAdmin: boolean,
  uid: string,
  onData: (items: Payroll[]) => void
): Unsubscribe {
  const path = 'payrolls';
  const q = isAdmin
    ? query(collection(db, path), where('workspaceId', '==', WORKSPACE_ID))
    : query(collection(db, path), where('ownerUid', '==', uid));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Payroll);
      list.sort((a, b) => b.periodStart.localeCompare(a.periodStart));
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

// --- Admin Registration via Workspace Passcode ---
export async function registerAdminWithPasscode(params: {
  uid: string;
  email: string;
  name: string;
  passcode: string;
}): Promise<void> {
  const path = `admins/${params.uid}`;
  try {
    await setDoc(doc(db, 'admins', params.uid), {
      uid: sanitizeId(params.uid),
      email: clampStr(params.email.toLowerCase(), BLUEPRINT_LIMITS.EMAIL_MAX),
      name: clampStr(params.name || 'Manajemen NusaHR', BLUEPRINT_LIMITS.NAME_MAX),
      passcode: clampStr(params.passcode, 64),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// --- Auto-Onboard Any Signed-In Google User into Employee Directory ---
export async function ensureEmployeeProfileForUser(params: {
  uid: string;
  email: string;
  displayName: string;
  preferredName?: string;
  positions: Position[];
}): Promise<void> {
  const empId = sanitizeId(`emp_${params.uid}`);
  const path = `employees/${empId}`;
  try {
    const existingSnap = await getDoc(doc(db, 'employees', empId));
    if (existingSnap.exists()) return;

    // Also check if admin already assigned an employee doc with this ownerUid
    const byOwner = await getDocs(
      query(collection(db, 'employees'), where('ownerUid', '==', params.uid))
    );
    if (!byOwner.empty) return;

    const fallbackPos = params.positions[0] ?? {
      id: 'pos_ops',
      title: 'Finance & Operations',
      department: 'Operations',
      dailyRate: 250000,
    };

    const fullName = clampStr(
      params.preferredName || params.displayName || params.email.split('@')[0] || 'Karyawan NusaHR',
      BLUEPRINT_LIMITS.NAME_MAX
    );

    const suffix = params.uid.slice(0, 4).toUpperCase();
    await setDoc(doc(db, 'employees', empId), {
      id: empId,
      workspaceId: WORKSPACE_ID,
      nip: clampStr(`EMP-2026-${suffix}`, BLUEPRINT_LIMITS.NIP_MAX),
      ownerUid: sanitizeId(params.uid),
      fullName,
      positionId: fallbackPos.id,
      positionTitle: clampStr(fallbackPos.title, BLUEPRINT_LIMITS.TITLE_MAX),
      department: clampStr(fallbackPos.department, BLUEPRINT_LIMITS.DEPARTMENT_MAX),
      dailyRate: fallbackPos.dailyRate,
      joinDate: getTodayISO(),
      status: 'Aktif',
      avatarUrl: '/src/assets/images/avatar_emp_3_1795144881487.jpg',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'employees', empId, 'private', 'contact'), {
      employeeId: empId,
      ownerUid: sanitizeId(params.uid),
      email: clampStr(params.email.toLowerCase(), BLUEPRINT_LIMITS.EMAIL_MAX),
      phone: '',
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// --- Seed Initial Enterprise Data for First-Time Admin ---
export async function seedInitialDataIfNeeded(
  adminUid: string,
  adminEmail: string,
  adminName: string
): Promise<void> {
  try {
    // Ensure workspaceConfig exists for passcode-verified admin onboarding
    const configSnap = await getDoc(doc(db, 'workspaceConfig', 'nusahr'));
    if (!configSnap.exists()) {
      await setDoc(doc(db, 'workspaceConfig', 'nusahr'), {
        id: 'nusahr',
        adminPasscode: 'NUSAHR2026',
        updatedAt: serverTimestamp(),
      });
    }

    const existingPositions = await getDocs(
      query(collection(db, 'positions'), where('workspaceId', '==', WORKSPACE_ID))
    );
    if (!existingPositions.empty) return;

    const batch = writeBatch(db);
    const nowTs = serverTimestamp();

    const positions: Omit<Position, 'createdAt' | 'updatedAt'>[] = [
      {
        id: 'pos_eng',
        workspaceId: WORKSPACE_ID,
        title: 'Software Engineer',
        department: 'Engineering',
        dailyRate: 350000,
        description: 'Pengembangan sistem web, mobile PWA, dan infrastruktur cloud.',
      },
      {
        id: 'pos_design',
        workspaceId: WORKSPACE_ID,
        title: 'UI/UX Product Designer',
        department: 'Product & Design',
        dailyRate: 300000,
        description: 'Perancangan antarmuka fintech dan riset pengalaman pengguna.',
      },
      {
        id: 'pos_ops',
        workspaceId: WORKSPACE_ID,
        title: 'Finance & Operations',
        department: 'Operations',
        dailyRate: 250000,
        description: 'Operasional kantor, verifikasi absensi, dan rekonsiliasi payroll harian.',
      },
    ];

    positions.forEach((p) => {
      batch.set(doc(db, 'positions', p.id), {
        ...p,
        createdAt: nowTs,
        updatedAt: nowTs,
      });
    });

    const schedule: Omit<WorkSchedule, 'createdAt' | 'updatedAt'> = {
      id: 'sched_reguler',
      workspaceId: WORKSPACE_ID,
      name: 'Jam Kerja Reguler Kantor',
      workDays: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
      clockInTime: '08:00',
      clockOutTime: '17:00',
      lateToleranceMinutes: 15,
      holidays: ['2026-12-25', '2026-01-01'],
      isActive: true,
    };

    batch.set(doc(db, 'workSchedules', schedule.id), {
      ...schedule,
      createdAt: nowTs,
      updatedAt: nowTs,
    });

    await batch.commit();

    const batchEmployees = writeBatch(db);
    const safeAdminName = clampStr(adminName || 'Yoga Pratama', BLUEPRINT_LIMITS.NAME_MAX);
    const safeAdminEmail = clampStr((adminEmail || '').toLowerCase(), BLUEPRINT_LIMITS.EMAIL_MAX);

    const employeesSeed = [
      {
        id: 'emp_001',
        workspaceId: WORKSPACE_ID,
        nip: 'EMP-2026-001',
        ownerUid: adminUid,
        fullName: safeAdminName,
        email: safeAdminEmail,
        phone: '0812-3456-7890',
        positionId: 'pos_eng',
        positionTitle: 'Software Engineer',
        department: 'Engineering',
        dailyRate: 350000,
        joinDate: '2026-01-12',
        status: 'Aktif' as const,
        avatarUrl: '/src/assets/images/avatar_emp_1_1795144880470.jpg',
      },
      {
        id: 'emp_002',
        workspaceId: WORKSPACE_ID,
        nip: 'EMP-2026-002',
        ownerUid: '',
        fullName: 'Siti Rahmawati',
        email: 'siti.rahmawati@nusahr.id',
        phone: '0813-9876-5432',
        positionId: 'pos_design',
        positionTitle: 'UI/UX Product Designer',
        department: 'Product & Design',
        dailyRate: 300000,
        joinDate: '2026-03-02',
        status: 'Aktif' as const,
        avatarUrl: '/src/assets/images/avatar_emp_2_1795144881033.jpg',
      },
      {
        id: 'emp_003',
        workspaceId: WORKSPACE_ID,
        nip: 'EMP-2026-003',
        ownerUid: '',
        fullName: 'Ahmad Fauzi',
        email: 'ahmad.fauzi@nusahr.id',
        phone: '0856-1122-3344',
        positionId: 'pos_ops',
        positionTitle: 'Finance & Operations',
        department: 'Operations',
        dailyRate: 250000,
        joinDate: '2026-05-18',
        status: 'Aktif' as const,
        avatarUrl: '/src/assets/images/avatar_emp_3_1795144881487.jpg',
      },
    ];

    employeesSeed.forEach(({ email: _e, phone: _p, ...publicEmp }) => {
      batchEmployees.set(doc(db, 'employees', publicEmp.id), {
        ...publicEmp,
        createdAt: nowTs,
        updatedAt: nowTs,
      });
    });

    await batchEmployees.commit();

    const batchContacts = writeBatch(db);
    employeesSeed.forEach((emp) => {
      batchContacts.set(doc(db, 'employees', emp.id, 'private', 'contact'), {
        employeeId: emp.id,
        ownerUid: emp.ownerUid,
        email: emp.email,
        phone: emp.phone,
        updatedAt: nowTs,
      });
    });
    await batchContacts.commit();

    const batchAttendances = writeBatch(db);

    const sampleAttendances: Omit<Attendance, 'createdAt' | 'updatedAt'>[] = [
      {
        id: 'emp_001_2026-11-13',
        workspaceId: WORKSPACE_ID,
        employeeId: 'emp_001',
        ownerUid: adminUid,
        employeeName: safeAdminName,
        employeeNip: 'EMP-2026-001',
        positionTitle: 'Software Engineer',
        date: '2026-11-13',
        clockInTime: '07:52',
        clockOutTime: '17:08',
        clockInPhoto: '/src/assets/images/avatar_emp_1_1795144880470.jpg',
        clockOutPhoto: '/src/assets/images/avatar_emp_1_1795144880470.jpg',
        clockInLocation: 'Kantor Pusat Jakarta · Terverifikasi',
        clockOutLocation: 'Kantor Pusat Jakarta · Terverifikasi',
        status: 'Hadir',
        dailyRateSnapshot: 350000,
        earnedAmount: 350000,
        workDurationMinutes: 556,
        notes: 'Presensi tepat waktu',
      },
      {
        id: 'emp_001_2026-11-16',
        workspaceId: WORKSPACE_ID,
        employeeId: 'emp_001',
        ownerUid: adminUid,
        employeeName: safeAdminName,
        employeeNip: 'EMP-2026-001',
        positionTitle: 'Software Engineer',
        date: '2026-11-16',
        clockInTime: '08:04',
        clockOutTime: '17:15',
        clockInPhoto: '/src/assets/images/avatar_emp_1_1795144880470.jpg',
        clockOutPhoto: '/src/assets/images/avatar_emp_1_1795144880470.jpg',
        clockInLocation: 'Kantor Pusat Jakarta · Terverifikasi',
        clockOutLocation: 'Kantor Pusat Jakarta · Terverifikasi',
        status: 'Hadir',
        dailyRateSnapshot: 350000,
        earnedAmount: 350000,
        workDurationMinutes: 551,
        notes: 'Dalam batas toleransi',
      },
      {
        id: 'emp_001_2026-11-17',
        workspaceId: WORKSPACE_ID,
        employeeId: 'emp_001',
        ownerUid: adminUid,
        employeeName: safeAdminName,
        employeeNip: 'EMP-2026-001',
        positionTitle: 'Software Engineer',
        date: '2026-11-17',
        clockInTime: '08:22',
        clockOutTime: '17:30',
        clockInPhoto: '/src/assets/images/avatar_emp_1_1795144880470.jpg',
        clockOutPhoto: '/src/assets/images/avatar_emp_1_1795144880470.jpg',
        clockInLocation: 'Kantor Pusat Jakarta · Terverifikasi',
        clockOutLocation: 'Kantor Pusat Jakarta · Terverifikasi',
        status: 'Terlambat',
        dailyRateSnapshot: 350000,
        earnedAmount: 350000,
        workDurationMinutes: 548,
        notes: 'Terlambat 7 menit dari batas toleransi',
      },
      {
        id: 'emp_002_2026-11-13',
        workspaceId: WORKSPACE_ID,
        employeeId: 'emp_002',
        ownerUid: adminUid,
        employeeName: 'Siti Rahmawati',
        employeeNip: 'EMP-2026-002',
        positionTitle: 'UI/UX Product Designer',
        date: '2026-11-13',
        clockInTime: '07:58',
        clockOutTime: '17:02',
        clockInPhoto: '/src/assets/images/avatar_emp_2_1795144881033.jpg',
        clockOutPhoto: '/src/assets/images/avatar_emp_2_1795144881033.jpg',
        clockInLocation: 'Kantor Pusat Jakarta · Terverifikasi',
        clockOutLocation: 'Kantor Pusat Jakarta · Terverifikasi',
        status: 'Hadir',
        dailyRateSnapshot: 300000,
        earnedAmount: 300000,
        workDurationMinutes: 544,
        notes: 'Presensi tepat waktu',
      },
      {
        id: 'emp_003_2026-11-13',
        workspaceId: WORKSPACE_ID,
        employeeId: 'emp_003',
        ownerUid: adminUid,
        employeeName: 'Ahmad Fauzi',
        employeeNip: 'EMP-2026-003',
        positionTitle: 'Finance & Operations',
        date: '2026-11-13',
        clockInTime: '07:45',
        clockOutTime: '17:00',
        clockInPhoto: '/src/assets/images/avatar_emp_3_1795144881487.jpg',
        clockOutPhoto: '/src/assets/images/avatar_emp_3_1795144881487.jpg',
        clockInLocation: 'Kantor Pusat Jakarta · Terverifikasi',
        clockOutLocation: 'Kantor Pusat Jakarta · Terverifikasi',
        status: 'Hadir',
        dailyRateSnapshot: 250000,
        earnedAmount: 250000,
        workDurationMinutes: 555,
        notes: 'Presensi tepat waktu',
      },
    ];

    sampleAttendances.forEach((a) => {
      batchAttendances.set(doc(db, 'attendances', a.id), {
        ...a,
        createdAt: nowTs,
        updatedAt: nowTs,
      });
    });

    await batchAttendances.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seed_initial_data');
  }
}

// --- Positions CRUD ---
export async function savePosition(
  pos: Omit<Position, 'workspaceId' | 'createdAt' | 'updatedAt'>,
  isNew: boolean
): Promise<void> {
  const id = sanitizeId(pos.id);
  const path = `positions/${id}`;
  try {
    if (isNew) {
      await setDoc(doc(db, 'positions', id), {
        id,
        workspaceId: WORKSPACE_ID,
        title: clampStr(pos.title, BLUEPRINT_LIMITS.TITLE_MAX),
        department: clampStr(pos.department, BLUEPRINT_LIMITS.DEPARTMENT_MAX),
        dailyRate: Math.max(0, Math.round(Number(pos.dailyRate) || 0)),
        description: clampStr(pos.description, BLUEPRINT_LIMITS.DESCRIPTION_MAX),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'positions', id), {
        title: clampStr(pos.title, BLUEPRINT_LIMITS.TITLE_MAX),
        department: clampStr(pos.department, BLUEPRINT_LIMITS.DEPARTMENT_MAX),
        dailyRate: Math.max(0, Math.round(Number(pos.dailyRate) || 0)),
        description: clampStr(pos.description, BLUEPRINT_LIMITS.DESCRIPTION_MAX),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function removePosition(id: string): Promise<void> {
  const path = `positions/${id}`;
  try {
    await deleteDoc(doc(db, 'positions', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- Employees CRUD (Public Directory + Isolated Private Contact) ---
export async function saveEmployee(
  emp: Omit<Employee, 'workspaceId' | 'createdAt' | 'updatedAt'>,
  isNew: boolean
): Promise<void> {
  const id = sanitizeId(emp.id);
  const path = `employees/${id}`;
  const publicPayload = {
    nip: clampStr(emp.nip, BLUEPRINT_LIMITS.NIP_MAX),
    ownerUid: clampStr(emp.ownerUid, BLUEPRINT_LIMITS.ID_MAX),
    fullName: clampStr(emp.fullName, BLUEPRINT_LIMITS.NAME_MAX),
    positionId: sanitizeId(emp.positionId),
    positionTitle: clampStr(emp.positionTitle, BLUEPRINT_LIMITS.TITLE_MAX),
    department: clampStr(emp.department, BLUEPRINT_LIMITS.DEPARTMENT_MAX),
    dailyRate: Math.max(0, Math.round(Number(emp.dailyRate) || 0)),
    joinDate: clampStr(emp.joinDate, 10),
    status: emp.status,
    avatarUrl: clampStr(emp.avatarUrl, BLUEPRINT_LIMITS.AVATAR_MAX),
    updatedAt: serverTimestamp(),
  };

  try {
    if (isNew) {
      await setDoc(doc(db, 'employees', id), {
        id,
        workspaceId: WORKSPACE_ID,
        ...publicPayload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'employees', id), publicPayload);
    }

    await setDoc(doc(db, 'employees', id, 'private', 'contact'), {
      employeeId: id,
      ownerUid: clampStr(emp.ownerUid, BLUEPRINT_LIMITS.ID_MAX),
      email: clampStr((emp.email || 'karyawan@nusahr.id').toLowerCase(), BLUEPRINT_LIMITS.EMAIL_MAX),
      phone: clampStr(emp.phone || '', BLUEPRINT_LIMITS.PHONE_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function updateEmployeeOwnContact(
  employeeId: string,
  ownerUid: string,
  email: string,
  phone: string,
  avatarUrl: string,
  fullName?: string
): Promise<void> {
  const path = `employees/${employeeId}`;
  try {
    const updates: Record<string, unknown> = {
      avatarUrl: clampStr(avatarUrl, BLUEPRINT_LIMITS.AVATAR_MAX),
      updatedAt: serverTimestamp(),
    };
    if (fullName) {
      updates.fullName = clampStr(fullName, BLUEPRINT_LIMITS.NAME_MAX);
    }
    await updateDoc(doc(db, 'employees', employeeId), updates);

    await setDoc(doc(db, 'employees', employeeId, 'private', 'contact'), {
      employeeId,
      ownerUid: clampStr(ownerUid, BLUEPRINT_LIMITS.ID_MAX),
      email: clampStr(email.toLowerCase(), BLUEPRINT_LIMITS.EMAIL_MAX),
      phone: clampStr(phone, BLUEPRINT_LIMITS.PHONE_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function removeEmployee(id: string): Promise<void> {
  const path = `employees/${id}`;
  try {
    await deleteDoc(doc(db, 'employees', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- Work Schedules CRUD ---
export async function saveWorkSchedule(
  sched: Omit<WorkSchedule, 'workspaceId' | 'createdAt' | 'updatedAt'>,
  isNew: boolean
): Promise<void> {
  const id = sanitizeId(sched.id);
  const path = `workSchedules/${id}`;
  const payload = {
    name: clampStr(sched.name, BLUEPRINT_LIMITS.TITLE_MAX),
    workDays: sched.workDays.slice(0, 7),
    clockInTime: clampStr(sched.clockInTime, 5),
    clockOutTime: clampStr(sched.clockOutTime, 5),
    lateToleranceMinutes: Math.max(0, Math.min(180, Math.round(Number(sched.lateToleranceMinutes) || 0))),
    holidays: sched.holidays.slice(0, BLUEPRINT_LIMITS.HOLIDAYS_MAX),
    isActive: Boolean(sched.isActive),
    updatedAt: serverTimestamp(),
  };

  try {
    if (isNew) {
      await setDoc(doc(db, 'workSchedules', id), {
        id,
        workspaceId: WORKSPACE_ID,
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'workSchedules', id), payload);
    }
  } catch (err) {
    handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

// --- Attendances: Clock-In, Clock-Out, and Admin Correction ---
export async function clockInEmployee(params: {
  employee: Employee;
  date: string;
  clockInTime: string;
  selfiePhoto: string;
  location: string;
  status: AttendanceStatus;
  notes: string;
  actorUid: string;
}): Promise<void> {
  const docId = sanitizeId(`${params.employee.id}_${params.date}`);
  const path = `attendances/${docId}`;
  const ownerUid = params.employee.ownerUid || params.actorUid;

  try {
    await setDoc(doc(db, 'attendances', docId), {
      id: docId,
      workspaceId: WORKSPACE_ID,
      employeeId: params.employee.id,
      ownerUid: clampStr(ownerUid, BLUEPRINT_LIMITS.ID_MAX),
      employeeName: clampStr(params.employee.fullName, BLUEPRINT_LIMITS.NAME_MAX),
      employeeNip: clampStr(params.employee.nip, BLUEPRINT_LIMITS.NIP_MAX),
      positionTitle: clampStr(params.employee.positionTitle, BLUEPRINT_LIMITS.TITLE_MAX),
      date: clampStr(params.date, 10),
      clockInTime: clampStr(params.clockInTime, 10),
      clockOutTime: '',
      clockInPhoto: clampStr(params.selfiePhoto, BLUEPRINT_LIMITS.PHOTO_MAX),
      clockOutPhoto: '',
      clockInLocation: clampStr(params.location, BLUEPRINT_LIMITS.LOCATION_MAX),
      clockOutLocation: '',
      status: params.status,
      dailyRateSnapshot: params.employee.dailyRate,
      earnedAmount: params.status === 'Hadir' || params.status === 'Terlambat' ? params.employee.dailyRate : 0,
      workDurationMinutes: 0,
      notes: clampStr(params.notes, BLUEPRINT_LIMITS.NOTES_MAX),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function clockOutEmployee(params: {
  attendance: Attendance;
  clockOutTime: string;
  selfiePhoto: string;
  location: string;
  notes?: string;
}): Promise<void> {
  const path = `attendances/${params.attendance.id}`;
  const duration = computeDurationMinutes(params.attendance.clockInTime, params.clockOutTime);
  try {
    await updateDoc(doc(db, 'attendances', params.attendance.id), {
      clockOutTime: clampStr(params.clockOutTime, 10),
      clockOutPhoto: clampStr(params.selfiePhoto, BLUEPRINT_LIMITS.PHOTO_MAX),
      clockOutLocation: clampStr(params.location, BLUEPRINT_LIMITS.LOCATION_MAX),
      workDurationMinutes: duration,
      notes: clampStr(params.notes ?? params.attendance.notes, BLUEPRINT_LIMITS.NOTES_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function saveAdminAttendance(params: {
  employee: Employee;
  date: string;
  clockInTime: string;
  clockOutTime: string;
  status: AttendanceStatus;
  notes: string;
  existing?: Attendance;
}): Promise<void> {
  const docId = params.existing ? params.existing.id : sanitizeId(`${params.employee.id}_${params.date}`);
  const path = `attendances/${docId}`;
  const isPresent = params.status === 'Hadir' || params.status === 'Terlambat';
  const duration = computeDurationMinutes(params.clockInTime, params.clockOutTime);
  const earned = isPresent ? params.employee.dailyRate : 0;

  try {
    if (!params.existing) {
      await setDoc(doc(db, 'attendances', docId), {
        id: docId,
        workspaceId: WORKSPACE_ID,
        employeeId: params.employee.id,
        ownerUid: clampStr(params.employee.ownerUid || 'admin_entry', BLUEPRINT_LIMITS.ID_MAX),
        employeeName: clampStr(params.employee.fullName, BLUEPRINT_LIMITS.NAME_MAX),
        employeeNip: clampStr(params.employee.nip, BLUEPRINT_LIMITS.NIP_MAX),
        positionTitle: clampStr(params.employee.positionTitle, BLUEPRINT_LIMITS.TITLE_MAX),
        date: clampStr(params.date, 10),
        clockInTime: clampStr(params.clockInTime, 10),
        clockOutTime: clampStr(params.clockOutTime, 10),
        clockInPhoto: '',
        clockOutPhoto: '',
        clockInLocation: 'Input Backoffice Admin',
        clockOutLocation: params.clockOutTime ? 'Input Backoffice Admin' : '',
        status: params.status,
        dailyRateSnapshot: params.employee.dailyRate,
        earnedAmount: earned,
        workDurationMinutes: duration,
        notes: clampStr(params.notes, BLUEPRINT_LIMITS.NOTES_MAX),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'attendances', docId), {
        clockInTime: clampStr(params.clockInTime, 10),
        clockOutTime: clampStr(params.clockOutTime, 10),
        status: params.status,
        dailyRateSnapshot: params.employee.dailyRate,
        earnedAmount: earned,
        workDurationMinutes: duration,
        notes: clampStr(params.notes, BLUEPRINT_LIMITS.NOTES_MAX),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, params.existing ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function removeAttendance(id: string): Promise<void> {
  const path = `attendances/${id}`;
  try {
    await deleteDoc(doc(db, 'attendances', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- Leave Requests (Mobile Izin / Sakit / Cuti) ---
export async function submitLeaveRequest(params: {
  employee: Employee;
  ownerUid: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}): Promise<void> {
  const id = sanitizeId(`leave_${params.employee.id}_${Date.now()}`);
  const path = `leaveRequests/${id}`;
  try {
    await setDoc(doc(db, 'leaveRequests', id), {
      id,
      workspaceId: WORKSPACE_ID,
      employeeId: params.employee.id,
      ownerUid: clampStr(params.ownerUid, BLUEPRINT_LIMITS.ID_MAX),
      employeeName: clampStr(params.employee.fullName, BLUEPRINT_LIMITS.NAME_MAX),
      leaveType: params.leaveType,
      startDate: clampStr(params.startDate, 10),
      endDate: clampStr(params.endDate, 10),
      reason: clampStr(params.reason, BLUEPRINT_LIMITS.REASON_MAX),
      status: 'Menunggu' as LeaveStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateLeaveRequestStatus(
  id: string,
  status: LeaveStatus
): Promise<void> {
  const path = `leaveRequests/${id}`;
  try {
    await updateDoc(doc(db, 'leaveRequests', id), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// --- Payrolls: Daily-Rate Calculation & Settlement ---
export async function upsertPayrollBatch(
  entries: {
    employee: Employee;
    periodKey: string;
    periodStart: string;
    periodEnd: string;
    daysPresent: number;
    daysLate: number;
    basePay: number;
    bonus: number;
    deduction: number;
    status: PayrollStatus;
  }[],
  existingPayrolls: Payroll[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    const nowTs = serverTimestamp();

    for (const item of entries) {
      const id = sanitizeId(`pay_${item.employee.id}_${item.periodKey}`);
      const prev = existingPayrolls.find((p) => p.id === id);
      const totalPay = Math.max(0, item.basePay + item.bonus - item.deduction);
      const periodLabel = `${formatDateDDMMMYYYY(item.periodStart)} s/d ${formatDateDDMMMYYYY(item.periodEnd)}`;

      if (!prev) {
        batch.set(doc(db, 'payrolls', id), {
          id,
          workspaceId: WORKSPACE_ID,
          employeeId: item.employee.id,
          ownerUid: clampStr(item.employee.ownerUid, BLUEPRINT_LIMITS.ID_MAX),
          employeeName: clampStr(item.employee.fullName, BLUEPRINT_LIMITS.NAME_MAX),
          employeeNip: clampStr(item.employee.nip, BLUEPRINT_LIMITS.NIP_MAX),
          positionTitle: clampStr(item.employee.positionTitle, BLUEPRINT_LIMITS.TITLE_MAX),
          periodLabel: clampStr(periodLabel, 50),
          periodStart: item.periodStart,
          periodEnd: item.periodEnd,
          dailyRate: item.employee.dailyRate,
          daysPresent: item.daysPresent,
          daysLate: item.daysLate,
          basePay: item.basePay,
          bonus: item.bonus,
          deduction: item.deduction,
          totalPay,
          status: item.status,
          paidDate: item.status === 'Dibayarkan' ? getTodayISO() : '',
          createdAt: nowTs,
          updatedAt: nowTs,
        });
      } else {
        batch.update(doc(db, 'payrolls', id), {
          ownerUid: clampStr(item.employee.ownerUid, BLUEPRINT_LIMITS.ID_MAX),
          employeeName: clampStr(item.employee.fullName, BLUEPRINT_LIMITS.NAME_MAX),
          employeeNip: clampStr(item.employee.nip, BLUEPRINT_LIMITS.NIP_MAX),
          positionTitle: clampStr(item.employee.positionTitle, BLUEPRINT_LIMITS.TITLE_MAX),
          periodLabel: clampStr(periodLabel, 50),
          periodStart: item.periodStart,
          periodEnd: item.periodEnd,
          dailyRate: item.employee.dailyRate,
          daysPresent: item.daysPresent,
          daysLate: item.daysLate,
          basePay: item.basePay,
          bonus: item.bonus,
          deduction: item.deduction,
          totalPay,
          status: item.status,
          paidDate: item.status === 'Dibayarkan' ? prev.paidDate || getTodayISO() : '',
          updatedAt: nowTs,
        });
      }
    }

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'payrolls_batch');
  }
}

export async function updatePayrollStatusOrAdjustments(
  payroll: Payroll,
  updates: {
    bonus?: number;
    deduction?: number;
    status?: PayrollStatus;
  }
): Promise<void> {
  const path = `payrolls/${payroll.id}`;
  const bonus = updates.bonus !== undefined ? Math.max(0, Math.round(updates.bonus)) : payroll.bonus;
  const deduction =
    updates.deduction !== undefined ? Math.max(0, Math.round(updates.deduction)) : payroll.deduction;
  const status = updates.status ?? payroll.status;
  const totalPay = Math.max(0, payroll.basePay + bonus - deduction);
  const paidDate = status === 'Dibayarkan' ? payroll.paidDate || getTodayISO() : '';

  try {
    await updateDoc(doc(db, 'payrolls', payroll.id), {
      bonus,
      deduction,
      totalPay,
      status,
      paidDate,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}
