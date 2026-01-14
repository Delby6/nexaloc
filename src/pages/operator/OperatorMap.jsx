import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import { supabase } from "../../lib/supabaseClient";

const businessIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

export default function OperatorMap() {
  const [businesses, setBusinesses] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, village, category, latitude, longitude")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      setBusinesses(data || []);
    };

    load();
  }, []);

  const center = [51.9194, 19.1451]; // Poland center

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-100">Map</h1>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 h-[600px] overflow-hidden">
        <MapContainer
          center={center}
          zoom={6}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution=""
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png"
          />

          {businesses.map((b) => (
            <Marker
              key={b.id}
              position={[b.latitude, b.longitude]}
              icon={businessIcon}
            >
              <Popup>
                <div className="font-semibold">{b.name}</div>
                <div className="text-xs text-slate-600">{b.category}</div>
                <div className="text-xs text-slate-600">{b.village}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
