import Link from 'next/link';
import { Logo } from '@/components/Logo';

export const metadata = {
  title: 'Términos y Condiciones - HomeOS',
  description: 'Términos y Condiciones de Uso de la aplicación HomeOS.',
};

export default function TermsPage() {
  return (
    <main className="bg-surface-dim h-screen overflow-y-auto p-md md:p-xl text-on-surface font-body-md">
      <div className="max-w-3xl mx-auto flex flex-col gap-lg">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-outline-variant pb-md">
          <Link href="/" className="flex items-center gap-sm hover:opacity-80 transition-opacity">
            <Logo size={36} />
            <span className="font-h2 text-h2 text-primary">HomeOS</span>
          </Link>
          <Link
            href="/signup"
            className="text-primary hover:underline font-label-md text-label-md transition-colors"
          >
            Volver al registro
          </Link>
        </header>

        {/* Content */}
        <article className="bg-surface-container-low rounded-xl border border-outline-variant p-lg md:p-xl shadow-sm flex flex-col gap-md">
          <h1 className="font-h1 text-h1 text-primary border-b border-outline-variant pb-xs">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-on-surface-variant font-label-sm">
            Última actualización: 28 de Mayo de 2026
          </p>

          <section className="flex flex-col gap-sm">
            <p>
              Los presentes Términos y Condiciones de Uso regulan el acceso y la utilización de la Aplicación{' '}
              <strong>HomeOS</strong>. Al registrarte o utilizar la plataforma, aceptás quedar vinculado de manera incondicional por
              estos términos. Si no estás de acuerdo con alguna de estas condiciones, deberás abstenerte de registrarte o utilizar
              la Aplicación.
            </p>
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-h2 text-h2 text-primary mt-sm">1. Requisitos de Registro y Cuenta de Usuario</h2>
            <ul className="list-disc pl-lg flex flex-col gap-xs">
              <li>
                <strong>Registro Obligatorio:</strong> El acceso a la mayoría de las funcionalidades requiere la creación de una
                cuenta de usuario.
              </li>
              <li>
                <strong>Veracidad de la Información:</strong> Te comprometés a proporcionar información verídica, exacta y
                actualizada durante el registro.
              </li>
              <li>
                <strong>Seguridad de Credenciales:</strong> Sos el único responsable de mantener la confidencialidad de tu
                contraseña y de todas las actividades que ocurran bajo tu cuenta.
              </li>
              <li>
                <strong>Notificación de Incidentes:</strong> Te comprometés a notificar de forma inmediata a{' '}
                <a href="mailto:soporte@mg.mathiast.me" className="text-primary hover:underline font-medium">
                  soporte@mg.mathiast.me
                </a>{' '}
                ante cualquier uso no autorizado de tu cuenta o brecha de seguridad que detectes.
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-h2 text-h2 text-primary mt-sm">2. Uso Permitido y Prohibiciones</h2>
            <p>
              La Aplicación se proporciona exclusivamente para tu uso personal o comercial legítimo en el marco de su diseño
              funcional (ERP / Gestión Familiar). Queda estrictamente prohibido:
            </p>
            <ul className="list-disc pl-lg flex flex-col gap-xs">
              <li>Utilizar la Aplicación para fines ilícitos, fraudulentos o perjudiciales para terceros.</li>
              <li>
                Intentar vulnerar los sistemas de seguridad, realizar ingeniería inversa, descompilar o extraer el código fuente
                de la plataforma.
              </li>
              <li>Introducir virus, troyanos, gusanos u otro material malicioso que pueda dañar la infraestructura técnica.</li>
              <li>
                Utilizar scripts automáticos, scrapers o bots para recopilar información de la Aplicación sin autorización
                previa por escrito.
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-h2 text-h2 text-primary mt-sm">3. Propiedad Intelectual</h2>
            <p>
              Todos los derechos de propiedad intelectual sobre el diseño, software, código fuente, logotipos, interfaces, marcas y
              contenidos de la Aplicación son propiedad exclusiva del Propietario (<strong>MTDEV2312</strong>, perfil de GitHub:{' '}
              <a
                href="https://github.com/MTDEV2312"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                https://github.com/MTDEV2312
              </a>
              ) o de sus licenciantes. Queda prohibida la reproducción, distribución o modificación de cualquier elemento sin
              autorización previa.
            </p>
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-h2 text-h2 text-primary mt-sm">4. Limitación de Responsabilidad</h2>
            <div className="p-sm bg-error/10 border-l-4 border-error rounded-r-lg mt-xs flex flex-col gap-xs">
              <p className="text-body-sm font-medium text-error">Uso Bajo Propio Riesgo</p>
              <p className="text-body-sm text-on-surface-variant">
                La Aplicación se proporciona &quot;tal cual&quot; y &quot;según disponibilidad&quot;, sin garantías de ningún tipo, expresas
                o implícitas. No garantizamos que el servicio sea ininterrumpido, libre de errores o 100% inmune a brechas de
                seguridad informáticas.
              </p>
            </div>
            <ul className="list-disc pl-lg flex flex-col gap-xs mt-xs">
              <li>
                El Propietario no será responsable por daños indirectos, incidentales, especiales o consecuentes, incluyendo pero
                no limitado a la pérdida de beneficios, pérdida de datos, o interrupción del negocio derivados del uso o de la
                imposibilidad de uso de la Aplicación.
              </li>
              <li>Es responsabilidad del usuario mantener respaldos (backups) independientes de la información crítica que cargue en el sistema.</li>
            </ul>
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-h2 text-h2 text-primary mt-sm">5. Modificaciones del Servicio y de los Términos</h2>
            <p>
              Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto de la Aplicación en cualquier
              momento. Asimismo, podremos actualizar estos Términos y Condiciones. Te notificaremos sobre cambios significativos a
              través de la Aplicación o vía correo electrónico. El uso continuado de la plataforma tras la entrada en vigor de los
              cambios constituye tu aceptación de los mismos.
            </p>
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-h2 text-h2 text-primary mt-sm">6. Ley Aplicable y Jurisdicción</h2>
            <p>
              Estos Términos y Condiciones se regirán e interpretarán de conformidad con las leyes de la jurisdicción aplicable del
              Propietario. Cualquier controversia que surja en relación con los presentes términos se someterá a la jurisdicción
              exclusiva de los tribunales ordinarios de la ciudad del domicilio legal del Propietario.
            </p>
          </section>
        </article>

        {/* Footer */}
        <footer className="text-center font-label-sm text-label-sm text-on-surface-variant/60 py-md border-t border-outline-variant">
          <span>Desarrollado por MTDEV2312 • © {new Date().getFullYear()} HomeOS</span>
        </footer>
      </div>
    </main>
  );
}
