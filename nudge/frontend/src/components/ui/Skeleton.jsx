export default function Skeleton({ className = '', variant = 'text' }) {
  const base = 'animate-pulse bg-slate-200 rounded-lg';

  const variants = {
    text:      `${base} h-4 w-3/4`,
    heading:   `${base} h-8 w-1/2`,
    card:      `${base} h-32 w-full rounded-2xl`,
    circle:    `${base} h-10 w-10 rounded-full`,
    tableRow:  `${base} h-14 w-full`,
    chart:     `${base} h-64 w-full rounded-2xl`,
    stat:      `${base} h-28 w-full rounded-2xl`,
  };

  return <div className={`${variants[variant]} ${className}`} />;
}

// Pre-built skeleton layouts
export function PortfolioSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <Skeleton variant='stat' />
        <Skeleton variant='stat' />
        <Skeleton variant='stat' />
      </div>
      <Skeleton variant='card' className='h-[400px]' />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='flex gap-4'>
        <Skeleton variant='heading' />
      </div>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <Skeleton variant='stat' />
        <Skeleton variant='stat' />
        <Skeleton variant='stat' />
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Skeleton variant='chart' />
        <Skeleton variant='chart' />
      </div>
    </div>
  );
}
