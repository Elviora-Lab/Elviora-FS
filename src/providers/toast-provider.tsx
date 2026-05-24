'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'border-border bg-card text-card-foreground shadow-card font-sans',
          title: 'font-medium',
        },
      }}
    />
  );
}
