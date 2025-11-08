import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Leaflet Icon Fix (Ensures markers show up) ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
// --- End Leaflet Icon Fix ---


/**
 * Internal component to handle map events (click, locate, flyTo).
 */
function MapController({ onLocationSelect, flyToCoords, disableSearch }) {
  const [position, setPosition] = useState(null);
  const map = useMap();

  // --- Handle Map Clicks ---
  // This allows the user to refine the pin position by clicking
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);
      if (onLocationSelect) {
        onLocationSelect(e.latlng);
      }
    },
  });

  // --- Handle Search vs. Geolocation ---
  useEffect(() => {
    if (flyToCoords) {
      // 1. Admin searched for a location
      map.flyTo([flyToCoords.lat, flyToCoords.lng], 15);
      setPosition(flyToCoords);
      if (onLocationSelect) {
        onLocationSelect(flyToCoords);
      }
    } else if (disableSearch && !position) {
      // 2. Citizen is reporting, try to find their location
      map.locate().on("locationfound", function (e) {
        setPosition(e.latlng);
        map.flyTo(e.latlng, 16); // Zoom in close
        if (onLocationSelect) {
          onLocationSelect(e.latlng);
        }
      }).on("locationerror", function () {
        // Alert user if geolocation fails
        alert("Could not find your location. Please click on the map to set the location manually.");
      });
    }
  }, [flyToCoords, map, onLocationSelect, disableSearch, position]);


  // Render the marker at the clicked/searched position
  return position ? <Marker position={position}></Marker> : null;
}


/**
 * The main LocationPicker component, now with conditional search.
 * @param {function} onLocationSelect - Callback when location is selected
 * @param {boolean} [disableSearch=false] - If true, hides search and enables geolocation
 */
function LocationPicker({ onLocationSelect, disableSearch = false }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [flyToCoords, setFlyToCoords] = useState(null); // State to trigger the "fly-to"
  const [isLoading, setIsLoading] = useState(false);

  // --- Geocoding Search Handler (for Admin) ---
  const handleSearch = async (e) => {
    e.preventDefault(); 
    if (!searchQuery) return;
    setIsLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFlyToCoords({ lat: parseFloat(lat), lng: parseFloat(lon) });
      } else {
        alert("Location not found. Please try a different search term (e.g., 'City, State').");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      alert("Failed to fetch location. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* --- CONDITIONAL: Search Bar --- */}
      {/* Only show search bar if disableSearch is false (default) */}
      {!disableSearch && (
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a location (e.g., Gokul Shirgaon)"
            className="input input-bordered w-full"
          />
          <button type="button" className={`btn btn-primary ${isLoading ? 'loading' : ''}`} onClick={handleSearch} disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      )}
      
      {/* --- Map --- */}
      <div className="h-64 w-full rounded-lg overflow-hidden border-2 border-base-300 z-0">
        <MapContainer
          center={[20.5937, 78.9629]} // Initial center (India)
          zoom={5} // Initial zoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <MapController
            onLocationSelect={onLocationSelect}
            flyToCoords={flyToCoords}
            disableSearch={disableSearch} // Pass the prop down
          />
        </MapContainer>
      </div>
    </div>
  );
}

export default LocationPicker;