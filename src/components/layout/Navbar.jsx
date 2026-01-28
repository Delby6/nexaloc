import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/lib/supabaseClient";
import NexalocLogo from "@/components/common/NexalocLogo";
import DarkModeToggle from "@/components/common/DarkModeToggle";
import flagEn from "@/assets/flags/en.svg";
import flagFr from "@/assets/flags/fr.svg";
import flagPl from "@/assets/flags/pl.svg";
import { useTranslation } from "react-i18next";
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
  MessageSquare,
  Activity,
} from "lucide-react";
import { useNotificationsContext } from "@/providers/NotificationsProvider";
import {
  OWNER_CHAT_MESSAGES_TABLE,
  OWNER_CHAT_THREADS_TABLE,
} from "@/utils/chatTables";




export default function Navbar({ onToggleSidebar }) {
  const { t, i18n } = useTranslation();
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

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
        profile = { full_name: t("Admin"), avatar_url: null };
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
  setMobileSearchOpen(false);
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

  const dashboardRouteMap = {
    user: "/user-dashboard",
    owner: "/owner-dashboard",
    admin: "/admin-dashboard",
    operator: "/operator-dashboard",
  };

  const chatRouteMap = {
    user: "/user/messages",
    owner: "/owner/messages",
  };

  useEffect(() => {
    if (role !== "user" && role !== "owner") {
      setChatUnreadCount(0);
      return;
    }
    if (!userId) return;

    let channel;
    let threadChannel;
    let active = true;

    async function loadUnread() {
      const viewName =
        role === "owner"
          ? "owner_chat_unread_message_counts"
          : "user_chat_unread_message_counts";

      const { data, error } = await supabase
        .from(viewName)
        .select("unread_count")
        .eq(role === "owner" ? "owner_id" : "user_id", userId)
        .maybeSingle();

      if (!active) return;
      if (error) {
        setChatUnreadCount(0);
        return;
      }

      setChatUnreadCount(data?.unread_count ?? 0);
    }

    loadUnread();

    channel = supabase.channel(`chat-unread-${role}-${userId}`);
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: OWNER_CHAT_MESSAGES_TABLE,
      },
      () => {
        loadUnread();
      }
    );
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: OWNER_CHAT_MESSAGES_TABLE,
      },
      () => {
        loadUnread();
      }
    );
    channel.subscribe();

    threadChannel = supabase.channel(`chat-reads-${role}-${userId}`);
    threadChannel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: OWNER_CHAT_THREADS_TABLE,
        filter: `${role === "owner" ? "owner_id" : "user_id"}=eq.${userId}`,
      },
      () => {
        loadUnread();
      }
    );
    threadChannel.subscribe();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
      if (threadChannel) supabase.removeChannel(threadChannel);
    };
  }, [role, userId]);

  const menus = {
    guest: [
      { label: t("Home"), to: "/", icon: Home },
      { label: t("Platform"), to: "/platform", icon: Globe2 },
      { label: t("How It Works"), to: "/how-it-works", icon: HelpCircle },
      { label: t("Login"), to: "/user-login", icon: LogIn },
    ],
    user: [
      { label: t("Platform"), to: "/platform", icon: Globe2 },
      { label: t("Dashboard"), to: "/user-dashboard", icon: LayoutDashboard },
    ],
    owner: [
      { label: t("Platform"), to: "/platform", icon: Globe2 },
      { label: t("Dashboard"), to: "/owner-dashboard", icon: LayoutDashboard },
      /* { label: t("Business Health"), to: "/owner/business-health", icon: Activity }, */
      { label: t("Pricing"), to: "/pricing", icon: Tag }, 
    ],
    admin: [
      { label: t("Platform"), to: "/platform", icon: Globe2 },
      { label: t("Dashboard"), to: "/admin-dashboard", icon: LayoutDashboard },
    ],
    operator: [
      { label: t("Platform"), to: "/platform", icon: Globe2 },
      { label: t("Dashboard"), to: "/operator-dashboard", icon: LayoutDashboard }, 
      { label: t("Pricing"), to: "/pricing", icon: Tag }, 
    ],
  };

  const items = menus[role] ?? menus.guest;
  const logoRoute = role === "guest" ? "/" : "/platform";

  const roleLabel = {
    guest: t("Guest"),
    user: t("User"),
    owner: t("Owner"),
    admin: t("Admin"),
    operator: t("Operator"),
  }[role];

  const languageOptions = [
    { code: "en", label: t("English"), flagSrc: flagEn },
    { code: "fr", label: "Français", flagSrc: flagFr },
    { code: "pl", label: "Polski", flagSrc: flagPl },
  ];

  const currentLang = i18n.language || "en";

  function handleLanguageChange(e) {
    const next = e.target.value;
    i18n.changeLanguage(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("nexaloc_language", next);
    }
  }

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
            {/* Mobile quick actions */}
            <div className="flex items-center gap-2 md:hidden">
              {chatRouteMap[role] && (
                <button
                  onClick={() => navigate(chatRouteMap[role])}
                  className="relative rounded-lg border border-slate-200 bg-white/80 p-2 text-slate-600 shadow-sm hover:text-sky-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300"
                  aria-label={t("Open chat")}
                >
                  <MessageSquare size={18} />
                  {chatUnreadCount > 0 && (
                    <span
                      className="
                        absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full
                        bg-emerald-500 text-white text-[10px] font-semibold
                        flex items-center justify-center
                      "
                    >
                      {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                    </span>
                  )}
                </button>
              )}

              {role !== "guest" && (
                <button
                  onClick={() => navigate(`/notifications/${role}`)}
                  className="relative rounded-lg border border-slate-200 bg-white/80 p-2 text-slate-600 shadow-sm hover:text-sky-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300"
                  aria-label={t("Notifications")}
                >
                  <Bell size={18} />
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

              <button
                onClick={() => setMobileSearchOpen((prev) => !prev)}
                className="rounded-lg border border-slate-200 bg-white/80 p-2 text-slate-600 shadow-sm hover:text-sky-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300"
                aria-label={t("Search")}
              >
                <Search size={18} />
              </button>

              {dashboardRouteMap[role] && (
                <button
                onClick={() => navigate(dashboardRouteMap[role])}
                className="rounded-lg border border-slate-200 bg-white/80 p-2 text-slate-600 shadow-sm hover:text-sky-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300"
                aria-label={t("Dashboard")}
              >
                  <LayoutDashboard size={18} />
                </button>
              )}
            </div>

            {/* GLOBAL SEARCH (desktop only) */}
            <div className="hidden lg:block">
               {/* 
               <div className="relative">
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && triggerGlobalSearch()}
                  placeholder={t("Search network...")}
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

            {/* CHAT (desktop) */}
            {chatRouteMap[role] && (
              <button
                onClick={() => navigate(chatRouteMap[role])}
                className="relative hidden md:inline-flex text-slate-600 dark:text-slate-300 hover:text-sky-500"
                aria-label={t("Open chat")}
              >
                <MessageSquare size={22} />
                {chatUnreadCount > 0 && (
                  <span
                    className="
                      absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full
                      bg-emerald-500 text-white text-[10px] font-semibold
                      flex items-center justify-center
                    "
                  >
                    {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                  </span>
                )}
              </button>
            )}

            {/* NOTIF BELL */}
            {role !== "guest" && (
              <button
                onClick={() => navigate(`/notifications/${role}`)}
                className="relative hidden md:inline-flex text-slate-600 dark:text-slate-300 hover:text-sky-500"
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

            {/* LANGUAGE SWITCHER (desktop) */}
            <div className="hidden md:flex items-center gap-2">
              {languageOptions.map((lng) => (
                <button
                  key={lng.code}
                  type="button"
                  onClick={() =>
                    handleLanguageChange({ target: { value: lng.code } })
                  }
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    currentLang === lng.code
                      ? "border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-200"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                  aria-label={t("Language")}
                >
                  <img
                    src={lng.flagSrc}
                    alt={lng.label}
                    className="h-4 w-6 rounded-sm object-cover"
                  />
                </button>
              ))}
            </div>

            <div className="hidden md:block">
              <DarkModeToggle />
            </div>

            {role === "guest" && (
              <button
                onClick={() => navigate("/join")}
                className="hidden sm:block bg-sky-600 text-white px-4 py-1.5 rounded-lg text-sm shadow hover:bg-sky-700"
              >
                {t("Join the Network")}
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
                      alt={t("alt_avatar")}
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
                        {t("Signed in as")}
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
                      {t("Change profile photo")}
                    </button>

                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/settings");
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Settings size={16} />
                      {t("Settings")}
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      {t("Logout")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MOBILE SEARCH */}
        {mobileSearchOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 py-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && triggerGlobalSearch()}
                placeholder={t("Search network...")}
                className="
                  flex-1 pl-3 pr-3 py-2 rounded-full text-xs
                  bg-white/80 dark:bg-slate-900/80
                  border border-slate-300 dark:border-slate-700
                  text-slate-800 dark:text-slate-100
                  placeholder:text-slate-400 dark:placeholder:text-slate-500
                  focus:outline-none
                "
              />
              <button
                onClick={triggerGlobalSearch}
                className="px-3 py-2 rounded-full bg-sky-600 text-white text-xs"
              >
                {t("Search")}
              </button>
            </div>
          </div>
        )}

        {/* MOBILE NAV — slide-down animation */}
        <div
          className={`
            md:hidden overflow-hidden transition-[max-height] duration-300 
            bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800
            ${mobileOpen ? "max-h-[80vh]" : "max-h-0"}
          `}
        >
          <div className={`px-4 ${mobileOpen ? "py-3" : "py-0"} flex flex-col gap-3 overflow-y-auto`}>
            {/* Global search in mobile */}
            <div className="flex items-center gap-2">
              {/*
              <div className="relative flex-1">
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && triggerGlobalSearch()}
                  placeholder={t("Search network...")}
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

              {role !== "guest" && (
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 w-full">
                    {languageOptions.map((lng) => (
                      <button
                        key={lng.code}
                        type="button"
                        onClick={() =>
                          handleLanguageChange({ target: { value: lng.code } })
                        }
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                          currentLang === lng.code
                            ? "border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-200"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        }`}
                        aria-label={t("Language")}
                      >
                        <img
                          src={lng.flagSrc}
                          alt={lng.label}
                          className="h-4 w-6 rounded-sm object-cover"
                        />
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={t("alt_avatar")}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white flex items-center justify-center text-[10px] font-semibold">
                        {avatarInitial}
                      </div>
                    )}
                    <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                      {fullName || userEmail}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        navigate(dashboardRouteMap[role] || "/");
                      }}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {t("Profile")}
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      navigate("/settings");
                    }}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {t("Settings")}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 shadow-sm hover:bg-red-100 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
                  >
                    {t("Logout")}
                  </button>
                  </div>
                </div>
              )}

              {role === "guest" && (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/join");
                  }}
                  className="mt-1 bg-sky-600 text-white px-3 py-2 rounded-lg text-left text-sm"
                >
                  {t("Join the Network")}
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
            <h2 className="text-lg font-semibold mb-4">{t("Update profile photo")}</h2>

            <div className="flex flex-col items-center gap-4">
              {uploadPreview ? (
                <img
                  src={uploadPreview}
                  alt={t("alt_preview")}
                  className="w-32 h-32 rounded-full object-cover shadow"
                />
              ) : avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={t("alt_current")}
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
                  {t("Remove photo")}
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setUploadPreview("");
                  }}
                  className="px-4 py-2 rounded-lg text-xs bg-slate-200 dark:bg-slate-800"
                >
                  {t("Cancel")}
                </button>
                <button
                  onClick={handleUpload}
                  className="px-4 py-2 rounded-lg text-xs bg-sky-600 text-white hover:bg-sky-700"
                >
                  {t("Save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
