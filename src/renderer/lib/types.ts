export interface PriceNode {
  name: string;
  price?: number; // Only leaf nodes have prices
  children?: Record<string, PriceNode>; // Child nodes
}

export interface PriceList {
  currency: string;
  pricelist: Record<string, PriceNode>; // Use recursive structure
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

export interface Invoice {
  id: string;
  patientName: string;
  selectedDoctor: any | null;
  date: Date;
  totalAmount: number;
  services: any[];
}

export interface InvoiceItemService {
  id: string;
  path: string[];
  name: string;
  price: number;
  quantity: number;
  selectedTeeth: string[];
  comment?: string
  linkedToTeeth: Boolean;
}

export interface  InvoiceListItem {
  id: string,
  filename: string,
  date: Date,
  totalAmount: number,
  patient: string
}
