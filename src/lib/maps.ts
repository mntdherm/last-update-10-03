import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDKHehSPh4RLaknK32pWFgIhoA4OeYC-Oc';

let geocoder: google.maps.Geocoder | null = null;

export const initGeocoder = async () => {
  if (geocoder) return geocoder;
  
  const loader = new Loader({
    apiKey: GOOGLE_MAPS_API_KEY,
    version: 'weekly',
  });

  await loader.load();
  geocoder = new google.maps.Geocoder();
  return geocoder;
};

export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  const geocoder = await initGeocoder();
  
  if (!address.trim()) {
    return null;
  }

  try {
    const response = await geocoder.geocode({ address });
    
    if (response.results.length > 0) {
      const { lat, lng } = response.results[0].geometry.location;
      return {
        lat: lat(),
        lng: lng()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null; // Return null for any geocoding errors
  }
};
