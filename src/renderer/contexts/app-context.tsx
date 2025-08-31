"use client"

import { Doctor, PriceList } from "@/lib/types";


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

export const defaultDoctors: Doctor[] = [
  {
    id: "1",
    name: "John Smith",
    specialization: "General Dentistry"
  },
  {
    id: "2",
    name: "Emily Brown",
    specialization: "Orthodontics"
  },
];



