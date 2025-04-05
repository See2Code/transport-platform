export interface Customer {
  company: string;
  vatId: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  contactName: string;
  contactSurname: string;
  email: string;
  phone: string;
}

export interface LoadingPlace {
  street: string;
  city: string;
  zip: string;
  country: string;
  dateTime: string;
  contactPerson: string;
}

export interface UnloadingPlace {
  street: string;
  city: string;
  zip: string;
  country: string;
  dateTime: string;
  contactPerson: string;
}

export interface SavedPlace {
  id: string;
  name: string;
  type: 'loading' | 'unloading';
  street: string;
  city: string;
  zip: string;
  country: string;
  contactPerson: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  companyId: string;
}

export interface OrderFormData {
  // Údaje zákazníka
  customerCompany: string;
  customerVatId: string;
  customerStreet: string;
  customerCity: string;
  customerZip: string;
  customerCountry: string;
  customerContactName: string;
  customerContactSurname: string;
  customerEmail: string;
  customerPhone: string;
  customerPrice: string;

  // Miesta nakládky a vykládky
  loadingPlaces: LoadingPlace[];
  unloadingPlaces: UnloadingPlace[];

  // Údaje o tovare
  goodsDescription: string;
  weightKg: string;
  dimensionsL: string;
  dimensionsW: string;
  dimensionsH: string;
  quantity: string;

  // Údaje o dopravcovi
  carrierCompany: string;
  carrierContact: string;
  carrierVehicleReg: string;
  carrierPrice: string;
}

export interface Order extends OrderFormData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  userId: string;
  companyId: string;
}

// Prázdny export aby TypeScript rozpoznal tento súbor ako modul
export {} 