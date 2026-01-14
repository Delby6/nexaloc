import UniversalSidebar from "@/components/layout/UniversalSidebar";

export default function UserLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-[#f5f7fa] text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">

      {/* Sidebar */}
      <UniversalSidebar />

      {/* Main */}
      <main className="flex-1 ml-[240px] px-6 py-6 transition-colors">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
