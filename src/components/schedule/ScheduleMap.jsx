import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for Leaflet in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function ScheduleMap({ games, locations = [] }) {
  // Build a lookup map from location id -> location data
  const locationById = {};
  locations.forEach(l => { locationById[l.id] = l; });

  // Filter games that have a location with coordinates
  const mappableGames = games.filter(g => {
    const loc = locationById[g.location_id];
    return loc?.lat && loc?.lng;
  });

  // Group by location
  const locationMap = {};
  mappableGames.forEach(g => {
    const loc = locationById[g.location_id];
    const key = `${loc.lat},${loc.lng}`;
    if (!locationMap[key]) {
      locationMap[key] = { lat: loc.lat, lng: loc.lng, name: loc.name, address: loc.address, games: [] };
    }
    locationMap[key].games.push(g);
  });

  const mappedLocations = Object.values(locationMap);

  // Default to GTA centre if no locations
  const center = mappedLocations.length > 0
    ? [mappedLocations[0].lat, mappedLocations[0].lng]
    : [43.7, -79.42];

  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height: 340, position: 'relative', zIndex: 0 }}>
      {mappedLocations.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center bg-muted/30 text-muted-foreground gap-2">
          <span className="text-sm">No game locations with coordinates yet.</span>
          <span className="text-xs">Add lat/lng to locations in the Admin panel.</span>
        </div>
      ) : (
        <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {mappedLocations.map((loc, idx) => (
            <Marker key={idx} position={[loc.lat, loc.lng]} icon={customIcon}>
              <Popup>
                <div className="text-sm min-w-[180px]">
                  <p className="font-bold text-base">{loc.name}</p>
                  {loc.address && <p className="text-muted-foreground text-xs mb-2">{loc.address}</p>}
                  <div className="space-y-1.5 mt-2 border-t pt-2">
                    {loc.games.map(g => (
                      <div key={g.id} className="text-xs">
                        <p className="font-semibold">{g.home_team_name} vs {g.away_team_name}</p>
                        <p className="text-gray-500">
                          {g.date && format(new Date(g.date), "MMM d")}
                          {g.time && ` · ${g.time}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}