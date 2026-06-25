import React, { useState, useEffect, useRef } from "react";
import Hls from "hls.js";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RefreshCw, 
  Tv, 
  AlertTriangle, 
  Settings, 
  Tv2,
  Info
} from "lucide-react";

interface IPTVPlayerProps {
  url: string;
  title: string;
  onExit: () => void;
  key?: any;
}

type AspectRatio = "contain" | "cover" | "fill";

export default function IPTVPlayer({ url, title }: IPTVPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1); // 0 to 1
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("contain");
  const [isBuffering, setIsBuffering] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [streamInfo, setStreamInfo] = useState<{
    resolution?: string;
    bitrate?: string;
    engine?: string;
  }>({});

  // Control panel visibility
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep track of active URL changes to re-initialize player
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset States
    setIsBuffering(true);
    setErrorMsg(null);
    setStreamInfo({});

    // Destroy previous HLS instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Auto-mute initially to allow seamless autoplay in modern browsers
    video.muted = isMuted;
    video.volume = volume;

    // Try starting Hls stream
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 10,
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setIsBuffering(false);
        video.play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.log("Autoplay blocked or required user gesture:", err);
            setIsPlaying(false);
          });
        
        // Populate level info if available
        if (data.levels && data.levels.length > 0) {
          const currentLevel = data.levels[0];
          setStreamInfo({
            resolution: `${currentLevel.width}x${currentLevel.height}`,
            bitrate: `${Math.round(currentLevel.bitrate / 1000)} kbps`,
            engine: "Hls.js (Engine Powered)",
          });
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        if (hls.levels && hls.levels[data.level]) {
          const lvl = hls.levels[data.level];
          setStreamInfo(prev => ({
            ...prev,
            resolution: `${lvl.width}x${lvl.height}`,
            bitrate: `${Math.round(lvl.bitrate / 1000)} kbps`,
          }));
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.warn("HLS.js warning or error:", data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setErrorMsg("নেটওয়ার্ক ত্রুটি! সার্ভার থেকে ডাটা লোড করা যাচ্ছে না। পুনরায় চেষ্টা করুন।");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setErrorMsg("মিডিয়া প্লেব্যাক ত্রুটি! রিকভার করার চেষ্টা করা হচ্ছে...");
              hls.recoverMediaError();
              break;
            default:
              setErrorMsg("লাইভ স্ট্রিমটি প্লে করা সম্ভব হচ্ছে না। লিংকটি সম্ভবত অফলাইন বা ইনঅ্যাক্টিভ রয়েছে।");
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native Safari support
      video.src = url;
      setStreamInfo({
        engine: "Native Browser Engine",
      });

      video.addEventListener("loadedmetadata", () => {
        setIsBuffering(false);
        video.play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.log("Native Autoplay gesture failed:", err);
            setIsPlaying(false);
          });
      });

      video.addEventListener("error", () => {
        setErrorMsg("মিডিয়া লোড ব্যর্থ হয়েছে! আপনার ব্রাউজার এই ফরম্যাট সমর্থন করে না বা স্ট্রিমটি অফলাইন।");
      });
    } else {
      setErrorMsg("আপনার ব্রাউজারে .m3u8 লাইভ স্ট্রিম প্লে করার সুবিধাটি নেই। অনুগ্রহ করে ক্রোম বা অন্য ব্রাউজার ব্যবহার করুন।");
    }

    // Set up native video event listeners for UI syncing
    const handlePlayEvent = () => setIsPlaying(true);
    const handlePauseEvent = () => setIsPlaying(false);
    const handleWaitingEvent = () => setIsBuffering(true);
    const handlePlayingEvent = () => setIsBuffering(false);
    const handleCanPlayEvent = () => setIsBuffering(false);
    const handleTimeUpdateEvent = () => {
      if (video.currentTime > 0) {
        setIsBuffering(false);
      }
    };

    video.addEventListener("play", handlePlayEvent);
    video.addEventListener("pause", handlePauseEvent);
    video.addEventListener("waiting", handleWaitingEvent);
    video.addEventListener("playing", handlePlayingEvent);
    video.addEventListener("canplay", handleCanPlayEvent);
    video.addEventListener("canplaythrough", handleCanPlayEvent);
    video.addEventListener("timeupdate", handleTimeUpdateEvent);

    return () => {
      video.removeEventListener("play", handlePlayEvent);
      video.removeEventListener("pause", handlePauseEvent);
      video.removeEventListener("waiting", handleWaitingEvent);
      video.removeEventListener("playing", handlePlayingEvent);
      video.removeEventListener("canplay", handleCanPlayEvent);
      video.removeEventListener("canplaythrough", handleCanPlayEvent);
      video.removeEventListener("timeupdate", handleTimeUpdateEvent);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url]);

  // Handle Fullscreen state change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Show / Hide controls based on user activity
  const triggerShowControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 4000);
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log(err));
    }
    triggerShowControls();
  };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    triggerShowControls();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;

    video.volume = val;
    setVolume(val);
    if (val === 0) {
      video.muted = true;
      setIsMuted(true);
    } else {
      video.muted = false;
      setIsMuted(false);
    }
    triggerShowControls();
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    triggerShowControls();
  };

  const cycleAspectRatio = () => {
    setAspectRatio((current) => {
      if (current === "contain") return "cover";
      if (current === "cover") return "fill";
      return "contain";
    });
    triggerShowControls();
  };

  const reloadStream = () => {
    const video = videoRef.current;
    if (!video) return;

    setIsBuffering(true);
    setErrorMsg(null);

    if (hlsRef.current) {
      hlsRef.current.loadSource(url);
      hlsRef.current.startLoad();
    } else {
      video.src = url;
      video.load();
    }
    triggerShowControls();
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={triggerShowControls}
      onClick={triggerShowControls}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden group select-none"
    >
      {/* Video Tag */}
      <video
        ref={videoRef}
        playsInline
        webkit-playsinline="true"
        className="w-full h-full transition-all duration-300"
        style={{
          objectFit: aspectRatio,
        }}
        onClick={(e) => {
          e.stopPropagation();
          handlePlayPause();
        }}
      />

      {/* Buffering Loading Overlay */}
      <AnimatePresence>
        {isBuffering && !errorMsg && (
          <motion.div 
            className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative flex items-center justify-center">
              <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
              <Tv2 className="w-5 h-5 text-indigo-400 absolute animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-gray-200 tracking-wide font-sans block">লাইভ বাফারিং হচ্ছে...</span>
              <span className="text-[10px] text-slate-400 font-mono block">Loading Live Feed IPTV</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fatal Error State Overlay */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4 text-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-12 h-12 bg-rose-500/10 rounded-full border border-rose-500/25 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            
            <div className="space-y-1 max-w-sm">
              <h4 className="text-sm font-bold text-gray-100 font-sans">
                আইপিটিভি স্ট্রিম লোড ব্যর্থ
              </h4>
              <p className="text-xs text-rose-300/80 leading-relaxed font-sans">
                {errorMsg}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                reloadStream();
              }}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>পুনরায় চেষ্টা করুন</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 pt-12 flex flex-col gap-3.5 z-20"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Stream Header Info inside Controls */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 bg-red-600 text-[9px] font-black tracking-widest text-white px-2 py-0.5 rounded-md uppercase animate-pulse shrink-0 font-mono">
                    <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" />
                    LIVE
                  </span>
                  <h3 className="text-sm font-black text-white tracking-wide truncate max-w-xs font-sans">
                    {title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <Tv className="w-3 h-3 text-cyan-400" />
                  <span className="truncate max-w-[200px] text-slate-500" title={url}>{url}</span>
                </div>
              </div>

              {/* Status Info Diagnostics Badge */}
              {streamInfo.resolution && (
                <div className="flex items-center gap-2 text-[10px] font-mono bg-slate-950/80 border border-slate-800/80 px-2.5 py-1 rounded-xl text-slate-400 backdrop-blur-sm">
                  <Info className="w-3 h-3 text-cyan-400" />
                  <span>{streamInfo.resolution}</span>
                  <span className="text-slate-600">|</span>
                  <span>{streamInfo.bitrate}</span>
                </div>
              )}
            </div>

            {/* Controller row */}
            <div className="flex items-center justify-between gap-4">
              
              {/* Play / Pause & Volume controls block */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className="w-10 h-10 flex items-center justify-center bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-full cursor-pointer transition-all hover:scale-[1.05] active:scale-95"
                  title={isPlaying ? "পজ করুন" : "প্লে করুন"}
                >
                  {isPlaying ? <Pause className="w-5 h-5 stroke-[2.5]" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>

                <button
                  onClick={reloadStream}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-900/80 rounded-xl cursor-pointer transition-all"
                  title="স্ট্রিম পুনরায় লোড করুন"
                >
                  <RefreshCw className="w-4.5 h-4.5" />
                </button>

                {/* Volume bar group */}
                <div className="flex items-center gap-1.5 bg-slate-950/50 hover:bg-slate-950/90 border border-slate-850/40 rounded-xl px-2.5 py-1 transition-all">
                  <button
                    onClick={handleMuteToggle}
                    className="text-slate-300 hover:text-white cursor-pointer transition-all"
                    title={isMuted ? "শব্দ চালু করুন" : "শব্দ বন্ধ করুন"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Aspect Ratio & Fullscreen Options Block */}
              <div className="flex items-center gap-2">
                
                {/* Aspect ratio controls */}
                <button
                  onClick={cycleAspectRatio}
                  className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:border-cyan-500/50 cursor-pointer transition-all"
                  title="ভিডিও স্ক্রিন সাইজ পরিবর্তন করুন"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500 animate-spin-slow" />
                  <span className="font-mono text-[10px] uppercase">
                    {aspectRatio === "contain" ? "FIT (16:9)" : aspectRatio === "cover" ? "STRETCH" : "FILL SCREEN"}
                  </span>
                </button>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2.5 bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white rounded-xl cursor-pointer transition-all"
                  title={isFullscreen ? "ছোট করুন" : "সম্পূর্ণ স্ক্রিন করুন"}
                >
                  {isFullscreen ? <Minimize className="w-4.5 h-4.5" /> : <Maximize className="w-4.5 h-4.5" />}
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
