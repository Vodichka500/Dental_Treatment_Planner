"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ServiceSelector } from "@/components/service-selector"
import { clsx } from "clsx"
import { PriceList, Doctor, Invoice, ServiceItem, InvoiceListItem, InvoiceItemService } from "@/lib/types";
import { generateInvoiceWord } from "@/lib/generate-word";

interface ExtendedServiceItem extends ServiceItem {
  quantity: number
  selectedTeeth: string[]
  linkedToTeeth: boolean
  comment?: string
}

interface EditInvoiceProps {
  invoice: InvoiceListItem
  onSaveSuccess: () => void
  onCancel: () => void
}

const dentalChart = {
  upperRight: ["18", "17", "16", "15", "14", "13", "12", "11"],
  upperLeft: ["21", "22", "23", "24", "25", "26", "27", "28"],
  lowerRight: ["48", "47", "46", "45", "44", "43", "42", "41"],
  lowerLeft: ["31", "32", "33", "34", "35", "36", "37", "38"],
}

export default function EditInvoice({ invoice, onSaveSuccess, onCancel }: EditInvoiceProps) {
  const [patientName, setPatientName] = useState(invoice.patient)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(invoice.doctor)
  const [date, setDate] = useState<Date>(new Date(invoice.date))
  const [selectedServices, setSelectedServices] = useState<InvoiceItemService[]>(invoice.services)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [serviceModal, setServiceModal] = useState(false)
  const [pendingService, setPendingService] = useState<InvoiceItemService | null>(null)
  const [serviceQuantity, setServiceQuantity] = useState(1)
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([])
  const [linkedToTeeth, setLinkedToTeeth] = useState(true)
  const [serviceComment, setServiceComment] = useState("")
  const [priceList, setPriceList] = useState<PriceList | null>()
  const [doctors, setDoctors] = useState<Doctor[] | null>()
  const [loadDataErr, setLoadDataErr] = useState<string>("")

  useEffect(() => {
    window.electron.getDoctors()
      .then(data => setDoctors(data))
      .catch(() => setLoadDataErr("Error while fetching doctors"))
    window.electron.getPricelist()
      .then(data => setPriceList(data))
      .catch(() => setLoadDataErr("Error with fetching Price List"))
  }, [priceList, doctors]);

  const addService = (service: InvoiceItemService) => {
    setErrorMsg(null)
    setPendingService(service)
    setServiceQuantity(1)
    setSelectedTeeth([])
    setLinkedToTeeth(true)
    setServiceComment("")
    setServiceModal(true)
  }

  const toggleTooth = (tooth: string) => {
    setSelectedTeeth((prev) => {
      let newTeeth: string[]
      if (prev.includes(tooth)) {
        newTeeth = prev.filter((t) => t !== tooth)
      } else {
        newTeeth = [...prev, tooth]
      }

      if (linkedToTeeth) {
        setServiceQuantity(newTeeth.length || 1)
      }
      return newTeeth
    })
  }

  const confirmAddService = () => {
    if (!pendingService) return

    const newService: ExtendedServiceItem = {
      ...pendingService,
      id: `service-${Date.now()}-${Math.random()}`,
      quantity: serviceQuantity,
      selectedTeeth: linkedToTeeth ? selectedTeeth : [],
      linkedToTeeth,
      comment: serviceComment.trim() || undefined,
    }

    setSelectedServices((prev) => [...prev, newService])
    setServiceModal(false)
    setPendingService(null)
  }

  const cancelAddService = () => {
    setServiceModal(false)
    setPendingService(null)
    setServiceQuantity(1)
    setSelectedTeeth([])
    setLinkedToTeeth(true)
    setServiceComment("")
  }

  const removeService = (serviceId: string) => {
    setErrorMsg(null)
    setSelectedServices((prev) => prev.filter((service) => service.id !== serviceId))
  }

  const totalAmount = selectedServices.reduce((sum, service) => sum + service.price * service.quantity, 0)

  const handleSaveInvoice = async () => {
    if (!patientName.trim()) {
      setErrorMsg("Please enter patient name");
      return;
    }
    if (!selectedDoctor) {
      setErrorMsg("Please select a doctor");
      return;
    }
    if (selectedServices.length === 0) {
      setErrorMsg("Please select at least one service");
      return;
    }

    setIsLoading(true);

    const updatedInvoice: Invoice = {
      ...invoice,
      patientName: patientName.trim(),
      selectedDoctor,
      date,
      totalAmount,
      services: selectedServices,
    };

    if (!invoice.filename) return

    try {
      // Генерируем новый документ
      const bufferedInvoice = await generateInvoiceWord(updatedInvoice);

      // Сохраняем в тот же файл
      await window.electron.saveInvoice({
        filename: invoice.filename, // Используем существующее имя файла
        bufferedInvoice
      });

      // Обновляем список invoice
      const currentInvoices = (await window.electron.getInvoicesList()) || [];
      const invoiceIndex = currentInvoices.findIndex(inv => inv.id === invoice.id);

      if (invoiceIndex !== -1) {
        currentInvoices[invoiceIndex] = {
          id: invoice.id,
          patient: updatedInvoice.patientName,
          filename: invoice.filename, // Оставляем то же имя файла
          doctor: selectedDoctor,
          date,
          totalAmount,
          services: selectedServices
        };
        await window.electron.saveInvoicesList(currentInvoices);
      }

      onSaveSuccess();
    } catch (error) {
      const formattedError = error instanceof Error ? error.message : String(error);
      setErrorMsg(`Failed to save invoice: ${formattedError}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadDataErr !== "" || !doctors || !priceList) { return (
    <div>
      <p className="text-xl">Something went wrong</p>
      <p className="text-lg text-red-500">Error message: {loadDataErr}</p>
    </div>
  ) }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Edit Invoice</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveInvoice}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* Patient Information */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
            <div className="space-y-4">
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                <Input
                  type="text"
                  placeholder="Enter patient name..."
                  value={patientName}
                  onChange={(e) => {
                    setPatientName(e.target.value)
                    setErrorMsg(null)
                  }}
                  className="w-full"
                />
              </div>

              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label htmlFor="doctor-select" className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                <select
                  id="doctor-select"
                  value={selectedDoctor?.id || ""}
                  onChange={(e) => {
                    const doctor = doctors.find((d) => d.id === e.target.value) || null
                    setSelectedDoctor(doctor)
                    setErrorMsg(null)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a doctor...</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <Input
                  type="date"
                  value={date.toISOString().split("T")[0]}
                  onChange={(e) => setDate(new Date(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Service Selector */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Services</h3>
            <ServiceSelector priceList={priceList} onServiceSelect={addService} />

            {serviceModal && pendingService && (
              <div className="mt-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h4 className="font-medium text-gray-900 mb-4">Configure Service: {pendingService.name}</h4>

                <div className="space-y-4">
                  {/* Quantity Input */}
                  <div>
                    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <Input
                      type="number"
                      min="1"
                      value={serviceQuantity}
                      onChange={(e) => setServiceQuantity(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
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
                          setLinkedToTeeth(e.target.checked)
                          if (!e.target.checked) {
                            setSelectedTeeth([])
                          }
                        }}
                        className="mr-2"
                      />
                      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                      <label htmlFor="linkToTeeth" className="text-sm font-medium text-gray-700">
                        Link to specific teeth
                      </label>
                    </div>

                    {linkedToTeeth && (
                      <div className="border border-gray-300 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">Dental Chart</div>
                        <div className="grid grid-cols-2 gap-4">
                          {/* Upper Quadrants */}
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Upper Right</div>
                            <div className="flex flex-nowrap gap-1 justify-center overflow-x-auto">
                              {dentalChart.upperRight.map((tooth) => (
                                <button
                                  key={tooth}
                                  type="button"
                                  onClick={() => toggleTooth(tooth)}
                                  className={clsx(
                                    "w-8 h-8 text-xs border rounded",
                                    selectedTeeth.includes(tooth)
                                      ? "bg-blue-500 text-white border-blue-500"
                                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                                  )}
                                >
                                  {tooth}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Upper Left</div>
                            <div className="flex flex-nowrap gap-1 justify-center overflow-x-auto">
                              {dentalChart.upperLeft.map((tooth) => (
                                <button
                                  key={tooth}
                                  type="button"
                                  onClick={() => toggleTooth(tooth)}
                                  className={clsx(
                                    "w-8 h-8 text-xs border rounded",
                                    selectedTeeth.includes(tooth)
                                      ? "bg-blue-500 text-white border-blue-500"
                                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                                  )}
                                >
                                  {tooth}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Lower Quadrants */}
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Lower Right</div>
                            <div className="flex flex-nowrap gap-1 justify-center overflow-x-auto">
                              {dentalChart.lowerRight.map((tooth) => (
                                <button
                                  key={tooth}
                                  type="button"
                                  onClick={() => toggleTooth(tooth)}
                                  className={clsx(
                                    "w-8 h-8 text-xs border rounded",
                                    selectedTeeth.includes(tooth)
                                      ? "bg-blue-500 text-white border-blue-500"
                                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                                  )}
                                >
                                  {tooth}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Lower Left</div>
                            <div className="flex flex-nowrap gap-1 justify-center overflow-x-auto">
                              {dentalChart.lowerLeft.map((tooth) => (
                                <button
                                  key={tooth}
                                  type="button"
                                  onClick={() => toggleTooth(tooth)}
                                  className={clsx(
                                    "w-8 h-8 text-xs border rounded",
                                    selectedTeeth.includes(tooth)
                                      ? "bg-blue-500 text-white border-blue-500"
                                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
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
                            size="sm"
                            className="bg-blue-500 text-white hover:bg-blue-600"
                            onClick={() => {
                              const allTeeth = [
                                ...dentalChart.upperRight,
                                ...dentalChart.upperLeft,
                                ...dentalChart.lowerRight,
                                ...dentalChart.lowerLeft,
                              ]
                              setSelectedTeeth(allTeeth)
                              if (linkedToTeeth) {
                                setServiceQuantity(allTeeth.length)
                              }
                            }}
                          >
                            Select All
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTeeth([])
                              if (linkedToTeeth) {
                                setServiceQuantity(1)
                              }
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                        {selectedTeeth.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            Selected teeth:{" "}
                            {selectedTeeth.sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10)).join(", ")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Comment Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comment (Optional)
                    </label>
                    <textarea
                      placeholder="Add any notes or comments..."
                      value={serviceComment}
                      onChange={(e) => setServiceComment(e.target.value)}
                      className="w-full border rounded-md p-2 text-sm focus:ring focus:ring-blue-200"
                      rows={4}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button onClick={confirmAddService} className="bg-green-600 hover:bg-green-700 text-white">
                      Add
                    </Button>
                    <Button onClick={cancelAddService} variant="ghost" className="text-gray-600 hover:text-gray-700">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Selected Services */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Services</h3>

            {selectedServices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No services selected</div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {selectedServices.map((service) => (
                      <tr key={service.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-gray-500 text-xs">{service.path.join(" → ")}</div>
                            {service.linkedToTeeth && service.selectedTeeth.length > 0 && (
                              <div className="text-blue-600 text-xs mt-1">
                                Teeth:{" "}
                                {service.selectedTeeth
                                  .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
                                  .join(", ")}
                              </div>
                            )}
                            {service.comment && (
                              <div className="text-gray-600 text-xs mt-1 italic">Note: {service.comment}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-center">{service.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">
                          {(service.price * service.quantity).toFixed(2)} {priceList.currency}
                          {service.quantity > 1 && (
                            <div className="text-xs text-gray-500">
                              ({service.price.toFixed(2)} × {service.quantity})
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
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span>
                      {totalAmount.toFixed(2)} {priceList.currency}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {errorMsg && <div className="text-sm mt-2 text-red-500 bg-red-50 p-2 rounded">{errorMsg}</div>}
        </div>
      </div>
    </div>
  )
}
