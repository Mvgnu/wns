"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Define location type
interface Location {
  id: string;
  name: string;
  description?: string;
  type: string;
  sport: string;
  latitude: number;
  longitude: number;
  address?: string;
  isLineBased: boolean;
  coordinates?: Array<[number, number]>;
  rating?: number;
  addedBy: {
    id: string;
    name: string;
    image?: string;
  };
}

// Custom hook for fetching locations
function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const response = await fetch('/api/locations');
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }
        const data = await response.json();
        setLocations(data.locations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLocations();
  }, []);

  return { locations, isLoading, error };
}

// Custom component to fit map to bounds
function FitBoundsToLocations({ locations }: { locations: Location[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length > 0) {
      try {
        const allPoints = locations.flatMap(location => {
          if (location.isLineBased && location.coordinates && location.coordinates.length > 0) {
            return location.coordinates;
          }
          return [[location.latitude, location.longitude]];
        }).filter(point => 
          // Filter out invalid coordinates
          point[0] !== undefined && 
          point[1] !== undefined && 
          !isNaN(point[0]) && 
          !isNaN(point[1]) &&
          point[0] >= -90 && 
          point[0] <= 90 && 
          point[1] >= -180 && 
          point[1] <= 180
        );
        
        if (allPoints.length > 0) {
          const bounds = L.latLngBounds(allPoints.map(point => L.latLng(point[0], point[1])));
          
          // Check if bounds are valid before fitting
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
          } else {
            console.warn("Invalid bounds calculated from location points");
            // Fall back to centering on the first valid point
            if (allPoints.length > 0) {
              map.setView([allPoints[0][0], allPoints[0][1]], 12);
            }
          }
        }
      } catch (error) {
        console.error("Error fitting bounds to locations:", error);
      }
    }
  }, [locations, map]);
  
  return null;
}

// Icon for different location types
const getMarkerIcon = (type: string, sport: string) => {
  // You can customize icons based on location type and sport
  // This is a simple example using different colors
  let iconColor;
  
  // Different colors for different sports
  switch (sport.toLowerCase()) {
    case 'skating':
      iconColor = '#FF5722'; // Orange
      break;
    case 'mountain biking':
    case 'mountain_biking':
      iconColor = '#4CAF50'; // Green
      break;
    case 'hiking':
      iconColor = '#8BC34A'; // Light Green
      break;
    case 'fishing':
      iconColor = '#03A9F4'; // Light Blue
      break;
    case 'running':
      iconColor = '#9C27B0'; // Purple
      break;
    case 'photography':
      iconColor = '#607D8B'; // Blue Grey
      break;
    default:
      iconColor = '#2196F3'; // Blue
  }
  
  return L.divIcon({
    className: `custom-icon`,
    html: `<div style="background-color: ${iconColor}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.4);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
}

interface LocationMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  height?: string;
  width?: string;
  className?: string;
  filterSport?: string;
  filterType?: string;
  latitude?: number;
  longitude?: number;
  name?: string;
  isLineBased?: boolean;
  coordinates?: Array<[number, number]>;
}

export default function LocationMap({
  initialCenter = [40, 0], // Default center (adjust as needed)
  initialZoom = 3, // Default zoom level
  height = "500px",
  width = "100%",
  className = "",
  filterSport,
  filterType,
  latitude,
  longitude,
  name,
  isLineBased,
  coordinates,
}: LocationMapProps) {
  const { locations, isLoading, error } = useLocations();
  const router = useRouter();
  
  // Fix Leaflet icon issue in Next.js
  // See: https://github.com/PaulLeCam/react-leaflet/issues/808
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/marker-icon-2x.png",
      iconUrl: "/marker-icon.png",
      shadowUrl: "/marker-shadow.png",
    });
  }, []);
  
  // If single location mode (used for displaying a specific location)
  const isSingleLocation = latitude !== undefined && longitude !== undefined;
  const singleLocation: Location | null = isSingleLocation ? {
    id: 'single-location',
    name: name || 'Location',
    type: 'Spot',
    sport: 'General',
    latitude,
    longitude,
    isLineBased: isLineBased || false,
    coordinates: isLineBased ? coordinates : undefined,
    addedBy: {
      id: '',
      name: ''
    }
  } : null;
  
  // Filter locations based on props
  const filteredLocations = useMemo(() => {
    // If in single location mode, just use that location
    if (singleLocation) {
      return [singleLocation];
    }
    
    // Otherwise filter the fetched locations
    return locations.filter(location => {
      if (filterSport && location.sport !== filterSport) return false;
      if (filterType && location.type !== filterType) return false;
      return true;
    });
  }, [locations, filterSport, filterType, singleLocation]);
  
  if (!isSingleLocation && isLoading) {
    return <div className="flex justify-center items-center" style={{ height, width }}>Loading map...</div>;
  }
  
  if (!isSingleLocation && error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load locations: {error}</AlertDescription>
      </Alert>
    );
  }
  
  // For single location, use provided coords instead of default
  const mapCenter = isSingleLocation ? [latitude, longitude] as [number, number] : initialCenter;
  
  return (
    <div style={{ height, width }} className={className}>
      <MapContainer
        center={mapCenter}
        zoom={initialZoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBoundsToLocations locations={filteredLocations} />
        
        <MarkerClusterGroup>
          {filteredLocations.map(location => {
            if (location.isLineBased && location.coordinates && location.coordinates.length > 1) {
              // Render polyline for line-based locations
              return (
                <div key={location.id}>
                  <Polyline 
                    positions={location.coordinates}
                    color="#3388ff"
                    weight={3}
                    opacity={0.7}
                    lineJoin="round"
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-lg">{location.name}</h3>
                        <p className="text-sm">{location.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-semibold">{location.type}</span> · {location.sport}
                        </p>
                        {location.rating && (
                          <p className="text-sm mt-1">
                            Rating: {location.rating.toFixed(1)} ★
                          </p>
                        )}
                        <Button 
                          size="sm" 
                          className="mt-2 w-full"
                          onClick={() => router.push(`/locations/${location.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </Popup>
                  </Polyline>
                  
                  {/* Always add a marker at the start of the line */}
                  <Marker
                    position={location.coordinates[0]}
                    icon={getMarkerIcon(location.type, location.sport)}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-lg">{location.name} (Start)</h3>
                        <Button 
                          size="sm" 
                          className="mt-2 w-full"
                          onClick={() => router.push(`/locations/${location.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                  
                  {/* Add a marker at the end of the line too if it's different from the start */}
                  {location.coordinates.length > 1 && 
                    location.coordinates[0][0] !== location.coordinates[location.coordinates.length-1][0] && 
                    location.coordinates[0][1] !== location.coordinates[location.coordinates.length-1][1] && (
                    <Marker
                      position={location.coordinates[location.coordinates.length-1]}
                      icon={getMarkerIcon(location.type, location.sport)}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-lg">{location.name} (End)</h3>
                          <Button 
                            size="sm" 
                            className="mt-2 w-full"
                            onClick={() => router.push(`/locations/${location.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </div>
              );
            } else {
              // Render marker for point-based locations
              return (
                <Marker
                  key={location.id}
                  position={[location.latitude, location.longitude]}
                  icon={getMarkerIcon(location.type, location.sport)}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-lg">{location.name}</h3>
                      <p className="text-sm">{location.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-semibold">{location.type}</span> · {location.sport}
                      </p>
                      {location.rating && (
                        <p className="text-sm mt-1">
                          Rating: {location.rating.toFixed(1)} ★
                        </p>
                      )}
                      <Button 
                        size="sm" 
                        className="mt-2 w-full"
                        onClick={() => router.push(`/locations/${location.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              );
            }
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
} 