import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/lib/supabaseClient";
import NexalocLogo from "@/components/common/NexalocLogo";
import DarkModeToggle from "@/components/common/DarkModeToggle";
import {
  Menu,
  X,
  ChevronDown,
  Upload,
  Bell,
  Search,
  Home,
  LayoutDashboard,
  Globe2,
  HelpCircle,
  LogIn,
  Settings,
  Tag,
} from "lucide-react";
import { useNotificationsContext } from "@/providers/NotificationsProvider";




export default function Navbar({ onToggleSidebar }) {
  const role = useRole();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState("");

  const [globalSearch, setGlobalSearch] = useState("");
  const ENABLE_GLOBAL_SEARCH = false;

  const profileMenuRef = useRef(null);
  const { unreadCount } = useNotificationsContext();

  /* -----------------------------------------------
     LOAD AUTH USER + ROLE-BASED PROFILE
  ------------------------------------------------ */
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // prevent duplicate fetch for same user
      if (user.id === userId) return;

      setUserEmail(user.email);
      setUserId(user.id);

      let profile = null;

      if (role === "user") {
        const { data } = await supabase
          .from("users")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();
        profile = data;
      }

      if (role === "owner") {
        const { data } = await supabase
          .from("owners")
          .select("full_name")
          .eq("id", user.id)
          .single();
        profile = data;
      }

      if (role === "operator") {
        const { data } = await supabase
          .from("operators")
          .select("full_name, email")
          .eq("user_id", user.id)
          .single();
        profile = data;
      }

      if (role === "admin") {
        profile = { full_name: "Admin", avatar_url: null };
      }

      if (profile) {
        setFullName(profile.full_name || "");
        setAvatarUrl(profile.avatar_url || "");
      }
    }

    loadUser();
  }, [role, navigate]);

  /* -----------------------------------------------
     LOAD UNREAD NOTIFICATION COUNT
     Using ONE unified 'notifications' table
  ------------------------------------------------ */
  /*useEffect(() => {
    if (!userId || role === "guest") return;

    async function loadCount() {
      const { data, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .eq("scope", role)
        .eq("read", false);

      if (!error) setUnreadCount(data.length);
    }

    loadCount();
  }, [userId, role]);*/

  /* -----------------------------------------------
     REAL-TIME NOTIFICATIONS
     Single table, filtered by user_id + scope
  ------------------------------------------------ */
  /*useEffect(() => {
    if (!userId || role === "guest") return;

    const channel = supabase
      .channel(`realtime-notifs-${role}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new.scope === role) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, role]);*/

  /* -----------------------------------------------
     CLICK OUTSIDE TO CLOSE PROFILE MENU
  ------------------------------------------------ */
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* -----------------------------------------------
     AVATAR UPLOAD (only end users)
  ------------------------------------------------ */
  async function handleUpload() {
    if (!uploadFile || !userId) return;

    const ext = uploadFile.name.split(".").pop();
    const filePath = `avatars/${userId}.${ext}`;

    const { error } = await supabase.storage
      .from("profile-images")
      .upload(filePath, uploadFile, { upsert: true });

    if (error) return;

    const { data: publicData } = supabase.storage
      .from("profile-images")
      .getPublicUrl(filePath);

    if (role === "user") {
      await supabase
        .from("users")
        .update({ avatar_url: publicData.publicUrl })
        .eq("id", userId);
    }

    setAvatarUrl(publicData.publicUrl);
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadPreview("");
  }

  async function handleRemovePhoto() {
    if (!userId) return;

    if (role === "user") {
      await supabase
        .from("users")
        .update({ avatar_url: null })
        .eq("id", userId);
    }

    setAvatarUrl("");
    setUploadPreview("");
    setShowUploadModal(false);
  }

  /* -----------------------------------------------
     LOGOUT
  ------------------------------------------------ */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/user-login");
  };

  /* -----------------------------------------------
     GLOBAL SEARCH
  ------------------------------------------------ */
  /* -----------------------------------------------
   GLOBAL SEARCH  ✅ FIXED
------------------------------------------------ */
function triggerGlobalSearch() {
  const q = globalSearch.trim();
  if (!q) return;

  const params = new URLSearchParams({
    search: q,
    role,                     // role-aware
    uid: userId || "",         // user context
    t: Date.now().toString(),  // force rerun even on same route
  });

  navigate(`/platform?${params.toString()}`);
  setMobileOpen(false);
}


  /* -----------------------------------------------
     ROLE COLORS + MENUS
  ------------------------------------------------ */
  const roleColorMap = {
    guest: "text-sky-500",
    user: "text-sky-500",
    owner: "text-emerald-500",
    admin: "text-red-500",
    operator: "text-amber-500",
  };

  const iconColorClass = roleColorMap[role] ?? "text-sky-500";

  const menus = {
    guest: [
      { label: "Home", to: "/", icon: Home },
      { label: "Platform", to: "/platform", icon: Globe2 },
      { label: "How It Works", to: "/how-it-works", icon: HelpCircle },
      { label: "Login", to: "/user-login", icon: LogIn },
    ],
    user: [
      { label: "Platform", to: "/platform", icon: Globe2 },
      { label: "Dashboard", to: "/user-dashboard", icon: LayoutDashboard },
    ],
    owner: [
      { label: "Platform", to: "/platform", icon: Globe2 },
      { label: "Dashboard", to: "/owner-dashboard", icon: LayoutDashboard },
      { label: "Pricing", to: "/pricing", icon: Tag }, 
    ],
    admin: [
      { label: "Platform", to: "/platform", icon: Globe2 },
      { label: "Dashboard", to: "/admin-dashboard", icon: LayoutDashboard },
    ],
    operator: [
      { label: "Platform", to: "/platform", icon: Globe2 },
      { label: "Dashboard", to: "/operator-dashboard", icon: LayoutDashboard }, 
      { label: "Pricing", to: "/pricing", icon: Tag }, 
    ],
  };

  const items = menus[role] ?? menus.guest;
  const logoRoute = role === "guest" ? "/" : "/platform";

  const roleLabel = {
    guest: "Guest",
    user: "User",
    owner: "Owner",
    admin: "Admin",
    operator: "Operator",
  }[role];

  const avatarInitial = fullName
    ? fullName.charAt(0).toUpperCase()
    : userEmail?.charAt(0).toUpperCase() || "U";

  return (
    <>
      {/* NAVBAR */}
      <header
        className="
          fixed top-0 left-0 right-0 z-40 
          bg-white/80 dark:bg-slate-900/80 
          border-b border-slate-200 dark:border-slate-800 
          backdrop-blur-xl transition-colors
        "
      >
        {/* Tiny gradient line */}
        <div className="h-[1px] w-full bg-gradient-to-r from-sky-500/20 via-cyan-400/20 to-transparent" />

        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 py-3">
          {/* LEFT */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen((p) => !p)}
              className="md:hidden text-slate-600 dark:text-slate-300 hover:text-sky-500"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <NavLink to={logoRoute}>
              <NexalocLogo />
            </NavLink>

            {role !== "guest" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {roleLabel}
              </span>
            )}
          </div>

          {/* CENTER (desktop nav) */}
          <nav className="hidden md:block">
            <ul className="flex items-center gap-6">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className="relative text-sm group inline-flex items-center"
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`
                            inline-flex items-center gap-1.5
                            ${
                              isActive
                                ? "text-sky-600 dark:text-sky-400 font-medium"
                                : "text-slate-600 dark:text-slate-300 group-hover:text-sky-500"
                            }
                          `}
                        >
                          {item.icon && (
                            <item.icon
                              className={`w-4 h-4 ${iconColorClass}`}
                            />
                          )}
                          <span>{item.label}</span>
                        </span>
                        <span
                          className={`
                            absolute left-0 -bottom-0.5 h-[2px] w-full rounded-full
                            bg-sky-500 dark:bg-sky-400 
                            transition-transform duration-200
                            ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}
                          `}
                        />
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            {/* GLOBAL SEARCH (desktop only) */}
            <div className="hidden lg:block">
               {/* 
               <div className="relative">
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && triggerGlobalSearch()}
                  placeholder="Search network…"
                  className="
                    w-52 pl-8 pr-3 py-1.5 rounded-full text-xs
                    bg-white/70 dark:bg-slate-900/70
                    border border-slate-200 dark:border-slate-700
                    text-slate-800 dark:text-slate-100
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none
                  "
                />
                <button
                  onClick={triggerGlobalSearch}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
                >
                  <Search size={14} />
                </button>
              </div>
              */}
            </div>

            {/* NOTIF BELL */}
            {role !== "guest" && (
              <button
                onClick={() => navigate(`/notifications/${role}`)}
                className="relative text-slate-600 dark:text-slate-300 hover:text-sky-500"
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span
                    className="
                      absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full 
                      bg-red-500 text-white text-[10px] font-semibold
                      flex items-center justify-center
                    "
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            <DarkModeToggle />

            {role === "guest" && (
              <button
                onClick={() => navigate("/join")}
                className="hidden sm:block bg-sky-600 text-white px-4 py-1.5 rounded-lg text-sm shadow hover:bg-sky-700"
              >
                Join the Network
              </button>
            )}

            {/* PROFILE */}
            {role !== "guest" && (
              <div ref={profileMenuRef} className="relative">
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className="
                    flex items-center gap-2 px-2 py-1.5 rounded-full
                    border border-slate-200 dark:border-slate-700
                    bg-white/70 dark:bg-slate-900/80
                  "
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover object-center"
                    />
                  ) : (
                    <div
                      className="
                        w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500
                        text-white flex items-center justify-center text-sm font-semibold
                      "
                    >
                      {avatarInitial}
                    </div>
                  )}

                  <ChevronDown
                    size={16}
                    className="text-slate-500 dark:text-slate-300"
                  />
                </button>

                {profileOpen && (
                  <div
                    className="
                      absolute right-0 mt-2 w-60 rounded-xl
                      bg-white dark:bg-slate-900
                      border border-slate-200 dark:border-slate-700
                      shadow-xl py-2 z-50
                    "
                  >
                    <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Signed in as
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {fullName || userEmail}
                      </p>
                    </div>

                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Upload size={16} />
                      Change profile photo
                    </button>

                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/settings");
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Settings size={16} />
                      Settings
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MOBILE NAV — slide-down animation */}
        <div
          className={`
            md:hidden overflow-hidden transition-[max-height] duration-300 
            bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800
            ${mobileOpen ? "max-h-64" : "max-h-0"}
          `}
        >
          <div className={`px-4 ${mobileOpen ? "py-3" : "py-0"} flex flex-col gap-3`}>
            {/* Global search in mobile */}
            <div className="flex items-center gap-2">
              {/*
              <div className="relative flex-1">
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && triggerGlobalSearch()}
                  placeholder="Search network…"
                  className="
                    w-full pl-8 pr-3 py-2 rounded-full text-xs
                    bg-white/80 dark:bg-slate-900/80
                    border border-slate-300 dark:border-slate-700
                    text-slate-800 dark:text-slate-100
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none
                  "
                />
                <button
                  onClick={triggerGlobalSearch}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
                >
                  <Search size={14} />
                </button>
              </div>
              */}
            </div>

            {/* Links */}
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {item.icon && <item.icon className={`w-4 h-4 ${iconColorClass}`} />}
                  <span>{item.label}</span>
                </NavLink>
              ))}

              {role === "guest" && (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/join");
                  }}
                  className="mt-1 bg-sky-600 text-white px-3 py-2 rounded-lg text-left text-sm"
                >
                  Join the Network
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* UPLOAD AVATAR MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-[90%] max-w-md border border-slate-300 dark:border-slate-700 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Update profile photo</h2>

            <div className="flex flex-col items-center gap-4">
              {uploadPreview ? (
                <img
                  src={uploadPreview}
                  alt="preview"
                  className="w-32 h-32 rounded-full object-cover shadow"
                />
              ) : avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="current"
                  className="w-32 h-32 rounded-full object-cover shadow"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-700" />
              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (!e.target.files?.[0]) return;
                  setUploadFile(e.target.files[0]);
                  setUploadPreview(URL.createObjectURL(e.target.files[0]));
                }}
                className="text-xs"
              />

              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleRemovePhoto}
                  className="px-4 py-2 rounded-lg text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Remove photo
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setUploadPreview("");
                  }}
                  className="px-4 py-2 rounded-lg text-xs bg-slate-200 dark:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="px-4 py-2 rounded-lg text-xs bg-sky-600 text-white hover:bg-sky-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}