import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Tv, Lock, ShieldCheck, Play, Sparkles, Smartphone, Flame, Calendar, Settings, Sliders,
  MessageSquare, Send, User, GraduationCap, BookOpen, Film, ExternalLink, MessageCircle, HelpCircle,
  Heart, Coins, Copy, Check, MoreVertical, X
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
  adminCode: "1234",
  adminCodeSecondary: "1234",
  securityQuestion: "আপনার প্রিয় রঙের নাম কী?",
  securityAnswer: "নীল",
  premiumItems: [
    {
      id: "prem_1",
      name: "Inshot Pro Mod APK (Premium Desh)",
      link: "https://www.wikipedia.org",
      category: "Premium APK",
      status: "active"
    },
    {
      id: "prem_2",
      name: "Mastering React Native 2026",
      link: "https://react.dev",
      category: "Premium course",
      status: "active"
    }
  ],
  feedbacks: [],
  devDetails: {
    name: "Md Hasan Khalifa",
    subTitle: "অ্যাপ প্রতিষ্ঠাতা ও প্রিমিয়াম ভেন্ডর",
    description: "প্রিয় ইউজার, অ্যাপে কোনো সমস্যা বা বিজ্ঞাপন ছাড়া প্রমোশন কিনতে চান? অথবা নিজের জন্য এরকম প্রিমিয়াম অ্যাপ তৈরি করতে চান? নিচে আমার অফিসিয়াল সামাজিক লিংক বা হোয়াটসঅ্যাপে সরাসরি যোগাযোগ করতে পারেন।",
    whatsappNumber: "8801798088609",
    facebookUrl: "https://www.facebook.com/HasanKhalifa01",
    avatarInitials: "HK"
  },
  feedbackSheetUrl: ""
};

function mergeConfig(parsed: any): AppConfig {
  return {
    ...DEFAULT_CONFIG,
    ...parsed,
    adConfig: {
      ...DEFAULT_CONFIG.adConfig,
      ...(parsed?.adConfig || {})
    },
    buttons: Array.isArray(parsed?.buttons) ? parsed.buttons : DEFAULT_CONFIG.buttons,
    notifications: Array.isArray(parsed?.notifications) ? parsed.notifications : DEFAULT_CONFIG.notifications,
    premiumItems: Array.isArray(parsed?.premiumItems) ? parsed.premiumItems : DEFAULT_CONFIG.premiumItems,
    feedbacks: Array.isArray(parsed?.feedbacks) ? parsed.feedbacks : DEFAULT_CONFIG.feedbacks,
    securityQuestion: parsed?.securityQuestion || DEFAULT_CONFIG.securityQuestion,
    securityAnswer: parsed?.securityAnswer || DEFAULT_CONFIG.securityAnswer,
    devDetails: parsed?.devDetails ? {
      ...DEFAULT_CONFIG.devDetails,
      ...parsed.devDetails
    } : DEFAULT_CONFIG.devDetails,
    feedbackSheetUrl: parsed?.feedbackSheetUrl || DEFAULT_CONFIG.feedbackSheetUrl,
    adminCodeSecondary: parsed?.adminCodeSecondary || DEFAULT_CONFIG.adminCodeSecondary,
  };
}

export default function App() {
  const [splashComplete, setSplashComplete] = useState(false);
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const stored = localStorage.getItem("all_live_config");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.buttons)) {
          return mergeConfig(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to retrieve config from local storage", e);
    }
    return DEFAULT_CONFIG;
  });
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Administrative secure secret keys
  const [adminPin1, setAdminPin1] = useState<string>(() => sessionStorage.getItem("admin_pin_1") || "");
  const [adminPin2, setAdminPin2] = useState<string>(() => sessionStorage.getItem("admin_pin_2") || "");

  // Ad Free status states
  const [adFreeActive, setAdFreeActive] = useState<boolean>(() => localStorage.getItem("ad_free_active_state") === "true");
  const [adFreeUserName, setAdFreeUserName] = useState<string>(() => localStorage.getItem("ad_free_user_name") || "");

  // User Analytics Profile states
  const [analyticsUserId] = useState<string>(() => {
    let uid = localStorage.getItem("analytics_user_id");
    if (!uid) {
      uid = "usr_" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem("analytics_user_id", uid);
    }
    return uid;
  });

  const [analyticsUsername, setAnalyticsUsername] = useState<string>(() => {
    let name = localStorage.getItem("analytics_username");
    if (!name) {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      name = `ব্যবহারকারী_${randNum}`;
      localStorage.setItem("analytics_username", name);
    }
    return name;
  });

  const [visitCount] = useState<number>(() => {
    const vc = parseInt(localStorage.getItem("analytics_visit_count") || "0", 10) + 1;
    localStorage.setItem("analytics_visit_count", vc.toString());
    return vc;
  });

  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState(analyticsUsername);

  const syncUserProfile = async (uid: string, name: string, vc: number) => {
    try {
      await fetch("/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: uid,
          username: name,
          visitCount: vc,
          deviceInfo: navigator.userAgent
        })
      });
    } catch (err) {
      console.warn("Could not sync visitor profile", err);
    }
  };

  // Layout navigation states
  const [activeBrowserUrl, setActiveBrowserUrl] = useState<string | null>(null);
  const [activeBrowserTitle, setActiveBrowserTitle] = useState<string>("");
  const [adminViewOpen, setAdminViewOpen] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [menuModalTab, setMenuModalTab] = useState<"donation" | "feedback" | "developer">("donation");

  // Active Ads states
  const [activeAd, setActiveAd] = useState<{
    network: "startapp" | "monetag" | "both";
    onAdCompleted: () => void;
  } | null>(null);

  // System time tracker decoration
  const [systemTime, setSystemTime] = useState("");

  // Premium download categories and feedback collection status states
  const [activePremCategory, setActivePremCategory] = useState<"Premium APK" | "Premium course" | "Premium book" | "New Premium movie">("Premium APK");
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackComment, setFeedbackComment] = useState("");

  // Donation and Free Ad-Block claim states
  const [donorName, setDonorName] = useState("");
  const [donorPhoneOrTxid, setDonorPhoneOrTxid] = useState("");
  const [donorAmount, setDonorAmount] = useState("");
  const [activationKeyInput, setActivationKeyInput] = useState("");
  const [pendingClaim, setPendingClaim] = useState<{ userName: string; activationKey: string } | null>(null);
  const [copyFeedbackIdx, setCopyFeedbackIdx] = useState<string | null>(null);

  // Helper function to check/validate license on load
  const verifyAdFreeLicense = async (key: string) => {
    if (!key) return;
    try {
      const response = await fetch("/api/ad-free/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activationKey: key })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAdFreeActive(true);
          setAdFreeUserName(data.userName);
          localStorage.setItem("ad_free_active_state", "true");
          localStorage.setItem("ad_free_user_name", data.userName);
          return;
        }
      }
    } catch (e) {
      console.warn("License key check failed on server, using cached preference.", e);
    }
  };

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

  // Sync / verify license key on boot
  useEffect(() => {
    const cachedKey = localStorage.getItem("ad_free_license");
    if (cachedKey) {
      verifyAdFreeLicense(cachedKey);
    }
  }, []);

  // Sync visitor profile analytics
  useEffect(() => {
    syncUserProfile(analyticsUserId, analyticsUsername, visitCount);
  }, [analyticsUserId, analyticsUsername, visitCount]);

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
              // Read public config, keeping adminCodes in local config if admin is logged in
              const merged = mergeConfig(data);
              setConfig(prev => ({
                ...merged,
                adminCode: adminPin1 || prev.adminCode,
                adminCodeSecondary: adminPin2 || prev.adminCodeSecondary
              }));
              localStorage.setItem("all_live_config", JSON.stringify(merged));
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
  }, [adminPin1, adminPin2]);

  // Sync settings with backend or local storage (Secured with credentials verification)
  const handleSaveConfig = async (updated: AppConfig, p1?: string, p2?: string): Promise<boolean> => {
    setConfig(updated);
    localStorage.setItem("all_live_config", JSON.stringify(updated));

    const finalPin1 = p1 || adminPin1;
    const finalPin2 = p2 || adminPin2;

    try {
      const headers: any = { "Content-Type": "application/json" };
      if (finalPin1) headers["x-admin-pin"] = finalPin1;
      if (finalPin2) headers["x-admin-pin-secondary"] = finalPin2;

      const res = await fetch("/api/config", {
        method: "POST",
        headers,
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        return true;
      }
      console.warn("Backend save authentication failed or save rejected.", res.status);
      return res.status === 200;
    } catch (e) {
      console.warn("Server unavailable, config saved to client storage.", e);
      return true;
    }
  };

  // Trigger Google Sheet fetch on server, falling back to direct client-side fetch on Vercel
  const handleSyncGoogleSheet = async (sheetsId: string, p1?: string, p2?: string) => {
    const finalPin1 = p1 || adminPin1;
    const finalPin2 = p2 || adminPin2;

    // 1. Try server-side action first (if online)
    try {
      const headers: any = { "Content-Type": "application/json" };
      if (finalPin1) headers["x-admin-pin"] = finalPin1;
      if (finalPin2) headers["x-admin-pin-secondary"] = finalPin2;

      const res = await fetch("/api/sync-sheet", {
        method: "POST",
        headers,
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
      } else {
        const errData = await res.json().catch(() => ({}));
        return { success: false, message: errData.error || "শিট সিঙ্ক করতে অ্যাডমিন অথেনটিকেশন ব্যর্থ হয়েছে।" };
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

      // Extract any special ad network control row if present
      const adConfigRow = parsedButtons.find(b => 
        b.name.toLowerCase().includes("config_ads_enabled") || 
        b.name.toLowerCase().includes("ads_enabled") || 
        b.name.includes("বিজ্ঞাপন_অবস্থা")
      );
      
      let adsEnabled = config.adConfig.adsEnabled;
      if (adConfigRow) {
        const val = adConfigRow.link.trim().toLowerCase();
        adsEnabled = !(val === "off" || val === "false" || val === "0" || val === "বন্ধ" || val === "inactive");
      }

      const filteredButtons = parsedButtons.filter(b => 
        !b.name.toLowerCase().includes("config_ads_enabled") && 
        !b.name.toLowerCase().includes("ads_enabled") && 
        !b.name.includes("বিজ্ঞাপন_অবস্থা")
      );

      const updated = {
        ...config,
        adConfig: {
          ...config.adConfig,
          adsEnabled
        },
        buttons: filteredButtons,
        googleSheetsId: trimmedId
      };

      setConfig(updated);
      localStorage.setItem("all_live_config", JSON.stringify(updated));

      return { 
        success: true, 
        message: `${filteredButtons.length} টি বাটন গুগল শিট থেকে ব্রাউজারে সিঙ্ক হয়েছে! ${adConfigRow ? `(বিজ্ঞাপনী অবস্থা: ${adsEnabled ? 'চালু' : 'বন্ধ'})` : ''}`, 
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

    if (config.adConfig.adsEnabled && !adFreeActive) {
      // Show dynamic Ad first, navigate upon completion/skip
      setActiveAd({
        network: btn.network,
        onAdCompleted: () => {
          setActiveAd(null);
          navigateToSite();
        }
      });
    } else {
      // Ads disabled globally or user belongs to approved Ad-Free, open instantly
      navigateToSite();
    }
  };

  // Back button event interceptor: Shows advertisement before returning to dashboard portal if enabled
  const handleBrowserExit = () => {
    const exitToDashboard = () => {
      setActiveBrowserUrl(null);
      setActiveBrowserTitle("");
    };

    if (config.adConfig.adsEnabled && !adFreeActive && (config.backButtonAdTrigger !== false)) {
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

  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("dismissed_notifications");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const handleDismissNotification = (id: string) => {
    const nextList = [...dismissedNotifIds, id];
    setDismissedNotifIds(nextList);
    localStorage.setItem("dismissed_notifications", JSON.stringify(nextList));
  };

  // Submit User Feedback suggestion to back-end securely
  const handleFeedbackSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = feedbackName.trim();
    const trimmedComment = feedbackComment.trim();

    if (!trimmedName || !trimmedComment) {
      alert("দয়া করে আপনার নাম এবং অনুরোধ/ফিডব্যাক দুটোই সঠিকভাবে পূরণ করুন!");
      return;
    }

    try {
      await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: trimmedName, userComment: trimmedComment })
      });
    } catch (err) {
      console.warn("Feedback save rejected online.", err);
    }

    const timestampStr = new Date().toISOString();
    let syncedMsg = "";
    if (config.feedbackSheetUrl && config.feedbackSheetUrl.trim().startsWith("http")) {
      try {
        await fetch(config.feedbackSheetUrl.trim(), {
          method: "POST",
          mode: "no-cors", 
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userName: trimmedName,
            userComment: trimmedComment,
            submittedAt: timestampStr
          })
        });
        syncedMsg = "\n\n(গুগল শিটেও অনুরোধটি সরাসরি পাঠানো হয়েছে।)";
      } catch (err) {
        console.warn("Failed to submit feedback to custom script URL:", err);
        syncedMsg = "\n\n(গুগল শিট স্ক্রিপ্টে সাবমিট ব্যর্থ হয়েছে তবে সিস্টেমে রেকর্ডটি জমা হয়েছে।)";
      }
    }

    alert(`ধন্যবাদ! আপনার অনুরোধ/ফিডব্যাকটি সফলভাবে সাবমিট হয়েছে। আমাদের ডেভেলপার MD Hasan Khalifa খুব শীঘ্রই এটি রিভিউ করবেন।${syncedMsg}`);
    setFeedbackName("");
    setFeedbackComment("");
  };

  // Submit Donation and Ad-Free claim request to backend securely
  const handleDonationSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = donorName.trim();
    const trimmedPhone = donorPhoneOrTxid.trim();
    const trimmedAmount = donorAmount.trim();

    if (!trimmedName || !trimmedPhone || !trimmedAmount) {
      alert("দয়া করে ডোনেশন ফর্মের সবকটি ঘর সঠিকভাবে পূরণ করুন!");
      return;
    }

    try {
      const response = await fetch("/api/donation/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: trimmedName,
          userPhoneOrTxid: trimmedPhone,
          amount: trimmedAmount
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.claim) {
          setPendingClaim(data.claim);
          setDonorName("");
          setDonorPhoneOrTxid("");
          setDonorAmount("");
          alert("অভিনন্দন! আপনার পেমেন্ট রিকোয়েস্ট জমা হয়েছে। নিচে প্রদর্শিত অ্যাক্টিভেশন কি-টি কপি করে রাখুন।");
        } else {
          alert("দুঃখিত, ওয়ান ব্যাংক পেমেন্ট গেটওয়েতে সমস্যা দেখা দিয়েছে।");
        }
      } else {
        alert("সার্ভার পেমেন্ট গেটওয়েতে ত্রুটি হয়েছে। অনুগ্রহ করে পরে চেষ্টা করুন।");
      }
    } catch (err: any) {
      alert("নেটওয়ার্ক সংযোগ ত্রুটি! পেমেন্ট রিকোয়েস্ট সাবমিট করা যায়নি।");
    }
  };

  // Submit activation key verification
  const handleVerifyKeySubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedKey = activationKeyInput.trim();

    if (!trimmedKey) {
      alert("দয়া করে আপনার অ্যাক্টিভেশন কোডটি এখানে লিখুন!");
      return;
    }

    try {
      const response = await fetch("/api/ad-free/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activationKey: trimmedKey })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAdFreeActive(true);
          setAdFreeUserName(data.userName);
          localStorage.setItem("ad_free_license", trimmedKey.toUpperCase());
          localStorage.setItem("ad_free_active_state", "true");
          localStorage.setItem("ad_free_user_name", data.userName);
          setActivationKeyInput("");
          alert(`ধন্যবাদ ${data.userName}! অ্যাড-ফ্রি লাইসেন্স কোডটি সফলভাবে সক্রিয় হয়েছে। এখন থেকে কোনো বিজ্ঞাপন শো করবে না! 🚀`);
        } else {
          alert("ভুল বা অনিবন্ধিত মেম্বারশিপ কোড!");
        }
      } else {
        alert("ভুল কোড অথবা এডমিন এখনো আপনার পেমেন্ট অনুমোদন করেনি। অনুগ্রহ করে অপেক্ষা করুন অথবা ডেভেলপারের সাথে যোগাযোগ করুন।");
      }
    } catch (err) {
      alert("নেটওয়ার্ক ত্রুটি! ডেটা যাচাই করা যাচ্ছে না।");
    }
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
        {/* Double-click secret backdoor on Logo & Title to open Admin Panel */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer select-none"
          onDoubleClick={() => setAdminViewOpen(!adminViewOpen)}
          title="ডাবল ক্লিক করুন"
        >
          <div className="w-9 h-9 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-cyan-400/10 border border-cyan-400/20">
            <Tv className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
              {config.appName || "All Live"}
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
            notifications={(config.notifications || []).filter(n => !dismissedNotifIds.includes(n.id))} 
            onDismissOne={handleDismissNotification}
          />

          {/* Aesthetic Modern Three-dot option button to open Developer, Donations, Feedback features */}
          <button
            onClick={() => {
              setMenuModalTab("donation");
              setMenuModalOpen(true);
            }}
            className="p-2 rounded-xl border border-slate-800 transition-all text-xs font-bold select-none cursor-pointer active:scale-95 duration-200 bg-slate-900 text-slate-300 hover:bg-slate-800"
            title="মেনু (যোগাযোগ, ডোনেশন ও অনুরোধ)"
          >
            <MoreVertical className="w-4 h-4" />
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
                onUnlock={(p1, p2) => {
                  setAdminPin1(p1);
                  setAdminPin2(p2);
                  sessionStorage.setItem("admin_pin_1", p1);
                  sessionStorage.setItem("admin_pin_2", p2);
                }}
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

                <h2 className="text-2xl font-black text-gray-100 font-sans tracking-tight">
                  {config.adTitle || "আপনার সুবিধাজনক বাটন বেছে নিন"}
                </h2>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {config.adDescription || "নিচের ওয়াচ বাটনসমূহে ক্লিক করলেই স্পন্সর বিজ্ঞাপনটি শুরু হবে। ৫ সেকেন্ড বিজ্ঞাপন দেখে ওয়েবসাইট উপভোগ করুন।"}
                </p>
              </div>

              {/* User Profile Card */}
              <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">ইউজার অ্যাকাউন্ট</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">ID: {analyticsUserId}</span>
                    </div>
                    {isChangingUsername ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="text"
                          className="bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs px-2 py-1 rounded-lg text-white font-sans outline-none w-36"
                          value={newUsernameInput}
                          onChange={(e) => setNewUsernameInput(e.target.value)}
                          placeholder="নতুন ইউজারনেম"
                        />
                        <button
                          onClick={() => {
                            if (newUsernameInput.trim()) {
                              setAnalyticsUsername(newUsernameInput.trim());
                              localStorage.setItem("analytics_username", newUsernameInput.trim());
                              setIsChangingUsername(false);
                            }
                          }}
                          className="px-2.5 py-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-[10px] rounded-lg cursor-pointer"
                        >
                          সেভ
                        </button>
                        <button
                          onClick={() => {
                            setNewUsernameInput(analyticsUsername);
                            setIsChangingUsername(false);
                          }}
                          className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-white text-[10px] rounded-lg cursor-pointer"
                        >
                          বাতিল
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-200">
                        {analyticsUsername}{" "}
                        <button
                          onClick={() => setIsChangingUsername(true)}
                          className="text-[10px] text-cyan-400 hover:underline ml-2 cursor-pointer font-medium"
                        >
                          (নাম পরিবর্তন করুন)
                        </button>
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono font-bold block">আপনার ভিজিট</span>
                  <span className="text-xs text-cyan-400 font-bold font-mono">{visitCount} বার প্রবেশ করেছেন</span>
                </div>
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

              {/* 🌟 PREMIUM ZONE PORTAL AND DOWNLOAD CATEGORIES */}
              <div className="border border-slate-900 bg-slate-900/10 rounded-3xl p-5 md:p-6 space-y-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold tracking-wide text-cyan-400 font-sans uppercase">🌟 প্রিমিয়াম জোন (Premium Portal)</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">সবচেয়ে জনপ্রিয় প্রিমিয়াম অ্যাপস, ফ্রি কোর্স, বই ও সিনেমার কালেকশন ডাউনলোড করুন</p>
                  </div>
                </div>

                {/* Categories Tab Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: "Premium APK", label: "Premium APK", icon: Smartphone },
                    { key: "Premium course", label: "Premium Course", icon: GraduationCap },
                    { key: "Premium book", label: "Premium Book", icon: BookOpen },
                    { key: "New Premium movie", label: "New Movie", icon: Film }
                  ].map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = activePremCategory === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActivePremCategory(tab.key as any)}
                        className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 justify-center transition-all cursor-pointer ${
                          isActive
                            ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                            : "bg-slate-950/40 border-slate-900 text-slate-400 hover:bg-slate-900/50 hover:text-slate-300"
                        }`}
                      >
                        <TabIcon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Categorized Download List */}
                <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-900/80 min-h-[110px] flex flex-col justify-center">
                  {(() => {
                    const filteredItems = (config.premiumItems || []).filter(
                      (item) => item.category === activePremCategory && item.status === "active"
                    );

                    if (filteredItems.length === 0) {
                      return (
                        <div className="text-center py-6 text-slate-500 text-xs">
                          <HelpCircle className="w-7 h-7 mx-auto mb-1.5 opacity-40 text-slate-400" />
                          <p>এই ক্যাটাগরিতে বর্তমানে কোনো প্রিমিয়াম ফাইল যুক্ত নেই।</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2.5">
                        {filteredItems.map((item) => (
                          <div 
                            key={item.id} 
                            className="bg-slate-900/80 border border-slate-800/60 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-cyan-500/20 transition-all group"
                          >
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-cyan-500 font-mono font-bold uppercase tracking-wider block">
                                {item.category}
                              </span>
                              <h4 className="text-xs font-bold text-gray-200 group-hover:text-cyan-400 transition-colors">
                                {item.name}
                              </h4>
                            </div>

                            <button
                              onClick={() => {
                                handleButtonClick({
                                  id: item.id,
                                  name: item.name,
                                  logo: "⭐",
                                  link: item.link,
                                  network: "both",
                                  status: "active"
                                });
                              }}
                              className="self-start sm:self-center bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-[10px] cursor-pointer active:scale-95 transition-all flex items-center gap-1 shrink-0"
                            >
                              <Play className="w-2.5 h-2.5 fill-slate-950" />
                              <span>ডাউনলোড করুন</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* General support instructions card */}
              <div className="border border-slate-900 rounded-3xl bg-slate-900/15 p-5 flex gap-4 items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-cyan-400 shrink-0" />
                <div className="space-y-1 text-left">
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

      {/* 🔮 THREE-DOT OPTIONS POPUP MODAL (DONATIONS, SUGGESTIONS, OWNER PROFILE) */}
      <AnimatePresence>
        {menuModalOpen && (
          <div id="three-dot-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="relative max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl z-15 overflow-hidden flex flex-col max-h-[85vh] text-slate-100"
            >
              {/* Background gradient flares */}
              <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[120px] h-[120px] bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Header inside the Modal */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-cyan-950/50 rounded-lg flex items-center justify-center border border-cyan-800/20">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-100 font-sans tracking-wide">মাস্টার মেনু সেটিংস</h3>
                </div>
                <button
                  onClick={() => setMenuModalOpen(false)}
                  className="p-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Tabs - Donation / Feedback / Developer */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0 mb-4 overflow-x-auto">
                <button
                  onClick={() => setMenuModalTab("donation")}
                  className={`flex-1 min-w-[100px] text-center py-2 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    menuModalTab === "donation"
                      ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                      : "border border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>সাহায্য ও ডোনেশন</span>
                </button>
                <button
                  onClick={() => setMenuModalTab("feedback")}
                  className={`flex-1 min-w-[100px] text-center py-2 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    menuModalTab === "feedback"
                      ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-400"
                      : "border border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>অনুরোধ ও পরামর্শ</span>
                </button>
                <button
                  onClick={() => setMenuModalTab("developer")}
                  className={`flex-1 min-w-[100px] text-center py-2 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    menuModalTab === "developer"
                      ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400"
                      : "border border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>প্রতিষ্ঠাতা প্রোফাইল</span>
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {/* TAB 1: Support / Donation */}
                {menuModalTab === "donation" && (
                  <div className="space-y-4">
                    <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 md:p-5 space-y-4 relative overflow-hidden">
                      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-amber-500/10">
                        <div className="text-left">
                          <h3 className="text-xs font-black tracking-wide text-amber-400 font-sans uppercase">💖 অল লাইভ সাপোর্ট পোর্টাল</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">ডেভেলপারকে ডোনেট করে বিজ্ঞাপন-মুক্ত (Ad-Free) সেশন শুরু করুন</p>
                        </div>
                        {adFreeActive && (
                          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-extrabold px-2 py-0.5 rounded-lg animate-pulse">
                            🚀 অ্যাড-ফ্রি সেশন সক্রিয়
                          </span>
                        )}
                      </div>

                      {/* Info on Mobile Accounts */}
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { name: "bKash (Personal)", num: config.bkashNumber || "01798088609", color: "text-pink-500" },
                          { name: "Nagad (Personal)", num: config.nagadNumber || "01798088609", color: "text-orange-500" },
                          { name: "Rocket (Personal)", num: config.rocketNumber || "01798088609", color: "text-purple-500" }
                        ].map((agent, idx) => (
                          <div key={idx} className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/40 flex items-center justify-between gap-1">
                            <div className="text-left">
                              <span className="text-[8px] text-slate-400 block font-semibold">{agent.name}</span>
                              <span className={`text-[10px] font-mono font-bold ${agent.color}`}>{agent.num}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(agent.num);
                                setCopyFeedbackIdx(agent.name);
                                setTimeout(() => setCopyFeedbackIdx(null), 2000);
                              }}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                            >
                              {copyFeedbackIdx === agent.name ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Forms */}
                      <div className="grid grid-cols-1 gap-4">
                        {/* Claim Request */}
                        <form onSubmit={(e) => { e.preventDefault(); handleDonationSubmit(e); }} className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-slate-900 text-left">
                          <h4 className="text-[10px] font-bold text-amber-300 font-sans uppercase tracking-wider flex items-center gap-1">
                            <Coins className="w-3 h-3" /> ডোনেশন বিস্তারিত জমা দিন
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="আপনার নাম"
                              value={donorName}
                              onChange={(e) => setDonorName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-900 focus:border-amber-500 font-sans text-[10px] text-white rounded-lg px-2 py-1.5 outline-none"
                            />
                            <input
                              type="text"
                              placeholder="পরিমাণ (৳)"
                              value={donorAmount}
                              onChange={(e) => setDonorAmount(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-900 focus:border-amber-500 font-sans text-[10px] text-white rounded-lg px-2 py-1.5 outline-none"
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="মোবাইল নম্বর অথবা Transaction ID (TxID)"
                            value={donorPhoneOrTxid}
                            onChange={(e) => setDonorPhoneOrTxid(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 font-sans text-[10px] text-white rounded-lg px-2.5 py-1.5 outline-none"
                          />
                          <button
                            type="submit"
                            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[9px] py-2 rounded-lg transition-all select-none border border-amber-400/20 cursor-pointer"
                          >
                            জমা দিন ও লাইসেন্স কি পান
                          </button>
                        </form>

                        {/* Verify Claim Key */}
                        <form onSubmit={(e) => { e.preventDefault(); handleVerifyKeySubmit(e); }} className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-slate-900 text-left">
                          <h4 className="text-[10px] font-bold text-cyan-300 font-sans uppercase tracking-wider flex items-center gap-1">
                            <Lock className="w-3 h-3" /> অ্যাড-ফ্রি লাইসেন্স কোড ভেরিফাই
                          </h4>
                          {adFreeActive ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-lg p-3 text-center space-y-1">
                              <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                              <p className="text-[10px] font-bold text-gray-200">বিজ্ঞাপন-মুক্ত লাইসেন্স কোড সফলভাবে যুক্ত আছে।</p>
                              <p className="text-[8px] text-slate-400 leading-normal">ধন্যবাদ {adFreeUserName}! আপনার এই ব্রাউজার সেশনে আর কোনো ট্রাফিক ইন্টারাপশন বা এ্যাড লোড হবে না।</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="যেমন: ADBLK-H6W7QY"
                                value={activationKeyInput}
                                onChange={(e) => setActivationKeyInput(e.target.value)}
                                className="w-full bg-slate-905 border border-slate-800 focus:border-cyan-500 font-sans text-[10px] text-cyan-400 placeholder-slate-600 rounded-lg px-2 py-1.5 outline-none text-center tracking-widest uppercase"
                              />
                              <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-405 hover:to-blue-500 text-slate-950 font-extrabold text-[9px] py-2 rounded-lg cursor-pointer animate-pulse"
                              >
                                কোড ভেরিফাই ও বিজ্ঞাপন বন্ধ করুন
                              </button>
                            </div>
                          )}
                        </form>
                      </div>

                      {/* Display newly created key pending request */}
                      <AnimatePresence>
                        {pendingClaim && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-slate-950 border border-amber-500/30 rounded-xl p-3 text-center space-y-2"
                          >
                            <Sparkles className="w-4 h-4 text-amber-400 mx-auto animate-bounce" />
                            <h5 className="text-[10px] font-bold text-amber-300">রিকোয়েস্ট সফলভাবে প্রেরণ করা হয়েছে!</h5>
                            <p className="text-[9px] text-slate-300">
                              আপনার নাম: <span className="text-white font-semibold">{pendingClaim.userName}</span>
                            </p>
                            <div className="bg-slate-900 border border-slate-800 py-1 px-2.5 rounded-lg inline-flex items-center gap-1.5">
                              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400">{pendingClaim.activationKey}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(pendingClaim.activationKey);
                                  alert("লাইসেন্স কোডটি সফলভাবে কপি হয়েছে!");
                                }}
                                className="text-slate-500 hover:text-white transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[8px] text-slate-500 leading-relaxed">
                              কোডটি কপি করে সেভ রাখুন। পেমেন্ট গেটওয়েতে চেক করে এডমিন ৪-৫ মিনিটের মধ্যে আপনার ডোনেশন দেখে কোডটি অনুমোদন করার পর ভেরিফিকেশন বক্সে সাবমিট করলেই বিজ্ঞাপন স্থায়ীভাবে বন্ধ হয়ে যাবে।
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* TAB 2: Request / Suggestion Suggestive Form */}
                {menuModalTab === "feedback" && (
                  <form onSubmit={(e) => { e.preventDefault(); handleFeedbackSubmit(e); }} className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-indigo-500/15 rounded-lg flex items-center justify-center border border-indigo-500/20">
                        <MessageSquare className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-extrabold text-indigo-400">📬 অনুরোধ ও পরামর্শ কেন্দ্র</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5">আপনার কাঙ্ক্ষিত মুভি বা প্রিমিয়াম অ্যাপ এড করতে সরাসরি বার্তা পাঠান</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 text-left">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">আপনার নাম</label>
                        <div className="relative">
                          <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-600" />
                          <input
                            type="text"
                            placeholder="যেমন: হাসান আলী"
                            value={feedbackName}
                            onChange={(e) => setFeedbackName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 font-sans text-xs text-white rounded-lg pl-8.5 pr-2.5 py-2 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">আপনার অনুরোধ বা মন্তব্য বিবরণ</label>
                        <textarea
                          rows={3}
                          placeholder="যেমন: Inshot mod apk এর নতুন ভার্সন এড করুন / Deadpool মুভিটি এড করুন..."
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-505 font-sans text-xs text-white rounded-lg px-2.5 py-2 outline-none resize-none leading-relaxed"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-extrabold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>অনুরোধ সাবমিট করুন</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 3: Developer Info */}
                {menuModalTab === "developer" && (
                  <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-tr from-cyan-400 to-indigo-600 rounded-xl flex items-center justify-center border border-cyan-400/20 text-slate-950 font-black text-sm select-none">
                        {config.devDetails?.avatarInitials || "HK"}
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-extrabold text-gray-200 font-sans">
                          {config.devDetails?.name || "Md Hasan Khalifa"}
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          {config.devDetails?.subTitle || "অ্যাপ প্রতিষ্ঠাতা ও প্রিমিয়াম ভেন্ডর"}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed font-sans text-left bg-slate-900/50 p-3 rounded-lg border border-slate-900/30">
                      {config.devDetails?.description || "প্রিয় ইউজার, অ্যাপে কোনো সমস্যা বা বিজ্ঞাপন ছাড়া প্রমোশন কিনতে চান? অথবা নিজের জন্য এরকম প্রিমিয়াম অ্যাপ তৈরি করতে চান? নিচে আমার অফিসিয়াল সামাজিক লিংক বা হোয়াটসঅ্যাপে সরাসরি যোগাযোগ করতে পারেন।"}
                    </p>

                    <div className="flex flex-wrap gap-2.5 pt-1.5">
                      <a
                        href={`https://wa.me/${config.devDetails?.whatsappNumber || "8801798088609"}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[124px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-lg text-[10px] font-extrabold text-center flex items-center justify-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-emerald-400/10 text-emerald-400" />
                        <span>WhatsApp Chat</span>
                      </a>
                      <a
                        href={config.devDetails?.facebookUrl || "https://www.facebook.com/HasanKhalifa01"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[124px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-3 py-2 rounded-lg text-[10px] font-extrabold text-center flex items-center justify-center gap-1"
                      >
                        <Sliders className="w-3.5 h-3.5 rotate-45 text-blue-400" />
                        <span>Facebook Profile</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Verified Badge */}
              <div className="pt-3 border-t border-slate-800/60 mt-3 flex items-center gap-2 justify-center text-slate-500 shrink-0 select-none">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-[10px] tracking-wide font-sans font-medium">১০০% সুরক্ষিত প্ল্যাটফর্ম ও প্রক্সি সিকিউরিটি</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    {/* Decorative footer credits - ADMIN ENTRY SITUATED AT EXTREME OPPOSITE END ACCORDING TO SPECS */}
    <footer className="py-6 bg-slate-950 border-t border-slate-900 text-center space-y-2.5 relative z-10 max-w-7xl mx-auto w-full mt-auto px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[11px] text-slate-500 font-sans tracking-wide">
        © {new Date().getFullYear()} All Live Inc. সর্বস্বত্ব সংরক্ষিত।
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3.5">
        <p className="text-[9px] text-slate-600 font-mono tracking-widest uppercase flex items-center justify-center gap-1">
          <Smartphone className="w-3.5 h-3.5" />
          Mobile Web Application Platform v2.4
        </p>
        
        {/* Subtle, extremely obscure and hidden link for the Admin Panel toggle to protect against prompt/easy exposure */}
        <button 
          onClick={() => setAdminViewOpen(!adminViewOpen)}
          className="text-[9px] text-slate-800 hover:text-slate-600 font-mono font-bold tracking-wider transition-colors cursor-pointer select-none active:scale-95 ml-2 border border-slate-900/60 rounded px-1.5 py-0.5"
          title="Sittings"
        >
          🔧 ADMIN GATEWAY
        </button>
      </div>
    </footer>

      {/* RENDER ACTIVE IN-APP MOBILE WEB BROWSER POPUP */}
      <AnimatePresence>
        {activeBrowserUrl && (
          <InAppBrowser 
            url={activeBrowserUrl} 
            title={activeBrowserTitle} 
            onExit={handleBrowserExit} 
            backButtonText={config.backButtonText}
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
