import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ResponsivePie } from '@nivo/pie';
import usePortfolio from '../hooks/usePortfolio';
import useMarket from '../hooks/useMarket';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { PortfolioSkeleton } from '../components/ui/Skeleton';
import { Briefcase } from 'lucide-react';

export default function Portfolio() {
  const { portfolio, loading } = usePortfolio();
  const { market }             = useMarket();
  const navigate               = useNavigate();

  if (loading) return <PortfolioSkeleton />;
  if (!portfolio?.holdings?.length) {
    return <EmptyState icon={Briefcase} title='No holdings yet' description='Your portfolio is empty. Add stocks to get started.' />;
  }

  const totalValue = portfolio.holdings.reduce((s, h) => s + h.total_value, 0);
  const totalPnl   = portfolio.holdings.reduce((s, h) => s + h.pnl, 0);

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial='hidden' animate='show' className='space-y-8'>

      {/* Metrics */}
      <motion.div variants={item} className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <StatCard
          label='Total Value'
          value={`₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
        />
        <StatCard
          label='Total P&L'
          value={`${totalPnl >= 0 ? '+' : ''}₹${Math.abs(totalPnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          trend={totalValue > 0 ? parseFloat(((totalPnl / (totalValue - totalPnl)) * 100).toFixed(1)) : null}
        />
        <StatCard
          label='Holdings'
          value={portfolio.holdings.length}
          trendLabel='active assets'
        />
      </motion.div>

      {/* Holdings Table */}
      <motion.div variants={item}>
        <Card padding='p-0'>
          <div className='px-6 py-5 border-b border-slate-100 flex justify-between items-center'>
            <h3 className='text-base font-semibold text-slate-900'>Holdings</h3>
            <Badge color='slate' size='sm'>{portfolio.holdings.length} assets</Badge>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm whitespace-nowrap'>
              <thead className='bg-slate-50/50 text-slate-500 border-b border-slate-100'>
                <tr>
                  <th className='px-6 py-4 font-medium'>Asset</th>
                  <th className='px-6 py-4 font-medium'>Qty</th>
                  <th className='px-6 py-4 font-medium'>Avg. Price</th>
                  <th className='px-6 py-4 font-medium'>LTP</th>
                  <th className='px-6 py-4 font-medium'>Day Change</th>
                  <th className='px-6 py-4 font-medium'>Value</th>
                  <th className='px-6 py-4 font-medium'>P&L</th>
                  <th className='px-6 py-4 font-medium text-right'>Action</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {portfolio.holdings.map(h => (
                  <tr key={h.ticker} className='hover:bg-slate-50/50 transition-colors'>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600'>
                          {h.ticker.substring(0, 2)}
                        </div>
                        <div>
                          <span className='font-semibold text-slate-900'>{h.stock_name}</span>
                          <span className='block text-xs text-slate-400'>{h.ticker}</span>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 text-slate-600'>{h.quantity}</td>
                    <td className='px-6 py-4 text-slate-600'>₹{h.avg_buy_price.toLocaleString('en-IN')}</td>
                    <td className='px-6 py-4 font-medium text-slate-900'>₹{h.current_price.toLocaleString('en-IN')}</td>
                    <td className='px-6 py-4'>
                      <Badge color={h.today_pct >= 0 ? 'emerald' : 'rose'} size='sm'>
                        {h.today_pct >= 0 ? '+' : ''}{h.today_pct}%
                      </Badge>
                    </td>
                    <td className='px-6 py-4 font-medium text-slate-900'>₹{h.total_value.toLocaleString('en-IN')}</td>
                    <td className='px-6 py-4'>
                      <span className={`font-semibold ${h.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {h.pnl >= 0 ? '+' : ''}₹{Math.abs(h.pnl).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-right'>
                      <Button
                        variant='secondary' size='sm'
                        onClick={() => navigate(`/sell/${h.ticker}`, { state: { holding: h } })}
                      >
                        Sell
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
