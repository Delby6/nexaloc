// src/layouts/DashboardLayout.jsx
import UniversalSidebar from "@/components/layout/UniversalSidebar";

export default function DashboardLayout({ children }) {
  return (
    <div
      className="
        min-h-screen 
        flex 
        bg-[#f5f7fa] text-slate-900 
        dark:bg-slate-950 dark:text-slate-100 
        transition-colors
      "
    >
      {/* Sidebar (handles operator nav + theme toggle internally) */}
      <UniversalSidebar />

      {/* Main content area */}
      <main
        className="
          flex-1
          px-6 py-6
          md:px-8 md:py-8
          md:ml-[240px]          /* leave space for sidebar on desktop */
          ml-0                    /* no forced margin on mobile */
          transition-[margin] 
          duration-200
        "
      >
        <div className="max-w-7xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
