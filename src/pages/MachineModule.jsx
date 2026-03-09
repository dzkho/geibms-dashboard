import React from 'react';
import { Settings, Clock, AlertTriangle, PlayCircle, PauseCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const OeeGauge = ({ value, label, color }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-20 h-20 flex items-center justify-center">
       <svg className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r="32" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
          <circle cx="40" cy="40" r="32" stroke={color} strokeWidth="6" fill="transparent" 
                  strokeDasharray={2 * Math.PI * 32} 
                  strokeDashoffset={2 * Math.PI * 32 * (1 - value / 100)} 
                  strokeLinecap="round" />
       </svg>
       <span className="absolute text-lg font-bold text-slate-700">{value}%</span>
    </div>
    <span className="text-xs font-bold text-slate-500 uppercase mt-1">{label}</span>
  </div>
);

const MachineModule = () => {
  const timelineData = [{time:'08:00', val:1}, {time:'09:00', val:1}, {time:'10:00', val:0.5}, {time:'11:00', val:1}, {time:'12:00', val:0}, {time:'13:00', val:1}, {time:'14:00', val:1}];
  const machines = [
    { id: 'M1', name: 'CNC Lathe', status: 'Running', color: 'bg-green-500', uptime: '4h 20m' },
    { id: 'M2', name: 'Hydraulic Press', status: 'Idle', color: 'bg-orange-500', uptime: '1h 10m' },
    { id: 'M3', name: 'Assembly Bot', status: 'Stopped', color: 'bg-red-500', uptime: '0h 00m' },
    { id: 'M4', name: 'Packaging Unit', status: 'Running', color: 'bg-green-500', uptime: '6h 45m' },
  ];
  return (
    <div className="pb-10">
      <div className="bg-[#005f5f] text-white px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold flex items-center"><Settings className="mr-3"/> Machine Monitoring</h1>
        <div className="flex bg-white/10 p-1 rounded"><button className="px-3 py-1 bg-white text-[#005f5f] text-xs font-bold rounded shadow-sm">Shift 1</button><button className="px-3 py-1 text-white/70 text-xs font-bold hover:text-white">Shift 2</button></div>
      </div>
      <div className="p-6 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center">
           <div className="mb-4 md:mb-0 text-center md:text-left"><h2 className="text-lg font-bold text-slate-800">Production Floor Efficiency</h2><div className="flex items-center text-sm text-slate-500 mt-1"><Clock size={14} className="mr-1"/> Shift Progress: 6.5 Hrs</div></div>
           <div className="flex gap-8"><OeeGauge value={85} label="Availability" color="#3b82f6" /><OeeGauge value={92} label="Performance" color="#10b981" /><OeeGauge value={98} label="Quality" color="#f59e0b" /></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><div className="flex justify-between mb-4"><h3 className="font-bold text-slate-700">Machine State Timeline</h3><div className="flex gap-3 text-xs font-bold text-slate-500"><span className="flex items-center"><div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div> Run</span><span className="flex items-center"><div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div> Idle</span><span className="flex items-center"><div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div> Stop</span></div></div><div className="h-48"><ResponsiveContainer width="100%" height="100%"><AreaChart data={timelineData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="time" axisLine={false} tickLine={false} /><YAxis hide domain={[0, 1.2]} /><Tooltip /><Area type="step" dataKey="val" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} /></AreaChart></ResponsiveContainer></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {machines.map(m => (
              <div key={m.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                 <div className={`absolute top-0 left-0 w-1 h-full ${m.color}`}></div>
                 <div className="flex justify-between items-start mb-3 pl-2"><h4 className="font-bold text-slate-800 text-lg">{m.name}</h4>{m.status === 'Running' ? <PlayCircle size={20} className="text-green-500"/> : m.status === 'Idle' ? <PauseCircle size={20} className="text-orange-500"/> : <AlertTriangle size={20} className="text-red-500"/>}</div>
                 <div className="pl-2 space-y-2 text-sm text-slate-500"><div className="flex justify-between border-b border-slate-50 pb-2"><span>Status</span> <span className={`font-bold uppercase ${m.status==='Running'?'text-green-600':m.status==='Idle'?'text-orange-600':'text-red-600'}`}>{m.status}</span></div><div className="flex justify-between"><span>Uptime</span> <span className="font-mono text-slate-700">{m.uptime}</span></div></div>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default MachineModule;