'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Button } from '@/components/ui/button';
import { Undo2, RotateCcw, Check } from 'lucide-react';

type Coordinates = Array<{lat: number, lng: number}>;
type LatLngTuple = [number, number];

export interface LocationMapPickerProps {
  position: { lat: number, lng: number };
  onPositionChange: (position: { lat: number, lng: number }) => void;
  isLineBased: boolean;
  initialCoordinates?: Coordinates;
  onCoordinatesChange?: (coordinates: Coordinates) => void;
}

// Custom marker icon for better appearance
const createCustomIcon = (color = 'blue') => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 3px rgba(0,0,0,0.4);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

// This component handles map clicks and drawing
const MapInteraction = ({ 
  position,
  onPositionChange,
  isLineBased,
  initialCoordinates,
  onCoordinatesChange
}: LocationMapPickerProps) => {
  type PathPoint = {
    id: number;
    position: LatLngTuple;
  };

  const [path, setPath] = useState<PathPoint[]>(
    initialCoordinates 
      ? initialCoordinates.map((coord, index) => ({ 
          id: index, 
          position: [coord.lat, coord.lng] as LatLngTuple 
        })) 
      : []
  );
  const nextId = useRef(initialCoordinates ? initialCoordinates.length : 0);
  const drawingRef = useRef(false);
  const mapRef = useRef<L.Map | null>(null);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupPosition, setPopupPosition] = useState<[number, number] | null>(null);
  const [routeFinished, setRouteFinished] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      if (!initialCoordinates) {
        setPath([]);
        setRouteFinished(false);
      }
      isFirstRender.current = false;
      drawingRef.current = false;
      return;
    }
    if (!drawingRef.current) {
      setPath(initialCoordinates 
        ? initialCoordinates.map((coord, index) => ({ 
            id: index, 
            position: [coord.lat, coord.lng] as LatLngTuple 
          })) 
        : []);
      setRouteFinished(false);
    }
    drawingRef.current = false;
  }, [isLineBased]);

  useEffect(() => {
    console.log('Path updated, rendering markers for:', path.map(p => ({ id: p.id, position: p.position })));
  }, [path]);

  useEffect(() => {
    if (isLineBased) {
      if (!drawingRef.current) {
        setPopupMessage('Click on the map to start drawing a route');
      } else if (path.length === 1) {
        setPopupMessage('Click to add more points to your route');
      } else if (path.length > 1) {
        setPopupMessage('Continue adding points or click the first point to finish the route');
      }
    } else {
      setPopupMessage('Click on the map to set your location');
    }
  }, [isLineBased, path.length]);

  const distanceBetween = (point1: LatLngTuple, point2: LatLngTuple): number => {
    const lat1 = point1[0];
    const lng1 = point1[1];
    const lat2 = point2[0];
    const lng2 = point2[1];
    return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
  };

  const isNearStartPoint = (clickPoint: LatLngTuple, zoom: number): boolean => {
    if (path.length === 0) return false;
    const startPoint = path[0].position;
    const threshold = 0.001 / Math.pow(2, Math.max(0, zoom - 13));
    return distanceBetween(clickPoint, startPoint) < threshold;
  };

  const map = useMapEvents({
    click(e) {
      const clickPoint: LatLngTuple = [e.latlng.lat, e.latlng.lng];
      setPopupPosition(null);
      
      if (isLineBased) {
        if (routeFinished) return;
        
        if (!drawingRef.current) {
          drawingRef.current = true;
          const newPoint = { id: nextId.current++, position: clickPoint };
          setPath([newPoint]);
          if (onCoordinatesChange) {
            onCoordinatesChange([{ lat: clickPoint[0], lng: clickPoint[1] }]);
          }
          setPopupMessage('Click to add more points to your route');
          setPopupPosition(clickPoint);
          console.log('First point added:', [clickPoint]);
        } else if (path.length >= 2 && isNearStartPoint(clickPoint, map.getZoom())) {
          console.log('Attempting to close route');
          setPath(prev => {
            const closedPath = [...prev, prev[0]];
            if (onCoordinatesChange) {
              const coordinates = closedPath.map(p => ({ lat: p.position[0], lng: p.position[1] }));
              onCoordinatesChange(coordinates);
            }
            console.log('Route closed, path:', closedPath.map(p => p.position));
            return closedPath;
          });
          setRouteFinished(true);
          setPopupMessage('Route completed! Use the reset button to start over.');
          setPopupPosition(path[0].position);
        } else {
          setPath(prev => {
            const newPoint = { id: nextId.current++, position: clickPoint };
            const newPath = [...prev, newPoint];
            if (onCoordinatesChange) {
              const coordinates = newPath.map(p => ({ lat: p.position[0], lng: p.position[1] }));
              onCoordinatesChange(coordinates);
            }
            setPopupPosition(clickPoint);
            console.log('Point added, path:', newPath.map(p => p.position));
            return newPath;
          });
        }
      } else {
        const newPosition = { lat: clickPoint[0], lng: clickPoint[1] };
        onPositionChange(newPosition);
        setPopupMessage('Location set!');
        setPopupPosition(clickPoint);
      }
    },
    locationfound(e) {
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  const handleResetDrawing = () => {
    drawingRef.current = false;
    setPath([]);
    setRouteFinished(false);
    nextId.current = 0;
    if (onCoordinatesChange) {
      onCoordinatesChange([]);
    }
    setPopupMessage('Click on the map to start drawing a route');
    setPopupPosition(null);
  };

  const handleUndoLastPoint = () => {
    if (path.length <= 1) {
      handleResetDrawing();
      return;
    }
    setPath(prev => {
      const newPath = prev.slice(0, -1);
      if (onCoordinatesChange) {
        const coordinates = newPath.map(p => ({ lat: p.position[0], lng: p.position[1] }));
        onCoordinatesChange(coordinates);
      }
      return newPath;
    });
    if (path.length === 2) {
      setPopupMessage('Click to add more points to your route');
    }
  };

  const handleCompleteRoute = () => {
    if (path.length < 3) {
      setPopupMessage('Add at least 3 points to complete a route');
      setPopupPosition(path[path.length - 1].position);
      return;
    }
    setPath(prev => {
      const closedPath = [...prev, prev[0]];
      if (onCoordinatesChange) {
        const coordinates = closedPath.map(p => ({ lat: p.position[0], lng: p.position[1] }));
        onCoordinatesChange(coordinates);
      }
      return closedPath;
    });
    setRouteFinished(true);
    setPopupMessage('Route completed! Use the reset button to start over.');
    setPopupPosition(path[0].position);
  };

  useEffect(() => {
    mapRef.current = map;
    map.locate();
    return () => {
      drawingRef.current = false;
    };
  }, [map]);

  return (
    <>
      {!isLineBased && <Marker position={[position.lat, position.lng]} icon={createCustomIcon('red')}>
        <Popup>Location set!</Popup>
      </Marker>}
      {path.length > 0 && isLineBased && (
        <Polyline 
          positions={path.map(p => p.position)} 
          color="blue" 
          weight={4}
          opacity={0.8}
          dashArray={routeFinished ? undefined : "5,10"}
        />
      )}
      {path.map((point, index) => (
        isLineBased && (
          <Marker 
            key={`point-${point.id}`} 
            position={point.position}
            icon={createCustomIcon(index === 0 ? 'green' : (index === path.length - 1 && !routeFinished ? 'red' : 'blue'))}
          >
            <Popup>
              {index === 0 ? 'Start Point' : (index === path.length - 1 ? 'End Point' : `Point ${index + 1}`)}
              {index === 0 && path.length > 2 && !routeFinished && (
                <div className="mt-2 text-xs">Click here to complete the route</div>
              )}
            </Popup>
          </Marker>
        )
      ))}
      {popupPosition && (
        <Popup position={popupPosition}>
          {popupMessage}
        </Popup>
      )}
      {isLineBased && (
        <div className="leaflet-bottom leaflet-right">
          <div className="leaflet-control leaflet-bar flex flex-col gap-1 p-1 bg-white rounded shadow-md">
            {path.length > 0 && (
              <Button 
                className="bg-white text-black hover:bg-red-100 p-2 h-8 w-8 flex items-center justify-center" 
                onClick={handleResetDrawing}
                title="Reset route"
              >
                <RotateCcw size={16} />
              </Button>
            )}
            {path.length > 0 && !routeFinished && (
              <Button 
                className="bg-white text-black hover:bg-yellow-100 p-2 h-8 w-8 flex items-center justify-center" 
                onClick={handleUndoLastPoint}
                title="Undo last point"
              >
                <Undo2 size={16} />
              </Button>
            )}
            {path.length >= 3 && !routeFinished && (
              <Button 
                className="bg-white text-black hover:bg-green-100 p-2 h-8 w-8 flex items-center justify-center" 
                onClick={handleCompleteRoute}
                title="Complete route"
              >
                <Check size={16} />
              </Button>
            )}
          </div>
        </div>
      )}
      {isLineBased && (
        <div className="leaflet-top leaflet-left">
          <div className="leaflet-control p-2 bg-white bg-opacity-90 rounded shadow-md max-w-xs">
            <h3 className="font-medium text-sm mb-1">Route Builder</h3>
            <p className="text-xs text-gray-700">
              {!drawingRef.current 
                ? 'Click on the map to start drawing a route' 
                : routeFinished 
                  ? 'Route completed! Use the reset button to start over.' 
                  : path.length === 1 
                    ? 'Click to add more points to your route' 
                    : 'Continue adding points or use the complete button to finish'}
            </p>
            {path.length > 0 && !routeFinished && (
              <div className="mt-1 text-xs text-gray-600">
                Points: {path.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default function LocationMapPicker(props: LocationMapPickerProps) {
  const [mounted, setMounted] = useState(false);
  
  // Fix for hydration issues with Leaflet in Next.js
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div className="h-96 w-full bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center">Loading map...</div>;
  }
  
  return (
    <MapContainer
      center={[props.position.lat, props.position.lng]}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '500px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapInteraction {...props} />
    </MapContainer>
  );
} 