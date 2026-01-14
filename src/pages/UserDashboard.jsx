// src/pages/UserDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

// Sub-pages / components
import UserProfile from "@/components/user/UserProfile";
import UserFavorites from "@/components/user/UserFavorites";
import UserAvatarCropper from "@/components/user/UserAvatarCropper";

export default function UserDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    city: "",
    bio: "",
    avatar_url: "",
  });

  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarImageSrc, setAvatarImageSrc] = useState(null);
  const [avatarFileName, setAvatarFileName] = useState("avatar.jpg");
  const [savingAvatar, setSavingAvatar] = useState(false);

  // ------------------------------------------------------------
  // LOAD USER
  // ------------------------------------------------------------
  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigate("/user-login");
      return;
    }

    setUser(user);
    await loadProfile(user.id);
  }

  // Load user's favorites
  async function loadFavorites(uid) {
    const { data, error } = await supabase
      .from("favorites")
      .select(`
        business_id,
        businesses (
          id,
          name,
          category,
          village,
          image_url
        )
      `)
      .eq("user_id", uid);

    if (error) {
      console.error("loadFavorites error:", error.message);
      return [];
    }

    return data.map((row) => row.businesses);
  }

  async function loadProfile(uid) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    if (error) {
      toast.error("Failed to load profile");
      setLoading(false);
      return;
    }

    const favorites_list = await loadFavorites(uid);

    setProfile({ ...data, favorites_list });

    setForm({
      full_name: data.full_name || "",
      email: data.email || "",
      phone: data.phone || "",
      city: data.city || "",
      bio: data.bio || "",
      avatar_url: data.avatar_url || "",
    });

    setLoading(false);
  }

  // ------------------------------------------------------------
  // Avatar Upload
  // ------------------------------------------------------------
  async function uploadAvatar(file) {
    if (!file || !user) return null;

    const ext = file.name.split(".").pop();
    const filePath = `${user.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("user-avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("UPLOAD ERROR:", uploadError);
      toast.error("Avatar upload failed");
      return null;
    }

    const { data: pub } = supabase.storage
      .from("user-avatars")
      .getPublicUrl(filePath);

    return pub.publicUrl;
  }

  function handleAvatarFileSelect(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarImageSrc(url);
    setAvatarFileName(file.name || "avatar.jpg");
    setAvatarModalOpen(true);
  }

  function handleCloseAvatarModal() {
    if (avatarImageSrc) URL.revokeObjectURL(avatarImageSrc);
    setAvatarImageSrc(null);
    setAvatarFileName("avatar.jpg");
    setAvatarModalOpen(false);
  }

  async function handleAvatarCropped(croppedFile) {
    if (!croppedFile) return;

    try {
      setSavingAvatar(true);
      const uploadedUrl = await uploadAvatar(croppedFile);
      if (!uploadedUrl) throw new Error("Upload failed");

      await supabase
        .from("users")
        .update({ avatar_url: uploadedUrl })
        .eq("id", user.id);

      setForm((prev) => ({ ...prev, avatar_url: uploadedUrl }));
      setProfile((prev) => ({ ...prev, avatar_url: uploadedUrl }));

      toast.success("Profile photo updated!");
      handleCloseAvatarModal();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save photo");
    } finally {
      setSavingAvatar(false);
    }
  }

  // ------------------------------------------------------------
  // Save Profile
  // ------------------------------------------------------------
  async function saveProfile() {
    if (!user) return;

    setSavingProfile(true);

    const { error } = await supabase
      .from("users")
      .update({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        bio: form.bio,
        avatar_url: form.avatar_url,
      })
      .eq("id", user.id);

    setSavingProfile(false);

    if (error) {
      toast.error("Failed to update profile");
      return;
    }

    toast.success("Profile updated!");
    setEditing(false);
    loadProfile(user.id);
  }

  // ------------------------------------------------------------
  // Favorites
  // ------------------------------------------------------------
  async function handleRemoveFavorite(bizId) {
    if (!user) return;

    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("business_id", bizId);

    toast("Removed from favorites");
    loadProfile(user.id);
  }

  function handleOpenBusiness(bizId) {
    navigate(`/business/${bizId}`);
  }

  // ------------------------------------------------------------
  // Logout
  // ------------------------------------------------------------
  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/user-login");
  }

  // ------------------------------------------------------------
  // Loading Screen
  // ------------------------------------------------------------
  if (loading)
    return (
      <div className="
        min-h-screen flex items-center justify-center
        bg-slate-50 text-slate-700 
        dark:bg-slate-950 dark:text-slate-200
      ">
        Loading your profile...
      </div>
    );

  // ------------------------------------------------------------
  // RENDER UI
  // ------------------------------------------------------------
  return (
    <div
      className="
        min-h-screen pt-10 px-4 py-6 
        bg-slate-50 text-slate-700
        dark:bg-slate-950 dark:text-slate-200
        transition-colors
      "
    >
      {/* HEADER */}
      <div className="max-w-5xl mx-auto mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          User Dashboard
        </h1>
      </div>

      {/* BODY */}
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Profile Card */}
        <UserProfile
          profile={profile}
          form={form}
          setForm={setForm}
          editing={editing}
          setEditing={setEditing}
          saving={savingProfile}
          onSave={saveProfile}
          onAvatarFileSelect={handleAvatarFileSelect}
        />

        {/* Favorites */}
        <UserFavorites
          favorites={profile.favorites_list || []}
          onOpenBusiness={handleOpenBusiness}
          onRemoveFavorite={handleRemoveFavorite}
        />
      </div>

      {/* Avatar Cropper Modal */}
      <UserAvatarCropper
        isOpen={avatarModalOpen}
        imageSrc={avatarImageSrc}
        fileName={avatarFileName}
        onClose={handleCloseAvatarModal}
        onCropped={handleAvatarCropped}
        saving={savingAvatar}
      />
    </div>
  );
}
