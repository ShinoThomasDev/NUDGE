import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Shield, TrendingUp, Zap, Target } from 'lucide-react';
import { ResponsivePie } from '@nivo/pie';
import usePortfolio from '../hooks/usePortfolio';
import useMarket from '../hooks/useMarket';
import useDashboard from '../hooks/useDashboard';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { DashboardSkeleton } from '../components/ui/Skeleton';

export default function Dashboard() {
  const { portfolio, loading: pLoading } = usePortfolio();
  const { market, loading: mLoading }    = useMarket();
  const { data: analytics }              = useDashboard();
  const navigate = useNavigate();

  if (pLoading || mLoading) return <DashboardSkeleton />;

  const totalValue = portfolio?.holdings?.reduce((s, h) => s + h.total_value, 0) || 0;
  const totalPnl   = portfolio?.holdings?.reduce((s, h) => s + h.pnl, 0) || 0;
  const pnlPct     = totalValue > 0 ? (totalPnl / (totalValue - totalPnl) * 100) : 0;

  // Pie chart data for allocation
  const pieData = portfolio?.holdings?.map(h => ({
    id: h.stock_name,
    label: h.stock_name,
    value: h.total_value,
  })) || [];

  // Insight cards
  const insights = [];
  if (portfolio?.holdings?.length) {
    const mostVolatile = [...portfolio.holdings].sort((a, b) => Math.abs(b.today_pct) - Math.abs(a.today_pct))[0];
    const bestPerformer = [...portfolio.holdings].sort((a, b) => b.pnl - a.pnl)[0];
    const worstPerformer = [...portfolio.holdings].sort((a, b) => a.pnl - b.pnl)[0];

    insights.push(
      { icon: Zap, label: 'Most Active Today', value: mostVolatile.stock_name, detail: `${mostVolatile.today_pct > 0 ? '+' : ''}${mostVolatile.today_pct}%`, color: 'amber' },
      { icon: TrendingUp, label: 'Top Performer', value: bestPerformer.stock_name, detail: `+₹${bestPerformer.pnl.toLocaleString('en-IN')}`, color: 'emerald' },
      { icon: Target, label: 'Needs Attention', value: worstPerformer.stock_name, detail: `₹${worstPerformer.pnl.toLocaleString('en-IN')}`, color: worstPerformer.pnl < 0 ? 'rose' : 'emerald' },
    );
  }

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial='hidden' animate='show' className='space-y-8'>

      {/* Greeting */}
      <motion.div variants={item}>
        <p className='text-sm text-slate-500'>Welcome back, Shino</p>
      </motion.div>

      {/* Top Metrics */}
      <motion.div variants={item} className='grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6'>
        <StatCard
          label='Portfolio Value'
          value={`₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          trend={parseFloat(pnlPct.toFixed(1))}
          trendLabel='overall P&L'
        />
        <StatCard
          label='Nifty 50'
          value={market?.nifty ? market.nifty.price.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}
          trend={market?.nifty?.change_pct ?? null}
          trendLabel='today'
        />
        <StatCard
          label='Sensex'
          value={market?.sensex ? market.sensex.price.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}
          trend={market?.sensex?.change_pct ?? null}
          trendLabel='today'
        />
        <StatCard
          label='India VIX'
          value={market?.vix ? market.vix.price.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}
          trend={market?.vix?.change_pct ?? null}
          trendLabel='today'
        />
        <Card className={`border-t-4 flex flex-col justify-center ${
          market?.mood?.color === 'rose' ? 'border-t-rose-500' :
          market?.mood?.color === 'amber' ? 'border-t-amber-500' :
          market?.mood?.color === 'emerald' ? 'border-t-emerald-500' : 'border-t-slate-300'
        }`}>
          <p className='text-sm font-medium text-slate-500 mb-1'>Market Mood</p>
          <h2 className='text-xl font-bold tracking-tight text-slate-900'>
            {market?.mood?.label || 'Loading...'}
          </h2>
        </Card>
      </motion.div>

      {/* Middle Row: Allocation Chart + Behavioral Health */}
      <motion.div variants={item} className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
        
        {/* Allocation Pie */}
        <Card className='lg:col-span-3'>
          <Card.Header>
            <div className='flex justify-between items-center'>
              <Card.Title>Portfolio Allocation</Card.Title>
              <Badge color='slate' size='sm'>{portfolio?.holdings?.length || 0} assets</Badge>
            </div>
          </Card.Header>
          <div className='h-72'>
            {pieData.length > 0 ? (
              <ResponsivePie
                data={pieData}
                margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
                innerRadius={0.6}
                padAngle={2}
                cornerRadius={6}
                activeOuterRadiusOffset={6}
                colors={['#0a0a0a', '#334155', '#64748b', '#94a3b8', '#cbd5e1']}
                borderWidth={0}
                enableArcLinkLabels={true}
                arcLinkLabelsTextColor='#475569'
                arcLinkLabelsThickness={1.5}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLinkLabelsDiagonalLength={12}
                arcLinkLabelsStraightLength={8}
                arcLabelsSkipAngle={20}
                arcLabelsTextColor='#ffffff'
                arcLabel={d => `${((d.value / totalValue) * 100).toFixed(0)}%`}
                tooltip={({ datum }) => (
                  <div className='bg-white px-3 py-2 rounded-xl shadow-lg border border-slate-200 text-sm'>
                    <span className='font-semibold text-slate-900'>{datum.label}</span>
                    <span className='text-slate-500 ml-2'>₹{datum.value.toLocaleString('en-IN')}</span>
                  </div>
                )}
              />
            ) : (
              <div className='flex items-center justify-center h-full text-slate-400'>No holdings to display</div>
            )}
          </div>
        </Card>

        {/* Behavioral Health Score */}
        <Card className='lg:col-span-2 flex flex-col'>
          <Card.Header>
            <Card.Title>Behavioral Health</Card.Title>
            <Card.Description>Your investing discipline score</Card.Description>
          </Card.Header>
          <div className='flex-1 flex flex-col items-center justify-center gap-4'>
            <div className='relative w-36 h-36 mt-4'>
              <svg viewBox='0 0 100 100' className='w-full h-full -rotate-90'>
                <circle cx='50' cy='50' r='42' fill='none' stroke='#f1f5f9' strokeWidth='8' />
                <circle 
                  cx='50' cy='50' r='42' fill='none' 
                  stroke={analytics?.health?.health_score >= 70 ? '#10b981' : analytics?.health?.health_score >= 40 ? '#f59e0b' : '#ef4444'}
                  strokeWidth='8' strokeLinecap='round'
                  strokeDasharray={`${(analytics?.health?.health_score || 0) * 2.64} 264`}
                  className='transition-all duration-1000'
                />
              </svg>
              <div className='absolute inset-0 flex flex-col items-center justify-center'>
                <span className='text-3xl font-bold text-slate-900'>{analytics?.health?.health_score || 0}</span>
                <span className='text-xs text-slate-500 font-medium'>/ 100</span>
              </div>
            </div>
            
            <div className='w-full px-6 mt-2'>
              <div className='grid grid-cols-3 gap-2 text-center text-[10px] uppercase font-bold tracking-wider text-slate-400'>
                <div>Nudges</div>
                <div>Holding</div>
                <div>Trades</div>
              </div>
              <div className='grid grid-cols-3 gap-2 text-center text-sm font-semibold text-slate-700 mt-1'>
                <div className='flex justify-center items-center gap-1'>
                  <span className='text-slate-900'>{analytics?.health?.breakdown?.heed_score || 0}</span>
                  <span className='text-xs font-normal text-slate-400'>/ {analytics?.health?.breakdown?.max_heed || 50}</span>
                </div>
                <div className='flex justify-center items-center gap-1'>
                  <span className='text-slate-900'>{analytics?.health?.breakdown?.hold_score || 0}</span>
                  <span className='text-xs font-normal text-slate-400'>/ {analytics?.health?.breakdown?.max_hold || 30}</span>
                </div>
                <div className='flex justify-center items-center gap-1'>
                  <span className='text-slate-900'>{analytics?.health?.breakdown?.trade_score || 0}</span>
                  <span className='text-xs font-normal text-slate-400'>/ {analytics?.health?.breakdown?.max_trade || 20}</span>
                </div>
              </div>
            </div>

            <div className='text-center mt-2'>
              <Badge color={analytics?.health?.health_score >= 70 ? 'emerald' : analytics?.health?.health_score >= 40 ? 'amber' : 'rose'}>
                <Shield className='w-3 h-3' />
                {analytics?.health?.health_score >= 70 ? 'Disciplined' : analytics?.health?.health_score >= 40 ? 'Reactive' : 'High Risk'}
              </Badge>
              <p className='text-xs text-slate-400 mt-2'>Based on {analytics?.total_nudges || 0} interventions</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Insight Cards */}
      {insights.length > 0 && (
        <motion.div variants={item} className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {insights.map((insight, i) => (
            <Card key={i} className='hover:border-slate-300 transition-colors cursor-default'>
              <div className='flex items-start gap-4'>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  insight.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  insight.color === 'rose' ? 'bg-rose-50 text-rose-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  <insight.icon className='w-5 h-5' />
                </div>
                <div>
                  <p className='text-xs font-medium text-slate-500 uppercase tracking-wider'>{insight.label}</p>
                  <p className='text-base font-bold text-slate-900 mt-0.5'>{insight.value}</p>
                  <p className={`text-sm font-semibold mt-0.5 ${
                    insight.color === 'emerald' ? 'text-emerald-600' :
                    insight.color === 'rose' ? 'text-rose-600' : 'text-amber-600'
                  }`}>{insight.detail}</p>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div variants={item}>
        <Card>
          <Card.Header>
            <Card.Title>Active Holdings</Card.Title>
          </Card.Header>
          <div className='space-y-2'>
            {portfolio?.holdings?.map(h => (
              <div
                key={h.ticker}
                onClick={() => navigate(`/sell/${h.ticker}`, { state: { holding: h } })}
                className='flex items-center justify-between py-3 px-4 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group'
              >
                <div className='flex items-center gap-3'>
                  <div className='w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600'>
                    {h.ticker.substring(0, 2)}
                  </div>
                  <div>
                    <p className='text-sm font-semibold text-slate-900'>{h.stock_name}</p>
                    <p className='text-xs text-slate-500'>{h.quantity} shares</p>
                  </div>
                </div>
                <div className='text-right flex items-center gap-3'>
                  <div>
                    <p className='text-sm font-semibold text-slate-900'>₹{h.total_value.toLocaleString('en-IN')}</p>
                    <p className={`text-xs font-semibold ${h.today_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {h.today_pct >= 0 ? '+' : ''}{h.today_pct}%
                    </p>
                  </div>
                  <ArrowUpRight className='w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors' />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
