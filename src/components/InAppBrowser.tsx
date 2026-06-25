import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, RotateCw, ShieldCheck, ExternalLink, Globe, Smartphone, RefreshCw, Tv } from "lucide-react";
import IPTVPlayer from "./IPTVPlayer";

interface InAppBrowserProps {
  url: string;
  title: string;
  onExit: () => void; // Triggered when returning back to portal (must show ad)
  backButtonText?: string;
}

export default function InAppBrowser({ url, title, onExit, backButtonText }: InAppBrowserProps) {
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [useProxy, setUseProxy] = useState(true);

  const isM3u8 = url.toLowerCase().includes(".m3u8") || url.split("?")[0].toLowerCase().endsWith(".m3u8");

  // Detect static hosts (like Vercel) where Express server is unreachable
  useEffect(() => {
    if (isM3u8) {
      setLoading(false);
    }
    const isVercel = 
      window.location.hostname.endsWith(".vercel.app") || 
      window.location.hostname.endsWith(".github.io") || 
      window.location.hostname.endsWith(".netlify.app") ||
      window.location.hostname.endsWith(".amplifyapp.com");
    if (isVercel) {
      setUseProxy(false);
    }
  }, [isM3u8]);

  // Safely format proxy URL or fall back to direct load
  const frameUrl = useProxy ? `/api/proxy?url=${encodeURIComponent(url)}` : url;

  // Refresh / Reload action
  const handleReload = () => {
    if (!isM3u8) {
      setLoading(true);
    }
    setIframeKey((prev) => prev + 1);
  };

  return (
    <motion.div
      id="inapp-browser-root"
      className="fixed inset-0 bg-slate-900 z-40 flex flex-col overflow-hidden"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      {/* Browser Security Top Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 pt-4 px-4 flex flex-col gap-2 shadow-md relative z-10">
        
        {/* Navigation Action Line */}
        <div className="flex items-center justify-between gap-3">
          {/* Back button with custom ad popup trigger */}
          <button
            id="browser-back-btn"
            onClick={onExit}
            className="flex items-center gap-1.5 text-white bg-slate-800 hover:bg-slate-700 active:scale-95 px-3 py-1.5 rounded-xl text-xs font-semibold select-none cursor-pointer transition-all border border-slate-700/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backButtonText || "হোমপেজে ফিরুন (Ad সহ)"}</span>
          </button>

          {/* Title and Badge */}
          <div className="flex-1 text-center truncate max-w-[40%]">
            <h2 className="text-xs font-bold text-gray-200 truncate font-sans">
              {title}
            </h2>
            {isM3u8 ? (
              <p className="text-[9px] text-cyan-400 font-mono tracking-wider flex items-center justify-center gap-1 font-bold">
                <Tv className="w-3 h-3 text-cyan-500 animate-pulse" />
                IPTV STREAM LIVE
              </p>
            ) : useProxy ? (
              <p className="text-[9px] text-emerald-400 font-mono tracking-wider flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
                PROXY SECURED
              </p>
            ) : (
              <p className="text-[9px] text-cyan-400 font-mono tracking-wider flex items-center justify-center gap-1" title="Vercel বা স্ট্যাটিক হোস্টিংয়ের জন্য প্রক্সি বাইপাস করা হয়েছে">
                <Globe className="w-2.5 h-2.5 text-cyan-500 animate-spin-slow" />
                DIRECT FRAME MODE
              </p>
            )}
          </div>

          {/* Header Action tools */}
          <div className="flex items-center gap-2">
            {!isM3u8 && (
              <button
                onClick={() => {
                  setLoading(true);
                  setUseProxy(!useProxy);
                }}
                className={`p-1.5 rounded-xl text-xs active:scale-95 transition-all border cursor-pointer ${
                  useProxy 
                    ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/30" 
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/50"
                }`}
                title={useProxy ? "Direct Load মোডে পরিবর্তন করুন" : "Secure Proxy মোডে পরিবর্তন করুন"}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleReload}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl active:scale-95 transition-all text-xs border border-slate-700/50 cursor-pointer"
              title="রিফ্রেশ করুন"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 rounded-xl active:scale-95 transition-all text-xs border border-cyan-800/50 cursor-pointer inline-flex items-center justify-center"
              title="নতুন ট্যাবে খুলুন"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Browser SSL bar URL decoration */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800/80">
          <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <div className="flex-1 text-[11px] font-mono text-slate-400 select-all truncate">
            {url}
          </div>
          <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 scale-90">
            <Smartphone className="w-3 h-3 text-slate-600" />
            <span>{isM3u8 ? "IPTV DECODER" : "MOBILE"}</span>
          </div>
        </div>
      </div>

      {/* Main Web Page IFrame Stage / IPTV Player */}
      <div className={`flex-1 w-full relative ${isM3u8 ? "bg-black" : "bg-white"}`}>
        {isM3u8 ? (
          <IPTVPlayer
            key={iframeKey}
            url={url}
            title={title}
            onExit={onExit}
          />
        ) : (
          <iframe
            key={iframeKey}
            src={frameUrl}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            title="In-App Website Frame"
          />
        )}

        {/* Loading Spinner overlay */}
        <AnimatePresence>
          {loading && !isM3u8 && (
            <motion.div
              className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4 text-center px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative">
                <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
                <Globe className="w-5 h-5 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-gray-200">
                  ওয়েবসাইট সিকিউর প্রক্সিতে লোড হচ্ছে...
                </h3>
                <p className="text-xs text-slate-400 max-w-xs font-mono">
                  {title} ({new URL(url).hostname || "Loading"})
                </p>
                {!useProxy ? (
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-[11px] text-slate-300 max-w-sm space-y-1.5 text-left mx-auto">
                    <p className="text-amber-400 font-bold flex items-center gap-1">
                      📢 ভার্সেল সার্ভারলেস মুড অ্যাক্টিভ
                    </p>
                    <p className="text-slate-400 leading-normal">
                      Vercel-এ হোস্ট করার কারণে ডিরেক্ট ফ্রেম লোড করা হচ্ছে। যদি সাইটটি লোড না হয়ে সাদা স্ক্রিন আসে, দয়া করে উপরের <b>ডানদিকের আইকনে চেপে সরাসরি নতুন ট্যাবে</b> ভিডিওটি দেখুন।
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-[11px] text-amber-500 font-medium">
                    ⚠️ সাইট লোড হতে কিছু সময় লাগলে “নতুন ট্যাবে খুলুন” বাটন চাপুন।
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
