/**
 * Production-grade toast notification system for AI SFX Generator
 * Features: Auto-dismiss, action buttons, persistence, accessibility
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import './ToastSystem.scss';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

export interface ToastSystemRef {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  removeAllToasts: () => void;
}

interface ToastSystemProps {
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const ToastSystem = React.forwardRef<ToastSystemRef, ToastSystemProps>(({ 
  maxToasts = 5, 
  position = 'top-right' 
}, ref) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { ...toast, id };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      return updated.slice(0, maxToasts);
    });

    // Auto-dismiss if not persistent
    if (!toast.persistent && toast.duration !== 0) {
      const duration = toast.duration || 3000;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Expose methods to parent components via ref
  React.useImperativeHandle(ref, () => ({
    addToast,
    removeToast,
    removeAllToasts
  }), [addToast, removeToast, removeAllToasts]);

  const getToastIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return 'ℹ';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className={`toast-container toast-container--${position}`} role="region" aria-live="polite">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
          style={{ 
            zIndex: 10000 - index,
            animationDelay: `${index * 100}ms`
          }}
          role="alert"
          aria-atomic="true"
        >
          <div className="toast__content">
            <div className="toast__icon" aria-hidden="true">
              {getToastIcon(toast.type)}
            </div>
            <div className="toast__message">
              {toast.message}
            </div>
          </div>
          
          <div className="toast__actions">
            {toast.action && (
              <button
                className="toast__action-btn"
                onClick={() => {
                  toast.action!.handler();
                  removeToast(toast.id);
                }}
                aria-label={toast.action.label}
              >
                {toast.action.label}
              </button>
            )}
            
            <button
              className="toast__close-btn"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      
      {toasts.length > 2 && (
        <button
          className="toast__clear-all"
          onClick={removeAllToasts}
          aria-label="Clear all notifications"
        >
          Clear All ({toasts.length})
        </button>
      )}
    </div>
  );
});

/**
 * Hook for using toast notifications
 */
export const useToast = () => {
  const toastRef = useRef<ToastSystemRef>(null);
  
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    if (toastRef.current) {
      toastRef.current.addToast(toast);
    }
  }, []);

  const success = useCallback((message: string, duration = 2000) => {
    addToast({ type: 'success', message, duration });
  }, [addToast]);

  const error = useCallback((message: string, duration = 5000, action?: Toast['action']) => {
    addToast({ type: 'error', message, duration, action });
  }, [addToast]);

  const warning = useCallback((message: string, duration = 3000) => {
    addToast({ type: 'warning', message, duration });
  }, [addToast]);

  const info = useCallback((message: string, duration = 2000) => {
    addToast({ type: 'info', message, duration });
  }, [addToast]);

  const persistent = useCallback((type: Toast['type'], message: string, action?: Toast['action']) => {
    addToast({ type, message, persistent: true, action });
  }, [addToast]);

  return {
    toastRef,
    success,
    error,
    warning,
    info,
    persistent,
    addToast
  };
};