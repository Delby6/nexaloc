-- Add read state tracking for owner/user chat threads

ALTER TABLE IF EXISTS public.owner_user_threads
  ADD COLUMN IF NOT EXISTS owner_last_read_at timestamptz,
  ADD COLUMN IF NOT EXISTS user_last_read_at timestamptz;

CREATE INDEX IF NOT EXISTS owner_user_threads_owner_last_read_at_idx
  ON public.owner_user_threads (owner_last_read_at);

CREATE INDEX IF NOT EXISTS owner_user_threads_user_last_read_at_idx
  ON public.owner_user_threads (user_last_read_at);

-- Per-thread unread message counts for owner/user chat

CREATE OR REPLACE VIEW public.owner_chat_unread_message_counts_by_thread AS
SELECT
  t.id AS thread_id,
  t.owner_id,
  COUNT(m.id)::int AS unread_count
FROM public.owner_user_threads t
JOIN public.owner_user_messages m
  ON m.thread_id = t.id
WHERE
  t.owner_id IS NOT NULL
  AND m.sender_role = 'user'
  AND (t.owner_last_read_at IS NULL OR m.created_at > t.owner_last_read_at)
GROUP BY t.id, t.owner_id;

CREATE OR REPLACE VIEW public.user_chat_unread_message_counts_by_thread AS
SELECT
  t.id AS thread_id,
  t.user_id,
  COUNT(m.id)::int AS unread_count
FROM public.owner_user_threads t
JOIN public.owner_user_messages m
  ON m.thread_id = t.id
WHERE
  t.user_id IS NOT NULL
  AND m.sender_role = 'owner'
  AND (t.user_last_read_at IS NULL OR m.created_at > t.user_last_read_at)
GROUP BY t.id, t.user_id;

-- RPC to mark chat messages as read (server-side)

CREATE OR REPLACE FUNCTION public.mark_messages_read(p_thread_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_role = 'owner' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.owner_user_threads t
      WHERE t.id = p_thread_id AND t.owner_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'not authorized';
    END IF;

    UPDATE public.owner_user_messages
    SET owner_read_at = now()
    WHERE thread_id = p_thread_id
      AND sender_role = 'user'
      AND owner_read_at IS NULL;

  ELSIF p_role = 'user' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.owner_user_threads t
      WHERE t.id = p_thread_id AND t.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'not authorized';
    END IF;

    UPDATE public.owner_user_messages
    SET user_read_at = now()
    WHERE thread_id = p_thread_id
      AND sender_role = 'owner'
      AND user_read_at IS NULL;
  ELSE
    RAISE EXCEPTION 'invalid role';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_messages_read(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_messages_read(uuid, text) TO authenticated;

-- Per-message read state for owner/user chat

ALTER TABLE IF EXISTS public.owner_user_messages
  ADD COLUMN IF NOT EXISTS owner_read_at timestamptz,
  ADD COLUMN IF NOT EXISTS user_read_at timestamptz;

CREATE INDEX IF NOT EXISTS owner_user_messages_owner_read_at_idx
  ON public.owner_user_messages (owner_read_at);

CREATE INDEX IF NOT EXISTS owner_user_messages_user_read_at_idx
  ON public.owner_user_messages (user_read_at);

-- Replace old unread-conversation views with unread-message views

DROP VIEW IF EXISTS public.owner_chat_unread_counts;
DROP VIEW IF EXISTS public.user_chat_unread_counts;

CREATE OR REPLACE VIEW public.owner_chat_unread_message_counts AS
SELECT
  t.owner_id,
  COUNT(m.id)::int AS unread_count
FROM public.owner_user_threads t
JOIN public.owner_user_messages m
  ON m.thread_id = t.id
WHERE
  t.owner_id IS NOT NULL
  AND m.sender_role = 'user'
  AND (t.owner_last_read_at IS NULL OR m.created_at > t.owner_last_read_at)
GROUP BY t.owner_id;

CREATE OR REPLACE VIEW public.user_chat_unread_message_counts AS
SELECT
  t.user_id,
  COUNT(m.id)::int AS unread_count
FROM public.owner_user_threads t
JOIN public.owner_user_messages m
  ON m.thread_id = t.id
WHERE
  t.user_id IS NOT NULL
  AND m.sender_role = 'owner'
  AND (t.user_last_read_at IS NULL OR m.created_at > t.user_last_read_at)
GROUP BY t.user_id;

-- Replace unread views to use per-message read state

DROP VIEW IF EXISTS public.owner_chat_unread_message_counts;
DROP VIEW IF EXISTS public.user_chat_unread_message_counts;
DROP VIEW IF EXISTS public.owner_chat_unread_message_counts_by_thread;
DROP VIEW IF EXISTS public.user_chat_unread_message_counts_by_thread;

CREATE OR REPLACE VIEW public.owner_chat_unread_message_counts AS
SELECT
  t.owner_id,
  COUNT(m.id)::int AS unread_count
FROM public.owner_user_threads t
JOIN public.owner_user_messages m
  ON m.thread_id = t.id
WHERE
  t.owner_id IS NOT NULL
  AND m.sender_role = 'user'
  AND m.owner_read_at IS NULL
GROUP BY t.owner_id;

CREATE OR REPLACE VIEW public.user_chat_unread_message_counts AS
SELECT
  t.user_id,
  COUNT(m.id)::int AS unread_count
FROM public.owner_user_threads t
JOIN public.owner_user_messages m
  ON m.thread_id = t.id
WHERE
  t.user_id IS NOT NULL
  AND m.sender_role = 'owner'
  AND m.user_read_at IS NULL
GROUP BY t.user_id;

CREATE OR REPLACE VIEW public.owner_chat_unread_message_counts_by_thread AS
SELECT
  t.id AS thread_id,
  t.owner_id,
  COUNT(m.id)::int AS unread_count
FROM public.owner_user_threads t
JOIN public.owner_user_messages m
  ON m.thread_id = t.id
WHERE
  t.owner_id IS NOT NULL
  AND m.sender_role = 'user'
  AND m.owner_read_at IS NULL
GROUP BY t.id, t.owner_id;

CREATE OR REPLACE VIEW public.user_chat_unread_message_counts_by_thread AS
SELECT
  t.id AS thread_id,
  t.user_id,
  COUNT(m.id)::int AS unread_count
FROM public.owner_user_threads t
JOIN public.owner_user_messages m
  ON m.thread_id = t.id
WHERE
  t.user_id IS NOT NULL
  AND m.sender_role = 'owner'
  AND m.user_read_at IS NULL
GROUP BY t.id, t.user_id;
