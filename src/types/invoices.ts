import { Timestamp } from 'firebase/firestore';

// Položka na faktúre
export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Štruktúra celej faktúry
export interface Invoice {
  id: string;
  companyID: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  taxableSupplyDate: string;

  supplier: {
    name: string;
    address: string;
    city: string;
    zip: string;
    country: string;
    ico: string;
    dic: string;
    ic_dph?: string;
    iban: string;
    bank: string;
  };

  customer: {
    name: string;
    address: string;
    city: string;
    zip: string;
    country: string;
    ico: string;
    dic: string;
    ic_dph?: string;
  };

  items: InvoiceItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  variableSymbol: string;
  notes?: string;
  createdAt: Timestamp;
  createdBy: string;
  createdByName?: string;
}

// Preddefinované údaje dodávateľa
export const YOUR_COMPANY_DETAILS = {
  name: 'Tvoja Špedičná Firma s.r.o.',
  address: 'Hlavná 1',
  city: 'Nitra',
  zip: '94901',
  country: 'Slovensko',
  ico: '12345678',
  dic: '1234567890',
  ic_dph: 'SK1234567890',
  iban: 'SK00 0000 0000 0000 0000 0000',
  bank: 'Tvoja Banka, a.s.',
}; 