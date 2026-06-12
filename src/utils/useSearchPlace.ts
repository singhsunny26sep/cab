// src/hooks/useSearchPlace.ts
import { useState } from 'react';
import { GOOGLE_API_KEY } from '../constants/contants';

const useSearchPlace = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchPlaceByText = async (query: string) => {
    if (!query.trim()) {
      console.log('[useSearchPlace] Empty query, skipping search');
      setPlaces([]);
      return;
    }
    const encodedQuery = encodeURIComponent(query);
    const apiUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&key=${GOOGLE_API_KEY}`;
    console.log('[useSearchPlace] Searching for:', query);
    console.log('[useSearchPlace] API URL:', apiUrl);
    try {
      setLoading(true);
      const response = await fetch(apiUrl);
      const data = await response.json();
      console.log('[useSearchPlace] API Response status:', data.status);
      console.log('[useSearchPlace] API Response:', JSON.stringify(data).substring(0, 500));

      if (data?.status === 'OK' && data?.results?.length > 0) {
        const formattedResults = data.results.map((place: any) => ({
          name: place.name,
          address: place.formatted_address,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          place_id: place.place_id,
        }));
        console.log('[useSearchPlace] Formatted results count:', formattedResults.length);
        setPlaces(formattedResults);
      } else {
        console.log('[useSearchPlace] No results or API error. Status:', data?.status);
        console.log('[useSearchPlace] Error message:', data?.error_message);
        setPlaces([]);
      }
    } catch (error: any) {
      console.error('[useSearchPlace] Fetch error:', error.message);
      console.error('[useSearchPlace] Error stack:', error.stack);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  return { searchPlaceByText, places, loading };
};

export default useSearchPlace;
