# Security Specification — HRM Backoffice & Mobile PWA

## 1. Data Invariants
1. **Admin Authority**: Only verified admins (`yogajepara999@gmail.com` with `email_verified == true` or documents in `/admins/{uid}`) may manage positions, work schedules, employee master records, or generate/approve payrolls.
2. **PII Isolation**: Employee PII (`email`, `phone`, `dailyRate`, `nip`) is readable only by Admins or the owning verified employee (`ownerUid == request.auth.uid` or verified email match). Blanket `isSignedIn()` reads on `employees`, `attendances`, and `payrolls` are strictly forbidden.
3. **Wage Integrity**: An employee cannot modify their own `dailyRate`, `status`, or `positionId`. When clocking in, `dailyRateSnapshot` and `earnedAmount` must strictly match the employee's authoritative `dailyRate` in `/employees/{employeeId}`.
4. **Attendance Terminal Lock**: Employees may create an attendance record for themselves (clock-in) and perform a single clock-out update when `existing().clockOutTime == ''`, modifying only clock-out fields. Post-clock-out edits are restricted to Admins.
5. **Temporal Integrity**: All `createdAt` and `updatedAt` timestamps must equal `request.time`.
6. **Path Variable Hardening**: All document IDs must match `^[a-zA-Z0-9_\-]+$` and be at most 128 characters.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Read/Write**: Unauthenticated user attempts `get` on `/employees/emp_001` -> `PERMISSION_DENIED`.
2. **Spoofed Email Admin Bypass**: User with `email: 'yogajepara999@gmail.com'` and `email_verified: false` attempts write to `/positions/pos_1` -> `PERMISSION_DENIED`.
3. **PII Scraping List**: Non-admin user runs unrestricted `list` on `/employees` -> `PERMISSION_DENIED`.
4. **Self-Assigned Admin Escalation**: Non-admin user attempts `create` on `/admins/{theirUid}` -> `PERMISSION_DENIED`.
5. **Shadow / Ghost Field Injection**: Employee clock-in payload includes extra key `isAdminApproved: true` -> `PERMISSION_DENIED`.
6. **Wage Rate Spoofing on Clock-In**: Employee clocks in with `dailyRateSnapshot: 9999999` instead of their actual `dailyRate` -> `PERMISSION_DENIED`.
7. **Orphan Attendance Creation**: Employee clocks in with non-existent `employeeId: 'fake_emp'` -> `PERMISSION_DENIED`.
8. **Cross-Employee Attendance Spoofing**: Employee A clocks in using Employee B's `employeeId` -> `PERMISSION_DENIED`.
9. **Double Clock-Out / Post-Terminal Mutation**: Employee attempts to modify `clockInTime` or `dailyRateSnapshot` during clock-out update -> `PERMISSION_DENIED`.
10. **Payroll Forgery**: Non-admin employee attempts to create or update `/payrolls/pay_001` with `status: 'Dibayarkan'` -> `PERMISSION_DENIED`.
11. **Resource Exhaustion / ID Poisoning**: Attacker writes document with 500-char ID or 1MB string in `notes` -> `PERMISSION_DENIED`.
12. **Timestamp Tampering**: Client submits backdated `createdAt` not equal to `request.time` -> `PERMISSION_DENIED`.
