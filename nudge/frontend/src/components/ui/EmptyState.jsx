import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({ 
  icon: Icon = Inbox, 
  title = 'Nothing here yet', 
  description = '', 
  actionLabel = '', 
  onAction = null,
  className = '' 
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 text-center ${className}`}>
      <div className='w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-6'>
        <Icon className='w-7 h-7 text-slate-400' />
      </div>
      <h3 className='text-lg font-semibold text-slate-900 mb-1'>{title}</h3>
      {description && (
        <p className='text-sm text-slate-500 max-w-sm leading-relaxed'>{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant='secondary' size='sm' className='mt-6' onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
