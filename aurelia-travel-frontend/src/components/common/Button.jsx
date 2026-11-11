import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable Button Component for Aurelia Travel
 * Adheres strictly to the Aurelia Premium Design System:
 * Glassmorphic styling, dark/light theme support, and Framer Motion micro-interactions.
 */
export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'accent' | 'glass' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  icon = null,
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all rounded-2xl cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-2 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5'
  };

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 focus:ring-blue-500 border border-blue-500/30',
    secondary: 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 shadow-md focus:ring-slate-700',
    accent: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25 focus:ring-amber-500',
    glass: 'backdrop-blur-md bg-white/80 dark:bg-slate-900/80 hover:bg-white/95 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-800 shadow-md',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </motion.button>
  );
}

