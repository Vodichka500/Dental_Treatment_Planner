import './output.css';
import { CreateInvoice } from "@/components/create-invoice";
import { PriceListEditor } from "@/components/price-list-editor";
import { useState } from 'react';
import { InvoiceList } from "@/components/invoice-list";
import { AppProvider } from './contexts/app-context';
import { Navigation } from "./components/navigation";
import { Settings } from "@/components/settings";


export type Screen = 'invoices' | 'create' | 'pricelist' | 'settings';

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
      case 'settings':
        return <Settings />;
      default:
        return <InvoiceList />;
    }
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation
          currentScreen={currentScreen}
          onScreenChange={setCurrentScreen}
        />
        <main className="ml-64 p-8">
          <div className="max-w-7xl mx-auto">{renderScreen()}</div>
        </main>
      </div>
    </AppProvider>
  );
}
