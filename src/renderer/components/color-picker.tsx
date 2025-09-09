import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const presetColors = [
  // 🔴 Красные
  "#fee2e2", "#fca5a5", "#ef4444", "#dc2626", "#b91c1c", "#7f1d1d",
  // 🟠 Оранжевые
  "#ffedd5", "#fdba74", "#f97316", "#ea580c", "#c2410c", "#7c2d12",
  // 🟢 Зелёные
  "#dcfce7", "#86efac", "#22c55e", "#16a34a", "#15803d", "#14532d",
  // 🔵 Синие
  "#dbeafe", "#93c5fd", "#3b82f6", "#2563eb", "#1d4ed8", "#1e3a8a",
  // 🟣 Фиолетовые
  "#ede9fe", "#c4b5fd", "#8b5cf6", "#7c3aed", "#6d28d9", "#4c1d95",
  // 🟡 Жёлтые
  "#fef9c3", "#fde047", "#facc15", "#eab308", "#ca8a04", "#78350f",
];

interface ColorPickerProps {
  editColor: (color: string | null) => void;
}

function ColorPicker({ editColor }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (color: string | null) => {
    editColor(color);
    setOpen(false); // закрыть поповер
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-blue-600 cursor-pointer"
        >
          Установить цвет
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 grid grid-cols-6 gap-2">
        {presetColors.map((c) => (
          <button
            type="button"
            key={c}
            className="w-6 h-6 rounded-full border cursor-pointer"
            style={{ backgroundColor: c }}
            onClick={() => handleSelect(c)}
          />
        ))}
        <Button
          variant="outline"
          size="sm"
          className="col-span-6 cursor-pointer"
          onClick={() => handleSelect(null)}
        >
          Удалить цвет
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export default ColorPicker;
