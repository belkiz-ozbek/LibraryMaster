import { useCallback, useState } from "react";

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      const timer = setTimeout(() => {
        callback(...args);
      }, delay);
      
      setDebounceTimer(timer);
    },
    [callback, delay, debounceTimer]
  ) as T;

  return debouncedCallback;
}
