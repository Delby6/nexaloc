import BusinessCard from "@/components/business/public/BusinessCard.jsx";
import VideoDashboard from "@/components/video/VideoDashboard.jsx";
import VideoEditor from "@/components/video/VideoEditor.jsx";

export default function OwnerToolsCenter() {
  return (
    <div className="space-y-10 p-4">
      {/* Business Card Section */}
      <section>
        <h2 className="text-xl font-semibold mb-3 text-white">Business Card</h2>
        <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
          <BusinessCard />
        </div>
      </section>

      {/* AI Video Dashboard */}
      <section>
        <h2 className="text-xl font-semibold mb-3 text-white">AI Video Studio</h2>
        <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 mb-6">
          <VideoDashboard />
        </div>
      </section>

      {/* AI Video Editor */}
      <section>
        <h2 className="text-xl font-semibold mb-3 text-white">Video Editor</h2>
        <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
          <VideoEditor />
        </div>
      </section>
    </div>
  );
}
