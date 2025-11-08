import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';

// Leaflet Icon Fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom icons for different statuses
const iconPending = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const iconInProgress = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const iconResolved = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const getIcon = (status) => {
  switch (status) {
    case 'In Progress': return iconInProgress;
    case 'Resolved': return iconResolved;
    case 'Pending':
    default:
      return iconPending;
  }
};

export default function IssueMap({ issues = [] }) {
  
  const mapCenter = useMemo(() => {
    if (issues.length > 0) {
      // Average all coordinates to find center
      const avgLat = issues.reduce((acc, issue) => acc + issue.location.coordinates[1], 0) / issues.length;
      const avgLng = issues.reduce((acc, issue) => acc + issue.location.coordinates[0], 0) / issues.length;
      return [avgLat, avgLng];
    }
    return [20.5937, 78.9629]; // Default to India
  }, [issues]);

  const mapZoom = issues.length > 0 ? 12 : 5;

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden border-2 border-base-300 shadow-lg z-0">
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%' }}
        // Add a key to force re-render when center changes
        key={mapCenter.join('_')}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        
        {issues.map(issue => (
          <Marker 
            key={issue._id} 
            position={[issue.location.coordinates[1], issue.location.coordinates[0]]} // [lat, lng]
            icon={getIcon(issue.status)}
          >
            <Popup>
              <div className="font-bold text-lg">{issue.title}</div>
              <div className="flex items-center gap-2">
                <span className={`badge ${
                  issue.status === 'Resolved' ? 'badge-success' :
                  issue.status === 'In Progress' ? 'badge-info' : 'badge-warning'
                }`}>{issue.status}</span>
                <span className="badge badge-neutral">{issue.category}</span>
              </div>
              <p className="my-2">{issue.description?.substring(0, 50)}...</p>
              {issue.imageUrl && (
                <img src={issue.imageUrl} alt={issue.title} className="w-full h-24 object-cover rounded-md my-2" />
              )}
              <p className="text-xs text-gray-500">
                Reported by: {issue.createdBy?.firstName || 'Anonymous'}
              </p>
              <p className="text-xs text-gray-500">
                Ward: {issue.ward?.name || 'N/A'}
              </p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}