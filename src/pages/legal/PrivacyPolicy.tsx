import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPolicy() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Helmet>
        <title>Política de Privacidad | Sortavo</title>
        <meta name="description" content="Política de privacidad de Sortavo. Conoce cómo recopilamos, usamos y protegemos tu información personal." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Política de Privacidad</h1>
              <p className="text-muted-foreground mt-1">
                Última actualización: 24 de diciembre de 2025
              </p>
            </div>
            <Button variant="outline" onClick={handlePrint} className="print:hidden">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>

          {/* Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold border-b pb-2">1. Introducción y Alcance</h2>
              <p>
                En Sortavo, nos comprometemos a proteger tu privacidad. Esta Política de Privacidad explica 
                cómo recopilamos, usamos, compartimos y protegemos tu información personal cuando utilizas 
                nuestra plataforma.
              </p>
              <p>
                1.1. Esta política cumple con el Reglamento General de Protección de Datos (GDPR) de la Unión 
                Europea y la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) 
                de México.
              </p>
              <p>
                1.2. Al utilizar Sortavo, aceptas las prácticas descritas en esta política.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">2. Información que Recopilamos</h2>
              <p>Recopilamos los siguientes tipos de información:</p>
              
              <h3 className="text-lg font-medium mt-4">2.1. Información de Cuenta</h3>
              <ul>
                <li>Nombre completo</li>
                <li>Dirección de correo electrónico</li>
                <li>Número de teléfono</li>
                <li>Ciudad de residencia</li>
              </ul>

              <h3 className="text-lg font-medium mt-4">2.2. Información de Pago</h3>
              <p>
                Los datos de pago (tarjetas de crédito/débito) son procesados directamente por Stripe. 
                Sortavo no almacena información completa de tarjetas.
              </p>

              <h3 className="text-lg font-medium mt-4">2.3. Información de Participación</h3>
              <ul>
                <li>Historial de sorteos en los que participas</li>
                <li>Boletos comprados</li>
                <li>Comprobantes de pago subidos</li>
              </ul>

              <h3 className="text-lg font-medium mt-4">2.4. Información de Dispositivo</h3>
              <ul>
                <li>Dirección IP</li>
                <li>Tipo de navegador</li>
                <li>Sistema operativo</li>
                <li>Páginas visitadas y tiempo de navegación</li>
              </ul>

              <h3 className="text-lg font-medium mt-4" id="cookies">2.5. Cookies y Tecnologías Similares</h3>
              <p>
                Utilizamos cookies para mejorar tu experiencia, analizar el uso de la plataforma y 
                personalizar contenido. Puedes gestionar tus preferencias de cookies en cualquier momento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">3. Cómo Usamos tu Información</h2>
              <p>Utilizamos tu información para:</p>
              <p>
                3.1. <strong>Proveer el Servicio:</strong> Crear y gestionar tu cuenta, procesar participaciones 
                en sorteos, y comunicarnos contigo.
              </p>
              <p>
                3.2. <strong>Procesar Transacciones:</strong> Gestionar pagos, verificar comprobantes y 
                emitir confirmaciones.
              </p>
              <p>
                3.3. <strong>Comunicaciones:</strong> Enviar notificaciones sobre sorteos, ganadores, 
                y actualizaciones importantes.
              </p>
              <p>
                3.4. <strong>Mejora de la Plataforma:</strong> Analizar el uso para mejorar nuestros servicios 
                y experiencia de usuario.
              </p>
              <p>
                3.5. <strong>Cumplimiento Legal:</strong> Cumplir con obligaciones legales y responder a 
                solicitudes de autoridades.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">4. Base Legal del Procesamiento (GDPR)</h2>
              <p>Procesamos tus datos personales bajo las siguientes bases legales:</p>
              <p>
                4.1. <strong>Consentimiento:</strong> Para envío de comunicaciones de marketing y uso de 
                cookies no esenciales.
              </p>
              <p>
                4.2. <strong>Ejecución de Contrato:</strong> Para proporcionar los servicios que has 
                solicitado (participación en sorteos, gestión de cuenta).
              </p>
              <p>
                4.3. <strong>Obligación Legal:</strong> Para cumplir con leyes fiscales, de prevención 
                de fraude y otras regulaciones aplicables.
              </p>
              <p>
                4.4. <strong>Intereses Legítimos:</strong> Para mejorar nuestros servicios, prevenir fraudes 
                y proteger la seguridad de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">5. Compartir Información</h2>
              <p>Compartimos tu información con:</p>
              
              <h3 className="text-lg font-medium mt-4">5.1. Organizadores de Sorteos</h3>
              <p>
                Cuando participas en un sorteo, el organizador recibe tu nombre, email, teléfono y ciudad 
                para gestionar tu participación y, en caso de ganar, coordinar la entrega del premio.
              </p>

              <h3 className="text-lg font-medium mt-4">5.2. Proveedores de Servicios</h3>
              <ul>
                <li><strong>Stripe:</strong> Procesamiento de pagos</li>
                <li><strong>Resend:</strong> Envío de correos electrónicos transaccionales</li>
                <li><strong>Supabase:</strong> Alojamiento y base de datos</li>
              </ul>

              <h3 className="text-lg font-medium mt-4">5.3. Autoridades</h3>
              <p>
                Podemos compartir información cuando sea requerido por ley, orden judicial o para 
                proteger nuestros derechos legales.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">6. Tus Derechos (GDPR)</h2>
              <p>Bajo el GDPR, tienes los siguientes derechos:</p>
              <p>
                6.1. <strong>Derecho de Acceso:</strong> Solicitar una copia de los datos personales 
                que tenemos sobre ti.
              </p>
              <p>
                6.2. <strong>Derecho de Rectificación:</strong> Corregir datos inexactos o incompletos.
              </p>
              <p>
                6.3. <strong>Derecho de Eliminación:</strong> Solicitar la eliminación de tus datos 
                personales ("derecho al olvido").
              </p>
              <p>
                6.4. <strong>Derecho de Portabilidad:</strong> Recibir tus datos en un formato estructurado 
                y legible por máquina.
              </p>
              <p>
                6.5. <strong>Derecho de Oposición:</strong> Oponerte al procesamiento de tus datos para 
                ciertos fines.
              </p>
              <p>
                6.6. <strong>Cómo Ejercer tus Derechos:</strong> Envía un correo a privacy@sortavo.com 
                con tu solicitud. Responderemos en un plazo de 30 días.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">7. Seguridad de Datos</h2>
              <p>Implementamos medidas de seguridad técnicas y organizacionales:</p>
              <p>
                7.1. Cifrado de datos en tránsito (TLS/SSL) y en reposo.
              </p>
              <p>
                7.2. Acceso restringido a datos personales solo al personal autorizado.
              </p>
              <p>
                7.3. Monitoreo continuo de seguridad y auditorías regulares.
              </p>
              <p>
                7.4. Copias de seguridad encriptadas y planes de recuperación ante desastres.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">8. Retención de Datos</h2>
              <p>
                8.1. Conservamos tus datos mientras tengas una cuenta activa o sea necesario para 
                proporcionarte servicios.
              </p>
              <p>
                8.2. Datos de transacciones se conservan según requisitos fiscales y legales 
                (generalmente 5-7 años).
              </p>
              <p>
                8.3. Puedes solicitar la eliminación de tus datos en cualquier momento, sujeto a 
                obligaciones legales de retención.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">9. Transferencias Internacionales</h2>
              <p>
                9.1. Nuestros servidores están ubicados en Estados Unidos (a través de proveedores 
                como Supabase y Stripe).
              </p>
              <p>
                9.2. Las transferencias de datos fuera de la UE se realizan bajo cláusulas contractuales 
                estándar aprobadas por la Comisión Europea.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">10. Privacidad de Menores</h2>
              <p>
                10.1. Sortavo no está dirigido a menores de 18 años.
              </p>
              <p>
                10.2. No recopilamos intencionalmente información de menores de edad.
              </p>
              <p>
                10.3. Si descubrimos que hemos recopilado datos de un menor, los eliminaremos 
                inmediatamente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">11. Cambios a esta Política</h2>
              <p>
                11.1. Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios 
                significativos por correo electrónico o aviso en la plataforma.
              </p>
              <p>
                11.2. Te recomendamos revisar esta política regularmente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">12. Información de Contacto</h2>
              <p>
                Para cualquier consulta sobre privacidad o para ejercer tus derechos:
              </p>
              <p>
                <strong>Email:</strong> privacy@sortavo.com
              </p>
              <p>
                <strong>Responsable de Protección de Datos:</strong> dpo@sortavo.com
              </p>
            </section>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
