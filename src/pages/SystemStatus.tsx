import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Footer } from '@/components/layout/Footer';
import { toast } from 'sonner';
import { useSystemStatus, ServiceHealth, ServiceStatus } from '@/hooks/useSystemStatus';
import { 
  Trophy, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Bell,
  Clock,
  Server,
  CreditCard,
  Mail,
  Database,
  Shield,
  Globe,
  Activity,
  HardDrive,
  Loader2
} from 'lucide-react';

interface Incident {
  id: string;
  title: string;
  status: 'resolved' | 'monitoring' | 'investigating' | 'identified';
  date: string;
  description: string;
  updates: { time: string; message: string }[];
}

// Static incidents - could be connected to a database in the future
const recentIncidents: Incident[] = [];

const getServiceIcon = (serviceName: string) => {
  const iconMap: Record<string, React.ElementType> = {
    'Base de Datos': Database,
    'Pagos (Stripe)': CreditCard,
    'API / Edge Functions': Server,
    'Autenticación': Shield,
    'Email': Mail,
    'Almacenamiento': HardDrive,
    'Plataforma Web': Globe,
  };
  return iconMap[serviceName] || Activity;
};

const getServiceDescription = (serviceName: string) => {
  const descMap: Record<string, string> = {
    'Base de Datos': 'Almacenamiento y consultas de datos',
    'Pagos (Stripe)': 'Procesamiento de pagos con Stripe',
    'API / Edge Functions': 'Servicios de backend y endpoints',
    'Autenticación': 'Sistema de login y registro',
    'Email': 'Envío de notificaciones por correo',
    'Almacenamiento': 'Almacenamiento de archivos e imágenes',
    'Plataforma Web': 'Aplicación web principal y dashboard',
  };
  return descMap[serviceName] || 'Servicio del sistema';
};

const getStatusColor = (status: ServiceStatus) => {
  switch (status) {
    case 'operational':
      return 'bg-green-500';
    case 'degraded':
      return 'bg-yellow-500';
    case 'outage':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusIcon = (status: ServiceStatus) => {
  switch (status) {
    case 'operational':
      return CheckCircle2;
    case 'degraded':
      return AlertTriangle;
    case 'outage':
      return XCircle;
    default:
      return Activity;
  }
};

const getStatusText = (status: ServiceStatus) => {
  switch (status) {
    case 'operational':
      return 'Operativo';
    case 'degraded':
      return 'Degradado';
    case 'outage':
      return 'Interrupción';
    default:
      return 'Desconocido';
  }
};

const getIncidentStatusColor = (status: Incident['status']) => {
  switch (status) {
    case 'resolved':
      return 'bg-green-100 text-green-700';
    case 'monitoring':
      return 'bg-blue-100 text-blue-700';
    case 'investigating':
      return 'bg-yellow-100 text-yellow-700';
    case 'identified':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getIncidentStatusText = (status: Incident['status']) => {
  switch (status) {
    case 'resolved':
      return 'Resuelto';
    case 'monitoring':
      return 'Monitoreando';
    case 'investigating':
      return 'Investigando';
    case 'identified':
      return 'Identificado';
    default:
      return status;
  }
};

export default function SystemStatus() {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  
  const { 
    services, 
    overallStatus, 
    isLoading, 
    error, 
    lastRefresh, 
    refresh 
  } = useSystemStatus({ 
    autoRefresh: true, 
    refreshInterval: 60000 
  });

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);
    
    // TODO: Save email to database for status alerts
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('¡Suscrito a alertas!', {
      description: 'Recibirás notificaciones cuando haya cambios en el estado del sistema.'
    });
    
    setEmail('');
    setIsSubscribing(false);
  };

  const handleRefresh = async () => {
    toast.info('Actualizando estado...');
    await refresh();
    toast.success('Estado actualizado');
  };

  return (
    <>
      <Helmet>
        <title>Estado del Sistema | Sortavo</title>
        <meta name="description" content="Monitorea el estado en tiempo real de todos los servicios de Sortavo." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                SORTAVO
              </span>
            </Link>
            <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-violet-600 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Volver al inicio</span>
            </Link>
          </div>
        </nav>

        {/* Overall Status Banner */}
        <section className={`py-12 ${
          isLoading 
            ? 'bg-gradient-to-r from-gray-400 to-gray-500'
            : overallStatus === 'operational' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
              : overallStatus === 'degraded'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                : 'bg-gradient-to-r from-red-500 to-rose-500'
        }`}>
          <div className="max-w-7xl mx-auto px-4 text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-4">
              {isLoading ? (
                <Loader2 className="w-12 h-12 animate-spin" />
              ) : overallStatus === 'operational' ? (
                <CheckCircle2 className="w-12 h-12" />
              ) : overallStatus === 'degraded' ? (
                <AlertTriangle className="w-12 h-12" />
              ) : (
                <XCircle className="w-12 h-12" />
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {isLoading 
                ? 'Verificando estado...'
                : overallStatus === 'operational' 
                  ? 'Todos los sistemas operativos' 
                  : overallStatus === 'degraded'
                    ? 'Algunos sistemas degradados'
                    : 'Interrupción del servicio'
              }
            </h1>
            <p className="text-white/80">
              Última actualización: {lastRefresh.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            {error && (
              <p className="mt-2 text-white/60 text-sm">
                ⚠️ Error al obtener estado: {error}
              </p>
            )}
          </div>
        </section>

        {/* Refresh & Subscribe */}
        <section className="py-8 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Actualizando...' : 'Actualizar Estado'}
              </Button>
              
              <form onSubmit={handleSubscribe} className="flex gap-2 w-full sm:w-auto">
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full sm:w-64"
                />
                <Button
                  type="submit"
                  disabled={isSubscribing}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 whitespace-nowrap"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  {isSubscribing ? 'Suscribiendo...' : 'Suscribirse'}
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Services Status */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Estado de Servicios</h2>
            
            {isLoading && services.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-200" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4">
                {services.map((service, index) => {
                  const ServiceIcon = getServiceIcon(service.name);
                  const StatusIcon = getStatusIcon(service.status);
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                            <ServiceIcon className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{service.name}</h3>
                            <p className="text-sm text-gray-500">{getServiceDescription(service.name)}</p>
                            {service.message && (
                              <p className="text-xs text-red-500 mt-1">{service.message}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="hidden md:flex gap-8 text-sm">
                            <div className="text-center">
                              <div className="text-gray-500">Respuesta</div>
                              <div className="font-semibold text-gray-900">
                                {service.responseTime > 0 ? `${service.responseTime}ms` : '-'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)} ${service.status === 'operational' ? 'animate-pulse' : ''}`}></div>
                            <span className={`font-medium ${
                              service.status === 'operational' ? 'text-green-600' :
                              service.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {getStatusText(service.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Recent Incidents */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Incidentes Recientes</h2>
            
            {recentIncidents.length > 0 ? (
              <div className="space-y-4">
                {recentIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="bg-gray-50 rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedIncident(expandedIncident === incident.id ? null : incident.id)}
                      className="w-full p-6 text-left hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getIncidentStatusColor(incident.status)}`}>
                              {getIncidentStatusText(incident.status)}
                            </span>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(incident.date).toLocaleDateString('es-MX', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                          <p className="text-gray-500 text-sm mt-1">{incident.description}</p>
                        </div>
                        <Activity className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedIncident === incident.id ? 'rotate-180' : ''
                        }`} />
                      </div>
                    </button>
                    
                    {expandedIncident === incident.id && (
                      <div className="px-6 pb-6 border-t border-gray-200 pt-4 animate-fade-in">
                        <h4 className="font-medium text-gray-700 mb-3">Actualizaciones</h4>
                        <div className="space-y-3">
                          {incident.updates.map((update, i) => (
                            <div key={i} className="flex gap-3 text-sm">
                              <span className="text-gray-400 font-mono">{update.time}</span>
                              <span className="text-gray-600">{update.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-12 text-center border border-gray-100">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin incidentes recientes</h3>
                <p className="text-gray-500">No ha habido incidentes en los últimos 90 días.</p>
              </div>
            )}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-12 bg-gradient-to-r from-violet-600 to-indigo-600">
          <div className="max-w-4xl mx-auto px-4 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">¿Experimentas problemas?</h2>
            <p className="text-white/80 mb-6">
              Si estás experimentando problemas que no se reflejan aquí, por favor contáctanos.
            </p>
            <Link to="/contact">
              <Button size="lg" className="bg-white text-violet-600 hover:bg-gray-100">
                Contactar Soporte
              </Button>
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
