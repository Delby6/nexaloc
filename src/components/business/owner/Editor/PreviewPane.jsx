import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Film } from "lucide-react";

export default function PreviewPane({ videoUrl, videoRef }) {
  return (
    <Card className="flex-1 bg-white dark:bg-slate-900/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow">
      <CardContent className="p-4 h-full flex flex-col items-center justify-center">
        {!videoUrl ? (
          <div className="flex flex-col items-center text-slate-500 gap-2">
            <Film className="w-10 h-10" />
            <p>Upload a video to get started</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="rounded-xl max-h-[60vh] w-full"
          />
        )}
      </CardContent>
    </Card>
  );
}
