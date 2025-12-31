import { motion } from "framer-motion";
import { Shield, Eye, Video, CheckCircle2, Award } from "lucide-react";

interface TransparencySectionProps {
  drawMethod?: string;
  livestreamUrl?: string | null;
  className?: string;
}

const transparencyItems = [
  {
    icon: Award,
    title: "Sorteo Oficial",
    description: "Vinculado a Lotería Nacional o método verificable",
  },
  {
    icon: Eye,
    title: "Lista Pública",
    description: "Todos los participantes pueden ser verificados",
  },
  {
    icon: Video,
    title: "Transmisión en Vivo",
    description: "El sorteo se transmite en tiempo real",
  },
  {
    icon: CheckCircle2,
    title: "Verificador 24/7",
    description: "Consulta el estado de tu boleto en cualquier momento",
  },
];

export function TransparencySection({ 
  drawMethod,
  livestreamUrl,
  className = "" 
}: TransparencySectionProps) {
  return (
    <section className={`relative py-28 lg:py-36 xl:py-44 overflow-hidden ${className}`}>
      {/* Premium background with multiple orbs */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-transparent to-transparent pointer-events-none" />
      
      {/* 5 Animated orbs with 120px blur - TIER S */}
      <motion.div 
        className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none"
        animate={{ 
          x: [0, 30, 0], 
          y: [0, -20, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-500/8 rounded-full blur-[120px] pointer-events-none"
        animate={{ 
          x: [0, -25, 0], 
          y: [0, 25, 0],
          scale: [1, 1.15, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div 
        className="absolute top-1/3 right-1/3 w-[350px] h-[350px] bg-emerald-400/5 rounded-full blur-[120px] pointer-events-none"
        animate={{ 
          x: [0, 20, 0], 
          y: [0, 30, 0]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
      <motion.div 
        className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none"
        animate={{ 
          x: [0, -15, 0], 
          y: [0, -20, 0]
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 6 }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/2 w-[450px] h-[450px] bg-teal-400/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px'
        }}
      />
      
      <div className="relative max-w-5xl mx-auto px-5">
        {/* Header - TIER S Premium typography */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 lg:mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-6 py-3 rounded-full text-sm font-semibold mb-8 border border-emerald-500/20 shadow-lg shadow-emerald-500/10 shimmer-badge">
            <Shield className="w-5 h-5" />
            Garantía de Transparencia
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black mb-6 tracking-[-0.04em] leading-[0.9]">
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300 bg-clip-text text-transparent">
              Sorteo 100% Verificable
            </span>
          </h2>
          <p className="text-white/50 max-w-xl mx-auto text-lg lg:text-xl">
            Tu confianza es nuestra prioridad
          </p>
        </motion.div>

        {/* Items grid - Premium glassmorphism cards with hover glow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
          {transparencyItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group flex items-start gap-6 p-8 lg:p-10 bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.08] hover:border-emerald-500/30 hover:bg-white/[0.05] hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
            >
              {/* TIER S Icon container - w-20 h-20 */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-xl shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow">
                <item.icon className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white mb-2 text-xl lg:text-2xl tracking-tight">
                  {item.title}
                </h3>
                <p className="text-base lg:text-lg text-white/50">
                  {item.description}
                </p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1 opacity-40 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>

        {/* Draw method badge - Premium style */}
        {drawMethod && (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <span className="inline-flex items-center gap-4 bg-white/[0.03] backdrop-blur-xl text-white px-8 py-5 rounded-2xl text-base font-medium border border-white/[0.08] shadow-xl hover:shadow-emerald-500/10 transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Award className="w-6 h-6 text-emerald-400" />
              </div>
              Método: {drawMethod === 'lottery_nacional' ? 'Lotería Nacional' : 
                       drawMethod === 'random_org' ? 'Random.org Certificado' : 'Sorteo Manual'}
            </span>
          </motion.div>
        )}
      </div>
    </section>
  );
}
