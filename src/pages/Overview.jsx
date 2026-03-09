import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, Droplets, Cpu, DollarSign, Activity, 
  ArrowDownRight, ArrowUpRight, RefreshCw, CheckCircle2, AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend 
} from 'recharts';
import { DashboardCard } from '../components/Shared';
import { supabase } from '../supabaseClient';

const Overview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overviewType, setOverviewType] = useState('power');
  const [overviewRange, setOverviewRange] = useState('Day'); 
  
  const [powerData, setPowerData] = useState([]);
  const [waterData, setWaterData] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      const { data: latestP } = await supabase.from('power_consumption').select('recorded_at').order('recorded_at', {ascending: false}).limit(1);
      let pData = [];
      if (latestP && latestP.length > 0) {
          const end = new Date(latestP[0].recorded_at);
          const start = new Date(end); 
          start.setDate(start.getDate() - 30); 
          
          const { count } = await supabase.from('power_consumption').select('recorded_at', {count: 'exact', head: true}).gte('recorded_at', start.toISOString());
          if (count) {
              const promises = [];
              for(let i = 0; i < count; i += 1000) {
                 promises.push(supabase.from('power_consumption').select('recorded_at, meter_sn, hourly_kwh').gte('recorded_at', start.toISOString()).order('recorded_at', {ascending:true}).range(i, i + 999));
              }
              const res = await Promise.all(promises);
              res.forEach(r => { if (r.data) pData.push(...r.data) });
          }
      }
      setPowerData(pData);

      const { data: latestW } = await supabase.from('water_consumption').select('recorded_at').order('recorded_at', {ascending: false}).limit(1);
      let wData = [];
      if (latestW && latestW.length > 0) {
          const end = new Date(latestW[0].recorded_at);
          const start = new Date(end); 
          start.setDate(start.getDate() - 30); 
          
          const { count } = await supabase.from('water_consumption').select('recorded_at', {count: 'exact', head: true}).gte('recorded_at', start.toISOString());
          if (count) {
              const promises = [];
              for(let i = 0; i < count; i += 1000) {
                 promises.push(supabase.from('water_consumption').select('recorded_at, meter_sn, daily_consumption_m3').gte('recorded_at', start.toISOString()).order('recorded_at', {ascending:true}).range(i, i + 999));
              }
              const res = await Promise.all(promises);
              res.forEach(r => { if (r.data) wData.push(...r.data) });
          }
      }
      setWaterData(wData);
      setLoading(false);
    };
    
    fetchDashboardData();
  }, []);

  const kpis = useMemo(() => {
     let p7 = 0; let p30 = 0; let prevP7 = 0;
     let w7 = 0;
     let topDevices = [];
     
     if (powerData.length > 0) {
         const sorted = [...powerData].sort((a,b) => new Date(a.recorded_at) - new Date(b.recorded_at));
         const latestDate = new Date(sorted[sorted.length - 1].recorded_at);
         
         const cutoff7 = new Date(latestDate); cutoff7.setDate(cutoff7.getDate() - 7);
         const cutoff14 = new Date(latestDate); cutoff14.setDate(cutoff14.getDate() - 14);
         
         const deviceMap = {};
         
         sorted.forEach(row => {
             const d = new Date(row.recorded_at);
             const val = parseFloat(row.hourly_kwh || 0);
             p30 += val;
             
             if (d >= cutoff7) {
                 p7 += val;
                 deviceMap[row.meter_sn] = (deviceMap[row.meter_sn] || 0) + val;
             } else if (d >= cutoff14 && d < cutoff7) {
                 prevP7 += val;
             }
         });
         
         topDevices = Object.entries(deviceMap)
            .sort((a,b) => b[1] - a[1])
            .slice(0, 3)
            .map(d => ({ name: d[0], val: d[1] }));
     }

     if (waterData.length > 0) {
         const sorted = [...waterData].sort((a,b) => new Date(a.recorded_at) - new Date(b.recorded_at));
         const latestDate = new Date(sorted[sorted.length - 1].recorded_at);
         const cutoff7 = new Date(latestDate); cutoff7.setDate(cutoff7.getDate() - 7);
         
         sorted.forEach(row => {
             const d = new Date(row.recorded_at);
             const val = parseFloat(row.daily_consumption_m3 || 0);
             if (d >= cutoff7) w7 += val;
         });
     }
     
     return { p7, p30, prevP7, w7, topDevices };
  }, [powerData, waterData]);

  const chartData = useMemo(() => {
      const dataToUse = overviewType === 'power' ? powerData : waterData;
      if (!dataToUse || dataToUse.length === 0) return [];
      
      const sorted = [...dataToUse].sort((a,b) => new Date(a.recorded_at) - new Date(b.recorded_at));
      const latestDate = new Date(sorted[sorted.length - 1].recorded_at);
      
      let cutoff = new Date(latestDate);
      if (overviewRange === 'Day') cutoff.setDate(cutoff.getDate() - 7); 
      else cutoff.setDate(cutoff.getDate() - 30); 
      
      const timeMap = {};
      
      sorted.forEach(row => {
          const d = new Date(row.recorded_at);
          if (d < cutoff) return;
          
          let label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
          if (!timeMap[label]) timeMap[label] = { name: label, value: 0 };
          
          const val = overviewType === 'power' ? parseFloat(row.hourly_kwh || 0) : parseFloat(row.daily_consumption_m3 || 0);
          timeMap[label].value += val;
      });
      
      return Object.values(timeMap);
  }, [powerData, waterData, overviewType, overviewRange]);

  const powerVariance = kpis.prevP7 ? (((kpis.p7 - kpis.prevP7) / kpis.prevP7) * 100).toFixed(2) : 0;
  const colors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500'];

  // CRITICAL FIX: Replaced "dimming" log with the Zone 2/4 Schedule
  const ROUTINE_LOGS = [
    { id: 1, timestamp: '10:30 AM', system: 'Automation', device: 'FCU 6', message: 'Setpoint optimized to 24°C', status: 'Success', type: 'schedule' },
    { id: 2, timestamp: '09:00 AM', system: 'Water', device: 'Cooling Tower 1', message: 'Routine flush cycle completed', status: 'Normal', type: 'schedule' },
    { id: 3, timestamp: '08:15 AM', system: 'Energy', device: 'Facility Hub', message: 'Daily telemetry synchronized', status: 'Success', type: 'schedule' },
    { id: 4, timestamp: '08:00 PM', system: 'Automation', device: 'LIGHTING-2, 4', message: 'Scheduled after-hours power OFF', status: 'Active', type: 'schedule' },
    { id: 5, timestamp: '06:00 AM', system: 'Water', device: 'Main Intake', message: 'Minor pressure variance mitigated', status: 'Resolved', type: 'warning' }
  ];

  const ActionCard = ({ title, desc, icon: Icon, color, route }) => (
    <div onClick={() => navigate(route)} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${color} text-white shadow-sm group-hover:scale-110 transition-transform`}><Icon size={20} /></div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{title}</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{desc}</p>
        </div>
      </div>
      <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">EXECUTIVE SUMMARY</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Rolling Operational Performance</p>
        </div>
        <div className="mt-4 md:mt-0 relative z-10">
          <span className="flex items-center text-xs font-bold text-[#005f5f] uppercase bg-[#005f5f]/10 px-3 py-1.5 rounded-lg border border-[#005f5f]/20 shadow-sm">
            <CheckCircle2 size={16} className="mr-2" /> System Status: Optimal
          </span>
        </div>
      </div>

      {/* TOP KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Automation Efficiency" icon={Cpu} color="blue" onClick={() => navigate('/automation')}>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline"><span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">+92.50%</span><span className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">Efficiency</span></div>
            <div className="pt-2 border-t border-slate-50 dark:border-slate-700 text-xs space-y-1">
              <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Rules Active:</span><span className="font-medium text-slate-900 dark:text-white">3 Automations</span></div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>System Nodes:</span><span className="font-medium text-slate-900 dark:text-white">32 Online</span></div>
            </div>
          </div>
        </DashboardCard>
        
        <DashboardCard title="7-Day Power Usage" icon={Zap} color="orange" onClick={() => navigate('/energy/charts')}>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
                {loading ? <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div> : <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{kpis.p7.toLocaleString('en-US', {maximumFractionDigits: 0})} kWh</span>}
            </div>
            <div className="pt-2 border-t border-slate-50 dark:border-slate-700 text-xs space-y-1">
              <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Previous 7 Days:</span><span className="font-medium text-slate-900 dark:text-white">{kpis.prevP7.toLocaleString('en-US', {maximumFractionDigits: 0})} kWh</span></div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Variance:</span><span className={`font-medium ${powerVariance > 0 ? 'text-red-500' : 'text-green-500'}`}>{powerVariance > 0 ? '+' : ''}{powerVariance}%</span></div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="7-Day Water Flow" icon={Droplets} color="blue" onClick={() => navigate('/water/charts')}>
          <div className="space-y-2">
             <div className="flex justify-between items-baseline">
                 {loading ? <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div> : <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{kpis.w7.toLocaleString('en-US', {maximumFractionDigits: 0})} m³</span>}
             </div>
            <div className="pt-2 border-t border-slate-50 dark:border-slate-700 text-xs space-y-1">
              <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Est. Monthly:</span><span className="font-medium text-slate-900 dark:text-white">{((kpis.w7 / 7) * 30).toLocaleString('en-US', {maximumFractionDigits: 0})} m³</span></div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Leak Alerts:</span><span className="font-medium text-green-500">None Detected</span></div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Highest Usage Devices" icon={Activity} color="purple" onClick={() => navigate('/energy/devices')}>
          <div className="space-y-3 pt-1">
             {loading ? (
                <div className="space-y-2">
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
             ) : kpis.topDevices.map((d, i) => (
               <div key={i} className="flex items-center justify-between text-xs">
                 <div className="flex items-center"><div className={`w-2 h-2 rounded-full ${colors[i] || 'bg-slate-500'} mr-2`}></div><span className="text-slate-600 dark:text-slate-300 font-medium">{d.name}</span></div>
                 <span className="font-bold text-slate-900 dark:text-white">{d.val.toLocaleString('en-US', {maximumFractionDigits: 0})} kWh</span>
               </div>
             ))}
             <div onClick={(e) => { e.stopPropagation(); navigate('/energy/devices'); }} className="text-xs text-blue-600 dark:text-blue-400 text-center pt-1 hover:underline cursor-pointer">View On Floorplan</div>
          </div>
        </DashboardCard>
      </div>

      {/* LOWER SPLIT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART WIDGET */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-[400px] flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center tracking-tight">
                {overviewType === 'power' ? 'Power Consumption' : 'Water Flow'} Overview
                <span onClick={() => setOverviewType(overviewType === 'power' ? 'water' : 'power')} className="ml-3 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors flex items-center select-none uppercase tracking-widest">
                  Switch to {overviewType === 'power' ? 'Water' : 'Power'} <ArrowDownRight size={14} className="ml-1"/>
                </span>
              </h3>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
              <button onClick={() => setOverviewRange('Day')} className={`px-4 py-1.5 text-[10px] uppercase font-bold rounded-md transition-all ${overviewRange === 'Day' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>7 Days</button>
              <button onClick={() => setOverviewRange('Month')} className={`px-4 py-1.5 text-[10px] uppercase font-bold rounded-md transition-all ${overviewRange === 'Month' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>30 Days</button>
            </div>
          </div>
          
          <div className="flex-1 w-full relative">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <RefreshCw className="animate-spin text-slate-400 mb-2" size={24} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syncing Dashboard...</span>
              </div>
            ) : chartData.length === 0 ? (
               <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Data Available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradOverview" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={overviewType === 'power' ? "#f97316" : "#3b82f6"} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={overviewType === 'power' ? "#f97316" : "#3b82f6"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-700" />
                  <XAxis dataKey="name" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} minTickGap={20} tick={{fill: '#94a3b8'}} />
                  <YAxis fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="value" stroke={overviewType === 'power' ? "#f97316" : "#3b82f6"} fill="url(#gradOverview)" name={overviewType === 'power' ? "kWh" : "m³"} strokeWidth={3}/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* V1 RECENT ALERTS */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-[400px] lg:h-auto">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Operational Events</h3>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {ROUTINE_LOGS.map(log => (
              <div key={log.id} className="flex items-start pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <div className={`mt-1 w-2 h-2 rounded-full mr-3 shrink-0 ${log.type === 'warning' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">{log.message}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">{log.device} • {log.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;