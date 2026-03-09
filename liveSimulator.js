import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import dotenv from 'dotenv';

// Load variables from your existing .env.local file
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Device Registries matching your setup
const ENERGY_METERS = ['FCU 4', 'FCU 5', 'FCU 6', 'FCU 7', 'FCU 8', 'FCU 9', 'FCU 10', 'FCU 11', 'FCU 12', 'FCU 13', 'LIGHTING'];
const WATER_METERS = ['Cooling Tower 1', 'Cooling Tower 2', 'Cooling Tower 3', 'Cooling Tower 4', 'Cooling Tower 5', 'Kitchen', 'Male Toilet', 'Female Toilet', 'Main 4', 'Main 6'];

// Generate localized timestamp
const getTimestamp = () => new Date().toISOString();

// ==========================================
// ENERGY PUSH LOGIC
// ==========================================
const pushEnergyData = async () => {
  console.log(`[${new Date().toLocaleTimeString()}] ⚡ Syncing Hourly Energy Telemetry...`);
  
  const payload = ENERGY_METERS.map(meter => {
    // Generate realistic variance based on device type
    const baseDraw = meter === 'LIGHTING' ? 3.5 : 1.5; 
    const variance = (Math.random() * 0.8) - 0.2; // slight randomization
    const value = Math.max(0.1, baseDraw + variance).toFixed(2);
    
    return {
      meter_sn: meter,
      recorded_at: getTimestamp(),
      hourly_kwh: parseFloat(value)
    };
  });

  const { error } = await supabase.from('power_consumption').insert(payload);
  if (error) console.error("❌ Energy Sync Failed:", error.message);
  else console.log(`✅ Successfully pushed ${payload.length} Energy records.`);
};

// ==========================================
// WATER PUSH LOGIC
// ==========================================
const pushWaterData = async () => {
  console.log(`[${new Date().toLocaleTimeString()}] 💧 Syncing 12-Hour Water Telemetry...`);
  
  // First, we need to fetch the last known cumulative total to accurately increment it
  const payload = await Promise.all(WATER_METERS.map(async (meter) => {
    const { data } = await supabase
      .from('water_consumption')
      .select('cumulative_reading_m3')
      .eq('meter_sn', meter)
      .order('recorded_at', { ascending: false })
      .limit(1);

    const lastCumulative = data && data.length > 0 ? parseFloat(data[0].cumulative_reading_m3 || 0) : 1000;
    
    let baseFlow = 2.0;
    if (meter.includes('Main')) baseFlow = 75.0;
    if (meter.includes('Cooling')) baseFlow = 20.0;
    if (meter === 'Kitchen') baseFlow = 10.0;

    const flowValue = parseFloat((baseFlow + (Math.random() * 5)).toFixed(2));
    const newCumulative = parseFloat((lastCumulative + flowValue).toFixed(2));

    return {
      meter_sn: meter,
      recorded_at: getTimestamp(),
      daily_consumption_m3: flowValue,
      cumulative_reading_m3: newCumulative
    };
  }));

  const { error } = await supabase.from('water_consumption').insert(payload);
  if (error) console.error("❌ Water Sync Failed:", error.message);
  else console.log(`✅ Successfully pushed ${payload.length} Water records.`);
};

// ==========================================
// CRON SCHEDULER
// ==========================================
console.log("🚀 GE IBMS Live Telemetry Simulator Activated.");
console.log("Listening for heartbeat intervals...\n");

// Push immediately on startup just to verify it works
pushEnergyData();

// Schedule Energy: Runs at minute 0 past every hour
cron.schedule('0 * * * *', () => {
  pushEnergyData();
});

// Schedule Water: Runs at minute 0 past every 12th hour (e.g., Midnight and Noon)
cron.schedule('0 */12 * * *', () => {
  pushWaterData();
});