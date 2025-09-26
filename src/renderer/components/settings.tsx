"use client"

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button"

// eslint-disable-next-line import/prefer-default-export
export function Settings() {
  const [dataDir, setDataDir] = useState<string>("")
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [okDisabled, setOkDisabled] = useState(false);


  useEffect(() => {
    // eslint-disable-next-line promise/catch-or-return
    window.electron.getFilePath()
      .then(data => setDataDir(data))
  }, [showWarningDialog]);

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (showWarningDialog) {
      setOkDisabled(true);

      const timer = setTimeout(() => {
        setOkDisabled(false);
      }, 5000); // 5000 мс = 5 сек

      // Чистим таймер при закрытии диалога или размонтировании
      return () => clearTimeout(timer);
    }
  }, [showWarningDialog]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Настройки</h2>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* File Storage Settings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Файловое хранилище</h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-2 flex-wrap">
              <div className="py-1 px-2 border-[1px] border-gray-200 rounded-sm text-gray-600 overflow-x-auto whitespace-nowrap -w-full">
                {dataDir}
              </div>
              <div className="flex gap-2 justify-end flex-wrap">
                <Button variant="outline" className="cursor-pointer" onClick={() => window.electron.openDataDir()}>
                  Открыть в проводнике
                </Button>
                <Button variant="outline" className="cursor-pointer" onClick={() => setShowWarningDialog(true)}>
                  Изменить папку сохранения
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Эта папка будет использоваться для сохранения планов лечения и данных, необходимых для работы приложения.
            </p>
          </div>
        </div>

        {/* Application Info */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Application Information</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Версия:</span>
              <span className="font-medium">v1.1.0</span>
            </div>
            <div className="flex justify-between">
              <span>Последние изменение:</span>
              <span className="font-medium">07.09.2025</span>
            </div>
            <div className="flex justify-between">
              <span>Разработал:</span>
              <span className="font-medium">u.kamisarau@gmail.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Dialog */}
      {showWarningDialog && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">⚠️ Warning</h3>
            <p className="text-sm text-gray-700 mb-6">
              Смена рабочей директории может привести к утрате всех текущих данных.
              Если вы хотите перенести данные в новую директорию, сначала выберите её, а затем скопируйте файлы из старой директории в новую с заменой.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="default" onClick={() => setShowWarningDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={ async () => {
                  await window.electron.changeDataDir();
                  setShowWarningDialog(false);
                }}
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
  )
}
