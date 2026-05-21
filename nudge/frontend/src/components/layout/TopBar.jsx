import { useLocation, NavLink } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Briefcase, BarChart3, Clock, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Dashboard',  path: '/',           icon: LayoutDashboard },
  { label: 'Portfolio',  path: '/portfolio',   icon: Briefcase },
  { label: 'Analytics',  path: '/analytics',   icon: BarChart3 },
  { label: 'Timeline',   path: '/timeline',    icon: Clock },
  { label: 'Journal',    path: '/journal',      icon: BookOpen },
];

const ROUTE_TITLES = {
  '/':          'Dashboard',
  '/portfolio': 'Portfolio',
  '/analytics': 'Behaviour Analytics',
  '/timeline':  'Behavioral Timeline',
  '/journal':   'Investor Journal',
};

export default function TopBar() {
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Derive page title from pathname
  const title = pathname.startsWith('/sell/') 
    ? 'Sell Order' 
    : ROUTE_TITLES[pathname] || 'Nudge';

  return (
    <>
      <header className='sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200/80'>
        <div className='flex items-center justify-between px-4 md:px-8 h-16'>
          
          {/* Left: Mobile hamburger + Title */}
          <div className='flex items-center gap-4'>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='md:hidden text-slate-600 hover:text-slate-900 transition-colors'
            >
              {mobileMenuOpen ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
            </button>
            
            {/* Mobile Logo */}
            <div className='md:hidden flex items-center gap-2'>
              <div className='w-6 h-6 rounded-md bg-[#ccff00] flex items-center justify-center'>
                <svg className='w-3 h-3 text-black' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z'/>
                </svg>
              </div>
              <span className='font-bold text-slate-900'>nudge.</span>
            </div>

            {/* Desktop: Page title */}
            <h1 className='hidden md:block text-lg font-semibold text-slate-900 tracking-tight'>
              {title}
            </h1>
          </div>

          {/* Right: Actions */}
        
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black/50 z-40 md:hidden'
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.nav
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className='fixed top-0 left-0 bottom-0 w-72 bg-[#0a0a0a] z-50 p-6 flex flex-col md:hidden'
            >
              <div className='flex items-center gap-2.5 mb-8'>
                <div className='w-8 h-8 rounded-lg bg-[#ccff00] flex items-center justify-center'>
                  <svg className='w-4 h-4 text-black' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z'/>
                  </svg>
                </div>
                <span className='text-xl font-bold tracking-tight text-white'>nudge.</span>
              </div>

              <div className='space-y-1'>
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[#ccff00] text-black'
                          : 'text-slate-400 hover:bg-[#1a1a1a] hover:text-white'
                      }`
                    }
                  >
                    <item.icon className='w-[18px] h-[18px]' />
                    {item.label}
                  </NavLink>
                ))}
              </div>

              <div className='mt-auto pt-6 border-t border-[#1a1a1a]'>
                <div className='flex items-center gap-3'>
                  <div className='w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 text-sm font-bold'>
                    ST
                  </div>
                  <div>
                    <p className='text-sm font-medium text-white'>Shino Thomas</p>
                    <p className='text-xs text-slate-500'>Investor</p>
                  </div>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
