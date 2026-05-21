const colorMap = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rose:    'bg-rose-50 text-rose-700 border-rose-100',
  amber:   'bg-amber-50 text-amber-700 border-amber-100',
  slate:   'bg-slate-100 text-slate-600 border-slate-200',
  indigo:  'bg-indigo-50 text-indigo-700 border-indigo-100',
  lime:    'bg-[#ccff00]/20 text-[#0a0a0a] border-[#ccff00]/40',
};

const sizes = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export default function Badge({ children, color = 'slate', size = 'md', className = '' }) {
  return (
    <span className={`
      inline-flex items-center gap-1 font-semibold rounded-full border uppercase tracking-wider
      ${colorMap[color]} ${sizes[size]} ${className}
    `}>
      {children}
    </span>
  );
}
