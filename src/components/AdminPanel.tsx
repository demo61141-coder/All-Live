import React, { useState } from "react";
import { 
  motion 
} from "motion/react";
import { 
  Lock, Settings, Plus, Trash2, Sheet, Bell, Save, LogOut, Check, HelpCircle, RefreshCw, Eye, EyeOff, AlertCircle, X, Sparkles, MessageSquare, User, Heart, ShieldCheck
} from "lucide-react";
import { AppConfig, AppButton, NotificationItem, PremiumItem } from "../types";

interface AdminPanelProps {
  config: AppConfig;
  onSaveConfig: (updated: AppConfig, pin1?: string, pin2?: string) => Promise<boolean>;
  onSyncGoogleSheet: (sheetsId: string, pin1?: string, pin2?: string) => Promise<{ success: boolean; message: string; config?: AppConfig }>;
  onUnlock?: (pin1: string, pin2: string) => void;
}

export default function AdminPanel({ config, onSaveConfig, onSyncGoogleSheet, onUnlock }: AdminPanelProps) {
  // Staggered Two-Step PIN authentication states
  const [loginStep, setLoginStep] = useState<1 | 2>(1);
  const [pinInput1, setPinInput1] = useState("");
  const [pinInput2, setPinInput2] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loginError, setLoginError] = useState("");
  
  // Dashboard navigation sub-tabs
  const [activeTab, setActiveTab] = useState<"buttons" | "sheets" | "ads" | "notif" | "premium" | "feedbacks" | "developer" | "donations" | "security">("buttons");

  // Form states
  const [localConfig, setLocalConfig] = useState<AppConfig>({ ...config });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  // Forgot Password / PIN Recovery states
  const [showRecForm, setShowRecForm] = useState(false);
  const [recAnswer, setRecAnswer] = useState("");
  const [recError, setRecError] = useState("");
  const [recNewPin1, setRecNewPin1] = useState("");
  const [recNewPin2, setRecNewPin2] = useState("");

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

  // Change Pin state
  const [secPinInput1, setSecPinInput1] = useState("");
  const [secPinInput2, setSecPinInput2] = useState("");

  // Developer Profile states
  const [devName, setDevName] = useState(config.devDetails?.name || "Md Hasan Khalifa");
  const [devSubTitle, setDevSubTitle] = useState(config.devDetails?.subTitle || "অ্যাপ প্রতিষ্ঠাতা ও প্রিমিয়াম ভেন্ডর");
  const [devDescription, setDevDescription] = useState(config.devDetails?.description || "");
  const [devWhatsapp, setDevWhatsapp] = useState(config.devDetails?.whatsappNumber || "8801798088609");
  const [devFacebook, setDevFacebook] = useState(config.devDetails?.facebookUrl || "https://www.facebook.com/HasanKhalifa01");
  const [devAvatarInitials, setDevAvatarInitials] = useState(config.devDetails?.avatarInitials || "HK");

  // Feedback Sheets Automation Script URL
  const [feedbackSheetUrlInput, setFeedbackSheetUrlInput] = useState(config.feedbackSheetUrl || "");

  // Add Premium Item state
  const [newPremName, setNewPremName] = useState("");
  const [newPremCategory, setNewPremCategory] = useState<"apk" | "course" | "book" | "movie">("apk");
  const [newPremUrl, setNewPremUrl] = useState("");
  const [newPremBtnText, setNewPremBtnText] = useState("");

  // Mobile Financial Services state
  const [bkashNumInput, setBkashNumInput] = useState(config.bkashNumber || "01798088609");
  const [nagadNumInput, setNagadNumInput] = useState(config.nagadNumber || "01798088609");
  const [rocketNumInput, setRocketNumInput] = useState(config.rocketNumber || "01798088609");

  // Security Q/A state
  const [securityQInput, setSecurityQInput] = useState(config.securityQuestion || "আপনার প্রিয় রঙের নাম কী?");
  const [securityAInput, setSecurityAInput] = useState(config.securityAnswer || "নীল");

  // Edit Button State
  const [editingButton, setEditingButton] = useState<AppButton | null>(null);

  // Edit Button Save Handler
  const handleSaveEditedButton = () => {
    if (!editingButton) return;
    if (!editingButton.name || !editingButton.link) {
      alert("বাটনের নাম এবং ওয়েবসাইট লিংক অবশ্যই দিতে হবে!");
      return;
    }

    let url = editingButton.link.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const updatedBtn = {
      ...editingButton,
      link: url
    };

    const updatedConfig = {
      ...localConfig,
      buttons: localConfig.buttons.map(b => b.id === updatedBtn.id ? updatedBtn : b)
    };

    setLocalConfig(updatedConfig);
    setEditingButton(null);
    handleSaveToDatabase(updatedConfig);
  };

  // Delete User session from analytics list handler
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই ইউজারটিকে তালিকা থেকে ডিলিট করতে চান?")) return;
    try {
      const response = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-pin": pinInput1.trim(),
          "x-admin-pin-secondary": pinInput2.trim()
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        setLocalConfig(prev => ({
          ...prev,
          users: (prev.users || []).filter(u => u.id !== userId)
        }));
      } else {
        alert("ইউজার ডিলিট করা সম্ভব হয়নি।");
      }
    } catch (err: any) {
      alert(`ডিলিট করতে ত্রুটি: ${err.message}`);
    }
  };

  // Verify PIN sequence
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (loginStep === 1) {
      const pin1 = pinInput1.trim();
      if (!pin1) return;

      try {
        const response = await fetch("/api/admin/verify-step1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin1 })
        });

        if (response.ok) {
          setLoginStep(2);
        } else {
          setLoginError("ভুল প্রথম পিন কোড! অনুগ্রহ করে আবার চেষ্টা করুন।");
        }
      } catch (err) {
        setLoginError("নেটওয়ার্ক সংযোগ ত্রুটি! প্রথম পিন পরীক্ষা করা যাচ্ছে না।");
      }
    } else {
      const pin2 = pinInput2.trim();
      if (!pin2) return;

      try {
        const response = await fetch("/api/admin/verify-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin1: pinInput1.trim(), pin2 })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config) {
            setLocalConfig(data.config);
            setIsUnlocked(true);
            onUnlock?.(pinInput1.trim(), pin2);
          } else {
            setLoginError("ভুল দ্বিতীয় পিন কোড! অল লাইভ অ্যাক্সেস প্রত্যাখ্যাত।");
          }
        } else {
          setLoginError("ভুল দ্বিতীয় পিন কোড! অল লাইভ অ্যাক্সেস প্রত্যাখ্যাত।");
        }
      } catch (err) {
        setLoginError("নেটওয়ার্ক সংযোগ ত্রুটি! দ্বিতীয় পিন পরীক্ষা করা যাচ্ছে না।");
      }
    }
  };

  // Sync from parent config changes
  const refreshLocalState = () => {
    setLocalConfig({ ...config });
    setSheetIdInput(config.googleSheetsId || "");
    setDevName(config.devDetails?.name || "Md Hasan Khalifa");
    setDevSubTitle(config.devDetails?.subTitle || "অ্যাপ প্রতিষ্ঠাতা ও প্রিমিয়াম ভেন্ডর");
    setDevDescription(config.devDetails?.description || "");
    setDevWhatsapp(config.devDetails?.whatsappNumber || "8801798088609");
    setDevFacebook(config.devDetails?.facebookUrl || "https://www.facebook.com/HasanKhalifa01");
    setDevAvatarInitials(config.devDetails?.avatarInitials || "HK");
    setFeedbackSheetUrlInput(config.feedbackSheetUrl || "");
    setBkashNumInput(config.bkashNumber || "01798088609");
    setNagadNumInput(config.nagadNumber || "01798088609");
    setRocketNumInput(config.rocketNumber || "01798088609");
    setSecurityQInput(config.securityQuestion || "আপনার প্রিয় রঙের নাম কী?");
    setSecurityAInput(config.securityAnswer || "নীল");
  };

  // Trigger global save with secure pass headers
  const handleSaveToDatabase = async (updatedState: AppConfig) => {
    setSaveStatus("saving");
    setSaveMessage("সেভ করা হচ্ছে...");
    const success = await onSaveConfig(updatedState, pinInput1.trim(), pinInput2.trim());
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

  // Add premium library content item
  const handleAddPremiumItem = () => {
    if (!newPremName.trim() || !newPremUrl.trim()) {
      alert("প্রিমিয়াম আইটেমের টাইটেল এবং ডাউনলোড লিংক দিতে হবে!");
      return;
    }

    let url = newPremUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    let mappedCategory: "Premium APK" | "Premium course" | "Premium book" | "New Premium movie";
    if (newPremCategory === "apk") {
      mappedCategory = "Premium APK";
    } else if (newPremCategory === "course") {
      mappedCategory = "Premium course";
    } else if (newPremCategory === "book") {
      mappedCategory = "Premium book";
    } else {
      mappedCategory = "New Premium movie";
    }

    const createdItem: PremiumItem = {
      id: `prem_${Date.now()}`,
      name: newPremName.trim(),
      category: mappedCategory,
      link: url,
      status: "active"
    };

    const currentItems = localConfig.premiumItems || [];
    const updatedConfig = {
      ...localConfig,
      premiumItems: [...currentItems, createdItem]
    };

    setLocalConfig(updatedConfig);
    setNewPremName("");
    setNewPremUrl("");
    setNewPremBtnText("");
    handleSaveToDatabase(updatedConfig);
  };

  // Delete premium library content item
  const handleDeletePremiumItem = (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই প্রিমিয়াম আইটেমটি ডিলিট করতে চান?")) return;
    const currentItems = localConfig.premiumItems || [];
    const updatedConfig = {
      ...localConfig,
      premiumItems: currentItems.filter(item => item.id !== id)
    };
    setLocalConfig(updatedConfig);
    handleSaveToDatabase(updatedConfig);
  };

  // Delete user suggestion record
  const handleDeleteFeedback = (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই অনুরোধ / ফিডব্যাক বিবরণটি মুছে দিতে চান?")) return;
    const currentFeedbacks = localConfig.feedbacks || [];
    const updatedConfig = {
      ...localConfig,
      feedbacks: currentFeedbacks.filter(f => f.id !== id)
    };
    setLocalConfig(updatedConfig);
    handleSaveToDatabase(updatedConfig);
  };

  // Save Developer Details and Automations Webhook
  const handleSaveDeveloperAndSheetDetails = () => {
    const updatedConfig: AppConfig = {
      ...localConfig,
      devDetails: {
        name: devName.trim(),
        subTitle: devSubTitle.trim(),
        description: devDescription.trim(),
        whatsappNumber: devWhatsapp.trim(),
        facebookUrl: devFacebook.trim(),
        avatarInitials: devAvatarInitials.trim() || 'HK'
      },
      feedbackSheetUrl: feedbackSheetUrlInput.trim()
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

  // Save payments gateways
  const handleSavePaymentNumbers = () => {
    const updatedConfig: AppConfig = {
      ...localConfig,
      bkashNumber: bkashNumInput.trim(),
      nagadNumber: nagadNumInput.trim(),
      rocketNumber: rocketNumInput.trim()
    };
    setLocalConfig(updatedConfig);
    handleSaveToDatabase(updatedConfig);
    alert('মোবাইল ব্যাংকিং পেমেন্ট গেটওয়ে নাম্বারসমূহ সফলভাবে সেভ করা হয়েছে!');
  };

  // Save Security Details (Twin PINs and Q/A)
  const handleSaveSecuritySettings = (primaryPin: string, secondaryPin: string, q: string, a: string) => {
    const p1 = primaryPin.trim();
    const p2 = secondaryPin.trim();
    if (!p1 || p1.length < 4 || !p2 || p2.length < 4) {
      alert('১ম এবং ২য় পিন উভয়ই অবশ্যই কমপক্ষে ৪ সংখ্যার হতে হবে!');
      return;
    }
    const updatedConfig: AppConfig = {
      ...localConfig,
      adminCode: p1,
      adminCodeSecondary: p2,
      securityQuestion: q.trim(),
      securityAnswer: a.trim()
    };
    setLocalConfig(updatedConfig);
    handleSaveToDatabase(updatedConfig);
    alert('আপনার ডাবল প্রটেকশন সিকিউরিটি পিন ও প্রশ্নের উত্তর সফলভাবে সেভ করা হয়েছে!');
  };

  // Moderate donation keys/records
  const handleApproveKey = (userKey: string) => {
    const adFree = localConfig.adFreeUsers || [];
    const targetUser = adFree.find(u => u.activationKey === userKey);
    const duration = targetUser?.duration || "permanent";

    // Calculate expiryDate
    let expiryDate: string = "permanent";
    const now = new Date();
    if (duration === "1day") {
      now.setDate(now.getDate() + 1);
      expiryDate = now.toISOString();
    } else if (duration === "1month") {
      now.setMonth(now.getMonth() + 1);
      expiryDate = now.toISOString();
    } else if (duration === "1year") {
      now.setFullYear(now.getFullYear() + 1);
      expiryDate = now.toISOString();
    }

    const updatedUsers = adFree.map(u => {
      if (u.activationKey === userKey) {
        return { 
          ...u, 
          status: 'approved' as const,
          duration,
          expiryDate
        };
      }
      return u;
    });
    const updatedConfig = {
      ...localConfig,
      adFreeUsers: updatedUsers
    };
    setLocalConfig(updatedConfig);
    handleSaveToDatabase(updatedConfig);
    alert(`বিজ্ঞাপন মুক্ত সুবিধাটি ${duration === "1day" ? "১ দিন" : duration === "1month" ? "১ মাস" : duration === "1year" ? "১ বছর" : "স্থায়ী"} মেয়াদে অনুমোদিত করা হয়েছে!`);
  };

  const handleUpdateUserDuration = (userKey: string, duration: "1day" | "1month" | "1year" | "permanent" | "expired") => {
    let expiryDate: string = "permanent";
    const now = new Date();
    if (duration === "1day") {
      now.setDate(now.getDate() + 1);
      expiryDate = now.toISOString();
    } else if (duration === "1month") {
      now.setMonth(now.getMonth() + 1);
      expiryDate = now.toISOString();
    } else if (duration === "1year") {
      now.setFullYear(now.getFullYear() + 1);
      expiryDate = now.toISOString();
    } else if (duration === "expired") {
      expiryDate = "expired";
    }

    const adFree = localConfig.adFreeUsers || [];
    const updatedUsers = adFree.map(u => {
      if (u.activationKey === userKey) {
        return { 
          ...u, 
          duration,
          expiryDate,
          status: duration === "expired" ? 'pending' as const : u.status
        };
      }
      return u;
    });
    const updatedConfig = {
      ...localConfig,
      adFreeUsers: updatedUsers
    };
    setLocalConfig(updatedConfig);
    handleSaveToDatabase(updatedConfig);
    alert(`মেয়াদ পরিবর্তন করে '${duration === "1day" ? "১ দিন" : duration === "1month" ? "১ মাস" : duration === "1year" ? "১ বছর" : duration === "expired" ? "expired" : "স্থায়ী"}' করা হয়েছে!`);
  };

  const handleRevokeKey = (userKey: string) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই বিজ্ঞাপন মুক্ত সুবিধা বাতিল করতে চান?')) return;
    const adFree = localConfig.adFreeUsers || [];
    const updatedUsers = adFree.filter(u => u.activationKey !== userKey);
    const updatedConfig = {
      ...localConfig,
      adFreeUsers: updatedUsers
    };
    setLocalConfig(updatedConfig);
    handleSaveToDatabase(updatedConfig);
    alert('বিজ্ঞাপন মুক্ত সুবিধাটি বাতিল করা হয়েছে!');
  };

  if (!isUnlocked) {
    const handleRecoverPinWithQuestion = async (e: React.FormEvent) => {
      e.preventDefault();
      const ansInput = recAnswer.trim();
      const p1 = recNewPin1.trim();
      const p2 = recNewPin2.trim();

      if (!ansInput || !p1 || !p2) {
        setRecError("অনুগ্রহ করে প্রশ্নের সঠিক উত্তর এবং নতুন দুটো পিন কোডই দিন!");
        return;
      }

      if (p1.length < 4 || p2.length < 4) {
        setRecError("পিন কোড দুটোই কমপক্ষে ৪ ডিজিটের হতে হবে!");
        return;
      }

      try {
        const response = await fetch("/api/admin/verify-recovery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: ansInput, pin1: p1, pin2: p2 })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            alert(`অভিনন্দন! সঠিক উত্তর দিয়েছেন। নতুন পিনদ্বয় সেট করা হয়েছে (১ম পিন: ${p1}, ২য় পিন: ${p2})।`);
            setPinInput1(p1);
            setPinInput2(p2);
            setLoginStep(2);
            setIsUnlocked(true);
            onUnlock?.(p1, p2);
            setShowRecForm(false);
            setRecAnswer("");
            setRecNewPin1("");
            setRecNewPin2("");
            setRecError("");
          } else {
            setRecError("নিরাপত্তা প্রশ্নের উত্তরটি ভুল হয়েছে! আবার চেষ্টা করুন।");
          }
        } else {
          setRecError("নিরাপত্তা প্রশ্নের উত্তরটি ভুল হয়েছে! আবার চেষ্টা করুন।");
        }
      } catch (err) {
        setRecError("সার্ভার ভেরিফিকেশন সংযোগ ব্যর্থ হয়েছে।");
      }
    };

    return (
      <div id="admin-gate-stage" className="max-w-md mx-auto p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl mt-8">
        {!showRecForm ? (
          <>
            <div className="text-center space-y-3 mb-6">
              <div className="w-14 h-14 bg-cyan-950/40 border border-cyan-800 rounded-2xl flex items-center justify-center mx-auto text-cyan-400">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-gray-100 font-sans">ডাবল প্রটেকশন অ্যাডমিন লক 🔐</h2>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                {loginStep === 1 
                  ? "ধাপ ১: আপনার প্রথম প্রাইমারি এডমিন পিন কোডটি দিন।" 
                  : "ধাপ ২: চমৎকার! এবার অ্যাক্সেস কনফার্ম করতে আপনার দ্বিতীয় নিরাপত্তা পিনটি দিন।"}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginStep === 1 ? (
                <div className="space-y-1.5 focus-within:scale-[1.01] transition-all">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold text-center">PRIMARY ADMIN PIN (STEP 1)</label>
                  <input
                    type="password"
                    placeholder="প্রথম পিন কোড দিন (যেমন: 1234)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-cyan-400 outline-none"
                    value={pinInput1}
                    onChange={(e) => setPinInput1(e.target.value)}
                    maxLength={12}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="space-y-1.5 focus-within:scale-[1.01] transition-all">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold text-center">SECONDARY SECURITY PIN (STEP 2)</label>
                  <input
                    type="password"
                    placeholder="দ্বিতীয় পিন কোড দিন"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-emerald-400 outline-none"
                    value={pinInput2}
                    onChange={(e) => setPinInput2(e.target.value)}
                    maxLength={12}
                    autoFocus
                  />
                </div>
              )}

              {loginError && (
                <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-400 font-sans">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:opacity-90 active:scale-95 text-slate-950 font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-cyan-400/10 cursor-pointer text-center animate-pulse"
                >
                  {loginStep === 1 ? "কন্টিনিউ (পরবর্তী ধাপ)" : "ড্যাশবোর্ড আনলক করুন"}
                </button>

                {loginStep === 2 && (
                  <button
                    type="button"
                    onClick={() => { setLoginStep(1); setLoginError(""); }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold py-2 rounded-xl text-xs cursor-pointer text-center"
                  >
                    প্রথম ধাপে ফিরে যান
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowRecForm(true)}
                  className="w-full bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-800/80 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all text-center"
                >
                  🔑 পিন উদ্ধার করুন (Forgot PIN)
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="text-center space-y-3 mb-6">
              <div className="w-14 h-14 bg-indigo-950/40 border border-indigo-850 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
                <HelpCircle className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-gray-100 font-sans font-black">ডাবল পিন উদ্ধার (Reset)</h2>
              <p className="text-xs text-slate-400 font-sans">
                আপনার আগে সেট করা নিরাপত্তা প্রশ্নের সঠিক উত্তর দিয়ে নতুন দুটি পিন কোড সেট করুন।
              </p>
            </div>

            <form onSubmit={handleRecoverPinWithQuestion} className="space-y-4 text-left">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">নিরাপত্তা প্রশ্ন</span>
                <p className="text-sm font-extrabold text-indigo-400 font-sans">
                  {config.securityQuestion || "আপনার প্রিয় রঙের নাম কী?"}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block font-bold">প্রশ্নের সঠিক উত্তর</label>
                <input
                  type="text"
                  placeholder="প্রশ্নের উত্তর দিন (যেমন: নীল)"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none font-sans"
                  value={recAnswer}
                  onChange={(e) => setRecAnswer(e.target.value)}
                  maxLength={45}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase block font-bold">নতুন পিন ১ (Primary)</label>
                  <input
                    type="password"
                    placeholder="যেমন: 1234"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs font-mono text-center tracking-widest text-cyan-400 outline-none"
                    value={recNewPin1}
                    onChange={(e) => setRecNewPin1(e.target.value)}
                    maxLength={12}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase block font-bold">নতুন পিন ২ (Secondary)</label>
                  <input
                    type="password"
                    placeholder="যেমন: 5678"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-center tracking-widest text-emerald-400 outline-none"
                    value={recNewPin2}
                    onChange={(e) => setRecNewPin2(e.target.value)}
                    maxLength={12}
                  />
                </div>
              </div>

              {recError && (
                <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-455 font-sans">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{recError}</span>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/10 cursor-pointer text-center"
                >
                  উত্তর জমা দিন ও পিন সেট করুন
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowRecForm(false);
                    setRecAnswer("");
                    setRecNewPin1("");
                    setRecNewPin2("");
                    setRecError("");
                  }}
                  className="w-full bg-transparent text-slate-400 hover:text-slate-200 font-bold py-2 rounded-xl text-xs cursor-pointer transition-all text-center"
                >
                  ফিরে যান
                </button>
              </div>
            </form>
          </>
        )}
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
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-slate-500 font-medium font-sans">মেনু ক্যাটাগরিসমূহ:</span>
          <div className="text-[10px] text-cyan-400 bg-cyan-950/40 border border-cyan-800/35 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse select-none">
            <span>ডানে-বামে স্ক্রোল করুন</span>
            <span className="font-mono font-bold">↔</span>
          </div>
        </div>
        <div className="flex items-center overflow-x-auto dark-scrollbar border-b border-slate-800 pb-2.5 gap-1.5 scroll-smooth max-w-full">
          <button
            onClick={() => setActiveTab("buttons")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === "buttons" 
                ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>বাটন লিস্ট এডিটর</span>
          </button>

          <button
            onClick={() => setActiveTab("sheets")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === "sheets" 
                ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sheet className="w-4 h-4 shrink-0" />
            <span>গুগল শিট সিঙ্ক</span>
          </button>

          <button
            onClick={() => setActiveTab("ads")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === "ads" 
                ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>বিজ্ঞাপন সেটিংস</span>
          </button>

          <button
            onClick={() => setActiveTab("notif")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === "notif" 
                ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span>নোটিফিকেশন পাঠান</span>
          </button>

          <button
            onClick={() => setActiveTab("premium")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === "premium" 
                ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>প্রিমিয়াম পোর্টাল</span>
          </button>

          <button
            onClick={() => setActiveTab("feedbacks")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === "feedbacks" 
                ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span>ইউজার অনুরোধ ও ফিডব্যাক ({config.feedbacks?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("developer")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === "developer" 
                ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>প্রোফাইল ও অটোমেশন (Developer Info)</span>
          </button>

          <button
            onClick={() => setActiveTab("donations")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === "donations" 
                ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Heart className="w-3.5 h-3.5 shrink-0 text-pink-400" />
            <span>ডোনেশন ও বিজ্ঞাপন অনুমোদন ({localConfig.adFreeUsers?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === "security" 
                ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Lock className="w-3.5 h-3.5 shrink-0 text-yellow-400" />
            <span>পাসওয়ার্ড ও সিকিউরিটি</span>
          </button>

          <button
            onClick={() => setActiveTab("users" as any)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === "users" 
                ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span>ইউজার অ্যানালাইসিস (Analytics) ({(localConfig.users || []).length})</span>
          </button>
        </div>
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

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">বিজ্ঞাপন দেখাবে?</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3 py-2 text-xs outline-none"
                    value={newButton.adsEnabled !== false ? "yes" : "no"}
                    onChange={(e) => setNewButton({ ...newButton, adsEnabled: e.target.value === "yes" })}
                  >
                    <option value="yes">বিজ্ঞাপন চালু (Ad ON)</option>
                    <option value="no">বিজ্ঞাপন বন্ধ (Ad OFF)</option>
                  </select>
                </div>

                <div className="flex items-end">
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
                        {/* Ads Status Badge */}
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                          btn.adsEnabled !== false 
                            ? "bg-cyan-950/20 text-cyan-400 border-cyan-800/30" 
                            : "bg-rose-950/20 text-rose-400 border-rose-900/30"
                        }`}>
                          {btn.adsEnabled !== false ? "Ad: ON" : "Ad: OFF"}
                        </span>

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

                        {/* Edit button */}
                        <button
                          onClick={() => setEditingButton(btn)}
                          className="p-1.5 hover:bg-cyan-950/20 text-slate-500 hover:text-cyan-400 rounded-lg cursor-pointer max-w-min"
                          title="বাটন এডিট করুন"
                        >
                          <Settings className="w-3.5 h-3.5" />
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
              <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                <p className="font-bold text-gray-150 flex items-center gap-1.5 h-fit text-sm">
                  <HelpCircle className="w-5 h-5 text-cyan-400" />
                  গুগল স্প্রেডশিট লিংক কানেক্ট করার পূর্ণাঙ্গ নিয়মাবলী
                </p>

                <ol className="list-decimal list-inside space-y-2.5 pl-1.5 text-slate-400 font-sans">
                  <li>আপনার গুগল ড্রাইভ থেকে একটি নতুন <b>Google Spreadsheet</b> তৈরি করুন।</li>
                  <li>স্প্রেডশিটের একদম প্রথম র-তে (Row 1) হুবহু নিচের কলামের নামগুলি লিখুন (বানান যেন ভুল না হয়):
                    <div className="my-2 p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl overflow-x-auto select-all font-mono text-[10.5px] text-emerald-400 flex gap-4 font-bold">
                      <span>A: ID</span>
                      <span>B: Name</span>
                      <span>C: Logo</span>
                      <span>D: Link</span>
                      <span>E: Network</span>
                      <span>F: Status</span>
                    </div>
                  </li>
                  <li>
                    <span className="text-gray-200 font-bold">কলামসমূহের বিস্তারিত পরিচিতি ও উদাহরণ:</span>
                    <ul className="list-disc list-inside space-y-1 pl-4 text-slate-400 mt-1">
                      <li><b className="text-slate-300 font-mono">ID:</b> প্রতিটি বাটনের স্বতন্ত্র ইউনিক আইডি (যেমন: <code>live_1</code>, <code>watch_sport_2</code>)।</li>
                      <li><b className="text-slate-300 font-mono">Name:</b> বাটনে যে লেখাটি মানুষের নিকট প্রদর্শন করবেন (যেমন: <code>Star Sports 1 HD</code>)।</li>
                      <li><b className="text-slate-300 font-mono">Logo:</b> বাটনে লেখার বাম পাশে যে ইমোজি বা চিহ্ন থাকবে (যেমন: 📺, 🎥, ⚽)।</li>
                      <li><b className="text-slate-300 font-mono">Link:</b> বাটনটিতে স্পর্শ করলেই যে ওয়েব লিংক বা স্ট্রিমিং ইউআরএল ওপেন হবে।</li>
                      <li><b className="text-slate-300 font-mono">Network:</b> লিংকে প্রবেশের আগে যে এড চালু করতে চান তা সিলেক্ট করতে (<code>startapp</code> বা <code>monetag</code> লিখুন, এড ছাড়া ওপেন করতে <code>none</code> লিখুন)।</li>
                      <li><b className="text-slate-300 font-mono">Status:</b> বাটনটি অ্যাপে দেখাতে চাইলে <code>active</code> লিখুন, হাইড বা নিষ্ক্রিয় করে রাখতে চাইলে <code>inactive</code> লিখুন।</li>
                    </ul>

                    {/* Highly stylized example table representing spreadsheet structure */}
                    <div className="overflow-x-auto border border-slate-800/80 rounded-xl mt-3.5 bg-slate-900/20 max-w-full">
                      <table className="min-w-full divide-y divide-slate-800/50 text-[10.5px] font-sans">
                        <thead className="bg-slate-950 text-slate-400 font-mono font-bold">
                          <tr>
                            <th className="px-3 py-2 text-left border-r border-slate-800/30">Row No.</th>
                            <th className="px-3 py-2 text-left border-r border-slate-800/30">A (ID)</th>
                            <th className="px-3 py-2 text-left border-r border-slate-800/30">B (Name)</th>
                            <th className="px-3 py-2 text-left border-r border-slate-800/30">C (Logo)</th>
                            <th className="px-3 py-2 text-left border-r border-slate-800/30">D (Link)</th>
                            <th className="px-3 py-2 text-left border-r border-slate-800/30">E (Network)</th>
                            <th className="px-3 py-2 text-left">F (Status)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 text-slate-300 font-mono">
                          <tr className="bg-cyan-950/5">
                            <td className="px-3 py-2 font-bold text-slate-500 border-r border-slate-800/30">1 (Header)</td>
                            <td className="px-3 py-2 font-bold text-emerald-400 border-r border-slate-800/30">ID</td>
                            <td className="px-3 py-2 font-bold text-emerald-400 border-r border-slate-800/30">Name</td>
                            <td className="px-3 py-2 font-bold text-emerald-400 border-r border-slate-800/30">Logo</td>
                            <td className="px-3 py-2 font-bold text-emerald-400 border-r border-slate-800/30">Link</td>
                            <td className="px-3 py-2 font-bold text-emerald-400 border-r border-slate-800/30">Network</td>
                            <td className="px-3 py-2 font-bold text-emerald-400">Status</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-slate-500 border-r border-slate-800/30">2</td>
                            <td className="px-3 py-2 text-slate-400 border-r border-slate-800/30">watch_01</td>
                            <td className="px-3 py-2 font-sans border-r border-slate-800/30">জিটিভি লাইভ (GTV Live)</td>
                            <td className="px-3 py-2 border-r border-slate-800/30">📺</td>
                            <td className="px-3 py-2 border-r border-slate-800/30 text-sky-400 truncate max-w-[120px]">https://example.com/gtv</td>
                            <td className="px-3 py-2 text-amber-400 border-r border-slate-800/30">monetag</td>
                            <td className="px-3 py-2 text-emerald-400 font-bold">active</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-slate-500 border-r border-slate-800/30">3</td>
                            <td className="px-3 py-2 text-slate-400 border-r border-slate-800/30">watch_02</td>
                            <td className="px-3 py-2 font-sans border-r border-slate-800/30">টি স্পোর্টস HD</td>
                            <td className="px-3 py-2 border-r border-slate-800/30">🎥</td>
                            <td className="px-3 py-2 border-r border-slate-800/30 text-sky-400 truncate max-w-[120px]">https://example.com/tsports</td>
                            <td className="px-3 py-2 text-cyan-400 border-r border-slate-800/30">startapp</td>
                            <td className="px-3 py-2 text-emerald-400 font-bold">active</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </li>
                  <li>শিটটিতে আপনার সকল ডাটা ইনপুট দেওয়া শেষ হলে, ডানদিকের <b>“Share (শেয়ার)”</b> বাটনে ক্লিক করুন।</li>
                  <li>জেনারেল এক্সেস (General access) অপশনটি <code>Restricted</code> থেকে পরিবর্তন করে অবশ্যই <b>“Anyone with the link can view (লিংক থাকা যে কেউ দেখতে পারবে)”</b> করে দিন।</li>
                  <li>এবার আপনার ব্রাউজারের অ্যাড্রেস বার থেকে স্প্রেডশিট আইডিটি কপি করে নিচের বক্সে পেস্ট করে বাটনে চাপুন। স্প্রেডশিট লিংক থেকে আইডিটি চেনার উপায়:
                    <span className="block text-[10px] select-all bg-slate-900 border border-slate-800/40 p-2 rounded-lg font-mono text-cyan-400 mt-2 leading-relaxed">
                      https://docs.google.com/spreadsheets/d/<span className="text-amber-400 underline font-bold font-sans px-1">1Bxxxx_ spreadsheet-id _xxx</span>/edit#gid=0
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

              {/* Custom branding and textual properties customization */}
              <div className="pt-5 border-t border-slate-800 space-y-4">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">অ্যাপের নাম ও কাস্টম টেক্সট সেটিংস (Branding & Layout Texts)</span>
                
                <div className="flex items-center justify-between p-3.5 bg-slate-900 rounded-2xl border border-slate-800/80">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-200">ব্যাক বাটনে বিজ্ঞাপন (Return Ad On Back Button)</span>
                    <p className="text-[10px] text-slate-500">ভিডিও লিঙ্ক ব্রাউজার এর ব্যক বাটনে ক্লিক করে হোমপেজে ফেরার সময় বিজ্ঞাপন দেখাবে কিনা তা নিয়ন্ত্রণ করুন।</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      const current = localConfig.backButtonAdTrigger !== false;
                      setLocalConfig({
                        ...localConfig,
                        backButtonAdTrigger: !current
                      });
                    }}
                    className={`w-12 h-6 flex items-center rounded-all p-1 duration-300 cursor-pointer rounded-full ${
                      localConfig.backButtonAdTrigger !== false ? "bg-cyan-500 justify-end" : "bg-slate-800 justify-start"
                    }`}
                  >
                    <motion.div className="w-4 h-4 bg-white rounded-full shadow-md" layout />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">অ্যাপের নাম (App Name)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800/80 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none"
                      value={localConfig.appName || "ALL LIVE"}
                      onChange={(e) => setLocalConfig({ ...localConfig, appName: e.target.value })}
                      placeholder="যেমন: ALL LIVE"
                    />
                    <p className="text-[9px] text-slate-500">অ্যাপটির উপরে প্রদর্শিত টাইটেল নাম পরিবর্তন করুন</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">হোমপেজে ফিরুন বাটন টেক্সট (Back Button Text)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800/80 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none"
                      value={localConfig.backButtonText || "হোমপেজে ফিরুন (Ad সহ)"}
                      onChange={(e) => setLocalConfig({ ...localConfig, backButtonText: e.target.value })}
                      placeholder="যেমন: হোমপেজে ফিরুন (Ad সহ)"
                    />
                    <p className="text-[9px] text-slate-500">ইন-অ্যাপ সেফ ব্রাউজারে হোমপেজে ফেরার বাটনের লেখাটি কি হবে</p>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">বিজ্ঞাপন প্যানেল টাইটেল (Ad Section Title)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800/80 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none"
                      value={localConfig.adTitle || "আপনার সুবিধাজনক বাটন বেছে নিন"}
                      onChange={(e) => setLocalConfig({ ...localConfig, adTitle: e.target.value })}
                      placeholder="যেমন: আপনার সুবিধাজনক বাটন বেছে নিন"
                    />
                    <p className="text-[9px] text-slate-500">হোম স্ক্রিনে ওয়াচ বাটন সমূহের ঠিক উপরে থাকা টাইটেল কাস্টমাইজ করুন</p>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">বিজ্ঞাপন প্যানেল বিবরণী (Ad Section Description)</label>
                    <textarea
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-800/80 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none font-sans resize-none leading-relaxed"
                      value={localConfig.adDescription || "নিচের ওয়াচ বাটনসমূহে ক্লিক করলেই স্পন্সর বিজ্ঞাপনটি শুরু হবে। ৫ সেকেন্ড বিজ্ঞাপন দেখে ওয়েবসাইট উপভোগ করুন।"}
                      onChange={(e) => setLocalConfig({ ...localConfig, adDescription: e.target.value })}
                      placeholder="বিজ্ঞাপন দেখার নির্দেশাবলী এখানে লিখুন..."
                    />
                    <p className="text-[9px] text-slate-500">টাইটেলের নিচে থাকা ছোট বিবরণীর টেক্সট কাস্টমাইজ করুন</p>
                  </div>
                </div>
              </div>

              {/* Configuration block for custom Security Question / Answer */}
              <div className="pt-5 border-t border-slate-800 space-y-3">
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest block font-bold text-slate-300">নিরাপত্তা প্রশ্ন এবং উত্তর সেটিংস</span>
                <p className="text-[10px] text-slate-500">পিন রিকভারির জন্য একটি প্রশ্ন এবং গোপন উত্তর লিখে অল লাইভ সেটিংস সেভ করে রাখুন।</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">প্রশ্ন বিবরণ ( Bengali / English )</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-804 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none"
                      value={localConfig.securityQuestion || ""}
                      onChange={(e) => setLocalConfig({ ...localConfig, securityQuestion: e.target.value })}
                      placeholder="যেমন: আপনার প্রিয় রঙের নাম কী?"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">গোপন সঠিক উত্তর</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-804 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none"
                      value={localConfig.securityAnswer || ""}
                      onChange={(e) => setLocalConfig({ ...localConfig, securityAnswer: e.target.value })}
                      placeholder="যেমন: নীল"
                    />
                  </div>
                </div>

                {/* Primary & Secondary Security PINs settings */}
                <div className="pt-3 border-t border-slate-800/50 space-y-3">
                  <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest block font-bold text-slate-350">নিরাপত্তা পিন কোড সেটিংস (ADMIN PIN CODES)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">প্রথম পিন কোড (Primary - Step 1)</label>
                      <input
                        type="text"
                        maxLength={12}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-cyan-400 font-mono rounded-xl px-3.5 py-2.5 text-xs outline-none"
                        value={localConfig.adminCode || ""}
                        onChange={(e) => setLocalConfig({ ...localConfig, adminCode: e.target.value })}
                        placeholder="যেমন: 1234"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">দ্বিতীয় পিন কোড (Secondary - Step 2)</label>
                      <input
                        type="text"
                        maxLength={12}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-emerald-450 font-mono rounded-xl px-3.5 py-2.5 text-xs outline-none"
                        value={localConfig.adminCodeSecondary || ""}
                        onChange={(e) => setLocalConfig({ ...localConfig, adminCodeSecondary: e.target.value })}
                        placeholder="যেমন: 5678"
                      />
                    </div>
                  </div>
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

        {/* TAB 5: Premium Downloads Portal */}
        {activeTab === "premium" && (
          <div className="space-y-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 animate-fadeIn">
              <h3 className="text-sm font-bold text-gray-200 border-b border-slate-800/60 pb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>প্রিমিয়াম লাইব্রেরিতে নতুন আপলোড যুক্ত করুন</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">আইটেমের নাম/টাইটেল</label>
                  <input
                    type="text"
                    placeholder="যেমন: Kinemaster Pro APK 2026"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none"
                    value={newPremName}
                    onChange={(e) => setNewPremName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">ডাউনলোড বা অ্যাক্সেস লিঙ্ক</label>
                  <input
                    type="text"
                    placeholder="যেমন: https://drive.google.com/..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none"
                    value={newPremUrl}
                    onChange={(e) => setNewPremUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">ক্যাটাগরি নির্ধারণ করুন</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3 py-2.5 text-xs outline-none"
                    value={newPremCategory}
                    onChange={(e) => setNewPremCategory(e.target.value as any)}
                  >
                    <option value="apk">Premium APK (অ্যাপস)</option>
                    <option value="course">Premium course (কোর্স)</option>
                    <option value="book">Premium book (বই/PDF)</option>
                    <option value="movie">New Premium movie (মুভি)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">বাটন টেক্সট (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    placeholder="যেমন: Download Now / Watch Full Movie"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none"
                    value={newPremBtnText}
                    onChange={(e) => setNewPremBtnText(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={handleAddPremiumItem}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-slate-950 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg mt-2"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>প্রিমিয়াম আইটেম যুক্ত করুন (Add to Premium Section)</span>
              </button>
            </div>

            {/* List existing premium files */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">বর্তমানে আপলোড করা প্রিমিয়াম তালিকা</h3>
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 divide-y divide-slate-800/80">
                {(!localConfig.premiumItems || localConfig.premiumItems.length === 0) ? (
                  <p className="p-8 text-center text-xs text-slate-500">প্রিমিয়াম জোনে এখনও কোনো ফাইল বা কোর্স রাখা হয়নি।</p>
                ) : (
                  localConfig.premiumItems.map((item) => (
                    <div key={item.id} className="p-4 bg-slate-950 hover:bg-slate-900/10 flex items-center justify-between gap-4 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-gray-150">{item.name}</h4>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold uppercase tracking-wider">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono select-all truncate max-w-md">{item.link}</p>
                      </div>

                      <button
                        onClick={() => handleDeletePremiumItem(item.id)}
                        className="p-2 bg-slate-905 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/35 rounded-xl cursor-pointer transition-all"
                        title="প্রিমিয়াম ফাইলটি মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Feedbacks and Requests Panel */}
        {activeTab === "feedbacks" && (
          <div className="space-y-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-gray-200 border-b border-slate-800/60 pb-3 flex items-center gap-2 animate-fadeIn">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                <span>ইউজারদের অনুরোধ, মতামত ও ফিডব্যাকসমূহ ({config.feedbacks?.length || 0})</span>
              </h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                মোবাইল ওয়েব অ্যাপ থেকে সরাসরি ব্যবহারকারীরা MD Hasan Khalifa-র নিকট যেসকল মতামত, সমস্যা বা নতুন বাটন/বিজ্ঞাপন চালুর অনুরোধ জমা দিয়েছেন, তার তালিকা নিচে দেওয়া হলো।
              </p>
            </div>

            <div className="space-y-3.5">
              {(!localConfig.feedbacks || localConfig.feedbacks.length === 0) ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-500">
                  এখনও কোনো মতামত বা অনুরোধ জমা পড়েনি।
                </div>
              ) : (
                localConfig.feedbacks.map((fb) => (
                  <div key={fb.id} className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-slate-700/50 transition-all">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-cyan-950/40 text-cyan-400 flex items-center justify-center font-bold text-xs uppercase font-sans border border-cyan-900/30">
                          {fb.userName ? fb.userName.charAt(0) : "U"}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-gray-200 font-sans">{fb.userName || "অজ্ঞাত ব্যবহারকারী"}</span>
                          <span className="text-[9px] text-slate-500 font-mono tracking-wider block">
                            {fb.submittedAt ? new Date(fb.submittedAt).toLocaleString("bn-BD") : "অজানা সময়"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteFeedback(fb.id)}
                        className="p-2 bg-slate-905 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/35 rounded-xl cursor-pointer transition-all"
                        title="মতামতটি মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/40">
                      <p className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
                        {fb.userComment}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 7: Developer Settings & Sheet automation */}
        {activeTab === "developer" && (
          <div className="space-y-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-gray-200 border-b border-slate-800/60 pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                <span>ডেভেলপার প্রোফাইল সেটিংস</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">নাম (Developer Name)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none"
                    value={devName}
                    onChange={(e) => setDevName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">পদবি/ছোট বিবরণ (Subtitle)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none"
                    value={devSubTitle}
                    onChange={(e) => setDevSubTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">হোয়াটসঅ্যাপ নাম্বার (WhatsApp Number)</label>
                  <input
                    type="text"
                    placeholder="যেমন: 8801798088609"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none"
                    value={devWhatsapp}
                    onChange={(e) => setDevWhatsapp(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">ফেসবুক প্রোফাইল লিঙ্ক (Facebook Profile URL)</label>
                  <input
                    type="text"
                    placeholder="যেমন: https://facebook.com/..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none"
                    value={devFacebook}
                    onChange={(e) => setDevFacebook(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">অ্যাভাটার শর্ট কোড / আদ্যক্ষর (Initials)</label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="যেমন: HK"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs uppercase outline-none font-sans"
                    value={devAvatarInitials}
                    onChange={(e) => setDevAvatarInitials(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-mono">আমার বিবরণী / সংক্ষিপ্ত পরিচিতি (Biography Text)</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none font-sans leading-relaxed"
                  value={devDescription}
                  onChange={(e) => setDevDescription(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveDeveloperAndSheetDetails}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-all"
                >
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>ডেভেলপার প্রোফাইল সংরক্ষণ করুন (Save Developer Info)</span>
                </button>
              </div>
            </div>

            {/* Google Sheets Feedback Webhook Setup block */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-gray-200 border-b border-slate-800/60 pb-3 flex items-center gap-2">
                <Sheet className="w-5 h-5 text-emerald-400" />
                <span>মতামত ও অনুরোধ সরাসরি গুগল শিটে জমার সেটিংস (Direct Sheet Integration)</span>
              </h3>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-mono">গুগল স্ক্রিপ্ট ওয়েব অ্যাপ ইউআরএল (Google Web App URL)</label>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/xxxx/exec"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none"
                  value={feedbackSheetUrlInput}
                  onChange={(e) => setFeedbackSheetUrlInput(e.target.value)}
                />
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans mt-1">
                  এখানে গুগোল স্ক্রিপ্ট ওয়েব অ্যাপ ইউআরএল সেট করলে ইউজাররা "অনুরোধ ও পরামর্শ কেন্দ্র" থেকে সাবমিট করার সাথে সাথে তা অটোমেটিক আপনার গুগল স্প্রেডশিটে যুক্ত হবে।
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveDeveloperAndSheetDetails}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-all"
                >
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>ওয়েবহুক ইউআরএল সংরক্ষণ করুন (Save Webhook URL)</span>
                </button>
              </div>

              {/* Step by step manual setup code provider */}
              <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>💡 এটি কিভাবে সেটাপ করবেন? (How to Setup Web App Tutorial)</span>
                </h4>
                <ol className="text-[11px] text-slate-400 list-decimal pl-4 space-y-2 leading-relaxed">
                  <li>আপনার পছন্দের যেকোনো <b>Google Spreadsheet</b> ওপেন করুন।</li>
                  <li>শিটের প্রথম লাইনে কলাম হেডার হিসেবে লিখুন: কলাম A-তে <code>Name</code>, কলাম B-তে <code>Comment</code>, এবং কলাম C-তে <code>Timestamp</code>।</li>
                  <li>স্প্রেডশিটের উপর মেনু থেকে <b>Extensions &gt; Apps Script</b> এ ক্লিক করুন।</li>
                  <li>সেখানে থাকা সব কোড মুছে নিচের স্ক্রিপ্টটি কপি করে পেস্ট করুন:</li>
                </ol>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 overflow-x-auto text-[10px] font-mono text-cyan-400 leading-normal max-h-[180px] dark-scrollbar select-all">
                  <pre>{`function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      data.userName,
      data.userComment,
      new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
    ]);
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch(err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}`}</pre>
                </div>

                <ol className="text-[11px] text-slate-400 list-decimal pl-4 space-y-2 leading-relaxed" start={5}>
                  <li>স্ক্রিপ্টটি রি-নেম করে সেভ করুন। এরপর ডানদিকের উপরের <b>Deploy &gt; New deployment</b> বাটনে ক্লিক করুন।</li>
                  <li>Select type থেকে <b>Web app</b> সিলেক্ট করুন।</li>
                  <li><b>Execute as:</b> এ <code>Me (your-email)</code> রাখুন এবং <b>Who has access:</b> এ অবশ্যই <code>Anyone</code> সিলেক্ট করুন।</li>
                  <li><b>Deploy</b> এ প্রেস করুন, গুগল পারমিশন চাইলে Access মঞ্জুর করুন।</li>
                  <li>ডিপ্লয় সম্পূর্ণ হলে যে <b>Web app URL</b> টি পাবেন, তা কপি করে এনে উপরের ইনপুট বক্সে জমা দিন এবং সেভ করুন!</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: Donations & Ad-Free Subscription approvals */}
        {activeTab === "donations" && (
          <div className="space-y-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-gray-200 border-b border-slate-800/60 pb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" />
                <span>ডোনেশন পেমেন্ট গেটওয়ে সেটিংস</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">বিকাশ পার্সোনাল নাম্বার (bKash)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none"
                    value={bkashNumInput}
                    onChange={(e) => setBkashNumInput(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">নগদ পার্সোনাল নাম্বার (Nagad)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none"
                    value={nagadNumInput}
                    onChange={(e) => setNagadNumInput(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">রকেট পার্সোনাল নাম্বার (Rocket)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none"
                    value={rocketNumInput}
                    onChange={(e) => setRocketNumInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSavePaymentNumbers}
                  className="w-full bg-pink-500 hover:bg-pink-400 text-slate-950 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-all"
                >
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>পেমেন্ট গেটওয়ে নাম্বারসমূহ আপডেট করুন</span>
                </button>
              </div>
            </div>

            {/* Donor / Ad-Free Activated Keys Management list */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/60 pb-3 gap-2">
                <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <span>বিজ্ঞাপন মুক্ত মেম্বার ও ডোনার তালিকা</span>
                </h3>
                <span className="text-[10px] bg-indigo-950 border border-indigo-850 text-indigo-400 font-mono px-2.5 py-1 rounded-full font-bold self-start">
                  মোট অ্যাক্টিভেটেড মেম্বার: {(localConfig.adFreeUsers || []).length}
                </span>
              </div>

              <div className="space-y-3.5">
                {!(localConfig.adFreeUsers && localConfig.adFreeUsers.length > 0) ? (
                  <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800/60 text-slate-500 text-xs font-sans">
                    এখনো কোনো ইউজার বিজ্ঞাপন মুক্ত হতে বা সাহায্য করতে ডোনেট করেননি।
                  </div>
                ) : (
                  (localConfig.adFreeUsers || []).map((user) => (
                    <div 
                      key={user.activationKey} 
                      className={`p-4 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all ${
                        user.status === "approved" 
                          ? "bg-slate-900/60 border-slate-800" 
                          : "bg-amber-950/20 border-amber-950/80"
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-100 font-sans">{user.userName}</span>
                          {user.status === "approved" ? (
                            <span className="text-[9px] bg-emerald-950/70 border border-emerald-550/40 text-emerald-400 font-bold px-2 py-0.5 rounded-full font-sans">
                              অনুমোদিত বিজ্ঞাপন মুক্ত
                            </span>
                          ) : (
                            <span className="text-[9px] bg-amber-950/70 border border-amber-550/40 text-amber-400 font-bold px-2 py-0.5 rounded-full font-sans animate-pulse">
                              পেন্ডিং ডোনেশন রিভিউ
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:flex md:items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400 font-mono flex-wrap">
                          <div>
                            <span className="text-slate-500">মেথড / ট্রানজেকশন ID:</span>{" "}
                            <span className="text-slate-200 font-bold font-sans">{user.senderId}</span>
                          </div>
                          <div className="md:border-l md:border-slate-800 md:pl-4">
                            <span className="text-slate-500">টাকার অংক:</span>{" "}
                            <span className="text-pink-400 font-bold">{user.amount} Taka</span>
                          </div>
                          <div className="md:border-l md:border-slate-800 md:pl-4">
                            <span className="text-slate-500">মেয়াদ:</span>{" "}
                            <span className="text-cyan-400 font-bold bg-slate-900 border border-slate-800/80 px-1.5 py-0.5 rounded">
                              {user.duration === "1day" ? "১ দিন" : user.duration === "1month" ? "১ মাস" : user.duration === "1year" ? "১ বছর" : "স্থায়ী"}
                            </span>
                            {user.expiryDate && user.expiryDate !== "permanent" && (
                              <span className="block text-[9px] text-slate-500 mt-1 font-mono">
                                (মেয়াদ শেষ: {new Date(user.expiryDate).toLocaleString("bn-BD")})
                              </span>
                            )}
                          </div>
                          <div className="col-span-2 md:border-l md:border-slate-800 md:pl-4 mt-0.5">
                            <span className="text-slate-500">লাইসেন্স কি (Activation Key):</span>{" "}
                            <code className="text-cyan-400 bg-slate-950 px-1.5 py-0.5 rounded font-bold select-all">{user.activationKey}</code>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 mt-2 lg:mt-0 flex-wrap shrink-0">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">মেয়াদ পরিবর্তন:</span>
                          <select
                            className="bg-slate-900 text-slate-200 border border-slate-800 text-[11px] rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-500 font-sans cursor-pointer"
                            value={user.duration || "permanent"}
                            onChange={(e) => handleUpdateUserDuration(user.activationKey, e.target.value as any)}
                          >
                            <option value="1day">১ দিন (1 Day)</option>
                            <option value="1month">১ মাস (1 Month)</option>
                            <option value="1year">১ বছর (1 Year)</option>
                            <option value="permanent">স্থায়ী (Permanent)</option>
                            <option value="expired">বাতিল/মেয়াদ উত্তীর্ণ</option>
                          </select>
                        </div>

                        {user.status === "pending" && (
                          <div className="flex flex-col gap-1 self-end">
                            <button
                              onClick={() => handleApproveKey(user.activationKey)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold px-3.5 py-2 rounded-lg cursor-pointer transition-all hover:scale-[1.03] active:scale-95"
                            >
                              অনুমোদন দিন
                            </button>
                          </div>
                        )}
                        <div className="flex flex-col gap-1 self-end">
                          <button
                            onClick={() => handleRevokeKey(user.activationKey)}
                            className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-all"
                          >
                            ডিলেট / বাতিল করুন
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: Global Double-PIN Security control Tab */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-gray-200 border-b border-slate-800/60 pb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-yellow-400" />
                <span>ডাবল প্রটেকশন সিকিউরিটি সেটিংস (Double PIN Control)</span>
              </h3>

              <div className="bg-cyan-950/20 border border-cyan-500/25 p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  🛡️ পিন নিরাপত্তা সিস্টেম সম্পর্কে জানুন
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  ১ম এডমিন পিন কোড দেওয়ার পর ২য় নিরাপত্তা পিন কোড সঠিকভাবে দিলে তবেই কেবলমাত্র অ্যাডমিন প্যানেলে প্রবেশ করা যাবে। ১ম পিনটি পরিবর্তন করলে আপনার পূর্ববর্তী ডিফল্ট ১ম পিন <b>1234</b> বাতিল হয়ে যাবে। ২য় পিন সেট করলে সিকিউরিটি ডাবল স্তর হয়ে উঠবে।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">১ম এডমিন পিন (Primary PIN)</label>
                  <input
                    type="text"
                    maxLength={12}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-cyan-400 rounded-xl px-3.5 py-2.5 text-xs font-mono tracking-widest outline-none"
                    value={secPinInput1}
                    onChange={(e) => setSecPinInput1(e.target.value)}
                    placeholder="নতুন ১ম পিন বা বর্তমান পিন"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">২য় এডমিন পিন (Secondary PIN)</label>
                  <input
                    type="text"
                    maxLength={12}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 text-emerald-400 rounded-xl px-3.5 py-2.5 text-xs font-mono tracking-widest outline-none"
                    value={secPinInput2}
                    onChange={(e) => setSecPinInput2(e.target.value)}
                    placeholder="২য় নিরাপত্তা পিন দিন"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">পিন রিকভারি সুরক্ষার প্রশ্ন (Security Question)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none font-sans"
                    value={securityQInput}
                    onChange={(e) => setSecurityQInput(e.target.value)}
                    placeholder="যেমন: আপনার প্রিয় রঙের নাম কী?"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-mono font-bold">প্রশ্নের সঠিক উত্তর (Security Answer)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none font-sans"
                    value={securityAInput}
                    onChange={(e) => setSecurityAInput(e.target.value)}
                    placeholder="যেমন: নীল"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveSecuritySettings(secPinInput1, secPinInput2, securityQInput, securityAInput)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>নিরাপত্তা পিন ও প্রশ্ন সংরক্ষণ করুন (Save Security settings)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: User Analytics Dashboard Tab */}
        {activeTab === ("users" as any) && (
          <div className="space-y-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/60 pb-4 gap-3">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-gray-200">ইউজার অ্যানালাইসিস ও ভিজিটর ট্র্যাক (User Analytics)</h3>
                </div>
                <div className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-400">
                  মোট রেজিস্টার্ড ইউজার: <span className="text-cyan-400 font-bold font-mono">{(localConfig.users || []).length}</span> জন
                </div>
              </div>

              <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950 divide-y divide-slate-800/80">
                {(!localConfig.users || localConfig.users.length === 0) ? (
                  <p className="p-12 text-center text-xs text-slate-500">কোনো ইউজার ডাটা পাওয়া যায়নি। ইউজাররা অ্যাপে প্রবেশ করলে অটোমেটিকলি এখানে যুক্ত হবে।</p>
                ) : (
                  [...(localConfig.users || [])]
                    .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
                    .map((user) => (
                      <div key={user.id} className="p-4 hover:bg-slate-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-gray-200 font-mono">{user.username}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 font-mono">
                              ID: {user.id}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-cyan-950/40 text-cyan-400 border border-cyan-900/30 font-mono">
                              {user.visitCount} বার প্রবেশ করেছে
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-1 text-[10px] text-slate-400">
                            <p className="flex items-center gap-1">
                              <span className="text-slate-500 uppercase font-mono text-[9px]">প্রথম সেশন:</span> 
                              <span>{new Date(user.createdAt).toLocaleString("bn-BD")}</span>
                            </p>
                            <p className="flex items-center gap-1">
                              <span className="text-slate-500 uppercase font-mono text-[9px]">শেষ একটিভ:</span> 
                              <span className="text-cyan-400 font-semibold">{new Date(user.lastActive).toLocaleString("bn-BD")}</span>
                            </p>
                            {user.deviceInfo && (
                              <p className="text-slate-500 font-mono text-[9px] leading-relaxed truncate max-w-lg" title={user.deviceInfo}>
                                Device: {user.deviceInfo}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-900/30 bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 cursor-pointer transition-all flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ডিলিট করুন</span>
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

      {/* Edit Button Modal Popup overlay */}
      {editingButton && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Settings className="w-4 h-4 text-cyan-400" />
                বাটন সেটিংস এডিট করুন
              </h3>
              <button 
                onClick={() => setEditingButton(null)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-mono font-bold">বাটনের নাম</label>
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3 py-2 text-xs outline-none"
                  value={editingButton.name}
                  onChange={(e) => setEditingButton({ ...editingButton, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-mono font-bold">আইকন/ইমোজি</label>
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3 py-2 text-xs outline-none text-center"
                  value={editingButton.logo}
                  onChange={(e) => setEditingButton({ ...editingButton, logo: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-mono font-bold">ওয়েবসাইট লিংক URL (বা লাইভ IPTV লিংক)</label>
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3 py-2 text-xs outline-none"
                  value={editingButton.link}
                  onChange={(e) => setEditingButton({ ...editingButton, link: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono font-bold">অ্যাড নেটওয়ার্ক</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3 py-2 text-xs outline-none"
                    value={editingButton.network}
                    onChange={(e) => setEditingButton({ ...editingButton, network: e.target.value as any })}
                  >
                    <option value="startapp">StartApp Only</option>
                    <option value="monetag">Monetag Only</option>
                    <option value="both">Both (Random)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono font-bold">অবস্থা</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3 py-2 text-xs outline-none"
                    value={editingButton.status}
                    onChange={(e) => setEditingButton({ ...editingButton, status: e.target.value as any })}
                  >
                    <option value="active">Active (সবুজ)</option>
                    <option value="inactive">Inactive (বন্ধ)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-mono font-bold">বিজ্ঞাপন দেখাবে?</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3 py-2 text-xs outline-none"
                  value={editingButton.adsEnabled !== false ? "yes" : "no"}
                  onChange={(e) => setEditingButton({ ...editingButton, adsEnabled: e.target.value === "yes" })}
                >
                  <option value="yes">বিজ্ঞাপন চালু (Ad ON)</option>
                  <option value="no">বিজ্ঞাপন বন্ধ (Ad OFF)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingButton(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                onClick={handleSaveEditedButton}
                className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-2 rounded-xl text-xs cursor-pointer"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

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
