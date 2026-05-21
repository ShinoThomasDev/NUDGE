import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Smile, Frown, Meh, HelpCircle, Send } from 'lucide-react';
import { getJournalEntries, postJournalEntry } from '../api';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { DashboardSkeleton } from '../components/ui/Skeleton';

const USER_ID = 'user_shinothomas_demo';

const MOODS = [
  { value: 'calm',      icon: Smile,       label: 'Calm',       color: 'emerald' },
  { value: 'anxious',   icon: Frown,       label: 'Anxious',    color: 'rose' },
  { value: 'uncertain', icon: HelpCircle,  label: 'Uncertain',  color: 'amber' },
  { value: 'confident', icon: Meh,         label: 'Confident',  color: 'indigo' },
];

export default function Journal() {
  const [entries, setEntries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEntries = () => {
    getJournalEntries(USER_ID)
      .then(r => { setEntries(r.data.entries || []); setLoading(false); })
      .catch(() => { setEntries([]); setLoading(false); });
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await postJournalEntry({
        user_id: USER_ID,
        content: content.trim(),
        mood: mood || null,
        entry_type: 'reflection',
      });
      setContent('');
      setMood('');
      setComposing(false);
      toast.success('Journal entry saved!');
      fetchEntries();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save journal entry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial='hidden' animate='show' className='space-y-6'>

      {/* Compose Area */}
      <motion.div variants={item}>
        <AnimatePresence mode='wait'>
          {composing ? (
            <motion.div
              key='editor'
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card>
                <h3 className='text-base font-semibold text-slate-900 mb-4'>New Reflection</h3>
                
                {/* Mood selector */}
                <div className='flex gap-2 mb-4'>
                  {MOODS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setMood(mood === m.value ? '' : m.value)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                        mood === m.value
                          ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <m.icon className='w-4 h-4' />
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Text area */}
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="What's on your mind about your investments today?"
                  className='w-full h-32 px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#ccff00]/50 focus:border-[#ccff00] transition-all'
                />

                <div className='flex justify-end gap-3 mt-4'>
                  <Button variant='ghost' size='sm' onClick={() => setComposing(false)}>Cancel</Button>
                  <Button size='sm' onClick={handleSubmit} loading={submitting} disabled={!content.trim()}>
                    <Send className='w-3.5 h-3.5' /> Save Entry
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div key='prompt'>
              <button
                onClick={() => setComposing(true)}
                className='w-full flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-6 py-5 text-left hover:border-slate-300 hover:shadow-sm transition-all group'
              >
                <div className='w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-[#ccff00]/20 transition-colors'>
                  <Plus className='w-5 h-5 text-slate-400 group-hover:text-[#0a0a0a] transition-colors' />
                </div>
                <div>
                  <p className='text-sm font-semibold text-slate-900'>Add a reflection</p>
                  <p className='text-xs text-slate-500'>Document your investing thoughts and emotions</p>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Entries List */}
      {entries && entries.length > 0 ? (
        entries.map((entry, i) => (
          <motion.div key={entry.id || i} variants={item}>
            <Card>
              <div className='flex justify-between items-start mb-3'>
                <div className='flex items-center gap-2'>
                  {entry.mood && (
                    <Badge color={MOODS.find(m => m.value === entry.mood)?.color || 'slate'} size='sm'>
                      {entry.mood}
                    </Badge>
                  )}
                  {entry.ticker && <Badge color='slate' size='sm'>{entry.ticker}</Badge>}
                </div>
                <span className='text-xs text-slate-400'>
                  {new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p className='text-sm text-slate-700 leading-relaxed'>{entry.content}</p>
            </Card>
          </motion.div>
        ))
      ) : (
        !composing && (
          <motion.div variants={item}>
            <EmptyState
              icon={BookOpen}
              title='Your journal is empty'
              description='Start writing reflections to track your emotional investing patterns over time.'
              actionLabel='Write your first entry'
              onAction={() => setComposing(true)}
            />
          </motion.div>
        )
      )}
    </motion.div>
  );
}
