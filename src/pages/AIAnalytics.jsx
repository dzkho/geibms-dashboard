import React from 'react';
import { Brain, Activity, Zap, DollarSign, Leaf, TrendingUp, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardCard } from '../components/Shared';
import { MOCK_AI_DATA } from '../mockData';

const AIAnalytics = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center tracking-tight">
          <Brain className="mr-2 text-purple-600 dark:text-purple-400" /> AI Optimization Analytics
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Real-time impact analysis of autonomous control systems</p>
      </div>
      <div className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-full border border-purple-100 dark:border-purple-800">
        <Activity size={14} className="text-purple-600 dark:text-purple-400" />
        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">AI Confidence: 94%</span>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <DashboardCard title="Total Energy Saved" mainValue="15,400 kWh" icon={Zap} color="purple" subValue="vs Baseline">
        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden"><div className="h-full bg-purple-500" style={{ width: '85%' }}></div></div>
      </DashboardCard>
      <DashboardCard title="Total Cost Saved" mainValue="$4,250" icon={DollarSign} color="green" subValue="YTD Savings">
        <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-2 font-medium"><TrendingUp size={12} className="mr-1" /> Projecting $8k by year end</div>
      </DashboardCard>
      <DashboardCard title="Carbon Reduction" mainValue="6.8 Tons" icon={Leaf} color="blue" subValue="CO2 Emissions">
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">Equivalent to planting 112 trees</div>
      </DashboardCard>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800 dark:text-white">Optimization Impact (24h)</h3>
          <div className="flex space-x-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-slate-400 mr-2"></div>Baseline</div>
            <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-purple-600 mr-2"></div>With AI</div>
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_AI_DATA.optimizationTrend}>
              <defs><linearGradient id="colorOptimised" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="name" fontSize={12} tick={{fill: 'var(--chart-text)'}} axisLine={false} tickLine={false} />
              <YAxis fontSize={12} tick={{fill: 'var(--chart-text)'}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{backgroundColor: 'var(--tooltip-bg)', border: 'none', borderRadius: '8px', color: 'var(--tooltip-text)'}} />
              <Area type="monotone" dataKey="baseline" stroke="#9ca3af" fill="transparent" strokeDasharray="5 5" strokeWidth={2} name="Baseline Usage" />
              <Area type="monotone" dataKey="optimised" stroke="#8b5cf6" fill="url(#colorOptimised)" strokeWidth={3} name="Optimised Usage" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Recent Autonomous Actions</h3>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {MOCK_AI_DATA.recentActions.map((action) => (
            <div key={action.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-start mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${action.type === 'Cooling' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : action.type === 'Lighting' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300'}`}>{action.type}</span>
                <span className="text-[10px] text-slate-400">{action.time}</span>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 font-medium mb-1">{action.message}</p>
              <div className="text-[10px] text-green-600 dark:text-green-400 font-bold flex items-center"><ArrowDownRight size={10} className="mr-1" /> Impact: {action.impact}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default AIAnalytics;