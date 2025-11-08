import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Leaflet Icon Fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Component to handle map clicks and setting position
function MapClickHandler({ onLocationSelect, initialPosition }) {
  const [position, setPosition] = useState(initialPosition);
  const map = useMap();

  useEffect(() => {
    // If initialPosition is null, try to geolocate user
    if (!initialPosition) {
      map.locate().on("locationfound", function (e) {
        setPosition(e.latlng);
        map.flyTo(e.latlng, 16);
        onLocationSelect(e.latlng);
      });
    }
  }, [map, initialPosition, onLocationSelect]);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

// Main Location Picker component
export default function LocationPicker({ onLocationSelect, initialPosition = null }) {
  // Default to a wide view of India
  const mapCenter = initialPosition ? [initialPosition.lat, initialPosition.lng] : [20.5937, 78.9629];
  const mapZoom = initialPosition ? 16 : 5;

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden border-2 border-base-300 z-0">
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        <MapClickHandler 
          onLocationSelect={onLocationSelect} 
          initialPosition={initialPosition} 
        />
      </MapContainer>
    </div>
  );
}