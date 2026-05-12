# HomeOS - Plan de Ejecución (Mini ERP Familiar)

## OBJETIVO DEL PROYECTO
Crear una plataforma práctica de gestión del hogar para uso diario, optimizada para el plan gratuito de **InsForge**. Priorizar una arquitectura liviana y el uso eficiente del backend.

## TECH STACK
* **Frontend**: Next.js
* **Backend**: InsForge
* **Base de Datos**: InsForge PostgreSQL
* **Autenticación**: InsForge Auth
* **Almacenamiento**: InsForge Storage
* **Tiempo Real**: InsForge Realtime
* **Funciones**: InsForge Edge Functions

## REGLAS DE DESARROLLO
1. Construir este proyecto en **fases**.
2. Completar una fase totalmente antes de pasar a la siguiente.
3. **NO** saltarse fases.
4. Después de cada fase, el agente debe detenerse y esperar confirmación del usuario.

**Para cada fase:**
1. Explicar brevemente las decisiones de arquitectura.
2. Generar esquema/migraciones usando CLI de InsForge.
3. Implementar lógica de backend.
4. Implementar UI en el frontend.
5. Conectar todo.
6. Proveer una checklist de pruebas.

---

## FASE 1: FUNDACIÓN DEL PROYECTO (Completada)
1. Inicializar estructura del proyecto Next.js.
2. Configurar cliente/SDK de InsForge (`@insforge/sdk`).
3. Configurar autenticación:
   * Registro/login con email y contraseña.
   * Rutas protegidas.
   * Persistencia de sesión.
4. Crear layout base responsivo:
   * Navegación lateral (Sidebar).
   * Barra superior del dashboard.
5. Implementar página de perfil/configuración de usuario.

## FASE 2: SISTEMA DE HOGARES (Completada)
1. Crear esquema:
   * `users`
   * `households`
   * `household_members`
2. Funcionalidades:
   * Crear hogar.
   * Unirse a un hogar mediante código/enlace de invitación.
   * Abandonar hogar.
3. Implementar roles:
   * Propietario (Owner).
   * Administrador (Admin).
   * Miembro (Member).
4. Agregar verificaciones de permisos (RLS y políticas).

## FASE 3: GESTIÓN DE TAREAS (En Proceso)
1. Esquema de tareas:
   * `title`, `description`, `due_date`, `priority`, `assigned_member`, `status`, `recurrence`.
2. Construir vistas de tareas:
   * Hoy (Today).
   * Próximas (Upcoming).
   * Completadas (Completed).
3. Sincronización en tiempo real.
4. Automatizar tareas recurrentes.

## FASE 4: LISTAS DE COMPRAS
1. Crear esquema para listas de compras.
2. Funcionalidades:
   * Múltiples listas.
   * Cantidad y categorías.
   * Estado de compra (comprado/no comprado).
   * Comprador asignado.
3. Colaboración en tiempo real.
4. Optimizar experiencia de usuario (UX) en móviles.

## FASE 5: GASTOS Y PRESUPUESTOS
1. Esquema:
   * `expenses`
   * `budgets`
   * `expense_categories`
2. Funcionalidades:
   * Agregar gastos.
   * Asignar quién paga.
   * Dividir gastos.
   * Presupuestos mensuales.
   * Analíticas de gastos.

## FASE 6: INVENTARIO
1. Esquema de inventario:
   * `item_name`, `quantity`, `unit`, `expiration_date`, `location`, `min_threshold`.
2. Alertas de bajo stock.
3. Flujo de trabajo "Mover a la lista de compras".

## FASE 7: MANTENIMIENTO
1. Esquema de mantenimiento:
   * `title`, `asset`, `frequency`, `last_completed`, `next_due`.
2. Automatizar programación de fechas de vencimiento.
3. Mostrar alertas en el dashboard.

## FASE 8: ALMACENAMIENTO DE DOCUMENTOS
1. Buckets de almacenamiento para:
   * Recibos/Facturas.
   * Garantías.
   * Contratos.
   * Documentos del hogar.
2. Soporte para subir/descargar/eliminar.
3. Vincular documentos a registros relacionados.

## FASE 9: DASHBOARD
1. Widgets:
   * Tareas para hoy.
   * Próximos gastos.
   * Progreso del presupuesto.
   * Alertas de inventario.
   * Recordatorios de mantenimiento.
2. Gráficos y analíticas resumidas.

## FASE 10: PULIDO (POLISH)
1. Estados de carga/error (Loading/error states).
2. Validación de formularios.
3. UI Optimista (Optimistic UI).
4. Responsividad móvil.
5. Estados vacíos/Onboarding (Empty states).
6. Refactorización para mantenibilidad.

---

## REQUISITOS DE BASE DE DATOS
* Esquema relacional normalizado.
* Llaves foráneas (Foreign keys).
* Índices adecuados.
* Borrado lógico (Soft deletes) donde sea útil.
* Marcas de tiempo `created_at` / `updated_at`.

## RESTRICCIONES DE RENDIMIENTO (OPTIMIZAR PARA FREE TIER)
* Minimizar el uso de almacenamiento.
* Evitar polling innecesario.
* Usar realtime solo cuando aporte valor.
* Paginar listas largas.
* Optimizar consultas a la base de datos.
