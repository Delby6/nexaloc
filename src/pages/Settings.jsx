// src/pages/Settings.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useRole } from "@/hooks/useRole";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "react-i18next";

import UserLayout from "@/layouts/UserLayout";
import OwnerLayout from "@/layouts/OwnerLayout";
import AdminLayout from "@/layouts/AdminLayout";
import DashboardLayout from "@/layouts/DashboardLayout";

import {
  Settings as SettingsIcon,
  User,
  Shield,
  Moon,
  Sun,
  Globe,
  RefreshCw,
  Bell,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

// ---------- Layout wrapper per role ----------
function getWrapperForRole(role) {
  if (role === "user") return UserLayout;
  if (role === "owner") return OwnerLayout;
  if (role === "admin") return AdminLayout;
  if (role === "operator") return DashboardLayout;
  return ({ children }) => <>{children}</>;
}

const loginRouteByRole = {
  user: "/user-login",
  owner: "/owner-login",
  operator: "/operator-login",
  admin: "/admin-login",
};

// ---------- Notification defaults ----------
function getDefaultNotifPrefs(role) {
  if (role === "user") {
    return { email: true, marketing: true, push: false };
  }
  if (role === "owner") {
    return { business_alerts: true, new_reviews: true, marketing: false };
  }
  if (role === "operator") {
    return {
      system_alerts: true,
      outage_alerts: true,
      high_priority_incidents: true,
      marketing: false,
    };
  }
  if (role === "admin") {
    return {
      platform_alerts: true,
      audit_events: true,
      incident_reports: true,
      marketing: false,
    };
  }
  return {};
}

// ---------- Top-level Settings page (role-aware layout) ----------
export default function SettingsPage() {
  const role = useRole();
  const Wrapper = getWrapperForRole(role);

  return (
    <Wrapper>
      <SettingsInner role={role} />
    </Wrapper>
  );
}

// ---------- Inner content ----------
function SettingsInner({ role }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();

  const [loading, setLoading] = useState(true);

  // Profile
  const [savingProfile, setSavingProfile] = useState(false);
  const [email, setEmail] = useState("");
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    city: "",
  });

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState(getDefaultNotifPrefs(role));
  const [notifLoading, setNotifLoading] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);

  // Language
  const [language, setLanguage] = useState(i18n.language || "en");
  const [savingLanguage, setSavingLanguage] = useState(false);

  // Security / 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAEnforced, setTwoFAEnforced] = useState(
    role === "admin" || role === "operator"
  );

  // Delete account
  const [deletingAccount, setDeletingAccount] = useState(false);

  // -----------------------------------------------------------
  // Load current auth user + role-specific profile + notif prefs
  // -----------------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          const loginRoute = loginRouteByRole[role] || "/user-login";
          navigate(loginRoute);
          return;
        }

        setEmail(user.email || "");

        // Init language from metadata if present
        const metaLang = user.user_metadata?.language;
        const finalLang = metaLang || i18n.language || "en";
        setLanguage(finalLang);
        if (finalLang !== i18n.language) {
          i18n.changeLanguage(finalLang);
        }

        // Init 2FA from metadata
        const initialTwoFA = !!user.user_metadata?.two_factor_enabled;
        setTwoFAEnabled(initialTwoFA);
        setTwoFAEnforced(role === "admin" || role === "operator");

        // Role-specific profile
        if (role === "user") {
          const { data, error: userErr } = await supabase
            .from("users")
            .select("full_name, phone, city")
            .eq("id", user.id)
            .single();

          if (!userErr && data) {
            setProfileForm({
              fullName: data.full_name || "",
              phone: data.phone || "",
              city: data.city || "",
            });
          } else {
            setProfileForm((prev) => ({
              ...prev,
              fullName: user.user_metadata?.full_name || "",
            }));
          }
        } else if (role === "owner") {
          const { data, error: ownerErr } = await supabase
            .from("owners")
            .select("full_name")
            .eq("id", user.id)
            .single();

          if (!ownerErr && data) {
            setProfileForm({
              fullName: data.full_name || "",
              phone: "",
              city: "",
            });
          } else {
            setProfileForm((prev) => ({
              ...prev,
              fullName: user.user_metadata?.full_name || "",
            }));
          }
        } else if (role === "operator") {
          const { data, error: opErr } = await supabase
            .from("operators")
            .select("full_name")
            .eq("user_id", user.id)
            .single();

          if (!opErr && data) {
            setProfileForm({
              fullName: data.full_name || "",
              phone: "",
              city: "",
            });
          } else {
            setProfileForm((prev) => ({
              ...prev,
              fullName: user.user_metadata?.full_name || "",
            }));
          }
        } else if (role === "admin") {
          setProfileForm({
            fullName: user.user_metadata?.full_name || "",
            phone: "",
            city: "",
          });
        } else {
          // guest / unknown
          setProfileForm({
            fullName: "",
            phone: "",
            city: "",
          });
        }

        // Load notification prefs
        await loadNotificationSettings(user, role, setNotifPrefs);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load settings.");
      } finally {
        setNotifLoading(false);
        setLoading(false);
      }
    }

    if (role !== "guest") {
      load();
    } else {
      setLoading(false);
    }
  }, [role, navigate, i18n]);

  // -----------------------------------------------------------
  // Load notification settings (helper)
  // -----------------------------------------------------------
  async function loadNotificationSettings(user, role, setFn) {
    try {
      if (!user) return;
      if (role === "user") {
        const { data, error } = await supabase
          .from("user_notifications_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!error && data) {
          setFn({
            email: !!data.email,
            marketing: !!data.marketing,
            push: !!data.push,
          });
        } else {
          setFn(getDefaultNotifPrefs("user"));
        }
      } else if (role === "owner") {
        const { data, error } = await supabase
          .from("owner_notifications_settings")
          .select("*")
          .eq("owner_id", user.id)
          .single();

        if (!error && data) {
          setFn({
            business_alerts: !!data.business_alerts,
            new_reviews: !!data.new_reviews,
            marketing: !!data.marketing,
          });
        } else {
          setFn(getDefaultNotifPrefs("owner"));
        }
      } else if (role === "operator") {
        const { data, error } = await supabase
          .from("operator_notifications_settings")
          .select("*")
          .eq("operator_id", user.id)
          .single();

        if (!error && data) {
          setFn({
            system_alerts: !!data.system_alerts,
            outage_alerts: !!data.outage_alerts,
            high_priority_incidents: !!data.high_priority_incidents,
            marketing: !!data.marketing,
          });
        } else {
          setFn(getDefaultNotifPrefs("operator"));
        }
      } else if (role === "admin") {
        const { data, error } = await supabase
          .from("admin_notifications_settings")
          .select("*")
          .eq("admin_id", user.id)
          .single();

        if (!error && data) {
          setFn({
            platform_alerts: !!data.platform_alerts,
            audit_events: !!data.audit_events,
            incident_reports: !!data.incident_reports,
            marketing: !!data.marketing,
          });
        } else {
          setFn(getDefaultNotifPrefs("admin"));
        }
      }
    } catch (err) {
      console.error("Failed to load notification prefs:", err);
      setFn(getDefaultNotifPrefs(role));
    }
  }

  // -----------------------------------------------------------
  // Save profile
  // -----------------------------------------------------------
  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        toast.error("Session expired. Please log in again.");
        return;
      }

      const { fullName, phone, city } = profileForm;

      if (role === "user") {
        const { error: upErr } = await supabase
          .from("users")
          .update({
            full_name: fullName,
            phone: phone || null,
            city: city || null,
          })
          .eq("id", user.id);

        if (upErr) throw upErr;
      } else if (role === "owner") {
        const { error: upErr } = await supabase
          .from("owners")
          .update({
            full_name: fullName,
          })
          .eq("id", user.id);

        if (upErr) throw upErr;
      } else if (role === "operator") {
        const { error: upErr } = await supabase
          .from("operators")
          .update({
            full_name: fullName,
          })
          .eq("user_id", user.id);

        if (upErr) throw upErr;
      } else if (role === "admin") {
        const { error: upErr } = await supabase.auth.updateUser({
          data: { full_name: fullName },
        });
        if (upErr) throw upErr;
      }

      // Also keep auth metadata in sync where possible
      await supabase.auth.updateUser({
        data: { full_name: fullName },
      });

      toast.success("Profile updated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  // -----------------------------------------------------------
  // Save notification preferences
  // -----------------------------------------------------------
  async function handleSaveNotifications() {
    setSavingNotif(true);
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        toast.error("Session expired. Please log in again.");
        return;
      }

      if (role === "user") {
        const payload = {
          user_id: user.id,
          email: notifPrefs.email,
          marketing: notifPrefs.marketing,
          push: notifPrefs.push,
        };
        const { error: upErr } = await supabase
          .from("user_notifications_settings")
          .upsert(payload);
        if (upErr) throw upErr;
      } else if (role === "owner") {
        const payload = {
          owner_id: user.id,
          business_alerts: notifPrefs.business_alerts,
          new_reviews: notifPrefs.new_reviews,
          marketing: notifPrefs.marketing,
        };
        const { error: upErr } = await supabase
          .from("owner_notifications_settings")
          .upsert(payload);
        if (upErr) throw upErr;
      } else if (role === "operator") {
        const payload = {
          operator_id: user.id,
          system_alerts: notifPrefs.system_alerts,
          outage_alerts: notifPrefs.outage_alerts,
          high_priority_incidents: notifPrefs.high_priority_incidents,
          marketing: notifPrefs.marketing,
        };
        const { error: upErr } = await supabase
          .from("operator_notifications_settings")
          .upsert(payload);
        if (upErr) throw upErr;
      } else if (role === "admin") {
        const payload = {
          admin_id: user.id,
          platform_alerts: notifPrefs.platform_alerts,
          audit_events: notifPrefs.audit_events,
          incident_reports: notifPrefs.incident_reports,
          marketing: notifPrefs.marketing,
        };
        const { error: upErr } = await supabase
          .from("admin_notifications_settings")
          .upsert(payload);
        if (upErr) throw upErr;
      }

      toast.success("Notification preferences saved.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save notification preferences.");
    } finally {
      setSavingNotif(false);
    }
  }

  // -----------------------------------------------------------
  // Language change
  // -----------------------------------------------------------
  async function handleLanguageChange(e) {
    const lang = e.target.value;
    setLanguage(lang);
    setSavingLanguage(true);

    try {
      i18n.changeLanguage(lang);
      const { error } = await supabase.auth.updateUser({
        data: { language: lang },
      });
      if (error) throw error;
      toast.success("Language updated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update language.");
    } finally {
      setSavingLanguage(false);
    }
  }

  // -----------------------------------------------------------
  // Password reset shortcut
  // -----------------------------------------------------------
  function goToPasswordReset() {
    navigate("/forgot-password");
  }

  // -----------------------------------------------------------
  async function handleEnable2FA() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: sessionData } = await supabase.auth.getSession();

    if (!user || !sessionData?.session?.access_token) {
      throw new Error("User is not authenticated");
    }

    const accessToken = sessionData.session.access_token;

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enable-2fa`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId: user.id }),
      }
    );

    const json = await res.json();

    if (!res.ok) {
      console.error("enable-2fa response:", json);
      throw new Error(json.error || "Failed to enable 2FA");
    }

    toast.success("Two-factor authentication enabled!");
    setTwoFAEnabled(true);

  } catch (err) {
    console.error("enable-2fa error:", err);
    toast.error(err.message);
  }
}
async function handleDisable2FA() {
  if (twoFAEnforced) {
    toast.error("2FA is enforced for this role.");
    return;
  }

  setTwoFALoading(true);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: sessionData } = await supabase.auth.getSession();

    if (!user || !sessionData?.session?.access_token) {
      throw new Error("User is not authenticated");
    }

    const accessToken = sessionData.session.access_token;

    // 🔥 Normalize the role so it ALWAYS matches backend expected values
    const normalizedRole = (role || "")
      .toString()
      .trim()
      .toLowerCase();

    // If somehow role is not valid
    const validRoles = ["user", "owner", "operator", "admin"];
    if (!validRoles.includes(normalizedRole)) {
      console.error("Invalid role sent:", normalizedRole);
      throw new Error(`Invalid role: ${normalizedRole}`);
    }

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disable-2fa`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: user.id,
          role: normalizedRole, // ✅ FIX: passing properly normalized role
        }),
      }
    );

    const json = await res.json();

    if (!res.ok) {
      console.error("disable-2fa response:", json);
      throw new Error(json.error || "Failed to disable 2FA");
    }

    await supabase.auth.updateUser({
      data: { two_factor_enabled: false },
    });

    setTwoFAEnabled(false);
    toast.success("Two-factor authentication disabled.");

  } catch (err) {
    console.error("disable-2fa error:", err);
    toast.error(err.message);
  } finally {
    setTwoFALoading(false);
  }
}


async function handleDeleteAccount() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: sessionData } = await supabase.auth.getSession();

    if (!user || !sessionData?.session?.access_token) {
      throw new Error("User is not authenticated");
    }

    const accessToken = sessionData.session.access_token;

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId: user.id }),
      }
    );

    const json = await res.json();

    if (!res.ok) {
      console.error("delete-account response:", json);
      throw new Error(json.error || "Failed to delete account");
    }

    toast.success("Your account has been permanently deleted.");
    await supabase.auth.signOut();
    navigate("/");

  } catch (err) {
    console.error("delete-account error:", err);
    toast.error(err.message);
  }
}


  // -----------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading settings…
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // UI
  // -----------------------------------------------------------
  const roleLabelMap = {
    user: "User",
    owner: "Owner",
    admin: "Admin",
    operator: "Operator",
    guest: "Guest",
  };
  const roleLabel = roleLabelMap[role] || "User";

  const languages = [
    { code: "en", label: "English" },
    /*{ code: "fr", label: "Français" },
    { code: "pl", label: "Polski" },
    { code: "ar", label: "العربية" },*/
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
            <SettingsIcon className="h-3 w-3" />
            Settings · {roleLabel} profile
          </div>
          <h1 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">
            Account Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your profile, notifications, security, and app preferences.
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        {/* Left column: Profile + Security */}
        <div className="space-y-6">
          {/* Profile */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-sky-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Profile
              </h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="Your name"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Email (sign-in)
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                  />
                </div>

                {/* Extra fields only for normal users */}
                {role === "user" && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        placeholder="+48…"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                        City / Village
                      </label>
                      <input
                        type="text"
                        value={profileForm.city}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        placeholder="e.g. Lodz"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile && (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  )}
                  {savingProfile ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>

          {/* Security & 2FA / Delete */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Security
              </h2>
            </div>

            {/* Password */}
            <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  Password
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You can reset your password via email.
                </p>
              </div>
              <button
                onClick={goToPasswordReset}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                Reset password
              </button>
            </div>

            {/* 2FA */}
            <div className="mb-4 border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    Two-Factor Authentication (2FA)
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Adds an extra verification step when signing in.
                  </p>
                  {twoFAEnforced && (
                    <p className="mt-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      For {roleLabel} accounts, 2FA is enforced by the
                      platform.
                    </p>
                  )}
                </div>

                {!twoFAEnforced && (
                  <button
                    onClick={twoFAEnabled ? handleDisable2FA : handleEnable2FA}
                    disabled={twoFALoading}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm ${
                      twoFAEnabled
                        ? "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {twoFALoading && (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    )}
                    {twoFAEnabled ? "Disable 2FA" : "Enable 2FA"}
                  </button>
                )}
              </div>
            </div>

            {/* Danger zone: delete account (users & owners only) */}
            {(role === "user" || role === "owner") && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
                <div className="mb-1 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="font-semibold">Danger zone</span>
                </div>
                <p className="mb-2">
                  Deleting your account is permanent. Your profile and personal
                  data will be removed. Some anonymized business data may be
                  retained for reporting.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingAccount ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  {deletingAccount ? "Deleting…" : "Delete my account"}
                </button>
              </div>
            )}

            {(role === "admin" || role === "operator") && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                <p className="font-semibold mb-1">Admin / Operator accounts</p>
                <p>
                  To maintain platform integrity, admin and operator accounts
                  can&apos;t be self-deleted. Contact the platform owner if you
                  need to close this account.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Notifications + Appearance + Language */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-sky-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Notification Preferences
                </h2>
              </div>
              <button
                onClick={handleSaveNotifications}
                disabled={savingNotif}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingNotif && (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                )}
                {savingNotif ? "Saving…" : "Save"}
              </button>
            </div>

            {notifLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="h-4 w-4 rounded-full border border-slate-400 border-t-transparent animate-spin" />
                Loading notification preferences…
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                {role === "user" && (
                  <>
                    <ToggleRow
                      label="Email notifications"
                      description="Booking updates, account changes."
                      checked={notifPrefs.email}
                      onChange={(val) =>
                        setNotifPrefs((p) => ({ ...p, email: val }))
                      }
                    />
                    <ToggleRow
                      label="Marketing updates"
                      description="Occasional product news from Nexaloc."
                      checked={notifPrefs.marketing}
                      onChange={(val) =>
                        setNotifPrefs((p) => ({ ...p, marketing: val }))
                      }
                    />
                    <ToggleRow
                      label="Push (future)"
                      description="Mobile or browser push alerts in the future."
                      checked={notifPrefs.push}
                      onChange={(val) =>
                        setNotifPrefs((p) => ({ ...p, push: val }))
                      }
                    />
                  </>
                )}

                {role === "owner" && (
                  <>
                    <ToggleRow
                      label="Business alerts"
                      description="New activity on your listings."
                      checked={notifPrefs.business_alerts}
                      onChange={(val) =>
                        setNotifPrefs((p) => ({ ...p, business_alerts: val }))
                      }
                    />
                    <ToggleRow
                      label="New reviews"
                      description="Notifications when customers leave a review."
                      checked={notifPrefs.new_reviews}
                      onChange={(val) =>
                        setNotifPrefs((p) => ({ ...p, new_reviews: val }))
                      }
                    />
                    <ToggleRow
                      label="Marketing"
                      description="News about new tools for owners."
                      checked={notifPrefs.marketing}
                      onChange={(val) =>
                        setNotifPrefs((p) => ({ ...p, marketing: val }))
                      }
                    />
                  </>
                )}

                {role === "operator" && (
                  <>
                    <ToggleRow
                      label="System alerts"
                      description="General system notifications."
                      checked={notifPrefs.system_alerts}
                      onChange={(val) =>
                        setNotifPrefs((p) => ({ ...p, system_alerts: val }))
                      }
                    />
                    <ToggleRow
                      label="Outage alerts"
                      description="Warnings about outages or disruptions."
                      checked={notifPrefs.outage_alerts}
                      onChange={(val) =>
                        setNotifPrefs((p) => ({ ...p, outage_alerts: val }))
                      }
                    />
                    <ToggleRow
                      label="High priority incidents"
                      description="Critical incidents that need attention."
                      checked={notifPrefs.high_priority_incidents}
                      onChange={(val) =>
                        setNotifPrefs((p) => ({
                          ...p,
                          high_priority_incidents: val,
                        }))
                      }
                    />
                  </>
                )}

                {role === "admin" && (
                  <>
                    <ToggleRow
                      label="Platform alerts"
                      description="Core platform events, errors, and status."
                      checked={notifPrefs.platform_alerts}
                      onChange={(val) =>
                        setNotifPrefs((p) => ({ ...p, platform_alerts: val }))
                      }
                    />
                    <ToggleRow
                      label="Audit events"
                      description="Sign-in attempts, role changes, permissions."
                      checked={notifPrefs.audit_events}
                      onChange={(val) =>
                        setNotifPrefs((p) => ({ ...p, audit_events: val }))
                      }
                    />
                    <ToggleRow
                      label="Incident reports"
                      description="Investigations and incident summaries."
                      checked={notifPrefs.incident_reports}
                      onChange={(val) =>
                        setNotifPrefs((p) => ({ ...p, incident_reports: val }))
                      }
                    />
                  </>
                )}

                {role === "guest" && (
                  <p className="text-slate-500 dark:text-slate-400">
                    Sign in to manage notification preferences.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Appearance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="h-4 w-4 text-sky-400" />
              ) : (
                <Sun className="h-4 w-4 text-amber-400" />
              )}
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Appearance
              </h2>
            </div>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              Switch between light and dark mode. This applies to the whole app.
            </p>

            <button
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4" />
                  Switch to light mode
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  Switch to dark mode
                </>
              )}
            </button>
          </div>

          {/* Language */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-sky-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Language & Region
              </h2>
            </div>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              Choose your preferred language for the Nexaloc interface.
            </p>

            <div className="flex items-center gap-3">
              <select
                value={language}
                onChange={handleLanguageChange}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {languages.map((lng) => (
                  <option key={lng.code} value={lng.code}>
                    {lng.label}
                  </option>
                ))}
              </select>
              {savingLanguage && (
                <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Small reusable toggle row ----------
function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/60">
      <div>
        <p className="text-xs font-medium text-slate-800 dark:text-slate-100">
          {label}
        </p>
        {description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
          checked ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-4" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
