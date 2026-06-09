"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
import CommandBar from "../../components/nav/CommandBar";
import ChatWorkspace from "../../components/chat/ChatWorkspace";

function ChatInner() {
  const sp = useSearchParams();
  const room = sp.get("room");
  return (
    <div className="h-[calc(100vh-9rem)] min-h-[500px] overflow-hidden rounded-[2rem] border border-white/[0.08] shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
      <ChatWorkspace variant="page" initialRoomId={room} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <>
      <CommandBar />
      <main className="relative min-h-screen bg-void-base px-4 pt-24 pb-8 text-white md:px-8" dir="rtl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[360px]"
          style={{ background: "radial-gradient(circle at 50% -10%, rgba(124,58,237,0.16), transparent 60%)" }}
        />
        <div className="relative mx-auto max-w-[1100px]">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-purple-500/25 bg-purple-500/10 text-purple-200">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">محادثاتي وطلباتي</h1>
              <p className="text-sm text-zinc-500">تابع حالة طلباتك والدعم الفني — كل طلب في محادثة لوحده</p>
            </div>
          </div>

          <Suspense fallback={<div className="h-[60vh] rounded-[2rem] border border-white/[0.06] bg-zinc-950/40" />}>
            <ChatInner />
          </Suspense>
        </div>
      </main>
    </>
  );
}
