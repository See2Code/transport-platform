import { Timestamp } from 'firebase/firestore';

export interface Country {
  code: string;
  name: string;
  prefix: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  phonePrefix: string;
  phoneNumber: string;
  countryCode: string;
  email: string;
  notes?: string;
  createdAt: Timestamp;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  company: string;
  phonePrefix: string;
  phoneNumber: string;
  countryCode: string;
  email: string;
  notes?: string;
  createdAt: Timestamp;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
} 