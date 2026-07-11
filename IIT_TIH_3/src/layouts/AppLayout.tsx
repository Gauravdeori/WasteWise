import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Server, BarChart3, Settings, Bell, Search, Menu, X, Leaf, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const sidebarLinks = [
  { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Devices', path: '/devices', icon: <Server className="w-5 h-5" /> },
  { name: 'Analytics', path: '/analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:flex lg:flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2 text-slate-900 font-extrabold text-xl tracking-tight">
            <div className="bg-emerald-500 p-1.5 rounded-lg">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span>IIT TIH 3</span>
          </Link>
          <button className="lg:hidden text-slate-500 hover:text-slate-900" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Main Menu</div>
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-semibold text-sm",
                  isActive 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                {link.icon}
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">Admin User</p>
              <p className="text-xs font-medium text-slate-500 truncate">admin@iittih3.edu</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="flex items-center justify-between h-16 px-4 lg:px-8 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-500 hover:text-slate-900" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/60 w-64">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 font-bold shadow-sm">
              Generate Report
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img src="/bg.png" alt="" className="w-full h-full object-cover opacity-30 mix-blend-multiply" />
            <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[2px]"></div>
          </div>
          
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
