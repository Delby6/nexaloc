// src/pages/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

import DashboardContent from "@/components/owner/DashboardContent";
import ClaimsContent from "@/components/common/ClaimsContent";

import { LogOut, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  // ------ AUTH STATE ------
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // ------ DATA STATE ------
  const [businesses, setBusinesses] = useState([]);
  const [claims, setClaims] = useState([]);
  const [fetchingBusinesses, setFetchingBusinesses] = useState(false);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // ------ BUSINESS EDIT STATE ------
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingRow, setSavingRow] = useState(false);

  // =========================================
  //  REAL ADMIN AUTH CHECK
  // =========================================
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error)
         {
          console.error("Session error:", error.message);
        }

        const session = data?.session;
        if (!session?.user) {
          navigate("/admin-login");
          return;
        }

        // Check admin_users table
        const { data: adminRow, error: adminError } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", session.user.id)
          .single();

        if (adminError || !adminRow) {
          console.warn("Not an admin, redirecting home");
          navigate("/");
          return;
        }

        // Admin confirmed → load data
        setIsAuthorized(true);
        await Promise.all([fetchBusinesses(), fetchClaims()]);
      } catch (err) {
        console.error("Admin check failed:", err.message);
        navigate("/");
      } finally {
        setCheckingSession(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  // =========================================
  //  FETCH BUSINESSES
  // =========================================
  async function fetchBusinesses() {
    try {
      setFetchingBusinesses(true);

      const { data, error } = await supabase
        .from("businesses")
        .select(
          `
          id,
          name,
          village,
          category,
          description,
          contact,
          website,
          phone,
          hours,
          image_url,
          image_path,
          owner_id,
          created_at
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
    } catch (err) {
      console.error("Error fetching businesses:", err.message);
      toast.error("Failed to load businesses");
    } finally {
      setFetchingBusinesses(false);
    }
  }

  // =========================================
  //  FETCH CLAIMS  (MATCHES YOUR CURRENT SCHEMA)
  // =========================================
  // ---------- Fetch Claims using the view ----------
async function fetchClaims() {
  try {
    setClaimsLoading(true);

    const { data, error } = await supabase
      .from("admin_business_claims_view")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Map flat view rows back into the nested shape
    // that ClaimsContent and the approve/reject logic expect.
    const mapped = (data || []).map((row) => ({
      id: row.id,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      reviewed_at: row.reviewed_at,
      business_id: row.business_id,
      claimant_id: row.claimant_id,
      business: {
        id: row.business_id,
        name: row.business_name,
        village: row.business_village,
        category: row.business_category,
        image_url: row.business_image_url,
      },
      claimant: {
        id: row.claimant_id,
        email: row.claimant_email,
      },
    }));

    setClaims(mapped);
  } catch (err) {
    console.error("Supabase Claims Error:", err);
    toast.error("Failed to load claims");
  } finally {
    setClaimsLoading(false);
  }
}




  // =========================================
  //  BUSINESS EDITING HELPERS
  // =========================================

  const startEdit = (biz) => {
    setEditing(biz.id);
    setEditForm({
      ...biz,
      website: biz.website ?? "",
      phone: biz.phone ?? "",
      hours: biz.hours ?? "",
      newImageFile: null,
      newImagePreview: null,
    });
  };

  const cancelEdit = () => {
    if (editForm.newImagePreview) {
      URL.revokeObjectURL(editForm.newImagePreview);
    }
    setEditing(null);
    setEditForm({});
  };

  function handleImageSelection(e, biz) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: confirm replace
    if (biz.image_url && !window.confirm("Replace existing image?")) return;

    const previewUrl = URL.createObjectURL(file);
    setEditForm((prev) => ({
      ...prev,
      id: biz.id,
      newImageFile: file,
      newImagePreview: previewUrl,
    }));
  }

  async function handleImageDelete(biz) {
    if (!biz.image_path) {
      alert("No image to delete.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this business image permanently?"
      )
    )
      return;

    try {
      const { error: removeErr } = await supabase.storage
        .from("business-images")
        .remove([biz.image_path]);

      if (removeErr) throw removeErr;

      const { error: updateErr } = await supabase
        .from("businesses")
        .update({ image_url: null, image_path: null })
        .eq("id", biz.id);

      if (updateErr) throw updateErr;

      setBusinesses((prev) =>
        prev.map((b) =>
          b.id === biz.id ? { ...b, image_url: null, image_path: null } : b
        )
      );
      toast.success("Image deleted");
    } catch (err) {
      console.error("Image delete failed:", err.message);
      toast.error("Failed to delete image");
    }
  }

  async function handleSave(biz) {
    try {
      setSavingRow(true);

      let imageUrl = biz.image_url;
      let imagePath = biz.image_path;

      // Upload new image if chosen
      if (editForm.newImageFile) {
        const file = editForm.newImageFile;
        const cleanName = file.name.replace(/\s+/g, "-");
        const filePath = `uploads/business-${biz.id}-${Date.now()}-${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from("business-images")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicData, error: urlError } = supabase.storage
          .from("business-images")
          .getPublicUrl(filePath);

        if (urlError) throw urlError;

        imageUrl = publicData.publicUrl;
        imagePath = filePath;
      }

      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          name: editForm.name,
          village: editForm.village,
          category: editForm.category,
          contact: editForm.contact,
          description: editForm.description,
          website: editForm.website,
          phone: editForm.phone,
          hours: editForm.hours,
          image_url: imageUrl,
          image_path: imagePath,
        })
        .eq("id", biz.id);

      if (updateError) throw updateError;

      setBusinesses((prev) =>
        prev.map((b) =>
          b.id === biz.id
            ? { ...b, ...editForm, image_url: imageUrl, image_path: imagePath }
            : b
        )
      );

      cancelEdit();
      toast.success("Business updated");
    } catch (err) {
      console.error("Update failed:", err.message);
      toast.error("Failed to update business");
    } finally {
      setSavingRow(false);
    }
  }

  async function deleteBusiness(id) {
    if (!window.confirm("Are you sure you want to delete this business?"))
      return;

    try {
      const { error } = await supabase
        .from("businesses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setBusinesses((prev) => prev.filter((b) => b.id !== id));
      toast.success("Business deleted");
    } catch (err) {
      console.error("Delete failed:", err.message);
      toast.error("Failed to delete business");
    }
  }

  // =========================================
  //  ANALYTICS FOR DASHBOARD
  // =========================================
  const analytics = useMemo(() => {
    const byCategory = {};
    const byLocal = {};

    businesses.forEach((b) => {
      if (b.category) {
        byCategory[b.category] = (byCategory[b.category] || 0) + 1;
      }
      if (b.village) {
        byLocal[b.village] = (byLocal[b.village] || 0) + 1;
      }
    });

    return { byCategory, byLocal };
  }, [businesses]);

  const chartDataCategory = Object.entries(analytics.byCategory).map(
    ([category, count]) => ({ category, count })
  );
  const chartDataLocal = Object.entries(analytics.byLocal).map(
    ([village, count]) => ({ village, count })
  );

  const colors = ["#0284c7", "#22c55e", "#eab308", "#f97316", "#a855f7"];

  const pendingCount = claims.filter((c) => c.status === "pending").length;

  // =========================================
  //  LOGOUT
  // =========================================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // =========================================
  //  LOADING / AUTH GUARD
  // =========================================
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Checking session...
      </div>
    );
  }

  if (!isAuthorized) {
    // In practice you'll already have been redirected by now.
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-700">
        <p>Unauthorized. Please log in as an admin.</p>
      </div>
    );
  }

  // =========================================
  //  RENDER
  // =========================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-sky-700 dark:text-sky-400">
          Nexaloc Admin Dashboard
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-300 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === "dashboard"
              ? "bg-sky-600 text-white"
              : "hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          Dashboard
        </button>

        <button
          onClick={() => setActiveTab("claims")}
          className={`relative px-4 py-2 rounded-lg font-medium ${
            activeTab === "claims"
              ? "bg-sky-600 text-white"
              : "hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          Claims Review
          {pendingCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <Link
          to="/admin/cookie-logs"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          View Cookie Consent
        </Link>

      </div>

      {/* Tab Bodies */}
      {activeTab === "dashboard" && (
        <DashboardContent
          businesses={businesses}
          fetching={fetchingBusinesses}
          startEdit={startEdit}
          deleteBusiness={deleteBusiness}
          editing={editing}
          editForm={editForm}
          setEditForm={setEditForm}
          handleSave={handleSave}
          cancelEdit={cancelEdit}
          handleImageSelection={handleImageSelection}
          handleImageDelete={handleImageDelete}
          chartDataCategory={chartDataCategory}
          chartDataLocal={chartDataLocal}
          colors={colors}
          savingRow={savingRow}
        />
      )}

      {activeTab === "claims" && (
        <ClaimsContent
          claims={claims}
          claimsLoading={claimsLoading}
          fetchClaims={fetchClaims}
          onBusinessesChanged={fetchBusinesses}
        />
      )}
    </div>
  );
}
