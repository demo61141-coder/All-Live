import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Tv, Lock, ShieldCheck, Play, Sparkles, Smartphone, Flame, Calendar, Settings, Sliders 
} from "lucide-react";

// Types
import { AppConfig, AppButton, NotificationItem } from "./types";

// Components
import SplashLogo from "./components/SplashLogo";
import AdPlayer from "./components/AdPlayer";
import InAppBrowser from "./components/InAppBrowser";
import NotificationCenter from "./components/NotificationCenter";
import AdminPanel from "./components/AdminPanel";

const DEFAULT_CONFIG: AppConfig = {
  buttons: [
    {
      id: "watch_1",
      name: "Watch 1",
      logo: "📺",
      link: "https://www.wikipedia.org",
      network: "startapp",
      status: "active"
    },
    {
      id: "watch_2",
      name: "Watch 2",
      logo: "🎬",
      link: "https://react.dev",
      network: "monetag",
      status: "active"
    },
    {
      id: "watch_3",
      name: "Watch 3",
      logo: "🔥",
      link: "https://vite.dev",
      network: "both",
      status: "active"
    },
    {
      id: "watch_4",
      name: "Watch 4",
      logo: "⚡",
      link: "https://expressjs.com",
      network: "startapp",
      status: "active"
    }
  ],
  adConfig: {
    adsEnabled: true,
    startappAppId: "203918239",
    monetagZoneId: "7309121",
    videoDurationSeconds: 5,
    videoAdUrl: "https://assets.mixkit.co/videos/preview/mixkit-popcorn-falling-into-a-bowl-43407-large.mp4"
  },
  notifications: [
    {
      id: "welcome_notif",
      title: "ওয়েলকাম বোনাস অফার!",
      message: "নতুন আপডেট পেতে আমাদের ওয়েবসাইটগুলো মনোযোগ দিয়ে দেখুন। যেকোনো সমস্যার জন্য আমাদের সাথে যোগাযোগ করুন।",
      type: "success",
      sentAt: "2026-06-21T06:55:00Z",
      active: true
    },
    {
      id: "ad_info",
      title: "বিজ্ঞাপন সতর্কতা ⚡",
      message: "যেকোনো বাটনে ক্লিক করুন এবং ৫ সেকেন্ডের ভিডিও বিজ্ঞাপন সম্পূর্ণ দেখে অটোমেটিক পেজ লোড করুন।",
      type: "info",
      sentAt: "2026-06-21T06:55:00Z",
      active: true
    }
  ],
  googleSheetsId: "",
  adminCode: "1234"
};

export default function App() {
  const [splashComplete, setSplashComplete] = useState(false);
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const stored = localStorage.getItem("all_live_config");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.buttons)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to retrieve config from local storage", e);
    }
    return DEFAULT_CONFIG;
  });
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Layout navigation states
  const [activeBrowserUrl, setActiveBrowserUrl] = useState<string | null>(null);
  const [activeBrowserTitle, setActiveBrowserTitle] = useState<string>("");
  const [adminViewOpen, setAdminViewOpen] = useState(false);

  // Active Ads states
  const [activeAd, setActiveAd] = useState<{
    network: "startapp" | "monetag" | "both";
    onAdCompleted: () => void;
  } | null>(null);

  // System time tracker decoration
  const [systemTime, setSystemTime] = useState("");

  useEffect(() => {
    // Set dynamic local time for aesthetic tracking
    const updateTime = () => {
      const now = new Date();
      setSystemTime(now.toLocaleString("bn-BD", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch configs from express DB server with silent failovers
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/config");
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (data && Array.isArray(data.buttons)) {
              setConfig(data);
              localStorage.setItem("all_live_config", JSON.stringify(data));
            }
          }
        }
      } catch (err) {
        console.warn("Express backend offline or unreachable. Using offline standalone storage.", err);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  // Sync settings with backend or local storage
  const handleSaveConfig = async (updated: AppConfig): Promise<boolean> => {
    setConfig(updated);
    localStorage.setItem("all_live_config", JSON.stringify(updated));

    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        return true;
      }
      console.warn("Backend save failed. Operating on standalone storage.");
      return true;
    } catch (e) {
      console.warn("Server unavailable, config saved to client storage.", e);
      return true;
    }
  };

  // Trigger Google Sheet fetch on server, falling back to direct client-side fetch on Vercel
  const handleSyncGoogleSheet = async (sheetsId: string) => {
    // 1. Try server-side action first (if online)
    try {
      const res = await fetch("/api/sync-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleSheetsId: sheetsId })
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (data.success && data.config) {
            setConfig(data.config);
            localStorage.setItem("all_live_config", JSON.stringify(data.config));
            return { success: true, message: data.message, config: data.config };
          }
        }
      }
    } catch (e) {
      console.warn("Server sync failed, falling back to direct client sync...", e);
    }

    // 2. Direct client-side CSV spreadsheet fetch (Cross-origin safe with Google Sheet exports!)
    try {
      const trimmedId = sheetsId.trim();
      const csvUrl = `https://docs.google.com/spreadsheets/d/${trimmedId}/gviz/tq?tqx=out:csv`;
      
      const response = await fetch(csvUrl);
      if (!response.ok) {
        return { 
          success: false, 
          message: "গুগল শিট অ্যাক্সেস করা যায়নি। দয়া করে স্প্রেডশিটে General Access এ 'Anyone with the link can view' সেট করুন।" 
        };
      }

      const text = await response.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        return { success: false, message: "গুগল শিটে কোনো বাটন রো খুঁজে পাওয়া যায়নি।" };
      }

      // Safe CSV Line parser
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result.map(val => val.replace(/^"(.*)"$/, "$1"));
      };

      const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
      const nameIndex = headers.indexOf("name");
      const logoIndex = headers.indexOf("logo");
      const linkIndex = headers.indexOf("link");
      const idIndex = headers.indexOf("id");
      const networkIndex = headers.indexOf("network");
      const statusIndex = headers.indexOf("status");

      if (nameIndex === -1 || linkIndex === -1) {
        return { 
          success: false, 
          message: "হেডার কলাম অনুপস্থিত! শিটে অবশ্যই 'Name' এবং 'Link' হেডার কলাম থাকতে হবে।" 
        };
      }

      const parsedButtons: AppButton[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < Math.max(nameIndex, linkIndex) + 1) continue;

        const name = cols[nameIndex];
        const link = cols[linkIndex];
        if (!name || !link) continue;

        const id = idIndex !== -1 && cols[idIndex] ? cols[idIndex] : `sync_btn_${Date.now()}_${i}`;
        const logo = logoIndex !== -1 && cols[logoIndex] ? cols[logoIndex] : "🔗";
        
        let networkValue = networkIndex !== -1 && cols[networkIndex] ? cols[networkIndex].toLowerCase() : "startapp";
        if (!["startapp", "monetag", "both"].includes(networkValue)) {
          networkValue = "startapp";
        }

        let statusValue = statusIndex !== -1 && cols[statusIndex] ? cols[statusIndex].toLowerCase() : "active";
        if (!["active", "inactive"].includes(statusValue)) {
          statusValue = "active";
        }

        parsedButtons.push({
          id,
          name,
          logo,
          link,
          network: networkValue as any,
          status: statusValue as any
        });
      }

      if (parsedButtons.length === 0) {
        return { success: false, message: "কোনো সঠিক রো সনাক্ত করা যায়নি।" };
      }

      const updated = {
        ...config,
        buttons: parsedButtons,
        googleSheetsId: trimmedId
      };

      setConfig(updated);
      localStorage.setItem("all_live_config", JSON.stringify(updated));

      return { 
        success: true, 
        message: `${parsedButtons.length} টি বাটন গুগল শিট থেকে ডিরেক্টলি ব্রাউজারে সিঙ্ক হয়েছে!`, 
        config: updated 
      };
    } catch (err: any) {
      return { success: false, message: `সিঙ্কিং ব্যর্থ: ${err.message}` };
    }
  };

  // Button clicks: Checks if ads are enabled and plays interstitial, then launches browser
  const handleButtonClick = (btn: AppButton) => {
    const navigateToSite = () => {
      setActiveBrowserUrl(btn.link);
      setActiveBrowserTitle(btn.name);
    };

    if (config.adConfig.adsEnabled) {
      // Show dynamic Ad first, navigate upon completion/skip
      setActiveAd({
        network: btn.network,
        onAdCompleted: () => {
          setActiveAd(null);
          navigateToSite();
        }
      });
    } else {
      // Ads disabled globally, open instantly
      navigateToSite();
    }
  };

  // Back button event interceptor: Shows advertisement before returning to dashboard portal
  const handleBrowserExit = () => {
    const exitToDashboard = () => {
      setActiveBrowserUrl(null);
      setActiveBrowserTitle("");
    };

    if (config.adConfig.adsEnabled) {
      // Play exit video ad, close browser on completion
      setActiveAd({
        network: "both", // Alternates upon returning
        onAdCompleted: () => {
          setActiveAd(null);
          exitToDashboard();
        }
      });
    } else {
      // Skip ad, return directly
      exitToDashboard();
    }
  };

  const handleDismissNotification = (id: string) => {
    const updated = {
      ...config,
      notifications: config.notifications.map(n => n.id === id ? { ...n, active: false } : n)
    };
    handleSaveConfig(updated);
  };

  // Splash screen lock
  if (!splashComplete) {
    return <SplashLogo onComplete={() => setSplashComplete(true)} />;
  }

  // Fallback state in case configuration is somehow completely corrupted
  if (!config) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-sans text-slate-400">কনফিগারেশন ফাইল লোড হচ্ছে...</p>
      </div>
    );
  }

  // Pick only active status buttons for rendering
  const activeButtons = config.buttons.filter(b => b.status === "active");

  return (
    <div id="application-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Background Decorative Mesh Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-950/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-indigo-950/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Main App Top Bar Navigation */}
      <header className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 px-4 py-3 z-30 flex items-center justify-between shadow-lg relative max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-cyan-400/10 border border-cyan-400/20">
            <Tv className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
              All Live
            </h1>
            <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase block">VIDEO PORTAL</span>
          </div>
        </div>

        {/* Action Widgets Toolbar */}
        <div className="flex items-center gap-2.5 relative">
          {/* Bengali Live timer clock badge */}
          <div className="hidden xs:flex items-center gap-1.5 bg-slate-900 border border-slate-800/80 px-2.5 py-1 rounded-xl text-[10px] font-mono text-slate-400 font-semibold shadow-inner">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
            <span>{systemTime}</span>
          </div>

          {/* Dynamic alerts center drawer */}
          <NotificationCenter 
            notifications={config.notifications} 
            onDismissOne={handleDismissNotification}
          />

          {/* Admin panel gate toggle button */}
          <button
            id="admin-view-toggle"
            onClick={() => setAdminViewOpen(!adminViewOpen)}
            className={`p-2.5 rounded-2xl border flex items-center gap-1.5 transition-all text-xs font-bold select-none cursor-pointer active:scale-95 duration-200 ${
              adminViewOpen
                ? "bg-cyan-400 text-slate-950 border-cyan-400 shadow-md shadow-cyan-400/20"
                : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
            }`}
            title="অ্যাডমিন কন্ট্রোল"
          >
            <Sliders className="w-4.5 h-4.5" />
            <span className="hidden sm:inline">অ্যাডমিন</span>
          </button>
        </div>
      </header>

      {/* Main Dashboard Portal Wrapper */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 relative z-10 flex flex-col gap-6">
        
        <AnimatePresence mode="wait">
          {adminViewOpen ? (
            /* ADMIN VIEW DASHBOARD (PASSWORD GATE INCLUDED) */
            <motion.div
              key="admin-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <AdminPanel 
                config={config} 
                onSaveConfig={handleSaveConfig}
                onSyncGoogleSheet={handleSyncGoogleSheet}
              />
            </motion.div>
          ) : (
            /* MAIN CONSUMER VIDEO PORTAL VIEW */
            <motion.div
              key="portal-view"
              className="space-y-6"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {/* Dynamic Announcement Bullet Marquee */}
              <div className="bg-gradient-to-r from-cyan-950/20 to-blue-950/25 border border-cyan-900/30 rounded-2xl p-3.5 px-4 flex items-center gap-3 shadow-md">
                <div className="bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase font-mono tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Update</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs text-slate-300 font-medium whitespace-nowrap animate-marquee">
                    📢 প্রতিটি বাটনে ক্লিক করলেই স্পন্সর ভিডিও বিজ্ঞাপন দেখাবে এবং সাথে সাথে সরাসরি লাইভ সাইট লোড হবে।
                  </p>
                </div>
              </div>

              {/* Central Premium Branding Greeting visual */}
              <div className="text-center py-6 space-y-2 relative border border-slate-900 bg-slate-900/25 p-6 rounded-3xl overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/5 to-transparent pointer-events-none" />
                <motion.div
                  className="inline-flex items-center gap-1.5 bg-cyan-950/60 text-cyan-400 text-[10px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-full border border-cyan-800/20 shadow-md"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Flame className="w-3.5 h-3.5 animate-pulse" />
                  <span>প্রিমিয়াম লাইভ ওয়াচার</span>
                </motion.div>

                <h2 className="text-2xl font-black text-gray-100 font-sans tracking-tight">আপনার সুবিধাজনক বাটন বেছে নিন</h2>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  নিচের ওয়াচ বাটনসমূহে ক্লিক করলেই স্পন্সর বিজ্ঞাপনটি শুরু হবে। ৫ সেকেন্ড বিজ্ঞাপন দেখে ওয়েবসাইট উপভোগ করুন।
                </p>
              </div>

              {/* MAIN DYNAMIC BUTTON GRID */}
              <div className="grid grid-cols-2 gap-4" id="channel-grid">
                {activeButtons.length === 0 ? (
                  <div className="col-span-2 text-center py-16 border border-dashed border-slate-800 bg-slate-900/10 rounded-3xl space-y-2 select-all opacity-60">
                    <p className="text-sm font-semibold text-slate-400">কোনো ওয়াচ চ্যানাল সচল নেই।</p>
                    <p className="text-xs text-slate-500">অনুগ্রহ করে অ্যাডমিন প্যানেল থেকে নতুন বাটন যোগ বা স্প্রেডশিট সিঙ্ক করুন।</p>
                  </div>
                ) : (
                  activeButtons.map((btn) => (
                    <motion.button
                      key={btn.id}
                      id={`watch-button-${btn.id}`}
                      onClick={() => handleButtonClick(btn)}
                      className="group relative flex flex-col items-center justify-center p-6 bg-slate-900/60 hover:bg-slate-900 hover:border-cyan-500/50 border border-slate-900 rounded-3xl shadow-lg hover:shadow-cyan-500/5 transition-all text-center cursor-pointer active:scale-95 select-none touch-manipulation overflow-hidden h-36"
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Interactive background particle glow */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/0 via-cyan-500/5 to-blue-500/10 group-hover:opacity-100 opacity-0 duration-300 pointer-events-none" />

                      {/* Moving pulse border */}
                      <div className="absolute inset--px bg-gradient-to-r from-cyan-400 to-blue-500 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none" />

                      {/* Icon Container */}
                      <div className="w-14 h-14 bg-slate-950 group-hover:bg-cyan-950/40 text-2xl flex items-center justify-center rounded-2xl shadow-inner border border-slate-800/80 group-hover:border-cyan-500/30 transition-all mb-3 relative">
                        <span>{btn.logo}</span>
                        {/* Play badge decorative */}
                        <span className="absolute bottom-[-2px] right-[-2px] w-5 h-5 bg-cyan-400 text-slate-950 font-bold rounded-lg flex items-center justify-center text-[8px] border-2 border-slate-950 scale-0 group-hover:scale-100 transition-transform">
                          <Play className="w-2 h-2 fill-slate-950 stroke-[3]" />
                        </span>
                      </div>

                      {/* Button Details */}
                      <h3 className="text-sm font-bold text-gray-200 group-hover:text-cyan-400 transition-colors font-sans">
                        {btn.name}
                      </h3>
                      <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-wider">
                        {btn.network === "both" ? "Dual Ad" : `${btn.network} Network`}
                      </p>
                    </motion.button>
                  ))
                )}
              </div>

              {/* General support instructions card */}
              <div className="border border-slate-900 rounded-3xl bg-slate-900/15 p-5 flex gap-4 items-center">
                <ShieldCheck className="w-8 h-8 text-cyan-400 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-200">১00% সুরক্ষিত এবং যাচাইকৃত</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    আমাদের ওয়েবসাইট ট্রাফিক ফিল্টারিং এবং প্রক্সি সিকিউরিটির মাধ্যমে আপনার ডেটা পুরোপুরি রক্ষা করা হয়।
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Decorative footer credits */}
      <footer className="py-8 bg-slate-950 border-t border-slate-900 text-center space-y-2 relative z-10 max-w-7xl mx-auto w-full mt-auto">
        <p className="text-[11px] text-slate-500 font-sans tracking-wide">
          © {new Date().getFullYear()} All Live Inc. সর্বস্বত্ব সংরক্ষিত।
        </p>
        <p className="text-[9px] text-slate-600 font-mono tracking-widest uppercase flex items-center justify-center gap-1">
          <Smartphone className="w-3.5 h-3.5" />
          Mobile Web Application Platform v2.4
        </p>
      </footer>

      {/* RENDER ACTIVE IN-APP MOBILE WEB BROWSER POPUP */}
      <AnimatePresence>
        {activeBrowserUrl && (
          <InAppBrowser 
            url={activeBrowserUrl} 
            title={activeBrowserTitle} 
            onExit={handleBrowserExit} 
          />
        )}
      </AnimatePresence>

      {/* RENDER ACTIVE INTERSTITIAL VIDEO AD POPUP OVERLAYS */}
      <AnimatePresence>
        {activeAd && (
          <AdPlayer 
            network={activeAd.network} 
            adConfig={config.adConfig} 
            onClose={activeAd.onAdCompleted} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
