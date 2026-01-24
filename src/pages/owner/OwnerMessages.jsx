import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import ChatWindow from "@/components/chat/ChatWindow";
import {
  OWNER_CHAT_MESSAGES_TABLE,
  OWNER_CHAT_THREADS_TABLE,
} from "@/utils/chatTables";

export default function OwnerMessages() {
  const navigate = useNavigate();
  const [owner, setOwner] = useState(null);
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) || null,
    [threads, activeThreadId]
  );

  useEffect(() => {
    async function loadOwner() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        navigate("/owner-login");
        return;
      }
      setOwner(data.user);
    }

    loadOwner();
  }, [navigate]);

  const loadThreads = useCallback(async () => {
    if (!owner?.id) return;
    setLoadingThreads(true);

    const { data: threadRows, error: threadError } = await supabase
      .from(OWNER_CHAT_THREADS_TABLE)
      .select("id, business_id, user_id, last_message_at, created_at")
      .eq("owner_id", owner.id)
      .order("last_message_at", { ascending: false });

    if (threadError) {
      setError("Unable to load your inbox.");
      setThreads([]);
      setLoadingThreads(false);
      return;
    }

    const businessIds = [
      ...new Set((threadRows || []).map((row) => row.business_id)),
    ];
    const userIds = [
      ...new Set((threadRows || []).map((row) => row.user_id)),
    ];

    const [businessesResponse, usersResponse] = await Promise.all([
      businessIds.length
        ? supabase
            .from("businesses")
            .select("id, name")
            .in("id", businessIds)
        : { data: [] },
      userIds.length
        ? supabase
            .from("users")
            .select("id, full_name, email, avatar_url")
            .in("id", userIds)
        : { data: [] },
    ]);

    const businessMap = Object.fromEntries(
      (businessesResponse.data || []).map((biz) => [biz.id, biz])
    );
    const userMap = Object.fromEntries(
      (usersResponse.data || []).map((usr) => [usr.id, usr])
    );

    const enriched = (threadRows || []).map((thread) => ({
      ...thread,
      business: businessMap[thread.business_id] || null,
      user: userMap[thread.user_id] || null,
    }));

    setThreads(enriched);
    if (!activeThreadId && enriched.length > 0) {
      setActiveThreadId(enriched[0].id);
    }
    setLoadingThreads(false);
  }, [activeThreadId, owner?.id]);

  useEffect(() => {
    if (!owner?.id) return;
    loadThreads();
  }, [owner?.id, loadThreads]);

  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }

    let channel;
    let active = true;

    async function loadMessages() {
      const { data, error: messagesError } = await supabase
        .from(OWNER_CHAT_MESSAGES_TABLE)
        .select("id, sender_id, sender_role, message, created_at")
        .eq("thread_id", activeThreadId)
        .order("created_at", { ascending: true });

      if (!active) return;
      if (messagesError) {
        setError("Unable to load conversation.");
        return;
      }
      setMessages(data || []);
    }

    async function subscribe() {
      await loadMessages();
      channel = supabase.channel(`owner-thread-${activeThreadId}`);
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: OWNER_CHAT_MESSAGES_TABLE,
          filter: `thread_id=eq.${activeThreadId}`,
        },
        (payload) => {
          const next = payload.new;
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === next.id)) return prev;
            return [...prev, next];
          });
        }
      );
      channel.subscribe();
    }

    subscribe();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeThreadId]);

  async function sendMessage(text) {
    if (!owner?.id || !activeThreadId) return false;
    setSending(true);
    setError("");

    const { error: messageError } = await supabase
      .from(OWNER_CHAT_MESSAGES_TABLE)
      .insert({
        thread_id: activeThreadId,
        sender_id: owner.id,
        sender_role: "owner",
        message: text,
      });

    if (messageError) {
      setError("Message failed to send.");
      setSending(false);
      return false;
    }

    await supabase
      .from(OWNER_CHAT_THREADS_TABLE)
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", activeThreadId);

    setSending(false);
    return true;
  }

  return (
    <div className="min-h-screen">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Customer Messages
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Reply to customers who reached out about your listings.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Conversations
            </h2>
            <button
              onClick={loadThreads}
              className="text-xs text-sky-600 hover:text-sky-500"
            >
              Refresh
            </button>
          </div>

          {loadingThreads ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Loading conversations...
            </p>
          ) : threads.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No customer chats yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {threads.map((thread) => {
                const userName =
                  thread.user?.full_name || thread.user?.email || "Customer";
                const businessName = thread.business?.name || "Listing";
                return (
                  <button
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition ${
                      thread.id === activeThreadId
                        ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    }`}
                  >
                    <div className="font-semibold">{userName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {businessName}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      {thread.last_message_at
                        ? `Last message ${new Date(
                            thread.last_message_at
                          ).toLocaleString()}`
                        : `Started ${new Date(
                            thread.created_at
                          ).toLocaleString()}`}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {activeThread ? (
            <ChatWindow
              messages={messages}
              viewerId={owner?.id}
              sending={sending}
              onSend={sendMessage}
              getSenderLabel={(message) =>
                message.sender_id === owner?.id ? "You" : "Customer"
              }
              emptyState={error || "Send a greeting to start this chat."}
              header={
                <div>
                  <h2 className="text-lg font-semibold">
                    {activeThread.user?.full_name ||
                      activeThread.user?.email ||
                      "Customer"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {activeThread.business?.name || "Listing"}
                  </p>
                </div>
              }
            />
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Select a conversation to start chatting.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
