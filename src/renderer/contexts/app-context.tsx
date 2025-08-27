"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { PriceList } from "@/lib/types";

export interface Invoice {
  id: string
  patientName: string
  date: string
  totalAmount: number
  services: ServiceItem[]
}

export interface ServiceItem {
  id: string
  path: string[] // Store the full path to the service
  name: string // Store the service name
  price: number
}



export interface AppSettings {
  defaultSaveFolder: string
  currency: string
}

interface AppContextType {
  invoices: Invoice[]
  addInvoice: (invoice: Invoice) => void
  priceList: PriceList
  setPriceList: (priceList: PriceList) => void
  settings: AppSettings
  updateSettings: (settings: Partial<AppSettings>) => void
}

export const defaultPriceList: PriceList = {
  currency: "BYN",
  pricelist: {
    Протезирование: {
      name: "Протезирование",
      children: {
        "6-й зуб": {
          name: "6-й зуб",
          children: {
            Металлический: { name: "Металлический", price: 150 },
            Керамический: { name: "Керамический", price: 300 },
          },
        },
        "7-й зуб": {
          name: "7-й зуб",
          children: {
            Металлический: { name: "Металлический", price: 150 },
            Керамический: { name: "Керамический", price: 300 },
          },
        },
      },
    },
    Хирургия: {
      name: "Хирургия",
      children: {
        Удаление: { name: "Удаление", price: 80 },
      },
    },
  },
}

const defaultSettings: AppSettings = {
  defaultSaveFolder: "/Documents/Invoices",
  currency: "BYN",
}

// Generate dummy invoices
const generateDummyInvoices = (): Invoice[] => {
  const patients = [
    "Иванов И.И.",
    "Петров П.П.",
    "Сидоров С.С.",
    "Козлов К.К.",
    "Морозов М.М.",
    "Волков В.В.",
    "Соколов С.С.",
    "Лебедев Л.Л.",
    "Попов П.П.",
    "Новиков Н.Н.",
    "Федоров Ф.Ф.",
    "Михайлов М.М.",
  ]

  return patients.map((patient, index) => ({
    id: `inv-${index + 1}`,
    patientName: patient,
    date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
      .toISOString()
      .split("T")[0],
    totalAmount: Math.floor(Math.random() * 500) + 100,
    services: [
      {
        id: `service-${index + 1}`,
        path: ["Протезирование", "6-й зуб", "Керамический"],
        name: "Керамический",
        price: 300,
      },
    ],
  }))
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(generateDummyInvoices())
  const [priceList, setPriceList] = useState<PriceList>(defaultPriceList)
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)

  const addInvoice = (invoice: Invoice) => {
    setInvoices((prev) => [...prev, invoice])
  }

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  return (
    <AppContext.Provider
      value={{
        invoices,
        addInvoice,
        priceList,
        setPriceList,
        settings,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
