export interface PriceNode {
  name: string;
  price?: number; // Only leaf nodes have prices
  color?: string;
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
  date: Date | string;
  totalAmount: number;
  services: any[];
  filename?: string
}

export interface InvoiceItemService {
  id: string;
  path: string[];
  name: string;
  price: number;
  quantity: number;
  selectedTeeth: string[];
  teethComments?: { [toothNumber: number]: string },
  comment?: string
  linkedToTeeth: boolean;
  color?: string;
}

export interface SubTotal{
  id: string
  subTotalName: string
  afterServiceId: string
  subTotalAmount: number
}


export interface  InvoiceListItem {
  id: string,
  filename: string,
  date: Date | string,
  totalAmount: number,
  patient: string,
  doctor: Doctor,
  services: InvoiceItemService[],
  subTotals?: SubTotal[]
}

export interface ServiceItem {
  id: string,
  name: string,
  path: string[],
  price: number,
  color?: string
}

export interface ExtendedServiceItem extends ServiceItem {
  quantity: number
  selectedTeeth: string[]
  linkedToTeeth: boolean
  comment?: string,
  color?: string;
  teethComments?: { [toothNumber: number]: string },
}

