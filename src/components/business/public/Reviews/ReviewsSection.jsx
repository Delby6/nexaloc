// src/components/business/public/Reviews/ReviewsSection.jsx
import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Sparkles,
  AlertTriangle,
  Loader2,
  Send,
  MessageSquarePlus,
  Edit2,
  Trash2,
} from "lucide-react";
import { sentimentEmoji, sentimentLabel } from "@/utils/localAI";

export default function ReviewsSection({
  user,
  navigate,
  reviews,
  loadingReviews,
  newRating,
  setNewRating,
  newComment,
  setNewComment,
  newPhotos,
  setNewPhotos,
  liveInappropriate,
  liveSentiment,
  formError,
  submitting,
  submitReview,
  updateReview,
  deleteReview,
  isBusinessOwner,
  voteReviewHelpful,
  submitOwnerReply,
  deleteOwnerReply,
}) {
  // Toggle review form (hidden until CTA is clicked)
  const [showForm, setShowForm] = useState(false);

  // How many reviews visible (pagination)
  const [visibleCount, setVisibleCount] = useState(3);

  // Read more / less
  const [expandedReviewIds, setExpandedReviewIds] = useState([]);

  // Edit review
  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  // Owner reply
  const [replyEditingId, setReplyEditingId] = useState(null);
  const [replyText, setReplyText] = useState("");

  // Sort: 'newest' | 'highest' | 'lowest'
  const [sortBy, setSortBy] = useState("newest");

  // Filter: with photos only
  const [withPhotosOnly, setWithPhotosOnly] = useState(false);

  // Search reviews text
  const [searchQuery, setSearchQuery] = useState("");

  // Ref for form to scroll to
  const formRef = useRef(null);

  // Reset pagination when filters/sort/search change
  useEffect(() => {
    setVisibleCount(3);
  }, [sortBy, withPhotosOnly, searchQuery]);

  // Average rating + distribution for ALL reviews
  const { avgRating, distribution, totalReviews } = useMemo(() => {
    if (!reviews || !reviews.length) {
      return {
        avgRating: 0,
        totalReviews: 0,
        distribution: [
          { star: 5, count: 0, percentage: 0 },
          { star: 4, count: 0, percentage: 0 },
          { star: 3, count: 0, percentage: 0 },
          { star: 2, count: 0, percentage: 0 },
          { star: 1, count: 0, percentage: 0 },
        ],
      };
    }

    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    for (const r of reviews) {
      const rating = Math.round(r.rating || 0);
      if (rating >= 1 && rating <= 5) {
        counts[rating] += 1;
        sum += rating;
      }
    }

    const total = reviews.length;
    const avg = total ? sum / total : 0;

    const dist = [5, 4, 3, 2, 1].map((star) => {
      const count = counts[star];
      const percentage = total ? Math.round((count / total) * 100) : 0;
      return { star, count, percentage };
    });

    return { avgRating: avg, distribution: dist, totalReviews: total };
  }, [reviews]);

  // Filter + search + sort
  const sortedReviews = useMemo(() => {
    let arr = reviews ? [...reviews] : [];

    if (withPhotosOnly) {
      arr = arr.filter((r) => r.photos && r.photos.length > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      arr = arr.filter((r) => {
        const name =
          r.user?.full_name || r.user?.name || r.user?.email || "";
        const text = (r.comment || "") + " " + name;
        return text.toLowerCase().includes(q);
      });
    }

    if (sortBy === "highest") {
      arr.sort((a, b) => {
        const ra = a.rating || 0;
        const rb = b.rating || 0;
        if (rb !== ra) return rb - ra;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    } else if (sortBy === "lowest") {
      arr.sort((a, b) => {
        const ra = a.rating || 0;
        const rb = b.rating || 0;
        if (ra !== rb) return ra - rb;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    } else {
      // newest
      arr.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    }

    return arr;
  }, [reviews, sortBy, withPhotosOnly, searchQuery]);

  const visibleReviews = sortedReviews.slice(0, visibleCount);

  const toggleForm = () => {
    if (!user) {
      navigate("/user-login");
      return;
    }
    // Ensure form is visible
    setShowForm(true);
    // Smooth scroll to form
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const toggleExpandReview = (id) => {
    setExpandedReviewIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const startEdit = (review) => {
    setEditingId(review.id);
    setEditRating(review.rating || 5);
    setEditComment(review.comment || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRating(5);
    setEditComment("");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const ok = await updateReview(editingId, editRating, editComment);
    if (ok) {
      cancelEdit();
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Delete this review? This action cannot be undone."
    );
    if (!confirmed) return;
    await deleteReview(id);
  };

  const handleSaveReply = async () => {
    if (!replyEditingId) return;
    const ok = await submitOwnerReply(replyEditingId, replyText);
    if (ok) {
      setReplyEditingId(null);
      setReplyText("");
    }
  };

  const handleDeleteReply = async (id) => {
    const confirmed = window.confirm(
      "Delete this reply? This cannot be undone."
    );
    if (!confirmed) return;
    await deleteOwnerReply(id);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getDisplayName = (review) => {
    const userData = review.user;
    return (
      userData?.full_name ||
      userData?.name ||
      userData?.email ||
      "Anonymous user"
    );
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      viewport={{ once: true }}
      className="mt-12 border-t border-slate-200 dark:border-slate-700 pt-6"
    >
      {/* Header: title + average rating + distribution */}
      <div className="flex flex-col gap-4">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Star className="text-yellow-500" /> Reviews & Ratings
        </h3>

        {totalReviews > 0 && (
          <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Average rating block */}
            <div>
              <div className="flex items-center gap-3">
                <div className="flex items-center text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5"
                      fill={
                        i < Math.round(avgRating)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  ))}
                </div>
                <div>
                  <div className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                    {avgRating.toFixed(1)} / 5
                  </div>
                  <div className="text-xs text-slate-500">
                    Based on {totalReviews} review
                    {totalReviews !== 1 && "s"}
                  </div>
                </div>
              </div>
            </div>

            {/* Distribution bars */}
            <div className="space-y-1.5 text-xs">
              {distribution.map((row) => (
                <div
                  key={row.star}
                  className="flex items-center gap-2"
                >
                  <span className="w-12 flex items-center gap-1 justify-end text-slate-600 dark:text-slate-300">
                    {row.star}
                    <Star className="w-3 h-3 text-yellow-500" />
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 dark:bg-yellow-500"
                      style={{ width: `${row.percentage}%` }}
                    ></div>
                  </div>
                  <span className="w-10 text-right text-[11px] text-slate-500">
                    {row.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full-width CTA like Yelp */}
      <div className="mt-6 mb-4 flex justify-center">
        <button
          onClick={toggleForm}
          className="w-full max-w-md inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-sm"
        >
          <MessageSquarePlus className="w-4 h-4" />
          {showForm ? "Hide review form" : "Write a review"}
        </button>
      </div>

      {/* Review Form – placed under CTA, hidden until toggled */}
      <div ref={formRef}>
        <AnimatePresence>
          {showForm && user && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden mb-6"
            >
              <div>
                {/* Rating Selector */}
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <label className="text-sm">Your Rating:</label>
                  <select
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="border rounded px-2 py-1 bg-white dark:bg-slate-900"
                  >
                    {[1, 2, 3, 4, 5].map((r) => (
                      <option key={r} value={r}>
                        {r} ⭐
                      </option>
                    ))}
                  </select>
                </div>

                {/* Comment Field */}
                <textarea
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your experience…"
                  className="w-full border rounded-lg p-3 bg-white dark:bg-slate-900"
                />

                {/* Photos upload */}
                <div className="mt-3">
                  <label className="text-xs text-slate-500">
                    Add photos (optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) =>
                      setNewPhotos(Array.from(e.target.files || []))
                    }
                    className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    You can add up to 4 photos. JPG or PNG.
                  </p>
                </div>

                {/* Sentiment + moderation */}
                {newComment && (
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Sparkles className="w-3 h-3" />
                      Offline analysis (EN/FR/PL)
                    </span>

                    {liveInappropriate ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        <AlertTriangle className="w-3 h-3" />
                        Inappropriate language
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700">
                        <span>{sentimentEmoji(liveSentiment)}</span>
                        <span className="text-slate-600 dark:text-slate-300">
                          {sentimentLabel(liveSentiment)}
                        </span>
                      </span>
                    )}
                  </div>
                )}

                {formError && (
                  <p className="text-red-500 text-sm mt-2">{formError}</p>
                )}

                <button
                  onClick={submitReview}
                  disabled={submitting || liveInappropriate}
                  className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
                    submitting || liveInappropriate
                      ? "bg-sky-400 cursor-not-allowed"
                      : "bg-sky-600 hover:bg-sky-700"
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Review
                    </>
                  )}
                </button>

                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Basic moderation runs
                  locally.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!user && showForm && (
        <p className="text-slate-500 mb-6">
          Please{" "}
          <span
            onClick={() => navigate("/user-login")}
            className="text-sky-600 underline cursor-pointer"
          >
            log in
          </span>{" "}
          to leave a review.
        </p>
      )}

      {/* Reviews Section */}
      {loadingReviews ? (
        <div className="flex items-center gap-2 text-slate-500 mt-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading reviews…
        </div>
      ) : !reviews || reviews.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 mt-4">
          No reviews yet. Be the first!
        </p>
      ) : (
        <>
          {/* Sticky controls: sort / filter / search */}
          <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-700/60 mt-2 mb-4">
            <div className="py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border rounded px-2 py-1 bg-white dark:bg-slate-900 text-xs sm:text-sm"
                  >
                    <option value="newest">Newest</option>
                    <option value="highest">Highest rating</option>
                    <option value="lowest">Lowest rating</option>
                  </select>
                </div>

                <label className="flex items-center gap-1 cursor-pointer text-slate-500">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300"
                    checked={withPhotosOnly}
                    onChange={(e) => setWithPhotosOnly(e.target.checked)}
                  />
                  <span className="text-xs sm:text-xs">With photos only</span>
                </label>
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reviews…"
                  className="w-full border rounded-lg px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Reviews list or no-match message */}
          {sortedReviews.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              No reviews match your filters or search.
            </p>
          ) : (
            <>
              <ul className="space-y-3">
                {visibleReviews.map((r) => {
                  const isAuthor = user && r.user_id === user.id;
                  const isExpanded = expandedReviewIds.includes(r.id);
                  const maxChars = 220;

                  const showToggle =
                    r.comment && r.comment.length > maxChars;
                  const commentText =
                    !showToggle || isExpanded
                      ? r.comment
                      : r.comment.slice(0, maxChars) + "…";

                  const displayName = getDisplayName(r);
                  const avatarUrl = r.user?.avatar_url;

                  const yesActive = r.myVote === "yes";
                  const noActive = r.myVote === "no";

                  return (
                    <li
                      key={r.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex gap-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-100">
                              {getInitials(displayName)}
                            </div>
                          )}
                        </div>

                        {/* Main content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {displayName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(
                                  r.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>

                            <div className="text-right">
                              <div className="flex items-center justify-end text-yellow-500">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className="w-4 h-4"
                                    fill={
                                      i < (r.rating || 0)
                                        ? "currentColor"
                                        : "none"
                                    }
                                  />
                                ))}
                              </div>
                              {r.sentiment && (
                                <span className="mt-1 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  <span>{sentimentEmoji(r.sentiment)}</span>
                                  <span>
                                    {sentimentLabel(r.sentiment)}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Comment OR edit form */}
                          {editingId === r.id ? (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-2 text-xs">
                                <span>Edit rating:</span>
                                <select
                                  value={editRating}
                                  onChange={(e) =>
                                    setEditRating(Number(e.target.value))
                                  }
                                  className="border rounded px-2 py-1 bg-white dark:bg-slate-900"
                                >
                                  {[1, 2, 3, 4, 5].map((val) => (
                                    <option key={val} value={val}>
                                      {val} ⭐
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <textarea
                                rows={3}
                                value={editComment}
                                onChange={(e) =>
                                  setEditComment(e.target.value)
                                }
                                className="w-full border rounded-lg p-2 text-sm bg-white dark:bg-slate-900"
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={cancelEdit}
                                  className="px-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={submitting}
                                  className="px-3 py-1 text-xs rounded-lg bg-sky-600 hover:bg-sky-700 text-white disabled:bg-sky-400"
                                >
                                  {submitting ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            r.comment && (
                              <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                                <p>{commentText}</p>
                                {showToggle && (
                                  <button
                                    onClick={() =>
                                      toggleExpandReview(r.id)
                                    }
                                    className="mt-1 text-xs text-sky-600 hover:underline"
                                  >
                                    {isExpanded
                                      ? "Show less"
                                      : "Read more"}
                                  </button>
                                )}
                              </div>
                            )
                          )}

                          {/* Photos */}
                          {r.photos && r.photos.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {r.photos.slice(0, 4).map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <img
                                    src={url}
                                    alt={`Review photo ${idx + 1}`}
                                    className="w-20 h-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                                  />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Owner reply */}
                          {(r.owner_reply || isBusinessOwner) && (
                            <div className="mt-3 border-l-2 border-sky-500 pl-3 text-xs">
                              {r.owner_reply &&
                                replyEditingId !== r.id && (
                                  <>
                                    <p className="font-semibold text-slate-700 dark:text-slate-100">
                                      Owner response
                                    </p>
                                    <p className="mt-1 text-slate-600 dark:text-slate-200">
                                      {r.owner_reply}
                                    </p>
                                  </>
                                )}

                              {isBusinessOwner &&
                                replyEditingId === r.id && (
                                  <div className="space-y-2">
                                    <p className="font-semibold text-slate-700 dark:text-slate-100">
                                      {r.owner_reply
                                        ? "Edit owner response"
                                        : "Write a response"}
                                    </p>
                                    <textarea
                                      rows={3}
                                      value={replyText}
                                      onChange={(e) =>
                                        setReplyText(e.target.value)
                                      }
                                      className="w-full border rounded-lg p-2 bg-white dark:bg-slate-900 text-xs"
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <button
                                        onClick={() => {
                                          setReplyEditingId(null);
                                          setReplyText("");
                                        }}
                                        className="px-3 py-1 text-[11px] rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-200"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={handleSaveReply}
                                        disabled={submitting}
                                        className="px-3 py-1 text-[11px] rounded-lg bg-sky-600 hover:bg-sky-700 text-white disabled:bg-sky-400"
                                      >
                                        {submitting
                                          ? "Saving..."
                                          : "Save reply"}
                                      </button>
                                    </div>
                                  </div>
                                )}

                              {isBusinessOwner &&
                                replyEditingId !== r.id && (
                                  <div className="mt-2 flex gap-3 text-[11px]">
                                    <button
                                      onClick={() => {
                                        setReplyEditingId(r.id);
                                        setReplyText(
                                          r.owner_reply || ""
                                        );
                                      }}
                                      className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      {r.owner_reply
                                        ? "Edit reply"
                                        : "Write a reply"}
                                    </button>
                                    {r.owner_reply && (
                                      <button
                                        onClick={() =>
                                          handleDeleteReply(r.id)
                                        }
                                        className="inline-flex items-center gap-1 text-red-500 hover:text-red-600"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        Delete reply
                                      </button>
                                    )}
                                  </div>
                                )}
                            </div>
                          )}

                          {/* Edit / Delete actions for review author */}
                          {isAuthor && editingId !== r.id && (
                            <div className="mt-3 flex gap-3 text-xs">
                              <button
                                onClick={() => startEdit(r)}
                                className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="inline-flex items-center gap-1 text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          )}

                          {/* Helpful votes */}
                          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Was this review helpful?</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  voteReviewHelpful(r.id, true)
                                }
                                className={`px-2 py-1 rounded-full border text-[11px] ${
                                  yesActive
                                    ? "bg-sky-600 text-white border-sky-600"
                                    : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200"
                                }`}
                              >
                                Yes{" "}
                                {r.helpfulYes
                                  ? `(${r.helpfulYes})`
                                  : ""}
                              </button>
                              <button
                                onClick={() =>
                                  voteReviewHelpful(r.id, false)
                                }
                                className={`px-2 py-1 rounded-full border text-[11px] ${
                                  noActive
                                    ? "bg-sky-600 text-white border-sky-600"
                                    : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200"
                                }`}
                              >
                                No{" "}
                                {r.helpfulNo
                                  ? `(${r.helpfulNo})`
                                  : ""}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Load More / Show Less */}
              <div className="mt-4 flex justify-center">
                {visibleCount < sortedReviews.length ? (
                  <button
                    onClick={() => setVisibleCount(visibleCount + 3)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm"
                  >
                    Show more reviews
                  </button>
                ) : (
                  sortedReviews.length > 3 && (
                    <button
                      onClick={() => setVisibleCount(3)}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm"
                    >
                      Show less
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </>
      )}
    </motion.section>
  );
}
