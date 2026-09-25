'use client'

import React from 'react'
import { Link } from '@/lib/navigation'

export default function Terms() {
  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg font-sans">
      <nav className="border-b border-line dark:border-dark-line bg-surface dark:bg-dark-surface">
        <div className="max-w-[1280px] mx-auto px-8 lg:px-16 h-14 flex items-center">
          <Link href="/" className="text-[14px] font-semibold text-ink dark:text-dark-ink flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-olive dark:bg-dark-olive" />
            HomeOS
          </Link>
        </div>
      </nav>
      <div className="max-w-[720px] mx-auto px-8 lg:px-16 py-16">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-3">Legal</p>
        <h1 className="text-[42px] font-light tracking-[-0.02em] text-ink dark:text-dark-ink mb-10">Términos y condiciones</h1>
        <div className="space-y-8 text-[14px] text-muted dark:text-dark-muted leading-relaxed">
          {[
            { title: '1. Aceptación de los términos', body: 'Al crear una cuenta en HomeOS, aceptás estos términos y condiciones. Si no estás de acuerdo con alguna parte, no podés usar el servicio.' },
            { title: '2. Descripción del servicio', body: 'HomeOS es una plataforma de administración del hogar que te permite gestionar tareas, compras, gastos, inventario, mantenimiento y documentos de forma colaborativa.' },
            { title: '3. Responsabilidades del usuario', body: 'Sos responsable de mantener la confidencialidad de tu cuenta, de toda la actividad que ocurra bajo tu cuenta, y de la exactitud de los datos que ingresás.' },
            { title: '4. Propiedad intelectual', body: 'El contenido, el diseño y el código fuente de HomeOS son propiedad exclusiva de HomeOS y están protegidos por las leyes de propiedad intelectual aplicables.' },
            { title: '5. Limitación de responsabilidad', body: 'HomeOS no se hace responsable por pérdidas de datos, interrupciones del servicio o daños indirectos derivados del uso de la plataforma.' },
            { title: '6. Modificaciones', body: 'Podemos modificar estos términos en cualquier momento. Te notificaremos por email con al menos 15 días de anticipación ante cambios significativos.' },
            { title: '7. Legislación aplicable', body: 'Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa será resuelta en los tribunales de la Ciudad Autónoma de Buenos Aires.' },
          ].map(s => (
            <div key={s.title}>
              <h2 className="text-[16px] font-semibold text-ink dark:text-dark-ink mb-2">{s.title}</h2>
              <p>{s.body}</p>
            </div>
          ))}
          <p className="text-[12px] text-muted/60 dark:text-dark-muted/60 pt-4 border-t border-line dark:border-dark-line">
            Última actualización: octubre de 2026
          </p>
        </div>
      </div>
    </div>
  )
}
