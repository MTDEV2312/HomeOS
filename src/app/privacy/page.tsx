import Link from 'next/link';
import { Logo } from '@/components/Logo';

export const metadata = {
  title: 'Política de Privacidad - HomeOS',
  description: 'Política de Privacidad y protección de datos personales de la aplicación HomeOS.',
};

export default function PrivacyPage() {
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
            Política de Privacidad
          </h1>
          <p className="text-on-surface-variant font-label-sm">
            Última actualización: 28 de Mayo de 2026
          </p>

          <section className="flex flex-col gap-sm">
            <p>
              En <strong>HomeOS</strong> (en adelante, &quot;la Aplicación&quot;), de propiedad y administrada por{' '}
              <strong>MTDEV2312</strong> (en adelante, &quot;el Propietario&quot;), nos tomamos muy en serio la privacidad y la
              protección de tus datos personales.
            </p>
            <p>
              Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y protegemos la información que nos
              proporcionás cuando te registrás y utilizás nuestra plataforma.
            </p>
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-h2 text-h2 text-primary mt-sm">1. Información que Recopilamos</h2>
            <p>
              Para poder brindarte el servicio de autenticación y el uso correcto de la Aplicación, recopilamos la siguiente
              información de carácter obligatorio:
            </p>
            <ul className="list-disc pl-lg flex flex-col gap-xs">
              <li>
                <strong>Datos de Registro:</strong> Nombre completo, dirección de correo electrónico (usuario) y contraseña.
              </li>
              <li>
                <strong>Información Técnica:</strong> Dirección IP, tipo de navegador, sistema operativo, y datos de cookies para
                mantener tu sesión activa y mejorar la seguridad.
              </li>
              <li>
                <strong>Datos de Uso:</strong> Información sobre cómo interactuás con la Aplicación para optimizar el rendimiento
                y detectar anomalías.
              </li>
            </ul>
            <div className="p-sm bg-primary/10 border-l-4 border-primary rounded-r-lg mt-xs">
              <p className="text-body-sm font-medium text-primary">Seguridad de las Contraseñas</p>
              <p className="text-body-sm text-on-surface-variant mt-2">
                Tu contraseña se almacena de forma encriptada mediante algoritmos criptográficos irreversibles de alta seguridad
                en nuestros servidores de base de datos. Ningún empleado o administrador de la Aplicación tiene acceso a tu
                contraseña en texto plano.
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-h2 text-h2 text-primary mt-sm">2. Finalidad del Tratamiento de Datos</h2>
            <p>Utilizamos tus datos personales estrictamente para las siguientes finalidades:</p>
            <ol className="list-decimal pl-lg flex flex-col gap-xs">
              <li>
                <strong>Gestión de Cuentas:</strong> Crear, mantener y gestionar tu perfil de usuario, y permitir tu acceso
                seguro (autenticación).
              </li>
              <li>
                <strong>Prestación del Servicio:</strong> Habilitar las funcionalidades propias de la aplicación ERP / gestión
                familiar HomeOS.
              </li>
              <li>
                <strong>Comunicaciones:</strong> Enviarte notificaciones administrativas importantes, actualizaciones de seguridad, o
                responder a tus consultas de soporte técnico.
              </li>
              <li>
                <strong>Seguridad y Cumplimiento:</strong> Prevenir fraudes, mitigar ataques cibernéticos y cumplir con
                obligaciones legales aplicables.
              </li>
            </ol>
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-h2 text-h2 text-primary mt-sm">3. Base Legal para el Tratamiento</h2>
            <p>El tratamiento de tus datos personales se realiza bajo las siguientes bases jurídicas:</p>
            <ul className="list-disc pl-lg flex flex-col gap-xs">
              <li>
                <strong>Ejecución de un Contrato:</strong> Necesitamos procesar tus datos para proporcionarte el servicio de
                acuerdo con los Términos y Condiciones.
              </li>
              <li>
                <strong>Consentimiento:</strong> Al registrarte de forma voluntaria en la plataforma, otorgás tu consentimiento
                expreso para el tratamiento de tus datos conforme a esta política.
              </li>
              <li>
                <strong>Interés Legítimo:</strong> Garantizar la seguridad, integridad y el correcto funcionamiento técnico de la
                plataforma.
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-h2 text-h2 text-primary mt-sm">4. Conservación de los Datos</h2>
            <p>
              Tus datos personales se conservarán únicamente mientras mantengas activa tu cuenta en la Aplicación. Si decidís eliminar
              tu cuenta, tus datos personales serán eliminados permanentemente o anonimizados en nuestros sistemas, excepto aquellos
              datos que estemos obligados legalmente a conservar por plazos específicos (por ejemplo, registros de transacciones
              financieras o auditorías de seguridad).
            </p>
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-h2 text-h2 text-primary mt-sm">5. Compartición de Datos con Terceros</h2>
            <p>
              No vendemos, alquilamos ni comercializamos tus datos personales con terceros. Sin embargo, para prestar el servicio de
              manera eficiente, utilizamos los siguientes proveedores de infraestructura (quienes actúan como encargados de
              tratamiento bajo estrictas normas de confidencialidad):
            </p>
            <ul className="list-disc pl-lg flex flex-col gap-xs">
              <li>
                <strong>Proveedores de Hosting y Backend:</strong> Infraestructura en la nube con altos estándares de seguridad
                física y lógica (como InsForge / PostgreSQL).
              </li>
              <li>
                <strong>Servicios de Correo Electrónico:</strong> Para el envío de correos de verificación y restablecimiento de
                contraseña.
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-h2 text-h2 text-primary mt-sm">6. Derechos de los Usuarios (Derechos ARCO)</h2>
            <p>
              Tenés pleno derecho sobre tus datos personales. Podés ejercer en cualquier momento los siguientes derechos enviando un
              correo a{' '}
              <a href="mailto:soporte@mg.mathiast.me" className="text-primary hover:underline font-medium">
                soporte@mg.mathiast.me
              </a>
              :
            </p>
            <ul className="list-disc pl-lg flex flex-col gap-xs">
              <li>
                <strong>Acceso:</strong> Solicitar información sobre qué datos personales tenemos sobre vos.
              </li>
              <li>
                <strong>Rectificación:</strong> Solicitar la corrección de datos incorrectos, incompletos o desactualizados.
              </li>
              <li>
                <strong>Supresión (Cancelación):</strong> Solicitar la eliminación total de tu cuenta y datos asociados.
              </li>
              <li>
                <strong>Oposición o Limitación:</strong> Oponerte al tratamiento de tus datos para finalidades específicas bajo
                ciertos supuestos.
              </li>
            </ul>
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
