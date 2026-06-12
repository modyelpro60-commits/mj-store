"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, ExternalLink, Maximize2, Minimize2, X, ZoomIn, ZoomOut } from "lucide-react";

interface ImageViewerProps {
  src: string;
  onClose: () => void;
}

export default function ImageViewer({ src, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [fit, setFit] = useState(true);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(5, s + 0.3));
      if (e.key === "-") setScale((s) => Math.max(0.2, s - 0.3));
      if (e.key === "0") { setScale(1); setPos({ x: 0, y: 0 }); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    setDragging(true);
    setFit(false);
    dragStart.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    setPos({
      x: dragStart.current.px + (e.clientX - dragStart.current.x),
      y: dragStart.current.py + (e.clientY - dragStart.current.y),
    });
  }
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setFit(false);
    setScale((s) => Math.min(5, Math.max(0.2, s - e.deltaY * 0.001)));
  }
  function reset() { setScale(1); setPos({ x: 0, y: 0 }); setFit(true); }
  function zoom(dir: 1 | -1) {
    setFit(false);
    setScale((s) => Math.min(5, Math.max(0.2, s + dir * 0.4)));
  }

  async function download() {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "payment-proof.png";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, "_blank");
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="viewer-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[200] flex items-center justify-center select-none"
        style={{ background: "rgba(0,0,0,0.94)", backdropFilter: "blur(24px)" }}
        onClick={onClose}
      >
        {/* ── Toolbar ── */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ToolBtn onClick={() => zoom(-1)} title="Zoom out (-)"><ZoomOut className="h-4 w-4" /></ToolBtn>
          <span className="min-w-[38px] text-center text-[11px] font-black text-white/50 tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <ToolBtn onClick={() => zoom(1)} title="Zoom in (+)"><ZoomIn className="h-4 w-4" /></ToolBtn>
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          <ToolBtn onClick={reset} title="Reset (0)">
            {fit ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </ToolBtn>
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          <ToolBtn onClick={download} title="Download"><Download className="h-4 w-4" /></ToolBtn>
          <a
            href={src} target="_blank" rel="noopener noreferrer"
            className="h-8 w-8 grid place-items-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
            title="Open original"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          <ToolBtn onClick={onClose} title="Close (Esc)" danger>
            <X className="h-4 w-4" />
          </ToolBtn>
        </motion.div>

        {/* ── Image ── */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          className="relative overflow-hidden rounded-2xl shadow-[0_0_80px_rgba(168,85,247,0.15)]"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${fit ? 1 : scale})`,
            cursor: dragging ? "grabbing" : "grab",
            transition: dragging ? "none" : "transform 0.1s ease",
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={() => setDragging(false)}
          onMouseLeave={() => setDragging(false)}
          onWheel={onWheel}
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="Payment proof"
            style={{ maxWidth: "78vw", maxHeight: "78vh", display: "block", objectFit: "contain" }}
            draggable={false}
          />
        </motion.div>

        {/* ── Hint ── */}
        <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-white/20 font-semibold select-none">
          Scroll to zoom · Drag to pan · Esc to close
        </p>
      </motion.div>
    </AnimatePresence>
  );
}

function ToolBtn({
  onClick, title, danger = false, children,
}: {
  onClick: () => void; title?: string; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`h-8 w-8 grid place-items-center rounded-xl transition-all
        ${danger
          ? "text-red-400 hover:text-red-300 hover:bg-red-500/15"
          : "text-white/50 hover:text-white hover:bg-white/10"
        }`}
    >
      {children}
    </button>
  );
}
