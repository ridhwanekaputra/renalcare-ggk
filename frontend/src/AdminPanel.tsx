import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Search, 
  Trash2, 
  Download, 
  RefreshCw, 
  Lock, 
  ShieldCheck, 
  LogOut, 
  Database, 
  Cpu, 
  BarChart3, 
  FileText, 
  Clock, 
  Check, 
  X, 
  Eye, 
  EyeOff,
  KeyRound,
  Shield,
  ShieldAlert,
  UserCheck,
  PlusCircle, 
  Filter,
  Zap,
  Server,
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { 
  verifyAdminLogin, 
  changeAdminPassword, 
  resetAdminToDefault, 
  isAdminSessionValid, 
  refreshAdminSession, 
  terminateAdminSession, 
  getStoredCredentials, 
  getRateLimitStatus 
} from './lib/adminAuth';

interface PredictionData {
  id?: number;
  date?: string;
  formData?: any;
  status: string;
  prediction: string;
  confidence: number | string;
  explanation: string;
  recommendations?: string[];
}

interface AdminPanelProps {
  onBackToPatientView: () => void;
  predictionHistory: PredictionData[];
  onUpdateHistory: (updated: PredictionData[]) => void;
}

export default function AdminPanel({
  onBackToPatientView,
  predictionHistory,
  onUpdateHistory
}: AdminPanelProps) {
  // Authentication State with Session Validation
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return isAdminSessionValid();
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Admin Active Tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'patients' | 'engine' | 'logs' | 'security'>('analytics');
  
  // Patient Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'low'>('all');
  
  // Selected Patient for Detail Modal
  const [selectedPatient, setSelectedPatient] = useState<PredictionData | null>(null);

  // Backend Health Ping Test State
  const [pingStatus, setPingStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle');
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  // Password Management & Security States
  const [storedCreds, setStoredCreds] = useState(() => getStoredCredentials());
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [pwdFormStatus, setPwdFormStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  // Monitor Rate Limit Countdown
  useEffect(() => {
    const updateCountdown = () => {
      const rl = getRateLimitStatus();
      setLockoutRemaining(rl.remainingSeconds);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Inactivity Auto-Logout (15 Menit) & Session Refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleUserActivity = () => {
      refreshAdminSession();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, handleUserActivity));

    const sessionCheckInterval = setInterval(() => {
      if (!isAdminSessionValid()) {
        terminateAdminSession();
        setIsAuthenticated(false);
        setLoginError('Sesi administrator Anda telah ditutup secara otomatis karena tidak aktif selama 15 menit.');
      }
    }, 15000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleUserActivity));
      clearInterval(sessionCheckInterval);
    };
  }, [isAuthenticated]);

  // Handle Login with Async Verification & Brute-Force Check
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn || lockoutRemaining > 0) return;

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const result = await verifyAdminLogin(username, password);
      if (result.success) {
        setIsAuthenticated(true);
        setUsername('');
        setPassword('');
        setLoginError('');
        setStoredCreds(getStoredCredentials());
      } else {
        setLoginError(result.message || 'Kredensial tidak valid.');
      }
    } catch {
      setLoginError('Terjadi kesalahan verifikasi keamanan.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Explicit Logout
  const handleLogout = () => {
    terminateAdminSession();
    setIsAuthenticated(false);
    setLoginError('');
  };

  // Exit back to patient view: PURGE session so re-entering requires login!
  const handleBackToPatient = () => {
    terminateAdminSession();
    setIsAuthenticated(false);
    onBackToPatientView();
  };

  // Handle Change Password Form Submission
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdFormStatus({ type: 'loading', message: 'Memproses pembaruan kata sandi...' });

    if (newPasswordInput !== confirmPasswordInput) {
      setPwdFormStatus({
        type: 'error',
        message: 'Konfirmasi kata sandi baru tidak sesuai dengan kata sandi baru.'
      });
      return;
    }

    try {
      const res = await changeAdminPassword(
        currentPasswordInput,
        newPasswordInput,
        newUsernameInput.trim() || undefined
      );

      if (res.success) {
        setPwdFormStatus({ type: 'success', message: res.message });
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        setNewUsernameInput('');
        setStoredCreds(getStoredCredentials());
      } else {
        setPwdFormStatus({ type: 'error', message: res.message });
      }
    } catch {
      setPwdFormStatus({ type: 'error', message: 'Terjadi kesalahan sistem saat memperbarui kata sandi.' });
    }
  };

  // Reset Credentials to Factory Standard
  const handleResetDefaultCredentials = () => {
    if (window.confirm("PERINGATAN KEAMANAN: Apakah Anda yakin ingin mereset akun administrator kembali ke standar awal (Username: admin, Password: admin123)?")) {
      const res = resetAdminToDefault();
      setStoredCreds(getStoredCredentials());
      setPwdFormStatus({ type: 'success', message: res.message });
    }
  };

  // Delete single patient record
  const handleDeletePatient = (idToDelete: number) => {
    if (window.confirm("Hapus rekam medis pasien ini dari basis data lokal?")) {
      const updated = predictionHistory.filter(item => item.id !== idToDelete);
      onUpdateHistory(updated);
      localStorage.setItem('predictionHistory', JSON.stringify(updated));
      if (selectedPatient?.id === idToDelete) {
        setSelectedPatient(null);
      }
    }
  };

  // Clear all patient history
  const handleClearAllHistory = () => {
    if (window.confirm("PERINGATAN: Apakah Anda yakin ingin mengosongkan seluruh riwayat rekam medis pasien? Tindakan ini tidak dapat dibatalkan.")) {
      onUpdateHistory([]);
      localStorage.removeItem('predictionHistory');
      setSelectedPatient(null);
    }
  };

  // Export Data to CSV
  const handleExportCSV = () => {
    if (predictionHistory.length === 0) {
      alert("Tidak ada data pasien untuk diekspor.");
      return;
    }

    const headers = [
      "ID Rekam",
      "Tanggal Uji",
      "Nama Pasien",
      "Usia",
      "Gender",
      "Kreatinin (mg/dL)",
      "Ureum (mg/dL)",
      "Hemoglobin (g/dL)",
      "Tekanan Darah (mmHg)",
      "GDP (mg/dL)",
      "G2H (mg/dL)",
      "Kolesterol (mg/dL)",
      "BMI (kg/m2)",
      "Hasil Klasifikasi AI",
      "Keyakinan Model (%)"
    ];

    const rows = predictionHistory.map(item => [
      item.id || '',
      item.date ? new Date(item.date).toLocaleString('id-ID') : '',
      `"${item.formData?.name || 'Pasien'}"`,
      item.formData?.age || '',
      item.formData?.gender || '',
      item.formData?.creatinine || '',
      item.formData?.ureum || '',
      item.formData?.hb || '',
      item.formData?.bp || '',
      item.formData?.gdp || '',
      item.formData?.g2h || '',
      item.formData?.cholesterol || '',
      item.formData?.bmi || '',
      `"${item.prediction || ''}"`,
      item.confidence || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Rekam_Medis_GGK_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Test Ping to Flask Backend
  const checkBackendPing = async () => {
    setPingStatus('checking');
    const startTime = performance.now();
    try {
      const response = await fetch('/api/predict', { method: 'GET' });
      const endTime = performance.now();
      if (response.ok) {
        setPingStatus('online');
        setPingLatency(Math.round(endTime - startTime));
      } else {
        setPingStatus('offline');
      }
    } catch {
      setPingStatus('offline');
      setPingLatency(null);
    }
  };

  // Statistical Metrics
  const stats = useMemo(() => {
    const total = predictionHistory.length;
    const highRisk = predictionHistory.filter(p => p.prediction === 'Risiko Tinggi').length;
    const lowRisk = predictionHistory.filter(p => p.prediction === 'Risiko Rendah').length;
    const highRiskPct = total > 0 ? Math.round((highRisk / total) * 100) : 0;
    const lowRiskPct = total > 0 ? Math.round((lowRisk / total) * 100) : 0;

    let avgAge = 0;
    let avgConfidence = 0;
    let abnormalCreatinineCount = 0;
    let abnormalUreumCount = 0;
    let hypertensiveCount = 0;

    if (total > 0) {
      const sumAge = predictionHistory.reduce((acc, curr) => acc + (Number(curr.formData?.age) || 0), 0);
      avgAge = Math.round(sumAge / total);

      const sumConfidence = predictionHistory.reduce((acc, curr) => acc + (Number(curr.confidence) || 0), 0);
      avgConfidence = Math.round(sumConfidence / total);

      abnormalCreatinineCount = predictionHistory.filter(p => Number(p.formData?.creatinine) > 1.2).length;
      abnormalUreumCount = predictionHistory.filter(p => Number(p.formData?.ureum) > 50).length;
      hypertensiveCount = predictionHistory.filter(p => Number(p.formData?.bp) > 130).length;
    }

    return {
      total,
      highRisk,
      lowRisk,
      highRiskPct,
      lowRiskPct,
      avgAge,
      avgConfidence,
      abnormalCreatininePct: total > 0 ? Math.round((abnormalCreatinineCount / total) * 100) : 0,
      abnormalUreumPct: total > 0 ? Math.round((abnormalUreumCount / total) * 100) : 0,
      hypertensivePct: total > 0 ? Math.round((hypertensiveCount / total) * 100) : 0
    };
  }, [predictionHistory]);

  // Filtered Patients for Table
  const filteredPatients = useMemo(() => {
    return predictionHistory.filter(p => {
      const name = p.formData?.name?.toLowerCase() || '';
      const matchesSearch = name.includes(searchQuery.toLowerCase());
      if (riskFilter === 'high') return matchesSearch && p.prediction === 'Risiko Tinggi';
      if (riskFilter === 'low') return matchesSearch && p.prediction === 'Risiko Rendah';
      return matchesSearch;
    });
  }, [predictionHistory, searchQuery, riskFilter]);

  // ---------------------------------------------------------------------------
  // RENDER LOGIN SCREEN IF NOT AUTHENTICATED
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative selection:bg-teal-500 selection:text-slate-950">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 clinical-grid-dark opacity-30 pointer-events-none" />

        <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-slate-800/90 rounded-xl mx-auto flex items-center justify-center text-teal-400 border border-slate-700 shadow-sm">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Portal Administrasi Klinis
            </h1>
            <p className="text-xs text-slate-400">
              Akses Terbatas: Hanya Petugas Medis & Administrator Terverifikasi
            </p>
          </div>

          {/* Lockout Warning if brute-force triggered */}
          {lockoutRemaining > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs flex items-center gap-2.5">
              <ShieldAlert size={18} className="shrink-0 text-amber-400" />
              <div>
                <span className="font-bold block">Akses Sementara Ditangguhkan</span>
                <span>Terlalu banyak percobaan gagal. Silakan tunggu <strong className="font-mono text-white underline">{lockoutRemaining}</strong> detik lagi.</span>
              </div>
            </div>
          )}

          {/* Login Error Notification */}
          {loginError && lockoutRemaining === 0 && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Nama Pengguna (Username)
              </label>
              <input 
                type="text" 
                required
                disabled={lockoutRemaining > 0 || isLoggingIn}
                placeholder="Masukkan username admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full h-11 px-3.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium disabled:opacity-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <input 
                  type={showLoginPassword ? "text" : "password"} 
                  required
                  disabled={lockoutRemaining > 0 || isLoggingIn}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-11 pl-3.5 pr-10 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium font-mono disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={lockoutRemaining > 0 || isLoggingIn}
                className="w-full h-11 rounded-lg bg-teal-600 hover:bg-teal-500 active:scale-[0.99] text-slate-950 font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Memverifikasi Kredensial...</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Masuk ke Konsol Administrator</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Features Tagline */}
          <div className="py-2 px-3 rounded-lg bg-slate-800/50 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-teal-400 font-medium">
              <Shield size={13} />
              Enkripsi SHA-256
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Sesi Otomatis Terkunci Saat Keluar</span>
          </div>

          {/* Back to Public Web */}
          <div className="pt-2 border-t border-slate-800 text-center">
            <button 
              type="button"
              onClick={handleBackToPatient}
              className="text-xs text-slate-400 hover:text-teal-400 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Halaman Web Pasien</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER AUTHENTICATED ADMIN DASHBOARD
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      
      {/* ADMIN TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">RenalCare<span className="text-teal-400">Admin</span></span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800/60 uppercase">
                  v2.4 Console
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Pusat Data Rekam Medis & Monitoring Model AI</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={handleBackToPatient}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Kunci sesi administrator dan kembali ke portal pasien umum"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Web Pasien</span>
            </button>

            <button 
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-xs font-semibold text-rose-300 border border-rose-800/60 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Keluar dari sesi administrator"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>

        </div>

        {/* ADMIN TAB NAVIGATION BAR */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          {[
            { id: 'analytics', label: 'Ringkasan & Analitik', icon: BarChart3 },
            { id: 'patients', label: `Database Pasien (${predictionHistory.length})`, icon: Database },
            { id: 'engine', label: 'Kondisi Model AI', icon: Cpu },
            { id: 'logs', label: 'Log Aktivitas Sistem', icon: Clock },
            { id: 'security', label: 'Keamanan & Kredensial', icon: KeyRound }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border-b-2 cursor-pointer",
                  isActive 
                    ? "border-teal-400 text-teal-300 bg-slate-800/40" 
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                )}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ADMIN CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full space-y-6">
        
        {/* =====================================================================
            TAB 1: ANALYTICS & OVERVIEW
        ===================================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            {/* Top KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-xl space-y-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Pasien Skrining</span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white">{stats.total}</div>
                <p className="text-[11px] text-slate-500">Rekam medis tersimpan lokal</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-xl space-y-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-400">Terdeteksi Risiko Tinggi</span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-rose-400">
                  {stats.highRisk} <span className="text-sm font-normal text-slate-500">({stats.highRiskPct}%)</span>
                </div>
                <p className="text-[11px] text-slate-500">Memerlukan rujukan nefrologi</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-xl space-y-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400">Terdeteksi Risiko Rendah</span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                  {stats.lowRisk} <span className="text-sm font-normal text-slate-500">({stats.lowRiskPct}%)</span>
                </div>
                <p className="text-[11px] text-slate-500">Fungsi filtrasi ginjal terjaga</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-xl space-y-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-400">Rata-rata Keyakinan AI</span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-teal-400">
                  {stats.avgConfidence > 0 ? `${stats.avgConfidence}%` : 'N/A'}
                </div>
                <p className="text-[11px] text-slate-500">Konsensus Soft-Voting model</p>
              </div>

            </div>

            {/* Middle Section: Parameter Prevalence & Demographics */}
            <div className="grid lg:grid-cols-12 gap-6">
              
              {/* Parameter Prevalence Bar Cards */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-teal-400" />
                    <span>Prevalensi Parameter Abnormal Pasien</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">Sampel Pasien: {stats.total}</span>
                </div>

                <div className="space-y-4 pt-1">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Kreatinin Abnormal (&gt; 1.2 mg/dL)</span>
                      <span className="font-mono text-teal-400">{stats.abnormalCreatininePct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div style={{ width: `${stats.abnormalCreatininePct}%` }} className="h-full bg-teal-500 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Ureum Darah Meningkat (&gt; 50 mg/dL)</span>
                      <span className="font-mono text-teal-400">{stats.abnormalUreumPct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div style={{ width: `${stats.abnormalUreumPct}%` }} className="h-full bg-teal-500 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Hipertensi Sistolik (&gt; 130 mmHg)</span>
                      <span className="font-mono text-teal-400">{stats.hypertensivePct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div style={{ width: `${stats.hypertensivePct}%` }} className="h-full bg-teal-500 rounded-full" />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                  Statistik dihitung secara otomatis berdasarkan ambang batas klinis standar laboratorium nefrologi.
                </p>
              </div>

              {/* Fast Action Shortcuts */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Database size={18} className="text-teal-400" />
                    <span>Utilitas Basis Data Rekam Medis</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Unduh data pasien untuk kebutuhan arsip Excel/SPSS atau laporan klinis, atau lakukan uji konektivitas ke model AI.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button 
                    onClick={handleExportCSV}
                    className="w-full py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Download size={15} />
                    <span>Ekspor Seluruh Rekam Medis ke CSV</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('patients')}
                    className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                  >
                    <Eye size={15} />
                    <span>Buka Tabel Manajemen Pasien</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* =====================================================================
            TAB 2: PATIENTS DATABASE MANAGEMENT
        ===================================================================== */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            
            {/* Table Control Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari nama pasien dalam arsip..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Filter Pills & Actions */}
              <div className="flex items-center gap-2 overflow-x-auto">
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button 
                    onClick={() => setRiskFilter('all')}
                    className={cn("px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors", riskFilter === 'all' ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white")}
                  >
                    Semua ({predictionHistory.length})
                  </button>
                  <button 
                    onClick={() => setRiskFilter('high')}
                    className={cn("px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors", riskFilter === 'high' ? "bg-rose-950 text-rose-300" : "text-slate-400 hover:text-white")}
                  >
                    Risiko Tinggi
                  </button>
                  <button 
                    onClick={() => setRiskFilter('low')}
                    className={cn("px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors", riskFilter === 'low' ? "bg-emerald-950 text-emerald-300" : "text-slate-400 hover:text-white")}
                  >
                    Risiko Rendah
                  </button>
                </div>

                <button 
                  onClick={handleExportCSV}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-teal-400 rounded-lg text-xs font-bold border border-slate-800 flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="Unduh CSV"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">CSV</span>
                </button>

                {predictionHistory.length > 0 && (
                  <button 
                    onClick={handleClearAllHistory}
                    className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-lg text-xs font-bold border border-rose-900/50 flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Kosongkan Semua"
                  >
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">Kosongkan</span>
                  </button>
                )}
              </div>

            </div>

            {/* Patients Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px] font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">ID Rekam</th>
                      <th className="p-3.5">Nama Pasien</th>
                      <th className="p-3.5">Demografi</th>
                      <th className="p-3.5">Kreatinin</th>
                      <th className="p-3.5">Ureum</th>
                      <th className="p-3.5">Tekanan Darah</th>
                      <th className="p-3.5">Hasil Prediksi</th>
                      <th className="p-3.5">Keyakinan</th>
                      <th className="p-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredPatients.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-500">
                          Tidak ditemukan data pasien pada arsip.
                        </td>
                      </tr>
                    ) : (
                      filteredPatients.map(item => (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-mono text-slate-400">
                            REB-{item.id ? String(item.id).slice(-4) : '0000'}
                          </td>
                          <td className="p-3.5 font-bold text-white">
                            {item.formData?.name || 'Pasien Anonim'}
                          </td>
                          <td className="p-3.5 text-slate-300">
                            {item.formData?.age} Thn • {item.formData?.gender}
                          </td>
                          <td className="p-3.5 font-mono">
                            <span className={cn(
                              "font-bold",
                              Number(item.formData?.creatinine) > 1.2 ? "text-rose-400" : "text-emerald-400"
                            )}>
                              {item.formData?.creatinine || '-'}
                            </span>
                            <span className="text-[10px] text-slate-500 ml-1">mg/dL</span>
                          </td>
                          <td className="p-3.5 font-mono">
                            <span className={cn(
                              "font-bold",
                              Number(item.formData?.ureum) > 50 ? "text-rose-400" : "text-emerald-400"
                            )}>
                              {item.formData?.ureum || '-'}
                            </span>
                            <span className="text-[10px] text-slate-500 ml-1">mg/dL</span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-300">
                            {item.formData?.bp || '-'} mmHg
                          </td>
                          <td className="p-3.5">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              item.prediction === 'Risiko Tinggi' 
                                ? "bg-rose-950 text-rose-300 border border-rose-800/60" 
                                : "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                            )}>
                              {item.prediction}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-slate-200">
                            {item.confidence}%
                          </td>
                          <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                            <button 
                              onClick={() => setSelectedPatient(item)}
                              className="p-1.5 rounded bg-slate-800 hover:bg-teal-600 hover:text-slate-950 text-slate-300 transition-colors cursor-pointer"
                              title="Lihat Detail Rekam Medis"
                            >
                              <Eye size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeletePatient(item.id!)}
                              className="p-1.5 rounded bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-400 transition-colors cursor-pointer"
                              title="Hapus Rekam Medis"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* =====================================================================
            TAB 3: AI ENGINE & SERVER HEALTH
        ===================================================================== */}
        {activeTab === 'engine' && (
          <div className="space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Server size={18} className="text-teal-400" />
                    <span>Status Konektivitas API Machine Learning</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Memeriksa komunikasi antara frontend console dengan server Flask backend Python
                  </p>
                </div>

                <button 
                  onClick={checkBackendPing}
                  disabled={pingStatus === 'checking'}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw size={14} className={pingStatus === 'checking' ? "animate-spin" : ""} />
                  <span>Uji Ping Server</span>
                </button>
              </div>

              {/* Ping Result Box */}
              <div className="grid sm:grid-cols-3 gap-4 pt-1">
                <div className="p-4 rounded-lg bg-slate-850 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Endpoint API</span>
                  <p className="font-mono text-xs text-slate-200">http://127.0.0.1:5000/api/predict</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-850 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Status Server</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      pingStatus === 'online' ? "bg-emerald-400" : pingStatus === 'offline' ? "bg-rose-500" : "bg-slate-500"
                    )} />
                    <span className="font-bold text-xs uppercase text-slate-200">
                      {pingStatus === 'online' ? "Online & Siap Inferensi" : pingStatus === 'offline' ? "Gagal Terhubung" : "Belum Diuji"}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-850 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Latensi Respons</span>
                  <p className="font-mono text-xs font-bold text-teal-400">
                    {pingLatency !== null ? `${pingLatency} ms` : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Model Architecture Specifications */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Zap size={16} className="text-teal-400" />
                    Model XGBoost (pkl)
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">TERPASANG</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Lokasi file: <code className="text-teal-300 font-mono">backend/models/xgboost_best_model.pkl</code>. Digunakan untuk menghitung estimasi probabilitas gradient-boosted dari matriks klinis.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Layers size={16} className="text-teal-400" />
                    Model Random Forest (pkl)
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">TERPASANG</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Lokasi file: <code className="text-teal-300 font-mono">backend/models/random_forest_model.pkl</code>. Digunakan sebagai bagging model untuk mengeliminasi bias dan variansi berlebih.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* =====================================================================
            TAB 4: SYSTEM LOGS
        ===================================================================== */}
        {activeTab === 'logs' && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400 font-bold uppercase text-[11px]">Audit Trail Log Inferensi Medis</span>
              <span className="text-slate-500 text-[10px]">Realtime Activity</span>
            </div>

            <div className="space-y-2 text-slate-300 max-h-96 overflow-y-auto pt-1">
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-teal-400">
                [SYSTEM READY] Arsitektur Ensemble XGBoost + Random Forest berhasil diinisialisasi.
              </div>
              {predictionHistory.slice(0, 10).map((p, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] space-y-0.5">
                  <span className="text-slate-500">[{new Date(p.date || '').toLocaleTimeString('id-ID')}]</span>{' '}
                  <span className="text-white font-bold">{p.formData?.name || 'Pasien'}</span>: Terklasifikasi{' '}
                  <span className={p.prediction === 'Risiko Tinggi' ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                    {p.prediction}
                  </span>{' '}
                  (Keyakinan: {p.confidence}%)
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 5: SECURITY & CREDENTIALS MANAGEMENT
        ===================================================================== */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            
            {/* Security Header Banner */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white tracking-tight flex items-center gap-2">
                    Pusat Keamanan & Kredensial Administrator
                    <span className="text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800/80 px-2 py-0.5 rounded">
                      SHA-256 SECURED
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Konfigurasi kredensial administrator, proteksi sesi auto-lock, dan tata kelola keamanan rekam medis digital.
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Status Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0">
                  <UserCheck size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Akun Administrator</span>
                  <span className="font-mono font-bold text-white text-sm">{storedCreds.username}</span>
                  <span className="text-[10px] text-emerald-400 block font-medium">Status: Aktif & Terproteksi</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Proteksi Sesi Aktif</span>
                  <span className="font-bold text-white text-sm">Auto-Lock (15 Menit)</span>
                  <span className="text-[10px] text-slate-400 block">Kunci otomatis saat keluar</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Shield size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pembaruan Sandi Terakhir</span>
                  <span className="font-mono font-bold text-white text-xs block">
                    {new Date(storedCreds.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {new Date(storedCreds.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </span>
                </div>
              </div>
            </div>

            {/* Main Grid: Change Password Form & Deployment Guidelines */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Change Password Form (7 Cols) */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="font-bold text-base text-white flex items-center gap-2">
                      <KeyRound size={18} className="text-teal-400" />
                      Ubah Kata Sandi Administrator
                    </h4>
                    <p className="text-xs text-slate-400">
                      Ganti kata sandi secara berkala untuk menjaga kerahasiaan rekam medis pasien.
                    </p>
                  </div>
                </div>

                {/* Status Feedback Notification */}
                {pwdFormStatus.type === 'error' && (
                  <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
                    <AlertTriangle size={18} className="shrink-0 text-rose-400" />
                    <span>{pwdFormStatus.message}</span>
                  </div>
                )}

                {pwdFormStatus.type === 'success' && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
                    <span>{pwdFormStatus.message}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  
                  {/* Optional New Username */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Nama Pengguna (Username)</span>
                      <span className="text-[10px] text-slate-500 font-normal">Kosongkan jika tetap ({storedCreds.username})</span>
                    </label>
                    <input 
                      type="text"
                      placeholder={storedCreds.username}
                      value={newUsernameInput}
                      onChange={e => setNewUsernameInput(e.target.value)}
                      className="w-full h-10 px-3.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                  </div>

                  {/* Current Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Kata Sandi Saat Ini (Lama) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type={showCurrentPass ? "text" : "password"}
                        required
                        placeholder="Masukkan kata sandi lama"
                        value={currentPasswordInput}
                        onChange={e => setCurrentPasswordInput(e.target.value)}
                        className="w-full h-10 pl-3.5 pr-10 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium font-mono"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                      >
                        {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Kata Sandi Baru <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type={showNewPass ? "text" : "password"}
                        required
                        placeholder="Minimal 6 karakter"
                        value={newPasswordInput}
                        onChange={e => setNewPasswordInput(e.target.value)}
                        className="w-full h-10 pl-3.5 pr-10 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium font-mono"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                      >
                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Konfirmasi Kata Sandi Baru <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type={showConfirmPass ? "text" : "password"}
                        required
                        placeholder="Ulangi kata sandi baru"
                        value={confirmPasswordInput}
                        onChange={e => setConfirmPasswordInput(e.target.value)}
                        className="w-full h-10 pl-3.5 pr-10 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium font-mono"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                      >
                        {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements Checklist */}
                  <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-[11px] space-y-1.5">
                    <span className="font-bold text-slate-300 block">Kriteria Keamanan Kata Sandi:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <Check 
                          size={13} 
                          className={newPasswordInput.length >= 6 ? "text-emerald-400" : "text-slate-600"} 
                        />
                        <span className={newPasswordInput.length >= 6 ? "text-emerald-300" : "text-slate-500"}>
                          Minimal 6 karakter ({newPasswordInput.length}/6)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check 
                          size={13} 
                          className={newPasswordInput.length > 0 && newPasswordInput === confirmPasswordInput ? "text-emerald-400" : "text-slate-600"} 
                        />
                        <span className={newPasswordInput.length > 0 && newPasswordInput === confirmPasswordInput ? "text-emerald-300" : "text-slate-500"}>
                          Konfirmasi kata sandi cocok
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-3">
                    <button 
                      type="submit"
                      disabled={pwdFormStatus.type === 'loading'}
                      className="px-5 h-10 rounded-lg bg-teal-600 hover:bg-teal-500 active:scale-[0.99] text-slate-950 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {pwdFormStatus.type === 'loading' ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={15} />
                          <span>Simpan Kata Sandi Baru</span>
                        </>
                      )}
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        setCurrentPasswordInput('');
                        setNewPasswordInput('');
                        setConfirmPasswordInput('');
                        setPwdFormStatus({ type: 'idle', message: '' });
                      }}
                      className="px-4 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                    >
                      Batal
                    </button>
                  </div>

                </form>
              </div>

              {/* Security Audit & Danger Zone (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Clinical Security Standards & Protocol */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3.5">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Shield size={16} className="text-teal-400" />
                    Protokol Keamanan Rekam Medis (KDIGO & CDSS)
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sistem dilengkapi tata kelola keamanan klinis berlapis untuk menjamin integritas dan privasi rekam medis pasien:
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Akses Konsol Terisolasi</strong>
                        <span className="text-slate-400 text-[11px]">Akses administrator dipisahkan secara ketat dari portal publik pasien tanpa navigasi terbuka.</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Auto-Lock Sesi Otomatis</strong>
                        <span className="text-slate-400 text-[11px]">Sesi administrator langsung diakhiri saat keluar atau setelah 15 menit inaktivitas.</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Mitigasi Percobaan Ilegal (Rate Limiter)</strong>
                        <span className="text-slate-400 text-[11px]">Pembatasan akses otomatis (kunci 60 detik) jika terjadi 5 kali kesalahan login berurutan.</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Enkripsi Kriptografis SHA-256 + Salt</strong>
                        <span className="text-slate-400 text-[11px]">Kredensial disimpan dengan algoritma hashing satu arah untuk perlindungan maksimal data rekam medis.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency Reset & Factory Defaults */}
                <div className="bg-slate-900 border border-rose-950/60 p-5 rounded-2xl space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle size={15} />
                    Zona Darurat & Reset Akun
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Jika Anda lupa kata sandi baru atau ingin mengembalikan kredensial administrator ke pengaturan awal pabrik:
                  </p>

                  <div className="pt-1 flex flex-col sm:flex-row gap-2">
                    <button 
                      type="button"
                      onClick={handleResetDefaultCredentials}
                      className="px-3.5 py-2 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw size={13} />
                      <span>Reset ke Standar (admin / admin123)</span>
                    </button>

                    <button 
                      type="button"
                      onClick={handleLogout}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogOut size={13} />
                      <span>Kunci Sesi Sekarang</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* =====================================================================
          PATIENT DETAIL MODAL
      ===================================================================== */}
      <AnimatePresence>
        {selectedPatient && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-lg text-white">Detail Rekam Medis Pasien</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: REB-{selectedPatient.id} • Tanggal: {new Date(selectedPatient.date || '').toLocaleString('id-ID')}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedPatient(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status Header */}
              <div className={cn(
                "p-4 rounded-xl border flex items-center justify-between",
                selectedPatient.prediction === 'Risiko Tinggi' 
                  ? "bg-rose-950/40 border-rose-800/80 text-rose-200" 
                  : "bg-emerald-950/40 border-emerald-800/80 text-emerald-200"
              )}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Hasil Diagnosis AI</span>
                  <p className="text-xl font-black">{selectedPatient.prediction}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Skor Keyakinan</span>
                  <p className="text-2xl font-black font-mono">{selectedPatient.confidence}%</p>
                </div>
              </div>

              {/* 8 Laboratory Parameters */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">8 Parameter Laboratorium</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Kreatinin</span>
                    <span className="font-mono font-bold text-sm">{selectedPatient.formData?.creatinine} mg/dL</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Ureum</span>
                    <span className="font-mono font-bold text-sm">{selectedPatient.formData?.ureum} mg/dL</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Hemoglobin</span>
                    <span className="font-mono font-bold text-sm">{selectedPatient.formData?.hb} g/dL</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Tekanan Darah</span>
                    <span className="font-mono font-bold text-sm">{selectedPatient.formData?.bp} mmHg</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">GDP</span>
                    <span className="font-mono font-bold text-sm">{selectedPatient.formData?.gdp} mg/dL</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">G2H</span>
                    <span className="font-mono font-bold text-sm">{selectedPatient.formData?.g2h} mg/dL</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Kolesterol</span>
                    <span className="font-mono font-bold text-sm">{selectedPatient.formData?.cholesterol} mg/dL</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">BMI</span>
                    <span className="font-mono font-bold text-sm">{selectedPatient.formData?.bmi} kg/m²</span>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {selectedPatient.recommendations && selectedPatient.recommendations.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rekomendasi Penanganan</h4>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    {selectedPatient.recommendations.map((rec, i) => (
                      <p key={i} className="p-2 rounded bg-slate-800/40 border border-slate-800 leading-relaxed">
                        <span className="font-bold mr-1 text-teal-400">{i + 1}.</span> {rec}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button 
                  onClick={() => setSelectedPatient(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
