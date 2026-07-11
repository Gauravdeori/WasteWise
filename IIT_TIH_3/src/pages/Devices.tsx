import { Server, MoreVertical, Battery, Wifi, AlertCircle, CheckCircle2 } from 'lucide-react';

const devices = [
  { id: 'BIN-001', location: 'Main Cafeteria (North)', status: 'Online', battery: '92%', lastSync: '2 mins ago', fillLevel: '45%' },
  { id: 'BIN-002', location: 'Main Cafeteria (South)', status: 'Online', battery: '85%', lastSync: '5 mins ago', fillLevel: '80%' },
  { id: 'BIN-003', location: 'Faculty Lounge', status: 'Offline', battery: '12%', lastSync: '4 hours ago', fillLevel: '--' },
  { id: 'BIN-004', location: 'Hostel A Mess', status: 'Online', battery: '100%', lastSync: '1 min ago', fillLevel: '20%' },
  { id: 'BIN-005', location: 'Hostel B Mess', status: 'Online', battery: '78%', lastSync: '10 mins ago', fillLevel: '65%' },
  { id: 'BIN-006', location: 'Library Cafe', status: 'Warning', battery: '45%', lastSync: '2 mins ago', fillLevel: '95%' },
];

export default function Devices() {
  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Device Management</h1>
          <p className="text-sm text-slate-500 font-medium">Manage and monitor all IoT Smart Bins.</p>
        </div>
        <button className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-sm transition-colors">
          + Add New Device
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Device ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Battery</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fill Level</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Sync</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {devices.map((device) => (
                <tr key={device.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Server className="w-4 h-4 text-slate-600" />
                      </div>
                      <span className="font-bold text-slate-900">{device.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-600">{device.location}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      device.status === 'Online' ? 'bg-emerald-50 text-emerald-700' :
                      device.status === 'Warning' ? 'bg-amber-50 text-amber-700' :
                      'bg-rose-50 text-rose-700'
                    }`}>
                      {device.status === 'Online' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {device.status === 'Warning' && <AlertCircle className="w-3.5 h-3.5" />}
                      {device.status === 'Offline' && <AlertCircle className="w-3.5 h-3.5" />}
                      {device.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Battery className={`w-4 h-4 ${parseInt(device.battery) < 20 ? 'text-rose-500' : 'text-slate-400'}`} />
                      <span className="text-sm font-medium text-slate-600">{device.battery}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full max-w-[4rem] bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${parseInt(device.fillLevel) > 90 ? 'bg-rose-500' : 'bg-blue-500'}`}
                          style={{ width: device.fillLevel !== '--' ? device.fillLevel : '0%' }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-slate-600 w-8">{device.fillLevel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Wifi className="w-4 h-4" />
                      <span className="text-sm font-medium">{device.lastSync}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 font-medium">
          <span>Showing 1 to 6 of 12 devices</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-200 rounded-md hover:bg-slate-50">Previous</button>
            <button className="px-3 py-1 border border-slate-200 rounded-md hover:bg-slate-50 bg-slate-100 text-slate-900 font-bold">1</button>
            <button className="px-3 py-1 border border-slate-200 rounded-md hover:bg-slate-50">2</button>
            <button className="px-3 py-1 border border-slate-200 rounded-md hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
