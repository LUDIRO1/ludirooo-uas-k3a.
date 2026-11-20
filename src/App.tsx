import { useEffect, useRef, useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LoginPortalView } from './components/admin/LoginPortalView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineIndicator } from './components/OfflineIndicator';
import { EmployeePWA } from './components/pwa/EmployeePWA';
import { auth, db, googleProvider } from './firebase';
import {
  ensureEmployeeProfileForUser,
  registerAdminWithPasscode,
  seedInitialDataIfNeeded,
  subscribeAttendances,
  subscribeEmployees,
  subscribeLeaveRequests,
  subscribePayrolls,
  subscribePositions,
  subscribePrivateContact,
  subscribeWorkSchedules,
} from './services/hrmService';
import type {
  AppMode,
  Attendance,
  Employee,
  EmployeePrivateContact,
  LeaveRequest,
  Payroll,
  Position,
  WorkSchedule,
} from './types/hrm';

const BOOTSTRAP_ADMIN_EMAIL = 'yogajepara999@gmail.com';

function getInitialPortalFromUrl(): AppMode {
  if (typeof window === 'undefined') return 'pwa';
  const params = new URLSearchParams(window.location.search);
  const p = params.get('portal')?.toLowerCase();
  if (p === 'admin' || window.location.pathname.startsWith('/admin')) {
    return 'admin';
  }
  return 'pwa';
}

function MainApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const [mode, setMode] = useState<AppMode>(() => getInitialPortalFromUrl());
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [gatePasscode, setGatePasscode] = useState('NUSAHR2026');
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  const selectPortal = (next: AppMode) => {
    setMode(next);
    setLoginError(null);
    setGateError(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('portal', next === 'admin' ? 'admin' : 'karyawan');
      window.history.replaceState(null, '', url.toString());
    }
  };

  const pendingLoginIntent = useRef<{
    targetPortal: 'admin' | 'pwa';
    preferredName: string;
    adminPasscode: string;
  } | null>(null);

  const [positions, setPositions] = useState<Position[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [privateContact, setPrivateContact] =
    useState<EmployeePrivateContact | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const onboardedUidRef = useRef<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setRoleChecked(false);

      if (!firebaseUser) {
        setIsAdmin(false);
        setPositions([]);
        setEmployees([]);
        setSchedules([]);
        setAttendances([]);
        setLeaveRequests([]);
        setPayrolls([]);
        setPrivateContact(null);
        onboardedUidRef.current = null;
        setDataLoading(false);
        setAuthReady(true);
        setRoleChecked(true);
        return;
      }

      let adminFlag = false;
      if (
        firebaseUser.emailVerified &&
        firebaseUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL
      ) {
        adminFlag = true;
      } else {
        try {
          const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
          adminFlag = adminSnap.exists();
        } catch {
          adminFlag = false;
        }
      }

      // If user clicked Portal Admin login with a passcode and isn't admin yet, register them
      const intent = pendingLoginIntent.current;
      if (!adminFlag && intent?.targetPortal === 'admin' && intent.adminPasscode) {
        try {
          await registerAdminWithPasscode({
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            name: intent.preferredName || firebaseUser.displayName || 'Manajemen NusaHR',
            passcode: intent.adminPasscode,
          });
          adminFlag = true;
          setLoginError(null);
          setGateError(null);
        } catch {
          setGateError(
            'Kode akses manajemen tidak valid. Masukkan kode akses Portal Admin yang benar.'
          );
        }
      }

      setIsAdmin(adminFlag);
      if (intent) {
        selectPortal(intent.targetPortal);
      }

      setAuthReady(true);
      setRoleChecked(true);
    });

    return () => unsub();
  }, []);

  // Subscribe to real-time Firestore collections
  useEffect(() => {
    if (!authReady || !roleChecked || !user) return;

    setDataLoading(true);
    let active = true;

    const initAndSubscribe = async () => {
      if (isAdmin) {
        await seedInitialDataIfNeeded(
          user.uid,
          user.email ?? BOOTSTRAP_ADMIN_EMAIL,
          user.displayName ?? 'Yoga Pratama'
        );
      }

      if (!active) return;

      const unsubPos = subscribePositions(setPositions);
      const unsubSched = subscribeWorkSchedules(setSchedules);
      const unsubEmp = subscribeEmployees((list) => {
        setEmployees(list);
        setDataLoading(false);
      });
      const unsubAtt = subscribeAttendances(setAttendances);
      const unsubLeaves = subscribeLeaveRequests(
        isAdmin,
        user.uid,
        setLeaveRequests
      );
      const unsubPay = subscribePayrolls(isAdmin, user.uid, setPayrolls);

      return () => {
        unsubPos();
        unsubSched();
        unsubEmp();
        unsubAtt();
        unsubLeaves();
        unsubPay();
      };
    };

    let cleanupFn: (() => void) | undefined;
    initAndSubscribe().then((fn) => {
      cleanupFn = fn;
    });

    return () => {
      active = false;
      cleanupFn?.();
    };
  }, [authReady, roleChecked, user, isAdmin]);

  // Auto-onboard any signed-in user into the employee directory if they don't have a record yet
  useEffect(() => {
    if (!user || !user.emailVerified || dataLoading) return;
    if (onboardedUidRef.current === user.uid) return;

    const existingMine = employees.find((e) => e.ownerUid === user.uid);
    if (existingMine) {
      onboardedUidRef.current = user.uid;
      return;
    }

    onboardedUidRef.current = user.uid;
    ensureEmployeeProfileForUser({
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      preferredName: pendingLoginIntent.current?.preferredName,
      positions,
    });
  }, [user, dataLoading, employees, positions]);

  const currentEmployee =
    employees.find((e) => e.ownerUid === user?.uid) ??
    (isAdmin ? employees[0] : undefined);

  // Subscribe to isolated private contact for the current employee
  useEffect(() => {
    if (!currentEmployee) return;
    const unsub = subscribePrivateContact(currentEmployee.id, setPrivateContact);
    return () => unsub();
  }, [currentEmployee]);

  const handleGoogleLogin = async (options: {
    targetPortal: 'admin' | 'pwa';
    preferredName: string;
    adminPasscode: string;
  }) => {
    setLoginLoading(true);
    setLoginError(null);
    pendingLoginIntent.current = options;
    selectPortal(options.targetPortal);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code: unknown }).code)
          : '';
      const rawMsg =
        err instanceof Error
          ? err.message
          : 'Gagal masuk dengan Google. Silakan coba lagi.';

      if (
        code === 'auth/unauthorized-domain' ||
        rawMsg.includes('auth/unauthorized-domain')
      ) {
        const currentHost =
          typeof window !== 'undefined' ? window.location.hostname : '';
        setLoginError(
          `auth/unauthorized-domain: Domain "${currentHost}" belum terdaftar di Authorized Domains Firebase Authentication. Tambahkan "${currentHost}" di Firebase Console (Authentication → Settings → Authorized domains) lalu muat ulang halaman.`
        );
      } else if (
        code === 'auth/popup-blocked' ||
        rawMsg.includes('auth/popup-blocked')
      ) {
        setLoginError(
          'Popup login Google diblokir oleh browser. Izinkan popup untuk situs ini lalu klik tombol Masuk lagi.'
        );
      } else if (
        code === 'auth/popup-closed-by-user' ||
        rawMsg.includes('auth/popup-closed-by-user')
      ) {
        setLoginError('Jendela login Google ditutup sebelum selesai. Silakan coba kembali.');
      } else {
        setLoginError(rawMsg);
      }
      pendingLoginIntent.current = null;
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignOut = async () => {
    pendingLoginIntent.current = null;
    await signOut(auth);
  };

  if (!authReady || !roleChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#062C22] text-emerald-300 font-bold text-lg flex items-center justify-center mx-auto">
            N
          </div>
          <p className="text-sm font-medium text-slate-600">
            Menghubungkan ke database real-time NusaHR...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPortalView
        activePortal={mode}
        onPortalChange={selectPortal}
        onGoogleLogin={handleGoogleLogin}
        loading={loginLoading}
        errorMessage={loginError}
      />
    );
  }

  if (mode === 'admin' && !isAdmin) {
    const handleVerifyAdminGate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!gatePasscode.trim()) return;
      setGateLoading(true);
      setGateError(null);
      try {
        await registerAdminWithPasscode({
          uid: user.uid,
          email: user.email ?? '',
          name: user.displayName || 'Manajemen NusaHR',
          passcode: gatePasscode.trim(),
        });
        setIsAdmin(true);
      } catch {
        setGateError('Kode akses manajemen tidak valid. Coba kembali.');
      } finally {
        setGateLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 text-white p-7 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Verifikasi Portal Admin</h1>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Portal Admin terpisah dari Portal Karyawan. Masukkan Kode Akses Manajemen untuk membuka Backoffice Admin.
          </p>

          {gateError && (
            <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-3.5 py-2.5 text-xs text-rose-200">
              {gateError}
            </div>
          )}

          <form onSubmit={handleVerifyAdminGate} className="space-y-4">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                maxLength={64}
                value={gatePasscode}
                onChange={(e) => setGatePasscode(e.target.value)}
                placeholder="Kode Akses Manajemen (NUSAHR2026)"
                className="w-full min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 pl-10 pr-3.5 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <button
              type="submit"
              disabled={gateLoading}
              className="w-full min-h-[46px] rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-semibold text-sm cursor-pointer"
            >
              {gateLoading ? 'Memverifikasi...' : 'Masuk Portal Admin'}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={() => selectPortal('pwa')}
              className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
            >
              Pindah ke Portal Karyawan
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-slate-400 hover:text-rose-400 cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (dataLoading || (mode === 'pwa' && !currentEmployee)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#062C22] text-emerald-300 font-bold text-lg flex items-center justify-center mx-auto">
            N
          </div>
          <p className="text-sm font-medium text-slate-600">
            Menyiapkan profil & sinkronisasi real-time...
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'admin' && isAdmin) {
    return (
      <AdminDashboard
        adminEmail={user.email ?? BOOTSTRAP_ADMIN_EMAIL}
        employees={employees}
        positions={positions}
        schedules={schedules}
        attendances={attendances}
        leaveRequests={leaveRequests}
        payrolls={payrolls}
        onSwitchToPWA={() => selectPortal('pwa')}
        onSignOut={handleSignOut}
      />
    );
  }

  const activeSchedule =
    schedules.find((s) => s.isActive) ?? schedules[0] ?? null;

  return (
    <EmployeePWA
      employee={currentEmployee!}
      privateContact={privateContact}
      userEmail={user.email ?? ''}
      actorUid={user.uid}
      isAdmin={isAdmin}
      attendances={attendances}
      leaveRequests={leaveRequests}
      payrolls={payrolls}
      schedule={activeSchedule}
      onSwitchToAdmin={() => selectPortal('admin')}
      onSignOut={handleSignOut}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <OfflineIndicator />
      <MainApp />
    </ErrorBoundary>
  );
}
