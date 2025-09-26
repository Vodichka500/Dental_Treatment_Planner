"use client"

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { InvoiceListItem } from "@/lib/types";
import { Trash2, Edit } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CreateInvoice } from "@/components/create-invoice";
import useAsync from "@/lib/hooks/useAsync";
import LoadingErrorData from "@/components/loading-error-data";
import ImportPricelist from "@/components/import-pricelist";



export default function InvoiceList() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceListItem[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [patientFilter, setPatientFilter] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceListItem | null>(null);
  const [isEditing, setIsEditing] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<InvoiceListItem>()

  const { execute: getInvoiceList, error: getInvoiceListError, isLoading: getInvoiceListLoading } = useAsync(window.electron.getInvoicesList)


  useEffect(() => {
    // eslint-disable-next-line promise/catch-or-return
    getInvoiceList()
      .then(res => setInvoices(res))
    // eslint-disable-next-line promise/catch-or-return
  }, [getInvoiceList]);

  useEffect(() => {
    if(!invoices){return}
    const filtered = invoices.filter(invoice => {
      const matchesDate = !dateFilter || new Date(invoice.date).toISOString().slice(0,10) === dateFilter;
      const matchesPatient = !patientFilter || invoice.patient.toLowerCase().includes(patientFilter.toLowerCase());
      return matchesDate && matchesPatient;
    });
    setFilteredInvoices(filtered);
  }, [invoices, dateFilter, patientFilter]);

  const handleOpenInvoice = async (filename: string) => {
    await window.electron.openInvoice({filename})
  }

  const handleEditInvoice = async (invoiceListItem: InvoiceListItem) => {

    const fullInvoice: InvoiceListItem = {
      id: invoiceListItem.id,
      patient: invoiceListItem.patient,
      doctor: invoiceListItem.doctor, // Используем сохраненного доктора
      date: new Date(invoiceListItem.date),
      totalAmount: invoiceListItem.totalAmount,
      services: invoiceListItem.services,
      filename: invoiceListItem.filename,
      subTotals: invoiceListItem.subTotals,
      comments: invoiceListItem.comments
    }
    setEditingInvoice(fullInvoice)
    console.log(fullInvoice)
    setIsEditing(true)
    console.log(fullInvoice)
  }


  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;
    try {
      const updatedInvoices = await window.electron.deleteInvoice(selectedInvoice.id, selectedInvoice.filename);
      setInvoices(updatedInvoices);
      setSelectedInvoice(null);
    } catch (error) {
      console.error("Failed to delete invoice:", error);
    }
  };

  // LOADING DATA CHECK
  if (getInvoiceListLoading && !getInvoiceListError) {
    return <LoadingErrorData isLoading message="Загрузка планов лечения..."
    />
  }
  if (!getInvoiceListLoading && getInvoiceListError || !invoices) {
    return (
      <>
        <LoadingErrorData isLoading={false} message="Ошибка загрузки планов лечения. Попробуйте еще раз."/>
        <ImportPricelist />
      </>
    );
  }


  return (
    <div className="space-y-6 overflow-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Планы лечения</h2>
        <Button className="bg-blue-600 hover:bg-blue-700">Открыть папку</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1">
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="block text-sm font-medium text-gray-700 mb-1">Фильтр по дате</label>
          <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full" />
        </div>
        <div className="flex-1">
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="block text-sm font-medium text-gray-700 mb-1">Фильтр по имени пациента</label>
          <Input
            type="text"
            placeholder="Введите имя пациента..."
            value={patientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {
        isEditing ? (
          <CreateInvoice isEditing={true} setIsEditing={setIsEditing} editingInvoice={editingInvoice} setInvoiceListInvoices={setInvoices}/>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя пациента</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.slice().reverse().map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.patient}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(invoice.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.totalAmount.toFixed(2)} BYN</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="py-1 px-3 rounded-lg border-green-300 cursor-pointer"
                    onClick={() => handleOpenInvoice(invoice.filename)}
                  >
                    Открыть план
                  </Button>

                  <Button
                    variant="outline"
                    className="py-1 px-3 rounded-lg border-blue-300 cursor-pointer"
                    onClick={() => handleEditInvoice(invoice)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Редактировать
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="text-black hover:bg-red-50 cursor-pointer"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Удалить план?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Это действие нельзя будет отменить. Файл {" "}
                          <span className="font-semibold">{invoice.filename}</span> будет навсегда удален.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteInvoice} className="bg-red-600 hover:bg-red-700">
                          Удалить
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        )
      }

      {filteredInvoices.length === 0 && (
        <div className="text-center py-8 text-gray-500">Планы лечения, соответствующие текущим фильтрам, не найдены..</div>
      )}
    </div>
  )
}
