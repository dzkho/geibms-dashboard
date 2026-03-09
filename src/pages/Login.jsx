import React, { useState } from 'react';
import { Lock, User, Droplets, Zap, Settings } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // ADD THESE TWO LINES:
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // REPLACE your handleFakeLogin with this handleRealLogin:
  const handleRealLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // This reaches out to Supabase to verify the credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setError("ACCESS DENIED: " + error.message);
      setLoading(false);
    } else {
      console.log("Access Granted by Supabase!");
      onLoginSuccess(); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 font-sans">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-[#005f5f] p-8 text-center border-b border-[#004d4d]">
          <div className="flex justify-center space-x-3 mb-4 text-white/80">
            <Zap size={24} />
            <Droplets size={24} />
            <Settings size={24} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">GEI<span className="text-green-400">BMS</span></h1>
          <p className="text-white/70 text-sm mt-2 uppercase tracking-widest font-bold">Integrated Operation Centre</p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <form onSubmit={handleRealLogin} className="space-y-6">
            {error && (
  <div className="bg-red-900/50 border border-red-500 text-red-400 p-3 rounded-lg text-sm font-bold text-center">
    {error}
  </div>
)}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Operator ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-500" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-slate-900 text-white placeholder-slate-600"
                  placeholder="admin@geibms.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Security Clearance</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-500" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-slate-900 text-white placeholder-slate-600"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center shadow-lg shadow-green-900/50 mt-4"
            >
              {loading ? "Authenticating..." : "Initialize System"}
            </button>
          </form>
        </div>
        
      </div>
      <div className="mt-8 text-slate-500 text-xs text-center font-mono">
        <p>System v3.1.0 • Secure Edge Connection</p>
      </div>
    </div>
  );
};

export default Login;