"use client";

/**
 * Hooks React pour l'impression
 *
 * Ces hooks facilitent l'integration de l'impression dans les composants React.
 */

import { useState, useCallback } from "react";
import type { PrintResult } from "./types";

/**
 * Options pour le hook d'impression
 */
interface UsePrintOptions {
  /** Callback apres impression reussie */
  onSuccess?: (result: PrintResult) => void;
  /** Callback apres erreur */
  onError?: (error: string) => void;
}

/**
 * Types de documents imprimables
 */
type PrintDocType = "ticket" | "cuisine" | "bar" | "rapport-z" | "test";

/**
 * Hook pour imprimer un document
 */
export function usePrint(options: UsePrintOptions = {}) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastResult, setLastResult] = useState<PrintResult | null>(null);

  const print = useCallback(
    async (
      type: PrintDocType,
      data: {
        venteId?: string;
        sessionId?: string;
        printerId?: string;
      } = {}
    ) => {
      setIsPrinting(true);
      setLastResult(null);

      try {
        const response = await fetch("/api/print", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type,
            venteId: data.venteId,
            sessionId: data.sessionId,
            printerId: data.printerId,
          }),
        });

        const result: PrintResult = await response.json();
        setLastResult(result);

        if (result.success) {
          options.onSuccess?.(result);
        } else {
          options.onError?.(result.error || "Erreur d'impression");
        }

        return result;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Erreur de communication";
        const result: PrintResult = {
          success: false,
          error: errorMsg,
        };
        setLastResult(result);
        options.onError?.(errorMsg);
        return result;
      } finally {
        setIsPrinting(false);
      }
    },
    [options]
  );

  const printTicket = useCallback(
    (venteId: string, printerId?: string) => {
      return print("ticket", { venteId, printerId });
    },
    [print]
  );

  const printKitchen = useCallback(
    (venteId: string, printerId?: string) => {
      return print("cuisine", { venteId, printerId });
    },
    [print]
  );

  const printBar = useCallback(
    (venteId: string, printerId?: string) => {
      return print("bar", { venteId, printerId });
    },
    [print]
  );

  const printRapportZ = useCallback(
    (sessionId: string, printerId?: string) => {
      return print("rapport-z", { sessionId, printerId });
    },
    [print]
  );

  const printTest = useCallback(
    (printerId?: string) => {
      return print("test", { printerId });
    },
    [print]
  );

  return {
    isPrinting,
    lastResult,
    print,
    printTicket,
    printKitchen,
    printBar,
    printRapportZ,
    printTest,
  };
}

/**
 * Options pour le routage automatique
 */
interface UseAutoPrintOptions {
  /** Imprimer le ticket client (defaut: true) */
  printTicket?: boolean;
  /** Imprimer le bon cuisine (defaut: true) */
  printKitchen?: boolean;
  /** Imprimer le bon bar (defaut: true) */
  printBar?: boolean;
  /** Callback apres impression reussie */
  onSuccess?: () => void;
  /** Callback apres erreur */
  onError?: (errors: string[]) => void;
}

/**
 * Resultat du routage automatique
 */
interface AutoPrintResult {
  success: boolean;
  partialSuccess?: boolean;
  results: {
    ticket?: PrintResult;
    kitchen?: PrintResult;
    bar?: PrintResult;
  };
  errors: string[];
}

/**
 * Hook pour imprimer automatiquement une vente
 * Route automatiquement vers les bonnes imprimantes
 */
export function useAutoPrint(options: UseAutoPrintOptions = {}) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastResult, setLastResult] = useState<AutoPrintResult | null>(null);

  const autoPrint = useCallback(
    async (venteId: string, urgent: boolean = false) => {
      setIsPrinting(true);
      setLastResult(null);

      try {
        const response = await fetch("/api/print/auto-route", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            venteId,
            printTicket: options.printTicket ?? true,
            printKitchen: options.printKitchen ?? true,
            printBar: options.printBar ?? true,
            urgent,
          }),
        });

        const result: AutoPrintResult = await response.json();
        setLastResult(result);

        if (result.success || result.partialSuccess) {
          options.onSuccess?.();
        }

        if (result.errors.length > 0) {
          options.onError?.(result.errors);
        }

        return result;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Erreur de communication";
        const result: AutoPrintResult = {
          success: false,
          results: {},
          errors: [errorMsg],
        };
        setLastResult(result);
        options.onError?.([errorMsg]);
        return result;
      } finally {
        setIsPrinting(false);
      }
    },
    [options]
  );

  return {
    isPrinting,
    lastResult,
    autoPrint,
  };
}

/**
 * Hook pour tester une imprimante
 */
export function usePrinterTest() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<PrintResult | null>(null);

  const testPrinter = useCallback(async (printerId?: string) => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/print", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "test",
          printerId,
        }),
      });

      const result: PrintResult = await response.json();
      setTestResult(result);
      return result;
    } catch (error) {
      const result: PrintResult = {
        success: false,
        error: error instanceof Error ? error.message : "Erreur de test",
      };
      setTestResult(result);
      return result;
    } finally {
      setIsTesting(false);
    }
  }, []);

  return {
    isTesting,
    testResult,
    testPrinter,
  };
}
