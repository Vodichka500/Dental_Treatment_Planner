'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { clsx } from 'clsx';
import ImportPricelist from '@/components/import-pricelist';
import { generateInvoiceWord } from '@/lib/generate-word';
import StaticToothSchema from '@/components/static-tooth-schema';
import PatientInfo from "@/components/patient-info";
import AddServices from "@/components/add-services";
import SubTotal from "@/components/sub-total";

import type { PriceList, Doctor, ExtendedServiceItem, InvoiceListItem } from '@/lib/types';
import useAsync from "@/lib/hooks/useAsync";
import LoadingErrorData from "@/components/loading-error-data";
import { Loader2 } from "lucide-react";

type CreateInvoiceProps = {
  // eslint-disable-next-line react/require-default-props
  isEditing?: boolean;
  // eslint-disable-next-line react/require-default-props
  setIsEditing?: React.Dispatch<React.SetStateAction<boolean>>;
  // eslint-disable-next-line react/require-default-props
  editingInvoice?: InvoiceListItem;
  // eslint-disable-next-line react/require-default-props
  setInvoiceListInvoices?: React.Dispatch<
    React.SetStateAction<InvoiceListItem[]>
  >;
};

// eslint-disable-next-line import/prefer-default-export
export function CreateInvoice({ isEditing,
                                setIsEditing,
                                editingInvoice,
                                setInvoiceListInvoices,
                              }: CreateInvoiceProps) {

  const [priceList, setPriceList] = useState<PriceList | null>();
  const [doctors, setDoctors] = useState<Doctor[] | null>();
  const [generateInvoiceStatus, setGenerateInvoiceStatus] = useState<"loading" | "error" | null>()

  const [patientName, setPatientName] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [selectedServices, setSelectedServices] = useState<
    ExtendedServiceItem[]
  >([]);
  const [subTotals, setSubTotals] = React.useState<SubTotal[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    status: 'hidden' | 'error' | 'success';
    filename?: string | null;
    errorMsg?: string;
  }>({ status: 'hidden' });

  const { execute: getPriceList, error: getPriceListError, isLoading: getPriceListLoading } = useAsync(window.electron.getPricelist)
  const { execute: getDoctors, error: getDoctorsError, isLoading: getDoctorsLoading } = useAsync(window.electron.getDoctors);

  useEffect(() => {
    // eslint-disable-next-line promise/catch-or-return
    getPriceList()
      .then(res => setPriceList(res))

    // eslint-disable-next-line promise/catch-or-return
    getDoctors()
      .then((data) => setDoctors(data))

  }, [getDoctors, getPriceList]);

  useEffect(() => {
    if (editingInvoice) {
      setPatientName(editingInvoice.patient);
      setSelectedDoctor(editingInvoice.doctor);
      setDate(new Date(editingInvoice.date));
      setSelectedServices(editingInvoice.services);
      if (editingInvoice.subTotals){
        setSubTotals(editingInvoice.subTotals)
      }
    }
  }, [editingInvoice]);

  async function addInvoice(newInvoice: InvoiceListItem) {
    try {
      const bufferedInvoice = await generateInvoiceWord(newInvoice);
      const filename = `${newInvoice.patient}-${new Date(newInvoice.date).toISOString()}.docx`;
      await window.electron.saveInvoice({ filename, bufferedInvoice });
      return filename;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  function handleCancelEditing() {
    setPatientName('');
    setSelectedDoctor(null);
    setDate(new Date());
    setSelectedServices([]);
    if (setIsEditing) {
      setIsEditing(false);
    }
  }

  const totalAmount = selectedServices.reduce(
    (sum, service) => sum + service.price * service.quantity,
    0,
  );

  const handleGenerateInvoice = async () => {
    if (!patientName.trim()) {
      setErrorMsg('Пожалуйста, введите имя пациента');
      return;
    }
    if (!selectedDoctor) {
      setErrorMsg('Пожалуйста, выберите доктора');
      return;
    }
    if (selectedServices.length === 0) {
      setErrorMsg('Пожалуйста, выберите хотя бы одну услугу');
      return;
    }

    setGenerateInvoiceStatus("loading")
    if (isEditing && editingInvoice) {
      const invoicesListItemId = editingInvoice.id;
      const {filename} = editingInvoice;
      await window.electron.deleteInvoice(invoicesListItemId, filename);
    }

    const newInvoice: InvoiceListItem = {
      id: `inv-${Date.now()}`,
      patient: patientName.trim(),
      doctor: selectedDoctor,
      date,
      totalAmount,
      services: selectedServices,
      filename: '',
    };

    const addToInvoiceList = async (filename: string) => {
      const currentInvoices = (await window.electron.getInvoicesList()) || [];
      currentInvoices.push({
        id: newInvoice.id,
        patient: newInvoice.patient,
        filename,
        date,
        totalAmount,
        doctor: selectedDoctor,
        services: selectedServices,
        subTotals
      });
      if (setInvoiceListInvoices) {
        setInvoiceListInvoices(currentInvoices);
      }
      await window.electron.saveInvoicesList(currentInvoices);
      setGenerateInvoiceStatus(null)
    };

    try {
      const filename = await addInvoice(newInvoice);
      setModal({ status: 'success', filename });
      if (filename) await addToInvoiceList(filename);
    } catch (error) {
      const formattedError =
        error instanceof Error ? error.message : String(error);
      setModal({ status: 'error', errorMsg: formattedError });
    } finally {
      setPatientName('');
      setSelectedDoctor(null);
      setDate(new Date());
      setSelectedServices([]);

    }
  };

  const handleOpenFile = async (filename: string | null | undefined) => {

    if (filename) {
      await window.electron.openInvoice({ filename });
    }
    if (setIsEditing) {
      setIsEditing(false);
    }
    setModal({ status: 'hidden' });
  };
  const handleCloseModal = () => {
    setModal({ status: 'hidden' });
    if (setIsEditing) {
      setIsEditing(false);
    }
  };

  const getGenerateButtonText = () => {
    if (generateInvoiceStatus === "loading") {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Сохранение...
        </>
      );
    }
    if (generateInvoiceStatus === "error") {
      return (
        <>Ошибка при сохранении данных...</>
      )
    }
    if(isEditing){
      return (
        <>Сохранить изменения</>
      )
    }

    return (
      <>Генерировать план лечения</>
    );
  }

  // LOADING DATA CHECK
  if (getPriceListLoading && !getPriceListError) {
    return <LoadingErrorData isLoading message="loading pricelist..."/>
  }
  if (!getPriceListLoading && getPriceListError || !priceList) {
    return (
     <>
       <LoadingErrorData isLoading={false} message="Ошибка загрузки прайс-листа. Попробуйте ещё раз или загрузите прайс-лист ниже."/>
       <ImportPricelist />
     </>
    );
  }
  if (getDoctorsLoading) {
    return <LoadingErrorData isLoading message="Загрузка списка докторов..."/>
  }

  if (getDoctorsError || !doctors) {
    return <LoadingErrorData isLoading={false} message="Ошибка загрузки списка докторов. Попробуйте ещё раз."/>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Создать план лечения</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column - Form */}
        <div className="space-y-6">

          <PatientInfo patientName={patientName}
                       setPatientName={setPatientName}
                       doctors={doctors}
                       selectedDoctor={selectedDoctor}
                       setSelectedDoctor={setSelectedDoctor}
                       date={date}
                       setDate={setDate}
                       setErrorMsg={setErrorMsg}
          />

          <StaticToothSchema services={selectedServices} />

          <AddServices setSelectedServices={setSelectedServices}
                       setErrorMsg={setErrorMsg}
                       priceList={priceList}
          />
        </div>

        {/* Right Column - Selected Services */}
        <div className="space-y-6">
         <SubTotal totalAmount={totalAmount}
                   setErrorMsg={setErrorMsg}
                   priceList={priceList}
                   setSelectedServices={setSelectedServices}
                   selectedServices={selectedServices}
                   subTotals={subTotals}
                   setSubTotals={setSubTotals}
         />

          {/* Generate Invoice Button */}
          <div className="flex gap-4">
            {isEditing ? (
              <>
                <Button
                  onClick={handleCancelEditing}
                  className="flex-1 bg-red-400 hover:bg-red-700 cursor-pointer"
                >
                  Отменить
                </Button>
                <Button
                  onClick={handleGenerateInvoice}
                  className={clsx(
                    'flex-1 bg-green-600 hover:bg-green-700 cursor-pointer',
                    (!patientName.trim() ||
                      !selectedDoctor ||
                      selectedServices.length === 0) &&
                      'bg-gray-300',
                  )}
                >
                  {getGenerateButtonText()}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleGenerateInvoice}
                className={clsx(
                  'flex-1 bg-blue-600 hover:bg-blue-700 cursor-pointer',
                  (!patientName.trim() ||
                    !selectedDoctor ||
                    selectedServices.length === 0) &&
                    'bg-gray-300',
                )}
              >
                {getGenerateButtonText()}
              </Button>
            )}
          </div>
          {errorMsg && (
            <div className="text-sm mt-2 text-red-500 bg-red-50 p-2 rounded">
              {errorMsg}
            </div>
          )}
        </div>
      </div>
      {(modal.status === 'success' || modal.status === 'error') && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          {modal.status === 'success' ? (
            <div className="bg-white rounded-lg shadow-lg border p-6 max-w-sm w-full mx-4 text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Success
              </h3>
              <p className="text-gray-600 text-sm mb-6">Файл готов</p>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    onClick={() => handleOpenFile(modal.filename)}
                  >
                    Открыть файл
                  </Button>
                  <Button
                    variant="outline"
                    className="text-sm bg-transparent"
                    onClick={handleCloseModal}
                  >
                    Закрыть
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg border p-6 max-w-sm w-full mx-4 text-center">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Ошибка
              </h3>
              <p className="text-red-600 text-sm mb-2">
                {modal.errorMsg || 'Что-то пошло не так'}
              </p>
              <p className="text-gray-600 text-sm mb-6">Пожалуйста попробуйте снова</p>
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white text-sm"
                onClick={() => setModal({ status: 'hidden' })}
              >
                Попробовать снова
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
