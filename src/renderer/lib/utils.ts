import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PriceList } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



export type FetchStatus = "idle" | "loading" | "success" | "error";

export async function fetchPriceList(
  onSuccess: (data: PriceList) => void,
  onError: (error: string) => void,
  setStatus: (status: FetchStatus) => void
) {
  setStatus("loading");

  try {
    const data = await window.electron.getPricelist();
    if (!data) throw new Error("Pricelist is empty or not found.");
    onSuccess(data);
    setStatus("success");
  } catch (err: any) {
    console.error("Failed to fetch pricelist:", err);
    onError(err.message || "Unknown error");
    setStatus("error");
  }
}
