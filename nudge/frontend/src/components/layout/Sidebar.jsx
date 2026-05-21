import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Briefcase, BarChart3, Clock, BookOpen, 
  LogOut, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Dashboard',  path: '/',           icon: LayoutDashboard },
  { label: 'Portfolio',  path: '/portfolio',   icon: Briefcase },
  { label: 'Analytics',  path: '/analytics',   icon: BarChart3 },
  { label: 'Timeline',   path: '/timeline',    icon: Clock },
  { label: 'Journal',    path: '/journal',      icon: BookOpen },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`hidden md:flex flex-col ${collapsed ? 'w-20' : 'w-64'} bg-[#0a0a0a] border-r border-[#1a1a1a] transition-all duration-300 ease-in-out`}>
      
      {/* Logo */}
      <div className='p-6 flex items-center justify-between'>
        <div className='flex items-center gap-2.5 overflow-hidden'>
        
          <AnimatePresence>
            {!collapsed && (
              <motion.span 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className='text-xl font-bold tracking-tight text-white whitespace-nowrap'
              >
                nudge.
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className='text-slate-600 hover:text-white transition-colors p-1'
        >
          {collapsed ? <ChevronRight className='w-4 h-4' /> : <ChevronLeft className='w-4 h-4' />}
        </button>
      </div>

      {/* Navigation */}
      <nav className='flex-1 px-3 space-y-1 mt-2'>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-[#ccff00] text-black shadow-[0_0_20px_rgba(204,255,0,0.15)]'
                  : 'text-slate-400 hover:bg-[#1a1a1a] hover:text-white'
              }`
            }
          >
            <item.icon className='w-[18px] h-[18px] flex-shrink-0' />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className='whitespace-nowrap overflow-hidden'
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User Profile Footer */}
      <div className='p-4 border-t border-[#1a1a1a]'>
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : 'px-2'}`}>
          <div className='w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-200 text-sm font-bold flex-shrink-0 ring-2 ring-[#1a1a1a]'>
            ST
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className='overflow-hidden'
              >
                <p className='text-sm font-medium text-white whitespace-nowrap'>Shino Thomas</p>
                <p className='text-xs text-slate-500 whitespace-nowrap'>Investor</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}

// End of file
