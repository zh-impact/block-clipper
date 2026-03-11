/**
 * Toast Component
 * @description Toast notification with auto-dismiss
 */

import { type JSX } from "react";

export interface ToastProps {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
  onRemove?: (id: string) => void;
}

/**
 * Toast Component
 */
export function Toast({
  id,
  message,
  type = "info",
  onRemove,
}: ToastProps): JSX.Element {
  return (
    <div className={`toast ${type}`}>
      {type === "success" && "✓ "}
      {type === "error" && "✗ "}
      {message}
    </div>
  );
}

export interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type?: "success" | "error" | "info" }>;
  onRemove?: (id: string) => void;
}

/**
 * ToastContainer Component
 */
export function ToastContainer({
  toasts,
  onRemove,
}: ToastContainerProps): JSX.Element | null {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.type || "info"}`}
          onClick={() => onRemove?.(toast.id)}
        >
          {toast.type === "success" && "✓ "}
          {toast.type === "error" && "✗ "}
          {toast.message}
        </div>
      ))}
    </div>
  );
}
