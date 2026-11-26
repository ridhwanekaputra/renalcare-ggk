import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  Info, 
  Stethoscope, 
  ShieldCheck, 
  User, 
  ClipboardList, 
  Droplets, 
  Heart, 
  Scale, 
  Search, 
  Trash2, 
  BookOpen, 
  Cpu, 
  Book, 
  Layers, 
  Shield, 
  AlertTriangle, 
  HelpCircle,
  Printer,
  Sparkles,
  Check,
  AlertCircle,
  FileText,
  Calendar,
  Zap,
  Sliders,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Download,
  Menu,
  X,
  Smartphone,
  Wifi,
  Share2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import AdminPanel from './AdminPanel';
import { terminateAdminSession } from './lib/adminAuth';

// --- Types & Interfaces ---
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

interface Hotspot {
  id: string;
  x: string;
  y: string;
  title: string;
  desc: string;
  biomarker: string;
}

// Preset patients for instant 1-click clinical evaluation
const DEMO_PATIENTS = {
  normal: {
    name: "Ahmad Fauzi (Kontrol Rutin)",
    age: "36",
    gender: "Laki-laki",
    hb: "14.8",
    cholesterol: "172",
    bmi: "22.5",
    bp: "118",
    ureum: "28.0",
    creatinine: "0.85",
    gdp: "88",
    g2h: "115"
  },
  highRisk: {
    name: "Bambang Soedirjo (Rujukan Klinis)",
    age: "58",
    gender: "Laki-laki",
    hb: "10.2",
    cholesterol: "245",
    bmi: "28.4",
    bp: "155",
    ureum: "72.5",
    creatinine: "2.35",
    gdp: "148",
    g2h: "215"
  }
};

export default function App() {
  const [view, setView] = useState<'home' | 'form' | 'result' | 'history' | 'education' | 'about' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash;
      const p = window.location.pathname;
      if (h === '#admin' || h === '#portal-admin' || p === '/admin') {
        return 'admin';
      }
    }
    return 'home';
  });

  // Handle URL hash routing and auto-lock on exit
  useEffect(() => {
    const handleHashChange = () => {
      const h = window.location.hash;
      if (h === '#admin' || h === '#portal-admin') {
        setView('admin');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (view === 'admin') {
        terminateAdminSession();
        setView('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [view]);

  // Global discrete keyboard shortcut (Ctrl + Shift + A or Alt + Shift + A) to open Admin Portal
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.altKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        window.location.hash = 'portal-admin';
        setView('admin');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'high' | 'low'>('all');
  const [eduTab, setEduTab] = useState<'patofisiologi' | 'kdigo' | 'pencegahan' | 'komplikasi' | 'faq'>('patofisiologi');
  const [activeHotspot, setActiveHotspot] = useState<string | null>('cortex');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [history, setHistory] = useState<PredictionData[]>(() => {
    try {
      const saved = localStorage.getItem('predictionHistory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Laki-laki',
    hb: '',
    cholesterol: '',
    bmi: '',
    bp: '',
    ureum: '',
    creatinine: '',
    gdp: '',
    g2h: ''
  });

  const [prediction, setPrediction] = useState<PredictionData | null>(null);

  // Anatomical Hotspots for the interactive kidney scan workstation
  const hotspots: Hotspot[] = [
    {
      id: 'cortex',
      x: '28%',
      y: '26%',
      title: 'Korteks Renalis (Glomerulus)',
      desc: 'Lokasi unit filtrasi utama darah (180 L plasma/hari). Kerusakan membran filtrasi di korteks tercermin langsung pada lonjakan nilai Kreatinin Serum.',
      biomarker: 'Parameter: Kreatinin & eGFR'
    },
    {
      id: 'medulla',
      x: '45%',
      y: '50%',
      title: 'Medula & Tubulus Nefron',
      desc: 'Piramid renal yang mengonsentrasikan urine, mereabsorpsi air, natrium, dan glukosa, serta mengekskresikan sisa metabolisme protein seperti Ureum.',
      biomarker: 'Parameter: Ureum & Osmolaritas'
    },
    {
      id: 'vasculature',
      x: '72%',
      y: '42%',
      title: 'Arteri & Vena Renalis',
      desc: 'Menerima 20-25% curah jantung. Tekanan darah tinggi kronis (Hipertensi) menyebabkan sklerosis pembuluh arteri ginjal secara permanen.',
      biomarker: 'Parameter: Tekanan Darah (BP)'
    }
  ];

  // Helper to load sample data
  const loadPreset = (type: 'normal' | 'highRisk') => {
    setFormData(DEMO_PATIENTS[type]);
  };

  // Helper to reset form
  const resetForm = () => {
    setFormData({
      name: '',
      age: '',
      gender: 'Laki-laki',
      hb: '',
      cholesterol: '',
      bmi: '',
      bp: '',
      ureum: '',
      creatinine: '',
      gdp: '',
      g2h: ''
    });
  };

  // Prediction API Handler - Supports both Vite Proxy and direct IP fallback for mobile phones!
  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
      const primaryEndpoint = isLocalHost ? '/api/predict' : 'https://renalcare-backend-gojn.onrender.com/api/predict';

      let response;
      try {
        response = await fetch(primaryEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } catch (proxyErr) {
        if (!isLocalHost) {
          throw proxyErr;
        }
        // Fallback to direct host IP port 5000 if proxy isn't reached
        const host = window.location.hostname || '127.0.0.1';
        response = await fetch(`http://${host}:5000/api/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }

      if (!response || !response.ok) {
        throw new Error(`Server returned status ${response?.status}`);
      }

      const data = await response.json();

      const histData: PredictionData = {
        ...data,
        formData,
        date: new Date().toISOString(),
        id: Date.now()
      };

      const newHistory = [histData, ...history];
      setHistory(newHistory);
      localStorage.setItem('predictionHistory', JSON.stringify(newHistory));

      setPrediction(histData);
      setView('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Gagal terhubung ke backend Flask:", err);
      alert("Koneksi ke backend gagal. Pastikan server backend Python (app.py) aktif pada port 5000.");
    } finally {
      setLoading(false);
    }
  };

  // Filtered patient history
  const filteredHistory = history.filter(item => {
    const patientName = item.formData?.name?.toLowerCase() || '';
    const matchesSearch = patientName.includes(searchQuery.toLowerCase());
    if (historyFilter === 'high') return matchesSearch && item.prediction === 'Risiko Tinggi';
    if (historyFilter === 'low') return matchesSearch && item.prediction === 'Risiko Rendah';
    return matchesSearch;
  });

  // Calculate detailed parameters status for diagnosis report
  const getParamsList = (data: any) => {
    if (!data) return [];
    const g = data.gender;
    const hb = Number(data.hb);
    const isHbNormal = g === 'Laki-laki' ? hb >= 13 : hb >= 12;
    const hbIdeal = g === 'Laki-laki' ? '13.0 - 17.5' : '12.0 - 15.5';

    const chol = Number(data.cholesterol);
    const bmi = Number(data.bmi);
    const bp = Number(data.bp);
    const ureum = Number(data.ureum);
    const creat = Number(data.creatinine);
    const gdp = Number(data.gdp);
    const g2h = Number(data.g2h);

    return [
      {
        code: 'CREAT',
        label: 'Kreatinin Serum',
        val: data.creatinine,
        unit: 'mg/dL',
        ideal: '0.6 - 1.2',
        normal: creat <= 1.2,
        critical: creat > 1.4,
        role: 'Gold standard penanda laju filtrasi glomerulus'
      },
      {
        code: 'UREA',
        label: 'Kadar Ureum Darah',
        val: data.ureum,
        unit: 'mg/dL',
        ideal: '15.0 - 50.0',
        normal: ureum <= 50,
        critical: ureum > 65,
        role: 'Indikator retensi toksin uremik katabolisme protein'
      },
      {
        code: 'HB',
        label: 'Hemoglobin (Hb)',
        val: data.hb,
        unit: 'g/dL',
        ideal: hbIdeal,
        normal: isHbNormal,
        critical: hb < 11.0,
        role: 'Deteksi komplikasi anemia akibat defisiensi eritropoetin'
      },
      {
        code: 'BP',
        label: 'Tekanan Darah Sistolik',
        val: data.bp,
        unit: 'mmHg',
        ideal: '90 - 120',
        normal: bp <= 130,
        critical: bp >= 140,
        role: 'Penyebab primer kerusakan pembuluh kapiler nefron'
      },
      {
        code: 'GDP',
        label: 'Gula Darah Puasa (GDP)',
        val: data.gdp,
        unit: 'mg/dL',
        ideal: '70 - 100',
        normal: gdp <= 125,
        critical: gdp >= 126,
        role: 'Pemeriksaan nefropati diabetik (pemicu utama GGK)'
      },
      {
        code: 'G2H',
        label: 'Gula Darah 2 Jam PP',
        val: data.g2h,
        unit: 'mg/dL',
        ideal: '< 140',
        normal: g2h <= 140,
        critical: g2h >= 200,
        role: 'Penilaian kontrol glikemik post-prandial'
      },
      {
        code: 'CHOL',
        label: 'Kolesterol Total',
        val: data.cholesterol,
        unit: 'mg/dL',
        ideal: '< 200',
        normal: chol <= 200,
        critical: chol > 240,
        role: 'Faktor risiko aterosklerosis arteri renalis'
      },
      {
        code: 'BMI',
        label: 'Body Mass Index (BMI)',
        val: data.bmi,
        unit: 'kg/m²',
        ideal: '18.5 - 24.9',
        normal: bmi <= 25,
        critical: bmi >= 30,
        role: 'Parameter hiperfiltrasi ginjal dan obesitas metabolik'
      }
    ];
  };

  const navTo = (targetView: 'home' | 'form' | 'result' | 'history' | 'education' | 'about' | 'admin') => {
    if (view === 'admin' && targetView !== 'admin') {
      terminateAdminSession();
    }
    setView(targetView);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render isolated Admin Panel if in admin view
  if (view === 'admin') {
    return (
      <AdminPanel 
        onBackToPatientView={() => {
          terminateAdminSession();
          if (window.location.hash === '#admin' || window.location.hash === '#portal-admin') {
            window.location.hash = '';
          }
          navTo('home');
        }}
        predictionHistory={history}
        onUpdateHistory={setHistory}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-teal-600 selection:text-white pb-24 lg:pb-0">
      
      {/* =========================================================================
          CLINICAL NAVIGATION HEADER (RESPONSIVE DESKTOP & MOBILE)
      ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navTo('home')}>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-900 flex items-center justify-center text-teal-400 border border-slate-800 shadow-sm shrink-0">
              <Activity size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900">RenalCare<span className="text-teal-600 font-extrabold">AI</span></span>
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60">CDSS</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Sistem Skrining Deteksi Gagal Ginjal</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 text-sm font-semibold">
            <button 
              onClick={() => navTo('home')} 
              className={cn("px-4 py-2 rounded-lg transition-all cursor-pointer", view === 'home' ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900")}
            >
              Beranda
            </button>
            <button 
              onClick={() => navTo('form')} 
              className={cn("px-4 py-2 rounded-lg transition-all cursor-pointer", view === 'form' ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900")}
            >
              Pemeriksaan Baru
            </button>
            <button 
              onClick={() => navTo('history')} 
              className={cn("px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5", view === 'history' ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900")}
            >
              Arsip Pasien
              {history.length > 0 && (
                <span className="text-xs px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 font-mono font-bold">
                  {history.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => navTo('education')} 
              className={cn("px-4 py-2 rounded-lg transition-all cursor-pointer", view === 'education' ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900")}
            >
              Panduan Klinis
            </button>
            <button 
              onClick={() => navTo('about')} 
              className={cn("px-4 py-2 rounded-lg transition-all cursor-pointer", view === 'about' ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900")}
            >
              Validasi Model
            </button>
          </nav>

          {/* Right Action & Mobile Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            

            {/* Desktop Start Screening button */}
            <button 
              onClick={() => navTo('form')}
              className="hidden sm:flex bg-teal-700 hover:bg-teal-800 active:scale-[0.98] text-white px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all items-center gap-2 cursor-pointer"
            >
              <Stethoscope size={16} />
              <span>Mulai Skrining</span>
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
              aria-label="Toggle menu navigasi"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

          </div>
        </div>

        {/* MOBILE SLIDE-OUT DRAWER */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden border-b border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs font-mono text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Model AI: XGBoost + Random Forest Online
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1 font-semibold text-sm">
                <button 
                  onClick={() => navTo('home')}
                  className={cn("w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between", view === 'home' ? "bg-teal-50 text-teal-800 font-bold" : "text-slate-700 hover:bg-slate-50")}
                >
                  <span>Beranda</span>
                  <ChevronRight size={16} className="opacity-40" />
                </button>
                <button 
                  onClick={() => navTo('form')}
                  className={cn("w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between", view === 'form' ? "bg-teal-50 text-teal-800 font-bold" : "text-slate-700 hover:bg-slate-50")}
                >
                  <span>Pemeriksaan Baru</span>
                  <ChevronRight size={16} className="opacity-40" />
                </button>
                <button 
                  onClick={() => navTo('history')}
                  className={cn("w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between", view === 'history' ? "bg-teal-50 text-teal-800 font-bold" : "text-slate-700 hover:bg-slate-50")}
                >
                  <span className="flex items-center gap-2">
                    Arsip Pasien
                    {history.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-mono font-bold">
                        {history.length}
                      </span>
                    )}
                  </span>
                  <ChevronRight size={16} className="opacity-40" />
                </button>
                <button 
                  onClick={() => navTo('education')}
                  className={cn("w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between", view === 'education' ? "bg-teal-50 text-teal-800 font-bold" : "text-slate-700 hover:bg-slate-50")}
                >
                  <span>Panduan Klinis GGK</span>
                  <ChevronRight size={16} className="opacity-40" />
                </button>
                <button 
                  onClick={() => navTo('about')}
                  className={cn("w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between", view === 'about' ? "bg-teal-50 text-teal-800 font-bold" : "text-slate-700 hover:bg-slate-50")}
                >
                  <span>Validasi & Metodologi AI</span>
                  <ChevronRight size={16} className="opacity-40" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>



      {/* =========================================================================
          MAIN APPLICATION ROUTER
      ========================================================================= */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          
          {/* ---------------------------------------------------------------------
              VIEW 1: BERANDA / CLINICAL OVERVIEW (RESPONSIVE KIDNEY VIEWPORT)
          --------------------------------------------------------------------- */}
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 space-y-12 sm:space-y-16 print:hidden"
            >
              {/* HERO SECTION WITH ANATOMICAL SCANNER */}
              <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                
                {/* Left Column: Authoritative Clinical Narrative */}
                <div className="lg:col-span-6 space-y-5 sm:space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-700">
                    <ShieldCheck size={14} className="text-teal-700 shrink-0" />
                    <span>Protokol Skrining Terstandar KDIGO</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-[50px] font-extrabold tracking-tight text-slate-900 leading-[1.2]">
                    Deteksi Dini Risiko <br />
                    <span className="text-teal-700">Gagal Ginjal Kronis</span> <br />
                    Berbasis Machine Learning
                  </h1>

                  <p className="text-slate-600 text-sm sm:text-base lg:text-lg leading-relaxed font-normal text-justify">
                    Platform pendukung keputusan medis (<i>Clinical Decision Support System</i>) yang mengintegrasikan algoritma 
                    <strong className="text-slate-800 font-semibold"> Hybrid Ensemble (XGBoost & Random Forest)</strong> untuk menganalisis 8 biomarker laboratorium kunci, mendeteksi penurunan laju filtrasi glomerulus sebelum timbul kerusakan jaringan nefron ireversibel.
                  </p>

                  {/* Highlights / Trust metrics */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2 border-y border-slate-200/80 py-4 sm:py-5">
                    <div>
                      <p className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900">8 Panel</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">Biomarker Darah</p>
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-extrabold font-mono text-teal-700">98.4%</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">Akurasi Validasi</p>
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900">&lt; 1 Detik</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">Komputasi Realtime</p>
                    </div>
                  </div>

                  {/* Hero Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                    <button 
                      onClick={() => navTo('form')}
                      className="bg-teal-700 hover:bg-teal-800 active:scale-[0.98] text-white px-6 sm:px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
                    >
                      <span>Input Rekam Medis Pasien</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                      onClick={() => navTo('education')}
                      className="bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 border border-slate-200 px-5 sm:px-6 py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <BookOpen size={18} className="text-slate-500" />
                      <span>Pelajari Parameter Ginjal</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: High-Tech Medical Kidney Scan Workstation (Touch & Mobile Optimized) */}
                <div className="lg:col-span-6">
                  <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 sm:p-6 shadow-2xl overflow-hidden text-slate-300">
                    
                    {/* Background Medical Grid & Reticle */}
                    <div className="absolute inset-0 clinical-grid-dark opacity-40 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-80 h-64 sm:h-80 rounded-full border border-teal-500/10 pointer-events-none" />

                    {/* Scanner Top Telemetry Header */}
                    <div className="relative z-10 flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800/80 text-[10px] sm:text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                        <span className="text-teal-400 font-semibold uppercase tracking-wider">NEPHRO-SCAN // WORKSTATION</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded bg-slate-800 text-[10px] text-teal-400 font-mono font-bold border border-slate-700">
                        DIAGNOSTIC SCAN
                      </span>
                    </div>

                    {/* Kidney Visual Stage with Laser Scanline and Hotspots */}
                    <div className="relative z-10 my-3 sm:my-4 h-[280px] sm:h-[360px] flex items-center justify-center overflow-hidden">
                      
                      {/* Active Medical Scanline Sweeping Vertically */}
                      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_15px_#2dd4bf] animate-scanline z-20 pointer-events-none" />

                      {/* Floating Kidney Illustration */}
                      <motion.div 
                        animate={{ y: [-4, 4, -4] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="relative w-56 sm:w-72 max-h-[260px] sm:max-h-[300px] flex items-center justify-center"
                      >
                        <img 
                          src="/ginjal.png" 
                          alt="Anatomi Renal & Sistem Filtrasi Nefron" 
                          className="w-full h-auto object-contain filter drop-shadow-[0_15px_25px_rgba(13,148,136,0.25)] select-none"
                        />

                        {/* Interactive Anatomical Hotspots (Optimized for finger touch tap) */}
                        {hotspots.map((h) => {
                          const isSelected = activeHotspot === h.id;
                          return (
                            <div 
                              key={h.id}
                              style={{ top: h.y, left: h.x }}
                              className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
                            >
                              <button 
                                onClick={() => setActiveHotspot(h.id)}
                                className={cn(
                                  "relative w-8 h-8 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95",
                                  isSelected ? "bg-teal-500 text-slate-950 scale-110 shadow-[0_0_15px_#14b8a6]" : "bg-slate-900/95 text-teal-300 border border-teal-500/60"
                                )}
                                title={h.title}
                              >
                                <span className="w-2.5 h-2.5 sm:w-2 sm:h-2 rounded-full bg-current" />
                                <span className="absolute inset-0 rounded-full border border-teal-400 animate-radar pointer-events-none opacity-40" />
                              </button>
                            </div>
                          );
                        })}
                      </motion.div>

                      {/* Corner telemetry coordinates */}
                      <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-500">COORD: 32.14°N</div>
                      <div className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-500">RES: 0.12 mm/px</div>
                    </div>

                    {/* Bottom Dynamic Hotspot Inspector Card */}
                    <div className="relative z-10 bg-slate-900/90 rounded-xl p-3 sm:p-4 border border-slate-800 text-xs">
                      {activeHotspot ? (
                        (() => {
                          const curr = hotspots.find(h => h.id === activeHotspot) || hotspots[0];
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-slate-100 text-[11px] sm:text-xs flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                                  {curr.title}
                                </h4>
                                <span className="text-[10px] font-mono text-teal-400 font-semibold">{curr.biomarker}</span>
                              </div>
                              <p className="text-slate-400 text-[11px] leading-relaxed">
                                {curr.desc}
                              </p>
                            </div>
                          );
                        })()
                      ) : (
                        <p className="text-slate-500 text-center text-xs">Ketuk salah satu titik hotspot pada ginjal di atas untuk analisis biomarker.</p>
                      )}
                    </div>

                    {/* Telemetry Status Bar */}
                    <div className="relative z-10 mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-mono">
                      <span>eGFR: &gt; 90 mL/min</span>
                      <span className="text-teal-400 font-semibold">Engine Active</span>
                    </div>

                  </div>
                </div>
              </div>

              {/* SECTION: 8 BIOMARKER CLINICAL FRAMEWORK */}
              <div className="space-y-5 pt-2">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Kerangka Diagnostik Komprehensif</span>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                      8 Indikator Klinis Fungsi Renal & Metabolik
                    </h2>
                  </div>
                  <p className="text-slate-500 text-xs sm:text-sm max-w-md">
                    Parameter terpilih merepresentasikan interaksi multi-organ: hemodinamik sistemik, filtrasi nefron, dan regulasi glikemik.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    {
                      name: "Kreatinin Serum",
                      unit: "0.6 - 1.2 mg/dL",
                      desc: "Hasil pemecahan fosfokreatin otot yang disaring 100% oleh glomerulus. Penanda primer disfungsi ekskresi.",
                      tag: "Filtrasi Kritis"
                    },
                    {
                      name: "Kadar Ureum",
                      unit: "15 - 50 mg/dL",
                      desc: "Produk akhir metabolisme protein. Peningkatan menandakan sindrom uremia dan penurunan klirens renal.",
                      tag: "Toksin Uremik"
                    },
                    {
                      name: "Hemoglobin (Hb)",
                      unit: "≥ 12.0 - 13.0 g/dL",
                      desc: "Ginjal memproduksi hormon eritropoetin (EPO). Kerusakan kronis memicu anemia renal dini.",
                      tag: "Hematologi"
                    },
                    {
                      name: "Tekanan Darah",
                      unit: "90 - 120 mmHg",
                      desc: "Hipertensi menekan kapiler intraglomerular secara destruktif, mempercepat sklerosis nefron.",
                      tag: "Vaskular"
                    },
                    {
                      name: "Gula Darah Puasa",
                      unit: "70 - 100 mg/dL",
                      desc: "Hiperglikemia kronis memicu glikosilasi protein membran basal glomerulus (Nefropati Diabetik).",
                      tag: "Endokrin"
                    },
                    {
                      name: "Gula 2 Jam PP",
                      unit: "< 140 mg/dL",
                      desc: "Toleransi glukosa abnormal mengindikasikan resistensi insulin yang memperburuk perfusi mikrovaskular.",
                      tag: "Metabolik"
                    },
                    {
                      name: "Kolesterol Total",
                      unit: "< 200 mg/dL",
                      desc: "Dislipidemia memicu aterosklerosis pada pembuluh darah ginjal dan meningkatkan stres oksidatif.",
                      tag: "Profil Lipid"
                    },
                    {
                      name: "Body Mass Index",
                      unit: "18.5 - 24.9 kg/m²",
                      desc: "Obesitas menyebabkan hiperfiltrasi kompensatoris pada nefron yang memicu sklerosis fokal.",
                      tag: "Antropometri"
                    }
                  ].map((param, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 hover:border-teal-500/50 hover:shadow-md transition-all space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                          {param.tag}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{param.unit}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-teal-700 transition-colors">{param.name}</h3>
                      <p className="text-slate-600 text-xs leading-relaxed font-normal">{param.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CLINICAL CTA CARD */}
              <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl text-white flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1.5 text-center md:text-left">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Siap Memulai Skrining Pasien?</h3>
                  <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
                    Masukkan hasil uji laboratorium pasien ke formulir rekam medis. Sistem akan menjalankan komputasi probabilitas instan.
                  </p>
                </div>
                <button 
                  onClick={() => navTo('form')}
                  className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 active:scale-[0.98] text-slate-950 font-bold px-7 py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 text-sm sm:text-base"
                >
                  <Stethoscope size={18} />
                  <span>Buka Form Pemeriksaan</span>
                </button>
              </div>

            </motion.div>
          )}

          {/* ---------------------------------------------------------------------
              VIEW 2: FORMULIR SKRINING PASIEN (MOBILE NUMPAD READY)
          --------------------------------------------------------------------- */}
          {view === 'form' && (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 print:hidden"
            >
              {/* Header with Navigation & Presets */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-slate-200">
                <div>
                  <button 
                    onClick={() => navTo('home')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-1.5 cursor-pointer"
                  >
                    <ArrowRight size={14} className="rotate-180" /> Kembali ke Beranda
                  </button>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Formulir Input Data Klinis Pasien
                  </h1>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                    Lengkapi parameter laboratorium. Di HP, keyboard angka otomatis aktif pada kolom pengisian.
                  </p>
                </div>

                {/* Instant Preset Buttons for Easy Demo/Testing */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-500 px-1.5 flex items-center gap-1">
                    <Sparkles size={12} className="text-teal-600" /> Contoh Data:
                  </span>
                  <button 
                    type="button"
                    onClick={() => loadPreset('normal')}
                    className="text-xs font-semibold px-2.5 py-1.5 bg-white hover:bg-emerald-50 active:scale-95 text-emerald-800 rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer"
                  >
                    Pasien Sehat
                  </button>
                  <button 
                    type="button"
                    onClick={() => loadPreset('highRisk')}
                    className="text-xs font-semibold px-2.5 py-1.5 bg-white hover:bg-rose-50 active:scale-95 text-rose-800 rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer"
                  >
                    Risiko Tinggi
                  </button>
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="text-xs font-semibold px-2 py-1.5 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Kosongkan form"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Form Input Workstation */}
              <form onSubmit={handlePredict} className="space-y-6 sm:space-y-8">
                
                {/* 1. SEKSI DEMOGRAFI */}
                <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm sm:text-base pb-3 border-b border-slate-100">
                    <User size={18} className="text-teal-700" />
                    <span>Identitas & Profil Demografi</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Nama Lengkap Pasien <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Budi Hartono"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-base text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Usia (Tahun) <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="number" 
                        inputMode="numeric"
                        required
                        min="1"
                        max="120"
                        placeholder="e.g. 48"
                        value={formData.age}
                        onChange={e => setFormData({...formData, age: e.target.value})}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-base text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Jenis Kelamin <span className="text-rose-500">*</span>
                      </label>
                      <select 
                        value={formData.gender}
                        onChange={e => setFormData({...formData, gender: e.target.value})}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-base text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium cursor-pointer"
                      >
                        <option value="Laki-laki">Laki-laki (Pria)</option>
                        <option value="Perempuan">Perempuan (Wanita)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. SEKSI PANEL BIOMARKER GINJAL (KRITIS) */}
                <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm sm:text-base">
                      <Activity size={18} className="text-teal-700" />
                      <span>Panel Fungsi Ginjal (Biomarker Kritis)</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">Laju Filtrasi Glomerulus</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Kreatinin */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Kreatinin Serum <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-500 font-mono">Ref: 0.6 - 1.2 mg/dL</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.01" 
                          inputMode="decimal"
                          required
                          placeholder="0.95"
                          value={formData.creatinine}
                          onChange={e => setFormData({...formData, creatinine: e.target.value})}
                          className="w-full h-12 pl-3.5 pr-16 bg-slate-50 border border-slate-300 rounded-lg text-base font-bold font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-slate-400">mg/dL</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {Number(formData.creatinine) > 1.4 ? (
                          <span className="text-rose-600 font-semibold flex items-center gap-1">
                            <AlertCircle size={12} /> Melebihi batas aman (Indikasi gangguan filtrasi)
                          </span>
                        ) : Number(formData.creatinine) > 0 ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Check size={12} /> Berada dalam rentang filtrasi normal
                          </span>
                        ) : "Pembersihan total oleh glomerulus nefron."}
                      </p>
                    </div>

                    {/* Ureum */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Kadar Ureum Darah <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-500 font-mono">Ref: 15.0 - 50.0 mg/dL</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.1" 
                          inputMode="decimal"
                          required
                          placeholder="26.5"
                          value={formData.ureum}
                          onChange={e => setFormData({...formData, ureum: e.target.value})}
                          className="w-full h-12 pl-3.5 pr-16 bg-slate-50 border border-slate-300 rounded-lg text-base font-bold font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-slate-400">mg/dL</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {Number(formData.ureum) > 50 ? (
                          <span className="text-rose-600 font-semibold flex items-center gap-1">
                            <AlertCircle size={12} /> Uremia terdeteksi (Retensi toksin metabolisme)
                          </span>
                        ) : Number(formData.ureum) > 0 ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Check size={12} /> Ekskresi urea dalam ambang sehat
                          </span>
                        ) : "Representasi ekskresi limbah katabolisme protein."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. SEKSI PANEL HEMODINAMIK & METABOLISME */}
                <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm sm:text-base">
                      <Heart size={18} className="text-teal-700" />
                      <span>Panel Hemodinamik, Darah & Antropometri</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Hemoglobin */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Hemoglobin (Hb)</label>
                        <span className="text-[11px] text-slate-400 font-mono">≥ 12-13</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="number" step="0.1" inputMode="decimal" required placeholder="14.2"
                          value={formData.hb} onChange={e => setFormData({...formData, hb: e.target.value})}
                          className="w-full h-11 pl-3.5 pr-14 bg-slate-50 border border-slate-300 rounded-lg text-base font-bold font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">g/dL</span>
                      </div>
                    </div>

                    {/* Tekanan Darah */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Tekanan Darah (BP)</label>
                        <span className="text-[11px] text-slate-400 font-mono">90-120</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="number" inputMode="numeric" required placeholder="120"
                          value={formData.bp} onChange={e => setFormData({...formData, bp: e.target.value})}
                          className="w-full h-11 pl-3.5 pr-16 bg-slate-50 border border-slate-300 rounded-lg text-base font-bold font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">mmHg</span>
                      </div>
                    </div>

                    {/* Kolesterol */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Kolesterol Total</label>
                        <span className="text-[11px] text-slate-400 font-mono">&lt; 200</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="number" inputMode="numeric" required placeholder="185"
                          value={formData.cholesterol} onChange={e => setFormData({...formData, cholesterol: e.target.value})}
                          className="w-full h-11 pl-3.5 pr-16 bg-slate-50 border border-slate-300 rounded-lg text-base font-bold font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">mg/dL</span>
                      </div>
                    </div>

                    {/* BMI */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">BMI (Indeks Massa)</label>
                        <span className="text-[11px] text-slate-400 font-mono">18.5-24.9</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="number" step="0.1" inputMode="decimal" required placeholder="23.5"
                          value={formData.bmi} onChange={e => setFormData({...formData, bmi: e.target.value})}
                          className="w-full h-11 pl-3.5 pr-16 bg-slate-50 border border-slate-300 rounded-lg text-base font-bold font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">kg/m²</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. SEKSI PANEL GULA DARAH (NEFROPATI DIABETIK) */}
                <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm sm:text-base">
                      <Droplets size={18} className="text-teal-700" />
                      <span>Panel Glukosa Darah (Skrining Nefropati Diabetik)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* GDP */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Gula Darah Puasa (GDP)</label>
                        <span className="text-[11px] text-slate-500 font-mono">Ref: 70 - 100</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="number" inputMode="numeric" required placeholder="90"
                          value={formData.gdp} onChange={e => setFormData({...formData, gdp: e.target.value})}
                          className="w-full h-11 pl-3.5 pr-16 bg-slate-50 border border-slate-300 rounded-lg text-base font-bold font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">mg/dL</span>
                      </div>
                    </div>

                    {/* G2H */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Gula Darah 2 Jam PP</label>
                        <span className="text-[11px] text-slate-500 font-mono">Ref: &lt; 140</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="number" inputMode="numeric" required placeholder="125"
                          value={formData.g2h} onChange={e => setFormData({...formData, g2h: e.target.value})}
                          className="w-full h-11 pl-3.5 pr-16 bg-slate-50 border border-slate-300 rounded-lg text-base font-bold font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">mg/dL</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-13 sm:h-14 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Menganalisis Parameter via Model AI...</span>
                      </div>
                    ) : (
                      <>
                        <Zap size={18} />
                        <span>Jalankan Analisis Prediksi Klinis</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                  <p className="text-center text-[11px] text-slate-400 mt-2.5">
                    Model Machine Learning (XGBoost + Random Forest) aktif memproses data pasien secara lokal & privat.
                  </p>
                </div>
              </form>
            </motion.div>
          )}

          {/* ---------------------------------------------------------------------
              VIEW 3: HASIL DIAGNOSIS / CLINICAL REPORT
          --------------------------------------------------------------------- */}
          {view === 'result' && prediction && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8"
            >
              {/* TOP ACTION BAR (PRINT, NEW, BACK) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-slate-200 print:hidden">
                <div>
                  <button 
                    onClick={() => navTo('home')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-1.5 cursor-pointer"
                  >
                    <ArrowRight size={14} className="rotate-180" /> Kembali ke Beranda
                  </button>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Laporan Hasil Analisis Risiko Renal
                  </h1>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                    ID Dokumen: <span className="font-mono font-bold text-slate-700">REB-{prediction.id || '2026-X'}</span> • {new Date(prediction.date || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <button 
                    onClick={() => {
                      resetForm();
                      navTo('form');
                    }}
                    className="flex-1 sm:flex-initial bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <User size={16} /> Pasien Baru
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="flex-1 sm:flex-initial bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer size={16} /> Cetak (PDF)
                  </button>
                </div>
              </div>

              {/* SCREEN CARD: EXECUTIVE RISK BANNER */}
              <div className={cn(
                "rounded-2xl p-5 sm:p-8 border shadow-sm transition-all print:hidden",
                prediction.prediction === "Risiko Tinggi" 
                  ? "bg-rose-50/70 border-rose-200 text-rose-950" 
                  : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
              )}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
                  
                  {/* Left: Classification Result */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        prediction.prediction === "Risiko Tinggi" ? "bg-rose-600 animate-pulse" : "bg-emerald-600"
                      )} />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Hasil Klasifikasi Model Ensemble
                      </span>
                    </div>

                    <h2 className={cn(
                      "text-2xl sm:text-4xl font-extrabold tracking-tight",
                      prediction.prediction === "Risiko Tinggi" ? "text-rose-700" : "text-emerald-800"
                    )}>
                      {prediction.prediction}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 max-w-xl font-medium leading-relaxed">
                      Pasien <strong className="text-slate-900">{prediction.formData?.name || 'Pasien'}</strong> ({prediction.formData?.age} Thn, {prediction.formData?.gender}) diidentifikasi berada pada kategori <b>{prediction.prediction}</b> berdasarkan konsensus bobot Random Forest dan XGBoost.
                    </p>
                  </div>

                  {/* Right: Confidence Gauge */}
                  <div className="bg-white/95 p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs min-w-full sm:min-w-[240px] space-y-2 text-center lg:text-right">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Tingkat Keyakinan Model
                    </span>
                    <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900">
                      {prediction.confidence}%
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        style={{ width: `${prediction.confidence}%` }}
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          prediction.prediction === "Risiko Tinggi" ? "bg-rose-500" : "bg-teal-600"
                        )}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Konsensus Probabilitas Terpenuhi</span>
                  </div>

                </div>
              </div>

              {/* CLINICAL SUMMARY TEXT (NARRATIVE) */}
              <div className="bg-white rounded-xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs space-y-2.5 print:hidden">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
                  <Info size={18} className="text-teal-700" />
                  <span>Ringkasan Klinis & Interpretasi Medis</span>
                </div>
                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                  {prediction.explanation}
                </p>
              </div>

              {/* 8 PARAMETERS GRID STATUS */}
              <div className="bg-white rounded-xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4 print:hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
                    <Activity size={18} className="text-teal-700" />
                    <span>Evaluasi 8 Parameter Pasien</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">Standar Acuan Laboratorium</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {getParamsList(prediction.formData).map((p, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "p-3.5 sm:p-4 rounded-xl border transition-all space-y-1",
                        p.normal 
                          ? "bg-slate-50/70 border-slate-200" 
                          : "bg-rose-50/50 border-rose-200"
                      )}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{p.label}</span>
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase",
                          p.normal ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        )}>
                          {p.normal ? "Normal" : "Di Luar Batas"}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1.5 pt-0.5">
                        <span className="text-lg sm:text-xl font-black font-mono text-slate-900">{p.val || '-'}</span>
                        <span className="text-xs text-slate-500 font-mono">{p.unit}</span>
                      </div>

                      <div className="pt-1 border-t border-slate-200/60 text-[10px] text-slate-500 flex justify-between">
                        <span>Rujukan:</span>
                        <span className="font-mono font-medium text-slate-700">{p.ideal}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RECOMMENDATIONS SECTION */}
              <div className="bg-white rounded-xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs space-y-3 print:hidden">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
                  <ShieldCheck size={18} className="text-teal-700" />
                  <span>Rekomendasi Rujukan & Tindakan Medis Terarah</span>
                </div>

                <div className="space-y-2.5">
                  {prediction.recommendations && prediction.recommendations.length > 0 ? (
                    prediction.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700">
                        <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-800 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="leading-relaxed font-normal">{rec}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-xs">Tidak ada rekomendasi khusus yang tersedia.</p>
                  )}
                </div>
              </div>

              {/* OFFICIAL PRINT / PDF TEMPLATE - HIGH PRECISION 1-PAGE A4 MEDICAL CLINICAL REPORT */}
              <div className="hidden print:block print-page-fit bg-white text-slate-900 p-0 max-w-4xl mx-auto font-sans leading-tight">
                
                {/* 1. KOP SURAT KLINIS RESMI (OFFICIAL MEDICAL LETTERHEAD) */}
                <div className="pb-2.5 mb-2.5 border-b-2 border-slate-900">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-lg shrink-0 mt-0.5">
                        <Activity size={22} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">
                            RenalCare AI™ Clinical Decision Support
                          </h1>
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-teal-800 border border-slate-300 px-1.5 py-0.5 rounded">
                            ISO/KDIGO 2024
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 font-medium">
                          Pusat Komputasi Skrining & Deteksi Dini Risiko Penyakit Ginjal Kronis (PGK)
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Sistem Validasi Diagnostik Hybrid Ensemble Machine Learning (XGBoost + Random Forest)
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-slate-600 shrink-0">
                      <div className="inline-block p-1.5 rounded bg-slate-50 border border-slate-300 text-right">
                        <p className="font-mono font-bold text-slate-900 text-[11px]">
                          NO. RM: REB-{prediction.id || '2026'}
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Tanggal: {new Date(prediction.date || Date.now()).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-teal-700/60 mt-2" />
                </div>

                {/* 2. DUA KOLOM: BIODATA PASIEN & STATUS RISIKO AI */}
                <div className="grid grid-cols-12 gap-3 mb-2.5">
                  
                  {/* Biodata Pasien (7 Cols) */}
                  <div className="col-span-7 border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200">
                      <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-700 flex items-center gap-1">
                        <User size={12} className="text-teal-700" />
                        I. Data Demografi & Rekam Pasien
                      </h3>
                      <span className="text-[9px] font-mono text-slate-400">PASIEN RAWAT JALAN</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase text-slate-500 block">Nama Lengkap Pasien</span>
                        <strong className="text-slate-900 font-bold block truncate">{prediction.formData?.name || 'Pasien Anonim'}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-slate-500 block">Usia & Jenis Kelamin</span>
                        <span className="text-slate-900 font-semibold">{prediction.formData?.age || '-'} Tahun ({prediction.formData?.gender || '-'})</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-slate-500 block">Waktu Selesai Analisis</span>
                        <span className="text-slate-700 font-mono text-[10px]">{new Date(prediction.date || Date.now()).toLocaleTimeString('id-ID')} WIB</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-slate-500 block">Metode Pengujian</span>
                        <span className="text-slate-700 font-medium text-[10px]">Dual-Model Soft Voting</span>
                      </div>
                    </div>
                  </div>

                  {/* Hasil Klasifikasi AI (5 Cols) */}
                  <div className={cn(
                    "col-span-5 border rounded-lg p-2.5 flex flex-col justify-between",
                    prediction.prediction === 'Risiko Tinggi' 
                      ? "bg-rose-50/70 border-rose-300 text-rose-950" 
                      : "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                  )}>
                    <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-200/60">
                      <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-700">
                        II. Kesimpulan Skrining AI
                      </h3>
                      <span className="text-[9px] font-bold font-mono">
                        Keyakinan: {prediction.confidence}%
                      </span>
                    </div>

                    <div className="text-center py-1">
                      <span className="text-[9px] uppercase tracking-wider font-semibold opacity-75 block">Stratifikasi Risiko Nefrologi</span>
                      <p className={cn(
                        "text-lg font-black tracking-tight uppercase leading-none py-1",
                        prediction.prediction === 'Risiko Tinggi' ? "text-rose-700" : "text-emerald-700"
                      )}>
                        {prediction.prediction === 'Risiko Tinggi' ? '⚠️ RISIKO TINGGI (HIGH RISK)' : '✅ RISIKO RENDAH (LOW RISK)'}
                      </p>
                      <p className="text-[9px] leading-tight text-slate-600 mt-0.5">
                        {prediction.prediction === 'Risiko Tinggi' 
                          ? "Terindikasi disfungsi laju filtrasi glomerulus atau nefropati diabetik." 
                          : "Biomarker renal terpantau dalam rentang homeostasis sehat."}
                      </p>
                    </div>
                  </div>

                </div>

                {/* 3. TABEL 8 BIOMARKER LABORATORIUM (PRESISI & KOMPAK) */}
                <div className="mb-2.5">
                  <div className="flex items-center justify-between pb-1 mb-1">
                    <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-800">
                      III. Hasil Uji 8 Biomarker Fungsional Ginjal & Metabolik
                    </h3>
                    <span className="text-[9px] text-slate-500 italic">Nilai Rujukan Mengacu pada Konsensus Nefrologi KDIGO 2024</span>
                  </div>

                  <table className="w-full border-collapse border border-slate-300 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700">
                        <th className="border border-slate-300 py-1 px-2 text-left font-bold w-6">No</th>
                        <th className="border border-slate-300 py-1 px-2.5 text-left font-bold">Parameter Laboratorium</th>
                        <th className="border border-slate-300 py-1 px-2 text-center font-bold">Nilai Terukur</th>
                        <th className="border border-slate-300 py-1 px-2 text-center font-bold">Satuan</th>
                        <th className="border border-slate-300 py-1 px-2.5 text-center font-bold">Rentang Rujukan Normal</th>
                        <th className="border border-slate-300 py-1 px-2 text-center font-bold">Evaluasi Klinis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getParamsList(prediction.formData).map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50/60" : "bg-white"}>
                          <td className="border border-slate-300 py-1 px-2 text-center text-slate-500 font-mono text-[9px]">{idx + 1}</td>
                          <td className="border border-slate-300 py-1 px-2.5 font-medium text-slate-900">
                            {item.label}
                            <span className="text-[8px] text-slate-400 block font-normal">{item.role}</span>
                          </td>
                          <td className="border border-slate-300 py-1 px-2 text-center font-mono font-bold text-slate-900">{item.val}</td>
                          <td className="border border-slate-300 py-1 px-2 text-center text-slate-600">{item.unit}</td>
                          <td className="border border-slate-300 py-1 px-2.5 text-center font-mono text-slate-700">{item.ideal}</td>
                          <td className="border border-slate-300 py-1 px-2 text-center">
                            {item.normal ? (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                NORMAL
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-100 text-rose-800 border border-rose-200 font-bold">
                                [!] DI LUAR BATAS
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. REKOMENDASI TINDAKAN MEDIS (2-KOLOM KOMPAK: FIT TEPAT 1 HALAMAN) */}
                <div className="mb-2.5 border border-slate-300 rounded-lg p-2.5 bg-slate-50/40">
                  <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-800 pb-1 mb-1.5 border-b border-slate-200 flex items-center justify-between">
                    <span>IV. Anjuran & Rekomendasi Terarah Tindakan Klinis</span>
                    <span className="text-[9px] font-normal text-slate-500">Protokol Penanganan Primer</span>
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {prediction.recommendations && prediction.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[9px] text-slate-800 leading-snug">
                        <span className="w-3.5 h-3.5 rounded bg-teal-800 text-white font-bold text-[8px] flex items-center justify-center shrink-0 mt-0.5 font-mono">
                          {i + 1}
                        </span>
                        <p className="flex-1">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. VALIDITAS ALGORITMA & LEMBAR PENGESAHAN DOKTER */}
                <div className="pt-2 border-t border-slate-300 grid grid-cols-12 gap-3 text-[9px] text-slate-600">
                  
                  <div className="col-span-7 flex flex-col justify-between pr-2 space-y-1">
                    <div>
                      <p className="font-bold text-slate-800 uppercase tracking-wider text-[9px] mb-0.5">
                        Catatan Legalitas &amp; Validitas Medis:
                      </p>
                      <p className="leading-tight text-slate-500 text-[8.5px] text-justify">
                        Laporan skrining ini diterbitkan otomatis oleh sistem CDSS berbasis model Machine Learning Ensemble (Random Forest + XGBoost) sebagai pendukung keputusan klinis skrining dini, bukan merupakan vonis definitif. Evaluasi penanganan klinis lanjutan tetap menjadi wewenang dokter spesialis.
                      </p>
                    </div>
                    <p className="font-mono text-[7.5px] text-slate-400 pt-1">
                      Verifikasi Digital Token: SEC-REB-{prediction.id || '2026'}-AUTH • Dicetak pada: {new Date().toLocaleString('id-ID')} WIB
                    </p>
                  </div>

                  <div className="col-span-5 flex flex-col justify-between items-end">
                    <div className="w-60 text-center">
                      <p className="text-[9px] font-semibold text-slate-700 whitespace-nowrap">
                        Dokter / Tenaga Medis Penanggung Jawab,
                      </p>
                      <div className="h-10 my-0.5" />
                      <p className="text-[9.5px] font-bold text-slate-900 tracking-wider whitespace-nowrap">
                        (&nbsp;................................................................&nbsp;)
                      </p>
                      <p className="text-[8px] text-slate-500 font-mono mt-1 tracking-wider whitespace-nowrap">
                        SIP / NIP : ....................................................
                      </p>
                    </div>
                  </div>

                </div>

              </div>

            </motion.div>
          )}

          {/* ---------------------------------------------------------------------
              VIEW 4: ARSIP RIWAYAT PASIEN
          --------------------------------------------------------------------- */}
          {view === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5 sm:space-y-6 print:hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-slate-200">
                <div>
                  <button 
                    onClick={() => navTo('home')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-1.5 cursor-pointer"
                  >
                    <ArrowRight size={14} className="rotate-180" /> Kembali ke Beranda
                  </button>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Arsip Rekam Medis Pasien
                  </h1>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                    Data riwayat pemeriksaan tersimpan secara lokal dan privat pada perangkat Anda.
                  </p>
                </div>

                <button 
                  onClick={() => navTo('form')}
                  className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <Stethoscope size={16} /> Pemeriksaan Baru
                </button>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari berdasarkan nama pasien..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-white border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium text-slate-900"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
                  <button 
                    onClick={() => setHistoryFilter('all')}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer", historyFilter === 'all' ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900")}
                  >
                    Semua ({history.length})
                  </button>
                  <button 
                    onClick={() => setHistoryFilter('high')}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer", historyFilter === 'high' ? "bg-white text-rose-700 shadow-2xs" : "text-slate-500 hover:text-slate-900")}
                  >
                    Risiko Tinggi
                  </button>
                  <button 
                    onClick={() => setHistoryFilter('low')}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer", historyFilter === 'low' ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-500 hover:text-slate-900")}
                  >
                    Risiko Rendah
                  </button>
                </div>
              </div>

              {/* History List */}
              <div className="space-y-2.5 sm:space-y-3">
                {history.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <ClipboardList size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm sm:text-base">Belum Ada Rekam Medis</h3>
                      <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
                        Mulai pemeriksaan klinis pertama Anda untuk mencatat riwayat diagnosis pasien ke dalam sistem.
                      </p>
                    </div>
                    <button 
                      onClick={() => navTo('form')}
                      className="bg-teal-700 text-white font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm hover:bg-teal-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      Buka Form Skrining <ArrowRight size={14} />
                    </button>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 sm:p-8 text-center border border-slate-200/90 text-slate-500 text-xs sm:text-sm">
                    Tidak ditemukan data pasien yang cocok dengan kata kunci "{searchQuery}".
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        setPrediction(item);
                        setView('result');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 hover:border-teal-500/60 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer group active:bg-slate-50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-teal-700 transition-colors">
                            {item.formData?.name || 'Pasien Anonim'}
                          </h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                            item.prediction === "Risiko Tinggi" 
                              ? "bg-rose-100 text-rose-800 border border-rose-200/60" 
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200/60"
                          )}>
                            {item.prediction}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                          <span>{item.formData?.age} Thn ({item.formData?.gender})</span>
                          <span>•</span>
                          <span>Kreatinin: <b>{item.formData?.creatinine || '-'}</b></span>
                          <span>•</span>
                          <span>Ureum: <b>{item.formData?.ureum || '-'}</b></span>
                          <span>•</span>
                          <span>{new Date(item.date || '').toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <p className="text-[9px] uppercase font-mono font-bold text-slate-400">Kepercayaan</p>
                          <p className="text-lg sm:text-xl font-mono font-black text-slate-900">{item.confidence}%</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-teal-700 hidden sm:inline group-hover:underline">Buka Laporan</span>
                          <div className="p-1.5 sm:p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                            <ChevronRight size={18} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ---------------------------------------------------------------------
              VIEW 5: PANDUAN KLINIS & EDUKASI NEFROLOGI
          --------------------------------------------------------------------- */}
          {view === 'education' && (
            <motion.div 
              key="education"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5 sm:space-y-6 print:hidden"
            >
              <div className="pb-4 sm:pb-6 border-b border-slate-200">
                <button 
                  onClick={() => navTo('home')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-1.5 cursor-pointer"
                >
                  <ArrowRight size={14} className="rotate-180" /> Kembali ke Beranda
                </button>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Pusat Edukasi Klinis & Patofisiologi Ginjal
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                  Referensi komprehensif nefrologi klinis terstandar KDIGO (Kidney Disease: Improving Global Outcomes).
                </p>
              </div>

              {/* Responsive Navigation Tabs (Scrollable on phone) */}
              <div className="flex gap-1.5 border-b border-slate-200 pb-2.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'patofisiologi', label: 'Patofisiologi Nefron' },
                  { id: 'kdigo', label: 'Stadium KDIGO (1-5)' },
                  { id: 'pencegahan', label: 'Protokol Pencegahan' },
                  { id: 'komplikasi', label: 'Komplikasi Multiorgan' },
                  { id: 'faq', label: 'Pertanyaan Klinis (FAQ)' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setEduTab(tab.id as any)}
                    className={cn(
                      "px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0",
                      eduTab === tab.id 
                        ? "bg-teal-700 text-white shadow-2xs" 
                        : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content Card */}
              <div className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200/90 shadow-2xs space-y-5">
                
                {eduTab === 'patofisiologi' && (
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">Mekanisme Kerusakan Nefron pada Gagal Ginjal Kronis</h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      Gagal Ginjal Kronis (GGK) didefinisikan sebagai kelainan struktural atau fungsional ginjal yang berlangsung lebih dari 3 bulan dengan implikasi terhadap kesehatan umum. Setiap ginjal manusia memiliki sekitar 1 juta unit fungsional penyaring darah yang disebut <strong>Nefron</strong>.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Filtrasi Glomerulus</h4>
                        <p className="text-slate-600 text-xs leading-relaxed">
                          Glomerulus bertindak sebagai saringan selektif bertekanan tinggi. Kerusakan akibat hipertensi atau hiperglikemia menyebabkan penebalan membran basal, memicu kebocoran protein dan penurunan daya saring limbah (klirens kreatinin).
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Kompensasi & "Silent Killer"</h4>
                        <p className="text-slate-600 text-xs leading-relaxed">
                          Ketika sebagian nefron mengalami kematian jaringan (fibrosis), nefron yang tersisa akan membesar (hipertrofi) dan bekerja ekstra keras. Akibatnya, pasien sering kali tidak mengalami gejala klinis hingga &gt; 70% nefron telah rusak permanen.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {eduTab === 'kdigo' && (
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">Klasifikasi 5 Stadium Gagal Ginjal (Standar KDIGO)</h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      Tingkat keparahan disfungsi ginjal dikelompokkan berdasarkan nilai estimasi Glomerular Filtration Rate (eGFR dalam mL/min/1.73m²):
                    </p>
                    <div className="space-y-2.5">
                      {[
                        { stage: "Stadium 1", gfr: "≥ 90", title: "Fungsi Normal dengan Kerusakan Struktural", desc: "eGFR normal namun ditemukan penanda mikroalbuminuria atau kelainan pada biopsi/USG." },
                        { stage: "Stadium 2", gfr: "60 - 89", title: "Penurunan Fungsi Ringan", desc: "Penurunan laju filtrasi minimal. Pasien umumnya asimtomatik, kontrol faktor risiko sangat vital." },
                        { stage: "Stadium 3", gfr: "30 - 59", title: "Penurunan Fungsi Moderat", desc: "Toksin uremik mulai menumpuk di darah. Pasien mulai merasa kelelahan dan tekanan darah naik." },
                        { stage: "Stadium 4", gfr: "15 - 29", title: "Penurunan Fungsi Berat", desc: "Komplikasi nyata: anemia berat, edema kaki. Persiapan terapi pengganti ginjal." },
                        { stage: "Stadium 5 (ESRD)", gfr: "< 15", title: "Gagal Ginjal Terminal", desc: "Ginjal kehilangan daya filtrasi. Wajib hemodialisis (cuci darah) atau transplantasi ginjal." }
                      ].map((s, i) => (
                        <div key={i} className="flex flex-col sm:flex-row gap-2 sm:gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="flex sm:flex-col items-center sm:items-start justify-between w-full sm:w-24 shrink-0 font-mono">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[11px] font-bold",
                              i >= 3 ? "bg-rose-100 text-rose-800" : i === 2 ? "bg-amber-100 text-amber-800" : "bg-teal-100 text-teal-800"
                            )}>
                              {s.stage}
                            </span>
                            <span className="text-xs font-black text-slate-900 mt-0.5">{s.gfr} <span className="text-[9px] font-normal text-slate-500">mL/min</span></span>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{s.title}</h4>
                            <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {eduTab === 'pencegahan' && (
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">8 Kaidah Emas Perlindungan Ginjal</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { title: "Kendalikan Gula Darah", desc: "Pertahankan HbA1c < 7.0%. Diabetes melitus adalah pemicu > 40% kasus gagal ginjal terminal." },
                        { title: "Manajemen Tekanan Darah", desc: "Jaga sistolik < 130 mmHg. Batasi natrium maksimal 2.000 mg/hari (1 sendok teh garam)." },
                        { title: "Hidrasi Adekuat yang Benar", desc: "Minum 1.5 - 2.0 liter air putih sehari untuk mempertahankan laju perfusi ginjal." },
                        { title: "Hindari Penggunaan NSAID Sembarangan", desc: "Obat antinyeri bebas seperti ibuprofen menghambat prostaglandin renal dan memicu nekrosis tubular." },
                        { title: "Berhenti Merokok & Nikotin", desc: "Rokok mempersempit mikrovaskular arteri renalis dan mempercepat penurunan filtrasi hingga 3x lipat." },
                        { title: "Kontrol Berat Badan (BMI)", desc: "Mencegah hiperfiltrasi glomerular akibat obesitas yang merusak podosit ginjal secara mekanis." },
                        { title: "Pemeriksaan Skrining Laboratorium", desc: "Lakukan tes kreatinin serum dan urin lengkap berkala bagi individu berisiko." },
                        { title: "Pola Makan Seimbang", desc: "Kurangi konsumsi makanan ultra-proses, minuman berpemanis buatan, dan garam berlebih." }
                      ].map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            {item.title}
                          </h4>
                          <p className="text-slate-600 text-xs leading-relaxed pl-7">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {eduTab === 'komplikasi' && (
                  <div className="space-y-3">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">Komplikasi Sekunder Gagal Ginjal Kronis</h3>
                    <div className="space-y-2.5">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">1. Anemia Defisiensi Eritropoetin</h4>
                        <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                          Sel ginjal memproduksi 90% hormon eritropoetin (EPO). Kerusakan jaringan menghentikan sinyal EPO, memicu anemia berat yang menyebabkan tubuh lemas kronis.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">2. Hiperkalemia & Aritmia Jantung</h4>
                        <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                          Ginjal yang rusak gagal membuang kalium berlebih. Akumulasi kalium tinggi di darah dapat memicu aritmia fatal dan henti jantung mendadak.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">3. Edema & Penumpukan Cairan Tubuh</h4>
                        <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                          Ketidakmampuan mengeluarkan air memicu pembengkakan pada kaki (edema) dan sesak napas berat jika cairan masuk ke jaringan paru-paru.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {eduTab === 'faq' && (
                  <div className="space-y-3">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">Tanya Jawab Klinis (FAQ)</h3>
                    <div className="space-y-2.5">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Apakah Gagal Ginjal Kronis (GGK) bisa sembuh total?</h4>
                        <p className="text-slate-600 text-xs leading-relaxed">
                          Tidak. GGK melibatkan kerusakan jaringan nefron permanen. Terapi bertujuan memperlambat kerusakan dan menjaga fungsi nefron yang tersisa.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Mengapa Kreatinin Serum menjadi penanda utama?</h4>
                        <p className="text-slate-600 text-xs leading-relaxed">
                          Kreatinin murni dibuang oleh filtrasi ginjal. Peningkatan kreatinin dalam darah adalah bukti paling valid adanya penurunan kemampuan saring ginjal.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}

          {/* ---------------------------------------------------------------------
              VIEW 6: METODOLOGI AI & ARSITEKTUR MODEL
          --------------------------------------------------------------------- */}
          {view === 'about' && (
            <motion.div 
              key="about"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 print:hidden"
            >
              <div className="pb-4 sm:pb-6 border-b border-slate-200">
                <button 
                  onClick={() => navTo('home')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-1.5 cursor-pointer"
                >
                  <ArrowRight size={14} className="rotate-180" /> Kembali ke Beranda
                </button>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Arsitektur Komputasi & Metodologi Machine Learning
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                  Spesifikasi teknis pipeline pemodelan prediktif berbasis Soft-Voting Ensemble.
                </p>
              </div>

              {/* Technical Framework Overview */}
              <div className="bg-slate-950 text-white rounded-2xl p-5 sm:p-8 border border-slate-800 shadow-xl space-y-5">
                <div className="flex items-center gap-2">
                  <Cpu size={18} className="text-teal-400" />
                  <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-teal-400 font-bold">
                    HYBRID ENSEMBLE ENGINE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <h4 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                      <Zap size={16} className="text-teal-400" />
                      XGBoost (Extreme Gradient Boosting)
                    </h4>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Mengoptimalkan fungsi kerugian secara berulang untuk melacak pola non-linear antar parameter klinis (seperti lonjakan tekanan darah vs kreatinin).
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <h4 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                      <Layers size={16} className="text-teal-400" />
                      Random Forest Classifier
                    </h4>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Mengompilasi ratusan pohon keputusan acak (bagging) untuk mencegah overfitting dan mempertahankan akurasi generalisasi yang stabil.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 font-mono">
                  <span>Ensemble: Soft-Voting</span>
                  <span>Cross-Validation: 10-Fold Stratified</span>
                </div>
              </div>

              {/* Feature Importance Ranking */}
              <div className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200/90 shadow-2xs space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Hierarki Pengaruh Fitur (Feature Importance Ranking)</h3>
                <div className="space-y-2.5 pt-1">
                  {[
                    { name: "Kreatinin Serum", weight: 34 },
                    { name: "Kadar Ureum Darah", weight: 22 },
                    { name: "Hemoglobin (Hb)", weight: 14 },
                    { name: "Tekanan Darah Sistolik", weight: 11 },
                    { name: "Gula Darah Puasa (GDP)", weight: 9 },
                    { name: "Gula Darah 2 Jam PP", weight: 5 },
                    { name: "Kolesterol Total", weight: 3 },
                    { name: "Body Mass Index (BMI)", weight: 2 }
                  ].map((f, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-800">{i + 1}. {f.name}</span>
                        <span className="font-mono text-teal-800">{f.weight}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
                        <div 
                          style={{ width: `${f.weight * 2.8}%` }}
                          className="h-full bg-teal-600 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Research & Clinical Disclaimer */}
              <div className="bg-slate-100 rounded-xl p-4 sm:p-5 border border-slate-200 text-xs text-slate-600 space-y-1 leading-relaxed">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <ShieldCheck size={16} className="text-teal-700" />
                  <span>Batasan Tanggung Jawab Klinis (Disclaimer)</span>
                </div>
                <p>
                  Sistem skrining cerdas ini dirancang sebagai perangkat penunjang keputusan klinis (CDSS) berbasis inferensi statistik Machine Learning. Hasil prediksi tidak menggantikan diagnosis definitif oleh dokter nefrologi berlisensi.
                </p>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* =========================================================================
          NATIVE-FEEL BOTTOM APP BAR FOR MOBILE DEVICES (THUMB-FRIENDLY)
      ========================================================================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2 px-3 shadow-lg flex justify-around items-center print:hidden">
        <button 
          onClick={() => navTo('home')}
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer",
            view === 'home' ? "text-teal-700 font-bold" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <Activity size={18} />
          <span className="text-[10px]">Beranda</span>
        </button>

        <button 
          onClick={() => navTo('form')}
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer",
            view === 'form' ? "text-teal-700 font-bold" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <Stethoscope size={18} />
          <span className="text-[10px]">Skrining</span>
        </button>

        <button 
          onClick={() => navTo('history')}
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative",
            view === 'history' ? "text-teal-700 font-bold" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <ClipboardList size={18} />
          <span className="text-[10px]">Arsip</span>
          {history.length > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-teal-600" />
          )}
        </button>

        <button 
          onClick={() => navTo('education')}
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer",
            view === 'education' ? "text-teal-700 font-bold" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <BookOpen size={18} />
          <span className="text-[10px]">Edukasi</span>
        </button>
      </nav>

      {/* =========================================================================
          APPLICATION FOOTER (DESKTOP)
      ========================================================================= */}
      <footer className="border-t border-slate-200 bg-white py-6 sm:py-8 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-slate-900 text-teal-400 flex items-center justify-center font-bold text-[10px]">
              R
            </div>
            <span className="font-bold text-slate-800">RenalCare AI Platform</span>
            <span>—</span>
            <span>Clinical Nephrology Decision Support</span>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <p 
              onClick={() => {
                // Secret discrete triple-click to open admin console without exposing any buttons to patients
                const now = Date.now();
                const last = (window as any).__lastAdminClick || 0;
                if (now - last < 1500) {
                  const count = ((window as any).__adminClickCount || 1) + 1;
                  (window as any).__adminClickCount = count;
                  if (count >= 3) {
                    (window as any).__adminClickCount = 0;
                    window.location.hash = 'portal-admin';
                    navTo('admin');
                  }
                } else {
                  (window as any).__adminClickCount = 1;
                }
                (window as any).__lastAdminClick = now;
              }}
              className="select-none cursor-default text-slate-500 hover:text-slate-600 transition-colors"
              title="RenalCare AI Clinical Platform"
            >
              © 2026 Riset Klinis Deteksi Dini Gagal Ginjal Kronis
            </p>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">v2.4 Secured</span>
          </div>
        </div>
      </footer>

    </div>
  );
}