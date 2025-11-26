// src/hooks/useSearchPlace.ts
import { useState } from 'react';
import { GOOGLE_API_KEY } from '../constants/contants';

const useSearchPlace = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchPlaceByText = async (query: string) => {
    if (!query.trim()) return;
    const encodedQuery = encodeURIComponent(query);
    

    console.log("object ->>>>>>", `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&key=${GOOGLE_API_KEY}`)

    try {
      setLoading(true);
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();

      if (data?.results?.length > 0) {
        const formattedResults = data.results.map((place: any) => ({
          name: place.name,
          address: place.formatted_address,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          place_id: place.place_id,
        }));
        console.log("formattedResults_____________________>>>>>>", formattedResults)
        setPlaces(formattedResults);
      } else {
        setPlaces([]);
      }
    } catch (error) {
      console.error('Error fetching place data:', error);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  return { searchPlaceByText, places, loading };
};

export default useSearchPlace;