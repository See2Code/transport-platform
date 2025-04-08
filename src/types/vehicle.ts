export interface Vehicle {
    id: string;
    vehicleId: string;
    licensePlate: string;
    driverName: string;
    location: {
        lat: number;
        lng: number;
        latitude: number;
        longitude: number;
        accuracy: number;
        heading?: number;
        speed?: number;
        timestamp: number;
    };
    lastUpdate: string;
    lastActive: number;
    isOnline: boolean;
    status: string;
} 