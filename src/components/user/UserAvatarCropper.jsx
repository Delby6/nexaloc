// src/pages/user/UserAvatarCropper.jsx
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

// Helper: load image
async function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

// Helper: crop -> File
async function getCroppedFile(imageSrc, pixelCrop, fileName = "avatar.jpg") {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const file = new File([blob], fileName, { type: "image/jpeg" });
        resolve(file);
      },
      "image/jpeg",
      0.9
    );
  });
}

export default function UserAvatarCropper({
  isOpen,
  imageSrc,
  fileName,
  onClose,
  onCropped,
  saving,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [localProcessing, setLocalProcessing] = useState(false);

  const onCropComplete = useCallback((_area, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  if (!isOpen || !imageSrc) return null;

  async function handleSave() {
    if (!croppedAreaPixels || !imageSrc) return;
    try {
      setLocalProcessing(true);
      const file = await getCroppedFile(imageSrc, croppedAreaPixels, fileName);
      await onCropped(file);
    } finally {
      setLocalProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <div className="bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-4 border border-slate-700">
        <h2 className="text-lg font-semibold mb-3">Adjust profile photo</h2>

        <div className="relative w-full h-72 bg-slate-800 rounded-lg overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-slate-400 w-16">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-md bg-slate-700 hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || localProcessing}
            className="px-3 py-1.5 text-xs rounded-md bg-sky-600 hover:bg-sky-700 disabled:opacity-60"
          >
            {saving || localProcessing ? "Saving..." : "Save photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
