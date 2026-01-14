import { NavLink } from "react-router-dom";
import NexalocLogo from "@/components/common/NexalocLogo";
import { useEffect, useState } from "react";

export default function Footer() {
  const year = new Date().getFullYear();

  /* ---------------------------------------------
     System Status – Live backend health check
  ----------------------------------------------*/
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("http://localhost:8080/api/ai/ping");
        if (!res.ok) throw new Error();
        setStatus("online");
      } catch (err) {
        setStatus("offline");
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 25000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = {
    online: "bg-green-500",
    offline: "bg-red-500",
    checking: "bg-amber-400",
  }[status];

  const statusText = {
    online: "Operational",
    offline: "Offline",
    checking: "Checking...",
  }[status];

  /* --------------------------------------------- */

  return (
    <footer
      className="
        relative mt-16 
        border-t border-slate-200 dark:border-slate-800 
        bg-white dark:bg-slate-950 
        transition-colors
      "
    >
      {/* subtle top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-sky-500/20 via-cyan-400/20 to-transparent" />

      {/* background tech texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] dark:opacity-[0.10]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,0.18) 1px, transparent 1px), " +
              "linear-gradient(to bottom, rgba(148,163,184,0.18) 1px, transparent 1px)",
            backgroundSize: "46px 46px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-8 md:py-10 text-slate-600 dark:text-slate-300 transition-colors">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          {/* Brand + description */}
          <div className="max-w-md">
            <div className="flex items-center gap-2 mb-3">
              <NexalocLogo />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Nexaloc provides network infrastructure for local digital
              economies — a unified layer for onboarding, discovery, and
              operations across distributed business ecosystems.
            </p>
          </div>

          {/* Navigation columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
            <div>
              <h3 className="text-[11px] font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 mb-2">
                Platform
              </h3>
              <ul className="space-y-1.5">
                <li>
                  <NavLink
                    to="/"
                    className="hover:text-sky-600 dark:hover:text-sky-400 transition"
                  >
                    Overview
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/how-it-works"
                    className="hover:text-sky-600 dark:hover:text-sky-400 transition"
                  >
                    How it works
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/join"
                    className="hover:text-sky-600 dark:hover:text-sky-400 transition"
                  >
                    Onboard a business
                  </NavLink>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 mb-2">
                For roles
              </h3>
              <ul className="space-y-1.5">
                <li>
                  <NavLink
                    to="/user-login"
                    className="hover:text-sky-600 dark:hover:text-sky-400 transition"
                  >
                    Business operators
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/owner-dashboard"
                    className="hover:text-sky-600 dark:hover:text-sky-400 transition"
                  >
                    Network owners
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/admin-dashboard"
                    className="hover:text-sky-600 dark:hover:text-sky-400 transition"
                  >
                    Administrators
                  </NavLink>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 mb-2">
                Company
              </h3>
              <ul className="space-y-1.5">
                <li>
                  <NavLink
                    to="/about"
                    className="hover:text-sky-600 dark:hover:text-sky-400 transition"
                  >
                    About
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/contact"
                    className="hover:text-sky-600 dark:hover:text-sky-400 transition"
                  >
                    Contact
                  </NavLink>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* bottom bar */}
        <div className="
          mt-8 pt-4 
          border-t border-slate-200 dark:border-slate-800 
          flex flex-col md:flex-row md:items-center md:justify-between 
          gap-3 
          text-[11px] text-slate-500 dark:text-slate-400
        ">
          <p>© {year} Nexaloc. All rights reserved.</p>

          <div className="flex gap-4">
            <NavLink
              to="/legal/privacy"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition"
            >
              Privacy
            </NavLink>
            <NavLink
              to="/legal/terms"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition"
            >
              Terms
            </NavLink>
            <NavLink
              to="/legal/cookies"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition"
            >
              Cookies
            </NavLink>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
            <span className="text-[11px]">{statusText}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
