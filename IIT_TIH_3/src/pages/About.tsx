import { motion } from 'framer-motion';
import { Target, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';



const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function About() {
  return (
    <div className="flex flex-col items-center w-full bg-slate-50/50">
      
      {/* Header */}
      <section className="w-full bg-slate-900 text-white pt-40 pb-24 relative overflow-hidden mesh-bg-dark">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMGYxNzJhIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMWUzYThhIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-20"></div>
        <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-4 py-1.5 text-sm font-semibold text-emerald-400 mb-8"
          >
            The Mission
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
          >
            About The Project
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Understanding the sustainability challenge and our technological approach to solving it for modern academic institutions.
          </motion.p>
        </div>
      </section>

      {/* About & Problem Statement */}
      <section className="w-full py-24 bg-white relative z-20 -mt-8 rounded-t-[3rem] shadow-[0_-8px_30px_rgb(0,0,0,0.02)]">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={itemVariants}
            >
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6 text-slate-900">Food Waste in Institutions</h2>
              <div className="space-y-6 text-slate-500 font-medium text-lg leading-relaxed">
                <p>
                  Food waste is one of the largest sustainability challenges faced by institutions today. Large amounts of prepared food remain uneaten because production is usually estimated manually without accurate consumption data.
                </p>
                <p>
                  Most institutions rely on notebooks, spreadsheets, or rough estimates to record food waste. These methods are inaccurate, inconsistent, time-consuming, and provide very little analytical insight.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={itemVariants}
              className="flex flex-col justify-center"
            >
              <div className="bento-card bg-amber-50/50 p-8 md:p-10 border-amber-100/50 shadow-lg shadow-amber-500/5">
                <div className="bento-inner-glow"></div>
                <div className="flex items-center gap-4 mb-6 relative z-20">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">The Core Problem</h3>
                </div>
                <div className="relative z-20 space-y-4 text-slate-600 font-medium">
                  <p>
                    Without an automated system, institutions cannot accurately determine:
                  </p>
                  <ul className="space-y-3 mt-4">
                    {[
                      "How much food is wasted daily.",
                      "Which meals generate the most waste.",
                      "Whether food preparation matches demand."
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="w-full py-24 bg-slate-50/50 border-y border-slate-200/50">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={itemVariants}
              className="bento-card p-10 bg-white group"
            >
              <div className="bento-inner-glow"></div>
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Lightbulb className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-4">Vision</h3>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                To create sustainable institutions by enabling intelligent, data-driven food waste management through IoT technology, automation, and real-time analytics.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={itemVariants}
              className="bento-card p-10 bg-gradient-to-br from-emerald-50 to-white group"
            >
              <div className="bento-inner-glow"></div>
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-4">Mission</h3>
              <ul className="space-y-3 text-slate-600 font-medium">
                {[
                  "Reduce food waste through automation",
                  "Promote sustainable food management",
                  "Minimize operational financial costs",
                  "Support Zero Food Waste initiatives"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
