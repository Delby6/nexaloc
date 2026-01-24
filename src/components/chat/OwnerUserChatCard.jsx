import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ChatWindow from "@/components/chat/ChatWindow";
import {
  OWNER_CHAT_MESSAGES_TABLE,
  OWNER_CHAT_THREADS_TABLE,
} from "@/utils/chatTables";

export default function OwnerUserChatCard({ business, user }) {
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const ownerId = business?.owner_id;

  const isSelfOwner = useMemo(
    () => Boolean(user && ownerId && user.id === ownerId),
    [ownerId, user]
  );

  useEffect(() => {
    if (!ownerId) return;
    let active = true;
    async function loadOwnerProfile() {
      const { data, error: ownerError } = await supabase
        .from("owners")
        .select("full_name, email")
        .eq("id", ownerId)
        .single();

      if (!active) return;
      if (ownerError) {
        setOwnerProfile(null);
        return;
      }
      setOwnerProfile(data);
    }

    loadOwnerProfile();
    return () => {
      active = false;
    };
  }, [ownerId]);

  useEffect(() => {
    if (!user || !ownerId || !business?.id) return;
    let active = true;

    async function loadThread() {
      setLoadingThread(true);
      const { data, error: threadError } = await supabase
        .from(OWNER_CHAT_THREADS_TABLE)
        .select("id")
        .eq("business_id", business.id)
        .eq("owner_id", ownerId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;
      if (threadError) {
        setError("Unable to load chat.");
        setLoadingThread(false);
        return;
      }
      setThreadId(data?.id ?? null);
      setLoadingThread(false);
    }

    loadThread();
    return () => {
      active = false;
    };
  }, [business?.id, ownerId, user]);

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      return;
    }

    let channel;
    let active = true;

    async function loadMessages() {
      const { data, error: messagesError } = await supabase
        .from(OWNER_CHAT_MESSAGES_TABLE)
        .select("id, sender_id, sender_role, message, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (!active) return;
      if (messagesError) {
        setError("Unable to load chat messages.");
        return;
      }
      setMessages(data || []);
    }

    async function subscribe() {
      await loadMessages();

      channel = supabase.channel(`owner-user-chat-${threadId}`);

      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: OWNER_CHAT_MESSAGES_TABLE,
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const next = payload.new;
          setMessages((prev) => {
            if (prev.some((item) => item.id === next.id)) return prev;
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
  }, [threadId]);

  async function sendMessage(text) {
    if (!user || !ownerId || !business?.id) return false;
    if (!text.trim()) return false;

    setSending(true);
    setError("");

    try {
      let nextThreadId = threadId;
      if (!nextThreadId) {
        const { data: createdThread, error: threadError } = await supabase
          .from(OWNER_CHAT_THREADS_TABLE)
          .insert({
            business_id: business.id,
            owner_id: ownerId,
            user_id: user.id,
            last_message_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (threadError) {
          setError("Unable to start chat right now.");
          setSending(false);
          return false;
        }
        nextThreadId = createdThread.id;
        setThreadId(nextThreadId);
      }

      const { error: messageError } = await supabase
        .from(OWNER_CHAT_MESSAGES_TABLE)
        .insert({
          thread_id: nextThreadId,
          sender_id: user.id,
          sender_role: "user",
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
        .eq("id", nextThreadId);

      setSending(false);
      return true;
    } catch (err) {
      setError("Message failed to send.");
      setSending(false);
      return false;
    }
  }

  if (!ownerId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Chat with the owner</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          This business has not been claimed by an owner yet.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Chat with the owner</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Log in to start a private conversation with the business owner.
        </p>
      </div>
    );
  }

  if (isSelfOwner) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Chat with customers</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          You are viewing this listing as the owner. Open your inbox to reply to
          customer messages.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <ChatWindow
        messages={messages}
        viewerId={user?.id}
        disabled={loadingThread}
        sending={sending}
        onSend={sendMessage}
        header={
          <div>
            <h2 className="text-lg font-semibold">Chat with the owner</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {ownerProfile?.full_name ||
                ownerProfile?.email ||
                "Business owner"}
            </p>
          </div>
        }
        getSenderLabel={(message) =>
          message.sender_id === user?.id ? "You" : "Owner"
        }
        emptyState={
          error ||
          "Start the conversation by sending a message to the business owner."
        }
      />
    </div>
  );
}
