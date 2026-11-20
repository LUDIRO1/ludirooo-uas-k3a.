import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  RefreshCw,
  SwitchCamera,
  Upload,
} from 'lucide-react';
import type { Attendance, Employee, WorkSchedule } from '../../types/hrm';
import { clockInEmployee, clockOutEmployee } from '../../services/hrmService';
import {
  formatDateDDMMMYYYY,
  formatRupiah,
  getCurrentTimeHHMM,
  getCurrentTimeHHMMSS,
  getIndonesianDayName,
  getTodayISO,
  isLateClockIn,
} from '../../utils/formatters';

interface Props {
  employee: Employee;
  actorUid: string;
  todayAttendance?: Attendance;
  schedule: WorkSchedule | null;
}

export const PresensiTab: React.FC<Props> = ({
  employee,
  actorUid,
  todayAttendance,
  schedule,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  const [liveTime, setLiveTime] = useState(getCurrentTimeHHMMSS());
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [videoDevicesCount, setVideoDevicesCount] = useState(0);
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');
  const [notes, setNotes] = useState('');
  const locationText = 'Kantor Pusat · Terverifikasi Perangkat';
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [cameraBlockedByIframe, setCameraBlockedByIframe] = useState(false);

  const todayISO = getTodayISO();
  const hasClockIn = Boolean(todayAttendance?.clockInTime);
  const hasClockOut = Boolean(todayAttendance?.clockOutTime);
  const isCompletedToday = hasClockIn && hasClockOut;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveTime(getCurrentTimeHHMMSS());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const stopCamera = useCallback(() => {
    cameraRequestIdRef.current += 1;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (isMountedRef.current) {
      setCameraActive(false);
      setCameraStarting(false);
    }
  }, []);

  const getUserMediaWithTimeout = async (
    constraints: MediaStreamConstraints,
    timeoutMs = 6000
  ): Promise<MediaStream> => {
    let timerId: number | undefined;
    try {
      return await Promise.race([
        navigator.mediaDevices.getUserMedia(constraints),
        new Promise<never>((_, reject) => {
          timerId = window.setTimeout(() => {
            reject(new Error('CAMERA_TIMEOUT'));
          }, timeoutMs);
        }),
      ]);
    } finally {
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
    }
  };

  const acquireCameraStream = async (
    preferredFacing: 'user' | 'environment'
  ): Promise<MediaStream> => {
    // 1. Try preferred front/back camera
    try {
      return await getUserMediaWithTimeout({
        video: {
          facingMode: { ideal: preferredFacing },
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (firstErr) {
      const name = firstErr instanceof Error ? firstErr.name || firstErr.message : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        throw firstErr;
      }
    }

    // 2. Fallback to generic video stream (common for desktop/laptop webcams)
    try {
      return await getUserMediaWithTimeout({
        video: true,
        audio: false,
      });
    } catch (secondErr) {
      const name =
        secondErr instanceof Error ? secondErr.name || secondErr.message : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        throw secondErr;
      }

      // 3. Last attempt: query videoinput deviceId explicitly
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cam = devices.find((d) => d.kind === 'videoinput' && d.deviceId);
        if (cam) {
          return await getUserMediaWithTimeout({
            video: { deviceId: { exact: cam.deviceId } },
            audio: false,
          });
        }
      }
      throw secondErr;
    }
  };

  const startCamera = useCallback(
    async (preferredFacing: 'user' | 'environment' = facingMode) => {
      const requestId = ++cameraRequestIdRef.current;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      setCameraError(null);
      setFeedback(null);
      setCameraActive(false);
      setCameraStarting(true);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('UNSUPPORTED_BROWSER');
        }

        const stream = await acquireCameraStream(preferredFacing);

        // Prevent leaked stream if component unmounted or newer request started
        if (!isMountedRef.current || cameraRequestIdRef.current !== requestId) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        const videoEl = videoRef.current;
        if (videoEl) {
          videoEl.defaultMuted = true;
          videoEl.muted = true;
          videoEl.playsInline = true;
          videoEl.autoplay = true;
          videoEl.setAttribute('playsinline', 'true');
          videoEl.setAttribute('muted', 'true');
          videoEl.srcObject = stream;

          if (videoEl.readyState < 2) {
            await new Promise<void>((resolve) => {
              const onReady = () => {
                videoEl.removeEventListener('loadeddata', onReady);
                resolve();
              };
              videoEl.addEventListener('loadeddata', onReady);
              window.setTimeout(resolve, 1200);
            });
          }

          try {
            await videoEl.play();
          } catch {
            // Video stream is still attached; user tap on capture or browser autoplay resumes
          }
        }

        if (navigator.mediaDevices.enumerateDevices) {
          navigator.mediaDevices
            .enumerateDevices()
            .then((devices) => {
              if (!isMountedRef.current) return;
              const cams = devices.filter((d) => d.kind === 'videoinput');
              setVideoDevicesCount(cams.length);
            })
            .catch(() => {});
        }

        if (isMountedRef.current && cameraRequestIdRef.current === requestId) {
          setCameraActive(true);
          setCameraStarting(false);
        }
      } catch (err) {
        if (!isMountedRef.current || cameraRequestIdRef.current !== requestId) {
          return;
        }
        const errName = err instanceof Error ? err.name || err.message : '';
        const inIframe =
          typeof window !== 'undefined' && window.self !== window.top;
        let msg =
          'Kamera tidak dapat diakses. Klik "Aktifkan Kamera" untuk mencoba lagi atau gunakan Unggah Selfie.';
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          setCameraBlockedByIframe(inIframe);
          msg = inIframe
            ? 'Browser memblokir izin kamera di dalam frame pratinjau ini. Buka aplikasi di tab browser penuh agar kamera langsung aktif, atau gunakan Unggah Selfie.'
            : 'Izin kamera ditolak browser. Klik ikon gembok di address bar browser lalu izinkan Kamera, kemudian tekan "Aktifkan Kamera".';
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          setCameraBlockedByIframe(false);
          msg =
            'Perangkat kamera tidak ditemukan di perangkat ini. Gunakan tombol Unggah Selfie untuk mengambil atau memilih foto.';
        } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
          setCameraBlockedByIframe(false);
          msg =
            'Kamera sedang dipakai aplikasi lain. Tutup aplikasi tersebut lalu klik "Aktifkan Kamera".';
        } else if (errName === 'CAMERA_TIMEOUT') {
          setCameraBlockedByIframe(inIframe);
          msg =
            'Kamera belum merespons. Pastikan izin kamera disetujui lalu klik "Aktifkan Kamera".';
        } else if (errName === 'UNSUPPORTED_BROWSER') {
          setCameraBlockedByIframe(inIframe);
          msg =
            'Halaman saat ini tidak mendukung akses WebRTC kamera langsung. Buka di tab browser penuh atau gunakan Unggah Selfie.';
        } else {
          setCameraBlockedByIframe(inIframe);
        }
        setCameraError(msg);
        setCameraActive(false);
        setCameraStarting(false);
      }
    },
    [facingMode]
  );

  // Auto-start camera ONLY when permission is already granted; otherwise wait for user click gesture
  useEffect(() => {
    if (isCompletedToday || capturedPhoto) {
      stopCamera();
      return;
    }

    let active = true;
    const checkAndStart = async () => {
      try {
        if (navigator.permissions?.query) {
          const perm = await navigator.permissions.query({
            name: 'camera' as PermissionName,
          });
          if (active && perm.state === 'granted') {
            void startCamera(facingMode);
          }
        }
      } catch {
        // Browsers without permissions.query for camera will start cleanly on user click
      }
    };
    void checkAndStart();

    return () => {
      active = false;
      stopCamera();
    };
  }, [isCompletedToday, capturedPhoto, facingMode, startCamera, stopCamera]);

  const handleToggleFacing = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    if (cameraActive) {
      void startCamera(next);
    }
  };

  const compressCanvasToJpeg = (
    source: HTMLVideoElement | HTMLImageElement,
    width: number,
    height: number,
    mirror: boolean
  ): string => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const maxW = 480;
    const scale = width > maxW ? maxW / width : 1;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.save();
    if (mirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Stamp verified timestamp onto selfie bottom corner
    ctx.fillStyle = 'rgba(6, 44, 34, 0.72)';
    ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
    ctx.fillStyle = '#ECFDF5';
    ctx.font = '500 12px monospace';
    ctx.fillText(
      `${formatDateDDMMMYYYY(todayISO)} · ${getCurrentTimeHHMMSS()} WIB`,
      10,
      canvas.height - 10
    );

    return canvas.toDataURL('image/jpeg', 0.65);
  };

  const handleCaptureSelfie = () => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    if (video.readyState < 2) {
      setCameraError('Kamera masih memuat gambar, silakan tunggu sebentar lalu coba lagi.');
      return;
    }
    const dataUrl = compressCanvasToJpeg(
      video,
      w,
      h,
      facingMode === 'user'
    );
    if (!dataUrl) return;
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const dataUrl = compressCanvasToJpeg(img, img.width, img.height, false);
        setCapturedPhoto(dataUrl);
        stopCamera();
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedPhoto('');
    setFeedback(null);
  };

  const handleSubmitPresensi = async () => {
    if (!capturedPhoto || submitting) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const currentHHMM = getCurrentTimeHHMM();
      if (!hasClockIn) {
        const schedIn = schedule?.clockInTime ?? '08:00';
        const tol = schedule?.lateToleranceMinutes ?? 15;
        const late = isLateClockIn(currentHHMM, schedIn, tol);
        await clockInEmployee({
          employee,
          date: todayISO,
          clockInTime: currentHHMM,
          selfiePhoto: capturedPhoto,
          location: locationText,
          status: late ? 'Terlambat' : 'Hadir',
          notes:
            notes.trim() ||
            (late ? 'Clock-In melewati batas toleransi' : 'Clock-In selfie tepat waktu'),
          actorUid,
        });
        setCapturedPhoto('');
        setNotes('');
        setFeedback('Clock-In berhasil dicatat ke database.');
      } else if (!hasClockOut && todayAttendance) {
        await clockOutEmployee({
          attendance: todayAttendance,
          clockOutTime: currentHHMM,
          selfiePhoto: capturedPhoto,
          location: locationText,
          notes: notes.trim() || todayAttendance.notes,
        });
        setCapturedPhoto('');
        setNotes('');
        setFeedback('Clock-Out berhasil dicatat ke database.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <canvas ref={canvasRef} className="hidden" />

      {/* Live Clock & Shift Header */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {getIndonesianDayName(todayISO)}, {formatDateDDMMMYYYY(todayISO)}
            </p>
            <p className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              {liveTime} <span className="text-sm font-medium text-slate-500">WIB</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500">Jadwal Aktif</p>
            <p className="mt-1 font-mono text-sm font-semibold text-emerald-800 tabular-nums">
              {schedule?.clockInTime ?? '08:00'} – {schedule?.clockOutTime ?? '17:00'}
            </p>
            <p className="text-[11px] text-slate-500">
              Toleransi {schedule?.lateToleranceMinutes ?? 15} menit
            </p>
          </div>
        </div>
      </section>

      {feedback && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-2.5 text-sm font-medium text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Selfie Capture Card */}
      {!isCompletedToday ? (
        <section className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900">
                {!hasClockIn
                  ? 'Selfie Verifikasi Clock-In'
                  : 'Selfie Verifikasi Clock-Out'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate">{locationText}</span>
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-emerald-700 tabular-nums shrink-0">
              {formatRupiah(employee.dailyRate)}/hari
            </span>
          </div>

          <div className="p-5 space-y-4">
            {/* Viewfinder / Captured Preview — NEVER use display:none on video! */}
            <div className="relative aspect-[4/3] sm:aspect-square max-h-[340px] w-full mx-auto rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
              {capturedPhoto ? (
                <img
                  src={capturedPhoto}
                  alt="Preview foto selfie presensi"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transition-opacity duration-200 ${
                      facingMode === 'user' ? 'scale-x-[-1]' : ''
                    } ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
                  />

                  {cameraActive && (
                    <div className="absolute inset-x-3 bottom-3 flex items-center justify-between pointer-events-none">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950/70 text-[10px] font-mono text-emerald-200 backdrop-blur-sm">
                        Kamera Aktif · {liveTime} WIB
                      </span>
                      {videoDevicesCount > 1 && (
                        <button
                          type="button"
                          onClick={handleToggleFacing}
                          className="pointer-events-auto min-h-[34px] px-2.5 rounded-lg bg-slate-950/75 hover:bg-slate-900 text-white text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                          title="Ganti kamera depan/belakang"
                        >
                          <SwitchCamera className="w-3.5 h-3.5" />
                          <span>Putar</span>
                        </button>
                      )}
                    </div>
                  )}

                  {!cameraActive && (
                    <div className="absolute inset-0 z-10 p-5 flex flex-col items-center justify-center text-center text-slate-300 space-y-3 bg-slate-900">
                      <Camera className="w-10 h-10 text-emerald-400" />
                      <p className="text-xs leading-relaxed max-w-xs mx-auto">
                        {cameraStarting
                          ? 'Menghubungkan ke kamera perangkat...'
                          : cameraError ||
                            'Tekan "Aktifkan Kamera" untuk menyalakan kamera selfie secara langsung.'}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => void startCamera(facingMode)}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-semibold cursor-pointer"
                        >
                          {cameraStarting ? 'Coba Ulang Kamera' : 'Aktifkan Kamera'}
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/20 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Kamera HP / Galeri</span>
                        </button>
                      </div>
                      {cameraBlockedByIframe && typeof window !== 'undefined' && (
                        <a
                          href={window.location.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka di Tab Browser Penuh untuk Kamera</span>
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Camera Controls */}
            {!capturedPhoto ? (
              <div className="flex items-center gap-2.5">
                {!cameraActive ? (
                  <button
                    type="button"
                    onClick={() => void startCamera(facingMode)}
                    className="flex-1 min-h-[48px] rounded-2xl bg-[#062C22] hover:bg-[#09382B] text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>
                      {cameraStarting ? 'Menghubungkan Kamera...' : 'Aktifkan Kamera'}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCaptureSelfie}
                    className="flex-1 min-h-[48px] rounded-2xl bg-slate-900 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Ambil Foto Selfie</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[48px] min-w-[48px] px-4 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                  aria-label="Pilih foto selfie dari perangkat"
                  title="Unggah foto selfie"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={200}
                  placeholder="Catatan opsional (misal: WFO Lantai 3)"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRetake}
                    disabled={submitting}
                    className="min-h-[48px] px-4 rounded-2xl border border-slate-200 text-slate-700 font-medium text-sm inline-flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Ulangi</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitPresensi}
                    disabled={submitting}
                    className="flex-1 min-h-[48px] rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {submitting
                        ? 'Menyimpan...'
                        : !hasClockIn
                        ? 'Kirim Clock-In'
                        : 'Kirim Clock-Out'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* Today's Attendance Summary */}
      {todayAttendance && (
        <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Status Presensi Hari Ini ({formatDateDDMMMYYYY(todayISO)})
            </h3>
            <span
              className={`text-xs font-semibold ${
                todayAttendance.status === 'Terlambat'
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}
            >
              {todayAttendance.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Clock-In</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {todayAttendance.clockInTime}
                </span>
              </div>
              {todayAttendance.clockInPhoto ? (
                <img
                  src={todayAttendance.clockInPhoto}
                  alt="Selfie Clock-In"
                  referrerPolicy="no-referrer"
                  className="w-full aspect-square object-cover rounded-xl border border-slate-200"
                />
              ) : (
                <div className="w-full aspect-square rounded-xl bg-slate-200/60 flex items-center justify-center text-slate-400">
                  <Clock className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Clock-Out</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {todayAttendance.clockOutTime || 'Belum'}
                </span>
              </div>
              {todayAttendance.clockOutPhoto ? (
                <img
                  src={todayAttendance.clockOutPhoto}
                  alt="Selfie Clock-Out"
                  referrerPolicy="no-referrer"
                  className="w-full aspect-square object-cover rounded-xl border border-slate-200"
                />
              ) : (
                <div className="w-full aspect-square rounded-xl bg-slate-200/60 flex items-center justify-center text-xs text-slate-400 text-center px-2">
                  Menunggu Clock-Out
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
