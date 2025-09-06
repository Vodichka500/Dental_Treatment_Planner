import { useState, useCallback } from "react";

type Status = "idle" | "loading" | "success" | "error";

function useAsync<T>(asyncFn: (...args: any[]) => Promise<T>) {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<any>(null);

  const execute = useCallback(async (...args: any[]) => {
    setStatus("loading");
    setError(null);
    try {
      const result = await asyncFn(...args);
      setData(result);
      setStatus("success");
      return result;
    } catch (err) {
      setError(err);
      setStatus("error");
      throw err;
    }
  }, [asyncFn]);

  return { execute, status, data, error, isLoading: status === "loading" };
}
export default useAsync
