"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PriceListTree } from "@/components/price-list-tree";
import { PriceList } from "@/lib/types";
import { fetchPriceList, FetchStatus } from "@/lib/utils";
import ImportPricelist from './import-pricelist';

export function PriceListEditor() {
  const [priceList, setPriceList] = useState<PriceList | null>();
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [jsonInput, setJsonInput] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [okDisabled, setOkDisabled] = useState(true);

  useEffect(() => {
    fetchPriceList(setPriceList, setFetchError, setFetchStatus);
  }, []);

  const handleExportJson = () => {
    if (!priceList) return;
    const jsonString = JSON.stringify(priceList, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pricelist.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async () => {
    setImportMessage(null);

    try {
      const parsed = JSON.parse(jsonInput);

      if (!parsed.currency || !parsed.pricelist) {
        setImportMessage("Invalid JSON format");
        return;
      }

      await window.electron.savePricelist(parsed);
      setPriceList(parsed);

      setJsonInput("");
      setShowImportDialog(false);
      setShowWarningDialog(false);
      setImportMessage("Price list imported successfully!");
    } catch (err: any) {
      setImportMessage(`Invalid JSON. Error: ${err.message || err}`);
    }
  };

  const updatePriceList = async (newPr: PriceList["pricelist"]) => {
    if (!priceList) return;
    await window.electron.savePricelist({ ...priceList, pricelist: newPr });
    setPriceList({ ...priceList, pricelist: newPr });
  };

  const openWarningDialog = () => {
    setShowWarningDialog(true);
    setOkDisabled(true);
    setTimeout(() => setOkDisabled(false), 5000); // кнопка OK доступна через 5 секунд
  };

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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Price List Editor</h2>
        <div className="flex gap-2">
          <Button variant="default" onClick={openWarningDialog}>
            Import JSON
          </Button>
          <Button onClick={handleExportJson} className="bg-blue-600 hover:bg-blue-700">
            Export JSON
          </Button>
        </div>
      </div>

      {/* Currency Setting */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Currency</h3>
        <div className="flex items-center gap-4">
          <Input
            type="text"
            value={priceList.currency}
            onChange={(e) =>
              setPriceList({ ...priceList, currency: e.target.value })
            }
            className="w-32"
            placeholder="BYN"
          />
          <span className="text-sm text-gray-500">Current currency for all prices</span>
        </div>
      </div>

      {/* Price List Tree */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Services & Prices</h3>
        <PriceListTree
          priceList={priceList.pricelist}
          onUpdate={updatePriceList}
          currency={priceList.currency}
        />
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Import JSON</h3>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste your JSON here..."
              className="w-full h-48 p-3 border border-gray-300 rounded-md resize-none font-mono text-sm"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="default" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleImportJson}
                disabled={okDisabled}
                className={`bg-blue-600 hover:bg-blue-700 ${okDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Import
              </Button>
            </div>
            {importMessage && (
              <p
                className={`text-sm mt-2 ${
                  importMessage.includes("successfully") ? "text-green-500" : "text-red-500"
                }`}
              >
                {importMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Warning Dialog */}
      {showWarningDialog && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Warning</h3>
            <p className="text-sm text-gray-700 mb-6">
              Importing a new JSON will <strong>overwrite your current price list</strong>.
              Make sure to{" "}
              <span className="underline font-extrabold cursor-pointer" onClick={handleExportJson}>export</span>
              {" "}your current price list first!
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="default" onClick={() => setShowWarningDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => { setShowImportDialog(true); setShowWarningDialog(false); }}
                disabled={okDisabled}
                className={`bg-red-600 hover:bg-red-700 ${okDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {`OK${  okDisabled ? " (wait 5 sek)" : ""}` }
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
