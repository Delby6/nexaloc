// -------------------------------------------------------------
// Owner Dashboard (Profile + Business List + AI Button)
// -------------------------------------------------------------
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { QRCodeCanvas } from "qrcode.react";

// -------------------------------------------------------------
// Profile form initial state
// -------------------------------------------------------------
const initialProfileForm = {
  full_name: "",
  email: "",
  current_password: "",
  new_password: "",
};

// -------------------------------------------------------------
// Main Page Component
// -------------------------------------------------------------
export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [hoverQrId, setHoverQrId] = useState(null);
  const [modalBusiness, setModalBusiness] = useState(null);
  const [origin, setOrigin] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "";
  });
  const qrModalRef = useRef(null);

  // -----------------------------------------------------------
  // Load user, profile, businesses
  // -----------------------------------------------------------
  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        toast.error("Please log in again");
        navigate("/owner-login");
        return;
      }

      setUser(user);
      await Promise.all([loadOwnerProfile(user), fetchBusinesses(user)]);
    }

    loadData();
  }, [navigate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentOrigin = window.location.origin;
    if (currentOrigin !== origin) {
      setOrigin(currentOrigin);
    }
  }, [origin]);

  async function loadOwnerProfile(user) {
    const { data, error } = await supabase
      .from("owners")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    if (error) {
      toast.error("Failed to load profile");
      return;
    }

    setOwnerProfile(data);
    setProfileForm({
      full_name: data.full_name,
      email: data.email,
      current_password: "",
      new_password: "",
    });
  }

  async function fetchBusinesses(user) {
    setLoading(true);

    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load businesses");
      setBusinesses([]);
    } else {
      setBusinesses(data || []);
    }

    setLoading(false);
  }

  // -----------------------------------------------------------
  // Business handlers
  // -----------------------------------------------------------
  async function handleDelete(id) {
    if (!window.confirm("Delete this business?")) return;

    const { error } = await supabase.from("businesses").delete().eq("id", id);

    if (error) {
      toast.error("Delete failed");
      return;
    }

    toast.success("Deleted");
    if (user) fetchBusinesses(user);
  }

  function handleEdit(biz) {
    navigate(`/owner/business/${biz.id}/edit`);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/owner-login");
  }

  function handleOpenModal(biz) {
    setModalBusiness(biz);
  }

  function handleCloseModal() {
    setModalBusiness(null);
  }

  function handleDownload() {
    const canvas = qrModalRef.current?.querySelector("canvas");
    if (!canvas || !modalBusiness) return;
    const link = document.createElement("a");
    const fileName = modalBusiness?.name
      ? `${modalBusiness.name.replace(/\s+/g, "-").toLowerCase()}-qr.png`
      : "business-qr.png";
    link.href = canvas.toDataURL("image/png");
    link.download = fileName;
    link.click();
  }

  // -----------------------------------------------------------
  // Profile handlers
  // -----------------------------------------------------------
  function handleProfileChange(e) {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  }

  async function saveProfile() {
    if (!user) return;

    setSavingProfile(true);
    setSavedProfile(false);

    // If changing password, verify current password
    if (profileForm.new_password) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: profileForm.current_password,
      });

      if (signInError) {
        toast.error("Incorrect current password");
        setSavingProfile(false);
        return;
      }
    }

    // Update owners table
    const { error: ownerError } = await supabase
      .from("owners")
      .update({
        full_name: profileForm.full_name,
        email: profileForm.email,
      })
      .eq("id", user.id);

    if (ownerError) {
      toast.error("Failed to update profile");
      setSavingProfile(false);
      return;
    }

    // Update auth user (password/email)
    if (profileForm.new_password || profileForm.email !== user.email) {
      const { error: authError } = await supabase.auth.updateUser({
        email: profileForm.email,
        password: profileForm.new_password || undefined,
      });

      if (authError) {
        toast.error("Failed to update login details");
        setSavingProfile(false);
        return;
      }
    }

    toast.success("Profile updated!");
    setSavingProfile(false);
    setSavedProfile(true);
    setEditingProfile(false);
    setTimeout(() => setSavedProfile(false), 2000);
  }

  // -----------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-slate-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-300">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // Page render
  // -----------------------------------------------------------
  return (
     <div
        className="
          min-h-screen
          pt-24
          bg-slate-50 text-slate-700
          dark:bg-slate-950 dark:text-slate-200
          transition-colors
        "
      >
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          <PageHeader ownerProfile={ownerProfile} onLogout={handleLogout} />

          {/* Top section */}
          <div className="grid lg:grid-cols-[2fr,3fr] gap-6 items-start">
          <ProfileSection
            ownerProfile={ownerProfile}
            editingProfile={editingProfile}
            setEditingProfile={setEditingProfile}
            profileForm={profileForm}
            onProfileChange={handleProfileChange}
            onSaveProfile={saveProfile}
            savingProfile={savingProfile}
            savedProfile={savedProfile}
          />

      

          {/* Add Business Card */}
          {/*<section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg shadow-slate-950/40 flex flex-col justify-between">
            <Link
    to={`/owner/business-card/${biz.id}`}
    className="btn-shimmer bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded text-xs text-white"
  >
    Card
  </Link>
          </section>*/}
        </div>

        {/* Business table */}
        <BusinessTable
          businesses={businesses}
          onEdit={handleEdit}
          onDelete={handleDelete}
          hoverQrId={hoverQrId}
          origin={origin}
          onHover={setHoverQrId}
          onOpenModal={handleOpenModal}
        />
        {modalBusiness && origin && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-4 text-center shadow-2xl dark:bg-slate-900">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {modalBusiness.name}
              </h3>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {t("scan_open_listing")}
              </p>
              <div
                ref={qrModalRef}
                className="mx-auto max-w-[90vw] rounded-2xl bg-white p-4 shadow dark:bg-slate-900"
              >
                <QRCodeCanvas
                  value={`${origin}/business/${modalBusiness.id}`}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="flex items-center justify-center gap-3 text-sm">
                <button
                  onClick={handleCloseModal}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-200"
                >
                  Close
                </button>
                <button
                  onClick={handleDownload}
                  className="rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Page Header (UPDATED – includes AI button)
// -------------------------------------------------------------
function PageHeader({ ownerProfile, onLogout }) {
  const { t } = useTranslation();
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("business_dashboard_title")}
        </h1>
        {ownerProfile && (
          <p className="text-gray-400 text-sm mt-1">
            {t("business_dashboard_welcome", {
              name: ownerProfile.full_name,
              email: ownerProfile.email,
            })}
          </p>
        )}
      </div>


    </header>
  );
}

// -------------------------------------------------------------
// Profile section
// -------------------------------------------------------------
function ProfileSection({
  ownerProfile,
  editingProfile,
  setEditingProfile,
  profileForm,
  onProfileChange,
  onSaveProfile,
  savingProfile,
  savedProfile,
}) {
  const { t } = useTranslation();
  return (
    <section
      className="
        rounded-xl p-4 sm:p-5
        bg-white border border-slate-200 shadow-sm
        dark:bg-slate-900/70 dark:border-slate-800 dark:shadow-slate-950/40
        transition-colors
      "
    >

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{t("profile_information")}</h2>
        <button
          onClick={() => setEditingProfile((prev) => !prev)}
          className="btn-shimmer bg-sky-600 hover:bg-sky-700 px-3 py-1.5 rounded text-xs sm:text-sm"
        >
          {editingProfile ? t("Cancel") : t("edit_profile")}
        </button>
      </div>

      {!editingProfile ? (
        <div className="space-y-1.5 text-sm">
          <p>
            <span className="text-slate-400">{t("profile_full_name")}:</span>{" "}
            <span className="font-medium">{ownerProfile?.full_name}</span>
          </p>
          <p>
            <span className="text-slate-400">{t("profile_email")}:</span>{" "}
            <span className="font-medium">{ownerProfile?.email}</span>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* FULL Name */}
          <input
            type="text"
            name="full_name"
            value={profileForm.full_name}
            onChange={onProfileChange}
            placeholder="Full Name"
            className="
              w-full px-3 py-2 rounded-lg text-sm
              bg-white border border-slate-300 text-slate-800
              dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
              transition-colors
            "
          />

          {/* EMAIL */}
          <input
            type="email"
            name="email"
            value={profileForm.email}
            onChange={onProfileChange}
            placeholder="Email"
            className="
              w-full px-3 py-2 rounded-lg text-sm
              bg-white border border-slate-300 text-slate-800
              dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
              transition-colors
            "
          />

          {/* CURRENT PASSWORD */}
          <input
            type="password"
            name="current_password"
            value={profileForm.current_password}
            onChange={onProfileChange}
            placeholder="Current Password"
            className="
              w-full px-3 py-2 rounded-lg text-sm
              bg-white border border-slate-300 text-slate-800
              dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
              transition-colors
            "
          />

          {/* NEW PASSWORD */}
          <input
            type="password"
            name="new_password"
            value={profileForm.new_password}
            onChange={onProfileChange}
            placeholder="New Password"
            className="
              w-full px-3 py-2 rounded-lg text-sm
              bg-white border border-slate-300 text-slate-800
              dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
              transition-colors
            "
          />
          <div className="relative mt-1">
            <button
              onClick={onSaveProfile}
              disabled={savingProfile}
              className={`relative overflow-hidden btn-shimmer ${
                savingProfile || savedProfile
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              } px-4 py-2 rounded w-full flex items-center justify-center ${
                savingProfile ? "animate-pulse shimmer-effect" : ""
              }`}
            >
              {savingProfile ? (
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4 mr-2" />
              ) : savedProfile ? (
                <span className="text-green-400 text-lg mr-2">✔</span>
              ) : null}
              {savingProfile
            ? t("Saving...")
            : savedProfile
            ? t("Saved successfully!")
            : t("save_profile")}
            </button>

            <p
              className={`absolute left-0 right-0 text-green-400 text-xs text-center mt-2 transform transition-all duration-700 ${
                savedProfile
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              }`}
            >
              Saved successfully!
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

// -------------------------------------------------------------
// Business Table
// -------------------------------------------------------------
function BusinessTable({
  businesses,
  onEdit,
  onDelete,
  hoverQrId,
  origin,
  onHover,
  onOpenModal,
}) {
  const { t } = useTranslation();
  return (
    <section
      className="
        rounded-xl p-4 sm:p-5
        bg-white border border-slate-200 shadow-sm
        dark:bg-slate-900/70 dark:border-slate-800 dark:shadow-slate-950/40
        transition-colors
      "
    >
      <h2 className="text-lg font-semibold mb-3">{t("your_businesses")}</h2>

      {businesses.length === 0 ? (
        <p className="text-gray-400 text-sm">
          You haven’t added any businesses yet. Use the “Add New Business” button above.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="min-w-full text-sm">
            <thead className="
                              border-t border-slate-200
                              dark:border-slate-800
                              hover:bg-slate-50
                              dark:hover:bg-slate-900/40
                              transition
                            "
                            >
              <tr>
                <th className="text-left p-3 font-medium text-slate-300 hidden sm:table-cell">
                  Image
                </th>
                <th className="text-left p-3 font-medium text-slate-300">
                  Name
                </th>
                <th className="text-left p-3 font-medium text-slate-300 hidden sm:table-cell">
                  Category
                </th>
                <th className="text-left p-3 font-medium text-slate-300 hidden lg:table-cell">
                  City
                </th>
                <th className="text-left p-3 font-medium text-slate-300 hidden md:table-cell">
                  Phone
                </th>
                <th className="text-left p-3 font-medium text-slate-300 hidden lg:table-cell">
                  Email
                </th>
                <th className="text-left p-3 font-medium text-slate-300 hidden lg:table-cell">
                  Website
                </th>
                <th className="text-left p-3 font-medium text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((biz) => (
                <tr
                  key={biz.id}
                  className="border-t border-slate-800 hover:bg-slate-900/70 transition"
                >
                  <td className="p-3 hidden sm:table-cell">
                    {biz.image_url ? (
                      <img
                        src={biz.image_url}
                        alt={biz.name}
                        className="w-14 h-14 object-cover rounded-md border border-slate-700"
                      />
                    ) : (
                      <span className="text-gray-500 text-xs">No image</span>
                    )}
                  </td>
                  <td className="p-3 font-medium">
                    <div>{biz.name}</div>
                    <p className="text-xs text-slate-400 sm:hidden">
                      {biz.category} · {biz.village}
                    </p>
                  </td>
                  <td className="p-3 hidden sm:table-cell">{biz.category}</td>
                  <td className="p-3 hidden lg:table-cell">{biz.village}</td>
                  <td className="p-3 hidden md:table-cell">{biz.phone}</td>
                  <td className="p-3 hidden lg:table-cell">{biz.contact}</td>
                  <td className="p-3 hidden lg:table-cell">
                    {biz.website ? (
                      <a
                        href={biz.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 underline"
                      >
                        Site
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-3 relative">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
                      <Link
                        to={`/owner/business-card/${biz.id}`}
                        className="w-full rounded-xl bg-sky-600 px-3 py-1 text-center text-xs font-semibold text-white transition hover:bg-sky-700 sm:w-auto"
                      >
                        {t("action_card")}
                      </Link>
                      <button
                        type="button"
                        onMouseEnter={() => onHover(biz.id)}
                        onMouseLeave={() => onHover(null)}
                        onClick={() => onOpenModal(biz)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1 text-center text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 sm:w-auto"
                      >
                        {t("action_qr")}
                      </button>
                      <button
                        onClick={() => onEdit(biz)}
                        className="w-full rounded-xl bg-amber-500 px-3 py-1 text-center text-xs font-semibold text-white transition hover:bg-amber-600 sm:w-auto"
                      >
                        {t("action_edit")}
                      </button>
                      <button
                        onClick={() => onDelete(biz.id)}
                        className="w-full rounded-xl bg-rose-600 px-3 py-1 text-center text-xs font-semibold text-white transition hover:bg-rose-700 sm:w-auto"
                      >
                        {t("action_delete")}
                      </button>
                    </div>
                    {hoverQrId === biz.id && origin && (
                      <div className="absolute top-full left-0 mt-1 z-10 w-32 rounded-xl border border-slate-300 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                        <QRCodeCanvas
                          value={`${origin}/business/${biz.id}`}
                          size={80}
                          level="M"
                        />
                      </div>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
