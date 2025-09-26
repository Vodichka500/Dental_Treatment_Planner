import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";
import type { ExtendedServiceItem, ServiceItem } from "@/lib/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface  ServiceConfigProps{
  pendingService: ServiceItem | ExtendedServiceItem | null
  setPendingService:  React.Dispatch<React.SetStateAction<ServiceItem | ExtendedServiceItem | null>>;
  getNextOrderNumber: () => number
  setServiceModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedServices: ExtendedServiceItem[]
  setSelectedServices: React.Dispatch<React.SetStateAction<ExtendedServiceItem[]>>;
  // eslint-disable-next-line react/require-default-props
  isEdit?: boolean
}

const dentalChart = {
  upperRight: ['18', '17', '16', '15', '14', '13', '12', '11'],
  upperLeft: ['21', '22', '23', '24', '25', '26', '27', '28'],
  lowerRight: ['48', '47', '46', '45', '44', '43', '42', '41'],
  lowerLeft: ['31', '32', '33', '34', '35', '36', '37', '38'],
};

function ServiceConfig({
                         pendingService,
                         setPendingService,
                         getNextOrderNumber,
                         setServiceModal,
                         selectedServices,
                         setSelectedServices,
                         isEdit}: ServiceConfigProps) {

  const [serviceQuantity, setServiceQuantity] = useState(1);
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [linkedToTeeth, setLinkedToTeeth] = useState(true);
  const [serviceComment, setServiceComment] = useState('');

  const [commentTeethNumber, setCommentTeethNumber] = useState<string>('');
  const [commentTeeth, setCommentTeeth] = useState<string>('');
  const [commentTeethError, setCommentTeethError] = useState<string>('');
  const [teethComments, setTeethComments] = useState<{
    [toothNumber: number]: string;
  }>({});
  const [openCommentModal, setOpenCommentModal] = useState(false)

  useEffect(() => {
    if (pendingService){
      if ("quantity" in pendingService && pendingService.quantity ) {setServiceQuantity(pendingService.quantity )}
      if ("selectedTeeth" in pendingService && pendingService.selectedTeeth ) {setSelectedTeeth(pendingService.selectedTeeth )}
      if ("linkedToTeeth" in pendingService && pendingService.linkedToTeeth ) {setLinkedToTeeth(pendingService.linkedToTeeth )}
      if ("comment" in pendingService && pendingService.comment ) {setServiceComment(pendingService.comment )}
      if ("teethComments" in pendingService && pendingService.teethComments ) {setTeethComments(pendingService.teethComments )}
    }
  }, [pendingService]);

  const toggleTooth = (tooth: string) => {
    setSelectedTeeth((prev) => {
      let newTeeth: string[];
      if (prev.includes(tooth)) {
        newTeeth = prev.filter((t) => t !== tooth);
      } else {
        newTeeth = [...prev, tooth];
      }

      // Auto-update quantity based on selected teeth
      if (linkedToTeeth) {
        setServiceQuantity(newTeeth.length || 1);
      }
      return newTeeth;
    });
  };

  const confirmAddService = () => {
    if (!pendingService) return;

    if (isEdit){
      const filteredServices = selectedServices.filter(item => {
        return item.id !== pendingService.id
      })
      const editService: ExtendedServiceItem = {
        ...pendingService as ExtendedServiceItem,
        quantity: serviceQuantity,
        selectedTeeth: linkedToTeeth ? selectedTeeth : [],
        linkedToTeeth,
        comment: serviceComment.trim() || undefined,
        teethComments
      };
      setSelectedServices(() => [...filteredServices, editService]);
    } else {
      const newService: ExtendedServiceItem = {
        ...pendingService,
        id: `service-${Date.now()}-${Math.random()}`,
        quantity: serviceQuantity,
        selectedTeeth: linkedToTeeth ? selectedTeeth : [],
        linkedToTeeth,
        comment: serviceComment.trim() || undefined,
        teethComments,
        order: getNextOrderNumber()
      };
      console.log(newService);

      setSelectedServices((prev) => [...prev, newService]);
    }


    setServiceModal(false);
    setPendingService(null);

    setCommentTeethNumber('');
    setCommentTeeth('');
    setCommentTeethError('');
    setTeethComments({});
  };

  const cancelAddService = () => {
    setServiceModal(false);
    setPendingService(null);
    setServiceQuantity(1);
    setSelectedTeeth([]);
    setLinkedToTeeth(true);
    setServiceComment('');

    setCommentTeethNumber('');
    setCommentTeeth('');
    setCommentTeethError('');
    setTeethComments({});
  };

  const removeToothComment = (tooth: string) => {
    setTeethComments((prev) => {
      const updated = { ...prev };
      delete updated[Number(tooth)];
      return updated;
    });
  };

  const handleRightClickTooth = (e: React.MouseEvent, tooth: string) => {
    e.preventDefault() // чтобы не показывалось стандартное контекстное меню
    setCommentTeethNumber(tooth)
    setOpenCommentModal(true)
  }

  const addToothComment = () => {
    if (commentTeethNumber === '' && commentTeeth === '') {
      setCommentTeethError('Missing teeth number or comment');
      return;
    }

    setTeethComments((prev) => ({
      ...prev,
      [Number(commentTeethNumber)]: commentTeeth, // добавляем или обновляем
    }));

    // очистим поля после добавления
    setCommentTeethNumber('');
    setCommentTeeth('');
    setCommentTeethError('');
    setOpenCommentModal(false)
  };

  return (
    <div>
      <div className="mt-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
        <div className="flex justify-between">
          <h4 className="font-medium text-gray-900 mb-4">
            Конфигурация услуги: {pendingService!.name}
          </h4>
          <div className="flex gap-5 items-center">
            <Button
              onClick={confirmAddService}
              variant="outline"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Добавить
            </Button>
            <X onClick={cancelAddService} className="w-4 h-4 text-gray-600"/>
          </div>
        </div>

        <div className="space-y-4">
          {/* Quantity Input */}
          <div>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Количество
            </label>
            <Input
              type="number"
              min="1"
              value={serviceQuantity}
              onChange={(e) =>
                setServiceQuantity(
                  Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                )
              }
              className="w-20"
            />
          </div>

          {/* Teeth Selection */}
          <div>
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="linkToTeeth"
                checked={linkedToTeeth}
                onChange={(e) => {
                  setLinkedToTeeth(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedTeeth([]);
                  }
                }}
                className="mr-2"
              />
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label
                htmlFor="linkToTeeth"
                className="text-sm font-medium text-gray-700"
              >
                Привязать зубы к услуге
              </label>
            </div>

            {linkedToTeeth && (
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Зубная схема
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Upper Quadrants */}
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">
                      Верхний правый угол
                    </div>
                    <div className="flex flex-nowrap gap-1 justify-center overflow-x-auto">
                      {dentalChart.upperRight.map((tooth) => (
                        <button
                          key={tooth}
                          type="button"
                          onClick={() => toggleTooth(tooth)}
                          onContextMenu={(e) => handleRightClickTooth(e, tooth)}
                          className={clsx(
                            'w-8 h-8 text-xs border rounded',
                            selectedTeeth.includes(tooth)
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
                          )}
                        >
                          {tooth}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">
                      Верхний левый угол
                    </div>
                    <div className="flex flex-nowrap gap-1 justify-center overflow-x-auto">
                      {dentalChart.upperLeft.map((tooth) => (
                        <button
                          key={tooth}
                          type="button"
                          onClick={() => toggleTooth(tooth)}
                          onContextMenu={(e) => handleRightClickTooth(e, tooth)}
                          className={clsx(
                            'w-8 h-8 text-xs border rounded',
                            selectedTeeth.includes(tooth)
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
                          )}
                        >
                          {tooth}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lower Quadrants */}
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">
                      Нижний правый угол
                    </div>
                    <div className="flex flex-nowrap gap-1 justify-center overflow-x-auto">
                      {dentalChart.lowerRight.map((tooth) => (
                        <button
                          key={tooth}
                          type="button"
                          onClick={() => toggleTooth(tooth)}
                          onContextMenu={(e) => handleRightClickTooth(e, tooth)}
                          className={clsx(
                            'w-8 h-8 text-xs border rounded',
                            selectedTeeth.includes(tooth)
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
                          )}
                        >
                          {tooth}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">
                      Нижний левый угол
                    </div>
                    <div className="flex flex-nowrap gap-1 justify-center overflow-x-auto">
                      {dentalChart.lowerLeft.map((tooth) => (
                        <button
                          key={tooth}
                          type="button"
                          onClick={() => toggleTooth(tooth)}
                          onContextMenu={(e) => handleRightClickTooth(e, tooth)}
                          className={clsx(
                            'w-8 h-8 text-xs border rounded',
                            selectedTeeth.includes(tooth)
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
                          )}
                        >
                          {tooth}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="hover:bg-gray-600"
                    onClick={() => {
                      const allTeeth = [
                        ...dentalChart.upperRight,
                        ...dentalChart.upperLeft,
                        ...dentalChart.lowerRight,
                        ...dentalChart.lowerLeft,
                      ];
                      setSelectedTeeth(allTeeth);
                      if (linkedToTeeth) {
                        setServiceQuantity(allTeeth.length);
                      }
                    }}
                  >
                    Выбрать все
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTeeth([]);
                      if (linkedToTeeth) {
                        setServiceQuantity(1);
                      }
                    }}
                  >
                    Очистить
                  </Button>
                </div>
                {selectedTeeth.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Выбранные зубы:{' '}
                    {selectedTeeth
                      .sort(
                        (a, b) =>
                          Number.parseInt(a, 10) -
                          Number.parseInt(b, 10),
                      )
                      .join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Comment to teeth input */}
          <div className="flex flex-col gap-3">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Комментарий к зубу (Опционально)
            </label>
            <div className="flex gap-3">
              <Input
                id="tooth-number-comment"
                type="number"
                className="w-24"
                placeholder="Зуб"
                value={commentTeethNumber}
                onChange={(event) =>
                  setCommentTeethNumber(event.target.value)
                }
              />
              <Input
                id="text"
                type="text"
                className="flex-1"
                placeholder="Комментарий..."
                value={commentTeeth}
                onChange={(event) =>
                  setCommentTeeth(event.target.value)
                }
              />
              <Button
                variant="outline"
                disabled={
                  commentTeeth === '' || commentTeethNumber === ''
                }
                onClick={addToothComment}
              >
                Добавить
              </Button>
            </div>
            <div className="text-sm text-red-500">
              {commentTeethError}
            </div>
          </div>

          <ul className="mt-2">
            {Object.entries(teethComments).map(([tooth, comment]) => (
              <li key={tooth}>
                <div className="flex gap-2 items-center">
                  <p>
                    <span className="font-medium">Зуб {tooth}:</span>{' '}
                    {comment}
                  </p>
                  <X
                    className="h-4 w-4 cursor-pointer text-red-500 hover:text-red-700"
                    onClick={() => removeToothComment(tooth)}
                  />
                </div>
              </li>
            ))}
          </ul>

          {/* Comment Input */}
          <div>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Комментарий к зубу (Опционально)
            </label>
            <textarea
              placeholder="Добавь какие-либо заметки или комментарии..."
              value={serviceComment}
              onChange={(e) => setServiceComment(e.target.value)}
              className="w-full border rounded-md p-2 text-sm focus:ring focus:ring-blue-200"
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          {/* <div className="flex gap-2 pt-2"> */}
          {/*   <Button */}
          {/*     onClick={confirmAddService} */}
          {/*     className="bg-green-600 hover:bg-green-700 text-white" */}
          {/*   > */}
          {/*     Добавить */}
          {/*   </Button> */}
          {/*   <Button */}
          {/*     onClick={cancelAddService} */}
          {/*     variant="ghost" */}
          {/*     className="text-gray-600 hover:text-gray-700" */}
          {/*   > */}
          {/*     Отменить */}
          {/*   </Button> */}
          {/* </div> */}
        </div>
      </div>
      <Dialog open={openCommentModal} onOpenChange={setOpenCommentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить комментарии к зубу {commentTeethNumber}</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Введи комментарий..."
            value={commentTeeth}
            onChange={(e) => setCommentTeeth(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && commentTeeth.trim().length > 0) {
                addToothComment();
              }
            }}
          />
          <div className="text-sm text-red-500">
            {commentTeethError}
          </div>
          <DialogFooter>
            <Button
              onClick={addToothComment}
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ServiceConfig;
