import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trash2, Video, Folder, RefreshCcw } from "lucide-react";

export default function VideoDashboard() {
  const [videos, setVideos] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // ✅ Load videos
  useEffect(() => {
    fetchVideos();
  }, []);

  async function fetchVideos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching videos:", error);
      setLoading(false);
      return;
    }

    // Group by project_name
    const groupedData = data.reduce((acc, vid) => {
      const group = vid.project_name || "Uncategorized";
      acc[group] = acc[group] ? [...acc[group], vid] : [vid];
      return acc;
    }, {});

    setGrouped(groupedData);
    setVideos(data);
    setLoading(false);
  }

  // 🗑️ Delete video from both storage & DB
  async function deleteVideo(video) {
    if (!window.confirm(`Delete "${video.file_name}"?`)) return;

    try {
      // Delete from storage
      const filePath = video.url.split("/storage/v1/object/public/videos/")[1];
      await supabase.storage.from("videos").remove([filePath]);

      // Delete from DB
      await supabase.from("videos").delete().eq("id", video.id);

      setVideos(videos.filter((v) => v.id !== video.id));
      alert("✅ Video deleted successfully!");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("❌ Failed to delete video");
    }
  }

  // 📸 Generate video thumbnail (lazy)
  const getThumbnail = (url) =>
    `https://img.youtube.com/vi/${btoa(url).slice(0, 8)}/0.jpg`;

  // 🔢 Pagination
  const paginatedGroups = Object.entries(grouped).map(([group, vids]) => [
    group,
    vids.slice((page - 1) * pageSize, page * pageSize),
  ]);

  const totalPages = Math.ceil(
    Object.values(grouped).flat().length / pageSize
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2 text-sky-600">
            <Video className="w-7 h-7" /> My Video Projects
          </h1>
          <Button
            onClick={fetchVideos}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {loading ? (
          <p className="text-center text-slate-500">Loading videos...</p>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-center text-slate-400">
            No videos found. Upload some from the Editor!
          </p>
        ) : (
          Object.entries(paginatedGroups).map(([project, vids]) => (
            <motion.div
              key={project}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-10"
            >
              {/* Project header */}
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Folder className="w-5 h-5 text-amber-500" /> {project}
              </h2>

              {/* Grid */}
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {vids.map((video) => (
                  <motion.div
                    key={video.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow overflow-hidden relative"
                  >
                    <img
                      src={getThumbnail(video.url)}
                      alt="thumbnail"
                      className="w-full h-40 object-cover"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                    <div className="p-4">
                      <p className="font-semibold truncate">
                        {video.file_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(video.uploaded_at).toLocaleString()}
                      </p>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 text-sm hover:underline mt-2 block"
                      >
                        ▶ Watch
                      </a>
                      <Button
                        onClick={() => deleteVideo(video)}
                        size="sm"
                        variant="destructive"
                        className="mt-3 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-3">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>
            <span className="text-slate-600 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
