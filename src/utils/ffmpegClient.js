// ✅ Final Vite + React FFmpeg Loader (working for Module {} case)
let ffmpegInstance = null;

export const ensureFFmpegLoaded = async () => {
  if (!ffmpegInstance) {
    const mod = await import("@ffmpeg/ffmpeg");

    // Log once for verification
    console.log("🔍 Imported FFmpeg module:", mod);
    console.log("📦 Available keys:", Object.keys(mod));

    // ✅ Handle all possible wrapping structures
    const ffmpegExports =
      mod?.default?.default?.createFFmpeg
        ? mod.default.default
        : mod?.default?.createFFmpeg
        ? mod.default
        : mod.createFFmpeg
        ? mod
        : null;

    if (!ffmpegExports) {
      console.error("❌ Unrecognized FFmpeg import shape:", mod);
      throw new Error("FFmpeg module structure not recognized.");
    }

    const { createFFmpeg, fetchFile } = ffmpegExports;

    ffmpegInstance = createFFmpeg({
      log: true,
      corePath: "https://unpkg.com/@ffmpeg/core@0.12.4/dist/ffmpeg-core.js",
    });

    ffmpegInstance.fetchFile = fetchFile;
  }

  if (!ffmpegInstance.isLoaded()) {
    await ffmpegInstance.load();
    console.log("✅ ffmpeg.wasm loaded successfully!");
  }

  return ffmpegInstance;
};

// ✂️ Trim video
export const trimVideo = async (file, start, end) => {
  const ffmpeg = await ensureFFmpegLoaded();

  const inputName = "input.mp4";
  const outputName = "trimmed.mp4";

  ffmpeg.FS("writeFile", inputName, await ffmpeg.fetchFile(file));

  await ffmpeg.run(
    "-ss",
    `${start}`,
    "-to",
    `${end}`,
    "-i",
    inputName,
    "-c",
    "copy",
    outputName
  );

  const data = ffmpeg.FS("readFile", outputName);
  const blob = new Blob([data.buffer], { type: "video/mp4" });
  return URL.createObjectURL(blob);
};

// 🎵 Merge background audio
export const mergeAudio = async (videoFile, audioFile) => {
  const ffmpeg = await ensureFFmpegLoaded();

  ffmpeg.FS("writeFile", "input.mp4", await ffmpeg.fetchFile(videoFile));
  ffmpeg.FS("writeFile", "audio.mp3", await ffmpeg.fetchFile(audioFile));

  await ffmpeg.run(
    "-i",
    "input.mp4",
    "-i",
    "audio.mp3",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-shortest",
    "output.mp4"
  );

  const mergedData = ffmpeg.FS("readFile", "output.mp4");
  const mergedBlob = new Blob([mergedData.buffer], { type: "video/mp4" });
  return URL.createObjectURL(mergedBlob);
};

// src/utils/ffmpegClient.js
/*export async function trimVideo(file, start, end) {
  console.log("Trimming video locally (stub)");
  return URL.createObjectURL(file);
}

export async function mergeAudio(videoFile, audioFile) {
  console.log("Merging audio locally (stub)");
  return URL.createObjectURL(videoFile);
}*/

// Optional placeholders so imports don't fail
export async function concatClips() {
  console.warn("concatClips not implemented yet");
}

export async function exportProject() {
  console.warn("exportProject not implemented yet");
}

