import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Zap, Droplets, Cpu, Brain, Search, Bell, LogOut, Sun, Moon, Settings } from 'lucide-react';

import Login from './pages/Login';
import EnergyModule from './pages/EnergyModule';
import Overview from './pages/Overview'
import WaterModule from './pages/WaterModule';
import MachineModule from './pages/MachineModule';
import AutomationOverview from './pages/Automation';
import AIAnalytics from './pages/AIAnalytics';
import { DataLogPage, DeviceInfoPage } from './pages/SystemDetails';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  if (!isAuthenticated) return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;

  const Layout = ({ children }) => {
    const location = useLocation();

    const getHeaderTitle = () => {
      const map = {
        '/overview': 'Global Overview',
        '/energy/charts': 'Energy Charts',
        '/energy/devices': 'Energy Floorplan',
        '/energy/logs': 'Energy Audit Logs',
        '/water/charts': 'Water Charts',
        '/water/devices': 'Water Floorplan',
        '/water/logs': 'Water Audit Logs',
        '/automation': 'Automation Overview',
        '/machine': 'Machine Monitoring',
        '/ai': 'AI Analytics'
      };
      return map[location.pathname] || 'GEIBMS';
    };

    return (
      <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed h-full z-30 hidden lg:flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 bg-[#005f5f] rounded-lg flex items-center justify-center text-white font-bold shadow-lg">G</div>
            <span className="ml-3 text-lg font-bold text-slate-900 dark:text-white tracking-tight">GEI<span className="text-green-600">BMS</span></span>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {/* EXECUTIVE TIER */}
            <div className="px-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Executive</div>
            
            <Link to="/overview" className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg mb-1 ${location.pathname === '/overview' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <LayoutDashboard size={18} className="mr-3 text-indigo-500" /> Overview
            </Link>

            <Link to="/ai" className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg mb-4 ${location.pathname === '/ai' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <Brain size={18} className="mr-3 text-purple-500" /> AI Analytics
            </Link>

            {/* MEASUREMENT & VERIFICATION TIER */}
            <div className="px-2 mb-2 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Measurement & Verification</div>

            {/* ENERGY MANAGEMENT */}
            <Link to="/energy/charts" className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg mb-1 ${location.pathname.includes('/energy') ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <Zap size={18} className="mr-3 text-orange-500" /> Energy Management
            </Link>
            {location.pathname.includes('/energy') && (
              <div className="pl-11 pr-2 py-1 space-y-1 mb-2">
                <Link to="/energy/charts" className={`block text-xs py-1.5 ${location.pathname === '/energy/charts' ? 'text-orange-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}>Charts</Link>
                <Link to="/energy/devices" className={`block text-xs py-1.5 ${location.pathname === '/energy/devices' ? 'text-orange-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}>Floorplan</Link>
                <Link to="/energy/logs" className={`block text-xs py-1.5 ${location.pathname === '/energy/logs' ? 'text-orange-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}>Audit Logs</Link>
              </div>
            )}

            {/* WATER MANAGEMENT */}
            <Link to="/water/charts" className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg mb-1 ${location.pathname.includes('/water') ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <Droplets size={18} className="mr-3 text-blue-500" /> Water Management
            </Link>
            {location.pathname.includes('/water') && (
              <div className="pl-11 pr-2 py-1 space-y-1 mb-2">
                <Link to="/water/charts" className={`block text-xs py-1.5 ${location.pathname === '/water/charts' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}>Charts</Link>
                <Link to="/water/devices" className={`block text-xs py-1.5 ${location.pathname === '/water/devices' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}>Floorplan</Link>
                <Link to="/water/logs" className={`block text-xs py-1.5 ${location.pathname === '/water/logs' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}>Audit Logs</Link>
              </div>
            )}

            {/* INDUSTRIAL TIER */}
            <div className="px-2 mb-2 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Industrial</div>
            <Link to="/machine" className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg mb-1 ${location.pathname === '/machine' ? 'bg-[#005f5f]/10 text-[#005f5f] dark:bg-[#005f5f]/30 dark:text-[#005f5f]' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <Settings size={18} className="mr-3" /> Machine Floor
            </Link>
            <Link to="/automation" className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg ${location.pathname === '/automation' ? 'bg-[#005f5f]/10 text-[#005f5f] dark:bg-[#005f5f]/30 dark:text-[#005f5f]' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <Cpu size={18} className="mr-3" /> Automation
            </Link>
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
            <button onClick={() => setDarkMode(!darkMode)} className="flex items-center justify-center w-full px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 transition-colors uppercase">
              {darkMode ? <Sun size={14} className="mr-2 text-yellow-500" /> : <Moon size={14} className="mr-2" />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button onClick={() => setIsAuthenticated(false)} className="flex items-center justify-center text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full px-3 py-2 rounded-lg transition-colors uppercase">
              <LogOut size={14} className="mr-2" /> System Logout
            </button>
          </div>
        </aside>

        <main className="lg:ml-64 flex-1 flex flex-col min-h-screen">
          <header className="h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">{getHeaderTitle()}</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Integrated Operation Centre</p>
            </div>
            <div className="flex items-center space-x-4">
               <button className="p-2 relative hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors">
                 <Bell size={18} className="text-slate-400" />
                 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
               </button>
            </div>
          </header>

          <div className="p-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    );
  };

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          
          <Route path="/energy/charts" element={<EnergyModule />} />
          <Route path="/energy/devices" element={<DeviceInfoPage />} />
          <Route path="/energy/logs" element={<DataLogPage />} />
          
          <Route path="/water/charts" element={<WaterModule />} />
          <Route path="/water/devices" element={<DeviceInfoPage />} />
          <Route path="/water/logs" element={<DataLogPage />} />
          
          <Route path="/machine" element={<MachineModule />} />
          <Route path="/automation" element={<AutomationOverview />} />
          <Route path="/ai" element={<AIAnalytics />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;