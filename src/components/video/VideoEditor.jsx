import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { motion } from "framer-motion";
import {
  Scissors,
  Sparkles,
  Music2,
  Film,
  Loader2,
  Play,
  Pause,
  Download,
  UploadCloud,
  FolderPlus,
  Type,
  Image as ImageIcon,
  Trash2,
  Undo2,
  Redo2,
  SquareStack,
  Settings2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { trimVideo, mergeAudio, exportProject } from "@/utils/ffmpegClient";
import { Range, getTrackBackground } from "react-range";
import toast from "react-hot-toast";

// ---------- Constants ----------
const PRESET_PROJECTS = [
  "Promo Reels",
  "Podcast Clips",
  "Ads",
  "Tutorials",
  "Social Shorts",
];

const ASPECTS = [
  { id: "16:9", w: 16, h: 9 },
  { id: "9:16", w: 9, h: 16 },
  { id: "1:1", w: 1, h: 1 },
  { id: "4:5", w: 4, h: 5 },
];

// ---------- Helpers ----------
function fmtTime(t) {
  if (!isFinite(t)) return "0:00";
  const s = Math.max(0, Math.floor(t));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function parseSRT(text) {
  const entries = [];
  const blocks = text.replace(/\r/g, "").split(/\n\n+/);
  for (const b of blocks) {
    const lines = b.trim().split(/\n/);
    if (lines.length >= 2) {
      const timing = lines[1].match(
        /(\d\d:\d\d:\d\d[,\.]\d\d\d)\s*-->\s*(\d\d:\d\d:\d\d[,\.]\d\d\d)/
      );
      if (timing) {
        const toSec = (ts) => {
          const [h, m, rest] = ts.replace(",", ".").split(":");
          const [s, ms] = rest.split(".");
          return (
            parseInt(h) * 3600 +
            parseInt(m) * 60 +
            parseInt(s) +
            parseInt(ms) / 1000
          );
        };
        const start = toSec(timing[1]);
        const end = toSec(timing[2]);
        const content = lines.slice(2).join("\n");
        entries.push({ start, end, content });
      }
    }
  }
  return entries;
}

function generateTimedSubsFromText(text, totalDurationSec) {
  if (!text || typeof text !== "string") return [];
  const sentences =
    text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]*/g) || [text];
  const count = Math.max(1, sentences.length);
  const duration = Math.max(1, Math.floor(totalDurationSec || count));
  const per = Math.max(0.8, duration / count);
  let t = 0;
  const subs = sentences.map((s) => {
    const start = t;
    const end = Math.min(duration, t + per);
    t = end;
    return { start, end, content: s.trim() };
  });
  if (subs.length && subs[subs.length - 1].end < duration) {
    subs[subs.length - 1].end = duration;
  }
  return subs;
}

// ---------- Component ----------
export default function VideoEditor() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null); // local preview URL
  const [videoPublicUrl, setVideoPublicUrl] = useState(null); // Supabase URL (for transcription)
  const [audioFile, setAudioFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [range, setRange] = useState([0, 10]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [ffmpegProgress, setFfmpegProgress] = useState(null);

  const [projectName, setProjectName] = useState(PRESET_PROJECTS[0]);
  const [usingCustomProject, setUsingCustomProject] = useState(false);
  const [customProjectName, setCustomProjectName] = useState("");

  const [aspect, setAspect] = useState("16:9"); // initial, overridden by auto-detect
  const [zoomTimeline, setZoomTimeline] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rounded, setRounded] = useState(8);

  const [texts, setTexts] = useState([]);
  const [activeTextId, setActiveTextId] = useState(null);

  const [subs, setSubs] = useState([]);
  const [showSubs, setShowSubs] = useState(true);

  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const [transcript, setTranscript] = useState("");

  const videoRef = useRef(null);
  const overlayRef = useRef(null);

  const effectiveProject = usingCustomProject
    ? customProjectName.trim() || "Untitled Project"
    : projectName;

  // ---------- Metadata (duration + auto-detect aspect) ----------
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => {
      const dur = v.duration || 0;
      setDuration(dur);
      setRange([0, Math.min(10, dur || 10)]);

      // Auto-detect aspect ratio
      const vw = v.videoWidth;
      const vh = v.videoHeight;
      if (vw && vh) {
        if (vh > vw) {
          setAspect("9:16");
        } else {
          setAspect("16:9");
        }
      }
    };
    v.addEventListener("loadedmetadata", onLoaded);
    return () => v.removeEventListener("loadedmetadata", onLoaded);
  }, [videoUrl]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, []);

  // ---------- Keyboard shortcuts ----------
  useEffect(() => {
    const onKey = (e) => {
      if (!videoRef.current) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
      if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePreviewTrim();
      }
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          undo();
        } else if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---------- History ----------
  const serializeState = () => ({
    texts: JSON.parse(JSON.stringify(texts)),
    filters: { brightness, contrast, saturation, rounded },
    showSubs,
  });

  const restoreState = (snap) => {
    if (!snap) return;
    setTexts(snap.texts || []);
    setBrightness(snap.filters?.brightness ?? 100);
    setContrast(snap.filters?.contrast ?? 100);
    setSaturation(snap.filters?.saturation ?? 100);
    setRounded(snap.filters?.rounded ?? 8);
    setShowSubs(!!snap.showSubs);
  };

  const pushHistory = useCallback((snapshot) => {
    setHistory((h) => [...h, snapshot]);
    setRedoStack([]);
  }, []);

  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const newHist = [...h];
      const last = newHist.pop();
      setRedoStack((r) => [serializeState(), ...r]);
      restoreState(last);
      return newHist;
    });
  };

  const redo = () => {
    setRedoStack((r) => {
      if (!r.length) return r;
      const [first, ...rest] = r;
      pushHistory(serializeState());
      restoreState(first);
      return rest;
    });
  };

  // ---------- Drag & Drop ----------
  const onDrop = async (ev) => {
    ev.preventDefault();
    const file = ev.dataTransfer?.files?.[0];
    if (file && file.type.startsWith("video/")) await handleVideoFile(file);
    else if (file && file.type.startsWith("image/")) addImageOverlay(file);
    else if (file) toast.error("Drop a video or image file.");
  };
  const onDragOver = (e) => e.preventDefault();

  // ---------- Upload ----------
  const handleVideoInput = async (e) => {
    const f = e.target.files?.[0];
    if (f) await handleVideoFile(f);
  };

  const handleVideoFile = async (file) => {
    try {
      setVideoFile(file);

      // Local preview URL – keeps video & audio working reliably
      const localUrl = URL.createObjectURL(file);
      setVideoUrl(localUrl);

      setUploading(true);

      const filePath = `videos/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from("videos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "video/mp4",
        });
      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("videos")
        .getPublicUrl(filePath);
      const publicUrl = publicUrlData?.publicUrl || null;

      // We KEEP the local blob for preview (prevents audio-only bug)
      // We ONLY store the Supabase URL for optional transcription/export use.
      setVideoPublicUrl(publicUrl || null);
    } catch (err) {
      console.error(err);
      toast.error("Video upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ---------- Transcription (manual only) ----------
  async function transcribeAudio(audioUrl) {
    setTranscribing(true);
    try {
      const res = await fetch("http://localhost:5174/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl }),
      });
      const data = await res.json();
      if (data?.text) {
        setTranscript(data.text);
        const d = videoRef.current?.duration || duration || 60;
        const generated = generateTimedSubsFromText(data.text, d);
        setSubs(generated);
        setShowSubs(true);
        toast.success("🧠 Transcription completed & subtitles generated");
      } else {
        toast.error("Transcription failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Transcription request failed");
    } finally {
      setTranscribing(false);
    }
  }

  const handleTranscribeClick = async () => {
    if (!videoPublicUrl) {
      toast.error("No uploaded video URL available for transcription.");
      return;
    }
    await transcribeAudio(videoPublicUrl);
  };

  const handleGenerateSubsFromTranscript = () => {
    if (!transcript) {
      toast.error("No transcript available to generate subtitles.");
      return;
    }
    const d = videoRef.current?.duration || duration || 60;
    const generated = generateTimedSubsFromText(transcript, d);
    setSubs(generated);
    setShowSubs(true);
    toast.success("Subtitles generated from transcript.");
  };

  // ---------- Audio ----------
  const handleAudioInput = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setAudioFile(f);
      toast.success(`🎵 Audio loaded: ${f.name}`);
    }
  };

  const doMergeAudio = async () => {
    if (!videoFile || !audioFile)
      return toast.error("Upload video and audio first.");
    setIsProcessing(true);
    setFfmpegProgress(0);
    try {
      const outUrl = await mergeAudio(videoFile, audioFile);
      setVideoUrl(outUrl);
      toast.success("Audio merged");
    } catch (e) {
      console.error(e);
      toast.error("Merge failed (FFmpeg not ready?)");
    } finally {
      setIsProcessing(false);
      setFfmpegProgress(null);
    }
  };

  // ---------- Trim / Play ----------
  const doTrim = async () => {
    if (!videoFile || duration === 0) return;
    setIsProcessing(true);
    setFfmpegProgress(0);
    try {
      const outUrl = await trimVideo(videoFile, range[0], range[1]);
      setVideoUrl(outUrl);
      toast.success(
        `Trimmed ${range[0].toFixed(1)}s → ${range[1].toFixed(1)}s`
      );
    } catch (e) {
      console.error(e);
      toast.error("Trim failed");
    } finally {
      setIsProcessing(false);
      setFfmpegProgress(null);
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  };

  const handlePreviewTrim = () => {
    const v = videoRef.current;
    if (!v || duration === 0) return;
    if (isPreviewing) {
      setIsPreviewing(false);
      v.pause();
      return;
    }
    setIsPreviewing(true);
    v.currentTime = range[0];
    v.play();
    const onTime = () => {
      if (v.currentTime >= range[1]) v.currentTime = range[0];
    };
    v.addEventListener("timeupdate", onTime);
    const stop = () => {
      v.removeEventListener("timeupdate", onTime);
      setIsPreviewing(false);
    };
    v.addEventListener("pause", stop, { once: true });
  };

  // ---------- Overlays ----------
  const addText = () => {
    const id = crypto.randomUUID();
    const newTxt = {
      id,
      text: "Your text",
      x: 50,
      y: 50,
      size: 32,
      color: "white",
      bg: "rgba(0,0,0,0.3)",
      weight: 700,
      shadow: true,
      start: 0,
      end: Math.min(duration || 5, 5),
      align: "center",
    };
    pushHistory(serializeState());
    setTexts((t) => [...t, newTxt]);
    setActiveTextId(id);
  };

  const addImageOverlay = async (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const id = crypto.randomUUID();
    const imgTxt = {
      id,
      text: "",
      image: url,
      x: 60,
      y: 60,
      w: 320,
      h: 180,
      start: 0,
      end: Math.min(duration || 6, 6),
    };
    pushHistory(serializeState());
    setTexts((t) => [...t, imgTxt]);
    setActiveTextId(id);
  };

  const removeActiveOverlay = () => {
    if (!activeTextId) return;
    pushHistory(serializeState());
    setTexts((t) => t.filter((x) => x.id !== activeTextId));
    setActiveTextId(null);
  };

  const currentOverlay =
    texts.find((t) => t.id === activeTextId) || null;

  const visibleOverlays = useMemo(
    () =>
      texts.filter(
        (t) =>
          currentTime >= (t.start || 0) &&
          currentTime <= (t.end || Infinity)
      ),
    [texts, currentTime]
  );

  const onOverlayMouseDown = (e, id) => {
    e.stopPropagation();
    setActiveTextId(id);
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = overlayRef.current?.getBoundingClientRect();
    const ov = texts.find((t) => t.id === id);
    const init = { x: ov.x, y: ov.y, w: ov.w, h: ov.h };
    const move = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const nx = Math.max(
        0,
        Math.min((init.x || 0) + dx, (rect?.width || 0) - (init.w || 0) - 10)
      );
      const ny = Math.max(
        0,
        Math.min((init.y || 0) + dy, (rect?.height || 0) - (init.h || 0) - 10)
      );
      setTexts((t) =>
        t.map((x) => (x.id === id ? { ...x, x: nx, y: ny } : x))
      );
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  // ---------- Subtitles ----------
  const onSrtInput = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const txt = await f.text();
    const parsed = parseSRT(txt);
    setSubs(parsed);
    setShowSubs(true);
    toast.success(`Loaded ${parsed.length} subtitle lines`);
  };

  // ---------- Transcript Download ----------
  const downloadTranscript = () => {
    if (!transcript) return;
    const blob = new Blob([transcript], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${effectiveProject || "transcript"}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ---------- Export ----------
  const quickDownload = async () => {
    try {
      if (
        videoFile &&
        (range[0] > 0 || (range[1] && range[1] < duration))
      ) {
        try {
          const outUrl = await trimVideo(videoFile, range[0], range[1]);
          forceDownload(outUrl, `emabiz_export_${Date.now()}.mp4`);
          toast.success("Downloaded trimmed video");
          return;
        } catch {
          // fall through
        }
      }
      forceDownload(videoUrl, `emabiz_export_${Date.now()}.mp4`);
      toast.success("Downloaded current video");
    } catch (e) {
      console.error(e);
      toast.error("Export failed");
    }
  };

  const forceDownload = (url, name) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const doExport = async () => {
    if (!videoUrl) return toast.error("Nothing to export");

    if (typeof exportProject === "function") {
      try {
        setIsProcessing(true);
        setFfmpegProgress(0);
        const plan = {
          trim: { start: range[0], end: range[1] },
          audio: audioFile || null,
          texts,
          filters: { brightness, contrast, saturation, rounded },
          aspect,
        };
        const url = await exportProject(
          videoFile,
          plan,
          (p) => setFfmpegProgress(p?.ratio || 0)
        );
        setVideoUrl(url);
        toast.success("Rendered with FFmpeg");
      } catch (e) {
        console.error(e);
        toast.error("FFmpeg export failed; using quick export instead");
        await quickDownload();
      } finally {
        setIsProcessing(false);
        setFfmpegProgress(null);
      }
      return;
    }

    await quickDownload();
  };

  // ---------- UI ----------
  const filterStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
    borderRadius: `${rounded}px`,
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto flex flex-col gap-4"
      >
        {/* Top toolbar (compact) */}
        <Card className="bg-white dark:bg-slate-900/70 dark:bg-slate-800/70 border rounded-2xl shadow">
          <CardContent className="p-3 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setUsingCustomProject((v) => !v)}
              className="gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              {usingCustomProject ? "Custom" : projectName}
            </Button>
            {usingCustomProject ? (
              <Input
                value={customProjectName}
                onChange={(e) => setCustomProjectName(e.target.value)}
                placeholder="Type project name…"
                className="w-52"
              />
            ) : (
              <select
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-sm border rounded-md px-2 py-1.5 bg-white dark:bg-slate-900/80 dark:bg-slate-900/40"
              >
                {PRESET_PROJECTS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            )}

            <div className="mx-3 h-6 w-px bg-slate-300/70" />

            <Button variant="outline" onClick={addText} className="gap-2">
              <Type className="w-4 h-4" />
              Add text
            </Button>
            <label className="inline-flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) addImageOverlay(f);
                }}
              />
              <span className="px-3 py-1.5 border rounded-md text-sm cursor-pointer inline-flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Add image
              </span>
            </label>

            <div className="mx-3 h-6 w-px bg-slate-300/70" />

            <Button variant="ghost" onClick={undo} className="gap-2">
              <Undo2 className="w-4 h-4" />
              Undo
            </Button>
            <Button variant="ghost" onClick={redo} className="gap-2">
              <Redo2 className="w-4 h-4" />
              Redo
            </Button>

            <div className="grow" />

            <Button
              onClick={doExport}
              disabled={!videoUrl || isProcessing}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isProcessing ? "Rendering…" : "Export"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-12 gap-4">
          {/* Left: Assets & controls */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <Card className="border rounded-2xl shadow bg-white dark:bg-slate-900/70 dark:bg-slate-800/70">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sky-600 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Assets
                </h3>

                {/* Video upload */}
                <div className="border border-dashed p-4 text-center rounded-xl">
                  <UploadCloud className="w-6 h-6 mx-auto mb-2 text-slate-500" />
                  <p className="text-sm">Drag & drop video or click</p>
                  <label className="inline-flex mt-2">
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoInput}
                    />
                    <span className="px-3 py-1.5 bg-sky-600 text-white text-sm rounded-md cursor-pointer">
                      Choose Video
                    </span>
                  </label>
                  {uploading && (
                    <div className="mt-3 text-xs text-slate-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading…
                    </div>
                  )}
                </div>

                {/* Audio */}
                <div className="space-y-2">
                  <Label>Music / Voice</Label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioInput}
                    className="w-full text-sm"
                  />
                  <Button
                    onClick={doMergeAudio}
                    disabled={!videoFile || !audioFile || isProcessing}
                    className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Music2 className="w-4 h-4" />
                    Merge audio
                  </Button>
                </div>

                {/* Subtitles controls (manual only) */}
                <div className="space-y-2">
                  <Label>Subtitles</Label>
                  <input
                    type="file"
                    accept=".srt,text/plain"
                    onChange={onSrtInput}
                    className="w-full text-sm"
                  />
                  <div className="flex flex-col gap-2 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2"
                      onClick={handleTranscribeClick}
                      disabled={!videoPublicUrl || transcribing}
                    >
                      {transcribing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {transcribing
                        ? "Transcribing…"
                        : "Transcribe audio & auto-time"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2"
                      onClick={handleGenerateSubsFromTranscript}
                      disabled={!transcript}
                    >
                      <SquareStack className="w-4 h-4" />
                      Generate subtitles from transcript
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span>Show subtitles</span>
                    <Switch
                      checked={showSubs}
                      onCheckedChange={setShowSubs}
                    />
                  </div>
                </div>

                {/* Aspect ratio */}
                <div className="space-y-2">
                  <Label>Aspect ratio</Label>
                  <div className="flex gap-2 flex-wrap">
                    {ASPECTS.map((a) => (
                      <Button
                        key={a.id}
                        variant={aspect === a.id ? "default" : "outline"}
                        onClick={() => setAspect(a.id)}
                        size="sm"
                      >
                        {a.id}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Look & color */}
                <div className="space-y-2">
                  <Label>Look & color</Label>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="flex justify-between">
                        <span>Brightness</span>
                        <span>{brightness}%</span>
                      </div>
                      <Slider
                        value={[brightness]}
                        onValueChange={(v) => {
                          pushHistory(serializeState());
                          setBrightness(v[0]);
                        }}
                        min={50}
                        max={150}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span>Contrast</span>
                        <span>{contrast}%</span>
                      </div>
                      <Slider
                        value={[contrast]}
                        onValueChange={(v) => {
                          pushHistory(serializeState());
                          setContrast(v[0]);
                        }}
                        min={50}
                        max={150}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span>Saturation</span>
                        <span>{saturation}%</span>
                      </div>
                      <Slider
                        value={[saturation]}
                        onValueChange={(v) => {
                          pushHistory(serializeState());
                          setSaturation(v[0]);
                        }}
                        min={0}
                        max={200}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span>Roundness</span>
                        <span>{rounded}px</span>
                      </div>
                      <Slider
                        value={[rounded]}
                        onValueChange={(v) => {
                          pushHistory(serializeState());
                          setRounded(v[0]);
                        }}
                        min={0}
                        max={32}
                      />
                    </div>
                  </div>
                </div>

                {/* Trim */}
                <div className="space-y-2">
                  <Label>Trim</Label>
                  <Button
                    onClick={doTrim}
                    disabled={!videoFile || isProcessing || duration === 0}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Scissors className="w-4 h-4" />
                    Apply Trim
                  </Button>
                  {ffmpegProgress !== null && (
                    <div className="w-full mt-2">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Processing</span>
                        <span>{Math.round(ffmpegProgress * 100)}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-2 bg-sky-500 transition-all"
                          style={{
                            width: `${Math.round(ffmpegProgress * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main: Preview, timeline, transcript, inspector */}
          <div className="col-span-12 lg:col-span-9 space-y-4">
            {/* Preview + timeline */}
            <Card className="border rounded-2xl shadow bg-white dark:bg-slate-900/70 dark:bg-slate-800/70">
              <CardContent className="p-3">
                {/* Preview stage */}
                <div className="w-full flex flex-col items-center">
                  <div
                    className="relative w-full"
                    style={{
                      aspectRatio: aspect.replace(":", "/"),
                      minHeight: "300px",
                    }}
                  >
                    {videoUrl ? (
                      <>
                        <video
                          ref={videoRef}
                          src={videoUrl}
                          controls
                          className="absolute inset-0 w-full h-full object-contain bg-black"
                          style={filterStyle}
                        />
                        {/* Overlays */}
                        <div
                          ref={overlayRef}
                          className="absolute inset-0 pointer-events-none"
                        >
                          {visibleOverlays.map((ov) =>
                            ov.image ? (
                              <img
                                key={ov.id}
                                src={ov.image}
                                alt="overlay"
                                className={`absolute select-none ${
                                  activeTextId === ov.id
                                    ? "ring-2 ring-sky-400"
                                    : ""
                                }`}
                                style={{
                                  left: ov.x,
                                  top: ov.y,
                                  width: ov.w,
                                  height: ov.h,
                                  pointerEvents: "auto",
                                }}
                                onMouseDown={(e) =>
                                  onOverlayMouseDown(e, ov.id)
                                }
                              />
                            ) : (
                              <div
                                key={ov.id}
                                className={`absolute px-2 py-1 rounded-md whitespace-pre-wrap ${
                                  activeTextId === ov.id
                                    ? "ring-2 ring-sky-400"
                                    : ""
                                }`}
                                style={{
                                  left: ov.x,
                                  top: ov.y,
                                  fontSize: ov.size,
                                  color: ov.color,
                                  fontWeight: ov.weight,
                                  textShadow: ov.shadow
                                    ? "0 2px 8px rgba(0,0,0,.6)"
                                    : "none",
                                  background: ov.bg,
                                  pointerEvents: "auto",
                                }}
                                onMouseDown={(e) =>
                                  onOverlayMouseDown(e, ov.id)
                                }
                              >
                                {ov.text}
                              </div>
                            )
                          )}

                          {/* Subtitles */}
                          {showSubs &&
                            subs.map((s, i) =>
                              currentTime >= s.start &&
                              currentTime <= s.end ? (
                                <div
                                  key={i}
                                  className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-[90%] px-3 py-1.5 rounded text-white text-center text-lg bg-black/60"
                                >
                                  {s.content}
                                </div>
                              ) : null
                            )}
                        </div>

                        {/* Transcription overlay while working */}
                        {transcribing && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Processing transcription…
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                        <Film className="w-10 h-10" />
                        <p>Upload a video to get started</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transport controls */}
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={togglePlay}
                    disabled={!videoUrl}
                    className="gap-2"
                  >
                    {videoRef.current && !videoRef.current.paused ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Play
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePreviewTrim}
                    disabled={!videoUrl}
                    className="gap-2"
                  >
                    <SquareStack className="w-4 h-4" />
                    Loop selection
                  </Button>
                  <div className="text-sm text-slate-600 ml-2">
                    {fmtTime(currentTime)} / {fmtTime(duration)}
                  </div>
                  <div className="grow" />
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Minimize2 className="w-4 h-4" />
                    <Slider
                      value={[zoomTimeline]}
                      onValueChange={(v) => setZoomTimeline(v[0])}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="w-40"
                    />
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>

                {/* Timeline */}
                {duration > 0 && (
                  <div className="w-full mt-2 px-2">
                    <div className="relative h-2 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 h-2 bg-blue-500"
                        style={{
                          left: `${(range[0] / duration) * 100}%`,
                          width: `${
                            ((range[1] - range[0]) / duration) * 100
                          }%`,
                        }}
                      />
                      <div
                        className="absolute top-[-2px] w-1 h-4 bg-white dark:bg-slate-900 border border-blue-600 rounded-full shadow"
                        style={{
                          left: `${(currentTime / duration) * 100}%`,
                          transition: "left 0.1s linear",
                        }}
                      />
                    </div>
                    <p className="text-sm text-slate-500 mt-2 text-center">
                      Trim Range: {range[0].toFixed(1)}s →{" "}
                      {range[1].toFixed(1)}s / {duration.toFixed(1)}s
                    </p>
                    <Range
                      values={range}
                      step={0.1}
                      min={0}
                      max={duration}
                      onChange={setRange}
                      renderTrack={({ props, children }) => {
                        const { key, ...rest } = props;
                        return (
                          <div
                            key={key}
                            {...rest}
                            className="h-2 mt-3 rounded"
                            style={{
                              background: getTrackBackground({
                                values: range,
                                colors: [
                                  "#e2e8f0",
                                  "#3b82f6",
                                  "#e2e8f0",
                                ],
                                min: 0,
                                max: duration,
                              }),
                            }}
                          >
                            {children}
                          </div>
                        );
                      }}
                      renderThumb={({ props }) => {
                        const { key, ...rest } = props;
                        return (
                          <div
                            key={key}
                            {...rest}
                            className="w-4 h-4 bg-sky-500 rounded-full shadow"
                          />
                        );
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hints */}
            <Card className="bg-white dark:bg-slate-900/70 dark:bg-slate-800/70 border rounded-2xl">
              <CardContent className="p-3 text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Coming soon: multi-clip timeline, transitions, AI
                auto-captions, background remover.
              </CardContent>
            </Card>

            {/* Transcript */}
            {transcript && (
              <Card className="bg-white dark:bg-slate-900/70 dark:bg-slate-800/70 border rounded-2xl">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold mb-1 text-sky-700">
                    🎙️ Transcription
                  </h3>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {transcript}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={downloadTranscript}
                  >
                    <Download className="w-4 h-4" />
                    Download Transcript (.txt)
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Inspector (below main content) */}
            <Card className="bg-white dark:bg-slate-900/70 dark:bg-slate-800/70 border rounded-2xl shadow">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-sky-600 flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Inspector
                </h3>
                {!currentOverlay ? (
                  <div className="text-sm text-slate-500">
                    Select a text or image overlay on the canvas to edit its
                    properties.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentOverlay.image ? (
                      <div className="space-y-2">
                        <Label>Image size</Label>
                        <div className="flex items-center gap-2">
                          <Label className="w-16 text-xs text-slate-500">
                            Width
                          </Label>
                          <Input
                            type="number"
                            value={currentOverlay.w}
                            onChange={(e) =>
                              setTexts((t) =>
                                t.map((x) =>
                                  x.id === currentOverlay.id
                                    ? {
                                        ...x,
                                        w:
                                          parseInt(e.target.value) ||
                                          currentOverlay.w,
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="w-16 text-xs text-slate-500">
                            Height
                          </Label>
                          <Input
                            type="number"
                            value={currentOverlay.h}
                            onChange={(e) =>
                              setTexts((t) =>
                                t.map((x) =>
                                  x.id === currentOverlay.id
                                    ? {
                                        ...x,
                                        h:
                                          parseInt(e.target.value) ||
                                          currentOverlay.h,
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>Text</Label>
                          <Input
                            value={currentOverlay.text}
                            onChange={(e) =>
                              setTexts((t) =>
                                t.map((x) =>
                                  x.id === currentOverlay.id
                                    ? { ...x, text: e.target.value }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-slate-500">
                              Size
                            </Label>
                            <Input
                              type="number"
                              value={currentOverlay.size}
                              onChange={(e) =>
                                setTexts((t) =>
                                  t.map((x) =>
                                    x.id === currentOverlay.id
                                      ? {
                                          ...x,
                                          size:
                                            parseInt(e.target.value) ||
                                            currentOverlay.size,
                                        }
                                      : x
                                  )
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">
                              Weight
                            </Label>
                            <Input
                              type="number"
                              value={currentOverlay.weight}
                              onChange={(e) =>
                                setTexts((t) =>
                                  t.map((x) =>
                                    x.id === currentOverlay.id
                                      ? {
                                          ...x,
                                          weight:
                                            parseInt(e.target.value) ||
                                            currentOverlay.weight,
                                        }
                                      : x
                                  )
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">
                              Text color
                            </Label>
                            <Input
                              type="color"
                              value={currentOverlay.color}
                              onChange={(e) =>
                                setTexts((t) =>
                                  t.map((x) =>
                                    x.id === currentOverlay.id
                                      ? { ...x, color: e.target.value }
                                      : x
                                  )
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">
                              Background
                            </Label>
                            <Input
                              type="text"
                              value={currentOverlay.bg}
                              onChange={(e) =>
                                setTexts((t) =>
                                  t.map((x) =>
                                    x.id === currentOverlay.id
                                      ? { ...x, bg: e.target.value }
                                      : x
                                  )
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Shadow</span>
                          <Switch
                            checked={!!currentOverlay.shadow}
                            onCheckedChange={(v) =>
                              setTexts((t) =>
                                t.map((x) =>
                                  x.id === currentOverlay.id
                                    ? { ...x, shadow: v }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-slate-500">
                          Start (s)
                        </Label>
                        <Input
                          type="number"
                          value={Math.max(0, currentOverlay.start || 0)}
                          onChange={(e) =>
                            setTexts((t) =>
                              t.map((x) =>
                                x.id === currentOverlay.id
                                  ? {
                                      ...x,
                                      start: Math.max(
                                        0,
                                        parseFloat(e.target.value) || 0
                                      ),
                                    }
                                  : x
                              )
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">
                          End (s)
                        </Label>
                        <Input
                          type="number"
                          value={Math.max(0, currentOverlay.end || 0)}
                          onChange={(e) =>
                            setTexts((t) =>
                              t.map((x) =>
                                x.id === currentOverlay.id
                                  ? {
                                      ...x,
                                      end: Math.max(
                                        0,
                                        parseFloat(e.target.value) || 0
                                      ),
                                    }
                                  : x
                              )
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={removeActiveOverlay}
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
