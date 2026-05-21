import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Analytics from './pages/Analytics';
import Timeline from './pages/Timeline';
import Journal from './pages/Journal';
import SellConfirm from './components/sellConfirm';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#0a0a0a', color: '#fff', borderRadius: '12px' } }} />
      <Routes>
        <Route path='/' element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path='portfolio' element={<Portfolio />} />
          <Route path='analytics' element={<Analytics />} />
          <Route path='timeline' element={<Timeline />} />
          <Route path='journal' element={<Journal />} />
          <Route path='sell/:ticker' element={<SellConfirm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
