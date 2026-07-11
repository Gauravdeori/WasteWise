import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Solution', path: '/solution' },
  { name: 'Gallery', path: '/gallery' },
];

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 w-full z-50 flex justify-center mt-6 px-4 pointer-events-none">
      <nav
        className={cn(
          'pointer-events-auto transition-all duration-500 rounded-full w-full max-w-5xl',
          isScrolled
            ? 'glass px-6 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)]'
            : 'bg-white/50 backdrop-blur-md border border-white/40 px-6 py-4'
        )}
      >
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-900 font-extrabold text-lg tracking-tight group">
            <div className="bg-gradient-to-br from-emerald-400 to-primary p-1.5 rounded-lg group-hover:scale-105 transition-transform shadow-sm">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span>IIT TIH 3</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300',
                  location.pathname === link.path
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <Button size="sm" className="rounded-full px-6 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-lg shadow-emerald-500/20 border-0 h-10 font-semibold transition-all hover:scale-105" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-slate-900 p-2 rounded-full hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-20 left-4 right-4 pointer-events-auto md:hidden glass-heavy rounded-3xl p-4 flex flex-col space-y-2 shadow-2xl"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  'text-base font-semibold p-4 rounded-2xl transition-all',
                  location.pathname === link.path
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/dashboard"
              className="text-base font-semibold p-4 rounded-2xl text-white bg-gradient-to-r from-emerald-500 to-blue-600 text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
