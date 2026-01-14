// src/components/business/details/BusinessHeader.jsx
import { ArrowLeft, MapPin, Wrench } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function BusinessHeader({
  business,
  businessUrl,
  isOwner,
  onBack,
  qrCanvasRef,
  onDownloadQR,
}) {
  return (
    <>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sky-600 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex flex-col md:flex-row md:justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold mb-1">{business.name}</h2>

          <div className="flex items-center gap-4 text-slate-500 mb-3">
            <span className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-sky-500" />
              {business.category}
            </span>

            {business.village && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-500" />
                {business.village}
              </span>
            )}
          </div>

          {business.description && (
            <p className="text-slate-700 dark:text-slate-300">
              {business.description}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-2" ref={qrCanvasRef}>
          <QRCodeCanvas value={businessUrl} size={110} includeMargin />

          {isOwner && (
            <button
              onClick={onDownloadQR}
              className="px-3 py-1 bg-sky-600 text-white rounded text-xs"
            >
              Download QR
            </button>
          )}
        </div>
      </div>
    </>
  );
}
