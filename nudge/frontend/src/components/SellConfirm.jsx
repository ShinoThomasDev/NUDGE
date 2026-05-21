import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { postSellIntent, postExecuteSell } from '../api';
import NudgeModal from './NudgeModal';
import toast from 'react-hot-toast';

const USER_ID = 'user_shinothomas_demo';

export default function SellConfirm() {
  const { ticker }         = useParams();
  const { state }          = useLocation();
  const navigate           = useNavigate();
  const holding            = state?.holding;

  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [nudgeData, setNudgeData] = useState(null); // populated if nudge fires
  const [forceNudge, setForceNudge] = useState(false);
  
  // Guard check before accessing holding
  if (!holding) { navigate('/'); return null; }

  const [sellQty, setSellQty] = useState(holding.quantity);

  const estimatedPnl = (holding.current_price - holding.avg_buy_price) * sellQty;

  const handleSellNow = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const res = await postSellIntent(USER_ID, ticker, forceNudge);
      if (res.data.action === 'nudge') {
        setNudgeData(res.data); // show modal
      } else {
        // Score < 35, no nudge — go straight to execute
        await postExecuteSell(USER_ID, holding.ticker, sellQty, null, null);
        toast.success(`Successfully sold ${sellQty} shares of ${holding.stock_name}`);
        navigate('/', { replace: true });
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to execute order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300'>
      {/* Top Nav */}
      <div className='flex items-center mb-8'>
        <button onClick={() => navigate(-1)} className='text-slate-500 hover:text-slate-900 transition-colors flex items-center text-sm font-medium'>
          <svg className='w-4 h-4 mr-1.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M15 19l-7-7 7-7'/></svg>
          Back to Portfolio
        </button>
      </div>

      {/* Ticket Card */}
      <div className='bg-white rounded-[2rem] p-10 md:p-10 shadow-sm border border-slate-200 relative'>
      
        <div className='mb-12 text-center'>
          <p className='text-sm font-bold text-slate-400 uppercase tracking-widest mb-2'>Sell Order</p>
          <h2 className='text-4xl font-bold tracking-tight text-slate-900'>{holding.stock_name}</h2>
          <p className={`text-sm font-semibold mt-2 flex items-center justify-center ${ 
            holding.today_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {holding.today_pct >= 0 ? '+' : ''}{holding.today_pct}% today
          </p>
        </div>

        <div className='mt-10 space-y-4 text-sm text-slate-600'>
        <div className='flex justify-between items-center'>
  <span className='text-slate-500'>Quantity</span>

  <div className='flex items-center space-x-3'>
    
    {/* Max Button */}
    <button
      onClick={() => setSellQty(holding.quantity)}
      className='px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors'
    >
      Max
    </button>

    {/* Quantity Stepper */}
    <div className='flex items-center space-x-2 bg-slate-50 p-1 rounded-xl border border-slate-100'>
      
      <button 
        onClick={() => setSellQty(Math.max(1, sellQty - 1))}
        disabled={sellQty <= 1}
        className='w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors'
      >
        <svg 
          className='w-4 h-4' 
          fill='none' 
          stroke='currentColor' 
          viewBox='0 0 24 24'
        >
          <path 
            strokeLinecap='round' 
            strokeLinejoin='round' 
            strokeWidth={2.5} 
            d='M20 12H4'
          />
        </svg>
      </button>

      <span className='font-semibold text-slate-900 w-8 text-center text-base'>
        {sellQty}
      </span>

      <button 
        onClick={() => setSellQty(Math.min(holding.quantity, sellQty + 1))}
        disabled={sellQty >= holding.quantity}
        className='w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors'
      >
        <svg 
          className='w-4 h-4' 
          fill='none' 
          stroke='currentColor' 
          viewBox='0 0 24 24'
        >
          <path 
            strokeLinecap='round' 
            strokeLinejoin='round' 
            strokeWidth={2.5} 
            d='M12 4v16m8-8H4'
          />
        </svg>
      </button>

    </div>
  </div>

          </div>
          <div className='flex justify-between items-center'>
            <span className='text-slate-500'>Current price</span>
            <span className='font-medium text-slate-900'>₹{holding.current_price}</span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-slate-500'>Avg buy price</span>
            <span className='font-medium text-slate-900'>₹{holding.avg_buy_price}</span>
          </div>
          
          <div className='flex justify-between items-center pt-4 mt-2 border-t border-slate-100'>
            <span className='font-medium text-slate-700'>Estimated P&L</span>
            <div className={`px-3 py-1 rounded-full font-semibold ${ 
              estimatedPnl >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {estimatedPnl >= 0 ? '+' : ''}₹{Math.abs(estimatedPnl).toFixed(0)}
            </div>
          </div>
        </div>
      </div>

      <div className='mt-8 flex items-center justify-end space-x-3'>
        <label htmlFor="force_nudge" className='text-xs font-semibold text-slate-400 cursor-pointer select-none uppercase tracking-wide'>
          Force Nudge (Demo)
        </label>
        <button
          type="button"
          onClick={() => setForceNudge(!forceNudge)}
          className={`${forceNudge ? 'bg-[#0a0a0a]' : 'bg-slate-200'} relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`}
        >
          <span className={`${forceNudge ? 'translate-x-4' : 'translate-x-0'} pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
        </button>
      </div>

      <div className='mt-6'>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className='w-full bg-[#0a0a0a] hover:bg-black text-white font-bold py-4 rounded-2xl disabled:opacity-50 transition shadow-md hover:shadow-lg active:scale-[0.98] flex justify-center items-center text-base tracking-wide'
        >
          {loading ? (
            <svg className='animate-spin h-5 w-5 text-[#ccff00]' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
              <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
              <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
            </svg>
          ) : 'Review Order'}
        </button>
      </div>

      {/* Nudge Modal — shown as overlay */}
      {nudgeData && (
        <NudgeModal
          data={nudgeData}
          holding={holding}
          sellQty={sellQty}
          onDismiss={() => navigate('/', { replace: true })}
        />
      )}

      {/* Standard Confirmation Modal */}
      {showConfirm && !nudgeData && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm'>
          <div className='bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200'>
            <h3 className='text-xl font-bold text-slate-900 mb-2'>Confirm Order</h3>
            <p className='text-slate-500 mb-6'>
              You are about to sell <span className='font-bold text-slate-900'>{sellQty} shares</span> of <span className='font-bold text-slate-900'>{holding.stock_name}</span>. Proceed?
            </p>
            <div className='flex gap-3'>
              <button 
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className='flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition disabled:opacity-50'
              >
                Cancel
              </button>
              <button 
                onClick={handleSellNow}
                disabled={loading}
                className='flex-1 bg-[#0a0a0a] hover:bg-black text-white font-semibold py-3 rounded-xl shadow-md transition disabled:opacity-50 flex justify-center'
              >
                {loading ? (
                  <svg className='animate-spin h-5 w-5 text-[#ccff00]' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                  </svg>
                ) : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
