"use client"

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { InvoiceListItem } from "@/lib/types";
import { Trash2, Edit } from "lucide-react";
import EditInvoice from "@/components/edit-invoice";
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



export default function InvoiceList() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceListItem[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [patientFilter, setPatientFilter] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceListItem | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceListItem | null>(null)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)


  useEffect(() => {
    // eslint-disable-next-line promise/catch-or-return
    window.electron.getInvoicesList()
      .then((invoicesList) => setInvoices(invoicesList))
      .catch((e) => {console.error(e)})

  }, []);

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
    console.log("Open invoice:", filename);
    await window.electron.openInvoice({filename})
    // Здесь можно вызвать ipcRenderer.invoke("open-invoice", { filename })
  }

  const handleEditInvoice = async (invoiceListItem: InvoiceListItem) => {
    setIsLoadingEdit(true)
    try {
      // Если selectedDoctor уже есть в данных списка:
      const fullInvoice: InvoiceListItem = {
        id: invoiceListItem.id,
        patient: invoiceListItem.patient,
        doctor: invoiceListItem.doctor, // Используем сохраненного доктора
        date: new Date(invoiceListItem.date),
        totalAmount: invoiceListItem.totalAmount,
        services: invoiceListItem.services,
        filename: invoiceListItem.filename
      }

      setEditingInvoice(fullInvoice)
    } catch (error) {
      console.error('Error loading invoice for edit:', error)
      // Показать ошибку пользователю
    } finally {
      setIsLoadingEdit(false)
    }
  }
  const handleEditCancel = () => {
    setEditingInvoice(null)
  }
  const handleEditSaveSuccess = async () => {
    setEditingInvoice(null)
    window.electron.getInvoicesList()
      .then((invoicesList) => setInvoices(invoicesList))
      .catch((e) => {console.error(e)})
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


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Invoice List</h2>
        <Button className="bg-blue-600 hover:bg-blue-700">Open Folder</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1">
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Date</label>
          <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full" />
        </div>
        <div className="flex-1">
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Patient Name</label>
          <Input
            type="text"
            placeholder="Enter patient name..."
            value={patientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {editingInvoice ? (
          <EditInvoice
            invoice={editingInvoice}
            onSaveSuccess={handleEditSaveSuccess}
            onCancel={handleEditCancel}
          />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
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
                    Open Invoice
                  </Button>

                  <Button
                    variant="outline"
                    className="py-1 px-3 rounded-lg border-blue-300 cursor-pointer"
                    onClick={() => handleEditInvoice(invoice)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
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
                        <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The file{" "}
                          <span className="font-semibold">{invoice.filename}</span> will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteInvoice} className="bg-red-600 hover:bg-red-700">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        )}
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-8 text-gray-500">No invoices found matching the current filters.</div>
      )}
    </div>
  )
}
