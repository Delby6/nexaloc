// ---------------------------------------------------------
// src/pages/BusinessDetails.jsx (FULLY UPDATED FOR THEME)
// ---------------------------------------------------------
import React, { useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Toaster } from "react-hot-toast";

import Hero from "@/components/business/public/Hero/Hero";
import BusinessMap from "@/components/business/public/Map/BusinessMap";
import ReviewsSection from "@/components/business/public/Reviews/ReviewsSection";
import RelatedSection from "@/components/business/public/Related/RelatedSection";

import BusinessHeader from "@/components/business/details/BusinessHeader";
import ContactActions from "@/components/business/details/ContactActions";

import { useBusinessDetails } from "@/hooks/useBusinessDetails";
import { extractAIInsights } from "@/utils/aiInsights";
import BackButton from "@/components/ui/BackButton";

export default function BusinessDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
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
    liveInappropriate,
    liveSentiment,
    avgRating,
    directionsHref,
    toggleLike,
    toggleFavorite,
    submitReview,
    updateReview,
    deleteReview,
    voteReviewHelpful,
    submitOwnerReply,
    deleteOwnerReply,
    handleClaim,
  } = useBusinessDetails(id, navigate);

  // ----------------------------------------------------
  // Utility
  // ----------------------------------------------------
  const businessUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/business/${id}`;
  }, [id]);

  const qrCanvasRef = useRef(null);

  const downloadQR = useCallback(() => {
    if (!qrCanvasRef.current) return;
    const canvas = qrCanvasRef.current.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${business?.name || "business"}-qr.png`;
    a.click();
  }, [business?.name]);

  const smartBack = useCallback(() => {
    if (window.history.length > 2) navigate(-1);
    else navigate("/");
  }, [navigate]);

  const insights = useMemo(() => extractAIInsights(reviews), [reviews]);

  const reviewsRef = useRef(null);
  const mapRef = useRef(null);
  const relatedRef = useRef(null);

  const scrollToSection = (ref) => {
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ----------------------------------------------------
  // Loading / Not Found
  // ----------------------------------------------------
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        Loading…
      </div>
    );

  if (!business)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <p>Business not found.</p>
        <div className="mt-4">
          <BackButton label="Go back" fallback="/" />
        </div>
      </div>
    );

  // ----------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="
        min-h-screen 
        pt-2 
        bg-slate-50 text-slate-800 
        dark:bg-slate-950 dark:text-slate-200 
        transition-colors
      "
    >
      <Toaster position="top-center" />

      {/* ------------------------ Sticky Mini Header ------------------------ */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="
          hidden sm:flex sticky top-16 z-40 
          bg-white/80 dark:bg-slate-900/80 
          backdrop-blur-xl 
          border-b border-slate-200 dark:border-slate-800 
          shadow-sm px-4 py-2 
          items-center justify-between
        "
      >
        <div className="flex items-center gap-3 truncate">
          <BackButton label="Back" fallback="/" />
          <span className="text-sm font-medium truncate">{business.name}</span>
        </div>

        {avgRating > 0 && (
          <div className="flex items-center text-yellow-500 text-sm">
            ⭐ {avgRating.toFixed(1)}
            <span className="text-slate-500 dark:text-slate-400 ml-1 text-xs">
              ({reviews.length})
            </span>
          </div>
        )}
      </motion.div>

      {/* --------------------------- HERO SECTION --------------------------- */}
      <Hero business={business} />

      {/* ---------------------- Spotlight Card (Top) ----------------------- */}
      <section className="relative max-w-5xl mx-auto px-4 -mt-20 md:-mt-32 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="
            rounded-2xl p-6
            bg-white border border-slate-200 shadow-xl
            dark:bg-slate-900 dark:border-slate-800 dark:shadow-2xl
            backdrop-blur-xl
          "
        >
          <BusinessHeader
            business={business}
            businessUrl={businessUrl}
            isOwner={isOwner}
            onBack={smartBack}
            qrCanvasRef={qrCanvasRef}
            onDownloadQR={downloadQR}
          />

          <div className="mt-5 border-t border-slate-200 dark:border-slate-800 pt-4">
            <ContactActions
              liked={liked}
              likeCount={likeCount}
              favorite={favorite}
              onToggleLike={toggleLike}
              onToggleFavorite={toggleFavorite}
              business={business}
              directionsHref={directionsHref}
              user={user}
              claiming={claiming}
              claimed={claimed}
              onClaim={handleClaim}
            />
          </div>
        </motion.div>
      </section>

      {/* ------------------------ Main Content Wrapper ------------------------ */}
      <section className="max-w-5xl mx-auto px-4 mt-12 pb-20">

        {/* ------------------------ Bubble Navigation ------------------------ */}
        <motion.nav
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            flex items-center gap-3 overflow-x-auto mb-8
            bg-white border border-slate-200
            dark:bg-slate-900 dark:border-slate-800
            rounded-full px-3 py-2 shadow-sm
          "
        >
          <button
            onClick={() => scrollToSection(reviewsRef)}
            className="
              px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium
              bg-sky-600 text-white hover:bg-sky-500 transition
            "
          >
            Reviews
          </button>

          {coords && (
            <button
              onClick={() => scrollToSection(mapRef)}
              className="
                px-3 py-1.5 rounded-full text-xs sm:text-sm
                text-slate-700 dark:text-slate-300
                hover:bg-slate-100 dark:hover:bg-slate-800 transition
              "
            >
              Map & Location
            </button>
          )}

          <button
            onClick={() => scrollToSection(relatedRef)}
            className="
              px-3 py-1.5 rounded-full text-xs sm:text-sm
              text-slate-700 dark:text-slate-300
              hover:bg-slate-100 dark:hover:bg-slate-800 transition
            "
          >
            Related
          </button>

          <span className="ml-auto text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            Avg:{" "}
            <span className="font-semibold text-sky-600 dark:text-sky-400">
              {avgRating.toFixed(1)}
            </span>
            /5
          </span>
        </motion.nav>

        {/* --------------------------- AI INSIGHTS --------------------------- */}
        {insights && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="
              bg-sky-50 dark:bg-slate-800/70
              border border-sky-200 dark:border-slate-700
              rounded-xl p-4 mb-10
              shadow-sm
            "
          >
            <div className="font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-2">
              💡 AI Insights
            </div>

            {insights.positive?.length > 0 && (
              <p className="mt-2 text-slate-700 dark:text-slate-300 text-sm">
                People love:{" "}
                <span className="font-medium">
                  {insights.positive.join(", ")}
                </span>
              </p>
            )}

            {insights.negative?.length > 0 && (
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Some mentioned:{" "}
                <span className="font-medium">
                  {insights.negative.join(", ")}
                </span>
              </p>
            )}
          </motion.div>
        )}

        {/* --------------------------- REVIEWS --------------------------- */}
        <motion.div
          ref={reviewsRef}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            rounded-2xl p-6 mb-12
            bg-white border border-slate-200 shadow-xl
            dark:bg-slate-900 dark:border-slate-800 dark:shadow-xl
          "
        >
          <ReviewsSection
            user={user}
            navigate={navigate}
            reviews={reviews}
            loadingReviews={loadingReviews}
            newRating={newRating}
            setNewRating={setNewRating}
            newComment={newComment}
            setNewComment={setNewComment}
            newPhotos={newPhotos}
            setNewPhotos={setNewPhotos}
            liveInappropriate={liveInappropriate}
            liveSentiment={liveSentiment}
            formError={formError}
            submitting={submitting}
            submitReview={submitReview}
            updateReview={updateReview}
            deleteReview={deleteReview}
            isBusinessOwner={isOwner}
            voteReviewHelpful={voteReviewHelpful}
            submitOwnerReply={submitOwnerReply}
            deleteOwnerReply={deleteOwnerReply}
          />
        </motion.div>

        {/* ------------------------------ MAP ------------------------------ */}
        {coords && (
          <motion.div
            ref={mapRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="
              rounded-2xl p-6 mb-12
              bg-white border border-slate-200 shadow-xl
              dark:bg-slate-900 dark:border-slate-800 dark:shadow-xl
            "
          >
            <h2 className="text-lg font-semibold mb-4">
              Location & Map
            </h2>
            <BusinessMap coords={coords} mapLoading={mapLoading} />
          </motion.div>
        )}

        {/* --------------------------- RELATED --------------------------- */}
        <motion.div
          ref={relatedRef}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            rounded-2xl p-6
            bg-white border border-slate-200 shadow-xl
            dark:bg-slate-900 dark:border-slate-800 dark:shadow-xl
          "
        >
          <RelatedSection
            related={related}
            relatedLoading={relatedLoading}
            relatedReason={relatedReason}
            navigate={navigate}
          />
        </motion.div>
      </section>

      {/* ---------------------- MOBILE WRITE REVIEW CTA ---------------------- */}
      {user && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 sm:hidden z-40"
        >
          <button
            onClick={() =>
              document.getElementById("review-form")?.scrollIntoView({
                behavior: "smooth",
              })
            }
            className="
              w-full py-3 rounded-t-xl font-medium
              bg-sky-600 hover:bg-sky-700 text-white
              shadow-xl flex items-center justify-center gap-2
              transition
            "
          >
            ⭐ Write a Review
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
