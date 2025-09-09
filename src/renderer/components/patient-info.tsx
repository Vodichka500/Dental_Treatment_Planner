import React from "react";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Doctor } from "@/lib/types";

interface PatientInfoProps{
  patientName: string;
  setPatientName: React.Dispatch<React.SetStateAction<string>>;
  setErrorMsg: React.Dispatch<React.SetStateAction<string | null>>;
  doctors: Doctor[];
  selectedDoctor: Doctor | null;
  setSelectedDoctor: React.Dispatch<React.SetStateAction<Doctor | null>>;
  date: Date;
  setDate: React.Dispatch<React.SetStateAction<Date>>;
}


function PatientInfo({
                       patientName,
                       setPatientName,
                       setErrorMsg,
                       doctors,
                       selectedDoctor,
                       setSelectedDoctor,
                       date,
                       setDate,
                     }: PatientInfoProps) {
  return (

    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Информация о пациенте
      </h3>
      <div className="flex gap-3 items-center flex-wrap">
        <div>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Имя пациента
          </label>
          <Input
            type="text"
            placeholder="Введите имя пациента..."
            value={patientName}
            onChange={(e) => {
              setPatientName(e.target.value);
              setErrorMsg(null);
            }}
            className="w-full"
          />
        </div>

        <div>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label
            htmlFor="doctor-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Доктор
          </label>

          <Select
            value={selectedDoctor?.id || ''}
            onValueChange={(value) => {
              const doctor = doctors.find((d) => d.id === value) || null;
              setSelectedDoctor(doctor);
              setErrorMsg(null);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите доктора..." />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.specialization}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Дата
          </label>
          <Input
            type="date"
            value={date.toISOString().split('T')[0]}
            onChange={(e) => setDate(new Date(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

export default PatientInfo;
