"use client"

import { useEffect, useState } from "react"
import type { ServiceItem } from "@/contexts/app-context"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ServiceSelector } from "@/components/service-selector"
import { clsx } from "clsx"
import { fetchPriceList, type FetchStatus } from "@/lib/utils"
import type { PriceList, Doctor, Invoice } from "@/lib/types";
import ImportPricelist from "@/components/import-pricelist"
import { generateInvoiceWord } from "@/lib/generate-word";

interface ExtendedServiceItem extends ServiceItem {
  quantity: number
  selectedTeeth: string[]
  linkedToTeeth: boolean
  comment?: string
}

const dentalChart = {
  upperRight: ["18", "17", "16", "15", "14", "13", "12", "11"],
  upperLeft: ["21", "22", "23", "24", "25", "26", "27", "28"],
  lowerRight: ["48", "47", "46", "45", "44", "43", "42", "41"],
  lowerLeft: ["31", "32", "33", "34", "35", "36", "37", "38"],
}

// eslint-disable-next-line import/prefer-default-export
export function CreateInvoice() {
  const [priceList, setPriceList] = useState<PriceList | null>()
  const [doctors, setDoctors ] = useState<Doctor[] | null>()
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle")
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [patientName, setPatientName] = useState("")
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [date, setDate] = useState<Date>(new Date())
  const [selectedServices, setSelectedServices] = useState<ExtendedServiceItem[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [modal, setModal] = useState<{status: "hidden" | "error" | "success", filename?: string | null, errorMsg?: string}>({status: "hidden"})

  const [serviceModal, setServiceModal] = useState(false)
  const [pendingService, setPendingService] = useState<ServiceItem | null>(null)
  const [serviceQuantity, setServiceQuantity] = useState(1)
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([])
  const [linkedToTeeth, setLinkedToTeeth] = useState(true)
  const [serviceComment, setServiceComment] = useState("")

  useEffect(() => {
    fetchPriceList(setPriceList, setFetchError, setFetchStatus)
    window.electron.getDoctors()
      .then(data => setDoctors(data))
      .catch((e) => console.error(e))
  }, [])

  async function addInvoice(newInvoice: Invoice) {
    try {
      const bufferedInvoice = await generateInvoiceWord(newInvoice)
      const filename = `${newInvoice.patientName}-${newInvoice.date.toISOString()}.docx`
      await window.electron.saveInvoice({filename, bufferedInvoice})
      return filename
    } catch (e) {
      console.log(e)
      return null
    }
  }


  const addService = (service: ServiceItem) => {
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
      if (prev.includes(tooth)) {
        return prev.filter((t) => t !== tooth)
      }

      const newTeeth = [...prev, tooth]
      // Auto-update quantity based on selected teeth
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

  const handleGenerateInvoice = async () => {
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

    const newInvoice = {
      id: `inv-${Date.now()}`,
      patientName: patientName.trim(),
      selectedDoctor,
      date,
      totalAmount,
      services: selectedServices,
    };

    const addToInvoiceList = async (filename: string) => {
      const currentInvoices = (await window.electron.getInvoicesList()) || [];
      currentInvoices.push({
        id: newInvoice.id,
        patient: newInvoice.patientName,
        filename,
        date,
        totalAmount,
      });
      await window.electron.saveInvoicesList(currentInvoices);
    };

    try {
      const filename = await addInvoice(newInvoice);
      setModal({ status: "success", filename });
      if (filename) await addToInvoiceList(filename);
    } catch (error) {
      const formattedError = error instanceof Error ? error.message : String(error);
      setModal({ status: "error", errorMsg: formattedError });
    } finally {
      setPatientName("");
      setSelectedDoctor(null);
      setDate(new Date());
      setSelectedServices([]);
    }
  };


  const handleOpenFile = async (filename: string | null | undefined) => {
    // Add your file opening logic here
    console.log(`Opening file...${  filename}`)
    if (filename){
      await window.electron.openInvoice({filename})
    }
    setModal({ status: "hidden" })
  }

  if (fetchStatus === "loading" || fetchStatus === "idle") {
    return <div>Loading pricelist...</div>
  }

  if (fetchStatus === "error") {
    return (
      <div className="flex flex-col">
        <div className="text-red-500">Error: {fetchError}</div>
        <ImportPricelist />
      </div>
    )
  }

  if (!priceList) {
    return <div>No pricelist available.</div>
  }

  if (!doctors || doctors.length === 0) {
    return <div>There is no doctors available. Add at least on in &quot;Doctors&quot; section</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Create Invoice</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <Input type="date" value={date.toISOString().split("T")[0]} onChange={(e) => setDate(new Date(e.target.value))} className="w-full" />
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
                            <div className="flex flex-wrap gap-1 justify-center">
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
                            <div className="flex flex-wrap gap-1 justify-center">
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
                            <div className="flex flex-wrap gap-1 justify-center">
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
                            <div className="flex flex-wrap gap-1 justify-center">
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
                    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comment (Optional)</label>
                    <Input
                      type="text"
                      placeholder="Add any notes or comments..."
                      value={serviceComment}
                      onChange={(e) => setServiceComment(e.target.value)}
                      className="w-full"
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

          {/* Generate Invoice Button */}
          <div className="flex gap-4">
            <Button
              onClick={handleGenerateInvoice}
              className={clsx(
                "flex-1 bg-blue-600 hover:bg-blue-700 cursor-pointer",
                (!patientName.trim() || !selectedDoctor || selectedServices.length === 0) && "bg-gray-300",
              )}
            >
              Generate PDF
            </Button>
          </div>
          {errorMsg && <div className="text-sm mt-2 text-red-500 bg-red-50 p-2 rounded">{errorMsg}</div>}
        </div>
      </div>
      {(modal.status === "success" || modal.status === "error") && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          {
            modal.status === "success" ? (
              <div className="bg-white rounded-lg shadow-lg border p-6 max-w-sm w-full mx-4 text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Success</h3>
                <p className="text-gray-600 text-sm mb-6">File ready</p>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm" onClick={() => handleOpenFile(modal.filename)}>
                      Open File
                    </Button>
                    <Button
                      variant="outline"
                      className="text-sm bg-transparent"
                      onClick={() => setModal({ status: "hidden" })}
                    >
                      Close
                    </Button>
                  </div>

                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg border p-6 max-w-sm w-full mx-4 text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Error</h3>
                <p className="text-red-600 text-sm mb-2">{modal.errorMsg || "Something went wrong"}</p>
                <p className="text-gray-600 text-sm mb-6">Please try again</p>
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-sm"
                  onClick={() => setModal({ status: "hidden" })}
                >
                  Try Again
                </Button>
              </div>
            )
          }
        </div>
      )}
    </div>
  )
}



