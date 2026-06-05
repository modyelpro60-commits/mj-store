"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";

interface StatusDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  disabled?: boolean;
}

const optionColors: Record<string, string> = {
  Pending: "text-purple-200",
  Processing: "text-fuchsia-200",
  Completed: "text-emerald-200",
  Cancelled: "text-red-200",
};

const optionBorders: Record<string, string> = {
  Pending: "hover:border-purple-500/40 focus-visible:border-purple-500/40",
  Processing: "hover:border-fuchsia-500/40 focus-visible:border-fuchsia-500/40",
  Completed: "hover:border-emerald-500/40 focus-visible:border-emerald-500/40",
  Cancelled: "hover:border-red-500/40 focus-visible:border-red-500/40",
};

const dotColors: Record<string, string> = {
  Pending: "bg-purple-400",
  Processing: "bg-fuchsia-400",
  Completed: "bg-emerald-400",
  Cancelled: "bg-red-400",
};

export default function StatusDropdown({
  value,
  onChange,
  options,
  disabled = false,
}: StatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    if (!disabled) setOpen((prev) => !prev);
  }, [disabled]);

  const handleSelect = useCallback(
    (option: string) => {
      onChange(option);
      setOpen(false);
    },
    [onChange]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const currentColor = optionColors[value] ?? "text-zinc-200";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`flex w-full items-center justify-between rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm font-semibold outline-none transition-all duration-200 ${
          currentColor
        } ${
          optionBorders[value] ?? "hover:border-white/20 focus-visible:border-purple-400/40"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dotColors[value] ?? "bg-zinc-400"}`} />
          {value}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-150 ${
                optionColors[option] ?? "text-zinc-200"
              } ${
                option === value
                  ? "bg-purple-500/15"
                  : "hover:bg-white/5"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${dotColors[option] ?? "bg-zinc-400"}`} />
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
