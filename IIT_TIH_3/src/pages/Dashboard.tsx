import { motion } from 'framer-motion';
import { LayoutDashboard, Activity, BarChart, LineChart, DollarSign, Leaf, Brain } from 'lucide-react';

const futureFeatures = [
  { icon: <Activity className="w-6 h-6" />, title: "Live Monitoring", color: "text-blue-600", bg: "bg-blue-100" },
  { icon: <BarChart className="w-6 h-6" />, title: "Daily Reports", color: "text-indigo-600", bg: "bg-indigo-100" },
  { icon: <LineChart className="w-6 h-6" />, title: "Weekly Analytics", color: "text-purple-600", bg: "bg-purple-100" },
  { icon: <DollarSign className="w-6 h-6" />, title: "Cost Analysis", color: "text-amber-600", bg: "bg-amber-100" },
  { icon: <Leaf className="w-6 h-6" />, title: "Impact Metrics", color: "text-emerald-600", bg: "bg-emerald-100" },
  { icon: <Brain className="w-6 h-6" />, title: "AI Prediction", color: "text-cyan-600", bg: "bg-cyan-100" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function Dashboard() {
  return (
    <div className="flex flex-col items-center w-full bg-slate-50/50">
      
      {/* Header */}
      <section className="w-full bg-slate-900 text-white pt-40 pb-32 relative overflow-hidden mesh-bg-dark">
        <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-20 h-20 bg-white/5 rounded-3xl mx-auto flex items-center justify-center mb-8 border border-white/10 backdrop-blur-md shadow-2xl"
          >
            <LayoutDashboard className="w-10 h-10 text-emerald-400" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-7xl font-extrabold tracking-tight mb-6"
          >
            Dashboard
            <span className="block text-slate-500 mt-2">Coming Soon</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium"
          >
            We are building a powerful analytics engine to help you monitor, visualize, and reduce food waste effectively.
          </motion.p>
        </div>
      </section>

      {/* Interactive Illustration Concept */}
      <section className="w-full py-24 bg-white relative z-20 -mt-16 rounded-t-[3rem] shadow-[0_-8px_30px_rgb(0,0,0,0.02)]">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto relative rounded-[2.5rem] border border-slate-200 bg-slate-50/50 p-6 md:p-10 overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-emerald-400"></div>
            
            {/* Mock Dashboard UI outline */}
            <div className="w-full h-8 flex items-center gap-2 mb-8 border-b border-slate-200/60 pb-6">
              <div className="w-3.5 h-3.5 rounded-full bg-slate-300"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-slate-300"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-slate-300"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 opacity-30">
              <div className="h-40 bg-slate-200 rounded-3xl animate-pulse"></div>
              <div className="h-40 bg-slate-200 rounded-3xl animate-pulse delay-75"></div>
              <div className="h-40 bg-slate-200 rounded-3xl animate-pulse delay-150"></div>
              <div className="md:col-span-2 h-72 bg-slate-200 rounded-3xl animate-pulse delay-200"></div>
              <div className="h-72 bg-slate-200 rounded-3xl animate-pulse delay-300"></div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[4px]">
              <div className="glass-heavy px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 border-slate-200/60">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
                <span className="font-bold text-slate-900 text-lg">Development in Progress</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Future Features */}
      <section className="w-full pb-32 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4 text-slate-900">Planned Analytics Features</h2>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto"
          >
            {futureFeatures.map((feature, index) => (
              <motion.div key={index} variants={itemVariants} className="bento-card p-6 flex flex-col items-center text-center bg-slate-50/50 hover:bg-white group">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2 ${feature.bg} ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="font-bold text-slate-800 text-sm leading-tight">{feature.title}</h3>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

    </div>
  );
}
