import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from './Card';

export default function StatCard({ label, value, trend = null, trendLabel = '', className = '' }) {
  const getTrendIcon = () => {
    if (trend === null || trend === undefined) return null;
    if (trend > 0) return <TrendingUp className='w-3.5 h-3.5' />;
    if (trend < 0) return <TrendingDown className='w-3.5 h-3.5' />;
    return <Minus className='w-3.5 h-3.5' />;
  };

  const getTrendColor = () => {
    if (trend === null || trend === undefined) return 'text-slate-500';
    if (trend > 0) return 'text-emerald-600';
    if (trend < 0) return 'text-rose-600';
    return 'text-slate-500';
  };

  return (
    <Card className={className}>
      <p className='text-sm font-medium text-slate-500 mb-2'>{label}</p>
      <h2 className='text-3xl font-bold text-slate-900 tracking-tight'>{value}</h2>
      {trend !== null && trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-sm font-semibold ${getTrendColor()}`}>
          {getTrendIcon()}
          <span>{trend > 0 ? '+' : ''}{trend}%</span>
          {trendLabel && <span className='text-slate-400 font-normal ml-1'>{trendLabel}</span>}
        </div>
      )}
    </Card>
  );
}
