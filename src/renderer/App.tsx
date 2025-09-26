import './output.css';
import { CreateInvoice } from '@/components/create-invoice';
import PriceListEditor from '@/components/price-list-editor';
import { useState } from 'react';
import InvoiceList  from '@/components/invoice-list';
import Doctors from '@/components/doctors';
import { Settings } from '@/components/settings';
import { Navigation } from './components/navigation';
import { Button } from "@/components/ui/Button";
import { clsx } from "clsx";
import { ArrowRight, ChevronLeft, Menu } from "lucide-react";

export type Screen =
  | 'invoices'
  | 'create'
  | 'pricelist'
  | 'settings'
  | 'doctors';

export default function MedicalClinicApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('invoices');
  const [isNavOpen, setIsNavOpen] = useState(true);

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
      {isNavOpen ? (
        <Navigation
          currentScreen={currentScreen}
          onScreenChange={setCurrentScreen}
          setIsNavOpen={setIsNavOpen}
        />
      ) : (
        <nav onClick={() => setIsNavOpen(true)} className="fixed left-0 top-0 h-full flex items-center justify-center w-8 bg-white border-r border-gray-200 shadow-sm">
          <ArrowRight className="h-5 w-5" />
        </nav>
      )}
      <main className={clsx("p-8", isNavOpen ? "ml-64" : "ml-8" )}>
        <div className="max-w-full mx-auto">{renderScreen()}</div>
      </main>
    </div>
  );
}
