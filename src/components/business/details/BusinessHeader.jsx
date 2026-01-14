// src/components/business/details/BusinessHeader.jsx
import React from "react";
import { ArrowLeft, MapPin, Wrench, Mail } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";


export default function BusinessHeader({
  business,
  businessUrl,
  qrCanvasRef,
  isOwner,
  downloadQR,
}) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between gap-8 p-6 bg-white dark:bg-slate-800 rounded-xl shadow border">

      {/* LEFT SIDE: BUSINESS INFORMATION */}
      <div className="flex-1 space-y-3">

        {/* Business Name */}
        <h2 className="text-3xl font-bold">{business.name}</h2>

        {/* Category + Village */}
        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1">
            <Wrench className="w-4 h-4 text-sky-500" />
            {business.category}
          </span>

          {business.village && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-sky-500" />
              {business.village}
            </span>
          )}
        </div>

        {/* Description */}
        {business.description && (
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {business.description}
          </p>
        )}

        {/* ───────────────────────────── */}
        {/* MERGED BUSINESS META SECTION */}
        {/* ───────────────────────────── */}
        <div className="space-y-2 text-slate-700 dark:text-slate-300 border-t pt-4 mt-4">

          {business.address && (
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-500" />
              <strong>Address:</strong> {business.address}
            </p>
          )}

          {business.phone && (
            <p className="flex items-center gap-2">
              📞 <strong>Phone:</strong>
              <a href={`tel:${business.phone}`} className="text-sky-600">
                {business.phone}
              </a>
            </p>
          )}

          {business.contact && (
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-500" />
              <strong>Email:</strong>
              <a href={`mailto:${business.contact}`} className="text-sky-600">
                {business.contact}
              </a>
            </p>
          )}

          {business.website && (
            <p className="flex items-center gap-2">
              🌐 <strong></strong>
              <a
                href={business.website}
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 underline"
              >
                Visit the Business website
              </a>
            </p>
          )}
        </div>

      </div>

      {/* RIGHT SIDE: QR CODE */}
      <div className="flex flex-col items-center gap-3" ref={qrCanvasRef}>
        <QRCodeCanvas value={businessUrl} size={160} includeMargin />

        {isOwner && (
          <button
            onClick={downloadQR}
            className="px-4 py-2 bg-sky-600 text-white rounded-md shadow"
          >
            Download QR
          </button>
        )}
      </div>
    </div>
  );
}
