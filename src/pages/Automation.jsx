import React, { useState, useEffect } from 'react';
import { 
  Settings, Thermometer, Fan, Power, Snowflake, PlayCircle, Lightbulb,
  Map, CheckCircle, Clock, ToggleRight, ToggleLeft, Trash2, Plus, Save, 
  Link as LinkIcon, X, ExternalLink, Zap, List
} from 'lucide-react';

const MOCK_AUTOMATION_LOGS = [
  { id: 101, timestamp: 'Today 10:05 AM', device: 'FCU 6', action: 'Fan Speed -> High', trigger: 'Rule: Temp > 27°C', status: 'Executed' },
  { id: 102, timestamp: 'Today 09:00 AM', device: 'LIGHTING-1', action: 'Power -> Off', trigger: 'Schedule: Work Hours End', status: 'Executed' },
  { id: 103, timestamp: 'Today 08:30 AM', device: 'FCU 4', action: 'Set Temp -> 24°C', trigger: 'Manual Override', status: 'Executed' },
  { id: 104, timestamp: 'Today 07:00 AM', device: 'System', action: 'Morning Startup', trigger: 'Schedule: Daily', status: 'Executed' },
];

// CRITICAL FIX: 14-Day Dynamic Schedule Generator
const generateScheduleLogs = () => {
  const logs = [];
  const today = new Date();
  let logId = 1;

  for (let i = 0; i <= 14; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);
    const dayOfWeek = targetDate.getDay();
    const isWeekday = dayOfWeek !== 0 && dayOfWeek !== 6; // 0 = Sunday, 6 = Saturday

    const dateStr = targetDate.toLocaleDateString([], { month: 'short', day: '2-digit' });

    // 8:00 PM Shutdown (Every day)
    const shutdownTime = new Date(targetDate);
    shutdownTime.setHours(20, 0, 0, 0);
    
    // Only log it if the time has actually passed
    if (shutdownTime <= new Date()) {
        logs.push({
          id: `sched-off-${logId++}`,
          sortTime: shutdownTime.getTime(),
          timestamp: `${dateStr} 08:00 PM`,
          scheduleName: 'After-Hours Shutdown',
          devices: 'LIGHTING-2, LIGHTING-4',
          action: 'Power OFF',
          status: 'Success'
        });
    }

    // 5:30 AM Startup (Weekdays only)
    const startupTime = new Date(targetDate);
    startupTime.setHours(5, 30, 0, 0);
    
    if (isWeekday && startupTime <= new Date()) {
      logs.push({
        id: `sched-on-${logId++}`,
        sortTime: startupTime.getTime(),
        timestamp: `${dateStr} 05:30 AM`,
        scheduleName: 'Morning Startup',
        devices: 'LIGHTING-2, LIGHTING-4',
        action: 'Power ON',
        status: 'Success'
      });
    }
  }
  
  // Sort by time descending (newest first)
  return logs.sort((a, b) => b.sortTime - a.sortTime);
};

const MOCK_SCHEDULE_LOGS = generateScheduleLogs();

const MOCK_RULES = [
  { id: 1, name: 'High Temp Protocol', condition: 'Temp > 28°C', action: 'Set Fan to High', status: true },
  { id: 2, name: 'Energy Saver Mode', condition: 'Power > 500kW', action: 'Set Temp to 25°C', status: true },
  { id: 3, name: 'Zone 2 & 4 Schedule', condition: 'Weekday 05:30 OR Daily 20:00', action: 'Toggle Power', status: true },
];

const INITIAL_FCUS = Array.from({ length: 10 }, (_, i) => {
  const temp = 18 + Math.random() * 12; 
  return {
    id: `FCU ${i + 4}`,
    name: `FCU ${i + 4}`,
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
  id: `LIGHTING-${i + 1}`,
  name: `Light Zone 0${i + 1}`,
  isOn: true,
  mode: 'Auto',
  powerUsage: 0.4,
  activeRules: 1,
  activeSchedules: 1,
  x: i * 20 + 5,
  bulbs: Array.from({ length: 5 }, (_, j) => ({ y: j * 18 + 15 }))
}));

const getTempColor = (temp) => {
  const t = parseFloat(temp);
  if (t <= 19) return 'rgb(59, 130, 246)';
  if (t >= 28) return 'rgb(239, 68, 68)'; 
  
  if (t < 25) {
    const ratio = (t - 19) / 6;
    const r = 59 + (34 - 59) * ratio; const g = 130 + (197 - 130) * ratio; const b = 246 + (94 - 246) * ratio;
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  } else {
    const ratio = (t - 25) / 3;
    const r = 34 + (239 - 34) * ratio; const g = 197 + (68 - 197) * ratio; const b = 94 + (68 - 94) * ratio;
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }
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
        <g><circle cx="45" cy="30" r="4" strokeWidth="1" /><circle cx="70" cy="30" r="4" strokeWidth="1" /><circle cx="90" cy="30" r="4" strokeWidth="1" /><circle cx="55" cy="70" r="4" strokeWidth="1" /><circle cx="80" cy="70" r="4" strokeWidth="1" /></g>
        <defs><pattern id="hatch" width="2" height="2" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="2" style={{stroke:'black', strokeWidth:0.1}} /></pattern></defs>
      </svg>
    </div>
    
    {lights.map((zone) => (
      zone.bulbs.map((bulb, idx) => (
        <div key={`${zone.id}-${idx}`} className="absolute transform -translate-x-1/2 -translate-y-1/2 group" style={{ left: `${zone.x}%`, top: `${bulb.y}%` }}>
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full pointer-events-none transition-all duration-500`} style={{ background: `radial-gradient(circle, ${zone.isOn ? 'rgba(250, 204, 21, 0.4)' : 'transparent'} 0%, transparent 70%)` }}></div>
          <div className={`w-3 h-3 rounded-full flex items-center justify-center relative z-10 ${zone.isOn ? 'bg-yellow-400 shadow-lg shadow-yellow-300' : 'bg-slate-400'} ${zone.updated ? 'scale-150 ring-2 ring-yellow-200' : ''} transition-all`}></div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-40 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-yellow-500 text-white px-2 py-1 font-bold">{zone.name}</div>
            <div className="p-2 space-y-1">
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">State</span><span className="font-semibold">{zone.isOn ? 'ON' : 'OFF'}</span></div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-700 pt-1 mt-1"><span className="text-slate-500 dark:text-slate-400">Sched</span><span className="font-mono">{zone.activeSchedules} Active</span></div>
            </div>
          </div>
        </div>
      ))
    ))}
    {fcus.map((fcu) => {
      const color = getTempColor(fcu.currentTemp);
      return (
        <div key={fcu.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 group" style={{ left: `${fcu.x}%`, top: `${fcu.y}%` }}>
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none opacity-60 mix-blend-multiply dark:mix-blend-screen transition-all duration-1000 ${fcu.updated ? 'scale-125 opacity-90' : ''}`} style={{ background: `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0) 70%)` }}></div>
          <div className={`w-8 h-8 bg-slate-900 dark:bg-slate-700 rounded border-2 border-white dark:border-slate-500 flex items-center justify-center shadow-md relative z-10 cursor-pointer hover:scale-110 transition-transform ${fcu.updated ? 'ring-4 ring-blue-300 scale-110' : ''}`}>{fcu.controlMode === 'Cooling' ? <Snowflake size={14} className="text-white" /> : <Fan size={14} className="text-white" />}</div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-48 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-slate-900 dark:bg-slate-700 text-white px-3 py-2 font-bold truncate flex justify-between"><span>{fcu.name}</span><span style={{ color: color }}>{Math.round(fcu.currentTemp)}°C</span></div>
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

const AutomationOverview = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [subView, setSubView] = useState('heatmap');
  const [logTab, setLogTab] = useState('schedule'); // Defaulted to Schedule to view new logs
  const [fcus, setFcus] = useState(INITIAL_FCUS);
  const [lights, setLights] = useState(INITIAL_LIGHTS);
  
  const [rules, setRules] = useState(MOCK_RULES);
  const [ruleSubject, setRuleSubject] = useState('Temperature');
  const [ruleOperator, setRuleOperator] = useState('Greater than');
  const [ruleValue, setRuleValue] = useState('');
  const [ruleAction, setRuleAction] = useState('Set Fan Speed');
  const [ruleActionParam, setRuleActionParam] = useState('High');

  const [activeControlTab, setActiveControlTab] = useState('ac');
  const [activeStatusTab, setActiveStatusTab] = useState('ac');
  const [controlModalOpen, setControlModalOpen] = useState(false);
  const [selectedDeviceType, setSelectedDeviceType] = useState('ac');
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  
  const [tempSetting, setTempSetting] = useState(24);
  const [modeSetting, setModeSetting] = useState('Cooling');
  const [fanSetting, setFanSetting] = useState('Medium');
  const [showSuggestion, setShowSuggestion] = useState(false);

  useEffect(() => {
    if (ruleAction === 'Set Fan Speed') setRuleActionParam('High');
    else if (ruleAction === 'Set Temperature') setRuleActionParam('24');
    else setRuleActionParam('');
  }, [ruleAction]);

  const toggleFcuPower = (id) => setFcus(prev => prev.map(f => f.id === id ? { ...f, isOn: !f.isOn } : f));
  const updateFcuSetting = (id, field, value) => setFcus(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  const toggleLightPower = (id) => setLights(prev => prev.map(l => l.id === id ? { ...l, isOn: !l.isOn, updated: true } : l));
  
  const toggleRule = (id) => setRules(prev => prev.map(r => r.id === id ? { ...r, status: !r.status } : r));
  const handleDeleteRule = (id) => setRules(prev => prev.filter(r => r.id !== id));
  
  const handleSaveRule = () => {
    if (!ruleValue && ruleAction !== 'Turn Off') return; 
    
    const getOpSymbol = (op) => ({ 'Greater than': '>', 'Less than': '<', 'Equals': '=' }[op]);
    const getUnit = (subj) => ({ 'Temperature': '°C', 'Power Usage': 'kW', 'Time of Day': '' }[subj]);
    const getSubjName = (subj) => ({ 'Temperature': 'Temp', 'Power Usage': 'Power', 'Time of Day': 'Time' }[subj]);

    const conditionStr = `${getSubjName(ruleSubject)} ${getOpSymbol(ruleOperator)} ${ruleValue}${getUnit(ruleSubject)}`;
    
    let actionStr = ruleAction;
    if (ruleAction === 'Set Fan Speed') actionStr = `Set Fan to ${ruleActionParam}`;
    if (ruleAction === 'Set Temperature') actionStr = `Set Temp to ${ruleActionParam}°C`;
    if (ruleAction === 'Turn Off') actionStr = `Turn Off Devices`;

    const newRule = {
      id: Date.now(),
      name: `Custom Automated Logic`,
      condition: conditionStr,
      action: actionStr,
      status: true
    };

    setRules([newRule, ...rules]);
    setRuleValue(''); 
  };

  const openControlModal = (id, type) => {
    setSelectedDeviceType(type);
    setSelectedDeviceId(id);
    if (type === 'ac') {
      const fcu = fcus.find(f => f.id === id);
      if (fcu) { setTempSetting(fcu.setTemp); setModeSetting(fcu.controlMode); setFanSetting(fcu.fanSpeed); }
    }
    setControlModalOpen(true);
    setShowSuggestion(false);
  };

  const applyControlSettings = () => {
    if (selectedDeviceType === 'ac') {
      setFcus(prev => prev.map(f => f.id === selectedDeviceId ? { ...f, setTemp: tempSetting, currentTemp: tempSetting, controlMode: modeSetting, fanSpeed: fanSetting, mode: 'Manual', updated: true } : f));
      setTimeout(() => setFcus(prev => prev.map(f => ({ ...f, updated: false }))), 2000);
    } else {
      setLights(prev => prev.map(l => l.id === selectedDeviceId ? { ...l, isOn: !l.isOn, mode: 'Manual', updated: true } : l));
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
           <button onClick={() => setActiveTab('rules')} className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'rules' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><PlayCircle size={16} className="mr-2" /> Smart Rules</button>
           <button onClick={() => setActiveTab('logs')} className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'logs' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><List size={16} className="mr-2" /> Logs</button>
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
                        <tr><th className="px-6 py-3">Device Name</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Mode</th><th className="px-6 py-3">{activeStatusTab === 'ac' ? 'Settings' : 'Power Draw'}</th><th className="px-6 py-3">Logic Active</th><th className="px-6 py-3">Action</th></tr>
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
                            <td className="px-6 py-4 font-mono">{light.isOn ? '2.4 kW' : '0.0 kW'}</td>
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
                  <div className="flex justify-between items-center h-full py-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{light.name}</span>
                    <button onClick={() => toggleLightPower(light.id)} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${light.isOn ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400' : 'text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-500'}`}>
                        {light.isOn ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow group">
              <div><p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-blue-600 flex items-center">Active ACs <ExternalLink size={10} className="ml-1 opacity-0 group-hover:opacity-100" /></p><p className="text-xl font-bold text-slate-900 dark:text-white">{fcus.filter(f=>f.isOn).length} / {fcus.length}</p></div>
              <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg"><Power size={20}/></div>
            </div>
            <div onClick={() => setActiveControlTab('lighting')} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow group">
              <div><p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-yellow-600 flex items-center">Lighting Relays <ExternalLink size={10} className="ml-1 opacity-0 group-hover:opacity-100" /></p><p className="text-xl font-bold text-slate-900 dark:text-white">{lights.filter(l=>l.isOn).length} Zones On</p></div>
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg"><Lightbulb size={20}/></div>
            </div>
            <div onClick={() => setActiveTab('logs')} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow group">
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

      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-100 dark:border-purple-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center"><Plus size={20} className="mr-2 text-purple-600 dark:text-purple-400" /> Create New Automation Rule</h3>
            
            <div className="flex flex-col lg:flex-row items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex-wrap">
              <span className="font-bold text-purple-700 dark:text-purple-400 px-2">IF</span>
              <select value={ruleSubject} onChange={e => setRuleSubject(e.target.value)} className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg p-2.5 outline-none">
                <option>Temperature</option>
                <option>Power Usage</option>
                <option>Time of Day</option>
              </select>
              <select value={ruleOperator} onChange={e => setRuleOperator(e.target.value)} className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg p-2.5 outline-none">
                <option>Greater than</option>
                <option>Less than</option>
                <option>Equals</option>
              </select>
              <input 
                type="text" 
                value={ruleValue} 
                onChange={e => setRuleValue(e.target.value)} 
                placeholder="Value (e.g., 25)" 
                className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg p-2.5 w-32 outline-none" 
              />
              
              <span className="font-bold text-blue-600 dark:text-blue-400 px-2">THEN</span>
              <select value={ruleAction} onChange={e => setRuleAction(e.target.value)} className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg p-2.5 outline-none">
                <option>Set Fan Speed</option>
                <option>Set Temperature</option>
                <option>Turn Off</option>
              </select>

              {ruleAction === 'Set Fan Speed' && (
                <select value={ruleActionParam} onChange={e => setRuleActionParam(e.target.value)} className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg p-2.5 outline-none">
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              )}
              {ruleAction === 'Set Temperature' && (
                <input 
                  type="number" 
                  value={ruleActionParam} 
                  onChange={e => setRuleActionParam(e.target.value)} 
                  placeholder="°C" 
                  className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg p-2.5 w-24 outline-none" 
                />
              )}

              <button onClick={handleSaveRule} className="ml-auto bg-slate-900 dark:bg-purple-600 text-white hover:bg-slate-800 font-medium rounded-lg text-sm px-5 py-2.5 flex items-center transition-all active:scale-95">
                <Save size={16} className="mr-2" /> Save Rule
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 font-bold text-slate-800 dark:text-white">Active Conditional Logic</div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {rules.length === 0 ? (
                <div className="p-6 text-center text-slate-400 font-medium text-sm">No active rules. Create one above.</div>
              ) : rules.map(rule => (
                <div key={rule.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${rule.status ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}><PlayCircle size={24} /></div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{rule.name}</h4>
                      <div className="flex items-center text-xs mt-1 space-x-2">
                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded font-mono">IF {rule.condition}</span>
                        <span className="text-slate-400">→</span>
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-mono">THEN {rule.action}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button onClick={() => toggleRule(rule.id)} className={`text-2xl ${rule.status ? 'text-green-500' : 'text-slate-300 dark:text-slate-600'}`}>{rule.status ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}</button>
                    <button onClick={() => handleDeleteRule(rule.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm w-fit">
             <button onClick={() => setLogTab('activity')} className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${logTab === 'activity' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><List size={16} className="mr-2" /> Activity History</button>
             <button onClick={() => setLogTab('schedule')} className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${logTab === 'schedule' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Clock size={16} className="mr-2" /> Schedule Logs</button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto h-[500px]">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 relative">
                {logTab === 'activity' ? (
                  <>
                    <thead className="bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold uppercase text-xs sticky top-0 z-10">
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
                    <thead className="bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200 font-semibold uppercase text-xs sticky top-0 z-10">
                      <tr><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4">Schedule Name</th><th className="px-6 py-4">Target Group</th><th className="px-6 py-4">Action</th><th className="px-6 py-4">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {MOCK_SCHEDULE_LOGS.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors animate-in fade-in">
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
                <div className="py-6 flex flex-col items-center">
                   <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-full mb-4">
                      <Lightbulb size={48} className="text-yellow-500" />
                   </div>
                   <h4 className="font-bold text-slate-900 dark:text-white text-lg">Lighting Relay Override</h4>
                   <p className="text-xs text-slate-500 mt-2 text-center">This zone is currently on a predefined schedule. Would you like to manually toggle power?</p>
                </div>
              )}
              <div className="pt-2 flex flex-col gap-2">
                <button onClick={applyControlSettings} className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none">Apply Override</button>
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
              <button onClick={() => { setActiveTab('rules'); setShowSuggestion(false); }} className="text-xs bg-white text-slate-900 px-3 py-1.5 rounded font-medium hover:bg-slate-100 transition-colors">Create Rule</button>
              <button onClick={() => setShowSuggestion(false)} className="text-xs text-slate-400 px-3 py-1.5 hover:text-white transition-colors">Dismiss</button>
            </div>
          </div>
          <button onClick={() => setShowSuggestion(false)} className="ml-auto text-slate-500 hover:text-white"><X size={14} /></button>
        </div>
      )}
    </div>
  );
};

export default AutomationOverview;