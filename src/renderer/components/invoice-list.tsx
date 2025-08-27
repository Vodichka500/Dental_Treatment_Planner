"use client"

import { useState } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export function InvoiceList() {
  const { invoices } = useApp()
  const [dateFilter, setDateFilter] = useState("")
  const [patientFilter, setPatientFilter] = useState("")

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesDate = !dateFilter || invoice.date.includes(dateFilter)
    const matchesPatient = !patientFilter || invoice.patientName.toLowerCase().includes(patientFilter.toLowerCase())
    return matchesDate && matchesPatient
  })

  return (
    <div className="space-y-6">
    <div className="flex justify-between items-center">
    <h2 className="text-2xl font-semibold text-gray-900">Invoice List</h2>
  <Button className="bg-blue-600 hover:bg-blue-700">Open Folder</Button>
  </div>

  {/* Filters */}
  <div className="flex gap-4 bg-white p-4 rounded-lg border border-gray-200">
  <div className="flex-1">
  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Date</label>
  <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full" />
    </div>
    <div className="flex-1">
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
  <table className="w-full">
  <thead className="bg-gray-50">
  <tr>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
    Patient Name
  </th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
    Total Amount
  </th>
  </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {filteredInvoices.map((invoice) => (
        <tr key={invoice.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.patientName}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {new Date(invoice.date).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      {invoice.totalAmount.toFixed(2)} BYN
        </td>
    </tr>
))}
  </tbody>
  </table>
  </div>

  {filteredInvoices.length === 0 && (
    <div className="text-center py-8 text-gray-500">No invoices found matching the current filters.</div>
  )}
  </div>
)
}
