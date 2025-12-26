import { ReactNode } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { toast } from "sonner";

interface SimulationGuardProps {
  children: ReactNode;
  /** If true, the action is blocked in readonly mode */
  blockInReadonly?: boolean;
  /** Custom message to show when action is blocked */
  blockedMessage?: string;
  /** Callback to use instead of blocking. Use this for custom handling. */
  onBlocked?: () => void;
}

/**
 * Wrapper component that blocks actions during readonly simulation mode.
 * Wrap buttons or interactive elements that should be disabled during readonly simulation.
 * 
 * @example
 * <SimulationGuard blockInReadonly>
 *   <Button onClick={handleCreate}>Crear Sorteo</Button>
 * </SimulationGuard>
 */
export function SimulationGuard({
  children,
  blockInReadonly = true,
  blockedMessage = "Modo solo lectura - No se pueden realizar cambios",
  onBlocked,
}: SimulationGuardProps) {
  const { isSimulating, mode, canPerformAction } = useSimulation();

  const shouldBlock = isSimulating && mode === "readonly" && blockInReadonly;

  if (!shouldBlock) {
    return <>{children}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onBlocked) {
      onBlocked();
    } else {
      toast.info(blockedMessage, {
        icon: "👁️",
        duration: 3000,
      });
    }
  };

  return (
    <div onClick={handleClick} className="cursor-not-allowed">
      <div className="pointer-events-none opacity-60">{children}</div>
    </div>
  );
}

/**
 * Hook to check if an action can be performed.
 * Returns a function that either executes the action or shows a toast.
 */
export function useSimulationAction() {
  const { isSimulating, mode, canPerformAction } = useSimulation();

  const guardedAction = <T extends any[], R>(
    action: (...args: T) => R,
    options?: { message?: string }
  ) => {
    return (...args: T): R | void => {
      if (!canPerformAction()) {
        toast.info(options?.message || "Modo solo lectura - No se pueden realizar cambios", {
          icon: "👁️",
          duration: 3000,
        });
        return;
      }
      return action(...args);
    };
  };

  return {
    isBlocked: isSimulating && mode === "readonly",
    canPerformAction,
    guardedAction,
  };
}
