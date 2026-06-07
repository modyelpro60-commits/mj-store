"use client";

import ChatWorkspace from "../../../components/chat/ChatWorkspace";

export default function AdminChatPage() {
  return (
    <div className="h-[calc(100vh-9rem)] min-h-[480px] overflow-hidden rounded-[2rem] border border-white/[0.08] shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
      <ChatWorkspace variant="page" />
    </div>
  );
}
