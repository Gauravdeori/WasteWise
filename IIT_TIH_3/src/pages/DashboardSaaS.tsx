import { Activity, Scale, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const wasteData = [
  { name: 'Mon', waste: 120, baseline: 150 },
  { name: 'Tue', waste: 110, baseline: 145 },
  { name: 'Wed', waste: 135, baseline: 160 },
  { name: 'Thu', waste: 90, baseline: 140 },
  { name: 'Fri', waste: 105, baseline: 155 },
  { name: 'Sat', waste: 85, baseline: 130 },
  { name: 'Sun', waste: 75, baseline: 120 },
];

const categoryData = [
  { name: 'Vegetables', amount: 45 },
  { name: 'Grains', amount: 30 },
  { name: 'Proteins', amount: 15 },
  { name: 'Dairy', amount: 10 },
];

export default function DashboardSaaS() {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500 font-medium">Real-time metrics from 12 active bins across campus.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          System Live
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Scale className="w-5 h-5 text-blue-600" />
            </div>
            <span className="flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              <TrendingDown className="w-3 h-3" /> 12%
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mb-1">Total Waste (Today)</p>
          <h3 className="text-2xl font-extrabold text-slate-900">42.5 kg</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              <TrendingDown className="w-3 h-3" /> 8%
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mb-1">Estimated Cost Saved</p>
          <h3 className="text-2xl font-extrabold text-slate-900">₹3,450</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="flex items-center gap-1 text-sm font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
              <Activity className="w-3 h-3" /> 2 Alerts
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mb-1">Anomalies Detected</p>
          <h3 className="text-2xl font-extrabold text-slate-900">2 Bins</h3>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4 backdrop-blur-sm">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-sm text-slate-400 font-medium mb-1">Next Sync</p>
            <h3 className="text-2xl font-extrabold">In 4 mins</h3>
          </div>
        </div>

      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Large Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">Weekly Waste Trend</h3>
            <select className="text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none text-slate-600">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wasteData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWaste" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}/>
                <Area type="monotone" name="Actual Waste (kg)" dataKey="waste" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorWaste)" />
                <Area type="monotone" name="Baseline Avg (kg)" dataKey="baseline" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorBaseline)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Small Composition Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-900 mb-6">Waste Composition</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} width={80} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="amount" name="Amount (%)" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-500">Highest Category</span>
              <span className="font-bold text-slate-900">Vegetables (45%)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
