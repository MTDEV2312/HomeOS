/**
 * Centralized Help Center Knowledge Base for HomeOS
 * Strictly documents actual implemented features, workflows, roles, and routes.
 */

export interface HelpCategory {
  id: string
  name: string
  iconName: string
  description: string
}

export interface HelpGuide {
  id: string
  categoryId: string
  title: string
  summary: string
  steps: string[]
  tip?: string
  route: string
  routeLabel: string
  keywords: string[]
}

export interface QuickStartStep {
  step: number
  title: string
  description: string
  route: string
  routeLabel: string
}

export interface RolePermissionRow {
  action: string
  description: string
  owner: boolean | string
  admin: boolean | string
  member: boolean | string
}

export interface TroubleshootItem {
  id: string
  title: string
  symptom: string
  cause: string
  solutionSteps: string[]
  route?: string
  routeLabel?: string
  keywords: string[]
}

export interface FAQItem {
  id: string
  categoryId: string
  question: string
  answer: string
  keywords: string[]
}

export interface KeyboardShortcut {
  combo: string
  description: string
}

export const helpCategories: HelpCategory[] = [
  { id: 'all', name: 'Todos', iconName: 'Layers', description: 'Explorá toda la documentación y guías del sistema.' },
  { id: 'quickstart', name: 'Primeros Pasos', iconName: 'Compass', description: 'Configurá tu hogar y comenzá en pocos minutos.' },
  { id: 'finances', name: 'Gastos y Presupuestos', iconName: 'DollarSign', description: 'Control de períodos mensuales, presupuestos y reportes en PDF.' },
  { id: 'tasks', name: 'Tareas y Quehaceres', iconName: 'CheckSquare', description: 'Organización de tareas, prioridades, fechas y recurrencias.' },
  { id: 'household', name: 'Hogar y Miembros', iconName: 'Home', description: 'Gestión de miembros, roles, invitaciones y códigos QR.' },
  { id: 'shopping-inventory', name: 'Compras e Inventario', iconName: 'ShoppingCart', description: 'Listas compartidas, control de stock y caducidad.' },
  { id: 'maintenance-docs', name: 'Mantenimiento y Bóveda', iconName: 'Wrench', description: 'Servicio de activos, garantías y almacenamiento seguro.' },
  { id: 'permissions', name: 'Roles y Permisos', iconName: 'Shield', description: 'Matriz comparativa de facultades entre Owner, Admin y Member.' },
  { id: 'troubleshooting', name: 'Solución de Problemas', iconName: 'AlertTriangle', description: 'Respuestas a dudas frecuentes y errores habituales.' },
]

export const quickStartSteps: QuickStartStep[] = [
  {
    step: 1,
    title: 'Crear o vincular tu Hogar',
    description: 'Definí el nombre de tu residencia o uníte a una existente mediante un código de invitación de 8 caracteres.',
    route: '/dashboard/household',
    routeLabel: 'Configurar Hogar',
  },
  {
    step: 2,
    title: 'Invitar a tus convivientes',
    description: 'Compartí el enlace directo, el código alfanumérico o mostrá el código QR desde tu pantalla para sumar miembros.',
    route: '/dashboard/members',
    routeLabel: 'Invitar Miembros',
  },
  {
    step: 3,
    title: 'Fijar el Presupuesto Mensual',
    description: 'Establecé el tope de gastos de este mes. El sistema computará los gastos en tu zona horaria e iniciará en $0 cada nuevo mes.',
    route: '/dashboard/expenses',
    routeLabel: 'Ir a Finanzas',
  },
  {
    step: 4,
    title: 'Organizar Tareas y Compras',
    description: 'Cargá los quehaceres con fecha de vencimiento y armá la primera lista de compras compartida en tiempo real.',
    route: '/dashboard/tasks',
    routeLabel: 'Ver Tareas',
  },
]

export const helpGuides: HelpGuide[] = [
  // FINANZAS
  {
    id: 'guide-expenses-monthly',
    categoryId: 'finances',
    title: 'Cálculo Mensual de Gastos y Períodos',
    summary: 'Cómo funciona la segregación por mes calendario y por qué tus totales inician en $0 al comenzar un nuevo mes.',
    steps: [
      'Ingresá a "Gastos y Presupuestos" desde la barra lateral o con el botón inferior.',
      'En la barra superior observá el período activo (por ejemplo "Septiembre 2026").',
      'Todos los indicadores (Total Gastado, Disponible, % Utilizado y Promedio Diario) computan únicamente los gastos registrados en ese mes.',
      'Al comenzar un nuevo mes, el contador arranca automáticamente en $0 sin borrar tus gastos anteriores, los cuales permanecen seguros en el historial.',
      'Para revisar meses previos, usá las flechas de navegación o hacé clic en cualquier tarjeta del historial de 6 meses.',
    ],
    tip: 'Los gastos se almacenan en UTC pero se agrupan según tu zona horaria local. Un gasto registrado a las 23:30 h del último día del mes pertenece a ese mes comercial.',
    route: '/dashboard/expenses',
    routeLabel: 'Ir a Gastos y Presupuestos →',
    keywords: ['gastos', 'presupuesto', 'cero', 'nuevo mes', 'periodo', 'mensual', 'finanzas', 'total', 'utc', 'timezone'],
  },
  {
    id: 'guide-expenses-pdf',
    categoryId: 'finances',
    title: 'Descarga de Reportes en PDF',
    summary: 'Generá y descargá un balance completo del mes en curso o de cualquier mes del historial.',
    steps: [
      'Navegá al mes que deseás reportar usando el selector superior o las tarjetas de historial.',
      'Hacé clic en el botón "Reporte PDF" en la esquina superior derecha.',
      'El motor de generación vectorial preparará el documento en segundos sin salir de la página.',
      'El PDF descargado incluye: membrete oficial del hogar, tarjetas de KPI, barra gráfica de consumo, desglose por categoría y la tabla detallada de transacciones con fecha local.',
    ],
    tip: 'Podés generar reportes de cualquier mes histórico tantas veces como necesites para archivo personal o rendición de cuentas compartida.',
    route: '/dashboard/expenses',
    routeLabel: 'Descargar Reporte PDF →',
    keywords: ['pdf', 'reporte', 'descargar', 'exportar', 'balance', 'imprimir', 'estadisticas'],
  },
  {
    id: 'guide-expenses-budget',
    categoryId: 'finances',
    title: 'Asignar o Modificar el Presupuesto Mensual',
    summary: 'Ajustá el límite de dinero asignado a un mes particular sin afectar los meses pasados ni futuros.',
    steps: [
      'Seleccioná el mes en la pantalla de Gastos.',
      'Hacé clic en "Editar presupuesto de este mes" en la barra de herramientas del período.',
      'Ingresá el nuevo monto numérico (por ejemplo $350.000) y pulsá "Asignar".',
      'La barra de progreso y el porcentaje consumido se recalcularán de inmediato en base al nuevo límite.',
    ],
    tip: 'Si un mes no tiene un presupuesto explícitamente configurado, HomeOS utilizará el presupuesto base del hogar para mantener la coherencia.',
    route: '/dashboard/expenses',
    routeLabel: 'Ajustar Presupuesto →',
    keywords: ['presupuesto', 'limite', 'editar', 'cambiar', 'tope', 'monto'],
  },

  // TAREAS
  {
    id: 'guide-tasks-priorities',
    categoryId: 'tasks',
    title: 'Gestión de Tareas, Prioridades y Recurrencias',
    summary: 'Cómo crear quehaceres compartidos, asignar responsables y establecer frecuencias periódicas.',
    steps: [
      'Dirigite a la sección "Tareas" en la barra lateral.',
      'Pulsá "Nueva tarea" para abrir el panel de carga.',
      'Indicá el título, descripción opcional, fecha límite y seleccioná el responsable dentro del hogar.',
      'Elegí una prioridad: Urgente (Terracota), Alta (Arena), Media (Azul suave) o Baja (Salvia).',
      'Para tareas habituales (ej: limpieza semanal), activá la opción de recurrencia (Diaria, Semanal, Mensual).',
      'Marcá el checkbox para dar la tarea por completada o utilizá las pestañas "Hoy", "Próximas" o "Completadas" para filtrar.',
    ],
    tip: 'Las tareas marcadas como Urgentes se destacan automáticamente en el widget principal del Dashboard.',
    route: '/dashboard/tasks',
    routeLabel: 'Ir a Tareas →',
    keywords: ['tareas', 'quehaceres', 'prioridad', 'urgente', 'asignar', 'recurrente', 'limpieza', 'check'],
  },

  // HOGAR Y MIEMBROS
  {
    id: 'guide-household-invites',
    categoryId: 'household',
    title: 'Invitar y Gestionar Miembros del Hogar',
    summary: 'Compartir código de invitación, código QR y entender las responsabilidades de convivencia.',
    steps: [
      'Ingresá a "Miembros" o "Configuración del Hogar".',
      'Visualizá tu código de invitación único de 8 letras y números (ej: H7K29X9A).',
      'Copiá el enlace de invitación para enviarlo por WhatsApp o hacé clic en "Mostrar QR" para que la otra persona lo escanee directamente con la cámara de su celular.',
      'Una vez que el nuevo residente inicie sesión con su cuenta, quedará vinculado de inmediato al hogar.',
      'Como Owner o Admin, podés ascender miembros a Administrador o desvincularlos si ya no conviven allí.',
    ],
    tip: 'Por seguridad, los Propietarios y Administradores pueden regenerar el código de invitación en cualquier momento para invalidar accesos viejos.',
    route: '/dashboard/members',
    routeLabel: 'Administrar Miembros →',
    keywords: ['invitar', 'codigo', 'qr', 'miembros', 'unirse', 'familia', 'compartir', 'link'],
  },

  // COMPRAS E INVENTARIO
  {
    id: 'guide-shopping-lists',
    categoryId: 'shopping-inventory',
    title: 'Listas de Compras Colaborativas',
    summary: 'Crear listas por comercio o categoría y tachar artículos en tiempo real en el supermercado.',
    steps: [
      'Accedé al módulo "Compras".',
      'Seleccioná una lista existente (Supermercado, Verdulería, Farmacia, etc.) o creá una nueva lista temática.',
      'Agregá productos especificando nombre, cantidad y unidad de medida (unidades, kg, litros, paquetes).',
      'Al momento de hacer las compras, hacé clic en el círculo del ítem para tacharlo como adquirido.',
    ],
    tip: 'Cuando un artículo del Inventario se agota o cae en stock bajo, podés enviarlo a la lista de compras con un solo clic.',
    route: '/dashboard/shopping',
    routeLabel: 'Ir a Listas de Compras →',
    keywords: ['compras', 'supermercado', 'lista', 'tachar', 'alimentos', 'adquirir'],
  },
  {
    id: 'guide-inventory-stock',
    categoryId: 'shopping-inventory',
    title: 'Control de Inventario y Alertas de Vencimiento',
    summary: 'Registrar víveres y artículos del hogar con ubicación física y fecha de caducidad.',
    steps: [
      'Entrá a "Inventario" en el menú de navegación.',
      'Pulsá "Agregar artículo" e ingresá nombre, categoría (Despensa, Heladera, Limpieza) y ubicación (Alacena, Freezer).',
      'Configurá la cantidad actual, la unidad y la cantidad mínima deseada.',
      'Si se trata de alimentos o medicamentos, colocá la fecha de vencimiento.',
      'El sistema etiquetará automáticamente los ítems con advertencias de "Stock bajo" o "Por vencer".',
    ],
    tip: 'Revisá periódicamente el filtro de vencimientos para evitar el desperdicio de comida o consumir insumos vencidos.',
    route: '/dashboard/inventory',
    routeLabel: 'Gestionar Inventario →',
    keywords: ['inventario', 'stock', 'alacena', 'heladera', 'vencimiento', 'caducidad', 'despensa'],
  },

  // MANTENIMIENTO Y BÓVEDA
  {
    id: 'guide-maintenance-assets',
    categoryId: 'maintenance-docs',
    title: 'Mantenimiento Preventivo de Activos y Hogar',
    summary: 'Planificar revisiones periódicas de electrodomésticos, aire acondicionado, vehículos y plomería.',
    steps: [
      'Ingresá a "Mantenimiento".',
      'Registrá tus equipos o instalaciones (Heladera, Caldera, Aire Acondicionado, Auto, etc.) con marca y modelo.',
      'Creá un plan preventivo definiendo el intervalo de servicio en meses (ej: cada 6 meses limpieza de filtros).',
      'HomeOS calculará automáticamente la próxima fecha de revisión y marcará su estado: "Al día", "Próximo" o "Atrasado".',
      'Al realizar un servicio, registrá la fecha, el costo y notas del técnico para armar la bitácora histórica.',
    ],
    tip: 'Llevar el historial de service ayuda a conservar la garantía de los artefactos y previene gastos imprevistos.',
    route: '/dashboard/maintenance',
    routeLabel: 'Ver Mantenimiento →',
    keywords: ['mantenimiento', 'service', 'electrodomesticos', 'filtro', 'aire', 'caldera', 'garantia'],
  },
  {
    id: 'guide-documents-vault',
    categoryId: 'maintenance-docs',
    title: 'Bóveda Segura de Documentos',
    summary: 'Subir y consultar escrituras, contratos de alquiler, pólizas de seguro, facturas y manuales.',
    steps: [
      'Accedé a "Documentos".',
      'Hacé clic en "Subir documento" y seleccioná el archivo desde tu dispositivo (PDF o imágenes).',
      'Asignale un título claro y una categoría (Financieros, Legales, Garantías, Manuales, Identificación).',
      'Los documentos se almacenan cifrados en la nube de InsForge Storage del hogar.',
      'Podés previsualizarlos en pantalla o descargarlos cuando los necesites con total privacidad.',
    ],
    tip: 'Asociá las facturas de compra y certificados de garantía a cada equipo registrado en Mantenimiento.',
    route: '/dashboard/documents',
    routeLabel: 'Ir a Documentos →',
    keywords: ['documentos', 'boveda', 'archivos', 'facturas', 'garantias', 'contrato', 'seguro', 'storage'],
  },
]

export const rolePermissions: RolePermissionRow[] = [
  {
    action: 'Crear y configurar el Hogar',
    description: 'Dar de alta la residencia inicial y establecer el nombre principal.',
    owner: true,
    admin: false,
    member: false,
  },
  {
    action: 'Eliminar el Hogar definitivamente',
    description: 'Borrar permanentemente el hogar y todos sus datos asociados.',
    owner: 'Exclusivo (requiere que no queden otros miembros)',
    admin: false,
    member: false,
  },
  {
    action: 'Invitar miembros y regenerar código/QR',
    description: 'Compartir enlaces, códigos de acceso y renovar credenciales.',
    owner: true,
    admin: true,
    member: false,
  },
  {
    action: 'Promover o degradar roles',
    description: 'Ascender a un miembro a Administrador o degradarlo.',
    owner: true,
    admin: 'Solo a Members',
    member: false,
  },
  {
    action: 'Expulsar miembros del hogar',
    description: 'Remover a un residente de la cuenta compartida.',
    owner: true,
    admin: 'Solo a Members',
    member: false,
  },
  {
    action: 'Gestionar Gastos, Tareas y Compras',
    description: 'Cargar gastos, editar presupuestos, completar tareas y tachar compras.',
    owner: true,
    admin: true,
    member: true,
  },
  {
    action: 'Subir y descargar Documentos',
    description: 'Acceder a la bóveda digital y almacenar comprobantes.',
    owner: true,
    admin: true,
    member: true,
  },
  {
    action: 'Abandonar el Hogar voluntariamente',
    description: 'Desvincularse de la residencia para unirse a otra.',
    owner: 'No permitido (debe transferir o eliminar el hogar)',
    admin: true,
    member: true,
  },
]

export const troubleshootingItems: TroubleshootItem[] = [
  {
    id: 'tr-owner-leave',
    title: '¿Por qué no puedo abandonar mi propio Hogar?',
    symptom: 'Al intentar hacer clic en "Abandonar hogar", el sistema muestra un bloqueo o advertencia.',
    cause: 'Por diseño de seguridad y persistencia de datos, el Propietario (OWNER) no puede dejar un hogar huérfano si aún conviven otros miembros en él.',
    solutionSteps: [
      'Si deseás salir del hogar, primero debés remover o coordinar la salida de los demás integrantes desde "Miembros".',
      'Alternativamente, eliminá el hogar una vez que seas el único integrante restante.',
      'Si simplemente deseás cambiar de rol, asigná la administración a otro conviviente de confianza.',
    ],
    route: '/dashboard/members',
    routeLabel: 'Ver Miembros del Hogar',
    keywords: ['abandonar', 'owner', 'propietario', 'salir', 'error', 'bloqueo'],
  },
  {
    id: 'tr-invite-invalid',
    title: 'El código de invitación indica que es inválido o expiró',
    symptom: 'Un familiar intenta ingresar el código de 8 caracteres y recibe un mensaje de error.',
    cause: 'El código ingresado contiene un error tipográfico, o bien un Administrador regeneró el código del hogar, dejando sin efecto el código anterior.',
    solutionSteps: [
      'Verificá que el código no contenga espacios ni caracteres en minúscula (todos los códigos son de 8 caracteres alfanuméricos en mayúsculas).',
      'Ingresá a "Miembros" como Owner o Admin y corroborá el código vigente.',
      'Si persiste el inconveniente, pulsá "Regenerar código" y compartí el enlace fresco o el código QR directamente.',
    ],
    route: '/dashboard/members',
    routeLabel: 'Revisar Código de Invitación',
    keywords: ['codigo', 'invitacion', 'invalido', 'error', 'link', 'expirado'],
  },
  {
    id: 'tr-zero-expenses',
    title: 'Comenzó el mes y mi total de gastos aparece en $0',
    symptom: 'El indicador de gastos gastados muestra $0 a pesar de que el mes pasado se registraron compras.',
    cause: 'No se trata de un error: es el comportamiento intencional de HomeOS. Cada mes calendario funciona como un período contable independiente.',
    solutionSteps: [
      'El total de gastos del período en curso refleja exclusivamente lo consumido en el mes actual.',
      'Tus gastos del mes anterior siguen guardados intactos en la base de datos.',
      'Para consultarlos, seleccioná el mes anterior en el navegador de fechas o hacé clic en la tarjeta correspondiente en el "Historial de los últimos 6 meses".',
      'También podés descargar el reporte en PDF de cualquier mes previo desde el botón "Reporte PDF".',
    ],
    route: '/dashboard/expenses',
    routeLabel: 'Ir al Historial de Gastos',
    keywords: ['cero', 'desaparecieron', 'gastos', 'nuevo mes', 'historial', 'total'],
  },
  {
    id: 'tr-document-upload',
    title: 'Fallo al subir un documento o foto de perfil',
    symptom: 'Al seleccionar un archivo en la Bóveda de Documentos o Configuración, la carga no finaliza.',
    cause: 'El archivo excede el tamaño máximo permitido por el navegador o la conexión con el almacenamiento en la nube se interrumpió.',
    solutionSteps: [
      'Asegurate de que el archivo esté en formato PDF, PNG o JPG/JPEG.',
      'Procurá que el tamaño no supere los 10 MB por archivo.',
      'Comprobá tu conexión a internet y volvé a intentar la subida.',
    ],
    route: '/dashboard/documents',
    routeLabel: 'Ir a Documentos',
    keywords: ['subir', 'archivo', 'documento', 'foto', 'avatar', 'storage', 'error'],
  },
]

export const faqList: FAQItem[] = [
  {
    id: 'faq-privacy',
    categoryId: 'household',
    question: '¿Pueden personas fuera de mi hogar ver nuestros gastos o documentos?',
    answer: 'No. HomeOS implementa políticas estrictas de aislamiento a nivel de base de datos (Row Level Security). Solo los miembros autenticados que pertenezcan a tu hogar tienen acceso a la información compartida.',
    keywords: ['privacidad', 'seguridad', 'acceso', 'datos'],
  },
  {
    id: 'faq-multiple-households',
    categoryId: 'household',
    question: '¿Puedo pertenecer a más de un hogar al mismo tiempo?',
    answer: 'Sí. Podés tener un hogar principal (por ejemplo tu residencia familiar) y además pertenecer a otro hogar (como una casa de vacaciones o departamento compartido). Podés alternar entre hogares activos desde el selector superior.',
    keywords: ['varios hogares', 'cambiar', 'multiple', 'residencia'],
  },
  {
    id: 'faq-currency',
    categoryId: 'finances',
    question: '¿Qué formato de moneda utiliza el módulo de Finanzas?',
    answer: 'El sistema formatea los valores numéricos con separador de miles bajo el estándar local ($ 150.000). Podés ingresar cualquier valor numérico sin signos ni puntos, y el sistema lo adaptará automáticamente.',
    keywords: ['moneda', 'pesos', 'dolar', 'formato'],
  },
  {
    id: 'faq-dark-mode',
    categoryId: 'household',
    question: '¿Cómo cambio entre el modo Claro y el modo Oscuro?',
    answer: 'Podés cambiar el tema en cualquier momento desde la barra superior pulsando el botón del sol/luna, o desde la sección "Configuración" eligiendo entre Claro, Oscuro o según la preferencia del Sistema.',
    keywords: ['tema', 'oscuro', 'claro', 'dark mode'],
  },
]

export const keyboardShortcuts: KeyboardShortcut[] = [
  { combo: '⌘K  o  Ctrl + K', description: 'Abrir paleta de comandos rápidos para navegar entre módulos' },
  { combo: 'Esc', description: 'Cerrar cajones laterales, modales de carga y menús desplegables' },
  { combo: 'Tab / Shift + Tab', description: 'Navegar de forma accesible entre campos de formulario y botones' },
]
