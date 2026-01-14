// src/components/layout/UniversalSidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun } from "lucide-react";
import {
  LayoutDashboard,
  User,
  Building2,
  Home,
  Settings,
  BarChart3,
  Briefcase,
  ChevronLeft,
  LogOut,
  Sparkles,
  Bell,
  Map,
  CreditCard
} from "lucide-react";
import NexalocLogo from "@/components/common/NexalocLogo";
import { useRole } from "@/hooks/useRole";

export default function UniversalSidebar() {
  const { theme, toggleTheme } = useTheme();
  const role = useRole(); // 'user' | 'owner' | 'operator' | 'admin'
  const navigate = useNavigate();

  /* -------------------------------------------
     🌟 Collapsed mode (saved in localStorage)
  ------------------------------------------- */
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("emabiz_sidebar") === "collapsed";
  });

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("emabiz_sidebar", next ? "collapsed" : "expanded");
  }

  /* -------------------------------------------
     🔍 Role-aware menu definitions
     Option B — 4 roles:
       - user
       - owner
       - operator (front-line ops)
       - admin   (system / platform)
  ------------------------------------------- */
  const menus = {
    // 🔵 End user – simple, focused
    user: [
      { to: "/user-dashboard", label: "Dashboard", icon: Home },
      { to: "/favorites", label: "Favorites", icon: Sparkles },
    ],

    // 🟠 Business owner – manages their own business
    owner: [
      { to: "/owner-dashboard", label: "Dashboard", icon: Home },
      { to: "/owner/business/add", label: "Add Business", icon: Building2 },
      { to: "/owner/ai-dashboard", label: "AI Advisor", icon: Sparkles, pulse: true },
      {
        to: "/owner/billing",
        label: (
          <div className="flex items-center gap-2">
            Billing
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500 text-black font-bold">
              PRO
            </span>
          </div>
        ),
        icon: CreditCard,
      },
    ],

    // 🟥 Admin – full system + operator tools
    
    admin: [
      { to: "/admin-dashboard", label: "Dashboard", icon: LayoutDashboard },

      { section: "Operator Overview" },
      { to: "/operator-dashboard", label: "Operator Dashboard", icon: BarChart3 },
      { to: "/operator-insights", label: "Insights", icon: Sparkles },

      { section: "Management" },
      { to: "/operator-businesses", label: "Businesses", icon: Building2 },
      { to: "/operator-users", label: "Users", icon: User },
      { to: "/operator-network", label: "Network", icon: Building2 },

      { section: "System" },
      { to: "/operator-system", label: "System Health", icon: Settings },
      { to: "/operator-logs", label: "Activity Logs", icon: Briefcase },
      { to: "/operator-notifications", label: "System Notifications", icon: Bell },

      { section: "Tools" },
      { to: "/operator-ai-tools", label: "AI Tools", icon: Sparkles },
      { to: "/operator-reports", label: "Reports", icon: BarChart3 },
      { to: "/operator-map", label: "Map", icon: Map },
    ],

    // 🟩 Operator – front-line business operations only
    operator: [
      { section: "Overview" },
      { to: "/operator-dashboard", label: "Dashboard", icon: BarChart3 },

      { section: "Business" },
      { to: "/operator-businesses", label: "Businesses", icon: Building2 },
      { to: "/operator-network", label: "Network", icon: Building2 },
      { to: "/operator-users", label: "Users", icon: User },

      { section: "Notifications" },
      { to: "/operator-notifications", label: "System Notifications", icon: Bell },
    ],
  };

  const items = menus[role] ?? [];

  /* -------------------------------------------
     Sidebar Render
  ------------------------------------------- */
  return (
    <aside
      className={`group fixed left-0 top-0 h-full z-40
        flex flex-col
        border-r border-slate-800
        bg-slate-900 dark:bg-slate-950
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-[70px]" : "w-[240px]"}
      `}
    >
      {/* Header: Logo + collapse */}
      <div
        className={`flex items-center justify-between border-b border-slate-800 px-4 py-4 ${
          collapsed ? "justify-center" : ""
        }`}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <NexalocLogo />
          </div>
        )}

        <button
          onClick={toggleCollapsed}
          className="text-slate-400 hover:text-sky-400 transition"
        >
          <ChevronLeft
            size={20}
            className={`${collapsed ? "rotate-180" : ""} transition`}
          />
        </button>
      </div>

      {/* Scrollable main area: role label + menu */}
      <div className="flex-1 overflow-y-auto">
        {/* Role indicator */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-slate-800">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              {role ? `${role} Panel` : "Panel"}
            </p>
          </div>
        )}

        {/* MENU */}
        <nav className="px-3 py-4">
          <ul className="space-y-2">
            {items.map((item, index) => {
              // SECTION HEADER
              if (item.section) {
                return !collapsed ? (
                  <p
                    key={`section-${index}`}
                    className="mt-4 mb-2 px-3 text-[10px] uppercase tracking-wider text-slate-500"
                  >
                    {item.section}
                  </p>
                ) : (
                  <div key={`section-${index}`} className="h-4" />
                );
              }

              const Icon = item.icon;

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition
                      ${
                        isActive
                          ? "bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-[0_0_8px_rgba(56,189,248,0.4)]"
                          : "text-slate-300 hover:bg-slate-700/30 hover:text-sky-400"
                      }
                      ${collapsed ? "justify-center" : ""}
                    `
                    }
                  >
                    <Icon
                      size={18}
                      className={item.pulse ? "animate-pulse-slow text-sky-300" : ""}
                    />

                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Bottom – Settings, Theme, Logout (sticky, not scrollable) */}
      <div className="border-t border-slate-800 px-3 py-3 space-y-2">
        {/* Settings */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition
              ${
                isActive
                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-[0_0_8px_rgba(56,189,248,0.4)]"
                  : "text-slate-400 hover:bg-slate-700/30 hover:text-sky-300"
              }
              ${collapsed ? "justify-center" : ""}`
          }
        >
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition
              text-slate-400 hover:text-sky-300 hover:bg-slate-700/30
              ${collapsed ? "justify-center" : ""}
          `}
        >
          {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
          {!collapsed && (
            <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            localStorage.removeItem("role");
            navigate("/user-login", { replace: true });
          }}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition
            text-red-400 hover:text-red-300 hover:bg-red-950/20
            ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

/* -------------------------------------------
   🌟 Pulse animation (AI features)
------------------------------------------- */
const pulseCSS = `
  @keyframes pulse-slow {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
  .animate-pulse-slow {
    animation: pulse-slow 2.4s infinite ease-in-out;
  }
`;

if (typeof document !== "undefined") {
  const styleId = "emabiz-pulse-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = pulseCSS;
    document.head.appendChild(style);
  }
}
