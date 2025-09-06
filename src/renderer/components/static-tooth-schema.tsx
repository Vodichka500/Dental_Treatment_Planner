import React from "react";
import { InvoiceItemService } from "@/lib/types";

interface StaticToothSchemaProps {
  services: InvoiceItemService[];
}

const dentalChart = {
  upperRight: ["18", "17", "16", "15", "14", "13", "12", "11"],
  upperLeft: ["21", "22", "23", "24", "25", "26", "27", "28"],
  lowerRight: ["48", "47", "46", "45", "44", "43", "42", "41"],
  lowerLeft: ["31", "32", "33", "34", "35", "36", "37", "38"],
};

const DEFAULT_COLOR = "#3b82f6"; // Tailwind blue-500

function StaticToothSchema({ services }: StaticToothSchemaProps) {
  const toothColorsMap: Record<string, string[]> = {};

  services.forEach((service) => {
    service.selectedTeeth?.forEach((tooth) => {
      if (!toothColorsMap[tooth]) {
        toothColorsMap[tooth] = [];
      }
      if(service.color){
        toothColorsMap[tooth].push(service.color);
      } else {
        toothColorsMap[tooth].push(DEFAULT_COLOR)
      }

    });
  });

  const getToothStyle = (tooth: string) => {
    const colors = toothColorsMap[tooth];
    if (!colors || colors.length === 0) {
      return {
        background: "#fff",
        color: "#374151",
        borderColor: "#d1d5db",
      };
    }

    if (colors.length === 1) {
      return {
        background: colors[0],
        color: "#fff",
        borderColor: colors[0],
      };
    }

    const step = 100 / colors.length;
    const gradient = colors
      .map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`)
      .join(", ");

    return {
      background: `linear-gradient(90deg, ${gradient})`,
      color: "#fff",
      borderColor: colors[0],
    };
  };

  const renderToothRow = (teeth: string[]) => (
    <div className="flex flex-nowrap gap-1 justify-center overflow-x-auto">
      {teeth.map((tooth) => {
        const style = getToothStyle(tooth);
        return (
          <div
            key={tooth}
            className="w-8 h-8 text-xs border rounded flex items-center justify-center"
            style={style}
          >
            {tooth}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-white border rounded-md  p-5">
      <table className="table-fixed border-collapse w-full text-center">
        <tbody>
        <tr>
          <td className="border-b border-r border-gray-300 p-2">
            {renderToothRow(dentalChart.upperRight)}
          </td>
          <td className="border-b border-l border-gray-300 p-2">
            {renderToothRow(dentalChart.upperLeft)}
          </td>
        </tr>
        <tr>
          <td className="border-t border-r border-gray-300 p-2">
            {renderToothRow(dentalChart.lowerRight)}
          </td>
          <td className="border-t border-l border-gray-300 p-2">
            {renderToothRow(dentalChart.lowerLeft)}
          </td>
        </tr>
        </tbody>
      </table>

    </div>
  );
}

export default StaticToothSchema;
