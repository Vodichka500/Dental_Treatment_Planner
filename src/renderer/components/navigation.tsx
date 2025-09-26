

import type { Screen } from "@/App";
import { Button } from '@/components/ui/Button';
import Logo from "assets/icon.svg";
import React from "react";
import type { ExtendedServiceItem } from "@/lib/types";
import { ChevronLeft } from "lucide-react";

interface NavigationProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  setIsNavOpen: React.Dispatch<React.SetStateAction<boolean>>
}

// eslint-disable-next-line import/prefer-default-export
export function Navigation({ currentScreen, onScreenChange, setIsNavOpen }: NavigationProps) {
  const navItems = [
    { id: 'invoices' as Screen, label: 'Планы лечения', icon: '📋' },
    { id: 'create' as Screen, label: 'Создать план', icon: '➕' },
    { id: 'pricelist' as Screen, label: 'Прайслист', icon: '💰' },
    { id: 'doctors' as Screen, label: 'Доктора', icon: '👨🏻‍⚕️' },
    { id: 'settings' as Screen, label: 'Настройки', icon: '⚙️' },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between gap-1 mb-8">
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-gray-900">
              Фабрика Улыбки
            </h1>
            <p className="text-xs">Генератор планов лечения</p>
          </div>
          <div className="w-8 h-8">
            <img src={Logo} alt="Company logo" />
          </div>
        </div>
        <div className="space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentScreen === item.id ? 'default' : 'ghost'}
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
          <Button
            variant="ghost"
            className="w-full justify-start text-left text-gray-700 hover:bg-gray-100"
            onClick={() => setIsNavOpen(false)}
          >
            <span className="mr-3"><ChevronLeft/></span>
            Скрыть меню
          </Button>
        </div>
      </div>

    </nav>
  );
}
