import { postNudgeOutcome, postExecuteSell } from '../api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const USER_ID = 'user_shinothomas_demo';

const LEVEL_COLORS = {
  low:    'bg-green-500',
  medium: 'bg-amber-500',
  high:   'bg-red-500',
};

export default function NudgeModal({ data, holding, sellQty, onDismiss }) {
  const navigate = useNavigate();
  const { nudge_id, score, level, message, signals } = data;

  const handleHold = async () => {
    await postNudgeOutcome(nudge_id, true); // heeded = true
    onDismiss();
  };

  const handleSellAnyway = async () => {
    await postNudgeOutcome(nudge_id, false); // heeded = false
    await postExecuteSell(USER_ID, holding.ticker, sellQty, nudge_id, false);
    toast.success(`Order executed despite the nudge.`);
    navigate('/', { replace: true });
  };

  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-300'>
      <div className='bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-400'>
        
        {/* Subtle AI Insight Badge */}
        <div className='flex justify-center mb-8'>
          <div className='flex items-center space-x-2 bg-[#ccff00]/20 text-[#0a0a0a] border border-[#ccff00]/50 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm'>
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'><path d='M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z'/></svg>
            <span>Nudge Insight</span>
          </div>
        </div>

        {/* LLM message */}
        <div className='mb-6'>
          <p className='text-slate-800 text-base leading-relaxed text-center font-medium'>
            {message}
          </p>
        </div>

        {/* Signal pills */}
        <div className='flex flex-wrap justify-center gap-2 mb-8'>
          {Object.entries(signals)
            .filter(([, s]) => s.fired)
            .map(([key, s]) => (
              <span key={key} className='text-[11px] font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md'>
                {s.label}
              </span>
            ))}
        </div>

        {/* Action buttons */}
        <div className='space-y-3 mt-10'>
          <button
            onClick={handleHold}
            className='w-full bg-[#0a0a0a] hover:bg-black text-white font-bold py-4 rounded-2xl transition shadow-md hover:shadow-lg active:scale-[0.98] text-base tracking-wide'
          >
            Keep holding
          </button>
          <button
            onClick={handleSellAnyway}
            className='w-full text-slate-500 hover:text-slate-900 font-semibold py-3 text-sm transition-colors'
          >
            Proceed with sell
          </button>
        </div>
      </div>
    </div>
  );
}
