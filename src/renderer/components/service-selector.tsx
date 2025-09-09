'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import type { PriceList, PriceNode, ServiceItem } from '@/lib/types';

interface ServiceSelectorProps {
  priceList: PriceList;
  onServiceSelect: (service: ServiceItem) => void;
}

export function ServiceSelector({ priceList, onServiceSelect }: ServiceSelectorProps) {
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ========================
  // 🔍 Рекурсивный обход для поиска
  // ========================
  const flattenServices = (
    node: Record<string, PriceNode>,
    path: string[] = []
  ): ServiceItem[] => {
    let results: ServiceItem[] = [];

    Object.entries(node).forEach(([key, child]) => {
      const newPath = [...path, child.name];
      if (child.price !== undefined) {
        results.push({
          id: '',
          path: newPath,
          name: child.name,
          price: child.price,
        });
      }
      if (child.children) {
        results = results.concat(flattenServices(child.children, newPath));
      }
    });

    return results;
  };

  const allServices = useMemo(
    () => flattenServices(priceList.pricelist),
    [priceList]
  );

  // ========================
  // 🔍 Фильтрация по поиску
  // ========================
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allServices.filter((service) =>
      service.path.join(' ').toLowerCase().includes(query)
    );
  }, [searchQuery, allServices]);

  // ========================
  // Навигация по дереву (как раньше)
  // ========================
  const getNodeByPath = (path: string[]): PriceNode | null => {
    return path.reduce<any>((node, segment) => {
      if (!node) return null;
      const next = node[segment];
      if (!next) return null;
      return next.children ?? next;
    }, priceList.pricelist);
  };

  const currentNode = getNodeByPath(selectedPath);
  const currentOptions = currentNode
    ? Object.entries(currentNode).map(([key, node]: [string, any]) => ({
      key,
      node,
      isLeaf: node.price !== undefined,
    }))
    : [];

  const getColorForService = (path: string[], node: Record<string, PriceNode>): string | undefined => {
    let selectedNode: any = node;
    let color: string | undefined;

    for (const segment of path) {
      selectedNode = selectedNode[segment];
      if (!selectedNode) break;
      console.log(`${selectedNode.name  }: ${  selectedNode.color}`)
      if (selectedNode.color) color = selectedNode.color; // запоминаем последний найденный цвет
      selectedNode = selectedNode.children ?? {};
    }

    return color;
  };

  const handleSelection = (key: string) => {
    const newPath = [...selectedPath, key];
    const node = getNodeByPath(newPath);

    if (node && node.price !== undefined) {
      const color = getColorForService(newPath, priceList.pricelist)
      onServiceSelect({
        id: '',
        path: newPath,
        name: node.name,
        price: node.price,
        color
      });
      setSelectedPath([]);
    } else {
      setSelectedPath(newPath);
    }
  };

  const handleSearchSelection = (service: ServiceItem) => {
    // Находим цвет для выбранной услуги
    const color = getColorForService(service.path, priceList.pricelist);

    // Отправляем объект с цветом
    onServiceSelect({
      ...service,
      color, // ✅ добавляем цвет
    });

    // Сбрасываем поиск
    setSearchQuery('');
  };

  const handleBack = () => setSelectedPath((prev) => prev.slice(0, -1));
  const canGoBack = selectedPath.length > 0;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      {selectedPath.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
          <span>Path:</span>
          {selectedPath.map((segment, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <span key={idx}>
              {idx > 0 && <span className="mx-1">→</span>}
              {segment}
            </span>
          ))}
        </div>
      )}

      {/* 🔍 Поисковый инпут */}
      <Input
        placeholder="Поиск услуги..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Результаты поиска */}
      {searchQuery && filteredServices.length > 0 && (
        <div className="border rounded-md p-2 max-h-60 overflow-y-auto space-y-1 overflow-auto">
          {filteredServices.map((service) => (
            <button
              type="button"
              key={`${service.id}`}
              onClick={() => {
                handleSearchSelection(service)
                setSearchQuery('');
              }}
              className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
            >
              <span className="font-medium">{service.path.join(' → ')}</span>{' '}
              <span className="ml-2 text-sm text-blue-600">
                {service.price.toFixed(2)} {priceList.currency}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {canGoBack && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="mb-4 bg-transparent"
          >
            ← Назад
          </Button>
        )}
      </div>

      {/* Навигация по категориям */}
      {!searchQuery && currentOptions.length > 0 && (
        <div>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {selectedPath.length === 0 ? 'Выбери категорию' : 'Выбери опцию'}
          </label>
          <Select value="" onValueChange={handleSelection}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выбери опцию..." />
            </SelectTrigger>
            <SelectContent>
              {currentOptions.map(({ key, node, isLeaf }) => (
                <SelectItem key={key} value={key}>
                  <div className="flex justify-between items-center w-full">
                    <span>{node.name}</span>
                    {isLeaf && (
                      <span className="ml-2 text-sm text-blue-600 font-medium">
                        {node.price.toFixed(2)} {priceList.currency}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
