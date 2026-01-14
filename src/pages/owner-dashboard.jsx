// -------------------------------------------------------------
// Owner Dashboard (Profile + Business List + AI Button)
// -------------------------------------------------------------
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

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

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);

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
        />
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Page Header (UPDATED – includes AI button)
// -------------------------------------------------------------
function PageHeader({ ownerProfile, onLogout }) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Business Dashboard
        </h1>
        {ownerProfile && (
          <p className="text-gray-400 text-sm mt-1">
            👋 Welcome,{" "}
            <span className="text-sky-400 font-medium">
              {ownerProfile.full_name}
            </span>{" "}
            ({ownerProfile.email})
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
        <h2 className="text-lg font-semibold">Profile Information</h2>
        <button
          onClick={() => setEditingProfile((prev) => !prev)}
          className="btn-shimmer bg-sky-600 hover:bg-sky-700 px-3 py-1.5 rounded text-xs sm:text-sm"
        >
          {editingProfile ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {!editingProfile ? (
        <div className="space-y-1.5 text-sm">
          <p>
            <span className="text-slate-400">Full Name:</span>{" "}
            <span className="font-medium">{ownerProfile?.full_name}</span>
          </p>
          <p>
            <span className="text-slate-400">Email:</span>{" "}
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
                ? "Saving..."
                : savedProfile
                ? "Saved!"
                : "Save Profile"}
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
function BusinessTable({ businesses, onEdit, onDelete }) {
  return (
    <section
      className="
        rounded-xl p-4 sm:p-5
        bg-white border border-slate-200 shadow-sm
        dark:bg-slate-900/70 dark:border-slate-800 dark:shadow-slate-950/40
        transition-colors
      "
    >
      <h2 className="text-lg font-semibold mb-3">Your Businesses</h2>

      {businesses.length === 0 ? (
        <p className="text-gray-400 text-sm">
          You haven’t added any businesses yet. Use the “Add New Business” button above.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead className="
                              border-t border-slate-200
                              dark:border-slate-800
                              hover:bg-slate-50
                              dark:hover:bg-slate-900/40
                              transition
                            "
                            >
              <tr>
                <th className="text-left p-3 font-medium text-slate-300">
                  Image
                </th>
                <th className="text-left p-3 font-medium text-slate-300">
                  Name
                </th>
                <th className="text-left p-3 font-medium text-slate-300">
                  Category
                </th>
                <th className="text-left p-3 font-medium text-slate-300">
                  City
                </th>
                <th className="text-left p-3 font-medium text-slate-300">
                  Phone
                </th>
                <th className="text-left p-3 font-medium text-slate-300">
                  Email
                </th>
                <th className="text-left p-3 font-medium text-slate-300">
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
                  <td className="p-3">
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
                  <td className="p-3 font-medium">{biz.name}</td>
                  <td className="p-3">{biz.category}</td>
                  <td className="p-3">{biz.village}</td>
                  <td className="p-3">{biz.phone}</td>
                  <td className="p-3">{biz.contact}</td>
                  <td className="p-3">
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
                 <td className="p-3 space-x-2 whitespace-nowrap">
                  <Link
                    to={`/owner/business-card/${biz.id}`}
                    className="btn-shimmer bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded text-xs text-white"
                  >
                    Card
                  </Link>

                  <button
                    onClick={() => onEdit(biz)}
                    className="btn-shimmer bg-amber-500 hover:bg-amber-600 px-3 py-1 rounded text-xs text-white"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => onDelete(biz.id)}
                    className="btn-shimmer bg-rose-600 hover:bg-rose-700 px-3 py-1 rounded text-xs text-white"
                  >
                    Delete
                  </button>
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
