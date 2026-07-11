import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import DashboardSaaS from '@/pages/DashboardSaaS';
import Devices from '@/pages/Devices';
import Analytics from '@/pages/Analytics';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardSaaS />} />
          <Route path="devices" element={<Devices />} />
          <Route path="analytics" element={<Analytics />} />
          {/* Placeholder for settings */}
          <Route path="settings" element={
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500 font-medium">Settings coming soon</p>
            </div>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
