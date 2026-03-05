import { toast } from 'sonner';

interface ToastOptions {
  title: string;
  message?: string;
}

export const ToastService = {
  success: ({ title, message }: ToastOptions) => {
    toast.success(title, { description: message });
  },
  error: ({ title, message }: ToastOptions) => {
    toast.error(title, { description: message });
  },
  info: ({ title, message }: ToastOptions) => {
    toast.info(title, { description: message });
  },
};
