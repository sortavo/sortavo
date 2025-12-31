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
    <section className={`relative py-24 overflow-hidden ${className}`}>
      {/* Background with subtle gradient for contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-transparent to-transparent pointer-events-none" />
      
      {/* Subtle orbs for depth */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative max-w-5xl mx-auto px-5">
        {/* Header - Premium style with larger typography */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-5 py-2.5 rounded-full text-sm font-semibold mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <Shield className="w-4 h-4" />
            Garantía de Transparencia
          </div>
          <h2 className="text-4xl lg:text-5xl font-black mb-5 tracking-tight">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Sorteo 100% Verificable
            </span>
          </h2>
          <p className="text-white/50 max-w-xl mx-auto text-lg">
            Tu confianza es nuestra prioridad
          </p>
        </motion.div>

        {/* Items grid - Premium glassmorphism cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {transparencyItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group flex items-start gap-5 p-6 bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/[0.08] hover:border-emerald-500/30 hover:bg-white/[0.05] transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-shadow">
                <item.icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white mb-1.5 text-lg">
                  {item.title}
                </h3>
                <p className="text-sm text-white/50">
                  {item.description}
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1 opacity-60 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>

        {/* Draw method badge - Premium style */}
        {drawMethod && (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <span className="inline-flex items-center gap-3 bg-white/[0.03] backdrop-blur-sm text-white px-6 py-3.5 rounded-full text-sm font-medium border border-white/[0.08] shadow-lg">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Award className="w-4 h-4 text-emerald-400" />
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
