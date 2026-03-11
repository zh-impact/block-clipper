/**
 * LoadingSpinner Component
 * @description Loading spinner animation for async operations
 */

import { type JSX } from "react";

export interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

const SIZE_CLASSES = {
  small: "h-4 w-4 border-2",
  medium: "h-8 w-8 border-[3px]",
  large: "h-12 w-12 border-4",
};

/**
 * LoadingSpinner Component
 */
export function LoadingSpinner({
  size = "medium",
  className = "",
}: LoadingSpinnerProps): JSX.Element {
  return (
    <div
      className={`spinner ${SIZE_CLASSES[size]} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

export interface LoadingStateProps {
  message?: string;
  size?: "small" | "medium" | "large";
  className?: string;
}

/**
 * LoadingState Component
 */
export function LoadingState({
  message = "Loading...",
  size = "medium",
  className = "",
}: LoadingStateProps): JSX.Element {
  return (
    <div className={`loading-spinner ${className}`.trim()}>
      <LoadingSpinner size={size} />
      {message && <p>{message}</p>}
    </div>
  );
}
