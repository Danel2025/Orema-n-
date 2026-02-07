import { useState, useEffect } from "react";

/**
 * Hook pour debouncer une valeur
 * Utile pour eviter trop d'appels API lors de la recherche
 *
 * @param value - Valeur a debouncer
 * @param delay - Delai en ms (default: 300ms)
 * @returns Valeur debouncee
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
