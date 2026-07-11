import { motion } from 'framer-motion';
import { ArrowRight, Activity, Wifi, Database, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const stats = [
  { value: "68.7M", label: "Tonnes of food wasted annually" },
  { value: "40%", label: "Of all food produced goes uneaten" },
  { value: "₹89K", label: "Crore estimated annual economic loss" }
];

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full bg-slate-50/50">
      
      {/* Cinematic Hero Section */}
      <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden mesh-bg pt-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+CjxjaXJjbGUgY3g9IjEiIGN5PSIxIiByPSIxIiBmaWxsPSJyZ2JhKDAsIDAsIDAsIDAuMDMpIj48L2NpcmNsZT4KPC9zdmc+')]"></div>
        
        <div className="container relative z-10 mx-auto px-4 md:px-6 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center rounded-full border border-slate-200/50 bg-white/50 backdrop-blur-md px-4 py-1.5 text-sm font-semibold text-slate-700 mb-8 shadow-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            Next-Gen IoT Research Project
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-slate-900 mb-8 max-w-5xl leading-[1.1]"
          >
            Smarter Monitoring.<br/>
            <span className="text-gradient">Zero Food Waste.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-2xl text-slate-500 mb-10 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            An intelligent IoT hardware platform that automatically measures, tracks, and analyzes food waste in real-time.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Button size="lg" className="rounded-full shadow-[0_8px_30px_rgb(16,185,129,0.3)] bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 h-14 px-8 text-base font-bold" asChild>
              <Link to="/about">
                Explore The Solution <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-base font-bold bg-white/50 backdrop-blur-sm border-slate-200 hover:bg-white/80 transition-colors" asChild>
              <Link to="/gallery">View Prototype</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats Bento */}
      <section className="w-full py-24 bg-white relative z-20 -mt-8 rounded-t-[3rem] shadow-[0_-8px_30px_rgb(0,0,0,0.02)]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {stats.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bento-card p-8 flex flex-col justify-center items-center text-center bg-slate-50/50"
              >
                <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3 tracking-tight">{stat.value}</h3>
                <p className="text-slate-500 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="w-full py-24 bg-slate-50/50">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 text-slate-900">Built for precision.</h2>
            <p className="text-lg text-slate-500 font-medium">
              Our complete hardware-to-cloud pipeline ensures not a single gram of waste goes unrecorded.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Feature 1 - Large spanning 2 cols */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bento-card md:col-span-2 p-8 md:p-12 flex flex-col justify-between group overflow-hidden bg-gradient-to-br from-white to-slate-50"
            >
              <div className="bento-inner-glow"></div>
              <div className="relative z-20">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">
                  <Activity className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Real-Time Weight Sensors</h3>
                <p className="text-slate-500 font-medium max-w-md">
                  High-precision load cells continuously monitor the waste bin, instantly detecting any new disposals with gram-level accuracy.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-2/3 h-2/3 bg-gradient-to-tl from-emerald-500/5 to-transparent rounded-tl-[100px] pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bento-card p-8 flex flex-col justify-between group"
            >
              <div className="bento-inner-glow"></div>
              <div className="relative z-20">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                  <Wifi className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Wireless Sync</h3>
                <p className="text-slate-500 font-medium">
                  ESP32 microcontrollers securely transmit encrypted data directly to our cloud infrastructure.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bento-card p-8 flex flex-col justify-between group bg-slate-900 text-white"
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMGYxNzJhIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMWUzYThhIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-20"></div>
              <div className="relative z-20">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Cloud Analytics</h3>
                <p className="text-slate-400 font-medium">
                  Centralized database storage ensures long-term historical records for trend analysis.
                </p>
              </div>
            </motion.div>

            {/* Feature 4 - Large spanning 2 cols */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bento-card md:col-span-2 p-8 md:p-12 flex flex-col justify-between group bg-gradient-to-br from-blue-50 to-white"
            >
              <div className="bento-inner-glow"></div>
              <div className="relative z-20">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Actionable Dashboard</h3>
                <p className="text-slate-500 font-medium max-w-md">
                  Visualize daily, weekly, and monthly trends. Generate automated reports to help cafeteria managers optimize food preparation and reduce costs.
                </p>
              </div>
              <div className="absolute right-8 bottom-8 flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                <div className="w-4 h-16 bg-blue-200 rounded-t-md"></div>
                <div className="w-4 h-24 bg-blue-400 rounded-t-md"></div>
                <div className="w-4 h-12 bg-blue-300 rounded-t-md"></div>
                <div className="w-4 h-32 bg-emerald-500 rounded-t-md shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
