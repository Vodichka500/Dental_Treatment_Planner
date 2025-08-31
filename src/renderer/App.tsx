import './output.css';
import { CreateInvoice } from '@/components/create-invoice';
import PriceListEditor from '@/components/price-list-editor';
import { useState } from 'react';
import InvoiceList  from '@/components/invoice-list';
import Doctors from '@/components/doctors';
import { Settings } from '@/components/settings';
import { Navigation } from './components/navigation';

export type Screen =
  | 'invoices'
  | 'create'
  | 'pricelist'
  | 'settings'
  | 'doctors';

export default function MedicalClinicApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('invoices');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'invoices':
        return <InvoiceList />;
      case 'create':
        return <CreateInvoice />;
      case 'pricelist':
        return <PriceListEditor />;
      case 'doctors':
        return <Doctors />;
      case 'settings':
        return <Settings />;
      default:
        return <InvoiceList />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
      />
      <main className="ml-64 p-8">
        <div className="max-w-[1600px] mx-auto">{renderScreen()}</div>
      </main>
    </div>
  );
}
