import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Scissors,
  Music2,
  Save,
  Loader2,
  Brain,
} from "lucide-react";
import AIControls from "@/components/business/owner/Editor/AIControls";

export default function EditorSidebar({
  videoFile,
  isProcessing,
  onUpload,
  onEnhance,
  onExport,
  onTranscribe, // ✅ new prop for AI transcription
}) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onUpload(file);
  };

  return (
    <Card className="lg:w-1/4 bg-white dark:bg-slate-900/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow">
      <CardContent className="p-4 flex flex-col gap-4">
        <AIControls />

        {/* 📤 Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Upload Video</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="w-full text-sm"
          />
        </div>

        {/* 🤖 Enhance */}
        <Button
          onClick={onEnhance}
          disabled={!videoFile || isProcessing}
          className="w-full flex items-center gap-2 bg-sky-600 hover:bg-sky-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Enhance Video (AI)
            </>
          )}
        </Button>

        {/* ✂️ Trim */}
        <Button
          variant="outline"
          disabled={!videoFile}
          className="w-full flex items-center gap-2"
        >
          <Scissors className="w-4 h-4" /> Trim / Crop
        </Button>

        {/* 🧠 Transcribe (AI) */}
        <Button
          onClick={onTranscribe}
          disabled={!videoFile}
          variant="outline"
          className="w-full flex items-center gap-2"
        >
          <Brain className="w-4 h-4" /> Transcribe (AI)
        </Button>

        {/* 🎵 Add Music */}
        <Button
          variant="outline"
          disabled={!videoFile}
          className="w-full flex items-center gap-2"
        >
          <Music2 className="w-4 h-4" /> Add Music / Voice
        </Button>

        {/* 💾 Export */}
        <Button
          onClick={onExport}
          disabled={!videoFile}
          className="w-full flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <Save className="w-4 h-4" /> Export
        </Button>
      </CardContent>
    </Card>
  );
}
