/**
 * IconButton Component
 * @description Icon-only button component
 */

import { type JSX } from "react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "small" | "medium" | "large";
}

const SIZE_CLASSES = {
  small: "h-[26px] w-[26px]",
  medium: "h-[30px] w-[30px]",
  large: "h-[36px] w-[36px]",
};

/**
 * IconButton Component
 */
export function IconButton({
  icon,
  label,
  variant = "secondary",
  size = "medium",
  className = "",
  ...props
}: IconButtonProps): JSX.Element {
  const baseClasses = "inline-flex items-center justify-center rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClasses = {
    primary: "border-blue-600 bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-blue-500",
    secondary: "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus:ring-slate-500",
    danger: "border-red-600 bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500",
    ghost: "border-transparent bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-500",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${SIZE_CLASSES[size]} ${className}`.trim()}
      aria-label={label}
      title={label}
      {...props}
    >
      {icon}
    </button>
  );
}
