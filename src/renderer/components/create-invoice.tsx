import { useEffect, useState } from "react";
import { useApp, type ServiceItem } from "@/contexts/app-context"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ServiceSelector } from "@/components/service-selector"
import { clsx } from "clsx";
import { fetchPriceList, FetchStatus } from "@/lib/utils";
import { PriceList } from "@/lib/types";
import ImportPricelist from "@/components/import-pricelist";

function addInvoice(newInvoice: {
  id: string;
  patientName: string;
  date: string;
  totalAmount: number;
  services: ServiceItem[]
}) {
  console.log(newInvoice)
}

// eslint-disable-next-line import/prefer-default-export
export function CreateInvoice() {
  // const { addInvoice, priceList } = useApp()
  const [priceList, setPriceList] = useState<PriceList | null>();
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [patientName, setPatientName] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [modal, setModal] = useState(false)

  useEffect(() => {
    fetchPriceList(setPriceList, setFetchError, setFetchStatus);
  }, []);

  const addService = (service: ServiceItem) => {
    setErrorMsg(null)
    setSelectedServices((prev) => [...prev, { ...service, id: `service-${Date.now()}-${Math.random()}` }])
  }

  const removeService = (serviceId: string) => {
    setErrorMsg(null)
    setSelectedServices((prev) => prev.filter((service) => service.id !== serviceId))
  }

  const totalAmount = selectedServices.reduce((sum, service) => sum + service.price, 0)

  const handleGenerateInvoice = () => {
    if (!patientName.trim()) {
      setErrorMsg("Please enter patient name")
      return
    }

    if (selectedServices.length === 0) {
      setErrorMsg("Please select at least one service")
      return
    }

    const newInvoice = {
      id: `inv-${Date.now()}`,
      patientName: patientName.trim(),
      date,
      totalAmount,
      services: selectedServices,
    }

    addInvoice(newInvoice)

    // Reset form
    setPatientName("")
    setDate(new Date().toISOString().split("T")[0])
    setSelectedServices([])

    setModal(true)
  }

  if (fetchStatus === "loading" || fetchStatus === "idle") {
    return <div>Loading pricelist...</div>;
  }

  if (fetchStatus === "error") {
    return (
      <div className="flex flex-col">
        <div className="text-red-500">Error: {fetchError}</div>
        <ImportPricelist/>
      </div>
    );
  }

  if (!priceList) {
    return <div>No pricelist available.</div>;
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
                  onChange={(e) => {setPatientName(e.target.value); setErrorMsg(null)}}
                  className="w-full"
                />
              </div>
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" />
              </div>
            </div>
          </div>

          {/* Service Selector */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Services</h3>
            <ServiceSelector priceList={priceList} onServiceSelect={addService} />
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
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">
                          {service.price.toFixed(2)} {priceList.currency}
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
              className={clsx("flex-1 bg-blue-600 hover:bg-blue-700 cursor-pointer", (!patientName.trim() || selectedServices.length === 0)&&"bg-gray-300")}
            >
              Generate PDF
            </Button>
          </div>
          {errorMsg ?? (<div className="text-sm mt-2 bg-red-500">{errorMsg}</div>)}
        </div>
      </div>
      {modal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm text-center">
            <p className="text-xl font-semibold mb-4">Invoice generated successfully</p>
            <Button
              className="w-full bg-green-500 hover:bg-green-700 text-black py-2 rounded-lg"
              onClick={() => setModal(false)}
            >
              Ok
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
