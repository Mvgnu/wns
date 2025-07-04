'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

// Fix for Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Location {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  sports: string[];
  placeType: string;
  detailType: string;
  _count: {
    reviews: number;
    events: number;
  };
  averageRating: number | null;
}

interface LocationsMapProps {
  locations: Location[];
  center: [number, number];
  zoom?: number;
}

export default function LocationsMap({ locations, center, zoom = 6 }: LocationsMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '600px', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map(location => (
        <Marker
          key={location.id}
          position={[location.latitude, location.longitude]}
        >
          <Popup>
            <Card className="border-0 shadow-none">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-lg font-semibold">
                  <Link href={`/locations/${location.id}`} className="hover:text-blue-600">
                    {location.name}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {[location.address, location.city, location.state].filter(Boolean).join(', ')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pb-3 space-y-2">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {location.averageRating !== null && (
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-400 fill-yellow-400" />
                      <span>{location.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-blue-500" />
                    <span>{location._count.events} Events</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-blue-500" />
                    <span>{location._count.reviews} Bewertungen</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {location.sports.map(sport => (
                    <Badge key={sport} variant="secondary" className="text-xs">
                      {sport}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-0">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/locations/${location.id}`}>
                    Details ansehen
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
} 