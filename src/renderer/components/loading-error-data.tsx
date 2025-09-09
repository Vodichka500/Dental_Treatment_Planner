import React from 'react';
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

interface LoadingErrorDataProrps{
  isLoading: boolean,
  message: string
}

const LoadingErrorData = ({isLoading, message}: LoadingErrorDataProrps) => {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-center h-64">
        <div className={clsx("text-lg flex gap-3", !isLoading && "text-red-500" )}>
          {isLoading &&  <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />}
          {message}
        </div>
      </div>
    </div>
  );
};

export default LoadingErrorData;
