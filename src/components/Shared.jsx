// src/components/Shared.jsx
import React, { useState } from 'react';
import { ArrowUpRight, Filter, ChevronDown, Check } from 'lucide-react';

export const generateChartData = (range, selectedDeviceIds) => {
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

export const getTempColor = (temp) => {
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

export const DashboardCard = ({ title, mainValue, subValue, icon: Icon, color, onClick, children }) => (
  <div 
    onClick={onClick} 
    className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between min-h-[160px]"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${
          color === 'blue' ? 'bg-blue-50 text-blue-600' : 
          color === 'green' ? 'bg-green-50 text-green-600' : 
          color === 'purple' ? 'bg-purple-50 text-purple-600' : 
          'bg-orange-50 text-orange-600'
        }`}>
          <Icon size={20} />
        </div>
        <h3 className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">{title}</h3>
      </div>
      <ArrowUpRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
    </div>
    <div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{mainValue}</div>
      {subValue && <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1">{subValue}</div>}
      {children}
    </div>
  </div>
);

export const MultiDeviceSelect = ({ devices, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSelection = (id) => {
    const newSelection = selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id];
    onChange(newSelection);
  };
  return (
    <div className="relative z-20">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
        <Filter size={16} className="text-slate-500" />
        <span>Select Devices ({selected.length})</span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 p-2 z-20">
            <div className="max-h-60 overflow-y-auto space-y-1">
              {devices.map(device => (
                <div key={device.id} onClick={() => toggleSelection(device.id)} className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${selected.includes(device.id) ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'}`}>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: device.color }}></div>
                    <span>{device.name}</span>
                  </div>
                  {selected.includes(device.id) && <Check size={14} className="text-blue-600" />}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const TimeToggle = ({ active, onChange }) => (
  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
    {['Day', 'Week', 'Month', 'Year'].map(opt => (
      <button key={opt} onClick={() => onChange(opt)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${active === opt ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
        {opt}
      </button>
    ))}
  </div>
);