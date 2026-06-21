import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Info, CheckCircle, AlertTriangle, MessageSquare, X } from "lucide-react";
import { NotificationItem } from "../types";

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onDismissOne?: (id: string) => void;
}

export default function NotificationCenter({ notifications, onDismissOne }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeNotifications = notifications.filter(n => n.active);

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case "alert": return <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />;
      default: return <Info className="w-5 h-5 text-sky-400 shrink-0" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "success": return "border-emerald-500/20 bg-emerald-950/25";
      case "warning": return "border-amber-500/20 bg-amber-950/25";
      case "alert": return "border-rose-500/20 bg-rose-950/25";
      default: return "border-sky-500/20 bg-sky-950/25";
    }
  };

  return (
    <div id="notif-center-wrapper" className="relative">
      {/* Red Bell Badge icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer transition-all active:scale-95"
        title="ঘোষণা এবং নোটিফিকেশন"
      >
        <Bell className="w-5 h-5" />
        {activeNotifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5.5 h-5.5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce border border-slate-950">
            {activeNotifications.length}
          </span>
        )}
      </button>

      {/* Slide-out notifications history board drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click interceptor */}
            <div 
              className="fixed inset-0 bg-black/60 z-30" 
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              id="notif-drawer-board"
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-slate-950 border-l border-slate-800 shadow-2xl z-40 flex flex-col p-5 overflow-hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 220 }}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-gray-100">ঘোষণা এবং নতুন আপডেট</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* List space */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                {activeNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-12 gap-3 opacity-60">
                    <MessageSquare className="w-12 h-12 text-slate-700" />
                    <p className="text-xs text-slate-400 font-sans">
                      বর্তমানে কোনো নোটিফিকেশন বা নতুন সংবাদ নেই।
                    </p>
                  </div>
                ) : (
                  activeNotifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      className={`p-4 rounded-2xl border flex gap-3 ${getBorderColor(notif.type)} relative group`}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      {getIcon(notif.type)}
                      <div className="space-y-1 pr-4">
                        <h4 className="text-xs font-bold text-gray-100 font-sans">
                          {notif.title}
                        </h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                          {notif.message}
                        </p>
                        <span className="block text-[9px] font-mono text-slate-500 pt-1">
                          {new Date(notif.sentAt).toLocaleString("bn-BD", { hour12: true })}
                        </span>
                      </div>

                      {onDismissOne && (
                        <button
                          onClick={() => onDismissOne(notif.id)}
                          className="absolute right-2.5 top-2.5 p-1 text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs"
                          title="ঠিক আছে"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </motion.div>
                  ))
                )}
              </div>

              {/* Bottom stats overview label */}
              <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 font-sans flex justify-between select-none">
                <span>এক্টিভ নোটিফিকেশন: {activeNotifications.length} টি</span>
                <span>All Live Portal Updates</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
