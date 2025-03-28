import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Oprava ikony pre marker
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface Vehicle {
    id: string;
    driverName: string;
    position: {
        lat: number;
        lng: number;
    };
    lastUpdate: Date;
}

interface VehicleTrackerProps {
    vehicles: Vehicle[];
    center?: [number, number];
    zoom?: number;
}

const VehicleTracker: React.FC<VehicleTrackerProps> = ({
    vehicles,
    center = [48.669026, 19.699024], // Centrum Slovenska
    zoom = 7
}) => {
    const mapRef = useRef<L.Map>(null);

    useEffect(() => {
        if (mapRef.current && vehicles.length > 0) {
            const bounds = L.latLngBounds(vehicles.map(v => [v.position.lat, v.position.lng]));
            mapRef.current.fitBounds(bounds);
        }
    }, [vehicles]);

    return (
        <div className="h-[600px] w-full">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {vehicles.map((vehicle) => (
                    <Marker
                        key={vehicle.id}
                        position={[vehicle.position.lat, vehicle.position.lng]}
                    >
                        <Popup>
                            <div>
                                <h3 className="font-bold">{vehicle.driverName}</h3>
                                <p>ID vozidla: {vehicle.id}</p>
                                <p>Posledná aktualizácia: {vehicle.lastUpdate.toLocaleString()}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default VehicleTracker; 