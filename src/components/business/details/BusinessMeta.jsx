// src/components/business/details/BusinessMeta.jsx
import { MapPin, Mail } from "lucide-react";

export default function BusinessMeta({ business }) {
  return (
    <div className="border-t mt-6 pt-4 space-y-2 text-slate-600">
      {business.address && (
        <p className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sky-500" />
          <strong>Address:</strong> {business.address}
        </p>
      )}

      {business.phone && (
        <p className="flex items-center gap-2">
          📞 <strong>Phone:</strong>{" "}
          <a href={`tel:${business.phone}`} className="text-sky-600">
            {business.phone}
          </a>
        </p>
      )}

      {business.contact && (
        <p className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-sky-500" />
          <strong>Email:</strong>{" "}
          <a href={`mailto:${business.contact}`} className="text-sky-600">
            {business.contact}
          </a>
        </p>
      )}

      {business.website && (
        <p className="flex items-center gap-2">
          🌐 <strong>Website:</strong>{" "}
          <a
            href={business.website}
            target="_blank"
            rel="noreferrer"
            className="text-sky-600 underline"
          >
            Visit Website
          </a>
        </p>
      )}
    </div>
  );
}
