import React from "react";
import { Sparkles } from "lucide-react";

export default function AIControls() {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-xl font-bold flex items-center gap-2 text-sky-600">
        <Sparkles className="w-5 h-5" /> AI Controls
      </h2>
    </div>
  );
}
