export interface OrderFormData {
  clientCompany: string;
  clientReference: string;

  loadingPlace_street: string;
  loadingPlace_city: string;
  loadingPlace_zip: string;
  loadingPlace_country: string;
  loadingDateTime: string;
  loadingContactPerson: string;

  unloadingPlace_street: string;
  unloadingPlace_city: string;
  unloadingPlace_zip: string;
  unloadingPlace_country: string;
  unloadingDateTime: string;
  unloadingContactPerson: string;

  goodsDescription: string;
  weightKg: string;
  dimensionsL: string;
  dimensionsW: string;
  dimensionsH: string;
  quantity: string;

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