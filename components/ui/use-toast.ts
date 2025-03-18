// Adapted from shadcn/ui (https://ui.shadcn.com/docs/components/toast)
import { toast as toastOriginal, useToast as useToastOriginal } from "@/components/ui/toast";

// Re-export the useToast hook and toast function
export const useToast = useToastOriginal;
export const toast = toastOriginal; 