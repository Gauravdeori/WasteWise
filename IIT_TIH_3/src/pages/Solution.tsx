import { motion } from 'framer-motion';
import { Settings, Leaf, DollarSign, Building2, CheckCircle } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const benefits = [
  {
    title: "Economic Benefits",
    icon: <DollarSign className="w-8 h-8 text-amber-500" />,
    items: ["Reduce purchasing costs", "Lower financial losses"]
  },
  {
    title: "Operational Benefits",
    icon: <Settings className="w-8 h-8 text-blue-500" />,
    items: ["Automatic recording", "Accurate measurements"]
  },
  {
    title: "Environmental",
    icon: <Leaf className="w-8 h-8 text-emerald-500" />,
    items: ["Reduce landfill waste", "Cut carbon emissions"]
  },
  {
    title: "Institutional",
    icon: <Building2 className="w-8 h-8 text-purple-500" />,
    items: ["Data-driven decisions", "Zero Waste certification"]
  }
];

export default function Solution() {
  return (
    <div className="flex flex-col items-center w-full bg-slate-50/50">
      
      {/* Header */}
      <section className="w-full bg-slate-900 text-white pt-40 pb-24 relative overflow-hidden mesh-bg-dark">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMGYxNzJhIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMWUzYThhIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-20"></div>
        <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight"
          >
            The Solution
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium"
          >
            An intelligent, automated approach to monitoring food waste using modern IoT technologies.
          </motion.p>
        </div>
      </section>

      {/* Proposed Solution */}
      <section className="w-full py-24 bg-white relative z-20 -mt-8 rounded-t-[3rem] shadow-[0_-8px_30px_rgb(0,0,0,0.02)]">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={itemVariants}
            className="bento-card p-8 md:p-12 text-center bg-gradient-to-br from-slate-50 to-white"
          >
            <div className="bento-inner-glow"></div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8 text-slate-900">Platform Architecture</h2>
            <div className="text-lg text-slate-500 font-medium leading-relaxed max-w-3xl mx-auto space-y-6 relative z-20">
              <p>
                The <strong>IoT-Based Real-Time Food Waste Monitoring System</strong> introduces a smart waste monitoring platform capable of automatically measuring food waste using IoT-enabled weighing devices.
              </p>
              <p className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-900">
                The entire process is automated, eliminating manual recording while providing accurate real-time information for visualization, reporting, and predictive analytics.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Bento Grid */}
      <section className="w-full py-24 bg-slate-50/50">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900">System Benefits</h2>
            <p className="text-lg text-slate-500 font-medium">
              The impact of implementing an automated food waste monitoring system.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {benefits.map((benefit, index) => (
              <motion.div key={index} variants={itemVariants} className="bento-card p-8 bg-white group hover:bg-slate-900 hover:text-white transition-colors duration-500">
                <div className="mb-6 bg-slate-50 group-hover:bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-500">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
                <ul className="space-y-3">
                  {benefit.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-500 group-hover:text-slate-300 transition-colors duration-500">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

    </div>
  );
}
