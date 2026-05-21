import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ShieldCheck, ShieldX, TrendingDown, AlertCircle, ArrowRight } from 'lucide-react';
import { getTimeline } from '../api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { DashboardSkeleton } from '../components/ui/Skeleton';

const USER_ID = 'user_shinothomas_demo';

const EVENT_CONFIG = {
  sell_attempt:   { icon: TrendingDown, color: 'text-amber-600 bg-amber-50 border-amber-100', label: 'Sell Attempt' },
  nudge_fired:    { icon: AlertCircle,  color: 'text-indigo-600 bg-indigo-50 border-indigo-100', label: 'Nudge Triggered' },
  nudge_heeded:   { icon: ShieldCheck,  color: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'Nudge Heeded' },
  nudge_ignored:  { icon: ShieldX,      color: 'text-rose-600 bg-rose-50 border-rose-100', label: 'Nudge Ignored' },
  trade_executed: { icon: ArrowRight,   color: 'text-slate-600 bg-slate-50 border-slate-200', label: 'Trade Executed' },
};

export default function Timeline() {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTimeline(USER_ID)
      .then(r => { setEvents(r.data.events); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!events || events.length === 0) {
    return <EmptyState icon={Clock} title='No activity yet' description='Your behavioral timeline will appear here after your first trade.' />;
  }

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
  const item = { hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } };

  return (
    <motion.div variants={container} initial='hidden' animate='show' className='space-y-6'>
      <Card padding='p-0'>
        <div className='px-6 py-5 border-b border-slate-100'>
          <h3 className='text-base font-semibold text-slate-900'>Activity Feed</h3>
          <p className='text-sm text-slate-500 mt-0.5'>Your complete behavioral history</p>
        </div>
        
        <div className='px-6 py-4'>
          <div className='relative'>
            {/* Vertical line */}
            <div className='absolute left-[18px] top-0 bottom-0 w-px bg-slate-200' />

            {events.map((event, i) => {
              const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.sell_attempt;
              const Icon = config.icon;

              return (
                <motion.div key={i} variants={item} className='relative flex gap-5 pb-8 last:pb-0'>
                  {/* Icon dot */}
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center z-10 flex-shrink-0 ${config.color}`}>
                    <Icon className='w-4 h-4' />
                  </div>

                  {/* Content */}
                  <div className='flex-1 pt-1'>
                    <div className='flex items-start justify-between gap-4'>
                      <div>
                        <p className='text-sm font-semibold text-slate-900'>{config.label}</p>
                        <p className='text-sm text-slate-600 mt-0.5'>{event.description}</p>
                      </div>
                      <span className='text-xs text-slate-400 whitespace-nowrap flex-shrink-0'>
                        {new Date(event.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {event.ticker && (
                      <Badge color='slate' size='sm' className='mt-2'>{event.ticker}</Badge>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
