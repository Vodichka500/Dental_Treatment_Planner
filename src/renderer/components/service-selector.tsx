'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import type {  ServiceItem } from '@/contexts/app-context';
import type {PriceList, PriceNode } from '@/lib/types'

interface ServiceSelectorProps {
  priceList: PriceList;
  onServiceSelect: (service: ServiceItem) => void;
}

export function ServiceSelector({ priceList, onServiceSelect }: ServiceSelectorProps) {
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  // Получаем текущий узел по пути
  const getNodeByPath = (path: string[]): PriceNode | null => {
    let node: any = priceList.pricelist;
    for (const segment of path) {
      node = node[segment];
      if (!node) return null;
      node = node.children ?? node;
    }
    return node;
  };

  const currentNode = getNodeByPath(selectedPath);
  const currentOptions = currentNode
    ? Object.entries(currentNode).map(([key, node]: [string, any]) => ({
      key,
      node,
      isLeaf: node.price !== undefined,
    }))
    : [];

  const handleSelection = (key: string) => {
    const newPath = [...selectedPath, key];
    const node = getNodeByPath(newPath);

    if (node && node.price !== undefined) {
      // Выбран конечный сервис
      onServiceSelect({
        id: '',
        path: newPath,
        name: node.name,
        price: node.price,
      });
      setSelectedPath([]);
    } else {
      // Переход к следующему уровню
      setSelectedPath(newPath);
    }
  };

  const handleBack = () => setSelectedPath(prev => prev.slice(0, -1));

  const canGoBack = selectedPath.length > 0;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      {selectedPath.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Path:</span>
          {selectedPath.map((segment, idx) => (
            <span key={idx}>
              {idx > 0 && <span className="mx-1">→</span>}
              {segment}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {canGoBack && (
          <Button variant="outline" onClick={handleBack} className="mb-4 bg-transparent">
            ← Back
          </Button>
        )}
      </div>

      {currentOptions.length > 0 && (
        <div>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {selectedPath.length === 0 ? 'Select Category' : 'Select Option'}
          </label>
          <Select value="" onValueChange={handleSelection}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose an option..." />
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
