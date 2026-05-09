# 🏠 HomeOS - Mini ERP Familiar


HomeOS no es solo otra aplicación de tareas. Es un ecosistema diseñado bajo principios de **Arquitectura Limpia** y **Multi-tenancy**, optimizado para ejecutarse de forma eficiente sobre el plan gratuito de **InsForge**. Aquí no se trata de "picar código", se trata de construir una solución escalable y mantenible.

---

## 🚀 Tech Stack (Modern & Robust)

*   **Core**: [Next.js 15.1](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
*   **Backend as a Service**: [InsForge SDK](https://insforge.com/) (Auth, DB, Realtime, Storage, Functions)
*   **Validación**: [Zod](https://zod.dev/) (Type-safe schemas)
*   **Estilos**: [Tailwind CSS 3.4](https://tailwindcss.com/) (Atomic Design principles)
*   **Iconografía**: [Lucide React](https://lucide.dev/)
*   **Lenguaje**: [TypeScript](https://www.typescriptlang.org/) (Strict mode)

---

## ✨ Características Principales

*   **🔐 Autenticación Segura**: Flujo completo de registro, inicio de sesión y verificación de email mediante OTP.
*   **🏠 Sistema de Hogares (Multi-tenancy)**: Aislamiento total de datos. Un usuario puede crear un hogar o unirse a uno existente mediante códigos de invitación o QR.
*   **👥 Roles y Permisos**: Implementación de RLS (Row Level Security) para distinguir entre Propietarios, Administradores y Miembros.
*   **🌗 Interfaz Premium**: Modo oscuro/claro persistente con transiciones suaves y layout responsivo.
*   **⚡ Tiempo Real**: Sincronización instantánea de datos entre miembros del hogar.

---

## 🏗️ Estructura del Proyecto

```text
src/
├── app/            # Rutas y layouts (Next.js App Router)
├── components/     # Componentes de UI (Atómicos y Moleculares)
├── lib/            # Contextos, Clientes y Configuraciones (Core Logic)
├── services/       # Lógica de comunicación con el backend (Data Access Layer)
└── validations/    # Esquemas de Zod para integridad de datos
```

---

## 🛠️ Configuración e Instalación

1.  **Clonar el repositorio**:
    ```bash
    git clone <url-del-repo>
    cd Erp_Personal
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno**:
    Crea un archivo `.env` en la raíz con tus credenciales de InsForge:
    ```env
    NEXT_PUBLIC_INSFORGE_URL=URL_DE_INSFORGE
    NEXT_PUBLIC_INSFORGE_ANON_KEY=TU_ANON_KEY
    ```

4.  **Correr en desarrollo**:
    ```bash
    npm run dev
    ```

---

## 📈 Plan de Ejecución (Fases)

Este proyecto se desarrolla bajo una metodología de **entrega por fases**, garantizando que cada pieza del rompecabezas encaje perfectamente antes de avanzar.

- [x] **Fase 1**: Fundación, Auth y Layout Base.
- [/] **Fase 2**: Sistema de Hogares e Invitaciones (En progreso).
- [ ] **Fase 3**: Gestión de Tareas y Recurrencias.
- [ ] **Fase 4**: Listas de Compras Colaborativas.
- [ ] **Fase 5**: Gastos, Presupuestos y Analíticas.
- [ ] ... *Ver `plan.md` para el detalle completo.*

