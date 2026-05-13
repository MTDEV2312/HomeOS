'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (title: string, message?: string, type?: ToastType) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const addToast = useCallback((title: string, message?: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const value = {
    toast: addToast,
    success: (title: string, message?: string) => addToast(title, message, 'success'),
    error: (title: string, message?: string) => addToast(title, message, 'error'),
    info: (title: string, message?: string) => addToast(title, message, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted && createPortal(
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-[200] flex flex-col gap-2 pointer-events-none max-w-sm w-full sm:w-auto sm:min-w-[320px]">
          {toasts.map((toast) => (
            <div 
              key={toast.id} 
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border animate-slide-up bg-surface-container-highest border-outline-variant`}
            >
              <span className={`material-symbols-outlined shrink-0 ${
                toast.type === 'success' ? 'text-primary' : 
                toast.type === 'error' ? 'text-error' : 
                toast.type === 'warning' ? 'text-tertiary' : 
                'text-secondary'
              }`}>
                {toast.type === 'success' ? 'check_circle' : 
                 toast.type === 'error' ? 'error' : 
                 toast.type === 'warning' ? 'warning' : 'info'}
              </span>
              <div className="flex flex-col gap-1 flex-1">
                <span className="font-label-lg text-label-lg text-on-surface font-semibold">{toast.title}</span>
                {toast.message && <span className="font-body-sm text-body-sm text-on-surface-variant">{toast.message}</span>}
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
