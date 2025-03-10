import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import type { Vendor } from '../types/database';
import { Search } from 'lucide-react';

interface MapProps {
  vendors: Vendor[];
  onVendorSelect?: (vendorId: string) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
}

const Map: React.FC<MapProps> = ({ 
  vendors, 
  onVendorSelect,
  onLocationSelect,
  center = { lat: 60.1699, lng: 24.9384 }, // Default to Helsinki
  zoom = 11 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: 'AIzaSyDKHehSPh4RLaknK32pWFgIhoA4OeYC-Oc',
      version: 'weekly',
      libraries: ['places']
    });

    loader.load().then(() => {
      if (mapRef.current && searchInputRef.current) {
        const mapInstance = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        const searchBoxInstance = new google.maps.places.SearchBox(searchInputRef.current);
        const geocoderInstance = new google.maps.Geocoder();

        // Bias SearchBox results towards current map's viewport
        mapInstance.addListener('bounds_changed', () => {
          searchBoxInstance.setBounds(mapInstance.getBounds() as google.maps.LatLngBounds);
        });

        // Listen for the event fired when the user selects a prediction
        searchBoxInstance.addListener('places_changed', () => {
          const places = searchBoxInstance.getPlaces();
          if (!places || places.length === 0) return;

          const place = places[0];
          if (!place.geometry || !place.geometry.location) return;

          // Update map
          if (place.geometry.viewport) {
            mapInstance.fitBounds(place.geometry.viewport);
          } else {
            mapInstance.setCenter(place.geometry.location);
            mapInstance.setZoom(17);
          }

          // Notify parent component about selected location
          if (onLocationSelect) {
            onLocationSelect({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              address: place.formatted_address || ''
            });
          }
        });

        setMap(mapInstance);
        setSearchBox(searchBoxInstance);
        setGeocoder(geocoderInstance);
        setInfoWindow(new google.maps.InfoWindow());
      }
    });
  }, []);

  useEffect(() => {
    if (!map || !infoWindow) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    // Create new markers for vendors
    const newMarkers = vendors.map(vendor => {
      if (!vendor.location) return null;

      const marker = new google.maps.Marker({
        position: vendor.location,
        map,
        title: vendor.businessName,
        animation: google.maps.Animation.DROP
      });

      const content = `
        <div class="p-2">
          <h3 class="font-semibold">${vendor.businessName}</h3>
          <p class="text-sm text-gray-600">${vendor.address}</p>
          <button 
            class="mt-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
            onclick="window.selectVendor('${vendor.id}')"
          >
            Näytä tiedot
          </button>
        </div>
      `;

      marker.addListener('click', () => {
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      });

      return marker;
    }).filter(Boolean) as google.maps.Marker[];

    setMarkers(newMarkers);

    // Add the selectVendor function to window object
    (window as any).selectVendor = (vendorId: string) => {
      if (onVendorSelect) {
        onVendorSelect(vendorId);
        infoWindow.close();
      }
    };

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        if (marker.getPosition()) {
          bounds.extend(marker.getPosition()!);
        }
      });
      map.fitBounds(bounds);
    }

    return () => {
      delete (window as any).selectVendor;
    };
  }, [vendors, map, infoWindow]);

  // Function to geocode address
  const geocodeAddress = async (address: string) => {
    if (!geocoder) return null;

    try {
      const result = await geocoder.geocode({ address });
      if (result.results.length > 0) {
        const location = result.results[0].geometry.location;
        return {
          lat: location.lat(),
          lng: location.lng(),
          address: result.results[0].formatted_address
        };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  return (
    <div className="relative h-full">
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Etsi osoitetta..."
            className="w-full px-4 py-2 pl-10 bg-white rounded-lg shadow-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
      </div>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
};

export default Map;
