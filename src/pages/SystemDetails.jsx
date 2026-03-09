import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  MapPin, List as ListIcon, AlertTriangle, 
  Activity, Zap, ShieldAlert, CheckCircle2, RefreshCw, Droplets, AlertCircle, Download, Archive, Clock
} from 'lucide-react';
import { supabase } from '../supabaseClient';

// ==========================================
// MAPPED COORDINATES FOR ENERGY & WATER
// ==========================================
const ENERGY_POSITIONS = {
  'FCU 4': { x: 10, y: 30 }, 'FCU 5': { x: 30, y: 30 }, 'FCU 6': { x: 50, y: 30 }, 'FCU 7': { x: 70, y: 30 }, 'FCU 8': { x: 90, y: 30 },
  'FCU 9': { x: 10, y: 70 }, 'FCU 10': { x: 30, y: 70 }, 'FCU 11': { x: 50, y: 70 }, 'FCU 12': { x: 70, y: 70 }, 'FCU 13': { x: 90, y: 70 },
  'LIGHTING': { x: 50, y: 50 } 
};

const WATER_POSITIONS = {
  'Cooling Tower 1': { x: 75, y: 15 }, 'Cooling Tower 2': { x: 80, y: 15 }, 'Cooling Tower 3': { x: 85, y: 15 },
  'Cooling Tower 4': { x: 90, y: 15 }, 'Cooling Tower 5': { x: 95, y: 15 },
  'Kitchen': { x: 65, y: 40 }, 
  'Male Toilet': { x: 75, y: 55 }, 'Female Toilet': { x: 85, y: 55 }, 
  'Main 4': { x: 60, y: 85 }, 'Main 6': { x: 75, y: 85 }  
};

const FALLBACK_POSITIONS = [{ x: 20, y: 30 }, { x: 20, y: 50 }, { x: 20, y: 70 }, { x: 20, y: 90 }];

// ==========================================
// 1. DEVICE INFO PAGE (Dual Mode)
// ==========================================
export const DeviceInfoPage = () => {
  const location = useLocation();
  const isWater = location.pathname.includes('/water');
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  const highlightedDevice = queryParams.get('highlight');

  const [viewMode, setViewMode] = useState('map'); 
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState(highlightedDevice || null);
  const [hoveredZone, setHoveredZone] = useState(null);

  useEffect(() => {
    fetchDeviceData();
    if (highlightedDevice) setViewMode('map');
  }, [highlightedDevice, isWater]);

  const fetchDeviceData = async () => {
    setLoading(true);
    let allData = [];
    let from = 0; const step = 1000; let keepFetching = true;
    const table = isWater ? 'water_consumption' : 'power_consumption';

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoffIso = ninetyDaysAgo.toISOString();

    while (keepFetching) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .gte('recorded_at', cutoffIso) 
        .order('recorded_at', { ascending: false })
        .range(from, from + step - 1);
        
      if (error) { keepFetching = false; }
      if (data && data.length > 0) {
        allData.push(...data);
        if (data.length < step) keepFetching = false; else from += step;
      } else { keepFetching = false; }
    }
    setRawData(allData);
    setLoading(false);
  };

  const { deviceStats, lightingZones, listData } = useMemo(() => {
    const gridMap = {};
    if (!isWater) {
      for (let i = 0; i < 10; i++) {
         const id = `FCU ${i + 4}`; 
         gridMap[id] = { id: id, status: 'OFFLINE', daily: 0, weekly: 0, monthly: 0, threeMonth: 0, cumulative: 0, latestValue: 0, x: 0, y: 0, hasData: false };
      }
    }

    const lights = isWater ? [] : Array.from({ length: 5 }, (_, i) => ({
        id: `LIGHTING-${i + 1}`, status: 'OFFLINE', daily: 0, weekly: 0, monthly: 0, threeMonth: 0, cumulative: 0, latestValue: 0, x: 10 + (i * 20), hasData: false, bulbs: Array.from({ length: 5 }, (_, j) => ({ y: j * 15 + 10 }))
    }));

    if (rawData.length === 0) return { deviceStats: Object.values(gridMap), lightingZones: lights, listData: [] };

    const latestDate = new Date(rawData[0].recorded_at); 
    const dayCutoff = new Date(latestDate).getTime() - (24 * 60 * 60 * 1000);
    const weekCutoff = new Date(latestDate).getTime() - (7 * 24 * 60 * 60 * 1000);
    const monthCutoff = new Date(latestDate).getTime() - (30 * 24 * 60 * 60 * 1000);
    const threeMonthCutoff = new Date(latestDate).getTime() - (90 * 24 * 60 * 60 * 1000);

    let lightingData = { daily: 0, weekly: 0, monthly: 0, threeMonth: 0, cumulative: 0, latestValue: 0, hasData: false };

    rawData.forEach(row => {
      const meter = row.meter_sn;
      const rowTime = new Date(row.recorded_at).getTime();
      const val = parseFloat(isWater ? (row.daily_consumption_m3 || 0) : (row.hourly_kwh || 0));

      if (!isWater && meter === 'LIGHTING') {
         lightingData.hasData = true; lightingData.cumulative += val;
         if (rowTime >= threeMonthCutoff) lightingData.threeMonth += val;
         if (rowTime >= monthCutoff) lightingData.monthly += val;
         if (rowTime >= weekCutoff) lightingData.weekly += val;
         if (rowTime >= dayCutoff) { lightingData.daily += val; if (lightingData.latestValue === 0) lightingData.latestValue = val; }
      } else {
         if (!gridMap[meter]) {
            gridMap[meter] = { id: meter, status: 'OFFLINE', daily: 0, weekly: 0, monthly: 0, threeMonth: 0, cumulative: 0, latestValue: 0, x: 0, y: 0, hasData: false };
         }
         gridMap[meter].hasData = true; gridMap[meter].cumulative += val;
         if (rowTime >= threeMonthCutoff) gridMap[meter].threeMonth += val;
         if (rowTime >= monthCutoff) gridMap[meter].monthly += val;
         if (rowTime >= weekCutoff) gridMap[meter].weekly += val;
         if (rowTime >= dayCutoff) { gridMap[meter].daily += val; if (gridMap[meter].latestValue === 0) gridMap[meter].latestValue = val; }
      }
    });

    const activePositions = isWater ? WATER_POSITIONS : ENERGY_POSITIONS;

    const devArray = Object.values(gridMap).map((device, index) => {
      device.threeMonthAvg = device.threeMonth / 3;
      if (device.hasData) {
        if (device.latestValue === 0) {
            device.status = 'OFFLINE';
        } else {
            device.status = device.latestValue > (isWater ? 50.0 : 2.0) ? 'PEAK' : 'NORMAL';
        }
      }
      const assignedCoords = activePositions[device.id] || FALLBACK_POSITIONS[index % FALLBACK_POSITIONS.length];
      device.x = assignedCoords.x;
      device.y = assignedCoords.y;
      return device;
    });
    
    if (!isWater) {
      const lightingStatus = lightingData.latestValue > 1.0 ? 'PEAK' : 'NORMAL';
      lights.forEach(zone => {
         zone.hasData = lightingData.hasData; zone.status = lightingStatus;
         zone.daily = lightingData.daily / 5; zone.monthly = lightingData.monthly / 5; zone.cumulative = lightingData.cumulative / 5;
      });
    }

    const combinedList = [...devArray.filter(d => d.hasData), ...lights.filter(l => l.hasData)].sort((a, b) => a.id.localeCompare(b.id));

    return { deviceStats: devArray, lightingZones: lights, listData: combinedList };
  }, [rawData, isWater]);

  const unit = isWater ? 'm³' : 'kWh';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight flex items-center">
           {isWater ? <Droplets className="mr-2 text-blue-500" /> : <Zap className="mr-2 text-orange-500"/>} 
           {isWater ? 'Facility Water Mapping' : 'Energy Location Mapping'}
        </h2>
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg mt-4 md:mt-0">
          <button onClick={() => setViewMode('map')} className={`flex items-center px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${viewMode === 'map' ? 'bg-slate-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><MapPin size={14} className="mr-2" /> Map View</button>
          <button onClick={() => setViewMode('list')} className={`flex items-center px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${viewMode === 'list' ? (isWater ? 'bg-blue-600' : 'bg-[#005f5f]') + ' text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><ListIcon size={14} className="mr-2" /> List View</button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-[#005f5f] font-mono text-sm"><RefreshCw className="animate-spin mb-3" size={24} /> Compiling Telemetry...</div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Device ID</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Daily ({unit})</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">90D Total</th>
              </tr>
            </thead>
            <tbody>
              {listData.map((device) => (
                <tr key={device.id} className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 transition-colors ${highlightedDevice === device.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}>
                  <td className="p-4 text-sm font-bold flex items-center gap-2">{device.id}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${device.status === 'NORMAL' ? 'bg-green-100 text-green-700' : (device.status === 'OFFLINE' ? 'bg-slate-200 text-slate-600' : 'bg-red-100 text-red-700')}`}>
                        {device.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-mono">{device.daily.toFixed(2)}</td>
                  <td className="p-4 text-sm font-mono">{device.monthly.toFixed(2)}</td>
                  <td className="p-4 text-sm font-mono font-bold">{device.cumulative.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-inner rounded-xl h-[600px] flex flex-col relative animate-in fade-in zoom-in-95 duration-500" onClick={() => setSelectedPin(null)}>
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            {isWater ? (
                <img src="/water-layout.png" alt="Water Facility Layout" className="w-full h-full object-contain opacity-50" onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/800x600?text=Missing+water-layout.png+in+Public+Folder"; }} />
            ) : (
                <div className="w-full h-full opacity-20 dark:opacity-10 dark:invert pointer-events-none">
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="stroke-slate-900 stroke-2 fill-none">
                    <rect x="0" y="0" width="100" height="100" strokeWidth="4" />
                    <rect x="0" y="0" width="20" height="100" fill="url(#kitchenhatch)" strokeWidth="1" />
                    <text x="10" y="50" transform="rotate(-90, 10, 50)" fontSize="3" textAnchor="middle" fill="#333" stroke="none" fontWeight="bold">KITCHEN AREA</text>
                    <rect x="22" y="10" width="5" height="80" rx="1" strokeWidth="1" fill="#f3f4f6" />
                    <text x="24.5" y="50" transform="rotate(-90, 24.5, 50)" fontSize="2" textAnchor="middle" fill="#666" stroke="none" fontWeight="bold">SERVING COUNTER</text>
                    <g><circle cx="45" cy="30" r="4" strokeWidth="1" /><circle cx="70" cy="30" r="4" strokeWidth="1" /><circle cx="90" cy="30" r="4" strokeWidth="1" /><circle cx="55" cy="70" r="4" strokeWidth="1" /><circle cx="80" cy="70" r="4" strokeWidth="1" /></g>
                    <defs><pattern id="kitchenhatch" width="2" height="2" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="2" style={{stroke:'black', strokeWidth:0.1}} /></pattern></defs>
                  </svg>
                </div>
            )}
          </div>

          {!isWater && lightingZones.map((zone) => {
            const isActive = hoveredZone === zone.id || selectedPin === zone.id;
            return (
              <div key={zone.id}>
                <div className="absolute top-[10%] bottom-[10%] w-12 transform -translate-x-1/2 z-30 cursor-pointer" style={{ left: `${zone.x}%` }} onMouseEnter={() => setHoveredZone(zone.id)} onMouseLeave={() => setHoveredZone(null)} onClick={(e) => { e.stopPropagation(); setSelectedPin(selectedPin === zone.id ? null : zone.id); }} />
                {zone.bulbs.map((bulb, idx) => (
                  <div key={`${zone.id}-${idx}`} className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ left: `${zone.x}%`, top: `${bulb.y}%` }}>
                    {zone.hasData && isActive && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full transition-all duration-500 bg-yellow-400 opacity-30" style={{ background: `radial-gradient(circle, rgba(250, 204, 21, 0.5) 0%, transparent 70%)` }}></div>}
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center relative z-10 transition-all duration-300 ${zone.hasData ? (zone.status === 'PEAK' ? 'bg-orange-400' : 'bg-yellow-400 shadow-lg shadow-yellow-300') : 'bg-slate-400'} ${isActive ? 'scale-150 ring-2 ring-yellow-200' : ''}`}></div>
                  </div>
                ))}
                <div className={`absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg transition-opacity border border-slate-200 dark:border-slate-700 shadow-2xl w-48 pointer-events-none z-50 ${isActive ? 'opacity-100 block' : 'opacity-0 hidden'}`} style={{ left: `${zone.x}%`, top: '50%' }}>
                  <div className={`${!zone.hasData ? 'bg-slate-700 text-slate-400' : (zone.status === 'PEAK' ? 'bg-orange-500' : 'bg-yellow-500')} text-white px-3 py-2 font-bold text-xs uppercase text-center rounded-t-lg`}>{zone.id}</div>
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-1"><span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px]">Status</span><span className={`font-black text-[10px] uppercase ${!zone.hasData ? 'text-slate-500' : (zone.status === 'PEAK' ? 'text-orange-500' : 'text-yellow-500')}`}>{zone.status}</span></div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-1"><span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px]">Daily</span><span className="font-mono font-semibold text-xs text-slate-900 dark:text-white">{zone.daily.toFixed(2)} {unit}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px]">90D Total</span><span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{zone.cumulative.toFixed(0)}</span></div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* DEVICE PINS */}
          {deviceStats.map((device) => {
            const isPeak = device.status === 'PEAK';
            const isOffline = device.status === 'OFFLINE' || !device.hasData;
            
            let color = isOffline ? 'bg-slate-500' : (isPeak ? (isWater ? 'bg-red-500' : 'bg-purple-500') : (isWater ? 'bg-blue-500' : 'bg-green-500'));
            const isSelected = selectedPin === device.id || highlightedDevice === device.id;

            return (
              <div key={device.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer" style={{ left: `${device.x}%`, top: `${device.y}%`, zIndex: isSelected ? 50 : 20 }} onClick={(e) => { e.stopPropagation(); setSelectedPin(isSelected ? null : device.id); }}>
                {!isOffline && <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none opacity-40 transition-all duration-1000 ${isPeak ? (isWater ? 'bg-red-400' : 'bg-purple-400') : (isWater ? 'bg-blue-400' : 'bg-green-400')}`} style={{ background: `radial-gradient(circle, ${isPeak ? (isWater ? 'rgba(239, 68, 68, 0.4)' : 'rgba(168, 85, 247, 0.4)') : (isWater ? 'rgba(59, 130, 246, 0.4)' : 'rgba(34, 197, 94, 0.4)')} 0%, transparent 70%)` }}></div>}
                <div className="flex flex-col items-center">
                   <div className={`flex items-center justify-center w-4 h-4 rounded-full ${color} ring-4 ring-white dark:ring-slate-800 shadow-lg ${!isOffline ? 'animate-pulse' : ''}`}>
                       {isOffline && isWater && <AlertCircle size={10} className="text-white" />}
                   </div>
                   <span className={`mt-2 text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm ${isOffline ? 'bg-slate-800 text-slate-300' : 'bg-slate-800 text-white border border-slate-700'} uppercase whitespace-nowrap`}>{device.id}</span>
                </div>
                
                <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg transition-opacity border border-slate-200 dark:border-slate-700 shadow-2xl w-48 pointer-events-none z-50 ${isSelected ? 'opacity-100 block' : 'opacity-0 hidden group-hover:opacity-100 group-hover:block'}`}>
                  <div className={`${isOffline ? 'bg-slate-700 text-slate-400' : (isPeak ? (isWater ? 'bg-red-600' : 'bg-purple-600') : (isWater ? 'bg-blue-600' : 'bg-[#005f5f]'))} text-white px-3 py-2 font-bold text-xs uppercase text-center rounded-t-lg`}>{device.id}</div>
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-1"><span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px]">Status</span><span className={`font-black text-[10px] uppercase ${isOffline ? 'text-slate-500' : (isPeak ? (isWater ? 'text-red-500' : 'text-purple-500') : (isWater ? 'text-blue-500' : 'text-green-500'))}`}>{device.status}</span></div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-1"><span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px]">Daily</span><span className="font-mono font-semibold text-xs">{device.daily.toFixed(1)} {unit}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px]">90D Total</span><span className="font-mono font-bold text-xs">{device.cumulative.toFixed(0)}</span></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. DATA LOG PAGE (Audit Logs & Alert Rules)
// ==========================================
export const DataLogPage = () => {
  const location = useLocation();
  const isWater = location.pathname.includes('/water');

  const [meters, setMeters] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('ALL DEVICES');
  const [selectedCondition, setSelectedCondition] = useState(isWater ? 'leak' : 'surge');
  const [loading, setLoading] = useState(true);
  const [logTab, setLogTab] = useState('recent'); // 'recent' or 'archive'

  // Generate 90 days of simulated logs
  const simulatedLogs = useMemo(() => {
    const logs = [];
    const today = new Date();
    
    for (let i = 90; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // End of Day Sync Log
      const syncDate = new Date(date);
      syncDate.setHours(23, 59, 0, 0);
      
      logs.push({
        id: `sync-${i}`,
        timestamp: syncDate.getTime(),
        displayTime: syncDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        title: 'Edge Sync Routine',
        desc: 'Daily telemetry reconciled successfully across all nodes. No anomalies detected.',
        type: 'success'
      });

      // Random ~15% chance to inject an anomaly for a day
      if (Math.random() < 0.15) {
        const faultDate = new Date(date);
        faultDate.setHours(Math.floor(Math.random() * 23), Math.floor(Math.random() * 59));
        
        const isError = Math.random() > 0.5;
        let title, desc, device;

        if (isWater) {
           device = `Cooling Tower ${Math.floor(Math.random() * 5) + 1}`;
           title = isError ? 'Leak Suspected' : 'Device Offline';
           desc = isError ? `Continuous abnormal flow detected at ${device}. Check valve integrity.` : `${device} missed consecutive heartbeat pings. Reconnecting...`;
        } else {
           device = `FCU ${Math.floor(Math.random() * 10) + 4}`;
           title = isError ? 'Surge Detected' : 'Phase Imbalance';
           desc = isError ? `Power spike > 20% baseline recorded at ${device}.` : `Voltage phase mismatch detected at ${device}.`;
        }

        logs.push({
          id: `fault-${i}`,
          timestamp: faultDate.getTime(),
          displayTime: faultDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          title: title,
          desc: desc,
          type: isError ? 'error' : 'warning'
        });
      }
    }
    // Sort newest first
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }, [isWater]);

  const [activeLogs, setActiveLogs] = useState(simulatedLogs);

  useEffect(() => {
    const fetchMeters = async () => {
      setLoading(true);
      let allMeters = new Set();
      let from = 0; const step = 1000; let keepFetching = true;
      const table = isWater ? 'water_consumption' : 'power_consumption';

      while (keepFetching) {
        const { data, error } = await supabase.from(table).select('meter_sn').range(from, from + step - 1);
        if (error) keepFetching = false;
        if (data && data.length > 0) {
          data.forEach(row => { if (row.meter_sn) allMeters.add(row.meter_sn); });
          if (data.length < step) keepFetching = false; else from += step;
        } else keepFetching = false;
      }
      setMeters(['ALL DEVICES', ...Array.from(allMeters).sort()]);
      setLoading(false);
    };
    fetchMeters();
  }, [isWater]);

  const handleActivateRule = () => {
    const now = new Date();
    const formattedCondition = selectedCondition.replace(/_/g, ' ').toUpperCase();
    
    const newLog = {
      id: Date.now(),
      timestamp: now.getTime(),
      displayTime: now.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      title: `${formattedCondition} RULE ACTIVATED`,
      desc: `Rule definition applied to ${selectedDevice}. System will isolate event logs matching this parameter.`,
      type: 'warning'
    };
    
    setActiveLogs([newLog, ...activeLogs]);
  };

  const downloadHistory = () => {
    const csvRows = [
      ["Timestamp", "Event Type", "Event Title", "Description"],
      ...activeLogs.map(log => [
        `"${log.displayTime}"`, 
        log.type.toUpperCase(), 
        `"${log.title}"`, 
        `"${log.desc}"`
      ])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${isWater ? 'Water' : 'Energy'}_Audit_Log_History.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const energyConditions = [
    { value: 'surge', label: 'Surge Detected (> 20% spike)' },
    { value: 'continuous_draw', label: 'Continuous Draw (24h+ Runtime)' },
    { value: 'offline', label: 'Device Offline (No telemetry > 1h)' },
    { value: 'baseline_exceeded', label: 'Usage Exceeds 3M Baseline' },
    { value: 'phase_imbalance', label: 'Phase Imbalance Detected' }
  ];

  const waterConditions = [
    { value: 'leak', label: 'Leak Suspected (Continuous Flow)' },
    { value: 'pipe_burst', label: 'Pipe Burst (Sudden High Draw)' },
    { value: 'offline', label: 'Device Offline (No telemetry > 1h)' },
    { value: 'baseline_exceeded', label: 'Usage Exceeds 3M Baseline' },
    { value: 'backflow', label: 'Backflow Detected (Negative Pressure)' }
  ];

  const conditions = isWater ? waterConditions : energyConditions;
  
  // Filter logs for Current Month vs Full History
  const thirtyDaysAgo = new Date().getTime() - (30 * 24 * 60 * 60 * 1000);
  const displayLogs = logTab === 'recent' ? activeLogs.filter(log => log.timestamp >= thirtyDaysAgo) : activeLogs;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
         <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight flex items-center">
           <ShieldAlert className="mr-2 text-red-500" /> {isWater ? 'Water Audit Logs' : 'Energy Audit Logs'}
         </h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm col-span-1 h-fit">
          <h3 className="text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 uppercase tracking-widest mb-6 p-2 rounded inline-block">Create System Alert</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Device</label>
              <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)} disabled={loading} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none">
                {loading ? <option>Scanning Database...</option> : meters.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Trigger Condition</label>
              <select value={selectedCondition} onChange={(e) => setSelectedCondition(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none">
                {conditions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <button onClick={handleActivateRule} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase py-3 rounded-lg mt-4 shadow-sm flex items-center justify-center transition-all active:scale-95">
               <AlertTriangle size={14} className="mr-2" /> Activate Rule
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm col-span-1 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
               <button onClick={() => setLogTab('recent')} className={`flex items-center px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${logTab === 'recent' ? 'bg-[#005f5f] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                 <Clock size={14} className="mr-2" /> Current Month
               </button>
               <button onClick={() => setLogTab('archive')} className={`flex items-center px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${logTab === 'archive' ? 'bg-slate-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                 <Archive size={14} className="mr-2" /> Archive & Export
               </button>
            </div>
            
            {logTab === 'archive' && (
               <button onClick={downloadHistory} className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-colors">
                 <Download size={14} className="mr-2" /> Export Full History
               </button>
            )}
          </div>
          
          <div className="p-6 flex-1 space-y-4 overflow-y-auto max-h-[500px] bg-slate-50/50 dark:bg-slate-900/20">
            {displayLogs.map((log) => (
              <div key={log.id} className={`flex items-start p-4 bg-white dark:bg-slate-800 rounded-lg border-l-4 shadow-sm ${log.type === 'error' ? 'border-red-500' : (log.type === 'warning' ? 'border-orange-500' : 'border-green-500')}`}>
                <div className="w-24 text-[10px] font-mono text-slate-500 font-bold mt-1">{log.displayTime}</div>
                <div className="ml-4 flex-1">
                  <h4 className={`text-sm font-bold uppercase tracking-tight flex items-center ${log.type === 'error' ? 'text-red-600' : (log.type === 'warning' ? 'text-orange-600' : 'text-green-600')}`}>
                    {log.type === 'success' && <CheckCircle2 size={14} className="mr-1"/>}
                    {log.type === 'error' && <AlertTriangle size={14} className="mr-1"/>}
                    {log.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">{log.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};