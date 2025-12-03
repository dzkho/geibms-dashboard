import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Zap, Droplets, Cpu, ChevronDown, ChevronRight, Check,
  Search, Bell, Filter, Calendar, BarChart3, Download, X, LogOut, Map, FileText, Wind, Thermometer,
  ArrowUpRight, ArrowDownRight, Activity, DollarSign, AlertTriangle, Table, CheckCircle, List, Grid, Info,
  Power, Settings, Plus, Trash2, Save, PlayCircle, ToggleLeft, ToggleRight, Clock, MoreHorizontal, XCircle,
  Snowflake, Fan, Link as LinkIcon, ExternalLink, Brain, Leaf, TrendingUp, Moon, Sun, Lightbulb, Sliders
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, BarChart, Bar
} from 'recharts';

// --- MOCK DATA & GENERATORS ---

const DEVICES = [
  { id: 'd1', name: 'FCU-Level1-01', type: 'energy', color: '#3b82f6', status: 'active' },
  { id: 'd2', name: 'FCU-Level1-02', type: 'energy', color: '#10b981', status: 'active' },
  { id: 'd3', name: 'Lighting-Zone-A', type: 'energy', color: '#f59e0b', status: 'active' },
  { id: 'd4', name: 'Main-Chiller', type: 'energy', color: '#6366f1', status: 'warning' },
  { id: 'w1', name: 'Water-Meter-01', type: 'water', color: '#0ea5e9', status: 'active' },
  { id: 'w2', name: 'Water-Meter-02', type: 'water', color: '#8b5cf6', status: 'active' },
  { id: 'w3', name: 'Kitchen-Main', type: 'water', color: '#ec4899', status: 'critical' },
];

const MOCK_DEVICE_STATS = [
  { id: 'd1', name: 'FCU-Level1-01', type: 'FCU', location: 'Level 1', total: '45000', usageToday: '45', usageMonth: '1,200', usageYTD: '14,500', rate: '2.1', unit: 'kWh', status: 'Normal' },
  { id: 'd2', name: 'FCU-Level1-02', type: 'FCU', location: 'Level 1', total: '42100', usageToday: '42', usageMonth: '1,150', usageYTD: '13,800', rate: '1.9', unit: 'kWh', status: 'Normal' },
  { id: 'd3', name: 'Lighting-Zone-A', type: 'Lighting', location: 'Zone A', total: '15400', usageToday: '12', usageMonth: '360', usageYTD: '4,100', rate: '0.5', unit: 'kWh', status: 'Optimised' },
  { id: 'd4', name: 'Main-Chiller', type: 'Chiller', location: 'Basement', total: '180000', usageToday: '180', usageMonth: '5,400', usageYTD: '62,000', rate: '15.0', unit: 'kWh', status: 'High Load' },
  { id: 'w1', name: 'Water-Meter-01', type: 'Meter', location: 'Annex', total: '450', usageToday: '1.2', usageMonth: '35', usageYTD: '380', rate: '50', unit: 'm³', status: 'Normal' },
  { id: 'w2', name: 'Water-Meter-02', type: 'Meter', location: 'Lobby', total: '320', usageToday: '0.8', usageMonth: '22', usageYTD: '210', rate: '35', unit: 'm³', status: 'Normal' },
  { id: 'w3', name: 'Kitchen-Main', type: 'Meter', location: 'Kitchen', total: '1500', usageToday: '4.5', usageMonth: '130', usageYTD: '1,100', rate: '180', unit: 'm³', status: 'Leak Suspected' },
];

const MOCK_LOGS = [
  { id: 1, timestamp: '10:30 AM', system: 'Energy', device: 'FCU-Level1-01', message: 'High Power Draw', status: 'Critical', type: 'fault' },
  { id: 2, timestamp: '11:00 AM', system: 'Water', device: 'Water-Meter-01', message: 'Flow anomaly', status: 'Warning', type: 'fault' },
  { id: 3, timestamp: '11:45 AM', system: 'Automation', device: 'Chiller-01', message: 'Routine Optimization', status: 'Success', type: 'schedule' },
  { id: 4, timestamp: '09:15 AM', system: 'Energy', device: 'Lighting-Zone-B', message: 'Circuit Breaker Trip', status: 'Down', type: 'fault' },
  { id: 5, timestamp: '08:00 AM', system: 'Water', device: 'Kitchen-Main', message: 'Continuous Flow > 2h', status: 'Leakage', type: 'fault' },
  { id: 6, timestamp: 'Yesterday', system: 'Energy', device: 'Main-Chiller', message: 'Power Surge Detected', status: 'Critical', type: 'fault' },
];

const MOCK_AUTOMATION_LOGS = [
  { id: 101, timestamp: '10:05 AM', device: 'FCU-Cassette-03', action: 'Fan Speed -> High', trigger: 'Rule: Temp > 27°C', status: 'Executed' },
  { id: 102, timestamp: '09:00 AM', device: 'Lighting-Zone-A', action: 'Power -> Off', trigger: 'Schedule: Work Hours End', status: 'Executed' },
  { id: 103, timestamp: '08:30 AM', device: 'FCU-Cassette-01', action: 'Set Temp -> 24°C', trigger: 'Manual Override', status: 'Executed' },
  { id: 104, timestamp: '07:00 AM', device: 'System', action: 'Morning Startup', trigger: 'Schedule: Daily', status: 'Executed' },
];

const MOCK_SCHEDULE_LOGS = [
  { id: 201, timestamp: '08:00 AM', scheduleName: 'Morning Start', devices: 'All FCUs', action: 'Power ON, Temp 24°C', status: 'Success' },
  { id: 202, timestamp: '12:00 PM', scheduleName: 'Lunch Optimization', devices: 'Canteen FCUs', action: 'Fan High', status: 'Pending' },
  { id: 203, timestamp: '06:00 PM', scheduleName: 'Evening Shutdown', devices: 'Office Zones', action: 'Power OFF', status: 'Scheduled' },
  { id: 204, timestamp: 'Yesterday', scheduleName: 'Night Security', devices: 'Lighting Perimeter', action: 'Brightness 100%', status: 'Success' },
];

const MOCK_RULES = [
  { id: 1, name: 'High Temp Protocol', condition: 'Temp > 28°C', action: 'Set Fan to High', status: true },
  { id: 2, name: 'Energy Saver Mode', condition: 'Power > 500kW', action: 'Set Temp to 25°C', status: true },
  { id: 3, name: 'Night Shift', condition: 'Time = 22:00', action: 'Turn Off Lights', status: false },
];

const MOCK_AI_DATA = {
  optimizationTrend: [
    { name: '00:00', baseline: 120, optimised: 110 },
    { name: '04:00', baseline: 115, optimised: 105 },
    { name: '08:00', baseline: 350, optimised: 280 }, 
    { name: '12:00', baseline: 480, optimised: 390 }, 
    { name: '16:00', baseline: 420, optimised: 350 }, 
    { name: '20:00', baseline: 200, optimised: 180 }, 
    { name: '23:59', baseline: 130, optimised: 120 }
  ],
  monthlySavings: [
    { name: 'Jan', value: 350 }, { name: 'Feb', value: 420 }, { name: 'Mar', value: 450 },
    { name: 'Apr', value: 380 }, { name: 'May', value: 510 }, { name: 'Jun', value: 600 }
  ],
  recentActions: [
    { id: 1, time: '10:15 AM', type: 'Cooling', message: 'Pre-cooled Canteen 20mins early based on occupancy forecast.', impact: '-12% Energy' },
    { id: 2, time: '02:30 PM', type: 'Lighting', message: 'Dimmed perimeter lights due to high natural light.', impact: '-5% Energy' },
    { id: 3, time: 'Yesterday', type: 'Maintenance', message: 'Detected efficiency drop in Chiller-02. Scheduled check.', impact: 'Preventive' }
  ]
};

const FLOORPLAN_DEVICES = [
  { id: 'd1', x: 20, y: 30, status: 'normal', label: 'AC-01', statsId: 'd1' },
  { id: 'd2', x: 50, y: 50, status: 'warning', label: 'Main Meter', statsId: 'd2' },
  { id: 'd3', x: 70, y: 20, status: 'normal', label: 'Lighting', statsId: 'd3' },
  { id: 'w1', x: 30, y: 70, status: 'critical', label: 'Water-M1', statsId: 'w1' },
];

const INITIAL_FCUS = Array.from({ length: 10 }, (_, i) => {
  const temp = 18 + Math.random() * 12; 
  return {
    id: `fcu-${i + 1}`,
    name: `FCU-0${i + 1}`,
    currentTemp: temp.toFixed(1),
    setTemp: 24,
    fanSpeed: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
    controlMode: 'Cooling', 
    powerUsage: (1.2 + Math.random() * 0.5).toFixed(2), 
    isOn: Math.random() > 0.2, 
    mode: Math.random() > 0.5 ? 'Optimised' : 'Manual',
    activeRules: Math.floor(Math.random() * 3),
    activeSchedules: Math.floor(Math.random() * 2),
    x: (i % 5) * 20 + 10,
    y: Math.floor(i / 5) * 40 + 30 
  };
});

const INITIAL_LIGHTS = Array.from({ length: 5 }, (_, i) => ({
  id: `light-${i + 1}`,
  name: `Light Zone 0${i + 1}`,
  brightness: 100, 
  isOn: true,
  mode: 'Auto',
  powerUsage: 0.4,
  activeRules: 1,
  activeSchedules: 1,
  x: i * 20 + 5,
  bulbs: Array.from({ length: 5 }, (_, j) => ({ y: j * 18 + 15 }))
}));

// --- HELPERS ---

const generateChartData = (range, selectedDeviceIds) => {
  let labels = [];
  if (range === 'Day') labels = Array.from({length:24}, (_,i) => `${i}:00`);
  else if (range === 'Week') labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  else if (range === 'Month') labels = Array.from({length:30}, (_,i) => `Day ${i+1}`);
  else if (range === 'Year') labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return labels.map(label => {
    const point = { name: label };
    selectedDeviceIds.forEach(id => {
      point[id] = Math.floor(Math.random() * 50) + 20;
    });
    return point;
  });
};

const getTempColor = (temp) => {
  const t = parseFloat(temp);
  if (t <= 19) return 'rgb(59, 130, 246)'; 
  if (t >= 28) return 'rgb(239, 68, 68)'; 
  
  if (t < 25) {
    const ratio = (t - 19) / 6;
    const r = 59 + (34 - 59) * ratio;
    const g = 130 + (197 - 130) * ratio;
    const b = 246 + (94 - 246) * ratio;
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  } else {
    const ratio = (t - 25) / 3;
    const r = 34 + (239 - 34) * ratio;
    const g = 197 + (68 - 197) * ratio;
    const b = 94 + (68 - 94) * ratio;
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }
};

// --- REUSABLE COMPONENTS ---

const DashboardCard = ({ title, mainValue, subValue, icon: Icon, color, onClick, children }) => (
  <div onClick={onClick} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer relative group">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${color === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : color === 'green' ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : color === 'purple' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'}`}>
          <Icon size={20} />
        </div>
        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-tight">{title}</h3>
      </div>
      <ArrowUpRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
    </div>
    <div className="space-y-4">
      {mainValue && (
        <div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{mainValue}</div>
          {subValue && <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subValue}</div>}
        </div>
      )}
      {children}
    </div>
  </div>
);

const MultiDeviceSelect = ({ devices, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSelection = (id) => {
    const newSelection = selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id];
    onChange(newSelection);
  };

  return (
    <div className="relative z-20">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-sm">
        <Filter size={16} className="text-slate-500 dark:text-slate-400" />
        <span>Select Devices ({selected.length})</span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-20">
            <div className="max-h-60 overflow-y-auto space-y-1">
              {devices.map(device => (
                <div key={device.id} onClick={() => toggleSelection(device.id)} className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${selected.includes(device.id) ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: device.color }}></div>
                    <span>{device.name}</span>
                  </div>
                  {selected.includes(device.id) && <Check size={14} className="text-blue-600 dark:text-blue-400" />}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const TimeToggle = ({ active, onChange }) => (
  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
    {['Day', 'Week', 'Month', 'Year'].map(opt => (
      <button key={opt} onClick={() => onChange(opt)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${active === opt ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
        {opt}
      </button>
    ))}
  </div>
);

// --- MODULE COMPONENTS ---

const AIAnalyticsModule = () => (
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

const ModuleOverview = ({ type }) => {
  const isEnergy = type === 'energy';
  const unit = isEnergy ? 'kWh' : 'kL';
  const color = isEnergy ? 'orange' : 'blue';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Usage Today" mainValue={isEnergy ? "320 kWh" : "4.5 kL"} icon={Zap} color={color} subValue="vs yesterday: +2.1%">
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden"><div className={`h-full ${isEnergy ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: '65%' }}></div></div>
        </DashboardCard>
        <DashboardCard title="Usage This Month" mainValue={isEnergy ? "12,450 kWh" : "320 kL"} icon={Calendar} color={color} subValue="Proj. Month End: +5%"><div className="text-xs text-slate-500 dark:text-slate-400 mt-2">Daily Avg: {isEnergy ? "415 kWh" : "10.6 kL"}</div></DashboardCard>
        <DashboardCard title="Highest Device" mainValue={isEnergy ? "Chiller-01" : "Kitchen-Main"} icon={Activity} color="purple">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{isEnergy ? "450 kWh / day" : "1.8 kL / day"}</div>
          <div className="text-xs text-red-500 mt-1 flex items-center"><ArrowUpRight size={12} className="mr-1"/> 12% above average</div>
        </DashboardCard>
        <DashboardCard title="Efficiency Status" mainValue="Optimised" icon={CheckCircle} color="green">
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">92% Efficiency Score</div>
          <div className="text-xs text-slate-400 mt-1">Last audit: 2 days ago</div>
        </DashboardCard>
      </div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{isEnergy ? "Power" : "Water"} Consumption Trend</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={generateChartData('Month', ['d1'])}>
              <defs>
                <linearGradient id={`grad${type}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isEnergy ? "#f97316" : "#3b82f6"} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={isEnergy ? "#f97316" : "#3b82f6"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="name" fontSize={12} tick={{fill: 'var(--chart-text)'}} axisLine={false} tickLine={false} />
              <YAxis fontSize={12} tick={{fill: 'var(--chart-text)'}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{backgroundColor: 'var(--tooltip-bg)', border: 'none', borderRadius: '8px', color: 'var(--tooltip-text)'}} />
              <Area 
                type="monotone" 
                dataKey="d1" 
                stroke={isEnergy ? "#f97316" : "#3b82f6"} 
                fill={`url(#grad${type})`} 
                strokeWidth={2}
                name={unit}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const DataLogPage = ({ type }) => {
  const [activeTab, setActiveTab] = useState('data'); 
  const isEnergy = type === 'energy';
  const devices = MOCK_DEVICE_STATS.filter(d => isEnergy ? DEVICES.find(x => x.id === d.id)?.type === 'energy' : DEVICES.find(x => x.id === d.id)?.type === 'water');
  const faults = MOCK_LOGS.filter(l => l.system.toLowerCase() === type && l.type === 'fault');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{isEnergy ? 'Energy' : 'Water'} Data Logs</h2>
        <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
           <button onClick={() => setActiveTab('data')} className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'data' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><List size={16} className="mr-2" /> Usage Data</button>
           <button onClick={() => setActiveTab('fault')} className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'fault' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><AlertTriangle size={16} className="mr-2" /> Fault Logs</button>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-4">
             <div className="relative"><Search size={14} className="absolute left-3 top-2.5 text-slate-400" /><input type="text" placeholder="Search logs..." className="pl-9 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 dark:text-white" /></div>
             <button className="flex items-center text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600"><Filter size={14} className="mr-2" /> Filter</button>
          </div>
          <button className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-2 rounded-lg transition-colors"><Download size={14} className="mr-2" /> Export CSV</button>
        </div>
        {activeTab === 'data' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold uppercase text-xs">
                {isEnergy ? (
                  <tr><th className="px-6 py-4">Device</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Location</th><th className="px-6 py-4 text-right">Accumulative Today (kWh)</th><th className="px-6 py-4 text-right">Accumulative This Month (kWh)</th><th className="px-6 py-4">Power Meter Status</th></tr>
                ) : (
                  <tr><th className="px-6 py-4">Device</th><th className="px-6 py-4 text-right">Total Consumption (m³)</th><th className="px-6 py-4 text-right">Daily Consumption (m³)</th><th className="px-6 py-4 text-right">Monthly Consumption (m³)</th></tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {devices.map((device, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{device.name}</td>
                    {isEnergy ? (
                      <>
                        <td className="px-6 py-4">{device.type}</td><td className="px-6 py-4">{device.location}</td><td className="px-6 py-4 text-right font-mono">{device.usageToday}</td><td className="px-6 py-4 text-right font-mono">{device.usageMonth}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${device.status === 'Normal' || device.status === 'Optimised' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>{device.status}</span></td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-right font-mono">{device.total}</td><td className="px-6 py-4 text-right font-mono">{device.usageToday}</td><td className="px-6 py-4 text-right font-mono">{device.usageMonth}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'fault' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200 font-semibold uppercase text-xs">
                <tr><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4">Device</th><th className="px-6 py-4">Fault Description</th><th className="px-6 py-4">Severity</th><th className="px-6 py-4">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {faults.length > 0 ? faults.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{log.timestamp}</td><td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{log.device}</td><td className="px-6 py-4">{log.message}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${log.status === 'Critical' || log.status === 'Leakage' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>{log.status}</span></td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-400">Unresolved</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">No active faults detected.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const DeviceInfoGrid = ({ type }) => {
  const isEnergy = type === 'energy';
  const devices = MOCK_DEVICE_STATS.filter(d => isEnergy ? DEVICES.find(x => x.id === d.id)?.type === 'energy' : DEVICES.find(x => x.id === d.id)?.type === 'water');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {devices.map((device, idx) => (
        <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className={`h-2 w-full ${isEnergy ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                {isEnergy ? <Zap size={20} className="text-orange-500" /> : <Droplets size={20} className="text-blue-500" />}
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${device.status === 'Normal' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                {device.status}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{device.name}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between pb-2 border-b border-slate-50 dark:border-slate-700"><span className="text-slate-500 dark:text-slate-400">Total Consumption</span><span className="font-semibold text-slate-900 dark:text-white">{device.total} {device.unit}</span></div>
              <div className="flex justify-between pb-2 border-b border-slate-50 dark:border-slate-700"><span className="text-slate-500 dark:text-slate-400">Consumption (Daily)</span><span className="font-semibold text-slate-900 dark:text-white">{device.usageToday} {device.unit}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Consumption (Monthly)</span><span className="font-semibold text-slate-900 dark:text-white">{device.usageMonth} {device.unit}</span></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const FloorplanView = ({ system }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-[600px] flex flex-col relative">
    <div className="relative flex-1 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden h-full">
      <div className="absolute inset-0 opacity-10 dark:opacity-5" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-10 left-10 right-10 bottom-10 border-4 border-slate-300 dark:border-slate-600 pointer-events-none"></div>
      <div className="absolute top-10 left-1/3 bottom-10 w-4 bg-slate-300 dark:bg-slate-600 pointer-events-none"></div>
      {FLOORPLAN_DEVICES.filter(d => {
          const dev = MOCK_DEVICE_STATS.find(s => s.id === d.statsId);
          if (!dev) return false;
          const isEnergyDevice = dev.unit === 'kWh';
          return system === 'Energy' ? isEnergyDevice : !isEnergyDevice;
        }).map((device) => {
          let color = 'bg-green-500';
          if (device.status === 'warning') color = 'bg-orange-500';
          if (device.status === 'critical') color = 'bg-red-500';
          const stats = MOCK_DEVICE_STATS.find(s => s.id === device.statsId);
          return (
            <div key={device.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer" style={{ left: `${device.x}%`, top: `${device.y}%` }}>
              <div className={`w-4 h-4 rounded-full ${color} ring-4 ring-white dark:ring-slate-700 shadow-lg animate-pulse`}></div>
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-slate-200 dark:border-slate-700 shadow-xl w-48 overflow-hidden pointer-events-none">
                <div className="bg-slate-900 dark:bg-slate-700 text-white px-3 py-2 font-bold">{device.label}</div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-1"><span className="text-slate-500 dark:text-slate-400">Rate</span><span className="font-semibold">{stats?.rate} /h</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Daily</span><span className="font-semibold">{stats?.usageToday} {stats?.unit}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Monthly</span><span className="font-semibold">{stats?.usageMonth} {stats?.unit}</span></div>
                  <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-700"><span className="text-slate-500 dark:text-slate-400">YTD</span><span className="font-bold text-blue-600 dark:text-blue-400">{stats?.usageYTD} {stats?.unit}</span></div>
                </div>
              </div>
            </div>
          );
      })}
    </div>
  </div>
);

const DeviceInfoPage = ({ type }) => {
  const [activeTab, setActiveTab] = useState('floorplan');
  const isEnergy = type === 'energy';
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{isEnergy ? 'Energy' : 'Water'} Device Info</h2>
        <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
           <button onClick={() => setActiveTab('floorplan')} className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'floorplan' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Map size={16} className="mr-2" /> Map View</button>
           <button onClick={() => setActiveTab('info')} className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'info' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Grid size={16} className="mr-2" /> List View</button>
        </div>
      </div>
      {activeTab === 'floorplan' ? <FloorplanView system={isEnergy ? 'Energy' : 'Water'} /> : <DeviceInfoGrid type={type} />}
    </div>
  );
};

const AutomationLogsPage = () => {
  const [activeTab, setActiveTab] = useState('activity');
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Automation Logs</h2>
        <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
           <button onClick={() => setActiveTab('activity')} className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'activity' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><List size={16} className="mr-2" /> Activity History</button>
           <button onClick={() => setActiveTab('schedule')} className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'schedule' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Clock size={16} className="mr-2" /> Schedule Logs</button>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            {activeTab === 'activity' ? (
              <>
                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold uppercase text-xs">
                  <tr><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4">Trigger Source</th><th className="px-6 py-4">Action Taken</th><th className="px-6 py-4">Target Device</th><th className="px-6 py-4">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {MOCK_AUTOMATION_LOGS.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{log.timestamp}</td>
                      <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800">{log.trigger}</span></td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{log.action}</td>
                      <td className="px-6 py-4">{log.device}</td>
                      <td className="px-6 py-4"><span className="inline-flex items-center text-green-600 dark:text-green-400 text-xs font-bold"><CheckCircle size={12} className="mr-1" /> {log.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </>
            ) : (
              <>
                <thead className="bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200 font-semibold uppercase text-xs">
                  <tr><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4">Schedule Name</th><th className="px-6 py-4">Target Group</th><th className="px-6 py-4">Action</th><th className="px-6 py-4">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {MOCK_SCHEDULE_LOGS.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{log.timestamp}</td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{log.scheduleName}</td>
                      <td className="px-6 py-4">{log.devices}</td>
                      <td className="px-6 py-4">{log.action}</td>
                      <td className="px-6 py-4"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${log.status === 'Success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : log.status === 'Pending' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>{log.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

const HeatmapVisual = ({ fcus, lights }) => (
  <div className="relative flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-inner z-0 overflow-visible h-full">
    <div className="absolute inset-0 p-8 pointer-events-none opacity-20 dark:opacity-10 dark:invert">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="stroke-slate-900 stroke-2 fill-none">
        <rect x="0" y="0" width="100" height="100" strokeWidth="4" />
        <rect x="0" y="0" width="20" height="100" fill="url(#hatch)" strokeWidth="1" />
        <text x="10" y="50" transform="rotate(-90, 10, 50)" fontSize="3" textAnchor="middle" fill="#333" stroke="none">KITCHEN AREA</text>
        <rect x="22" y="10" width="5" height="80" rx="1" strokeWidth="1" fill="#f3f4f6" />
        <text x="24.5" y="50" transform="rotate(-90, 24.5, 50)" fontSize="2" textAnchor="middle" fill="#666" stroke="none">SERVING COUNTER</text>
        <g>
            <circle cx="45" cy="30" r="4" strokeWidth="1" />
            <circle cx="70" cy="30" r="4" strokeWidth="1" />
            <circle cx="90" cy="30" r="4" strokeWidth="1" />
            <circle cx="55" cy="70" r="4" strokeWidth="1" />
            <circle cx="80" cy="70" r="4" strokeWidth="1" />
        </g>
        <defs>
          <pattern id="hatch" width="2" height="2" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="2" style={{stroke:'black', strokeWidth:0.1}} />
          </pattern>
        </defs>
      </svg>
    </div>

    {/* RENDER LIGHTS (Vertical Columns) */}
    {lights.map((zone) => (
      zone.bulbs.map((bulb, idx) => (
        <div key={`${zone.id}-${idx}`} className="absolute transform -translate-x-1/2 -translate-y-1/2 group" style={{ left: `${zone.x}%`, top: `${bulb.y}%` }}>
          {/* Light Glow */}
          <div 
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full pointer-events-none transition-all duration-500`}
            style={{ 
              background: `radial-gradient(circle, ${zone.isOn ? (zone.brightness > 50 ? 'rgba(250, 204, 21, 0.4)' : 'rgba(251, 146, 60, 0.3)') : 'transparent'} 0%, transparent 70%)` 
            }}
          ></div>
          
          {/* Light Icon */}
          <div className={`w-3 h-3 rounded-full flex items-center justify-center relative z-10 ${zone.isOn ? (zone.brightness > 80 ? 'bg-yellow-400 shadow-lg shadow-yellow-300' : 'bg-orange-300') : 'bg-slate-400'} ${zone.updated ? 'scale-150 ring-2 ring-yellow-200' : ''} transition-all`}>
          </div>

          {/* Light Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-40 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-yellow-500 text-white px-2 py-1 font-bold">{zone.name}</div>
            <div className="p-2 space-y-1">
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">State</span><span className="font-semibold">{zone.isOn ? 'ON' : 'OFF'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Bright</span><span className="font-semibold">{zone.brightness}%</span></div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-700 pt-1 mt-1"><span className="text-slate-500 dark:text-slate-400">Sched</span><span className="font-mono">{zone.activeSchedules} Active</span></div>
            </div>
          </div>
        </div>
      ))
    ))}

    {/* RENDER FCUs */}
    {fcus.map((fcu) => {
      const color = getTempColor(fcu.currentTemp);
      return (
        <div key={fcu.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 group" style={{ left: `${fcu.x}%`, top: `${fcu.y}%` }}>
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none opacity-60 mix-blend-multiply dark:mix-blend-screen transition-all duration-1000 ${fcu.updated ? 'scale-125 opacity-90' : ''}`} style={{ background: `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0) 70%)` }}></div>
          <div className={`w-8 h-8 bg-slate-900 dark:bg-slate-700 rounded border-2 border-white dark:border-slate-500 flex items-center justify-center shadow-md relative z-10 cursor-pointer hover:scale-110 transition-transform ${fcu.updated ? 'ring-4 ring-blue-300 scale-110' : ''}`}>
            {fcu.controlMode === 'Cooling' ? <Snowflake size={14} className="text-white" /> : <Fan size={14} className="text-white" />}
          </div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-48 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-slate-900 dark:bg-slate-700 text-white px-3 py-2 font-bold truncate flex justify-between">
              <span>{fcu.name}</span>
              <span style={{ color: color }}>{Math.round(fcu.currentTemp)}°C</span>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Mode</span><span className="font-semibold">{fcu.mode}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Ctrl Mode</span><span className="font-semibold text-blue-600 dark:text-blue-400">{fcu.controlMode}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Set Temp</span><span className="font-semibold">{fcu.setTemp}°C</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Fan Speed</span><span className="font-semibold">{fcu.fanSpeed}</span></div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-700 pt-2 mt-1"><span className="text-slate-500 dark:text-slate-400 flex items-center"><Zap size={10} className="mr-1"/> Power</span><span className="font-mono">{fcu.powerUsage} kW</span></div>
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white dark:bg-slate-800"></div>
          </div>
        </div>
      );
    })}
  </div>
);

const AutomationOverview = ({ navigate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [subView, setSubView] = useState('heatmap');
  const [fcus, setFcus] = useState(INITIAL_FCUS);
  const [lights, setLights] = useState(INITIAL_LIGHTS);
  const [rules, setRules] = useState(MOCK_RULES);
  const [activeControlTab, setActiveControlTab] = useState('ac');
  const [activeStatusTab, setActiveStatusTab] = useState('ac');
  const [controlModalOpen, setControlModalOpen] = useState(false);
  const [selectedDeviceType, setSelectedDeviceType] = useState('ac');
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [tempSetting, setTempSetting] = useState(24);
  const [modeSetting, setModeSetting] = useState('Cooling');
  const [fanSetting, setFanSetting] = useState('Medium');
  const [brightnessSetting, setBrightnessSetting] = useState(100);
  const [showSuggestion, setShowSuggestion] = useState(false);

  const toggleFcuPower = (id) => setFcus(prev => prev.map(f => f.id === id ? { ...f, isOn: !f.isOn } : f));
  const updateFcuSetting = (id, field, value) => setFcus(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  const toggleLightPower = (id) => setLights(prev => prev.map(l => l.id === id ? { ...l, isOn: !l.isOn } : l));
  const updateLightBrightness = (id, value) => setLights(prev => prev.map(l => l.id === id ? { ...l, brightness: value, isOn: value > 0 } : l));
  const toggleRule = (id) => setRules(prev => prev.map(r => r.id === id ? { ...r, status: !r.status } : r));

  const openControlModal = (id, type) => {
    setSelectedDeviceType(type);
    setSelectedDeviceId(id);
    if (type === 'ac') {
      const fcu = fcus.find(f => f.id === id);
      if (fcu) { setTempSetting(fcu.setTemp); setModeSetting(fcu.controlMode); setFanSetting(fcu.fanSpeed); }
    } else {
      const light = lights.find(l => l.id === id);
      if (light) setBrightnessSetting(light.brightness);
    }
    setControlModalOpen(true);
    setShowSuggestion(false);
  };

  const applyControlSettings = () => {
    if (selectedDeviceType === 'ac') {
      setFcus(prev => prev.map(f => f.id === selectedDeviceId ? { ...f, setTemp: tempSetting, currentTemp: tempSetting, controlMode: modeSetting, fanSpeed: fanSetting, mode: 'Manual', updated: true } : f));
      setTimeout(() => setFcus(prev => prev.map(f => ({ ...f, updated: false }))), 2000);
    } else {
      setLights(prev => prev.map(l => l.id === selectedDeviceId ? { ...l, brightness: brightnessSetting, isOn: brightnessSetting > 0, mode: 'Manual', updated: true } : l));
      setTimeout(() => setLights(prev => prev.map(l => ({ ...l, updated: false }))), 2000);
    }
    setControlModalOpen(false);
    setShowSuggestion(true);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Automation Overview</h2>
        <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm self-start">
           <button onClick={() => setActiveTab('overview')} className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Map size={16} className="mr-2" /> Overview</button>
           <button onClick={() => setActiveTab('control')} className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'control' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Settings size={16} className="mr-2" /> Manual Control</button>
           <button onClick={() => setActiveTab('rules')} className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'rules' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><PlayCircle size={16} className="mr-2" /> Smart Rules</button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-700">
            <button onClick={() => setSubView('heatmap')} className={`pb-2 text-sm font-medium transition-colors border-b-2 ${subView === 'heatmap' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Heatmap View</button>
            <button onClick={() => setSubView('realtime')} className={`pb-2 text-sm font-medium transition-colors border-b-2 ${subView === 'realtime' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Real Time Status</button>
          </div>

          <div className="h-[600px] bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
             {subView === 'heatmap' ? <HeatmapVisual fcus={fcus} lights={lights} /> : (
                <div className="flex flex-col h-full">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button onClick={() => setActiveStatusTab('ac')} className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${activeStatusTab === 'ac' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>AC Units</button>
                      <button onClick={() => setActiveStatusTab('lighting')} className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${activeStatusTab === 'lighting' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Lighting</button>
                    </div>
                    <div className="flex space-x-2 text-xs"><span className="flex items-center px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded"><CheckCircle size={12} className="mr-1"/> Optimised</span><span className="flex items-center px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded"><Settings size={12} className="mr-1"/> Manual</span></div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                      <thead className="bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold uppercase text-xs sticky top-0 z-10">
                        <tr><th className="px-6 py-3">Device Name</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Mode</th><th className="px-6 py-3">{activeStatusTab === 'ac' ? 'Settings' : 'Brightness'}</th><th className="px-6 py-3">Logic Active</th><th className="px-6 py-3">Action</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {activeStatusTab === 'ac' ? fcus.map(fcu => (
                          <tr key={fcu.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${fcu.updated ? 'bg-blue-50 dark:bg-blue-900/20 animate-pulse' : ''}`}>
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{fcu.name}</td>
                            <td className="px-6 py-4"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${fcu.isOn ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>{fcu.isOn ? 'ON' : 'OFF'}</span></td>
                            <td className="px-6 py-4"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${fcu.mode === 'Optimised' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>{fcu.mode}</span></td>
                            <td className="px-6 py-4 font-mono">{fcu.currentTemp}°C / {fcu.controlMode}</td>
                            <td className="px-6 py-4"><div className="flex space-x-2"><span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{fcu.activeRules} Rules</span></div></td>
                            <td className="px-6 py-4"><button onClick={() => openControlModal(fcu.id, 'ac')} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-xs border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30">Control</button></td>
                          </tr>
                        )) : lights.map(light => (
                          <tr key={light.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${light.updated ? 'bg-yellow-50 dark:bg-yellow-900/20 animate-pulse' : ''}`}>
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{light.name}</td>
                            <td className="px-6 py-4"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${light.isOn ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>{light.isOn ? 'ON' : 'OFF'}</span></td>
                            <td className="px-6 py-4"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">{light.mode}</span></td>
                            <td className="px-6 py-4 font-mono">{light.brightness}%</td>
                            <td className="px-6 py-4"><div className="flex space-x-2"><span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{light.activeRules} Rules</span></div></td>
                            <td className="px-6 py-4"><button onClick={() => openControlModal(light.id, 'lighting')} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-xs border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30">Control</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
             )}
          </div>

          {/* Quick Manual Controls Grid */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center"><Settings size={18} className="mr-2 text-slate-500" /> Quick Device Controls</h3>
              <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                <button onClick={() => setActiveControlTab('ac')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeControlTab === 'ac' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>AC Units</button>
                <button onClick={() => setActiveControlTab('lighting')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeControlTab === 'lighting' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>Lighting</button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {activeControlTab === 'ac' ? fcus.map(fcu => (
                <div key={fcu.id} className={`bg-white dark:bg-slate-800 rounded-lg border p-3 transition-all ${fcu.isOn ? 'border-slate-200 dark:border-slate-600 shadow-sm' : 'border-slate-100 dark:border-slate-700 opacity-60'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate w-24" title={fcu.name}>{fcu.name}</span>
                    <button onClick={() => toggleFcuPower(fcu.id)} className={`p-1 rounded-full ${fcu.isOn ? 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400' : 'text-slate-400 bg-slate-100 dark:bg-slate-700 dark:text-slate-500'}`}><Power size={14} /></button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs"><span className="text-slate-500 dark:text-slate-400">Temp</span><span className="font-mono font-medium text-slate-700 dark:text-slate-300">{fcu.setTemp}°C</span></div>
                    <input type="range" min="18" max="30" value={fcu.setTemp} disabled={!fcu.isOn} onChange={(e) => updateFcuSetting(fcu.id, 'setTemp', parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  </div>
                </div>
              )) : lights.map(light => (
                <div key={light.id} className={`bg-white dark:bg-slate-800 rounded-lg border p-3 transition-all ${light.isOn ? 'border-yellow-200 dark:border-yellow-900/50 shadow-sm' : 'border-slate-100 dark:border-slate-700 opacity-60'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate w-24">{light.name}</span>
                    <button onClick={() => toggleLightPower(light.id)} className={`p-1 rounded-full ${light.isOn ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400' : 'text-slate-400 bg-slate-100 dark:bg-slate-700 dark:text-slate-500'}`}><Power size={14} /></button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs"><span className="text-slate-500 dark:text-slate-400">Dimmer</span><span className="font-mono font-medium text-slate-700 dark:text-slate-300">{light.brightness}%</span></div>
                    <input type="range" min="0" max="100" value={light.brightness} disabled={!light.isOn} onChange={(e) => updateLightBrightness(light.id, parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-yellow-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Summary Bar */}
          <div className="grid grid-cols-4 gap-4">
            <div onClick={() => navigate('energy-datalogs')} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow group">
              <div><p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-blue-600 flex items-center">Active ACs <ExternalLink size={10} className="ml-1 opacity-0 group-hover:opacity-100" /></p><p className="text-xl font-bold text-slate-900 dark:text-white">{fcus.filter(f=>f.isOn).length} / {fcus.length}</p></div>
              <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg"><Power size={20}/></div>
            </div>
            <div onClick={() => setActiveControlTab('lighting')} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow group">
              <div><p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-yellow-600 flex items-center">Lighting Status <ExternalLink size={10} className="ml-1 opacity-0 group-hover:opacity-100" /></p><p className="text-xl font-bold text-slate-900 dark:text-white">{lights.filter(l=>l.isOn).length} Zones On</p></div>
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg"><Lightbulb size={20}/></div>
            </div>
            <div onClick={() => navigate('automation-logs')} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow group">
              <div><p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-blue-600 flex items-center">Active Schedules <ExternalLink size={10} className="ml-1 opacity-0 group-hover:opacity-100" /></p><p className="text-xl font-bold text-slate-900 dark:text-white">{fcus.reduce((acc, curr) => acc + curr.activeSchedules, 0)}</p></div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><Clock size={20}/></div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <div><p className="text-xs text-slate-500 dark:text-slate-400">Avg Temperature</p><p className="text-xl font-bold text-slate-900 dark:text-white">{(fcus.reduce((acc,curr)=>acc+parseFloat(curr.currentTemp),0)/fcus.length).toFixed(1)}°C</p></div>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg"><Thermometer size={20}/></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANUAL GRID CONTROL (FULL) */}
      {activeTab === 'control' && (
        <div className="space-y-6">
          <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-700">
             <button onClick={() => setActiveControlTab('ac')} className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeControlTab === 'ac' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400'}`}>AC Units</button>
             <button onClick={() => setActiveControlTab('lighting')} className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeControlTab === 'lighting' ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400' : 'border-transparent text-slate-500 dark:text-slate-400'}`}>Lighting</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeControlTab === 'ac' ? fcus.map(fcu => (
              <div key={fcu.id} className={`bg-white dark:bg-slate-800 rounded-xl border transition-all ${fcu.isOn ? 'border-slate-200 dark:border-slate-600 shadow-sm' : 'border-slate-100 dark:border-slate-700 shadow-none opacity-70'}`}>
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-700/30 rounded-t-xl">
                  <div className="flex items-center">
                    <div className={`p-1.5 rounded-lg mr-3 ${fcu.isOn ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}><Wind size={16} /></div>
                    <div><h3 className="text-sm font-bold text-slate-900 dark:text-white">{fcu.name}</h3><p className={`text-xs ${fcu.isOn ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>{fcu.isOn ? 'Active' : 'Offline'}</p></div>
                  </div>
                  <button onClick={() => toggleFcuPower(fcu.id)} className={`p-2 rounded-full transition-colors ${fcu.isOn ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 hover:bg-green-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 hover:bg-slate-300'}`}><Power size={18} /></button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2"><span className="text-xs text-slate-500 dark:text-slate-400 flex items-center"><Thermometer size={12} className="mr-1"/> Set Temp</span><span className="text-sm font-bold text-slate-900 dark:text-white">{fcu.setTemp}°C</span></div>
                    <input type="range" min="18" max="30" value={fcu.setTemp} disabled={!fcu.isOn} onChange={(e) => updateFcuSetting(fcu.id, 'setTemp', parseInt(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2"><span className="text-xs text-slate-500 dark:text-slate-400 flex items-center"><Activity size={12} className="mr-1"/> Fan Speed</span></div>
                    <div className="grid grid-cols-3 gap-2">
                      {['Low', 'Medium', 'High'].map(speed => (
                        <button key={speed} disabled={!fcu.isOn} onClick={() => updateFcuSetting(fcu.id, 'fanSpeed', speed)} className={`text-xs py-1.5 rounded border transition-colors ${fcu.fanSpeed === speed && fcu.isOn ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{speed}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )) : lights.map(light => (
              <div key={light.id} className={`bg-white dark:bg-slate-800 rounded-xl border transition-all ${light.isOn ? 'border-yellow-200 dark:border-yellow-900/50 shadow-sm' : 'border-slate-100 dark:border-slate-700 shadow-none opacity-70'}`}>
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-700/30 rounded-t-xl">
                  <div className="flex items-center">
                    <div className={`p-1.5 rounded-lg mr-3 ${light.isOn ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}><Lightbulb size={16} /></div>
                    <div><h3 className="text-sm font-bold text-slate-900 dark:text-white">{light.name}</h3><p className={`text-xs ${light.isOn ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>{light.isOn ? 'On' : 'Off'}</p></div>
                  </div>
                  <button onClick={() => toggleLightPower(light.id)} className={`p-2 rounded-full transition-colors ${light.isOn ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 hover:bg-slate-300'}`}><Power size={18} /></button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2"><span className="text-xs text-slate-500 dark:text-slate-400 flex items-center"><Sliders size={12} className="mr-1"/> Brightness</span><span className="text-sm font-bold text-slate-900 dark:text-white">{light.brightness}%</span></div>
                    <input type="range" min="0" max="100" value={light.brightness} disabled={!light.isOn} onChange={(e) => updateLightBrightness(light.id, parseInt(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-100 dark:border-purple-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center"><Plus size={20} className="mr-2 text-purple-600 dark:text-purple-400" /> Create New Automation Rule</h3>
            <div className="flex flex-col lg:flex-row items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="font-bold text-purple-700 dark:text-purple-400 px-2">IF</span>
              <select className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg p-2.5"><option>Temperature</option><option>Power Usage</option><option>Time of Day</option></select>
              <select className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg p-2.5"><option>Greater than</option><option>Less than</option><option>Equals</option></select>
              <input type="text" placeholder="Value (e.g., 25)" className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg p-2.5 w-32" />
              <span className="font-bold text-blue-600 dark:text-blue-400 px-2">THEN</span>
              <select className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg p-2.5"><option>Set Fan Speed</option><option>Set Temperature</option><option>Turn Off</option></select>
              <button className="ml-auto bg-slate-900 dark:bg-purple-600 text-white hover:bg-slate-800 font-medium rounded-lg text-sm px-5 py-2.5 flex items-center"><Save size={16} className="mr-2" /> Save Rule</button>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 font-bold text-slate-800 dark:text-white">Active Conditional Logic</div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {rules.map(rule => (
                <div key={rule.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${rule.status ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}><PlayCircle size={24} /></div>
                    <div><h4 className="text-sm font-bold text-slate-900 dark:text-white">{rule.name}</h4><div className="flex items-center text-xs mt-1 space-x-2"><span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded font-mono">IF {rule.condition}</span><span className="text-slate-400">→</span><span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-mono">THEN {rule.action}</span></div></div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button onClick={() => toggleRule(rule.id)} className={`text-2xl ${rule.status ? 'text-green-500' : 'text-slate-300 dark:text-slate-600'}`}>{rule.status ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}</button>
                    <button className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {controlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-96 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Control {selectedDeviceType === 'ac' ? 'AC Unit' : 'Lighting'}</h3>
              <button onClick={() => setControlModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
            </div>
            
            <div className="space-y-5">
              {selectedDeviceType === 'ac' ? (
                <>
                  <div>
                    <div className="text-center mb-2"><span className="text-5xl font-bold text-slate-900 dark:text-white">{tempSetting}°C</span><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Target Temperature</p></div>
                    <input type="range" min="18" max="30" value={tempSetting} onChange={(e) => setTempSetting(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 font-mono mt-1"><span>18°C</span><span>30°C</span></div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">Control Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setModeSetting('Cooling')} className={`flex items-center justify-center py-2 rounded-lg text-sm border ${modeSetting === 'Cooling' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-medium' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}><Snowflake size={14} className="mr-2" /> Cooling</button>
                      <button onClick={() => setModeSetting('Fan')} className={`flex items-center justify-center py-2 rounded-lg text-sm border ${modeSetting === 'Fan' ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 font-medium' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}><Fan size={14} className="mr-2" /> Fan Only</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">Fan Speed</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Low', 'Medium', 'High'].map(speed => (
                        <button key={speed} onClick={() => setFanSetting(speed)} className={`text-xs py-1.5 rounded border ${fanSetting === speed ? 'bg-slate-800 dark:bg-slate-600 text-white border-slate-800 dark:border-slate-600' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}>{speed}</button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-center mb-2"><span className="text-5xl font-bold text-slate-900 dark:text-white">{brightnessSetting}%</span><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Brightness Level</p></div>
                    <input type="range" min="0" max="100" value={brightnessSetting} onChange={(e) => setBrightnessSetting(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500" />
                    <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 font-mono mt-1"><span>0%</span><span>100%</span></div>
                  </div>
                </>
              )}
              <div className="pt-2 flex flex-col gap-2">
                <button onClick={applyControlSettings} className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none">Apply Changes</button>
                <button onClick={() => { setActiveTab('rules'); setControlModalOpen(false); }} className="w-full text-xs text-purple-600 dark:text-purple-400 font-medium py-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg flex items-center justify-center transition-colors"><LinkIcon size={12} className="mr-1" /> Add Conditional Logic (IFTTT)</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuggestion && (
        <div className="fixed bottom-8 right-8 z-50 bg-slate-900 dark:bg-slate-700 text-white p-4 rounded-xl shadow-2xl flex items-start max-w-sm animate-in slide-in-from-bottom-5 duration-300">
          <div className="mr-3 p-2 bg-purple-600 rounded-lg"><Zap size={18} /></div>
          <div>
            <h4 className="font-bold text-sm">Settings Applied</h4>
            <p className="text-xs text-slate-300 mt-1">Would you like to automate this logic for all devices?</p>
            <div className="flex mt-3 gap-2">
              <button onClick={() => { setActiveTab('rules'); setShowSuggestion(false); }} className="text-xs bg-white text-slate-900 px-3 py-1.5 rounded font-medium hover:bg-slate-100">Create Rule</button>
              <button onClick={() => setShowSuggestion(false)} className="text-xs text-slate-400 px-3 py-1.5 hover:text-white">Dismiss</button>
            </div>
          </div>
          <button onClick={() => setShowSuggestion(false)} className="ml-auto text-slate-500 hover:text-white"><X size={14} /></button>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [expandedMenus, setExpandedMenus] = useState({ energy: true, water: false, automation: false });
  const [timeRange, setTimeRange] = useState('Day');
  const [selectedDevices, setSelectedDevices] = useState(['d1', 'd2']);
  const [darkMode, setDarkMode] = useState(false);
  
  const [overviewType, setOverviewType] = useState('power'); 
  const [overviewRange, setOverviewRange] = useState('Day');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleMenu = (key) => setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));
  const chartData = useMemo(() => generateChartData(timeRange, selectedDevices), [timeRange, selectedDevices]);
  
  const availableDevices = useMemo(() => {
    if (currentView.includes('energy')) return DEVICES.filter(d => d.type === 'energy');
    if (currentView.includes('water')) return DEVICES.filter(d => d.type === 'water');
    return DEVICES;
  }, [currentView]);

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* CARD 1: Automation Efficiency */}
              <DashboardCard 
                title="Automation Efficiency" 
                icon={Cpu} 
                color="blue"
                onClick={() => setCurrentView('automation-overview')}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                     <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">+72.50%</span>
                     <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">Efficiency</span>
                  </div>
                  <div className="pt-2 border-t border-slate-50 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Est. Optimised:</span><span className="font-medium text-slate-900 dark:text-white">4000 kWh</span></div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Est. Cost:</span><span className="font-medium text-slate-900 dark:text-white">$1120.00</span></div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Last Month:</span><span className="font-medium text-slate-900 dark:text-white">1100 kWh</span></div>
                  </div>
                </div>
              </DashboardCard>

              {/* CARD 2: Power Usage Overview */}
              <DashboardCard 
                title="Power Usage Overview" 
                icon={Zap} 
                color="orange"
                onClick={() => setCurrentView('energy-overview')}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                     <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">1050 kWh</span>
                     <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">Current</span>
                  </div>
                  <div className="pt-2 border-t border-slate-50 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>2 Months Ago:</span><span className="font-medium text-slate-900 dark:text-white">950 kWh</span></div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Last Month:</span><span className="font-medium text-slate-900 dark:text-white">1100 kWh</span></div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Variance:</span><span className="font-medium text-red-600 dark:text-red-400">15.79%</span></div>
                  </div>
                </div>
              </DashboardCard>

              {/* CARD 3: Cost Prediction */}
              <DashboardCard 
                title="Cost Prediction" 
                icon={DollarSign} 
                color="green"
                onClick={() => setCurrentView('energy-overview')}
              >
                <div className="space-y-2">
                   <div className="flex justify-between items-baseline">
                     <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">$12,450</span>
                     <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">Month End Est.</span>
                  </div>
                  <div className="pt-2 border-t border-slate-50 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Current Spend:</span><span className="font-medium text-slate-900 dark:text-white">$4,200</span></div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Budget:</span><span className="font-medium text-slate-900 dark:text-white">$12,000</span></div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Trend:</span><span className="font-medium text-orange-500 dark:text-orange-400">+3.75%</span></div>
                  </div>
                </div>
              </DashboardCard>

              {/* CARD 4: Active Devices (Highest Usage) */}
              <DashboardCard 
                title="Highest Usage Devices" 
                icon={Activity} 
                color="purple"
                onClick={() => setCurrentView('energy-datalogs')}
              >
                <div className="space-y-3 pt-1">
                   {[
                     { name: 'Chiller-01', val: '450 kWh', col: 'bg-red-500' },
                     { name: 'FCU-Lvl1-02', val: '120 kWh', col: 'bg-orange-500' },
                     { name: 'Server-Rack-A', val: '95 kWh', col: 'bg-yellow-500' }
                   ].map((d, i) => (
                     <div key={i} className="flex items-center justify-between text-xs">
                       <div className="flex items-center">
                         <div className={`w-2 h-2 rounded-full ${d.col} mr-2`}></div>
                         <span className="text-slate-600 dark:text-slate-300 font-medium">{d.name}</span>
                       </div>
                       <span className="font-bold text-slate-900 dark:text-white">{d.val}</span>
                     </div>
                   ))}
                   <div className="text-xs text-blue-600 dark:text-blue-400 text-center pt-1 hover:underline">View All Devices</div>
                </div>
              </DashboardCard>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dynamic Consumption Overview Chart */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center tracking-tight">
                      {overviewType === 'power' ? 'Power Consumption' : 'Water Consumption'} Overview
                      {/* Tooltip/Toggle Interaction */}
                      <span 
                        onClick={() => setOverviewType(overviewType === 'power' ? 'water' : 'power')}
                        className="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center select-none"
                        title="Click to switch view"
                      >
                        Switch to {overviewType === 'power' ? 'Water' : 'Power'} <ArrowDownRight size={12} className="ml-1"/>
                      </span>
                    </h3>
                  </div>
                  
                  {/* Toggle Range Control */}
                  <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                    <button
                      onClick={() => setOverviewRange('Day')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${overviewRange === 'Day' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                      Daily
                    </button>
                    <button
                      onClick={() => setOverviewRange('Month')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${overviewRange === 'Month' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generateChartData(overviewRange, ['d1'])}>
                      <defs>
                        <linearGradient id="gradOverview" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={overviewType === 'power' ? "#f97316" : "#3b82f6"} stopOpacity={0.1}/>
                          <stop offset="95%" stopColor={overviewType === 'power' ? "#f97316" : "#3b82f6"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                      <XAxis dataKey="name" fontSize={10} tick={{fill: 'var(--chart-text)'}} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} tick={{fill: 'var(--chart-text)'}} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{backgroundColor: 'var(--tooltip-bg)', border: 'none', borderRadius: '8px', color: 'var(--tooltip-text)'}} />
                      <Area 
                        type="monotone" 
                        dataKey="d1" 
                        stroke={overviewType === 'power' ? "#f97316" : "#3b82f6"} 
                        fill="url(#gradOverview)" 
                        name={overviewType === 'power' ? "kWh" : "kL"}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Alerts Section (Unchanged) */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Recent Alerts</h3>
                <div className="space-y-4">
                  {MOCK_LOGS.map(log => (
                    <div key={log.id} className="flex items-start pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <div className={`mt-1 w-2 h-2 rounded-full mr-3 shrink-0 ${log.type === 'fault' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{log.message}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{log.device} • {log.timestamp}</p>
                      </div>
                      <span className="ml-auto text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">{log.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'energy-overview':
        return <ModuleOverview type="energy" />;
      case 'water-overview':
        return <ModuleOverview type="water" />;
      
      case 'energy-datalogs':
        return <DataLogPage type="energy" />;
      case 'water-datalogs':
        return <DataLogPage type="water" />;
      
      case 'energy-device-combined':
        return <DeviceInfoPage type="energy" />;
      case 'water-device-combined':
        return <DeviceInfoPage type="water" />;
      
      case 'energy-graphs':
      case 'water-graphs':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Historical Analysis</h2>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Consumption Trends</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400">Compare multiple devices</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <MultiDeviceSelect devices={availableDevices} selected={selectedDevices} onChange={setSelectedDevices} />
                  <TimeToggle active={timeRange} onChange={setTimeRange} />
                </div>
              </div>
              
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      {availableDevices.map(d => (
                        <linearGradient key={d.id} id={`color${d.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={d.color} stopOpacity={0.1}/>
                          <stop offset="95%" stopColor={d.color} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                    <XAxis dataKey="name" fontSize={12} tick={{fill: 'var(--chart-text)'}} axisLine={false} tickLine={false} />
                    <YAxis fontSize={12} tick={{fill: 'var(--chart-text)'}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{backgroundColor: 'var(--tooltip-bg)', border: 'none', borderRadius: '8px', color: 'var(--tooltip-text)'}} />
                    <Legend wrapperStyle={{ color: 'var(--chart-text)' }} />
                    {selectedDevices.map(id => {
                      const device = availableDevices.find(d => d.id === id);
                      if(!device) return null;
                      return <Area key={id} type="monotone" dataKey={id} name={device.name} stroke={device.color} fill={`url(#color${id})`} />;
                    })}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      case 'automation-overview':
        return <AutomationOverview navigate={setCurrentView} />;
      case 'automation-logs':
        return <AutomationLogsPage />;
      case 'ai-analytics': 
        return <AIAnalyticsModule />;

      default:
        return <div className="p-12 text-center text-slate-500 dark:text-slate-400">Select a view from the sidebar</div>;
    }
  };

  const getHeaderTitle = () => {
    const map = {
      'home': 'Overview',
      'energy-overview': 'Energy Overview',
      'energy-graphs': 'Energy History',
      'energy-datalogs': 'Energy Data Logs',
      'energy-device-combined': 'Energy Device Info',
      'water-overview': 'Water Overview',
      'water-graphs': 'Water History',
      'water-datalogs': 'Water Data Logs',
      'water-device-combined': 'Water Device Info',
      'automation-overview': 'Automation Overview',
      'automation-logs': 'Automation Logs',
      'ai-analytics': 'AI Analytics'
    };
    return map[currentView] || 'GEIBMS';
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-50' : 'bg-slate-50 text-slate-900'}`}
         style={{
           '--chart-grid': darkMode ? '#334155' : '#e2e8f0',
           '--chart-text': darkMode ? '#94a3b8' : '#64748b',
           '--tooltip-bg': darkMode ? '#1e293b' : '#ffffff',
           '--tooltip-text': darkMode ? '#ffffff' : '#1e293b',
         }}
    >
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed h-full z-30 hidden lg:flex flex-col transition-colors duration-300">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">G</div>
          <span className="ml-3 text-lg font-bold text-slate-900 dark:text-white tracking-tight">GEIBMS</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="px-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Main</div>
          <button 
            onClick={() => setCurrentView('home')}
            className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg mb-1 transition-colors ${currentView === 'home' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <LayoutDashboard size={18} className="mr-3" /> Overview
          </button>
          
          <button 
            onClick={() => setCurrentView('ai-analytics')}
            className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg mb-4 transition-colors ${currentView === 'ai-analytics' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <Brain size={18} className="mr-3" /> AI Analytics
          </button>
          
          <div className="px-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Management</div>
          
          {/* Energy Group */}
          <div>
            <button 
              onClick={() => toggleMenu('energy')}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center"><Zap size={18} className="mr-3 text-orange-500" /> Energy</div>
              {expandedMenus.energy ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {expandedMenus.energy && (
              <div className="pl-9 pr-2 py-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                <button onClick={() => setCurrentView('energy-overview')} className={`w-full text-left text-sm py-1.5 transition-colors ${currentView === 'energy-overview' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Overview</button>
                <button onClick={() => { setCurrentView('energy-graphs'); setSelectedDevices(['d1','d2']); }} className={`w-full text-left text-sm py-1.5 transition-colors ${currentView === 'energy-graphs' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Historical Data</button>
                <button onClick={() => setCurrentView('energy-device-combined')} className={`w-full text-left text-sm py-1.5 transition-colors ${currentView === 'energy-device-combined' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Device Info</button>
                <button onClick={() => setCurrentView('energy-datalogs')} className={`w-full text-left text-sm py-1.5 transition-colors ${currentView === 'energy-datalogs' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Data Logs</button>
              </div>
            )}
          </div>

          {/* Water Group */}
          <div className="mt-1">
            <button 
              onClick={() => toggleMenu('water')}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center"><Droplets size={18} className="mr-3 text-blue-500" /> Water</div>
              {expandedMenus.water ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {expandedMenus.water && (
              <div className="pl-9 pr-2 py-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                <button onClick={() => setCurrentView('water-overview')} className={`w-full text-left text-sm py-1.5 transition-colors ${currentView === 'water-overview' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Overview</button>
                <button onClick={() => { setCurrentView('water-graphs'); setSelectedDevices(['w1']); }} className={`w-full text-left text-sm py-1.5 transition-colors ${currentView === 'water-graphs' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Historical Data</button>
                <button onClick={() => setCurrentView('water-device-combined')} className={`w-full text-left text-sm py-1.5 transition-colors ${currentView === 'water-device-combined' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Device Info</button>
                <button onClick={() => setCurrentView('water-datalogs')} className={`w-full text-left text-sm py-1.5 transition-colors ${currentView === 'water-datalogs' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Data Logs</button>
              </div>
            )}
          </div>

          {/* Automation Group */}
          <div className="mt-1">
            <button 
              onClick={() => toggleMenu('automation')}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center"><Cpu size={18} className="mr-3 text-purple-500" /> Automation</div>
              {expandedMenus.automation ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {expandedMenus.automation && (
              <div className="pl-9 pr-2 py-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                <button onClick={() => setCurrentView('automation-overview')} className={`w-full text-left text-sm py-1.5 transition-colors ${currentView === 'automation-overview' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Overview</button>
                <button onClick={() => setCurrentView('automation-logs')} className={`w-full text-left text-sm py-1.5 transition-colors ${currentView === 'automation-logs' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Logs</button>
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
           <button 
             onClick={() => setDarkMode(!darkMode)}
             className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
           >
             {darkMode ? <Sun size={16} className="mr-2 text-yellow-400" /> : <Moon size={16} className="mr-2 text-slate-500" />}
             {darkMode ? 'Light Mode' : 'Dark Mode'}
           </button>
           <button className="flex items-center text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full px-3 py-2 rounded-lg transition-colors">
             <LogOut size={18} className="mr-3" /> Logout
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="lg:ml-64 flex-1 flex flex-col min-h-screen transition-all duration-300">
        <header className="h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{getHeaderTitle()}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Integrated Operation Centre</p>
          </div>
          <div className="flex items-center space-x-4">
             <div className="relative hidden md:block">
               <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
               <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-full text-sm border-none w-64 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 placeholder-slate-400" />
             </div>
             <button className="p-2 relative hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><Bell size={20} className="text-slate-400" /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span></button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;