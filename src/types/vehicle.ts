export interface Vehicle {
    id: string;
    vehicleId: string;
    driverName: string;
    location: {
        latitude: number;
        longitude: number;
        accuracy: number;
        timestamp: number;
        heading?: number;
        speed?: number;
    };
    lastActive: number;
    isOnline: boolean;
    type?: string;
    licensePlate?: string;
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };
    maxLoad?: number;
    companyId?: string;
    isActive?: boolean;
} 