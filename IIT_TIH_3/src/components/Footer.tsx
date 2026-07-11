import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200/60 pt-20 pb-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-5">
            <Link to="/" className="flex items-center gap-2 text-slate-900 font-extrabold text-xl tracking-tight mb-6">
              <div className="bg-gradient-to-br from-emerald-400 to-primary p-1.5 rounded-lg">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span>IIT TIH 3</span>
            </Link>
            <p className="text-base text-slate-500 mb-8 max-w-sm leading-relaxed">
              Pioneering IoT-Based Real-Time Food Waste Monitoring. Designed for academic institutions to promote data-driven sustainability.
            </p>
            <div className="flex gap-4 text-sm font-semibold text-slate-400">
              <a href="#" className="hover:text-slate-900 transition-colors">Twitter</a>
              <a href="#" className="hover:text-slate-900 transition-colors">GitHub</a>
              <a href="#" className="hover:text-slate-900 transition-colors">LinkedIn</a>
            </div>
          </div>
          
          <div className="md:col-span-2 md:col-start-7">
            <h3 className="text-slate-900 font-bold mb-6 tracking-tight">Project</h3>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/solution" className="hover:text-primary transition-colors">The Solution</Link></li>
              <li><Link to="/gallery" className="hover:text-primary transition-colors">Gallery</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="text-slate-900 font-bold mb-6 tracking-tight">Resources</h3>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><a href="#" className="hover:text-primary transition-colors">Research Paper</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Hardware Setup</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">API Docs</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-slate-900 font-bold mb-6 tracking-tight">Legal</h3>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Use</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-200/60 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium text-slate-400">
          <p>© {new Date().getFullYear()} IIT TIH 3 Project. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>System Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
