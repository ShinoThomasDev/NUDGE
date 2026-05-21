import { motion } from 'framer-motion';
import { ResponsiveBar } from '@nivo/bar';
import { Shield, TrendingUp, Eye, DollarSign } from 'lucide-react';
import useDashboard from '../hooks/useDashboard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import { DashboardSkeleton } from '../components/ui/Skeleton';

function getPatternBadge(heedRate, total) {
  if (total === 0)    return { label: 'No data yet', color: 'slate' };
  if (heedRate >= 70) return { label: 'Improving',   color: 'emerald' };
  if (heedRate >= 40) return { label: 'Reactive',    color: 'amber' };
  return              { label: 'Highly Reactive',    color: 'rose' };
}

function groupByWeek(history) {
  const weeks = {};
  history.forEach(n => {
    const date = new Date(n.created_at);
    const week = `W${Math.ceil(date.getDate() / 7)} ${date.toLocaleString('default', { month: 'short' })}`;
    weeks[week] = (weeks[week] || 0) + 1;
  });
  return Object.entries(weeks).map(([week, count]) => ({ week, count }));
}

import { useState } from 'react';

export default function Analytics() {
  const { data, loading } = useDashboard();
  const [expanded, setExpanded] = useState(new Set());

  const toggleNudge = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) return <DashboardSkeleton />;
  if (!data) return <EmptyState icon={Shield} title='No analytics data' description='Start trading to see your behavioral patterns.' />;

  const chartData   = groupByWeek(data.nudge_history);
  const badge       = getPatternBadge(data.heed_rate, data.total_nudges);

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial='hidden' animate='show' className='space-y-8'>

      {/* Top Metrics */}
      <motion.div variants={item} className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <Card className={`border-l-4 ${
          badge.color === 'emerald' ? 'border-l-emerald-500' :
          badge.color === 'amber' ? 'border-l-amber-500' :
          badge.color === 'rose' ? 'border-l-rose-500' : 'border-l-slate-300'
        }`}>
          <p className='text-sm font-medium text-slate-500 mb-2'>Current Pattern</p>
          <h2 className='text-2xl font-bold text-slate-900 tracking-tight'>{badge.label}</h2>
          <p className='text-sm text-slate-500 mt-1'>{data.heed_rate}% heed rate</p>
        </Card>

        <StatCard label='Total Interventions' value={data.total_nudges} />
        <StatCard label='Nudges Heeded' value={data.heeded_nudges} />
      </motion.div>

      {/* Chart + History */}
      <motion.div variants={item} className='grid grid-cols-1 lg:grid-cols-3 gap-8'>

        {/* Bar Chart */}
        <Card className='lg:col-span-2'>
          <Card.Header>
            <Card.Title>Interventions per Week</Card.Title>
          </Card.Header>
          {chartData.length > 0 ? (
            <div className='h-72'>
              <ResponsiveBar
                data={chartData}
                keys={['count']}
                indexBy='week'
                margin={{ top: 10, right: 10, bottom: 40, left: 40 }}
                padding={0.35}
                borderRadius={6}
                colors={({ index }) => index === chartData.length - 1 ? '#0a0a0a' : '#e2e8f0'}
                axisBottom={{ tickSize: 0, tickPadding: 12, tickRotation: 0 }}
                axisLeft={{ tickSize: 0, tickPadding: 12 }}
                enableGridY={false}
                enableLabel={false}
                tooltip={({ indexValue, value }) => (
                  <div className='bg-white px-3 py-2 rounded-xl shadow-lg border border-slate-200 text-sm'>
                    <span className='font-semibold text-slate-900'>{indexValue}</span>
                    <span className='text-slate-500 ml-2'>{value} nudges</span>
                  </div>
                )}
                theme={{
                  axis: { ticks: { text: { fontSize: 12, fill: '#64748b' } } },
                }}
              />
            </div>
          ) : (
            <EmptyState title='No chart data' description='Behavioral data will appear here after interactions.' />
          )}
        </Card>

        {/* Recent Nudge History */}
        <Card className='flex flex-col max-h-[500px]'>
          <Card.Header>
            <div className='flex justify-between items-center'>
              <Card.Title>Recent Nudges</Card.Title>
              <Badge color='slate' size='sm'>{data.nudge_history.length}</Badge>
            </div>
          </Card.Header>
          <div className='flex-1 overflow-y-auto pr-1 space-y-3'>
            {data.nudge_history.slice().reverse().map(n => {
              const isExpanded = expanded.has(n.id);
              return (
                <div 
                  key={n.id} 
                  onClick={() => toggleNudge(n.id)}
                  className='p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group'
                >
                  <div className='flex justify-between items-center mb-2'>
                    <span className='font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors'>{n.ticker}</span>
                    <Badge 
                      color={n.heeded === true ? 'emerald' : n.heeded === false ? 'slate' : 'amber'}
                      size='sm'
                    >
                      {n.heeded === true ? 'Kept Holding' : n.heeded === false ? 'Sold Anyway' : 'Pending'}
                    </Badge>
                  </div>
                  <p className={`text-sm text-slate-600 leading-relaxed transition-all ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {n.message}
                  </p>
                  {!isExpanded && n.message.length > 80 && (
                    <p className="text-xs text-indigo-500 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to read more
                    </p>
                  )}
                </div>
              );
            })}
            {data.nudge_history.length === 0 && (
              <div className='text-center text-slate-400 py-10 text-sm'>No nudges yet</div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
