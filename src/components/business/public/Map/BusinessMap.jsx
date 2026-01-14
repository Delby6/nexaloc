// src/components/business/public/Map/BusinessMap.jsx
import { MapPin } from "lucide-react";

export default function BusinessMap({ coords, mapLoading }) {
  return (
    <div className="mt-2">
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-slate-800 dark:text-slate-100">
        <MapPin className="w-4 h-4 text-sky-600" />
        Location Map
      </h3>
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        {mapLoading ? (
          <div className="flex items-center justify-center h-[300px] text-slate-400 dark:text-slate-500">
            Loading map...
          </div>
        ) : coords ? (
          <iframe
            title="Business Location"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${
              coords.lon - 0.02
            },${coords.lat - 0.02},${coords.lon + 0.02},${
              coords.lat + 0.02
            }&layer=mapnik&marker=${coords.lat},${coords.lon}`}
            className="w-full h-[300px]"
            allowFullScreen
            loading="lazy"
          ></iframe>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-slate-400 dark:text-slate-500">
            Location not available.
          </div>
        )}
      </div>
    </div>
  );
}
