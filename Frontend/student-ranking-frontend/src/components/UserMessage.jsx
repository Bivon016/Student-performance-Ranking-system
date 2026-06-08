import React, { useEffect } from "react";
import { Info, CheckCircle, AlertTriangle, X } from "lucide-react";
import { getFriendlyError } from "../utils/errorMessages";

const VARIANTS = {
  error: {
    wrap: "bg-amber-50 border-amber-200 text-amber-950",
    icon: Info,
  },
  success: {
    wrap: "bg-emerald-50 border-emerald-200 text-emerald-900",
    icon: CheckCircle,
  },
  warning: {
    wrap: "bg-amber-50 border-amber-200 text-amber-950",
    icon: AlertTriangle,
  },
  info: {
    wrap: "bg-sky-50 border-sky-200 text-sky-900",
    icon: Info,
  },
};

export function UserMessage({
  type = "error",
  message,
  title,
  onDismiss,
  onRetry,
  className = "",
}) {
  if (!message) return null;

  const variant = VARIANTS[type] || VARIANTS.error;
  const Icon = variant.icon;
  const text = getFriendlyError(message);

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${variant.wrap} ${className}`}
    >
      <Icon size={18} className="shrink-0 mt-0.5 opacity-75" aria-hidden />
      <div className="flex-1 min-w-0">
        {title ? <p className="font-medium mb-0.5">{title}</p> : null}
        <p className={title ? "opacity-90" : undefined}>{text}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 text-xs font-medium underline underline-offset-2 opacity-80 hover:opacity-100"
        >
          Try again
        </button>
      ) : null}
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}

export function Toast({ message, type = "error", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  const isSuccess = type === "success";
  const wrap = isSuccess
    ? "bg-emerald-600 text-white"
    : "bg-slate-800 text-white";

  return (
    <div
      role="status"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm ${wrap}`}
    >
      {isSuccess ? <CheckCircle size={16} /> : <Info size={16} />}
      <span className="flex-1">{getFriendlyError(message)}</span>
      <button
        type="button"
        onClick={onClose}
        className="opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
