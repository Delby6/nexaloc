// src/hooks/useBusinessDetails.js
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { isInappropriate, analyzeSentiment } from "@/utils/localAI";

const REVIEW_PHOTO_BUCKET = "review-photos";

export function useBusinessDetails(id, navigate) {
  // ---------- Core State ----------
  const [business, setBusiness] = useState(null);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [relatedReason, setRelatedReason] = useState("");
  const [user, setUser] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  // ---------- Reviews ----------
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [newPhotos, setNewPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // ---------- Likes ----------
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // ---------- Favorites ----------
  const [favorite, setFavorite] = useState(false);

  // ---------- Derived ----------
  const liveInappropriate = useMemo(
    () => (newComment ? isInappropriate(newComment) : false),
    [newComment]
  );

  const liveSentiment = useMemo(
    () => (newComment ? analyzeSentiment(newComment) : "neutral"),
    [newComment]
  );

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((s, r) => s + (r.rating || 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  const isOwner = useMemo(
    () => Boolean(user && business && business.owner_id === user.id),
    [user, business]
  );

  const directionsHref = useMemo(() => {
    if (coords)
      return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lon}`;

    if (business?.address)
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        business.address
      )}`;

    return null;
  }, [coords, business]);

  /* ------------------------ Load initial data ------------------------ */

  useEffect(() => {
    if (!id) return;
    fetchBusiness();
    getUser();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    loadLikes();
  }, [id, user]);

  useEffect(() => {
    if (!id || !user) return;
    loadFavorite();
  }, [id, user]);

  /* --------------------- data loading funcs --------------------- */

  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  }

  async function fetchBusiness() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setBusiness(data);

      if (data) {
        fetchRelated(data);
        loadReviews(data.id);
        fetchCoords(data);
      }
    } catch (err) {
      console.error("fetchBusiness error:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRelated(biz) {
    try {
      setRelatedLoading(true);
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .neq("id", biz.id)
        .or(`village.eq.${biz.village},category.eq.${biz.category}`)
        .limit(3);

      if (error) throw error;

      if (data.length > 0) {
        if (data.some((b) => b.village === biz.village)) {
          setRelatedReason(`Because it’s also in ${biz.village}`);
        } else if (data.some((b) => b.category === biz.category)) {
          setRelatedReason(`Same category: ${biz.category}`);
        }
      }

      setRelated(data || []);
    } catch (err) {
      console.error("related error:", err.message);
    } finally {
      setRelatedLoading(false);
    }
  }

  // Load reviews + user data + helpful votes
  async function loadReviews(businessId = id) {
    try {
      setLoadingReviews(true);
      const { data: reviewRows, error } = await supabase
        .from("business_reviews")
        .select(
          "id, rating, comment, sentiment, created_at, user_id, photos, owner_reply, owner_reply_created_at, owner_reply_updated_at"
        )
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!reviewRows || reviewRows.length === 0) {
        setReviews([]);
        return;
      }

      const userIds = [
        ...new Set(reviewRows.map((r) => r.user_id).filter(Boolean)),
      ];

      // Load user profile data (for avatar / name)
      let userMap = {};
      if (userIds.length) {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, full_name, email, avatar_url")
          .in("id", userIds);

        if (usersError) {
          console.error("review users load error:", usersError.message);
        } else {
          userMap = Object.fromEntries(usersData.map((u) => [u.id, u]));
        }
      }

      // Load helpful votes
      const reviewIds = reviewRows.map((r) => r.id);
      let voteMap = {};
      if (reviewIds.length) {
        const { data: votesData, error: votesError } = await supabase
          .from("business_review_votes")
          .select("review_id, user_id, helpful")
          .in("review_id", reviewIds);

        if (votesError) {
          console.error("review votes load error:", votesError.message);
        } else {
          const map = {};
          for (const v of votesData) {
            const existing =
              map[v.review_id] || { yes: 0, no: 0, myVote: null };
            if (v.helpful) existing.yes += 1;
            else existing.no += 1;

            if (user && v.user_id === user.id) {
              existing.myVote = v.helpful ? "yes" : "no";
            }
            map[v.review_id] = existing;
          }
          voteMap = map;
        }
      }

      const enriched = reviewRows.map((r) => {
        const vote = voteMap[r.id] || {
          yes: 0,
          no: 0,
          myVote: null,
        };

        return {
          ...r,
          user: userMap[r.user_id] || null,
          helpfulYes: vote.yes,
          helpfulNo: vote.no,
          myVote: vote.myVote,
        };
      });

      setReviews(enriched);
    } catch (err) {
      console.error("review load error:", err.message);
    } finally {
      setLoadingReviews(false);
    }
  }

  async function fetchCoords(business) {
    if (!business) return;

    const query = (
      business.address ||
      [business.name, business.village].filter(Boolean).join(", ")
    ).trim();

    if (!query) return;

    try {
      setMapLoading(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}`
      );
      const data = await res.json();

      if (data.length > 0) {
        setCoords({
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
        });
      }
    } catch (err) {
      console.error("coords error:", err);
    } finally {
      setMapLoading(false);
    }
  }

  async function loadLikes() {
    const { data, error } = await supabase
      .from("likes")
      .select("*")
      .eq("business_id", id);

    if (error) {
      console.error("loadLikes error:", error);
      return;
    }

    setLikeCount(data?.length || 0);

    if (user) {
      setLiked(data.some((l) => l.user_id === user.id));
    }
  }

  async function loadFavorite() {
    if (!user) return;

    const { data, error } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", id)
      .maybeSingle();

    if (error) {
      console.error("favorites error:", error.message);
    }

    setFavorite(!!data);
  }

  /* ------------------------- helpers ------------------------- */

  async function uploadReviewPhotos(files) {
    if (!files || !files.length) return [];

    const toUpload = files.slice(0, 4); // limit
    const urls = [];

    for (const file of toUpload) {
      const ext = file.name.split(".").pop();
      const filePath = `business-${id}/${user.id}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(REVIEW_PHOTO_BUCKET)
        .upload(filePath, file);

      if (uploadError) {
        console.error("photo upload error:", uploadError.message);
        toast.error("Could not upload one of the photos.");
        continue;
      }

      const { data: publicData } = supabase.storage
        .from(REVIEW_PHOTO_BUCKET)
        .getPublicUrl(filePath);

      if (publicData?.publicUrl) {
        urls.push(publicData.publicUrl);
      }
    }

    return urls;
  }

  /* ------------------------- actions ------------------------- */

  async function toggleLike() {
    if (!user) {
      toast.error("Login required");
      return navigate("/user-login");
    }

    if (liked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("business_id", id)
        .eq("user_id", user.id);

      if (error) {
        toast.error("Could not remove like");
        return;
      }

      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      const { error } = await supabase.from("likes").insert({
        business_id: id,
        user_id: user.id,
      });

      if (error) {
        toast.error("Could not add like");
        return;
      }

      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  }

  async function toggleFavorite() {
    if (!user) {
      toast.error("Login required");
      return navigate("/user-login");
    }

    if (favorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("business_id", id);

      if (error) {
        toast.error("Could not remove favorite");
        return;
      }

      setFavorite(false);
      toast("Removed from favorites");
    } else {
      const { error } = await supabase.from("favorites").insert({
        user_id: user.id,
        business_id: id,
      });

      if (error) {
        toast.error("Could not favorite");
        return;
      }

      setFavorite(true);
      toast.success("Added to favorites!");
    }
  }

  async function submitReview() {
    try {
      setFormError("");

      if (!user) return setFormError("Please log in to leave a review.");
      if (!newRating) return setFormError("Rating required.");
      if (!newComment.trim()) return setFormError("Comment required.");
      if (isInappropriate(newComment)) {
        toast.error("Inappropriate words detected.");
        return;
      }

      setSubmitting(true);

      const sentiment = analyzeSentiment(newComment);
      const photoUrls = await uploadReviewPhotos(newPhotos);

      const { error } = await supabase.from("business_reviews").insert({
        business_id: id,
        user_id: user.id,
        rating: newRating,
        comment: newComment.trim(),
        sentiment,
        photos: photoUrls.length ? photoUrls : null,
      });

      if (error) throw error;

      setNewRating(5);
      setNewComment("");
      setNewPhotos([]);
      await loadReviews();
      toast.success("Review submitted!");
      return true;
    } catch (err) {
      console.error("submit review error:", err.message);
      setFormError("Could not submit review.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  // Update an existing review (only own review)
  async function updateReview(reviewId, rating, comment) {
    try {
      if (!user) {
        toast.error("Login required");
        return false;
      }
      if (!rating) {
        toast.error("Rating required");
        return false;
      }
      if (!comment.trim()) {
        toast.error("Comment required");
        return false;
      }

      setSubmitting(true);

      const sentiment = analyzeSentiment(comment);

      const { error } = await supabase
        .from("business_reviews")
        .update({
          rating,
          comment: comment.trim(),
          sentiment,
        })
        .eq("id", reviewId)
        .eq("user_id", user.id);

      if (error) throw error;

      await loadReviews();
      toast.success("Review updated!");
      return true;
    } catch (err) {
      console.error("update review error:", err.message);
      toast.error("Could not update review.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  // Delete an existing review (only own review)
  async function deleteReview(reviewId) {
    try {
      if (!user) {
        toast.error("Login required");
        return false;
      }

      setSubmitting(true);

      const { error } = await supabase
        .from("business_reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", user.id);

      if (error) throw error;

      await loadReviews();
      toast.success("Review deleted.");
      return true;
    } catch (err) {
      console.error("delete review error:", err.message);
      toast.error("Could not delete review.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  // Helpful votes (one row per user per review, upsert)
  async function voteReviewHelpful(reviewId, helpful) {
    try {
      if (!user) {
        toast.error("Please log in to vote.");
        return navigate("/user-login");
      }

      const { error } = await supabase
        .from("business_review_votes")
        .upsert(
          {
            review_id: reviewId,
            user_id: user.id,
            helpful,
          },
          { onConflict: "review_id,user_id" }
        );

      if (error) throw error;

      await loadReviews();
    } catch (err) {
      console.error("vote helpful error:", err.message);
      toast.error("Could not register your vote.");
    }
  }

  // Owner reply (only business owner can reply)
  async function submitOwnerReply(reviewId, replyText) {
    try {
      if (!user || !business || business.owner_id !== user.id) {
        toast.error("Only the business owner can reply.");
        return false;
      }

      if (!replyText.trim()) {
        toast.error("Reply cannot be empty.");
        return false;
      }

      setSubmitting(true);

      const now = new Date().toISOString();

      const { error } = await supabase
        .from("business_reviews")
        .update({
          owner_reply: replyText.trim(),
          owner_reply_updated_at: now,
          owner_reply_created_at: now,
        })
        .eq("id", reviewId);

      if (error) throw error;

      await loadReviews();
      toast.success("Reply saved.");
      return true;
    } catch (err) {
      console.error("owner reply error:", err.message);
      toast.error("Could not save reply.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteOwnerReply(reviewId) {
    try {
      if (!user || !business || business.owner_id !== user.id) {
        toast.error("Only the business owner can delete replies.");
        return false;
      }

      setSubmitting(true);

      const { error } = await supabase
        .from("business_reviews")
        .update({
          owner_reply: null,
          owner_reply_created_at: null,
          owner_reply_updated_at: null,
        })
        .eq("id", reviewId);

      if (error) throw error;

      await loadReviews();
      toast.success("Reply deleted.");
      return true;
    } catch (err) {
      console.error("delete reply error:", err.message);
      toast.error("Could not delete reply.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClaim() {
    if (!user) {
      toast.error("Please log in as an owner to claim.");
      return navigate("/owner-login");
    }

    try {
      setClaiming(true);

      const { error } = await supabase.from("business_claims").insert({
        business_id: business.id,
        claimant_id: user.id,
        status: "pending",
      });

      if (error) {
        if (error.message.includes("duplicate key")) {
          toast("You’ve already claimed this business.");
        } else {
          throw error;
        }
      } else {
        toast.success("Claim submitted!");
        setClaimed(true);
      }
    } catch (err) {
      toast.error("Error submitting claim.");
    } finally {
      setClaiming(false);
    }
  }

  return {
    business,
    coords,
    loading,
    mapLoading,
    related,
    relatedLoading,
    relatedReason,
    user,
    isOwner,
    claiming,
    claimed,
    reviews,
    loadingReviews,
    newRating,
    setNewRating,
    newComment,
    setNewComment,
    newPhotos,
    setNewPhotos,
    submitting,
    formError,
    liked,
    likeCount,
    favorite,

    // derived
    liveInappropriate,
    liveSentiment,
    avgRating,
    directionsHref,

    // actions
    toggleLike,
    toggleFavorite,
    submitReview,
    updateReview,
    deleteReview,
    voteReviewHelpful,
    submitOwnerReply,
    deleteOwnerReply,
    handleClaim,
  };
}
