import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      
      {/* Global gradient */}
      <div 
        className="
          pointer-events-none fixed inset-0 
          bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.04),transparent_60%),radial-gradient(circle_at_bottom,_rgba(0,0,0,0.03),transparent_60%)]
          dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.16),transparent_55%)]
          opacity-70
        " 
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
