import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Droplets, Calendar, Activity, Download, 
  ArrowUpRight, TrendingUp, Filter, BarChart3, RefreshCw, ChevronDown, Check
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, Line as RechartsLine 
} from 'recharts';
import { DashboardCard } from '../components/Shared';
import { supabase } from '../supabaseClient';

const SkeletonPulse = () => (
  <div className="h-8 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1"></div>
);

// --- V1 MULTI-DEVICE SELECT COMPONENT ---
const MultiDeviceSelect = ({ devices, selected, onChange, loading }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleSelection = (id) => {
    let newSelection = [...selected];
    if (id === 'ALL') {
      newSelection = ['ALL'];
    } else {
      newSelection = selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id];
      newSelection = newSelection.filter(item => item !== 'ALL');
      if (newSelection.length === 0) newSelection = ['ALL']; 
    }
    onChange(newSelection);
  };

  return (
    <div className={`relative z-50 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-sm cursor-pointer outline-none hover:bg-slate-100 dark:hover:bg-slate-800">
        <Filter size={14} className="text-slate-400" />
        <span>{selected.includes('ALL') ? 'Facility Aggregated' : `Compare (${selected.length}) Nodes`}</span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50 max-h-[300px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1">
              {devices.map(device => (
                <div key={device.id} onClick={() => toggleSelection(device.id)} className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${selected.includes(device.id) ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium'}`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: device.color }}></div>
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

const WaterModule = () => {
  const navigate = useNavigate();
  const [granularity, setGranularity] = useState('daily'); 
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: Multi-Select state
  const [selectedMeters, setSelectedMeters] = useState(['ALL']);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [peakTimeframe, setPeakTimeframe] = useState('week'); 

  const [showProjected, setShowProjected] = useState(false);
  const [showBaseline, setShowBaseline] = useState(false);

  useEffect(() => {
    const initDates = async () => {
      setLoading(true);
      const { data } = await supabase.from('water_consumption').select('recorded_at').order('recorded_at', { ascending: false }).limit(1);

      if (data && data.length > 0) {
        const latestDate = new Date(data[0].recorded_at);
        const firstDate = new Date(latestDate);
        firstDate.setDate(latestDate.getDate() - 14); 
        
        setEndDate(latestDate.toISOString().split('T')[0]);
        setStartDate(firstDate.toISOString().split('T')[0]);
      }
    };
    initDates();
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchTargetedData = async () => {
      setLoading(true);
      const startIso = new Date(startDate).toISOString();
      const endIso = new Date(new Date(endDate).getTime() + 86400000).toISOString();

      const { count, error: countError } = await supabase.from('water_consumption').select('recorded_at', { count: 'exact', head: true }).gte('recorded_at', startIso).lt('recorded_at', endIso);

      if (countError || !count) {
        setRawData([]);
        setLoading(false);
        return;
      }

      let allData = [];
      const chunkSize = 1000;
      const maxConcurrent = 10; 

      for (let i = 0; i < count; i += chunkSize * maxConcurrent) {
         const promises = [];
         for (let j = 0; j < maxConcurrent; j++) {
            const from = i + j * chunkSize;
            if (from >= count) break;
            
            promises.push(
               supabase.from('water_consumption').select('recorded_at, meter_sn, daily_consumption_m3').gte('recorded_at', startIso).lt('recorded_at', endIso).order('recorded_at', { ascending: true }).range(from, from + chunkSize - 1)
            );
         }
         const results = await Promise.all(promises);
         results.forEach(res => { if (res.data) allData.push(...res.data); });
      }
      
      setRawData(allData);
      setLoading(false);
    };

    fetchTargetedData();
  }, [startDate, endDate]);

  const availableDevices = useMemo(() => {
    const colors = ['#f97316', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#f43f5e', '#84cc16', '#a855f7', '#0ea5e9'];
    const meters = new Set(rawData.map(row => row.meter_sn));
    const devices = Array.from(meters).filter(Boolean).sort().map((m, i) => ({
      id: m,
      name: m,
      color: colors[i % colors.length]
    }));
    return [{ id: 'ALL', name: 'Facility Aggregated', color: '#3b82f6' }, ...devices];
  }, [rawData]);

  const handleGranularityChange = (t) => {
    setGranularity(t);
    const end = new Date(endDate);
    let start = new Date(endDate);
       
    if (t === 'daily') start.setDate(end.getDate() - 14); 
    else if (t === 'cumulative') start.setMonth(end.getMonth() - 1); 
    else if (t === 'weekly') start.setMonth(end.getMonth() - 2); 
    else if (t === 'monthly') start.setFullYear(end.getFullYear() - 1); 
    else if (t === 'yearly') start.setFullYear(end.getFullYear() - 2); 
       
    setStartDate(start.toISOString().split('T')[0]);
  };

  const { chartData, metrics } = useMemo(() => {
    let filtered = rawData;
    
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime() + 86400000; 
      filtered = rawData.filter(row => {
        const rowTime = new Date(row.recorded_at).getTime();
        return rowTime >= start && rowTime <= end;
      });
    }
    
    const timeMap = {};
    let totalActual = 0;
    let kpiTotal = 0;

    filtered.forEach(row => {
      const date = new Date(row.recorded_at);
      let label = "";
      
      if (granularity === 'daily' || granularity === 'cumulative') label = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      else if (granularity === 'weekly') label = `Wk of ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
      else if (granularity === 'monthly') label = date.toLocaleDateString([], { month: 'short', year: 'numeric' });
      else if (granularity === 'yearly') label = date.getFullYear().toString();

      if (!timeMap[label]) {
        timeMap[label] = { label, count: 0, ALL: 0 };
        availableDevices.forEach(d => { if(d.id !== 'ALL') timeMap[label][d.id] = 0; });
      }
      
      const val = parseFloat(row.daily_consumption_m3 || 0);
      
      timeMap[label]['ALL'] += val;
      if (timeMap[label][row.meter_sn] !== undefined) {
         timeMap[label][row.meter_sn] += val;
      }
      
      timeMap[label].count += 1;
      totalActual += val;
      
      if (selectedMeters.includes('ALL') || selectedMeters.includes(row.meter_sn)) {
          kpiTotal += val;
      }
    });

    if (selectedMeters.includes('ALL')) kpiTotal = totalActual;

    let runningSums = { ALL: 0 };
    availableDevices.forEach(d => { if(d.id !== 'ALL') runningSums[d.id] = 0; });
    const dataPoints = Object.keys(timeMap).length || 1;
    const smoothAverage = totalActual / dataPoints;

    const finalChartData = Object.values(timeMap).map(item => {
      availableDevices.forEach(d => {
        if (granularity === 'cumulative') {
          runningSums[d.id] += item[d.id];
          item[d.id] = parseFloat(runningSums[d.id].toFixed(2));
        } else {
          item[d.id] = parseFloat(item[d.id].toFixed(2));
        }
      });
      item.baseline = parseFloat(smoothAverage.toFixed(2));
      item.projected = parseFloat((item['ALL'] * 1.05).toFixed(2)); 
      return item;
    });

    return { 
      chartData: finalChartData, 
      metrics: { 
        totalUsage: kpiTotal, 
        formattedUsage: kpiTotal.toLocaleString('en-US', { maximumFractionDigits: 1 }) 
      } 
    };
  }, [rawData, selectedMeters, granularity, startDate, endDate, availableDevices]);

  const projectedMonthly = useMemo(() => {
    if (!startDate || !endDate || metrics.totalUsage === 0) return 0;
    const daysInPeriod = Math.max(1, (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000);
    const dailyAverage = metrics.totalUsage / daysInPeriod;
    return (dailyAverage * 30).toLocaleString('en-US', { maximumFractionDigits: 1 });
  }, [startDate, endDate, metrics.totalUsage]);

  const highestPeakDevice = useMemo(() => {
    if (rawData.length === 0) return 'N/A';
    const dataEnd = new Date(rawData[rawData.length - 1].recorded_at);
    let cutoff = new Date(dataEnd);
    
    if (peakTimeframe === 'day') cutoff.setDate(dataEnd.getDate() - 1);
    else if (peakTimeframe === 'week') cutoff.setDate(dataEnd.getDate() - 7);
    else if (peakTimeframe === 'month') cutoff.setMonth(dataEnd.getMonth() - 1);

    const timeframeData = rawData.filter(row => new Date(row.recorded_at) >= cutoff);
    const deviceTotals = {};
    timeframeData.forEach(row => {
      if (!deviceTotals[row.meter_sn]) deviceTotals[row.meter_sn] = 0;
      deviceTotals[row.meter_sn] += parseFloat(row.daily_consumption_m3 || 0);
    });

    let peakDevice = 'N/A'; let maxUsage = -1;
    for (const [meter, usage] of Object.entries(deviceTotals)) {
      if (usage > maxUsage) { maxUsage = usage; peakDevice = meter; }
    }
    return peakDevice;
  }, [rawData, peakTimeframe]);

  const handleExport = () => {
    const isAll = selectedMeters.includes('ALL');
    const csvRows = [
      ["Recorded At", "Meter Serial", "Daily Consumption (m³)"],
      ...rawData
        .filter(r => {
           if (!startDate || !endDate) return true;
           const rowTime = new Date(r.recorded_at).getTime();
           return rowTime >= new Date(startDate).getTime() && rowTime <= new Date(endDate).getTime() + 86400000;
        })
        .filter(r => isAll || selectedMeters.includes(r.meter_sn))
        .map(r => [r.recorded_at, r.meter_sn, r.daily_consumption_m3 || 0])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Water_Export_Filtered_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center"><Droplets className="mr-2 text-blue-500" /> Water Operation Centre</h2>
          <div className="flex items-center mt-1 space-x-2">
            <span className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 animate-ping'}`}></span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
              {loading ? 'Compiling Flow Nodes...' : 'Sensors Online: Syncing Active Window'}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className={`flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-xs font-bold outline-none text-slate-700 dark:text-slate-200" />
            <span className="text-slate-400 text-xs">-</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-xs font-bold outline-none text-slate-700 dark:text-slate-200" />
          </div>

          <MultiDeviceSelect devices={availableDevices} selected={selectedMeters} onChange={setSelectedMeters} loading={loading} />
          
          <button disabled={loading} onClick={handleExport} className="bg-blue-600 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center transition-colors uppercase"><Download size={14} className="mr-2" /> Excel</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title={selectedMeters.includes('ALL') ? "Period Flow" : "Selected Flow"} mainValue={loading ? <SkeletonPulse /> : `${metrics.formattedUsage} m³`} icon={TrendingUp} color="blue" onClick={() => !loading && handleGranularityChange('daily')}>
          <div className="flex justify-between items-center text-[10px] font-bold text-blue-600 uppercase mt-2"><span>In-depth Graph</span><BarChart3 size={12} /></div>
        </DashboardCard>
        
        <DashboardCard title={selectedMeters.includes('ALL') ? "Monthly Projected" : "Projected Flow"} mainValue={loading ? <SkeletonPulse /> : `${projectedMonthly} m³`} icon={Calendar} color="blue" onClick={() => !loading && handleGranularityChange('monthly')}>
           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-2">Based on active period daily avg</div>
        </DashboardCard>
        
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative hover:shadow-md transition-shadow cursor-pointer group">
           <div className="flex justify-between items-start">
             <div className="flex flex-col">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Highest Peak</span>
               <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                 {loading ? <SkeletonPulse /> : highestPeakDevice}
               </div>
             </div>
             <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"><Droplets size={20} /></div>
           </div>
           
           <div className="mt-4 flex justify-between items-center">
             <select disabled={loading} value={peakTimeframe} onChange={(e) => { e.stopPropagation(); setPeakTimeframe(e.target.value); }} className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter bg-blue-50 dark:bg-blue-900/20 border-none outline-none rounded p-1 cursor-pointer disabled:opacity-50">
                <option value="day">Past 24H</option><option value="week">Past Week</option><option value="month">Past Month</option>
             </select>
             <button disabled={loading} onClick={() => navigate(`/water/devices?highlight=${highestPeakDevice}`)} className="text-[10px] font-bold text-slate-400 hover:text-blue-600 flex items-center uppercase transition-colors disabled:opacity-50"><ArrowUpRight size={10} className="mr-1" /> Floorplan</button>
           </div>
        </div>
        
        <DashboardCard title="Leak Detection" mainValue="Monitoring" icon={Activity} color="green" onClick={() => navigate('/water/logs')}>
           <div className="text-[10px] font-bold text-green-600 uppercase tracking-tighter mt-2">Audit Logs & Alert Rules</div>
        </DashboardCard>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[500px] flex flex-col">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div className={`flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            {['daily', 'weekly', 'monthly', 'yearly', 'cumulative'].map(t => (
              <button key={t} onClick={() => handleGranularityChange(t)} className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${granularity === t ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {t === 'cumulative' ? '1M Growth Curve' : t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6">
             <label className={`flex items-center gap-2 cursor-pointer group ${loading || !selectedMeters.includes('ALL') ? 'opacity-50 pointer-events-none' : ''}`}>
                <input disabled={loading || !selectedMeters.includes('ALL')} type="checkbox" checked={showProjected} onChange={() => setShowProjected(!showProjected)} className="w-4 h-4 rounded text-blue-500" />
                <span className={`text-[11px] font-bold uppercase ${showProjected ? 'text-blue-600' : 'text-slate-400'}`}>Projected</span>
             </label>
             <label className={`flex items-center gap-2 cursor-pointer group ${loading || !selectedMeters.includes('ALL') ? 'opacity-50 pointer-events-none' : ''}`}>
                <input disabled={loading || !selectedMeters.includes('ALL')} type="checkbox" checked={showBaseline} onChange={() => setShowBaseline(!showBaseline)} className="w-4 h-4 rounded text-[#005f5f]" />
                <span className={`text-[11px] font-bold uppercase ${showBaseline ? 'text-[#005f5f]' : 'text-slate-400'}`}>Period Avg Baseline</span>
             </label>
          </div>
        </div>

        <div className="w-full h-[400px] mt-2 relative">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <RefreshCw className="animate-spin text-blue-500 mb-4" size={32} />
              <span className="text-xs font-bold text-blue-500 uppercase tracking-widest animate-pulse">Aggregating Flow Nodes...</span>
              <div className="flex items-end gap-2 mt-6 h-16">
                 <div className="w-3 bg-blue-500/20 rounded animate-pulse h-6" style={{ animationDelay: '0ms' }}></div>
                 <div className="w-3 bg-blue-500/40 rounded animate-pulse h-10" style={{ animationDelay: '150ms' }}></div>
                 <div className="w-3 bg-blue-500/60 rounded animate-pulse h-16" style={{ animationDelay: '300ms' }}></div>
                 <div className="w-3 bg-blue-500/80 rounded animate-pulse h-8" style={{ animationDelay: '450ms' }}></div>
                 <div className="w-3 bg-blue-500 rounded animate-pulse h-12" style={{ animationDelay: '600ms' }}></div>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase text-xs">No telemetry data found for selected period.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  {availableDevices.map(d => (
                    <linearGradient key={d.id} id={`color${d.id.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={d.color} stopOpacity={selectedMeters.length > 1 ? 0.4 : 0.1}/>
                      <stop offset="95%" stopColor={d.color} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-700" />
                <XAxis dataKey="label" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} minTickGap={30} tick={{fill: '#94a3b8'}} />
                <YAxis fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                
                {/* Dynamically Map Over Selected Meters */}
                {selectedMeters.map(id => {
                   const device = availableDevices.find(d => d.id === id);
                   if (!device) return null;
                   return <Area key={id} type="monotone" dataKey={id} name={device.name} stroke={device.color} strokeWidth={3} fill={`url(#color${id.replace(/\s+/g, '')})`} fillOpacity={1} />;
                })}

                {showProjected && selectedMeters.includes('ALL') && <RechartsLine type="monotone" dataKey="projected" name="Projected Flow" stroke="#0ea5e9" strokeDasharray="4 4" dot={false} strokeWidth={2} />}
                {showBaseline && granularity !== 'cumulative' && selectedMeters.includes('ALL') && <RechartsLine type="monotone" dataKey="baseline" name="Baseline (Avg)" stroke="#005f5f" strokeWidth={2} dot={false} strokeDasharray="2 2" />}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaterModule;