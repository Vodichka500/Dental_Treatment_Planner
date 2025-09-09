import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ExtendedServiceItem, PriceList, SubTotal } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from './ui/Input';
import { Pen, X } from "lucide-react";
import { clsx } from "clsx";

interface SubTotalProps{
  selectedServices: ExtendedServiceItem[],
  priceList: PriceList
  totalAmount: number
  setErrorMsg: React.Dispatch<React.SetStateAction<string | null>>;
  subTotals: SubTotal[]
  setSubTotals: React.Dispatch<React.SetStateAction<SubTotal[]>>;
  setSelectedServices: React.Dispatch<React.SetStateAction<ExtendedServiceItem[]>>;
}

function SubTotal({selectedServices, priceList, totalAmount, setErrorMsg,setSelectedServices, subTotals, setSubTotals}: SubTotalProps) {

  const [isSubTotalModalOpen, setIsSubTotalModalOpen] = useState<{status: boolean, mode: "edit" | "add" }>({status: false, mode: "add"});
  const [currentSubTotalName, setCurrentSubTotalName] = useState<string>("")
  const [currentSubTotalAmount, setCurrentSubTotalAmount] = useState<number>(0)
  const [editedSubTotal, setEditedSubTotal] = useState<SubTotal>()

  useEffect(() => {
    const tablesWithSubTotals = getTablesWithSubTotals();

    setSubTotals(prevSubTotals => {
      const newSubTotals: typeof prevSubTotals = [];

      tablesWithSubTotals.forEach(table => {
        if (!table.subTotal) return;

        const newAmount = table.services.reduce(
          (sum, service) => sum + service.quantity * service.price,
          0
        );
        newSubTotals.push({ ...table.subTotal, subTotalAmount: newAmount });
      });

      return newSubTotals;
    });
  }, [selectedServices]);

  const getTablesWithSubTotals = () => {
    const tables: { services: ExtendedServiceItem[]; subTotal?: SubTotal }[] = [];
    let currentServices: ExtendedServiceItem[] = [];

    selectedServices.forEach((service) => {
      currentServices.push(service);

      // Проверяем, есть ли подитог после этой услуги
      const relevantSubTotals = subTotals.filter(st => st.afterServiceId === service.id);
      relevantSubTotals.forEach(st => {
        tables.push({ services: currentServices, subTotal: st });
        currentServices = []; // начинаем новую таблицу после подитога
      });
    });

    // Если остались услуги без подитога, создаем последнюю таблицу
    if (currentServices.length > 0) {
      tables.push({ services: currentServices });
    }

    return tables;
  };

  const removeService = (serviceId: string) => {
    setErrorMsg(null);
    setSelectedServices((prev) =>
      prev.filter((service) => service.id !== serviceId),
    );
  };



  const updateQuantity = (id: string, newQty: number) => {
    // обновляем выбранные сервисы
    setSelectedServices(prev =>
      prev.map(service =>
        service.id === id
          ? { ...service, quantity: Math.max(1, newQty) } // защита от 0 и отрицательных
          : service
      )
    );
    //
    // // пересчитываем подытоги
    // const tablesWithSubTotals = getTablesWithSubTotals();
    //
    // setSubTotals(prevSubTotals => {
    //   const newSubTotals = [...prevSubTotals];
    //
    //   tablesWithSubTotals.forEach(table => {
    //     if (!table.subTotal) return;
    //
    //     const serviceToUpdate = table.services.find(service => service.id === id);
    //     if (serviceToUpdate) {
    //       const index = newSubTotals.findIndex(st => st.id === table.subTotal!.id);
    //       if (index !== -1) newSubTotals.splice(index, 1);
    //       const newAmount = table.services.reduce((sum, service) => sum + service.quantity * service.price, 0);
    //       newSubTotals.push({ ...table.subTotal, subTotalAmount: newAmount });
    //     }
    //   });
    //   return newSubTotals;
    // });
  };

  const isCanAddSubTotal = () => {
    const tablesWithSubTotals = getTablesWithSubTotals()
    if (tablesWithSubTotals[tablesWithSubTotals.length - 1].subTotal){
      return false
    }
    if (selectedServices.length === 0 ){
      return false
    }
    return true
  }

  const addOrEditSubTotal = () => {

    if (isSubTotalModalOpen.mode === "add"){
      if (!isCanAddSubTotal()){
        setErrorMsg("Невозможно добавить подытог без услуг или сразу после подытога")
        setCurrentSubTotalName("")
        setCurrentSubTotalAmount(0)
        setIsSubTotalModalOpen({status: false, mode: "add"});
        return
      }
      setSubTotals(prevState => [
        ...prevState,
        {
          id: crypto.randomUUID(),
          subTotalName: currentSubTotalName !== "" ? currentSubTotalName : "Подытог",
          subTotalAmount: currentSubTotalAmount,
          afterServiceId: selectedServices[selectedServices.length - 1].id
        }
      ]);
    }

    if (isSubTotalModalOpen.mode === "edit") {

      if (!editedSubTotal){
        setErrorMsg("Невозможно изменить подытог, который не был выбран")
        setCurrentSubTotalName("")
        setCurrentSubTotalAmount(0)
        setIsSubTotalModalOpen({status: false, mode: "add"});
        return
      }

      setSubTotals(prevState =>
        prevState.map(st =>
          st.id === editedSubTotal!.id
            ? {
              ...st,
              subTotalName: currentSubTotalName !== "" ? currentSubTotalName : "Подытог",
              subTotalAmount: currentSubTotalAmount,
            }
            : st
        )
      );
    }

    setCurrentSubTotalName("")
    setCurrentSubTotalAmount(0)
    setIsSubTotalModalOpen({status: false, mode: "add"});
  }


  const deleteSubTotal = (deleteId: string) => {
    const filteredSubtotals = subTotals.filter((subTotal) => subTotal.id !== deleteId)
    setSubTotals(filteredSubtotals)
  }



  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Выбранные услуги
      </h3>

      {selectedServices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Услуги не выбраны
        </div>
      ) : (
        <div className="space-y-4">
          {getTablesWithSubTotals().map((block, index) => (
            <div>
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Услуга
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                      Кол-во
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Цена
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                      Действие
                    </th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {block.services.map((service) => (
                    <tr key={service.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-gray-500 text-xs">
                            {service.path.join(' → ')}
                          </div>
                          {service.linkedToTeeth &&
                            service.selectedTeeth.length > 0 && (
                              <div className="text-blue-600 text-xs mt-1">
                                Зубы:{' '}
                                {service.selectedTeeth
                                  .sort(
                                    (a, b) =>
                                      Number.parseInt(a, 10) -
                                      Number.parseInt(b, 10),
                                  )
                                  .join(', ')}
                              </div>
                            )}
                          {service.comment && (
                            <div className="text-gray-600 text-xs mt-1 italic">
                              Заметка: {service.comment}
                            </div>
                          )}
                          <ul className="mt-1">
                            {Object.entries(service.teethComments ?? {}).map(([tooth, comment]) => (
                              <li key={tooth}>
                                <div className="flex gap-2 items-center">
                                  <p className="text-gray-600 text-xs mt-1 italic">
                                    <span className="font-medium">Зуб {tooth}:</span> {comment}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(service.id, service.quantity + 1)}
                            className="px-1 text-gray-600 hover:text-black"
                          >
                            ▲
                          </button>
                          <span className="w-6 text-center">{service.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              service.quantity > 1 && updateQuantity(service.id, service.quantity - 1)
                            }
                            className="px-1 text-gray-600 hover:text-black"
                          >
                            ▼
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">
                        {(service.price * service.quantity).toFixed(2)}{' '}
                        {priceList.currency}
                        {service.quantity > 1 && (
                          <div className="text-xs text-gray-500">
                            ({service.price.toFixed(2)} × {service.quantity}
                            )
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(service.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Удалить
                        </Button>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
              {block.subTotal && (
                <div className="flex gap-3 text-right mt-2 font-medium items-center justify-end">
                  <div>{block.subTotal.subTotalName}: {block.subTotal.subTotalAmount.toFixed(2)} {priceList.currency}</div>
                  <Pen className="h-3 w-3 text-black cursor-pointer"
                       onClick={() => {
                         if (block.subTotal){
                           setEditedSubTotal(block.subTotal)
                           setCurrentSubTotalName(block.subTotal.subTotalName)
                           setCurrentSubTotalAmount(block.subTotal.subTotalAmount)
                           setIsSubTotalModalOpen({status: true, mode: "edit"})
                         }
                       }}/>
                  <X className="h-4 w-4 text-red-500 cursor-pointer" onClick={() => block.subTotal && deleteSubTotal(block.subTotal.id)}/>
                </div>
              )}
            </div>

          ))}
          <div>
            <Button
              variant="outline"
              disabled={!isCanAddSubTotal}
              className={clsx((!isCanAddSubTotal() && "hidden"))}
              onClick={() => {
                // Вычисляем сумму всех подытогов
                const subTotalsSum = subTotals.reduce(
                  (acc, st) => acc + (st.subTotalAmount || 0),
                  0
                );
                setCurrentSubTotalAmount(totalAmount - subTotalsSum)
                setIsSubTotalModalOpen({status: true, mode: "add"});
              }}
            >
              Добавить подытог
            </Button>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Итого:</span>
              <span>
                      {totalAmount.toFixed(2)} {priceList.currency}
                    </span>
            </div>
          </div>
        </div>
      )}

      <Dialog open={isSubTotalModalOpen.status} onOpenChange={() => setIsSubTotalModalOpen({status: false, mode: "add"})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить подытог</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={currentSubTotalName}
              onChange={(e) =>
                setCurrentSubTotalName(e.target.value)
              }
              placeholder="Название подытога"
            />
            <Input
              type="number"
              value={currentSubTotalAmount}
              onChange={(e) =>
                setCurrentSubTotalAmount(parseFloat(e.target.value) || 0)
              }
              placeholder="Сумма"
            />
          </div>
          <DialogFooter>
            <Button onClick={addOrEditSubTotal}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SubTotal;
