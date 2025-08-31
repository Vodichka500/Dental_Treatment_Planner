

import type { Screen } from "@/App";
import { Button } from '@/components/ui/Button';

interface NavigationProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

// eslint-disable-next-line import/prefer-default-export
export function Navigation({ currentScreen, onScreenChange }: NavigationProps) {
  const navItems = [
    { id: 'invoices' as Screen, label: 'Invoice List', icon: '📋' },
    { id: 'create' as Screen, label: 'Create Invoice', icon: '➕' },
    { id: 'pricelist' as Screen, label: 'Price List', icon: '💰' },
    { id: 'doctors' as Screen, label: 'Doctors', icon: '👨🏻‍⚕️' },
    { id: 'settings' as Screen, label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm">
      <div className="p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-8">
          Medical Clinic
        </h1>
        <div className="space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentScreen === item.id ? "default" : "ghost"}
              className={`w-full justify-start text-left ${
                currentScreen === item.id
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => onScreenChange(item.id)}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
}
