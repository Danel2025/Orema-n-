"use client";

import { useEffect, useCallback, useRef } from "react";

/**
 * Configuration des callbacks pour les raccourcis clavier du plan de salle
 */
export interface FloorPlanKeyboardCallbacks {
  /** Supprimer l'element selectionne (Delete/Backspace) */
  onDelete?: () => void;
  /** Dupliquer l'element selectionne (Ctrl/Cmd+D) */
  onDuplicate?: () => void;
  /** Copier l'element selectionne (Ctrl/Cmd+C) */
  onCopy?: () => void;
  /** Coller l'element copie (Ctrl/Cmd+V) */
  onPaste?: () => void;
  /** Annuler la derniere action (Ctrl/Cmd+Z) */
  onUndo?: () => void;
  /** Refaire la derniere action annulee (Ctrl/Cmd+Y ou Ctrl/Cmd+Shift+Z) */
  onRedo?: () => void;
  /** Deselectionner / Quitter le mode edition (Escape) */
  onEscape?: () => void;
  /** Deplacer l'element (fleches, deltaX et deltaY en pixels) */
  onMove?: (deltaX: number, deltaY: number) => void;
  /** Rotation de l'element (+90 degres avec R) */
  onRotate?: (degrees: number) => void;
}

/**
 * Options pour le hook useFloorPlanKeyboard
 */
export interface UseFloorPlanKeyboardOptions {
  /** Si true, les raccourcis sont actifs */
  enabled?: boolean;
  /** Pas de deplacement normal en pixels (defaut: 1) */
  moveStep?: number;
  /** Pas de deplacement rapide en pixels avec Shift (defaut: 10) */
  fastMoveStep?: number;
  /** Angle de rotation en degres (defaut: 90) */
  rotationAngle?: number;
}

/**
 * Hook pour gerer les raccourcis clavier du plan de salle
 *
 * @param callbacks - Fonctions de callback pour chaque action
 * @param options - Options de configuration
 *
 * @example
 * ```tsx
 * useFloorPlanKeyboard({
 *   onDelete: () => deleteSelectedElement(),
 *   onDuplicate: () => duplicateSelectedElement(),
 *   onMove: (dx, dy) => moveSelectedElement(dx, dy),
 *   onRotate: (degrees) => rotateSelectedElement(degrees),
 * }, { enabled: isEditMode });
 * ```
 */
export function useFloorPlanKeyboard(
  callbacks: FloorPlanKeyboardCallbacks,
  options: UseFloorPlanKeyboardOptions = {}
): void {
  const {
    enabled = true,
    moveStep = 1,
    fastMoveStep = 10,
    rotationAngle = 90,
  } = options;

  // Utiliser useRef pour eviter les problemes de closure avec les callbacks
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ne pas intercepter si focus sur un input/textarea/select
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;

      // Supprimer (Delete/Backspace)
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        callbacksRef.current.onDelete?.();
        return;
      }

      // Escape - Deselectionner / Quitter mode edition
      if (event.key === "Escape") {
        event.preventDefault();
        callbacksRef.current.onEscape?.();
        return;
      }

      // Rotation (R)
      if (event.key === "r" || event.key === "R") {
        // Ne pas activer si un modificateur est presse (sauf Shift pour rotation inverse potentielle)
        if (!modifierKey && !event.altKey) {
          event.preventDefault();
          callbacksRef.current.onRotate?.(rotationAngle);
          return;
        }
      }

      // Raccourcis avec Ctrl/Cmd
      if (modifierKey) {
        // Dupliquer (Ctrl/Cmd+D)
        if (event.key === "d" || event.key === "D") {
          event.preventDefault();
          callbacksRef.current.onDuplicate?.();
          return;
        }

        // Copier (Ctrl/Cmd+C)
        if (event.key === "c" || event.key === "C") {
          event.preventDefault();
          callbacksRef.current.onCopy?.();
          return;
        }

        // Coller (Ctrl/Cmd+V)
        if (event.key === "v" || event.key === "V") {
          event.preventDefault();
          callbacksRef.current.onPaste?.();
          return;
        }

        // Undo (Ctrl/Cmd+Z sans Shift)
        if ((event.key === "z" || event.key === "Z") && !event.shiftKey) {
          event.preventDefault();
          callbacksRef.current.onUndo?.();
          return;
        }

        // Redo (Ctrl/Cmd+Y ou Ctrl/Cmd+Shift+Z)
        if (event.key === "y" || event.key === "Y") {
          event.preventDefault();
          callbacksRef.current.onRedo?.();
          return;
        }

        if ((event.key === "z" || event.key === "Z") && event.shiftKey) {
          event.preventDefault();
          callbacksRef.current.onRedo?.();
          return;
        }
      }

      // Fleches pour deplacer l'element
      const step = event.shiftKey ? fastMoveStep : moveStep;

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          callbacksRef.current.onMove?.(0, -step);
          break;
        case "ArrowDown":
          event.preventDefault();
          callbacksRef.current.onMove?.(0, step);
          break;
        case "ArrowLeft":
          event.preventDefault();
          callbacksRef.current.onMove?.(-step, 0);
          break;
        case "ArrowRight":
          event.preventDefault();
          callbacksRef.current.onMove?.(step, 0);
          break;
      }
    },
    [moveStep, fastMoveStep, rotationAngle]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

export default useFloorPlanKeyboard;
