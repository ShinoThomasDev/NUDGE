import { motion } from 'framer-motion';

const variants = {
  primary:   'bg-[#0a0a0a] hover:bg-black text-white shadow-md hover:shadow-lg',
  secondary: 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-sm',
  ghost:     'bg-transparent hover:bg-slate-100 text-slate-600',
  danger:    'bg-rose-600 hover:bg-rose-700 text-white shadow-md',
  accent:    'bg-[#ccff00] hover:bg-[#b8e600] text-black shadow-md',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-2xl',
};

export default function Button({ 
  children, variant = 'primary', size = 'md', 
  className = '', disabled = false, loading = false, ...props 
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      disabled={disabled || loading}
      className={`
        ${variants[variant]} ${sizes[size]}
        font-semibold tracking-wide transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className='animate-spin h-4 w-4' fill='none' viewBox='0 0 24 24'>
          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
        </svg>
      )}
      {children}
    </motion.button>
  );
}
