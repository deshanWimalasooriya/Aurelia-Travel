import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import PlannerContainer from '../components/common/PlannerContainer'; // Adjust import path if needed
import './styles/TravelPage.css';

// Fix for default Leaflet icons missing in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
const LocationPicker = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      // Get the coordinates
      const coords = `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
      onLocationSelect(coords, e.latlng);
    },
  });
  return null;
};

export default function TravelPlan() {
  const [startLoc, setStartLoc] = useState(null);
  const [endLoc, setEndLoc] = useState(null);
  
  // Track which pin we are placing next (Start or End)
  const [pickingMode, setPickingMode] = useState('start'); // 'start' or 'end'

  const handleMapClick = (coordString, latlngObj) => {
    if (pickingMode === 'start') {
      setStartLoc({ text: coordString, coords: latlngObj });
      setPickingMode('end'); // Automatically switch to picking End location next
    } else {
      setEndLoc({ text: coordString, coords: latlngObj });
      setPickingMode('start'); // Reset back to start
    }
  };

  return (
    <div className="travel-plan-page">
      
      {/* FULL SCREEN BACKGROUND MAP */}
      {/* FULL SCREEN BACKGROUND MAP */}
      <div className="map-background-wrapper">
        <MapContainer 
          center={[7.8731, 80.7718]} // Centers on Sri Lanka
          zoom={7} 
          minZoom={4} /* <-- Prevents user from zooming out too far into the white void */
          zoomControl={false}
          className="fullscreen-map"
          maxBounds={[[-90, -180], [90, 180]]} /* <-- Prevents dragging off the edge of the world */
          maxBoundsViscosity={1.0} /* <-- Makes the edges solid so it bounces back */
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            noWrap={true} /* <-- Stops the map from repeating horizontally */
          />
          
          <LocationPicker onLocationSelect={handleMapClick} />

          {startLoc && (
            <Marker position={startLoc.coords}>
              <Popup><strong>Start Location</strong><br/>{startLoc.text}</Popup>
            </Marker>
          )}
          
          {endLoc && (
            <Marker position={endLoc.coords}>
              <Popup><strong>End Location</strong><br/>{endLoc.text}</Popup>
            </Marker>
          )}
        </MapContainer>
        
        {/* Subtle overlay so the map doesn't distract from the form */}
        <div className="map-overlay-tint"></div>
      </div>

      {/* FLOATING UI OVER THE MAP */}
      <div className="floating-content-layer">
        <div className="travel-plan-header">
          <h1>Design Your <span>Perfect Escape</span></h1>
          <p>
            {pickingMode === 'start' 
              ? "Click on the map to set your Starting Location, or type it below." 
              : "Click on the map to set your Destination!"}
          </p>
        </div>

        <PlannerContainer 
          mapStart={startLoc?.text} 
          mapEnd={endLoc?.text} 
        />
      </div>

    </div>
  );
}