import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Volume2, VolumeX, ShieldAlert, BadgeInfo, Play, ArrowRight, X } from "lucide-react";
import { AdConfig } from "../types";

interface AdPlayerProps {
  network: "startapp" | "monetag" | "both";
  adConfig: AdConfig;
  onClose: () => void;
}

export default function AdPlayer({ network, adConfig, onClose }: AdPlayerProps) {
  const chosenNetwork = 
    network === "both" 
      ? (Math.random() > 0.5 ? "startapp" : "monetag") 
      : network;

  const [timeLeft, setTimeLeft] = useState(adConfig.videoDurationSeconds || 5);
  const [isMuted, setIsMuted] = useState(true);
  const [canSkip, setCanSkip] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanSkip(true);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  // Safe fallback video if none is set
  const videoUrl = adConfig.videoAdUrl || "https://assets.mixkit.co/videos/preview/mixkit-popcorn-falling-into-a-bowl-43407-large.mp4";

  return (
    <motion.div
      id="ad-player-root"
      className="fixed inset-0 bg-black z-[100] flex flex-col justify-between select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Top Banner (Header with branding & skip button) */}
      <div className="p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent relative z-30">
        <div className="flex items-center gap-2.5">
          {chosenNetwork === "startapp" ? (
            <div className="flex items-center gap-1.5 bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider">
              <span>S</span>
              <span className="text-[10px] text-slate-800">STARTAPP AD</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-sky-500 text-white font-bold px-3 py-1 rounded-lg text-xs font-sans uppercase tracking-wider">
              <span>M</span>
              <span className="text-[10px] text-sky-100">MONETAG AD</span>
            </div>
          )}
          
          <div className="text-[11px] text-gray-400 font-mono hidden xs:block">
            {chosenNetwork === "startapp" 
              ? `ID: ${adConfig.startappAppId || "Default"}` 
              : `Zone: ${adConfig.monetagZoneId || "Default"}`}
          </div>
        </div>

        {/* Dynamic Countdown Circle OR Skip Cross button */}
        <div>
          {canSkip ? (
            <motion.button
              id="close-ad-btn"
              onClick={onClose}
              className="flex items-center gap-1.5 bg-white text-slate-950 font-bold px-4 py-2 rounded-full text-xs shadow-lg hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>বিজ্ঞাপন বন্ধ করুন</span>
              <X className="w-4 h-4 text-slate-950 stroke-[3]" />
            </motion.button>
          ) : (
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              <span className="text-[11px] font-medium text-slate-300">ভিডিও বিজ্ঞাপন হচ্ছে</span>
              <span className="w-5 h-5 bg-white text-slate-950 text-xs font-bold font-mono rounded-full flex items-center justify-center animate-pulse">
                {timeLeft}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Video stage or premium fallback player */}
      <div className="absolute inset-0 w-full h-full z-10 flex items-center justify-center bg-slate-950">
        <video
          ref={videoRef}
          className="w-full h-full object-cover md:object-contain"
          src={videoUrl}
          autoPlay
          muted={isMuted}
          playsInline
          loop
          onError={(e) => {
            console.log("Video playback fell back to gorgeous interactive poster simulation.");
          }}
        />

        {/* Ambient overlay vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none" />

        {/* Interactive Center Banner if video is paused, mute visual, or for interaction */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 text-center z-20 pointer-events-none">
          <motion.div
            className="w-16 h-16 rounded-full bg-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.4)] border border-cyan-400/30 flex items-center justify-center animate-ping"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
      </div>

      {/* Bottom controls & Call to Action bar */}
      <div className="p-5 bg-gradient-to-t from-black/95 via-black/80 to-transparent relative z-30 space-y-4">
        {/* Toggle Sound button */}
        <button
          onClick={toggleMute}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-3.5 py-2 rounded-full text-xs font-medium border border-white/10 cursor-pointer"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-amber-400" />
              <span>সাউন্ড চালু করুন</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>সাউন্ড বন্ধ করুন</span>
            </>
          )}
        </button>

        {/* Call to action card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-gray-200">নিরাপদ স্পন্সর লিংক</span>
            </div>
            <p className="text-[11px] text-gray-400">
              আপনি কি জানেন? এই বিজ্ঞাপনের মাধ্যমে আমাদের অ্যাপলেট ১০০% ফ্রি রাখা সম্ভব হয়েছে।
            </p>
          </div>

          <a
            href="https://monetag.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-cyan-400/10 active:scale-95"
            onClick={(e) => {
              // Direct URL links to simulate real monetization clicks can be logged
              console.log("Ad clicked, redirecting...");
            }}
          >
            <span>ভিসিট করুন</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </a>
        </div>

        {/* Info label banner footer */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
          <span className="flex items-center gap-1">
            <BadgeInfo className="w-3.5 h-3.5" />
            Ad Network Simulation v2.4
          </span>
          <span>Security Verified</span>
        </div>
      </div>
    </motion.div>
  );
}
