import React, { useState } from "react";
import { ServiceSelector } from "@/components/service-selector";
import type { ExtendedServiceItem, PriceList, ServiceItem } from "@/lib/types";
import ServiceConfig from "@/components/service-config";



interface AddServicesProps{
  priceList: PriceList,
  setErrorMsg: React.Dispatch<React.SetStateAction<string | null>>;
  selectedServices: ExtendedServiceItem[];
  setSelectedServices: React.Dispatch<React.SetStateAction<ExtendedServiceItem[]>>;
  getNextOrderNumber: () => number
}

function AddServices({priceList, setErrorMsg, selectedServices, setSelectedServices, getNextOrderNumber}: AddServicesProps) {


  const [serviceModal, setServiceModal] = useState(false);
  const [pendingService, setPendingService] = useState<ServiceItem | ExtendedServiceItem | null>(
    null,
  );

  const addService = (service: ServiceItem) => {
    setErrorMsg(null);
    setServiceModal(true)
    setPendingService(service);
  };



  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Добавить услугу
      </h3>
      <ServiceSelector
        priceList={priceList}
        onServiceSelect={addService}
      />
      {
        serviceModal && pendingService &&
        <ServiceConfig selectedServices={selectedServices}
                        setSelectedServices={setSelectedServices}
                       setPendingService={setPendingService}
                       pendingService={pendingService}
                       getNextOrderNumber={getNextOrderNumber}
                       setServiceModal={setServiceModal}
        />
      }

    </div>
  );
}

export default AddServices;
