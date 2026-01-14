// src/components/LoadingScreen.jsx
import NexalocLogo from "@/components/common/NexalocLogo";

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <NexalocLogo withWordmark={false} size={90} className="animate-pulse" />
      <p className="text-sky-500 mt-3 text-sm font-medium">
        Loading Nexaloc...
      </p>
    </div>
  );
}
