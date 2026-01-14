import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatDistanceToNow } from "date-fns";

export default function CommentsSection({ businessId, user }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");

  // ----------------------------------------------------
  // LOAD COMMENTS — now joins comment_users instead of profiles
  // ----------------------------------------------------
  async function loadComments() {
    setLoading(true);

    const { data, error } = await supabase
      .from("comments")
      .select(`
        id,
        content,
        created_at,
        user_id,
        comment_users:user_id (
          full_name,
          avatar_url,
          user_name,
          email
        )
      `)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("SUPABASE LOAD ERROR:", error);
      setComments([]);
      return;
    }

    setComments(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (businessId) loadComments();
  }, [businessId]);

  // ----------------------------------------------------
  // CREATE OR UPDATE comment_users PROFILE
  // ----------------------------------------------------
  async function ensureCommentUserProfile() {
    if (!user) return;

    await supabase.from("comment_users").upsert({
      user_id: user.id,
      full_name: user.user_metadata?.full_name || user.email,
      avatar_url: user.user_metadata?.avatar_url || null,
      user_name: user.user_metadata?.user_name || null,
      email: user.email,
    });
  }

  // ----------------------------------------------------
  // SUBMIT NEW COMMENT
  // ----------------------------------------------------
  async function submitComment() {
    if (!user) return alert("Please log in");
    if (!newComment.trim()) return;

    // Ensure profile exists
    await ensureCommentUserProfile();

    const { error } = await supabase.from("comments").insert({
      business_id: businessId,
      user_id: user.id,
      content: newComment.trim(),
    });

    if (error) {
      console.error("INSERT ERROR:", error);
      return alert("Could not post comment");
    }

    setNewComment("");
    loadComments();
  }

  // ----------------------------------------------------
  // EDIT COMMENT
  // ----------------------------------------------------
  async function saveEdit(commentId) {
    const { error } = await supabase
      .from("comments")
      .update({ content: editingText })
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (!error) {
      setEditingCommentId(null);
      loadComments();
    }
  }

  // ----------------------------------------------------
  // DELETE COMMENT
  // ----------------------------------------------------
  async function deleteComment(commentId) {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  }

  // ----------------------------------------------------
  // RENDER
  // ----------------------------------------------------
  return (
    <div className="mt-10">
      <h3 className="text-xl font-semibold mb-3 text-slate-700 dark:text-slate-200">
        Comments ({comments.length})
      </h3>

      {user ? (
        <div className="flex gap-3 mb-5">
          <textarea
            className="flex-1 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border"
            rows={2}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
          />
          <button
            onClick={submitComment}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg"
          >
            Post
          </button>
        </div>
      ) : (
        <p className="text-slate-500 text-sm mb-4">
          <em>You must log in to comment.</em>
        </p>
      )}

      {loading ? (
        <p className="text-slate-400">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-slate-500">No comments yet.</p>
      ) : (
        <div className="space-y-6">
          {comments.map((c) => (
            <div
              key={c.id}
              className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border"
            >
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={
                    c.comment_users?.avatar_url ||
                    "https://api.dicebear.com/7.x/initials/svg?seed=User"
                  }
                  className="w-9 h-9 rounded-full"
                />
                <div>
                  <p className="font-semibold">
                    {c.comment_users?.full_name ||
                      c.comment_users?.user_name ||
                      "Anonymous"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(c.created_at))} ago
                  </p>
                </div>
              </div>

              {editingCommentId === c.id ? (
                <>
                  <textarea
                    className="w-full p-3 rounded-lg bg-slate-200 dark:bg-slate-700"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => saveEdit(c.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCommentId(null)}
                      className="px-3 py-1 bg-gray-50 dark:bg-slate-9000 text-white rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-slate-700 dark:text-slate-300">
                  {c.content}
                </p>
              )}

              {user && c.user_id === user.id && (
                <div className="flex gap-4 text-sm mt-3">
                  <button
                    onClick={() => {
                      setEditingCommentId(c.id);
                      setEditingText(c.content);
                    }}
                    className="text-sky-500 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
