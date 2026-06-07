"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { useChatUnread } from "./useChatUnread";
import ChatWorkspace from "./ChatWorkspace";

export default function LiveChat() {
  const { accessToken, isLoading, role } = useAuth();
  const isStaff = role === "admin" || role === "moderator" || role === "helper";
  const loggedIn = !isLoading && !!accessToken;

  const [open, setOpen] = useState(false);
  const unread = useChatUnread(accessToken, loggedIn);

  if (!loggedIn) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999]" dir="rtl">
      {/* ─── Chat panel ─── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[72px] right-0 overflow-hidden rounded-2xl border border-white/[0.07] shadow-[0_32px_96px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.03)]"
            style={{
              width: isStaff ? "min(700px, calc(100vw - 24px))" : "min(380px, calc(100vw - 24px))",
              height: "min(560px, calc(100vh - 110px))",
            }}
          >
            <ChatWorkspace variant="floating" onRequestClose={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Floating button ─── */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="relative h-14 w-14 rounded-2xl grid place-items-center"
        style={{
          background: "linear-gradient(135deg,#6d28d9,#9333ea,#c026d3)",
          boxShadow: "0 8px 32px rgba(139,92,246,0.5), 0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        {!open && (
          <>
            <motion.span
              className="absolute inset-0 rounded-2xl"
              style={{ background: "rgba(139,92,246,0.35)" }}
              animate={{ scale: [1, 1.45, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.span
              className="absolute inset-0 rounded-2xl"
              style={{ background: "rgba(168,85,247,0.2)" }}
              animate={{ scale: [1, 1.7, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
          </>
        )}

        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0, scale: 0.6 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.6 }} transition={{ duration: 0.18 }}>
              <X className="h-6 w-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0, scale: 0.6 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: -90, opacity: 0, scale: 0.6 }} transition={{ duration: 0.18 }}>
              <MessageCircle className="h-6 w-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        <AnimatePresence>
          {!open && unread > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute -top-1.5 -left-1.5 min-w-[20px] h-5 px-1 rounded-full border-2 border-[#0A0A14] bg-red-500 grid place-items-center text-[10px] font-black text-white"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
