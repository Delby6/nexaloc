import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

export default function ChatWindow({
  messages,
  viewerId,
  getSenderLabel,
  onSend,
  disabled = false,
  sending = false,
  header,
  emptyState = "No messages yet.",
  placeholder = "Write a message...",
}) {
  const [draft, setDraft] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (!endRef.current) return;
    endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function handleSend() {
    if (disabled || sending || !draft.trim()) return;
    const next = draft.trim();
    const success = await onSend(next);
    if (success) setDraft("");
  }

  return (
    <div className="flex flex-col h-full">
      {header && <div className="mb-4">{header}</div>}

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {emptyState}
          </p>
        ) : (
          messages.map((message) => {
            const isMine = viewerId && message.sender_id === viewerId;
            const label = getSenderLabel?.(message) || "Message";
            return (
              <div
                key={message.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm border ${
                    isMine
                      ? "bg-sky-600 text-white border-sky-500"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="text-[11px] opacity-80 mb-1">{label}</div>
                  <p className="whitespace-pre-wrap break-words">
                    {message.message}
                  </p>
                  <div className="text-[10px] opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4">
        <div className="flex items-center gap-2">
          <textarea
            rows={2}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            disabled={disabled || sending}
          />
          <button
            onClick={handleSend}
            disabled={disabled || sending || !draft.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
