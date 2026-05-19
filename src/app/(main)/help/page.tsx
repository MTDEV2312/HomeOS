'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useHousehold } from '@/lib/household-context';
import { insforge } from '@/lib/insforge';

interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  tips: string[];
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const helpCategories: HelpCategory[] = [
  {
    id: 'general',
    title: 'Mi Residencia y Miembros',
    icon: 'home',
    description: 'Gestión de la residencia, códigos de invitación, roles y perfiles de los integrantes del hogar.',
    tips: [
      'Comparte el código de invitación desde "Mi Residencia" para unir nuevos miembros.',
      'Los roles determinan qué puede hacer cada usuario: Propietario, Administrador o Miembro.',
      'Puedes cambiar de residencia activa desde el menú desplegable en la barra superior.'
    ]
  },
  {
    id: 'tasks',
    title: 'Tareas del Hogar',
    icon: 'task_alt',
    description: 'Organización de quehaceres cotidianos, asignaciones, rotaciones y recordatorios.',
    tips: [
      'Configura tareas recurrentes para que se repitan automáticamente cada semana o mes.',
      'Utiliza la vista "Hoy" para enfocarte en los quehaceres pendientes del día actual.',
      'Puedes reasignar tareas o cambiar su estado directamente desde su menú.'
    ]
  },
  {
    id: 'shopping',
    title: 'Listas de Compras',
    icon: 'shopping_basket',
    description: 'Listas colaborativas en tiempo real para provisiones, despensa y compras conjuntas.',
    tips: [
      'Cualquier cambio se sincroniza al instante en todos los dispositivos de la familia.',
      'Agrupa los artículos por categorías (Lácteos, Limpieza, etc.) para comprar más rápido.',
      'Marca artículos como "comprados" para quitarlos de la lista activa.'
    ]
  },
  {
    id: 'expenses',
    title: 'Gastos y Presupuestos',
    icon: 'payments',
    description: 'Registro de gastos del hogar, división equitativa de cuentas y metas mensuales.',
    tips: [
      'Establece presupuestos por categorías para llevar un control visual en tiempo real.',
      'Divide los gastos comunes indicando quién pagó y cómo se distribuye el importe.',
      'Revisa los gráficos de analíticas mensuales para ver en qué se gasta más.'
    ]
  },
  {
    id: 'inventory',
    title: 'Inventario y Alimentos',
    icon: 'inventory_2',
    description: 'Control de stock en la despensa, fechas de vencimiento de alimentos y alertas de bajo stock.',
    tips: [
      'Configura el "Límite mínimo" para recibir alertas automáticas cuando un producto se agote.',
      'Mueve productos agotados directamente a la "Lista de Compras" con un solo clic.',
      'Monitorea las fechas de expiración marcadas en rojo para evitar el desperdicio.'
    ]
  },
  {
    id: 'maintenance',
    title: 'Mantenimiento Preventivo',
    icon: 'home_repair_service',
    description: 'Programación de revisiones de equipos, filtros de aire, limpieza profunda y servicios del hogar.',
    tips: [
      'Crea recordatorios para tareas periódicas (ej: limpiar filtros del A/C cada 3 meses).',
      'Asocia fichas técnicas o facturas de mantenimiento a cada activo de la casa.',
      'Revisa el widget de mantenimiento en el dashboard principal para estar al día.'
    ]
  },
  {
    id: 'documents',
    title: 'Bóveda de Documentos',
    icon: 'folder',
    description: 'Almacenamiento seguro de contratos, garantías, recibos y manuales del hogar.',
    tips: [
      'Organiza tus archivos usando carpetas por categorías para encontrarlos rápido.',
      'Asocia documentos (como garantías) a activos específicos del hogar o gastos.',
      'El almacenamiento utiliza la infraestructura segura y cifrada de InsForge Storage.'
    ]
  }
];

const faqItems: FAQItem[] = [
  {
    question: '¿Cómo funciona la sincronización en tiempo real?',
    answer: 'HomeOS utiliza la tecnología Realtime de InsForge mediante WebSockets. Esto significa que cuando marcas una tarea como completada, agregas un artículo a la lista de compras o registras un nuevo gasto, el cambio se actualiza instantáneamente en las pantallas de todos los miembros del hogar que estén conectados, sin necesidad de recargar la página.',
    category: 'general'
  },
  {
    question: '¿Cuáles son las diferencias entre los roles de miembro?',
    answer: 'Hay tres roles disponibles en HomeOS:\n\n1. **Propietario (Owner)**: Creador del hogar. Tiene control absoluto, puede configurar todos los módulos, invitar/expulsar miembros y eliminar la residencia.\n2. **Administrador (Admin)**: Puede invitar miembros, gestionar tareas, listas de compras, gastos y configuraciones generales del hogar.\n3. **Miembro (Member)**: Puede ver toda la información, añadir y editar tareas, listas de compras, inventario y gastos, pero no puede alterar la configuración estructural del hogar ni expulsar miembros.',
    category: 'general'
  },
  {
    question: '¿Cómo puedo invitar a un nuevo miembro a mi hogar?',
    answer: 'Para invitar a alguien, ve a la sección "Mi Residencia" en el menú lateral. Allí verás un código de invitación único. Puedes copiar ese código o compartir el enlace directo. El nuevo miembro deberá registrarse en HomeOS e ingresar tu código en la pantalla inicial de configuración de hogar para unirse de inmediato.',
    category: 'general'
  },
  {
    question: '¿Qué sucede si un artículo del inventario se está agotando?',
    answer: 'Cada artículo en tu inventario tiene un campo llamado "Límite mínimo". Si la cantidad actual del artículo cae por debajo de este límite, el sistema lo marcará automáticamente con una alerta amarilla en el panel de control. Además, verás una opción rápida para "Mover a la lista de compras" para reponer el stock fácilmente.',
    category: 'inventory'
  },
  {
    question: '¿Cómo se dividen los gastos entre los miembros del hogar?',
    answer: 'Al registrar un gasto en la sección "Gastos", puedes indicar quién realizó el pago y cómo se dividirá el saldo. El sistema permite dividir en partes iguales entre todos los miembros o asignar porcentajes personalizados. Luego, en la pantalla de balance, verás el estado de deudas resumido indicando "Quién le debe a quién".',
    category: 'expenses'
  },
  {
    question: '¿Existe un límite para la cantidad de documentos que puedo subir?',
    answer: 'Los documentos, recibos y contratos se almacenan en InsForge Storage de forma segura. El plan gratuito de HomeOS comparte los límites estándar del almacenamiento en la nube de InsForge. Para un uso óptimo, te recomendamos subir archivos en formato PDF o imágenes comprimidas de recibos y facturas, y eliminar documentos antiguos que ya no sean de utilidad.',
    category: 'documents'
  }
];

export default function HelpPage() {
  const { user } = useAuth();
  const { activeHousehold } = useHousehold();

  // Ref for horizontal categories scrolling accessibility on PC
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);

  // Form State
  const [formCategory, setFormCategory] = useState('question');
  const [formPriority, setFormPriority] = useState('medium');
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Check scroll boundary to dynamically show left/right arrow buttons on PC
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    }
  };

  // Run scroll checks on mount, scroll events, window resizes, and category changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScroll();
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);

      // Perform a secondary check in case content expands after fonts/icons load
      const timer = setTimeout(checkScroll, 300);

      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        clearTimeout(timer);
      };
    }
  }, [searchQuery]);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft } = scrollContainerRef.current;
      const scrollAmount = 240;
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  // Filter categories and FAQs based on search query and selected filter
  const filteredCategories = useMemo(() => {
    return helpCategories.filter(cat => {
      const matchesSearch = 
        cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = selectedCategory === 'all' || cat.id === selectedCategory;
      
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, selectedCategory]);

  const filteredFAQs = useMemo(() => {
    return faqItems.filter(item => {
      const matchesSearch = 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = selectedCategory === 'all' || item.category === selectedCategory;
      
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, selectedCategory]);

  const handleFAQToggle = (index: number) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMessage.trim()) return;

    setIsSubmitting(true);

    try {
      const subject = `[HomeOS Soporte] ${formCategory.toUpperCase()} - Prioridad: ${formPriority.toUpperCase()}`;
      
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
          <h2 style="color: #4f46e5; margin-top: 0;">Nueva Consulta de Soporte de HomeOS</h2>
          <p><strong>Usuario:</strong> ${user?.profile?.name || 'Usuario'} (${user?.email})</p>
          <p><strong>Hogar Activo:</strong> ${activeHousehold?.name || 'Ninguno'}</p>
          <p><strong>Categoría:</strong> ${formCategory.toUpperCase()}</p>
          <p><strong>Prioridad:</strong> ${formPriority.toUpperCase()}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-weight: bold; margin-bottom: 5px;">Mensaje:</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #334155;">
            ${formMessage.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
          </div>
        </div>
      `;

      // Recipient support email address (can be configured in .env file)
      const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@residencia.com';

      const { error } = await insforge.emails.send({
        to: supportEmail,
        subject: subject,
        html: htmlContent,
        from: 'Soporte HomeOS',
        replyTo: user?.email || undefined
      });

      if (error) {
        console.error('Error al enviar el email de soporte con InsForge:', error);
      }
    } catch (err) {
      console.error('Excepción al enviar el formulario de soporte:', err);
    } finally {
      setIsSubmitting(false);
      setShowSuccessModal(true);
      setFormMessage('');
    }
  };

  return (
    <div className="flex flex-col gap-lg animate-fadeIn">
      {/* HEADER HERO AREA */}
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-outline-variant shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 md:p-10 flex flex-col items-center text-center">
        {/* Decorative Grid and Ambient Glows */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-tertiary/5 to-primary/5 pointer-events-none z-0" />
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none z-0" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-tertiary/10 blur-3xl pointer-events-none z-0" />
        
        <div className="relative z-10 max-w-2xl flex flex-col gap-sm">
          <div className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center mx-auto shadow-sm">
            <span className="material-symbols-outlined text-[32px] font-semibold">help</span>
          </div>
          <h1 className="font-h1 text-h2 md:text-h1 font-bold text-on-surface tracking-tight mt-2">
            ¿Cómo podemos ayudarte hoy?
          </h1>
          <p className="font-body-md text-on-surface-variant max-w-xl mx-auto">
            Explora las guías de uso, responde tus preguntas frecuentes sobre el funcionamiento de {activeHousehold?.name ? `"${activeHousehold.name}"` : 'tu hogar'} o contacta con soporte técnico.
          </p>

          {/* SEARCH BAR COMPONENT */}
          <div className="mt-6 relative w-full max-w-lg mx-auto">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar guías, preguntas frecuentes, atajos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3 rounded-xl border border-outline bg-surface text-on-surface font-body-md shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                title="Limpiar búsqueda"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FILTER PILLS WITH ACCESSIBLE PC NAVIGATION SCROLLING */}
      <div className="relative w-full flex items-center group/scroll select-none">
        {/* Left Scroll Arrow (PC only, shown dynamically if container can scroll left) */}
        {canScrollLeft && (
          <button
            onClick={() => scrollCategories('left')}
            className="absolute left-1 z-20 flex items-center justify-center w-8 h-8 rounded-full border border-outline-variant bg-surface/90 backdrop-blur-md text-on-surface hover:bg-primary hover:text-white hover:border-primary shadow-md transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
            title="Desplazar a la izquierda"
            aria-label="Desplazar categorías a la izquierda"
          >
            <span className="material-symbols-outlined text-[16px] font-bold">chevron_left</span>
          </button>
        )}

        {/* Scrollable category list container */}
        <div
          ref={scrollContainerRef}
          className="w-full flex gap-sm overflow-x-auto pb-2 px-1 scroll-smooth custom-scrollbar"
          style={{ scrollbarWidth: 'thin' }}
        >
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-md py-sm rounded-full font-label-md transition-all cursor-pointer border text-center whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-primary text-white border-primary shadow-sm font-bold'
                : 'bg-surface text-secondary border-outline-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            Todos los módulos
          </button>
          {helpCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-md py-sm rounded-full font-label-md transition-all cursor-pointer border flex items-center gap-xs whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white border-primary shadow-sm font-bold'
                  : 'bg-surface text-secondary border-outline-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
              {cat.title}
            </button>
          ))}
        </div>

        {/* Right Scroll Arrow (PC only, shown dynamically if container can scroll right) */}
        {canScrollRight && (
          <button
            onClick={() => scrollCategories('right')}
            className="absolute right-1 z-20 flex items-center justify-center w-8 h-8 rounded-full border border-outline-variant bg-surface/90 backdrop-blur-md text-on-surface hover:bg-primary hover:text-white hover:border-primary shadow-md transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
            title="Desplazar a la derecha"
            aria-label="Desplazar categorías a la derecha"
          >
            <span className="material-symbols-outlined text-[16px] font-bold">chevron_right</span>
          </button>
        )}
      </div>

      {/* MAIN TWO COLUMN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start">
        
        {/* LEFT/CENTER AREA: DOCUMENTATION & FAQS */}
        <div className="lg:col-span-2 flex flex-col gap-lg">
          
          {/* CATEGORIES SECTION */}
          <div className="flex flex-col gap-md">
            <h2 className="font-h2 text-h3 text-on-surface flex items-center gap-sm px-1">
              <span className="material-symbols-outlined text-primary text-[24px]">menu_book</span>
              Guías y Módulos de HomeOS
            </h2>
            
            {filteredCategories.length === 0 ? (
              <div className="bg-surface rounded-xl border border-outline-variant p-lg text-center text-on-surface-variant flex flex-col items-center justify-center gap-sm">
                <span className="material-symbols-outlined text-[48px] text-outline">search_off</span>
                <p className="font-body-md font-medium">No encontramos categorías que coincidan con tu búsqueda.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} 
                  className="text-primary hover:underline font-label-md cursor-pointer"
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {filteredCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-surface border border-outline-variant hover:border-primary/50 rounded-2xl p-md shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-md mb-sm">
                        <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary flex items-center justify-center transition-all group-hover:bg-primary group-hover:text-white shrink-0 shadow-sm">
                          <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                        </div>
                        <h3 className="font-h3 text-body-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                          {cat.title}
                        </h3>
                      </div>
                      <p className="font-body-md text-label-md text-on-surface-variant leading-relaxed mb-md">
                        {cat.description}
                      </p>
                    </div>
                    
                    <div className="mt-auto border-t border-outline-variant pt-md">
                      <h4 className="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-sm flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[14px]">tips_and_updates</span>
                        Tips Rápidos:
                      </h4>
                      <ul className="flex flex-col gap-xs">
                        {cat.tips.map((tip, idx) => (
                          <li key={idx} className="font-body-md text-[13px] text-on-surface-variant flex items-start gap-sm">
                            <span className="w-1 h-1 rounded-full bg-primary/60 mt-2 shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FAQS SECTION */}
          <div className="flex flex-col gap-md">
            <h2 className="font-h2 text-h3 text-on-surface flex items-center gap-sm px-1">
              <span className="material-symbols-outlined text-primary text-[24px]">quiz</span>
              Preguntas Frecuentes (FAQs)
            </h2>
            
            {filteredFAQs.length === 0 ? (
              <div className="bg-surface rounded-xl border border-outline-variant p-lg text-center text-on-surface-variant">
                <p className="font-body-md">No hay preguntas frecuentes asociadas a este criterio de búsqueda.</p>
              </div>
            ) : (
              <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm flex flex-col divide-y divide-outline-variant">
                {filteredFAQs.map((faq, idx) => {
                  const isOpen = openFAQIndex === idx;
                  return (
                    <div key={idx} className="transition-colors hover:bg-surface-container-lowest">
                      <button
                        onClick={() => handleFAQToggle(idx)}
                        className="w-full text-left p-md md:p-lg flex justify-between items-center gap-md font-body-lg font-bold text-on-surface cursor-pointer select-none outline-none"
                      >
                        <span className="text-[15px] md:text-[16px] leading-snug">{faq.question}</span>
                        <span 
                          className={`material-symbols-outlined text-secondary transition-transform duration-300 shrink-0 ${
                            isOpen ? 'rotate-180 text-primary' : ''
                          }`}
                        >
                          expand_more
                        </span>
                      </button>
                      <div 
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isOpen ? 'max-h-[300px] border-t border-outline-variant/40 bg-surface-container-low/30' : 'max-h-0'
                        }`}
                      >
                        <div className="p-md md:p-lg font-body-md text-label-md text-on-surface-variant leading-relaxed whitespace-pre-line">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT AREA: SUPPORT FORM, KEYBOARD SHORTCUTS, STATUS */}
        <div className="flex flex-col gap-lg">
          
          {/* SUPPORT / CONTACT FORM */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-md md:p-lg shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-md relative">
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </div>
              <div>
                <h3 className="font-h3 text-body-lg font-bold text-on-surface">Enviar Consulta</h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Soporte directo para tu hogar</p>
              </div>
            </div>

            <hr className="border-outline-variant" />

            <form onSubmit={handleSubmitSupport} className="flex flex-col gap-sm">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-bold">
                  Nombre
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.profile?.name || user?.email?.split('@')[0] || 'Miembro de HomeOS'}
                  className="w-full px-md py-sm rounded-lg border border-outline-variant bg-surface-container-low text-on-surface-variant font-label-md cursor-not-allowed opacity-80"
                />
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-bold">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'email@residencia.com'}
                  className="w-full px-md py-sm rounded-lg border border-outline-variant bg-surface-container-low text-on-surface-variant font-label-md cursor-not-allowed opacity-80"
                />
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-bold">
                    Categoría
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-md py-sm rounded-lg border border-outline bg-surface text-on-surface font-label-md focus:border-primary outline-none transition-colors"
                  >
                    <option value="question">Duda General</option>
                    <option value="bug">Reporte Error</option>
                    <option value="suggestion">Sugerencia</option>
                  </select>
                </div>

                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-bold">
                    Prioridad
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full px-md py-sm rounded-lg border border-outline bg-surface text-on-surface font-label-md focus:border-primary outline-none transition-colors"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta ⚠️</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-bold">
                  Mensaje o Descripción
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe detalladamente tu inquietud o sugerencia..."
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  className="w-full px-md py-sm rounded-lg border border-outline bg-surface text-on-surface font-body-md shadow-sm focus:border-primary outline-none resize-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !formMessage.trim()}
                className={`w-full py-sm rounded-lg text-white font-label-md font-bold transition-all shadow-sm flex items-center justify-center gap-sm cursor-pointer ${
                  isSubmitting || !formMessage.trim()
                    ? 'bg-secondary/40 border-secondary/10 cursor-not-allowed shadow-none'
                    : 'bg-primary hover:bg-primary-container text-white hover:text-on-primary-container hover:shadow-md'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Enviar Mensaje</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* KEYBOARD SHORTCUTS REFERENCE */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-md md:p-lg shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-md">
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">keyboard</span>
              </div>
              <div>
                <h3 className="font-h3 text-body-lg font-bold text-on-surface">Atajos de Teclado</h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Productividad y velocidad</p>
              </div>
            </div>

            <hr className="border-outline-variant" />

            <div className="flex flex-col gap-sm">
              <div className="flex items-center justify-between font-label-md">
                <span className="text-on-surface-variant">Contraer/Expandir Menú</span>
                <span className="px-sm py-1 rounded bg-surface-container border border-outline-variant text-[12px] font-bold font-mono shadow-sm">
                  Ctrl + \
                </span>
              </div>
              <div className="flex items-center justify-between font-label-md">
                <span className="text-on-surface-variant">Cerrar ventanas y modales</span>
                <span className="px-sm py-1 rounded bg-surface-container border border-outline-variant text-[12px] font-bold font-mono shadow-sm">
                  Esc
                </span>
              </div>
              <div className="flex items-center justify-between font-label-md">
                <span className="text-on-surface-variant">Foco en buscador de ayuda</span>
                <span className="px-sm py-1 rounded bg-surface-container border border-outline-variant text-[12px] font-bold font-mono shadow-sm">
                  /
                </span>
              </div>
            </div>
          </div>

          {/* SYSTEM STATUS WIDGET */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-md md:p-lg shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-md">
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">dns</span>
              </div>
              <div>
                <h3 className="font-h3 text-body-lg font-bold text-on-surface">Estado del Sistema</h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Servicios integrados en InsForge</p>
              </div>
            </div>

            <hr className="border-outline-variant" />

            <div className="flex flex-col gap-sm">
              <div className="flex items-center justify-between font-label-md">
                <span className="text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant/70">database</span>
                  Base de Datos
                </span>
                <span className="inline-flex items-center gap-sm font-bold text-success text-[13px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  Operativo
                </span>
              </div>
              <div className="flex items-center justify-between font-label-md">
                <span className="text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant/70">shield</span>
                  Autenticación
                </span>
                <span className="inline-flex items-center gap-sm font-bold text-success text-[13px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  Operativo
                </span>
              </div>
              <div className="flex items-center justify-between font-label-md">
                <span className="text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant/70">cloud</span>
                  Almacenamiento
                </span>
                <span className="inline-flex items-center gap-sm font-bold text-success text-[13px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  Operativo
                </span>
              </div>
              <div className="flex items-center justify-between font-label-md">
                <span className="text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant/70">sync</span>
                  Tiempo Real
                </span>
                <span className="inline-flex items-center gap-sm font-bold text-success text-[13px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  Operativo
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* SUCCESS MODAL ON SUBMIT */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-md animate-fadeIn">
          <div className="bg-surface border border-outline-variant max-w-md w-full rounded-2xl shadow-xl p-lg flex flex-col items-center gap-md animate-scaleIn text-center relative">
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-inner mt-2">
              <span className="material-symbols-outlined text-[36px] font-bold animate-bounce">check</span>
            </div>

            <div className="flex flex-col gap-xs">
              <h3 className="font-h3 text-h3 font-bold text-on-surface">¡Mensaje Enviado con Éxito!</h3>
              <p className="font-body-md text-label-md text-on-surface-variant leading-relaxed mt-1">
                Gracias por contactarnos. Tu consulta ha sido enviada con prioridad <span className="font-bold uppercase text-primary">{formPriority}</span> al soporte técnico de HomeOS. Hemos registrado tus detalles de miembro y te daremos respuesta al correo asociado.
              </p>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full mt-2 py-sm bg-primary hover:bg-primary-container text-white hover:text-on-primary-container font-label-md font-bold rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* ANIMATION STYLES */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .text-success {
          color: #22c55e;
        }
        /* Custom horizontal elegant 4px scrollbar styling for categories list */
        .custom-scrollbar::-webkit-scrollbar {
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--outline-variant);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--outline);
        }
      `}</style>

    </div>
  );
}
