import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout() {
  const location = useLocation();

  return (
    <div className='flex h-screen w-full bg-slate-50 font-sans text-slate-900'>
      <Sidebar />

      <main className='flex-1 flex flex-col h-screen overflow-hidden'>
        <TopBar />

        <div className='flex-1 overflow-y-auto scroll-smooth'>
          <div className='max-w-7xl mx-auto p-4 md:p-8 lg:p-10'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
