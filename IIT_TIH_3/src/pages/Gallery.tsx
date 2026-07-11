import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Cpu, Network, Layout, Activity } from 'lucide-react';

const categories = [
  {
    id: "hardware",
    name: "Hardware",
    icon: <Cpu className="w-5 h-5" />,
    items: [
      { id: 1, title: "ESP32 Microcontroller", desc: "The core processing unit for the IoT system." },
      { id: 2, title: "Load Cell Sensor", desc: "High-precision weight measurement component." },
      { id: 3, title: "HX711 Amplifier", desc: "Converts analog load cell signals to digital." },
      { id: 4, title: "Smart Waste Bin", desc: "The integrated hardware setup." },
      { id: 5, title: "IoT Hardware Setup", desc: "Complete circuit connections." }
    ]
  },
  {
    id: "architecture",
    name: "System Architecture",
    icon: <Network className="w-5 h-5" />,
    items: [
      { id: 6, title: "Complete IoT Architecture", desc: "End-to-end system design." },
      { id: 7, title: "Data Flow Diagram", desc: "How data moves from sensor to cloud." },
      { id: 8, title: "Wireless Communication", desc: "Wi-Fi and MQTT protocols." }
    ]
  },
  {
    id: "workflow",
    name: "Workflow",
    icon: <Activity className="w-5 h-5" />,
    items: [
      { id: 9, title: "Monitoring Flow", desc: "User interaction process." },
      { id: 10, title: "Cloud Communication", desc: "Server synchronization process." },
      { id: 11, title: "Working Process", desc: "Step-by-step system operation." }
    ]
  },
  {
    id: "prototype",
    name: "Prototype & Testing",
    icon: <Layout className="w-5 h-5" />,
    items: [
      { id: 12, title: "Hardware Assembly", desc: "Building the physical prototype." },
      { id: 13, title: "Calibration & Testing", desc: "Ensuring measurement accuracy." },
      { id: 14, title: "Research Setup", desc: "Academic testing environment." },
      { id: 15, title: "Dashboard Preview", desc: "Early UI concepts." }
    ]
  }
];

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [lightboxItem, setLightboxItem] = useState<{title: string, desc: string} | null>(null);

  const currentCategory = categories.find(c => c.id === activeCategory);

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-slate-50/50">
      
      {/* Header */}
      <section className="w-full bg-white pt-40 pb-20 mesh-bg border-b border-slate-200/50">
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-slate-900">
            Project Gallery
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium">
            Visual documentation of the hardware setup, system architecture, and project prototypes.
          </p>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="w-full py-20 flex-grow relative z-20 -mt-8 bg-white rounded-t-[3rem] shadow-[0_-8px_30px_rgb(0,0,0,0.02)]">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          
          {/* Category Navigation */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-300 ${
                  activeCategory === category.id
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-105'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>

          {/* Grid */}
          <AnimatePresence mode='wait'>
            <motion.div 
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {currentCategory?.items.map(item => (
                <div 
                  key={item.id}
                  onClick={() => setLightboxItem(item)}
                  className="bento-card group cursor-pointer"
                >
                  <div className="bento-inner-glow"></div>
                  <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 group-hover:scale-105 transition-transform duration-700"></div>
                    <ImageIcon className="w-12 h-12 text-slate-300 relative z-10 group-hover:text-emerald-400 transition-colors duration-500" />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 backdrop-blur-[2px]">
                      <span className="text-white font-bold px-6 py-3 rounded-full border border-white/20 glass-heavy shadow-2xl">
                        View Full Image
                      </span>
                    </div>
                  </div>
                  <div className="p-6 relative z-10 bg-white">
                    <h3 className="font-bold text-slate-900 mb-2 text-lg">{item.title}</h3>
                    <p className="text-sm font-medium text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4"
            onClick={() => setLightboxItem(null)}
          >
            <button 
              className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 rounded-full p-2 transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightboxItem(null); }}
            >
              <X className="w-6 h-6" />
            </button>
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="aspect-[16/9] bg-slate-100 flex items-center justify-center relative">
                <ImageIcon className="w-24 h-24 text-slate-300" />
                <span className="absolute text-slate-400 font-bold text-xl tracking-tight">Image Placeholder</span>
              </div>
              <div className="p-8 bg-white border-t border-slate-100">
                <h3 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">{lightboxItem.title}</h3>
                <p className="text-lg font-medium text-slate-500">{lightboxItem.desc}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
