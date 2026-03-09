// src/mockData.js

// 1. Structural Data for the Automation Heatmap (Required for UI Rendering)
export const INITIAL_FCUS = [
  { id: 'fcu-1', name: 'FCU 01', x: 25, y: 35, currentTemp: 22, setTemp: 24, mode: 'Auto', controlMode: 'Cooling', fanSpeed: 'High', isOn: true, powerUsage: 1.2 },
  { id: 'fcu-2', name: 'FCU 02', x: 55, y: 35, currentTemp: 24, setTemp: 24, mode: 'Optimised', controlMode: 'Cooling', fanSpeed: 'Med', isOn: true, powerUsage: 0.8 },
  { id: 'fcu-3', name: 'FCU 03', x: 85, y: 35, currentTemp: 26, setTemp: 23, mode: 'Manual', controlMode: 'Cooling', fanSpeed: 'Low', isOn: true, powerUsage: 1.5 },
];

export const INITIAL_LIGHTS = [
  { id: 'l-1', name: 'Zone A - Office', x: 30, brightness: 80, isOn: true, activeSchedules: 2, bulbs: [{y: 20}, {y: 40}] },
  { id: 'l-2', name: 'Zone B - Lobby', x: 70, brightness: 50, isOn: true, activeSchedules: 1, bulbs: [{y: 20}, {y: 60}] },
];

export const MOCK_RULES = [
  { id: 1, name: 'Energy Saver Mode', condition: 'Time > 18:00', action: 'Set Temp 26°C', status: true },
  { id: 2, name: 'Peak Load Shedding', condition: 'Usage > 50kW', action: 'Dim Lights 30%', status: false },
];

// 2. Logs and AI (Structural)
export const MOCK_LOGS = [
  { id: 1, timestamp: '10:30 AM', system: 'Energy', device: 'FCU 4', message: 'High Power Draw Detected', status: 'Critical', type: 'fault' },
];

export const MOCK_AI_DATA = {
  optimizationTrend: [
    { name: '00:00', baseline: 120, optimised: 110 }, { name: '08:00', baseline: 350, optimised: 280 }, 
    { name: '12:00', baseline: 480, optimised: 390 }
  ],
  recentActions: [
    { id: 1, time: '10:15 AM', type: 'Cooling', message: 'Pre-cooled Office A.', impact: '-12% Energy' }
  ]
};