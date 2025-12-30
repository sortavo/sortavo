import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Check, Minus, Info, Sparkles, Zap, Crown, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { Footer } from '@/components/layout/Footer';
import { STRIPE_PLANS } from '@/lib/stripe-config';
import { useIsMobile } from '@/hooks/use-mobile';
import { PremiumNavbar } from '@/components/layout/PremiumNavbar';
import { PremiumBackground, PremiumHero } from '@/components/layout/PremiumBackground';

// Feature categories with tooltips
const featureCategories = [
  {
    name: 'Inicio y Prueba',
    features: [
      {
        name: 'Período de prueba gratis',
        tooltip: 'Días de uso gratuito antes del primer cobro. Tu tarjeta se valida pero no se cobra.',
        basic: '7 días',
        pro: false,
        premium: false,
        enterprise: false,
      },
    ],
  },
  {
    name: 'Sorteos y Capacidad',
    features: [
      {
        name: 'Sorteos activos simultáneos',
        tooltip: 'Número de sorteos que puedes tener publicados y vendiendo al mismo tiempo.',
        basic: '2',
        pro: '7',
        premium: '15',
        enterprise: 'Ilimitados',
      },
      {
        name: 'Boletos por sorteo',
        tooltip: 'Cantidad máxima de boletos que puedes crear para cada sorteo.',
        basic: '2,000',
        pro: '30,000',
        premium: '100,000',
        enterprise: '10,000,000',
      },
      {
        name: 'Paquetes de boletos',
        tooltip: 'Crea paquetes con descuento para incentivar compras mayores (ej: 5 boletos por $40).',
        basic: true,
        pro: true,
        premium: true,
        enterprise: true,
      },
      {
        name: 'Números de la suerte',
        tooltip: 'Permite que los compradores elijan sus números favoritos al comprar.',
        basic: true,
        pro: true,
        premium: true,
        enterprise: true,
      },
    ],
  },
  {
    name: 'Personalización',
    features: [
      {
        name: 'Plantillas de diseño',
        tooltip: 'Temas visuales prediseñados para la página pública de tu sorteo.',
        basic: '1',
        pro: '6',
        premium: '6',
        enterprise: '6+',
      },
      {
        name: 'Colores personalizados',
        tooltip: 'Ajusta los colores de tu sorteo para que coincidan con tu marca.',
        basic: true,
        pro: true,
        premium: true,
        enterprise: true,
      },
      {
        name: 'CSS personalizado',
        tooltip: 'Código CSS avanzado para personalización total del diseño.',
        basic: false,
        pro: false,
        premium: true,
        enterprise: true,
      },
      {
        name: 'Sin marca Sortavo',
        tooltip: 'Remueve el logo y enlaces de Sortavo de tu página de sorteo.',
        basic: false,
        pro: true,
        premium: true,
        enterprise: true,
      },
      {
        name: 'Dominio personalizado',
        tooltip: 'Usa tu propio dominio (ej: sorteos.tuempresa.com) en lugar de sortavo.com.',
        basic: false,
        pro: false,
        premium: false,
        enterprise: true,
      },
    ],
  },
  {
    name: 'Métodos de Sorteo',
    features: [
      {
        name: 'Sorteo manual',
        tooltip: 'Selecciona el ganador manualmente desde tu dashboard.',
        basic: true,
        pro: true,
        premium: true,
        enterprise: true,
      },
      {
        name: 'Sorteo aleatorio automático',
        tooltip: 'El sistema selecciona un ganador aleatorio verificable.',
        basic: true,
        pro: true,
        premium: true,
        enterprise: true,
      },
      {
        name: 'Lotería Nacional',
        tooltip: 'Vincula tu sorteo a los resultados oficiales de la Lotería Nacional de México.',
        basic: false,
        pro: true,
        premium: true,
        enterprise: true,
      },
    ],
  },
  {
    name: 'Pagos y Finanzas',
    features: [
      {
        name: 'Múltiples métodos de pago',
        tooltip: 'Acepta transferencias bancarias, OXXO, PayPal y más.',
        basic: true,
        pro: true,
        premium: true,
        enterprise: true,
      },
      {
        name: 'Comprobantes de pago',
        tooltip: 'Los compradores suben foto de su comprobante para validación.',
        basic: true,
        pro: true,
        premium: true,
        enterprise: true,
      },
      {
        name: 'Cupones de descuento',
        tooltip: 'Crea códigos promocionales con descuento porcentual o fijo.',
        basic: true,
        pro: true,
        premium: true,
        enterprise: true,
      },
      {
        name: 'Reportes financieros',
        tooltip: 'Exporta reportes detallados de ventas en PDF y Excel.',
        basic: true,
        pro: true,
        premium: true,
        enterprise: true,
      },
      {
        name: 'Facturación empresarial',
        tooltip: 'Recibe facturas fiscales para tu contabilidad empresarial.',
        basic: false,
        pro: false,
        premium: false,
        enterprise: true,
      },
    ],
  },
  {
    name: 'Comunicación',
    features: [
      {
        name: 'Notificaciones por email',
        tooltip: 'Emails automáticos para confirmación de compra, recordatorios y anuncios.',
        basic: true,
        pro: true,
        premium: true,
        enterprise: true,
      },
      {
        name: 'Enlace WhatsApp',
        tooltip: 'Botón de contacto directo por WhatsApp en tu página de sorteo.',
        basic: true,
        pro: true,
        premium: true,
        enterprise: true,
      },
      {
        name: 'Bot de Telegram',
        tooltip: 'Notificaciones en tiempo real de ventas y pagos directamente en Telegram.',
        basic: false,
        pro: false,
        premium: true,
        enterprise: true,
      },
      {
        name: 'Notificaciones para compradores',
        tooltip: 'Los compradores reciben actualizaciones de estado por Telegram.',
        basic: false,
        pro: false,
        premium: true,
        enterprise: true,
      },
    ],
  },
  {
    name: 'Soporte y Servicio',
    features: [
      {
        name: 'Tiempo de respuesta',
        tooltip: 'Tiempo máximo garantizado para respuesta a tus consultas.',
        basic: '48 horas',
        pro: '12 horas',
        premium: '4 horas',
        enterprise: 'Inmediato',
      },
      {
        name: 'Canal de soporte',
        tooltip: 'Medio de comunicación disponible para recibir ayuda.',
        basic: 'Email',
        pro: 'WhatsApp',
        premium: 'WhatsApp + Llamada',
        enterprise: '24/7 Telefónico',
      },
      {
        name: 'Account Manager dedicado',
        tooltip: 'Un ejecutivo de cuenta asignado exclusivamente a tu organización.',
        basic: false,
        pro: false,
        premium: true,
        enterprise: true,
      },
      {
        name: 'Setup asistido',
        tooltip: 'Te ayudamos a configurar tu primer sorteo y optimizar tu página.',
        basic: false,
        pro: false,
        premium: true,
        enterprise: true,
      },
      {
        name: 'SLA garantizado',
        tooltip: 'Acuerdo de nivel de servicio con garantía de disponibilidad del 99.9%.',
        basic: false,
        pro: false,
        premium: false,
        enterprise: true,
      },
    ],
  },
  {
    name: 'Avanzado',
    features: [
      {
        name: 'Equipo multiusuario',
        tooltip: 'Invita colaboradores para gestionar tus sorteos en equipo.',
        basic: '1 usuario',
        pro: '3 usuarios',
        premium: '10 usuarios',
        enterprise: 'Ilimitados',
      },
      {
        name: 'API Access',
        tooltip: 'Acceso a nuestra API REST para integraciones personalizadas.',
        basic: false,
        pro: false,
        premium: false,
        enterprise: true,
      },
      {
        name: 'Webhooks',
        tooltip: 'Recibe notificaciones automáticas en tus sistemas cuando hay eventos.',
        basic: false,
        pro: false,
        premium: false,
        enterprise: true,
      },
      {
        name: 'Integraciones personalizadas',
        tooltip: 'Desarrollamos integraciones a medida con tus sistemas existentes.',
        basic: false,
        pro: false,
        premium: false,
        enterprise: true,
      },
    ],
  },
];

const planMeta = [
  { key: 'basic', name: 'Basic', icon: Sparkles, color: 'text-slate-400' },
  { key: 'pro', name: 'Pro', icon: Zap, color: 'text-emerald-400', popular: true },
  { key: 'premium', name: 'Premium', icon: Crown, color: 'text-amber-400' },
  { key: 'enterprise', name: 'Enterprise', icon: Building2, color: 'text-purple-400' },
];

function FeatureCell({ value, className }: { value: boolean | string; className?: string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <div className={cn("flex justify-center", className)}>
        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Check className="w-4 h-4 text-emerald-400" strokeWidth={3} />
        </div>
      </div>
    ) : (
      <div className={cn("flex justify-center", className)}>
        <Minus className="w-4 h-4 text-gray-600" />
      </div>
    );
  }
  return <span className={cn("text-sm font-medium text-gray-200", className)}>{value}</span>;
}

// Mobile feature row component
function MobileFeatureRow({ feature }: { feature: typeof featureCategories[0]['features'][0] }) {
  return (
    <div className="py-4 border-b border-gray-700/50 last:border-b-0">
      <div className="flex items-start gap-2 mb-3">
        <span className="text-sm font-medium text-gray-200 flex-1">{feature.name}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-gray-500 hover:text-emerald-400 transition-colors shrink-0">
              <Info className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[250px] bg-gray-800 border-gray-700 text-gray-200">
            <p className="text-sm">{feature.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {planMeta.map((plan) => {
          const value = feature[plan.key as keyof typeof feature] as boolean | string;
          return (
            <div
              key={plan.key}
              className={cn(
                "text-center p-2 rounded-lg bg-gray-800/50",
                plan.popular && "bg-emerald-900/30 ring-1 ring-emerald-500/40"
              )}
            >
              <span className="text-[10px] font-medium text-gray-400 block mb-1">
                {plan.name}
              </span>
              <FeatureCell value={value} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PlanComparison() {
  const isMobile = useIsMobile();
  const [openCategories, setOpenCategories] = useState<string[]>(
    featureCategories.map((c) => c.name)
  );

  return (
    <>
      <Helmet>
        <title>Comparación de Planes | Sortavo</title>
        <meta name="description" content="Compara todas las características de los planes Sortavo. Encuentra el plan perfecto para tus sorteos y loterías." />
      </Helmet>

      <PremiumBackground>
        <PremiumNavbar />

        {/* Hero */}
        <PremiumHero className="pt-24 pb-8 lg:pt-32 lg:pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                Comparación Completa
              </Badge>
              <h1 className="text-2xl lg:text-4xl font-bold text-white mb-4">
                Encuentra el plan perfecto para ti
              </h1>
              <p className="text-sm lg:text-lg text-gray-400 max-w-2xl mx-auto">
                Compara todas las características de cada plan. Toca{' '}
                <Info className="inline w-4 h-4 text-emerald-400" /> para más información.
              </p>
            </motion.div>
          </div>
        </PremiumHero>

        {/* Plan Headers - Desktop only (sticky) */}
        <div className="hidden lg:block sticky top-[73px] z-40 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-5 gap-2 py-4">
              <div className="col-span-1" />
              {planMeta.map((plan) => {
                const Icon = plan.icon;
                const planData = STRIPE_PLANS[plan.key as keyof typeof STRIPE_PLANS];
                return (
                  <div
                    key={plan.key}
                    className={cn(
                      'text-center p-3 rounded-xl',
                      plan.popular && 'bg-emerald-900/30 ring-2 ring-emerald-500'
                    )}
                  >
                    <div className={cn('inline-flex p-2 rounded-lg mb-2', plan.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white">{plan.name}</h3>
                    <p className="text-lg font-bold text-white">
                      ${planData.monthlyPrice}<span className="text-sm font-normal text-gray-400">/mes</span>
                    </p>
                    {plan.popular && (
                      <Badge className="mt-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs border-0">
                        Más Popular
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Plan Summary */}
        <div className="lg:hidden py-4 px-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="grid grid-cols-4 gap-2">
            {planMeta.map((plan) => {
              const Icon = plan.icon;
              const planData = STRIPE_PLANS[plan.key as keyof typeof STRIPE_PLANS];
              return (
                <div
                  key={plan.key}
                  className={cn(
                    'text-center p-2 rounded-lg bg-gray-800/50',
                    plan.popular && 'bg-emerald-900/30 ring-1 ring-emerald-500'
                  )}
                >
                  <Icon className={cn('w-4 h-4 mx-auto mb-1', plan.color)} />
                  <p className="text-[10px] font-medium text-gray-400">{plan.name}</p>
                  <p className="text-xs font-bold text-white">${planData.monthlyPrice}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comparison - Mobile (Accordions) */}
        <section className="lg:hidden py-4">
          <div className="px-4">
            <Accordion 
              type="multiple" 
              value={openCategories}
              onValueChange={setOpenCategories}
              className="space-y-3"
            >
              {featureCategories.map((category) => (
                <AccordionItem
                  key={category.name}
                  value={category.name}
                  className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-800/50 text-white">
                    <span className="text-sm font-bold">{category.name}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-2">
                    {category.features.map((feature) => (
                      <MobileFeatureRow key={feature.name} feature={feature} />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Comparison Table - Desktop */}
        <section className="hidden lg:block py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {featureCategories.map((category, catIdx) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: catIdx * 0.05 }}
                className="mb-8"
              >
                <h2 className="text-lg font-bold text-white mb-4 px-2">
                  {category.name}
                </h2>
                <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
                  {category.features.map((feature, idx) => (
                    <div
                      key={feature.name}
                      className={cn(
                        'grid grid-cols-5 gap-2 py-4 px-4 items-center',
                        idx !== category.features.length - 1 && 'border-b border-gray-800'
                      )}
                    >
                      {/* Feature Name with Tooltip */}
                      <div className="col-span-1 flex items-center gap-2">
                        <span className="text-sm text-gray-200">{feature.name}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="text-gray-500 hover:text-emerald-400 transition-colors">
                              <Info className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs bg-gray-800 border-gray-700 text-gray-200">
                            <p className="text-sm">{feature.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Plan Values */}
                      <div className="text-center">
                        <FeatureCell value={feature.basic} />
                      </div>
                      <div className="text-center bg-emerald-900/20 -mx-1 px-1 py-2 rounded">
                        <FeatureCell value={feature.pro} />
                      </div>
                      <div className="text-center">
                        <FeatureCell value={feature.premium} />
                      </div>
                      <div className="text-center">
                        <FeatureCell value={feature.enterprise} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 lg:py-16 border-t border-gray-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-xl lg:text-3xl font-bold text-white mb-4">
              ¿Listo para empezar?
            </h2>
            <p className="text-sm lg:text-base text-gray-400 mb-6 lg:mb-8">
              Prueba gratis por 7 días. Sin tarjeta de crédito.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0">
                <Link to="/auth?tab=signup">
                  Crear cuenta gratis
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto border-gray-700 text-gray-200 hover:bg-gray-800 hover:text-white">
                <Link to="/pricing">
                  Ver precios
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </PremiumBackground>
    </>
  );
}
