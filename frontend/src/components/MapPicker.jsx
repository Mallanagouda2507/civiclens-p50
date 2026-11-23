import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Navigation, MapPin } from 'lucide-react';

export const MapPicker = ({ coordinates, onChangeCoordinates, onAddressResolved }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [geoLocating, setGeoLocating] = useState(false);

  // Default center: Bengaluru City Corporation [lat, lng]
  const defaultLat = 12.9716;
  const defaultLng = 77.5946;

  const currentLat = coordinates && coordinates[1] ? coordinates[1] : defaultLat;
  const currentLng = coordinates && coordinates[0] ? coordinates[0] : defaultLng;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([currentLat, currentLng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Create draggable pin
      const pinIcon = L.divIcon({
        className: 'custom-pin-wrapper',
        html: `<div style="background-color: #2563eb; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"><div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%;"></div></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });

      const marker = L.marker([currentLat, currentLng], {
        icon: pinIcon,
        draggable: true
      }).addTo(map);

      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        handlePositionChange(lat, lng);
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        handlePositionChange(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handlePositionChange = (lat, lng) => {
    const roundedLat = Math.round(lat * 10000) / 10000;
    const roundedLng = Math.round(lng * 10000) / 10000;
    onChangeCoordinates([roundedLng, roundedLat]); // GeoJSON [lng, lat]

    // Reverse geocode placeholder address resolution
    if (onAddressResolved) {
      onAddressResolved(`Ward Locality (${roundedLat.toFixed(4)}° N, ${roundedLng.toFixed(4)}° E)`);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
          handlePositionChange(latitude, longitude);
        }
        setGeoLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        // Fallback to municipal center
        setGeoLocating(false);
        alert('Could not fetch exact device GPS. Please click on the map to drop pin.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '280px',
          borderRadius: '0.5rem',
          border: '1px solid #cbd5e1',
          zIndex: 10
        }}
      />

      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 400,
        display: 'flex',
        gap: '0.5rem'
      }}>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="btn btn-secondary btn-sm"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            fontSize: '0.75rem',
            fontWeight: 600
          }}
        >
          <Navigation size={14} color="#2563eb" />
          <span>{geoLocating ? 'Locating...' : 'Use My GPS'}</span>
        </button>
      </div>

      <div style={{
        marginTop: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <MapPin size={14} color="#2563eb" />
          <span>Click anywhere on the map or drag the pin to set exact coordinates.</span>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', background: '#e2e8f0', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', color: '#1e293b' }}>
          Lat: {currentLat.toFixed(4)}, Lng: {currentLng.toFixed(4)}
        </div>
      </div>
    </div>
  );
};
