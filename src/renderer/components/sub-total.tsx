import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ExtendedServiceItem, PriceList, SubTotal, Comment, ServiceItem } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MessageCircle, Minus, Pen, Plus, X } from "lucide-react";
import ServiceConfig from "@/components/service-config";
import { Input } from './ui/Input';

interface SubTotalProps{
  selectedServices: ExtendedServiceItem[],
  priceList: PriceList
  totalAmount: number
  setErrorMsg: React.Dispatch<React.SetStateAction<string | null>>;
  subTotals: SubTotal[]
  setSubTotals: React.Dispatch<React.SetStateAction<SubTotal[]>>;
  setSelectedServices: React.Dispatch<React.SetStateAction<ExtendedServiceItem[]>>;
  comments: Comment[]
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  getNextOrderNumber: () => number;
  reorderItems: (deletedOrder: number) => void;
}

// eslint-disable-next-line no-redeclare
function SubTotal({selectedServices,
                    priceList,
                    totalAmount,
                    setErrorMsg,
                    setSelectedServices,
                    subTotals,
                    setSubTotals,
                    comments,
                    setComments,
                    getNextOrderNumber,
                    reorderItems }: SubTotalProps) {

  const [isSubTotalModalOpen, setIsSubTotalModalOpen] = useState<{status: boolean, mode: "edit" | "add" }>({status: false, mode: "add"});
  const [isCommentModalOpen, setIsCommentModalOpen] = useState<{status: boolean, mode: "edit" | "add" }>({status: false, mode: "add"});
  const [isEditServiceModalOpen, setIsEditServiceModalOpen ] = useState<boolean>(false)

  const [currentSubTotalName, setCurrentSubTotalName] = useState<string>("")
  const [currentSubTotalAmount, setCurrentSubTotalAmount] = useState<number>(0)
  const [editedSubTotal, setEditedSubTotal] = useState<SubTotal>()

  const [currentCommentText, setCurrentCommentText] = useState<string>("")
  const [editedComment, setEditedComment] = useState<Comment>()

  const [editedService, setEditedService] = useState<ExtendedServiceItem | ServiceItem | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedServices.length === 0){
      setSubTotals([])
      setComments([])
    }
  }, [selectedServices]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedServices.length, comments.length, subTotals.length]);


  // recalc subtotals sum
  useEffect(() => {
    // eslint-disable-next-line no-use-before-define
    const orderedItems = getAllItemsOrdered();

    let runningTotal = 0;
    const updatedSubTotals: SubTotal[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const item of orderedItems) {
      if (item.type === "service") {
        const service = item.item as ExtendedServiceItem;
        runningTotal += service.price * service.quantity;
      }

      if (item.type === "subTotal") {
        updatedSubTotals.push({
          ...(item.item as SubTotal),
          subTotalAmount: runningTotal,
        });
        runningTotal = 0;
      }
    }

    // обновляем только если что-то реально поменялось
    setSubTotals(prev => {
      let changed = false;
      const newState = prev.map(st => {
        const updated = updatedSubTotals.find(u => u.id === st.id);
        if (updated && updated.subTotalAmount !== st.subTotalAmount) {
          changed = true;
          return updated;
        }
        return st;
      });

      return changed ? newState : prev;
    });
  }, [selectedServices, subTotals]);

  // Create ordered list of all items
  const getAllItemsOrdered = () => {
    const allItems: Array<{
      type: 'service' | 'subTotal' | 'comment';
      item: ExtendedServiceItem | SubTotal | Comment;
      order: number;
    }> = [
      ...selectedServices.map(service => ({ type: 'service' as const, item: service, order: service.order })),
      ...subTotals.map(subTotal => ({ type: 'subTotal' as const, item: subTotal, order: subTotal.order })),
      ...comments.map(comment => ({ type: 'comment' as const, item: comment, order: comment.order }))
    ];
    return allItems.sort((a, b) => a.order - b.order);
  };

  const removeService = (serviceId: string) => {
    const serviceToDelete = selectedServices.find(s => s.id === serviceId);
    if (serviceToDelete) {
      setErrorMsg(null);
      setSelectedServices((prev) =>
        prev.filter((service) => service.id !== serviceId),
      );
      reorderItems(serviceToDelete.order);
    }
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
  };

  const addSubTotal = () => {
    setSubTotals(prevState => [
      ...prevState,
      {
        id: crypto.randomUUID(),
        subTotalName: currentSubTotalName !== "" ? currentSubTotalName : "Стоимость",
        subTotalAmount: currentSubTotalAmount,
        order: getNextOrderNumber()
      }
    ]);
  }

  const addOrEditSubTotal = () => {

    if (isSubTotalModalOpen.mode === "add"){
      addSubTotal()
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

  const addOrEditComment = () => {
    if (isCommentModalOpen.mode === "add"){
      setComments(prevState => [
        ...prevState,
        {
          id: crypto.randomUUID(),
          comment: currentCommentText,
          order: getNextOrderNumber()
        }
      ]);
    }

    if (isCommentModalOpen.mode === "edit") {
      if (!editedComment){
        setErrorMsg("Невозможно изменить комментарий, который не был выбран")
        setCurrentCommentText("")
        setIsCommentModalOpen({status: false, mode: "add"});
        return
      }

      setComments(prevState =>
        prevState.map(c =>
          c.id === editedComment!.id
            ? {
              ...c,
              comment: currentCommentText
            }
            : c
        )
      );
    }

    setCurrentCommentText("")
    setIsCommentModalOpen({status: false, mode: "add"});
  }

  const setNewOrder = (itemType: 'service' | 'subTotal' | 'comment', newOrderNumber: number, itemId: string) => {
    switch (itemType){
      case "service":
        // eslint-disable-next-line no-case-declarations
        const newServices = selectedServices.map(service => {
          if (service.id === itemId){
            service.order = newOrderNumber
          }
          return service
        })
        setSelectedServices(newServices)
        break
      case "comment":
        const newComments = comments.map(comment => {
          if (comment.id === itemId){
            comment.order = newOrderNumber
          }
          return comment
        })
        setComments(newComments)
        break
      case "subTotal":
        const newSubTotals = subTotals.map(subTotal => {
          if (subTotal.id === itemId){
            subTotal.order = newOrderNumber
          }
          return subTotal
        })
        setSubTotals(newSubTotals)
        break
      default:
    }
  }

  const moveItem = ( itemId: string, direction: 'up' | 'down') => {
    const allItems = getAllItemsOrdered()
    allItems.forEach((item, i) => {
      if (item.item.id === itemId){

        const currentItem = item.item
        const currentItemType = item.type

        if (direction === "up" && item.item.order !== 1){
          const switchedItem = allItems[(currentItem.order-1)-1].item
          const switchedItemType = allItems[(currentItem.order-1)-1].type

          setNewOrder(currentItemType, currentItem.order - 1 , currentItem.id)
          setNewOrder(switchedItemType, switchedItem.order + 1 , switchedItem.id)
        }
        if (direction === "down" && item.item.order !== allItems.length){
          const switchedItem = allItems[(currentItem.order-1)+1].item
          const switchedItemType = allItems[(currentItem.order-1)+1].type

          setNewOrder(currentItemType, currentItem.order + 1 , currentItem.id)
          setNewOrder(switchedItemType, switchedItem.order - 1 , switchedItem.id)
        }
        const ordered = getAllItemsOrdered()
        console.log(ordered)
      }
    })
  };


  const deleteSubTotal = (deleteId: string) => {
    const subTotalToDelete = subTotals.find(st => st.id === deleteId);
    if (subTotalToDelete) {
      const filteredSubtotals = subTotals.filter((subTotal) => subTotal.id !== deleteId)
      setSubTotals(filteredSubtotals)
      reorderItems(subTotalToDelete.order);
    }
  }

  const deleteComment = (deleteId: string) => {
    const commentToDelete = comments.find(c => c.id === deleteId);
    if (commentToDelete) {
      const filteredComments = comments.filter((comment) => comment.id !== deleteId)
      setComments(filteredComments)
      reorderItems(commentToDelete.order);
    }
  }

  const renderChangeOrderArrows = (id: string) => {

    return (
      <div className="flex flex-col justify-center items-center">
        <button type="button" onClick={() => moveItem(id, "up")}>▲</button>
        <button type="button" onClick={() => moveItem(id, 'down')}>▼</button>
      </div>
    )
  }

  const renderTable = (services: ExtendedServiceItem[]) => {
    return (
      <div key={`services-${services[0].order}`} className="overflow-hidden border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Or.</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Услуга</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Кол-во</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Цена</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Действие</th>
          </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
          {services.map((service) => (
            <tr key={service.id}>
              <td>
                {renderChangeOrderArrows(service.id)}
              </td>
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
                <div className="flex items-center justify-center gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      service.quantity > 1 && updateQuantity(service.id, service.quantity - 1)
                    }
                    className="text-gray-600 hover:text-black"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <span className="w-6 text-center">{service.quantity}</span>

                  <button
                    type="button"
                    onClick={() => updateQuantity(service.id, service.quantity + 1)}
                    className="text-gray-600 hover:text-black"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                </div>
              </td>


              <td className="px-4 py-2 text-sm text-gray-900 text-right">
                {(service.price * service.quantity).toFixed(2)}{' '}
                {priceList.currency}
                {service.quantity > 1 && (
                  <div className="text-xs text-gray-500">
                    ({service.price.toFixed(2)} × {service.quantity})
                  </div>
                )}
              </td>

              <td className="text-center">
                <div className="flex justify-center items-center gap-2">
                  <Pen
                    className="h-3 w-3 text-black cursor-pointer"
                    onClick={() => {
                      setIsEditServiceModalOpen(true)
                      setEditedService(service)
                    }}
                  />
                  <X
                    className="h-4 w-4 text-red-500 cursor-pointer"
                    onClick={() => removeService(service.id)}
                  />
                </div>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderOrderedItems = () => {

    const orderedItems = getAllItemsOrdered();
    const result = [];

    let currentServices: ExtendedServiceItem[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const item of orderedItems) {
      if (item.type === 'service') {
        currentServices.push(item.item as ExtendedServiceItem);
      } else {
        // Render current services table if we have any
        if (currentServices.length > 0) {
          result.push(
            renderTable(currentServices)
          );
          currentServices = [];
        }

        // Render subtotal or comment
        if (item.type === 'subTotal') {
          const subTotal = item.item as SubTotal;
          result.push(
            <div className="flex justify-between items-center">
              {renderChangeOrderArrows(item.item.id)}
              <div key={`subtotal-${subTotal.id}`} className="flex gap-3 text-right mt-2 font-medium items-center justify-end">
                <div>{subTotal.subTotalName}: {subTotal.subTotalAmount.toFixed(2)} {priceList.currency}</div>
                <Pen className="h-3 w-3 text-black cursor-pointer"
                     onClick={() => {
                       setEditedSubTotal(subTotal)
                       setCurrentSubTotalName(subTotal.subTotalName)
                       setCurrentSubTotalAmount(subTotal.subTotalAmount)
                       setIsSubTotalModalOpen({status: true, mode: "edit"})
                     }}/>
                <X className="h-4 w-4 text-red-500 cursor-pointer" onClick={() => deleteSubTotal(subTotal.id)}/>
              </div>
            </div>

          );

        } else if (item.type === 'comment') {
          const comment = item.item as Comment;
          result.push(
            <div className="flex justify-between items-center">
              {renderChangeOrderArrows(item.item.id)}
              <div key={`comment-${comment.id}`} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-2">
                <div className="flex justify-end items-center gap-4">

                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-yellow-600 " />
                    <p className="text-sm text-gray-700 italic">{comment.comment}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Pen className="h-3 w-3 text-black cursor-pointer"
                         onClick={() => {
                           setEditedComment(comment)
                           setCurrentCommentText(comment.comment)
                           setIsCommentModalOpen({status: true, mode: "edit"})
                         }}/>
                    <X className="h-4 w-4 text-red-500 cursor-pointer" onClick={() => deleteComment(comment.id)}/>
                  </div>
                </div>
              </div>
            </div>
          );
        }
      }
    }

    // Render remaining services if any
    if (currentServices.length > 0) {
      result.push(
        renderTable(currentServices)
      );
    }
    return result;
  };


  return (
    <div ref={scrollRef} className="relative bg-white p-6 rounded-lg border border-gray-200 max-h-[60vh] overflow-y-scroll ">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Выбранные услуги
      </h3>

      {selectedServices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Услуги не выбраны
        </div>
      ) : (
        <div className="space-y-4">
          {renderOrderedItems()}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const subTotalsSum = subTotals.reduce(
                  (acc, st) => acc + (st.subTotalAmount || 0),
                  0
                );
                setCurrentSubTotalAmount(totalAmount - subTotalsSum)
                addSubTotal()
              }}
            >
              Добавить подытог
            </Button>


            <Button
              variant="outline"
              onClick={() => {
                setCurrentCommentText("")
                setIsCommentModalOpen({status: true, mode: "add"});
              }}
            >
              Добавить комментарий
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



      {/* SubTotal Modal */}
      <Dialog open={isSubTotalModalOpen.status} onOpenChange={() => setIsSubTotalModalOpen({status: false, mode: "add"})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isSubTotalModalOpen.mode === "add" ? "Добавить подытог" : "Редактировать подытог"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={currentSubTotalName}
              onChange={(e) =>
                setCurrentSubTotalName(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && currentSubTotalName.trim().length > 0) {
                  addOrEditSubTotal();
                }
              }}
              placeholder="Название подытога"
            />
          </div>
          <DialogFooter>
            <Button onClick={addOrEditSubTotal}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Comment Modal */}
      <Dialog open={isCommentModalOpen.status} onOpenChange={() => setIsCommentModalOpen({status: false, mode: "add"})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isCommentModalOpen.mode === "add" ? "Добавить комментарий" : "Редактировать комментарий"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={currentCommentText}
              onChange={(e) =>
                setCurrentCommentText(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && currentCommentText.trim().length > 0) {
                  addOrEditComment();
                }
              }}
              placeholder="Текст комментария"
            />
          </div>
          <DialogFooter>
            <Button onClick={addOrEditComment} disabled={currentCommentText.trim().length === 0}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit service modal */}
      <Dialog open={isEditServiceModalOpen} onOpenChange={() => setIsEditServiceModalOpen(false)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto min-w-xl">
            {
              editedService &&
              <ServiceConfig selectedServices={selectedServices}
                             setSelectedServices={setSelectedServices}
                             setPendingService={setEditedService}
                             pendingService={editedService}
                             getNextOrderNumber={getNextOrderNumber}
                             setServiceModal={setIsEditServiceModalOpen}
                             isEdit
              />
            }
        </DialogContent>
      </Dialog>
    </div>
  );

}


export default SubTotal;
