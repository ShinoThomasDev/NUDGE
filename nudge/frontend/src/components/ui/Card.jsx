export default function Card({ children, className = '', padding = 'p-6', ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children, className = '' }) {
  return (
    <div className={`pb-4 border-b border-slate-100 mb-4 ${className}`}>
      {children}
    </div>
  );
};

Card.Title = function CardTitle({ children, className = '' }) {
  return <h3 className={`text-base font-semibold text-slate-900 ${className}`}>{children}</h3>;
};

Card.Description = function CardDescription({ children, className = '' }) {
  return <p className={`text-sm text-slate-500 mt-0.5 ${className}`}>{children}</p>;
};
