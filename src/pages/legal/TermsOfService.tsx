import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

export default function TermsOfService() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Helmet>
        <title>Términos y Condiciones | Sortavo</title>
        <meta name="description" content="Términos y condiciones de uso de la plataforma Sortavo para organización de sorteos en línea." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Términos y Condiciones de Uso</h1>
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
              <h2 className="text-xl font-semibold border-b pb-2">1. Aceptación de los Términos</h2>
              <p>
                Al acceder y utilizar la plataforma Sortavo ("la Plataforma"), usted acepta estar sujeto a estos 
                Términos y Condiciones de Uso. Si no está de acuerdo con alguna parte de estos términos, no podrá 
                acceder al servicio.
              </p>
              <p>
                1.1. Estos términos constituyen un acuerdo legalmente vinculante entre usted y Sortavo.
              </p>
              <p>
                1.2. El uso continuado de la Plataforma después de cualquier modificación constituye aceptación 
                de los nuevos términos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">2. Descripción del Servicio</h2>
              <p>
                Sortavo es una plataforma tecnológica que permite a organizadores crear, gestionar y ejecutar 
                sorteos en línea de manera transparente y segura.
              </p>
              <p>
                2.1. La Plataforma proporciona herramientas para la creación de sorteos, venta de boletos, 
                procesamiento de pagos y selección de ganadores.
              </p>
              <p>
                2.2. Sortavo actúa únicamente como intermediario tecnológico y no es responsable de la 
                organización, legalidad o cumplimiento de los sorteos individuales.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">3. Registro y Cuenta de Usuario</h2>
              <p>
                3.1. Para utilizar ciertas funciones de la Plataforma, debe registrarse y crear una cuenta.
              </p>
              <p>
                3.2. Usted es responsable de mantener la confidencialidad de su cuenta y contraseña.
              </p>
              <p>
                3.3. Debe proporcionar información precisa, actual y completa durante el proceso de registro.
              </p>
              <p>
                3.4. Acepta notificar inmediatamente a Sortavo sobre cualquier uso no autorizado de su cuenta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">4. Responsabilidades del Organizador</h2>
              <p>
                Los organizadores de sorteos aceptan y se comprometen a:
              </p>
              <p>
                4.1. <strong>Legalidad:</strong> Garantizar que el sorteo cumple con todas las leyes y 
                regulaciones aplicables en su jurisdicción.
              </p>
              <p>
                4.2. <strong>Entrega de Premios:</strong> Entregar el premio anunciado al ganador en el 
                plazo establecido.
              </p>
              <p>
                4.3. <strong>Transparencia:</strong> Proporcionar información veraz sobre el sorteo, 
                el premio y las condiciones de participación.
              </p>
              <p>
                4.4. <strong>Comunicación:</strong> Mantener comunicación adecuada con los participantes 
                y ganadores.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">5. Responsabilidades del Participante</h2>
              <p>
                Los participantes de sorteos aceptan:
              </p>
              <p>
                5.1. Ser mayores de 18 años o contar con autorización de un tutor legal.
              </p>
              <p>
                5.2. Proporcionar información veraz y precisa al momento de la compra.
              </p>
              <p>
                5.3. Respetar las reglas específicas de cada sorteo.
              </p>
              <p>
                5.4. No utilizar la Plataforma para actividades fraudulentas o ilegales.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">6. Reglas de los Sorteos</h2>
              <p>
                6.1. Cada sorteo debe cumplir con los requisitos mínimos establecidos por la Plataforma.
              </p>
              <p>
                6.2. Los procedimientos de selección de ganadores deben ser transparentes y verificables.
              </p>
              <p>
                6.3. La verificación de ganadores se realizará según los métodos definidos por el organizador.
              </p>
              <p>
                6.4. Los resultados de los sorteos son finales una vez confirmados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">7. Pagos y Transacciones</h2>
              <p>
                7.1. Los pagos se procesan a través de Stripe, un proveedor de pagos certificado PCI-DSS.
              </p>
              <p>
                7.2. Los métodos de pago aceptados incluyen tarjetas de crédito/débito y transferencias bancarias.
              </p>
              <p>
                7.3. Los precios de los boletos son establecidos por cada organizador.
              </p>
              <p>
                7.4. Sortavo cobra una comisión por el uso de la Plataforma según el plan de suscripción.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">8. Política de Reembolsos</h2>
              <p>
                8.1. <strong>Sorteos Cancelados:</strong> Si un organizador cancela un sorteo, los participantes 
                recibirán un reembolso completo.
              </p>
              <p>
                8.2. <strong>Fraude Detectado:</strong> Si se detecta fraude, se procesarán reembolsos según 
                corresponda.
              </p>
              <p>
                8.3. <strong>Proceso:</strong> Los reembolsos se procesarán en un plazo de 5-10 días hábiles 
                al método de pago original.
              </p>
              <p>
                8.4. Los boletos vendidos generalmente no son reembolsables salvo las excepciones mencionadas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">9. Entrega de Premios</h2>
              <p>
                9.1. La entrega de premios es responsabilidad exclusiva del organizador del sorteo.
              </p>
              <p>
                9.2. El organizador debe coordinar con el ganador la entrega en un plazo razonable.
              </p>
              <p>
                9.3. Sortavo no es responsable de la entrega, calidad o estado del premio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">10. Propiedad Intelectual</h2>
              <p>
                10.1. Todo el contenido de la Plataforma, incluyendo marca, diseño y código, es propiedad de Sortavo.
              </p>
              <p>
                10.2. Los usuarios conservan los derechos sobre el contenido que suben a la Plataforma.
              </p>
              <p>
                10.3. Al subir contenido, otorga a Sortavo una licencia para usar dicho contenido en la Plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">11. Uso Prohibido</h2>
              <p>
                Está prohibido utilizar la Plataforma para:
              </p>
              <p>
                11.1. Actividades ilegales o fraudulentas.
              </p>
              <p>
                11.2. Manipulación de sorteos o resultados.
              </p>
              <p>
                11.3. Spam o comunicaciones no solicitadas.
              </p>
              <p>
                11.4. Interferir con el funcionamiento de la Plataforma.
              </p>
              <p>
                11.5. Suplantar identidad de otros usuarios u organizaciones.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">12. Limitación de Responsabilidad</h2>
              <p>
                12.1. Sortavo actúa únicamente como plataforma tecnológica.
              </p>
              <p>
                12.2. No somos responsables de la conducta de organizadores o participantes.
              </p>
              <p>
                12.3. No garantizamos la legalidad de los sorteos organizados a través de la Plataforma.
              </p>
              <p>
                12.4. Nuestra responsabilidad se limita al monto pagado por el usuario en los últimos 12 meses.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">13. Indemnización</h2>
              <p>
                13.1. Usted acepta indemnizar y mantener indemne a Sortavo de cualquier reclamación, daño o 
                gasto que surja de su uso de la Plataforma o violación de estos términos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">14. Resolución de Disputas</h2>
              <p>
                14.1. Las disputas se resolverán primero mediante mediación amistosa.
              </p>
              <p>
                14.2. De no resolverse, se someterán a arbitraje vinculante.
              </p>
              <p>
                14.3. Estos términos se rigen por las leyes de los Estados Unidos Mexicanos.
              </p>
              <p>
                14.4. La jurisdicción exclusiva corresponde a los tribunales de la Ciudad de México.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">15. Cambios a los Términos</h2>
              <p>
                15.1. Sortavo se reserva el derecho de modificar estos términos en cualquier momento.
              </p>
              <p>
                15.2. Los cambios significativos serán notificados por correo electrónico o aviso en la Plataforma.
              </p>
              <p>
                15.3. El uso continuado después de los cambios constituye aceptación de los nuevos términos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">16. Información de Contacto</h2>
              <p>
                Para cualquier consulta sobre estos Términos y Condiciones:
              </p>
              <p>
                <strong>Email:</strong> legal@sortavo.com
              </p>
              <p>
                <strong>Dirección:</strong> Ciudad de México, México
              </p>
            </section>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
