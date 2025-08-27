import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

function ImportPricelist() {

  const [jsonInput, setJsonInput] = useState("");
  const [importMessage, setImportMessage] = useState<string | null>(null);


  const handleImportJson = async () => {
    setImportMessage(null);

    try {
      const parsed = JSON.parse(jsonInput);

      if (!parsed.currency || !parsed.pricelist) {
        setImportMessage("Invalid JSON format");
        return;
      }

      await window.electron.savePricelist(parsed);

      setJsonInput("");
      setImportMessage("Price list imported successfully!");
    } catch (err: any) {
      setImportMessage(`Invalid JSON. Error: ${err.message || err}`);
    }
  };

  return (
    <div className="bg-white  rounded-lg max-w-2xl w-full max-h-96 overflow-auto">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Import Pricelist (JSON)</h3>
      <textarea
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
        placeholder="Paste your JSON here..."
        className="w-full h-48 p-3 border border-gray-300 rounded-md resize-none font-mono text-sm"
      />
      <div className="flex justify-end gap-2 mt-4">
        <Button
          onClick={handleImportJson}
          className="bg-blue-600 hover:bg-blue-700"
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
  );
}

export default ImportPricelist;
