import * as React from "react";
import { toast as sonnerToast } from "sonner";

// Define custom toast variant type
type ToastVariant = "default" | "destructive" | "success" | "warning";

// Define props for the toast function
interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

// Custom useToast hook
export function useToast() {
  const [state, setState] = React.useState<{ toasts: { id: string; title: string; description?: string; variant?: ToastVariant }[] }>({ toasts: [] });

  // Handle toast dismissal
  const dismiss = (toastId?: string) => {
    setState((prev) => ({
      toasts: toastId ? prev.toasts.filter((t) => t.id !== toastId) : [],
    }));
  };

  // Toast function to display notifications
  const toast = ({ title, description, variant = "default", duration }: ToastProps) => {
    const id = Date.now().toString(); // Simple ID generation
    setState((prev) => ({
      toasts: [{ id, title, description, variant }, ...prev.toasts].slice(0, 1), // Limit to 1 toast
    }));

    // Apply Sonner styles based on variant
    switch (variant) {
      case "success":
        sonnerToast.success(title, { description, duration });
        break;
      case "warning":
        sonnerToast.warning(title, { description, duration, style: { backgroundColor: "#ffcc00", color: "#000" } });
        break;
      case "destructive":
        sonnerToast.error(title, { description, duration, style: { backgroundColor: "#f63535", color: "#fff" } });
        break;
      default:
        sonnerToast(title, { description, duration });
        break;
    }

    // Auto-dismiss after duration
    setTimeout(() => dismiss(id), duration || 5000);
  };

  return {
    toasts: state.toasts,
    toast,
    dismiss,
  };
}