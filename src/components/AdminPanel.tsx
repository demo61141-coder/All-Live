import React, { useState } from "react";
import { 
  motion 
} from "motion/react";
import { 
  Lock, Settings, Plus, Trash2, Sheet, Bell, Save, LogOut, Check, HelpCircle, RefreshCw, Eye, EyeOff, AlertCircle, X
} from "lucide-react";
import { AppConfig, AppButton, NotificationItem } from "../types";

interface AdminPanelProps {
  config: AppConfig;
  onSaveConfig: (updated: AppConfig) => Promise<boolean>;
  onSyncGoogleSheet: (sheetsId: string) => Promise<{ success: boolean; message: string; config?: AppConfig }>;
}

export default function AdminPanel({ config, onSaveConfig, onSyncGoogleSheet }: AdminPanelProps) {
  const [pinInput, setPinInput] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loginError, setLoginError] = useState("");
  
  // Dashboard navigation sub-tabs
  const [activeTab, setActiveTab] = useState<"buttons" | "sheets" | "ads" | "notif">("buttons");

  // Form states
  const [localConfig, setLocalConfig] = useState<AppConfig>({ ...config });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  // Sync state
  const [sheetIdInput, setSheetIdInput] = useState(config.googleSheetsId || "");
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState("");

  // Add Button Form state
  const [newButton, setNewButton] = useState<Partial<AppButton>>({
    name: "",
    logo: "🔗",
    link: "",
    network: "startapp",
    status: "active"
  });

  // Add Notification Form state
  const [newNotif, setNewNotif] = useState<Partial<NotificationItem>>({
    title: "",
    message: "",
    type: "info"
  });

  // Verify PIN
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === localConfig.adminCode || pinInput === "1234") {
      setIsUnlocked(true);
      setLoginError("");
    } else {
      setLoginError("ভুল পিন কোড! অনুগ্রহ করে আবার চেষ্টা করুন। (Default: 1234)");
    }
  };

  // Sync from parent config changes
  const refreshLocalState = () => {
    setLocalConfig({ ...config });
    setSheetIdInput(config.googleSheetsId || "");
  };

  // Trigger global save
  const handleSaveToDatabase = async (updatedState: AppConfig) => {
    setSaveStatus("saving");
    setSaveMessage("সেভ করা হচ্ছে...");
    const success = await onSaveConfig(updatedState);
    if (success) {
      setSaveStatus("success");
      setSaveMessage("অল লাইভ সেটিংস সফলভাবে সেভ হয়েছে!");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } else {
      setSaveStatus("error");
      setSaveMessage("সার্ভারে ডাটা সেভ করতে ব্যর্থ হয়েছে।");
    }
  };

  // Google sheet sync trigger
  const handleSheetSyncSubmit = async () => {
    if (!sheetIdInput.trim()) {
      setSyncStatus("error");
      setSyncMessage("গুগল শিট আইডি লিংক দিন!");
      return;
    }
    setSyncStatus("syncing");
    setSyncMessage("ডাটা সিঙ্ক করা হচ্ছে...");
    
    try {
      const response = await onSyncGoogleSheet(sheetIdInput.trim());
      if (response.success && response.config) {
        setSyncStatus("success");
        setSyncMessage(response.message);
        setLocalConfig(response.config);
        setTimeout(() => setSyncStatus("idle"), 4000);
      } else {
        setSyncStatus("error");
        setSyncMessage(response.message);
      }
    } catch (e: any) {
      setSyncStatus("error");
      setSyncMessage(e.message || "সিঙ্ক এরর");
    }
  };

  // Add Button handler
  const handleAddButton = () => {
    if (!newButton.name || !newButton.link) {
      alert("বাটনের নাম এবং ওয়েবসাইট লিংক অবশ্যই দিতে হবে!");
      return;
    }

    let url = newButton.link.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const createdBtn: AppButton = {
      id: `btn_${Date.now()}`,
      name: newButton.name.trim(),
      logo: newButton.logo || "🍿",
      link: url,
      network: (newButton.network as any) || "startapp",
      status: (newButton.status as any) || "active"
    };

    const updatedConfig = {
      ...localConfig,
      buttons: [...localConfig.buttons, createdBtn]
    };

    setLocalConfig(updatedConfig);
    setNewButton({
      name: "",
      logo: "🔗",
      link: "",
      network: "startapp",
      status: "active"
    });

    handleSaveToDatabase(updatedConfig);
  };

  // Delete button
  const handleDeleteButton = (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই বাটনটি ডিলিট করতে চান?")) return;
    const updatedConfig = {
      ...localConfig,
      buttons: localConfig.buttons.filter(b => b.id !== id)
    };
    setLocalConfig(updatedConfig);
    handleSaveToDatabase(updatedConfig);
  };

  // Toggle button status active/inactive
  const handleToggleButtonStatus = (id: string) => {
    const updatedConfig = {
      ...localConfig,
      buttons: localConfig.buttons.map(b => {
        if (b.id === id) {
          return { ...b, status: b.status === "active" ? "inactive" : "active" as any };
        }
        return b;
      })
    };
    setLocalConfig(updatedConfig);
    handleSaveToDatabase(updatedConfig);
  };

  // Add Notification blasting
  const handleAddNewNotification = () => {
    if (!newNotif.title || !newNotif.message) {
      alert("নোটিফিকেশন টাইটেল এবং তথ্য লিখুন!");
      return;
    }

    const createdNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      title: newNotif.title.trim(),
      message: newNotif.message.trim(),
      type: (newNotif.type as any) || "info",
      sentAt: new Date().toISOString(),
      active: true
    };

    const updatedConfig = {
      ...localConfig,
      notifications: [createdNotif, ...localConfig.notifications]
    };

    setLocalConfig(updatedConfig);
    setNewNotif({
      title: "",
      message: "",
      type: "info"
    });

    handleSaveToDatabase(updatedConfig);
  };

  // Delete/Inactive Notification
  const handleToggleNotificationStatus = (id: string) => {
    const updatedConfig = {
      ...localConfig,
      notifications: localConfig.notifications.map(n => {
        if (n.id === id) {
          return { ...n, active: !n.active };
        }
        return n;
      })
    };
    setLocalConfig(updatedConfig);
    handleSaveToDatabase(updatedConfig);
  };

  // Global settings changes
  const handleUpdateAdSettings = (field: string, value: any) => {
    const updatedConfig = {
      ...localConfig,
      adConfig: {
        ...localConfig.adConfig,
        [field]: value
      }
    };
    setLocalConfig(updatedConfig);
  };

  // Handle PIN save
  const handleUpdateAdminPin = (newPin: string) => {
    if (newPin.length < 4) return;
    const updatedConfig = {
      ...localConfig,
      adminCode: newPin
    };
    setLocalConfig(updatedConfig);
  };

  if (!isUnlocked) {
    return (
      <div id="admin-gate-stage" className="max-w-md mx-auto p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl mt-8">
        <div className="text-center space-y-3 mb-6">
          <div className="w-14 h-14 bg-cyan-950/40 border border-cyan-800 rounded-2xl flex items-center justify-center mx-auto text-cyan-400">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-gray-100 font-sans">অ্যাডমিন কন্ট্রোল গেট</h2>
          <p className="text-xs text-slate-400 font-sans">
            অ্যাপের বাটন নাম, লিংক, লোগো এবং বিজ্ঞাপন সেটিংস পরিবর্তন করতে অ্যাডমিন পিন কোড দিন।
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block">ADMIN PIN CODE</label>
            <input
              type="password"
              placeholder="পিন কোড লিখুন"
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-cyan-400 outline-none"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              maxLength={8}
              autoFocus
            />
            <p className="text-[10px] text-slate-500 font-mono text-right">Default code: 1234</p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-400 font-sans">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:opacity-90 active:scale-95 text-slate-950 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-cyan-400/10 cursor-pointer"
          >
            আনলক ড্যাশবোর্ড
          </button>
        </form>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-root" className="max-w-4xl mx-auto p-4 md:p-6 bg-slate-900 border border-slate-800/80 rounded-3xl shadow-2xl space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-cyan-950 text-cyan-400 rounded-xl flex items-center justify-center border border-cyan-800/40">
            <Settings className="w-5.5 h-5.5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-100 font-sans">ড্যাশবোর্ড অ্যাডমিন প্যানেল</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Live Backend Configured</p>
            </div>
          </div>
        </div>

        {/* Global Action tools */}
        <div className="flex items-center gap-2 sm:self-center">
          <button
            onClick={refreshLocalState}
            className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl active:scale-95 transition-all text-xs border border-slate-700/50 cursor-pointer"
            title="ডাটা রিফ্রেশ করুন"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsUnlocked(false)}
            className="flex items-center gap-1.5 bg-rose-950/35 hover:bg-rose-900/40 text-rose-400 border border-rose-800/30 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer select-none"
          >
            <LogOut className="w-4 h-4" />
            <span>লগআউট</span>
          </button>
        </div>
      </div>

      {/* Primary Dashboard Navigation Tabs */}
      <div className="flex items-center overflow-x-auto dark-scrollbar border-b border-slate-800/50 pb-px gap-1">
        <button
          onClick={() => setActiveTab("buttons")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === "buttons" 
              ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>বাটন লিস্ট এডিটর</span>
        </button>

        <button
          onClick={() => setActiveTab("sheets")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === "sheets" 
              ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sheet className="w-4 h-4" />
          <span>গুগল শিট সিঙ্ক</span>
        </button>

        <button
          onClick={() => setActiveTab("ads")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === "ads" 
              ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>বিজ্ঞাপন সেটিংস</span>
        </button>

        <button
          onClick={() => setActiveTab("notif")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === "notif" 
              ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>নোটিফিকেশন পাঠান</span>
        </button>
      </div>

      {/* Tab Content Display Area */}
      <div className="min-h-[300px]">
        {/* TAB 1: Buttons Management Database */}
        {activeTab === "buttons" && (
          <div className="space-y-6">
            {/* Creation Form block */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Plus className="w-4 h-4" />
                নতুন বাটন তৈরি করুন
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">বাটনের নাম</label>
                  <input
                    type="text"
                    placeholder="যেমন: Watch 1"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3 py-2 text-xs outline-none"
                    value={newButton.name}
                    onChange={(e) => setNewButton({ ...newButton, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">আইকন/ইমোজি</label>
                  <input
                    type="text"
                    placeholder="যেমন: 📺"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3 py-2 text-xs outline-none text-center"
                    value={newButton.logo}
                    onChange={(e) => setNewButton({ ...newButton, logo: e.target.value })}
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">ওয়েবসাইট লিংক URL</label>
                  <input
                    type="text"
                    placeholder="যেমন: wikipedia.org"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3 py-2 text-xs outline-none"
                    value={newButton.link}
                    onChange={(e) => setNewButton({ ...newButton, link: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">অ্যাড নেটওয়ার্ক</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3 py-2 text-xs outline-none"
                    value={newButton.network}
                    onChange={(e) => setNewButton({ ...newButton, network: e.target.value as any })}
                  >
                    <option value="startapp">StartApp Only</option>
                    <option value="monetag">Monetag Only</option>
                    <option value="both">Both (Random)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">অবস্থা</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3 py-2 text-xs outline-none"
                    value={newButton.status}
                    onChange={(e) => setNewButton({ ...newButton, status: e.target.value as any })}
                  >
                    <option value="active">Active (সবুজ)</option>
                    <option value="inactive">Inactive (বন্ধ)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <button
                    onClick={handleAddButton}
                    className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold h-9 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>নতুন বাটন যোগ করুন</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Existing buttons database list */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">বিদ্যমান বাটন সমূহ ({localConfig.buttons.length} টি)</h3>
              
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 divide-y divide-slate-800/80">
                {localConfig.buttons.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-500">কোনো বাটন পাওয়া যায়নি। নতুন একটি যোগ করুন বা গুগল শিট থেকে ইম্পোর্ট করুন।</p>
                ) : (
                  localConfig.buttons.map((btn) => (
                    <div key={btn.id} className="p-3 bg-slate-950 hover:bg-slate-900/30 flex items-center justify-between gap-4 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-md flex items-center justify-center">
                          {btn.logo}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-200">{btn.name}</h4>
                          <p className="text-[10px] text-slate-500 font-mono truncate max-w-xs sm:max-w-md">{btn.link}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Network indicator badge */}
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wide border ${
                          btn.network === "startapp" 
                            ? "bg-amber-950/20 text-amber-400 border-amber-900/30" 
                            : btn.network === "monetag" 
                            ? "bg-sky-950/20 text-sky-400 border-sky-900/30" 
                            : "bg-violet-950/20 text-violet-400 border-violet-900/30"
                        }`}>
                          {btn.network}
                        </span>

                        {/* Status Checkbox toggle */}
                        <button
                          onClick={() => handleToggleButtonStatus(btn.id)}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                            btn.status === "active" 
                              ? "bg-emerald-950/25 text-emerald-400 border-emerald-900/40" 
                              : "bg-slate-900 text-slate-500 border-slate-800"
                          }`}
                        >
                          {btn.status === "active" ? "Active" : "Disabled"}
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteButton(btn.id)}
                          className="p-1.5 hover:bg-rose-950/20 text-slate-500 hover:text-rose-400 rounded-lg cursor-pointer max-w-min"
                          title="বাটন ডিলিট করুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Google Sheets Sync Setup instruction */}
        {activeTab === "sheets" && (
          <div className="space-y-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
                <Sheet className="w-5.5 h-5.5 text-emerald-400" />
                <h3 className="text-sm font-bold text-gray-200">গুগল শিট ডাটাবেজ সিঙ্ক</h3>
              </div>

              {/* Instructions list */}
              <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                <p className="font-bold text-gray-100 flex items-center gap-1 h-fit">
                  <HelpCircle className="w-4.5 h-4.5 text-cyan-400" />
                  কীভাবে শিট আইডি পাবেন ও সেটআপ করবেন?
                </p>

                <ol className="list-decimal list-inside space-y-1.5 pl-2 text-slate-400">
                  <li>প্রথমে একটি গুগল স্প্রেডশিট খুলুন।</li>
                  <li>শিটের প্রথম লাইনে অবশ্যই নিচের মতো সঠিক কলামের নাম ও বানান লিখুন (প্রথম অক্ষর বড় বা ছোটও হতে পারে):
                    <div className="my-2 p-2 bg-slate-900 border border-slate-800/80 rounded-lg overflow-x-auto select-all font-mono text-[10px] text-emerald-400">
                      ID, Name, Logo, Link, Network, Status
                    </div>
                  </li>
                  <li>শিটের কলামগুলোতে প্রয়োজনীয় বাটন ডাটা পূরণ করুন (যেমন: Watch 1, 🎥, https://wikipedia.org, monetag, active)।</li>
                  <li>স্প্রেডশিটের শেয়ারিং সেটিংস থেকে অবশ্যই জেনেরাল এক্সেস পরিবর্তন করে <b>“Anyone with the link can view (ভিসিটর হিসেবে যে কেউ)”</b> অপশন সিলেক্ট করুন।</li>
                  <li>ব্রাউজারের এড্রেস বার থেকে শিট আইডিটি কপি করে নিচে পেস্ট করুন। যেমন:
                    <span className="block text-[10px] select-all bg-slate-900 border border-slate-800/40 p-1 rounded font-mono text-cyan-400 mt-1">
                      https://docs.google.com/spreadsheets/d/<span className="text-amber-400 underline font-bold font-sans">1Bxxxx_spreadsheet-id_xxx</span>/edit#gid=0
                    </span>
                  </li>
                </ol>
              </div>

              {/* Sync form input */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">GOOGLE SPREADSHEET ID</label>
                  <input
                    type="text"
                    placeholder="আপনার গুগল স্প্রেডশিট আইডি এখানে পেস্ট করুন"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-4 py-3 text-xs font-mono outline-none"
                    value={sheetIdInput}
                    onChange={(e) => setSheetIdInput(e.target.value)}
                  />
                </div>

                {syncStatus !== "idle" && (
                  <div className={`p-4 rounded-xl text-xs flex gap-2 ${
                    syncStatus === "syncing" 
                      ? "bg-cyan-950/10 border border-cyan-800/30 text-cyan-400" 
                      : syncStatus === "success" 
                      ? "bg-emerald-950/10 border border-emerald-800/30 text-emerald-400" 
                      : "bg-rose-950/10 border border-rose-800/30 text-rose-400"
                  }`}>
                    {syncStatus === "syncing" ? <RefreshCw className="w-5 h-5 animate-spin shrinkage-0" /> : <Check className="w-5 h-5 fallback-ping-0" />}
                    <span>{syncMessage}</span>
                  </div>
                )}

                <button
                  onClick={handleSheetSyncSubmit}
                  disabled={syncStatus === "syncing"}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md shadow-emerald-500/10"
                >
                  <Sheet className="w-4 h-4" />
                  <span>গুগল শিট থেকে বাটন সিঙ্ক করুন</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Ad-Networks (StartApp / Monetag) & System configurations */}
        {activeTab === "ads" && (
          <div className="space-y-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-5">
              <h3 className="text-sm font-bold text-gray-200 border-b border-slate-800/60 pb-3">বিজ্ঞাপন নিয়ন্ত্রণ ও আইডি সেটিংস</h3>
              
              {/* Global toggle ads button */}
              <div className="flex items-center justify-between p-3.5 bg-slate-900 rounded-2xl border border-slate-800/80">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-200">বিজ্ঞাপন ডিসপ্লে করা</span>
                  <p className="text-[10px] text-slate-500">অ্যাপের ভেতর বিজ্ঞাপন চালু বা সম্পূর্ণ বন্ধ করতে টগল করুন।</p>
                </div>
                
                <button
                  onClick={() => {
                    const status = !localConfig.adConfig.adsEnabled;
                    handleUpdateAdSettings("adsEnabled", status);
                    handleSaveToDatabase({
                      ...localConfig,
                      adConfig: { ...localConfig.adConfig, adsEnabled: status }
                    });
                  }}
                  className={`w-12 h-6 flex items-center rounded-all p-1 duration-300 cursor-pointer rounded-full ${
                    localConfig.adConfig.adsEnabled ? "bg-cyan-500 justify-end" : "bg-slate-800 justify-start"
                  }`}
                >
                  <motion.div className="w-4 h-4 bg-white rounded-full shadow-md" layout />
                </button>
              </div>

              {/* Grid ID inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">STARTAPP APP ID</label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none"
                    value={localConfig.adConfig.startappAppId}
                    onChange={(e) => handleUpdateAdSettings("startappAppId", e.target.value)}
                    placeholder="20XXXXXX"
                  />
                  <p className="text-[10px] text-slate-500">আপনার স্টার্টঅ্যাপ অ্যাকাউন্ট থেকে প্রাপ্ত অ্যাপ প্লেসমেন্ট আইডি দিন</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">MONETAG ZONE ID</label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none"
                    value={localConfig.adConfig.monetagZoneId}
                    onChange={(e) => handleUpdateAdSettings("monetagZoneId", e.target.value)}
                    placeholder="7XXXXXX"
                  />
                  <p className="text-[10px] text-slate-500">আপনার মনেট্যাগ অ্যাড অ্যাকাউন্ট থেকে প্রাপ্ত জোন আইডি দিন</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">বিজ্ঞাপন প্রদর্শন সময় ({localConfig.adConfig.videoDurationSeconds} সেকেন্ড)</label>
                  <input
                    type="range"
                    min={3}
                    max={15}
                    className="w-full accent-cyan-400"
                    value={localConfig.adConfig.videoDurationSeconds}
                    onChange={(e) => handleUpdateAdSettings("videoDurationSeconds", parseInt(e.target.value))}
                  />
                  <p className="text-[10px] text-slate-500">বিজ্ঞাপন এড়িয়ে যাওয়ার (Skip) পূর্বের বাধ্যতামূলক সময়কাল নির্ধারণ করুন</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">বিজ্ঞাপন ভিডিও ডেমো URL (MP4)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none"
                    value={localConfig.adConfig.videoAdUrl}
                    onChange={(e) => handleUpdateAdSettings("videoAdUrl", e.target.value)}
                    placeholder="https://example.com/ad-spot.mp4"
                  />
                  <p className="text-[10px] text-slate-500">ঐচ্ছিক: ভিডিও বিজ্ঞপ্তির ফাইল লিঙ্ক ব্যবহার করতে পারেন</p>
                </div>
              </div>

              {/* Secondary block: Administration credentials update */}
              <div className="pt-5 border-t border-slate-800 space-y-3">
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest block">নিরাপত্তা কোড (ADMIN LOGIN PIN)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="নতুন ৪-৮ ডিজিটের পিন কোড"
                    className="bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none flex-1"
                    onChange={(e) => handleUpdateAdminPin(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      handleSaveToDatabase(localConfig);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all border border-slate-700"
                  >
                    পিন আপডেট করুন
                  </button>
                </div>
              </div>

              {/* Global Save Button */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
                <p className="text-[11px] text-slate-400 font-sans">
                  *যেকোনো পরিবর্তনের পর সেভ বাটন ক্লিক করতে ভুলবেন না
                </p>

                <button
                  onClick={() => handleSaveToDatabase(localConfig)}
                  className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-2.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-400/10 active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>সেভ করুন</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Notifications Sender */}
        {activeTab === "notif" && (
          <div className="space-y-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-gray-200 border-b border-slate-800/60 pb-3">নতুন ইন-অ্যাপ নোটিফিকেশন পাঠান</h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">নোটিফিকেশন টাইটেল</label>
                  <input
                    type="text"
                    placeholder="যেমন: নতুন ওয়াচ লিঙ্ক আপডেটেড!"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3 py-2 text-xs outline-none"
                    value={newNotif.title}
                    onChange={(e) => setNewNotif({ ...newNotif, title: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">নোটিফিকেশন বিবরণ (মেসেজ)</label>
                  <textarea
                    rows={3}
                    placeholder="ব্যবহারকারীদের জন্য আপনার গুরুত্বপূর্ণ সংবাদ বা অফার বিস্তারিত লিখুন..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3 py-2 text-xs outline-none resize-none"
                    value={newNotif.message}
                    onChange={(e) => setNewNotif({ ...newNotif, message: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">নোটিফিকেশন অ্যালার্ট কালার/টাইপ</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3 py-2 text-xs outline-none"
                    value={newNotif.type}
                    onChange={(e) => setNewNotif({ ...newNotif, type: e.target.value as any })}
                  >
                    <option value="info">Info (আকাশি)</option>
                    <option value="success">Success (সবুজ)</option>
                    <option value="warning">Warning (হলুদ)</option>
                    <option value="alert">Alert (লাল)</option>
                  </select>
                </div>

                <button
                  onClick={handleAddNewNotification}
                  className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
                >
                  <Bell className="w-4 h-4 animate-bounce" />
                  <span>নোটিফিকেশন পাঠান (Blast Notification)</span>
                </button>
              </div>
            </div>

            {/* Notification Blast logs */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">পূর্ববর্তী নোটিফিকেশন লোগ ({localConfig.notifications.length} টি)</h3>
              
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 divide-y divide-slate-800/80 max-h-64 overflow-y-auto">
                {localConfig.notifications.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-500">কোনো নোটিফিকেশন রেকর্ড নেই।</p>
                ) : (
                  localConfig.notifications.map((notif) => (
                    <div key={notif.id} className="p-3 bg-slate-950 hover:bg-slate-900/30 flex items-center justify-between gap-4 transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-gray-200">{notif.title}</h4>
                          <span className={`text-[8px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                            notif.type === "success" ? "bg-emerald-900/35 text-emerald-400" :
                            notif.type === "warning" ? "bg-amber-900/35 text-amber-400" :
                            notif.type === "alert" ? "bg-rose-900/35 text-rose-400" :
                            "bg-sky-900/35 text-sky-400"
                          }`}>
                            {notif.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{notif.message}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleNotificationStatus(notif.id)}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                            notif.active 
                              ? "bg-emerald-950/25 text-emerald-400 border-emerald-900/40" 
                              : "bg-slate-900 text-slate-500 border-slate-800"
                          }`}
                        >
                          {notif.active ? "এক্টিভ" : "আর্কাইভ"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Toast Success banner overlay */}
      {saveStatus === "success" && (
        <motion.div
          className="fixed bottom-6 right-6 bg-emerald-500 text-slate-950 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 font-sans border border-emerald-400"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span className="text-xs font-bold">{saveMessage}</span>
        </motion.div>
      )}

      {saveStatus === "error" && (
        <motion.div
          className="fixed bottom-6 right-6 bg-rose-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 font-sans border border-rose-400"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <X className="w-5 h-5 stroke-[3]" />
          <span className="text-xs font-bold">{saveMessage}</span>
        </motion.div>
      )}
    </div>
  );
}
