# 💻 Sistema de Gestión IT y Servicios Técnicos (COMPUDOCTOR)

Sistema web integral de gestión operativa, comercial, técnica y de inventario diseñado para talleres de soporte técnico, servicio informático y venta de productos de computación y tecnología.

---

## 📋 Tabla de Contenidos

- [Descripción del Proyecto](#-descripción-del-proyecto)
- [Características Principales](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Librerías y Dependencias](#-librerías-y-dependencias)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Configuración de Base de Datos (XAMPP / Laragon)](#-configuración-de-base-de-datos-xampp--laragon)
- [Variables de Entorno (.env)](#-variables-de-entorno-env)
- [Instalación y Ejecución con Node.js y pnpm](#-instalación-y-ejecución-con-nodejs-y-pnpm)
- [Endpoints de la API](#-endpoints-de-la-api)
- [Seguridad y Flujos Especiales](#-seguridad-y-flujos-especiales)

---

## 📖 Descripción del Proyecto

El **Sistema de Gestión IT** es una solución Full-Stack orientada a optimizar y centralizar los procesos diarios de un negocio tecnológico:

1. **Gestión Comercial y POS**: Registro rápido de ventas de productos con emisión de comprobantes y control de métodos de pago (Efectivo, Yape, Plin, Transferencia, Tarjeta).
2. **Servicio Técnico y Taller**: Control del ciclo de vida de órdenes de servicio (Recepción, En Revisión, Reparado, Entregado) con gestión de adelantos y estados de pago.
3. **Control de Inventario**: Catálogo de productos organizado por categorías, control de stock mínimo, alertas de desabastecimiento e historial de movimientos.
4. **Cotizaciones B2B / B2C**: Módulo de proformas para clientes particulares y empresas, con cálculo automático y exportación en formato PDF.
5. **Inteligencia Artificial Proactiva**: Chatbot asistente (**COMPU-BOT**) integrado con **Google Gemini**, capaz de consultar el inventario, servicios y estadísticas de ventas en tiempo real mediante *Function Calling*.
6. **Métricas y Reportes**: Dashboard gerencial con gráficos interactivos y generación de reportes mensuales y personalizados en PDF y Excel.

---

## ✨ Características Principales

- 🔐 **Autenticación y Seguridad**: Registro de usuarios con flujo de aprobación obligatoria por correo por parte del Administrador, y recuperación de contraseña vía código OTP de 6 dígitos.
- 📦 **Inventario Dinámico**: Generación automática de códigos internos por categoría, alerta visual de stock bajo y registro de movimientos de entrada/salida.
- 🛠️ **Taller de Reparaciones**: Seguimiento de dispositivos, diagnóstico de fallas, registro de pagos a cuenta/cancelados y entrega de equipos.
- 📄 **Generador de Reportes PDF/Excel**: Reportes de cierre mensual, balances contables y reportes por rango de fechas descargables al instante.
- 🤖 **COMPU-BOT (Gemini AI)**: Asistente virtual conectado a la base de datos que responde consultas sobre stock crítico, servicios pendientes y métricas de venta.
- 📜 **Auditoría de Acciones**: Registro de auditoría para trazabilidad de operaciones críticas realizadas por los trabajadores.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend** | **React 19** + **Vite** | SPA reactiva, moderna y ultra rápida construida con JSX. |
| **Enrutamiento** | **React Router v7** | Gestión de rutas públicas y privadas protegidas por contexto de sesión. |
| **Backend** | **Node.js** + **Express 5** | Servidor RESTful modular, seguro y escalable. |
| **Base de Datos** | **MySQL / MariaDB** | Base de datos relacional con claves foráneas, integridad referencial y transacciones ACID. |
| **Inteligencia Artificial** | **Google Gemini AI SDK** | Integración con el modelo `gemini-2.5-flash` mediante herramientas y *Function Calling*. |
| **Manejo de Correos** | **Nodemailer** | Envío de notificaciones HTML de aprobación, alertas de seguridad y códigos OTP. |
| **Gestor de Paquetes** | **pnpm** (soporta npm / yarn) | Gestión eficiente y rápida de dependencias en monorepo. |

---

## 📚 Librerías y Dependencias

### 🖥️ Frontend (`/frontend`)

| Librería | Versión | Propósito / Uso |
| :--- | :--- | :--- |
| `react` / `react-dom` | `^19.2.6` | Biblioteca base para la construcción de interfaces de usuario. |
| `react-router-dom` | `^7.15.1` | Manejo de navegación, rutas anidadas y protección de vistas. |
| `axios` | `^1.16.1` | Cliente HTTP basado en promesas para consumir la API del backend. |
| `recharts` | `^3.8.1` | Gráficos estadísticos interactivos (barras, líneas, áreas) en el Dashboard y Analíticas. |
| `jspdf` | `^4.2.1` | Creación y renderizado dinámico de documentos PDF en el navegador. |
| `jspdf-autotable` | `^5.0.8` | Plugin para generar tablas estilizadas y paginadas dentro de los reportes PDF. |
| `xlsx` (SheetJS) | `^0.18.5` | Exportación e importación de datos en formato de hojas de cálculo de Excel (.xlsx). |
| `react-icons` | `^5.6.0` | Paquete de iconos vectoriales para toda la interfaz (FontAwesome, Material Icons, etc.). |
| `react-markdown` | `^10.1.0` | Renderizado seguro de respuestas en formato Markdown generadas por el chatbot de IA. |
| `vite` | `^8.0.16` | Bundler y servidor de desarrollo ultrarrápido con Hot Module Replacement (HMR). |

### ⚙️ Backend (`/backend`)

| Librería | Versión | Propósito / Uso |
| :--- | :--- | :--- |
| `express` | `^5.2.1` | Framework web para la creación de rutas, controladores y middlewares. |
| `mysql2` | `^3.22.3` | Driver de conexión a MySQL con soporte para pools de conexiones y promesas (`async/await`). |
| `@google/generative-ai` | `^0.24.1` | SDK oficial de Google para interactuar con la API de Gemini (Chatbot y Function Calling). |
| `nodemailer` | `^8.0.7` | Servicio de envío de correos electrónicos vía SMTP (Gmail) con plantillas HTML. |
| `bcryptjs` | `^3.0.3` | Encriptación y hashing seguro de contraseñas de usuarios. |
| `cors` | `^2.8.6` | Middleware para permitir peticiones cruzadas (Cross-Origin Resource Sharing) desde el Frontend. |
| `dotenv` | `^17.4.2` | Carga de variables de entorno desde el archivo `.env` a `process.env`. |
| `nodemon` | `^3.1.14` | Herramienta de desarrollo que reinicia el servidor automáticamente ante cambios en el código. |

---

## 📂 Estructura del Proyecto

```text
sistema-gestion-it/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # Configuración del pool de conexión a MySQL
│   │   ├── controllers/              # Lógica de negocio y controladores REST
│   │   │   ├── adminController.js     # Aprobación y gestión de trabajadores
│   │   │   ├── aiController.js        # Integración con Google Gemini y Function Calling
│   │   │   ├── analiticaController.js # Métricas y consolidación de ingresos
│   │   │   ├── authController.js      # Login, registro, OTP y recuperación de clave
│   │   │   ├── categoriaController.js # CRUD de categorías y prefijos
│   │   │   ├── cotizacionController.js# Creación y consulta de cotizaciones B2B/B2C
│   │   │   ├── dashboardController.js # Datos para métricas rápidas del Dashboard
│   │   │   ├── productoController.js  # CRUD de inventario, stock y códigos
│   │   │   ├── servicioController.js  # Registro y control de servicios de taller
│   │   │   ├── usuarioController.js   # Perfil de usuario y cambio de credenciales
│   │   │   └── ventaController.js     # Transacciones de venta y detalle POS
│   │   ├── middlewares/
│   │   │   └── verificarEstado.js    # Control de usuarios activos/aprobados
│   │   ├── models/
│   │   │   ├── database_schema.sql    # Script SQL maestro con tablas y relaciones
│   │   │   └── auth_schema.sql        # Estructura referencial de autenticación
│   │   ├── routes/                   # Definición de endpoints de Express
│   │   │   ├── adminRoutes.js
│   │   │   ├── aiRoutes.js
│   │   │   ├── analiticaRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── categoriaRoutes.js
│   │   │   ├── cotizacionRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── productoRoutes.js
│   │   │   ├── servicioRoutes.js
│   │   │   ├── usuarioRoutes.js
│   │   │   └── ventaRoutes.js
│   │   ├── services/                 # Servicios auxiliares
│   │   │   ├── auditoriaService.js   # Registro de acciones en tabla auditoria
│   │   │   ├── emailServices.js      # Plantillas y envío con Nodemailer
│   │   │   ├── pdfServices.js        # Generación de comprobantes
│   │   │   └── reporteServices.js    # Generación de reportes PDF mensuales/personalizados
│   │   └── app.js                    # Punto de entrada y montaje de la API Express
│   ├── .env                          # Variables de entorno del backend
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── assets/                   # Imágenes, logotipos e iconos
│   │   ├── components/               # Componentes reutilizables
│   │   │   ├── chatbot/              # Chatbot COMPU-BOT (interfaz y lógica de mensajes)
│   │   │   ├── inventario/           # Modales y formularios de productos
│   │   │   ├── layout/               # Sidebar lateral, Topbar y contenedor base
│   │   │   └── servicios/            # Formularios de recepción técnica
│   │   ├── context/                  # Estados globales (AuthContext, ToastContext)
│   │   ├── css/                      # Hojas de estilo modulares por página
│   │   ├── pages/                    # Vistas principales del sistema
│   │   │   ├── auth/                 # Login, Registro, Recuperación de clave
│   │   │   ├── AdminPanel.jsx        # Panel de administración de usuarios y auditoría
│   │   │   ├── Analiticas.jsx        # Reportes gráficos y exportación
│   │   │   ├── Cotizaciones.jsx      # Generador de proformas B2C y B2B
│   │   │   ├── Dashboard.jsx         # Panel principal con resumen del día/mes
│   │   │   ├── HistorialVentas.jsx   # Histórico y reimpresión de comprobantes
│   │   │   ├── Inventario.jsx        # Catálogo y control de stock de productos
│   │   │   ├── PerfilTrabajador.jsx  # Configuración de cuenta y seguridad
│   │   │   ├── PuntoVenta.jsx        # Terminal Punto de Venta (POS)
│   │   │   └── Servicios.jsx         # Taller y control de reparaciones
│   │   ├── App.jsx                   # Router principal con rutas públicas y privadas
│   │   └── main.jsx                  # Entrada React DOM con providers
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── package.json                      # Scripts globales para ejecución simultánea
└── pnpm-workspace.yaml
```

---

## 💻 Requisitos Previos

Asegúrate de contar con los siguientes elementos instalados en tu computadora:

1. **Node.js**: Versión `18.x` o superior (se recomienda Node.js LTS `20.x` o `22.x`).
   - Puedes verificarlo con: `node -v`
2. **pnpm** (Recomendado):
   - Instálalo globalmente ejecutando:
     ```bash
     npm install -g pnpm
     ```
   - O confirma su instalación con: `pnpm -v`
3. **Servidor Local de Base de Datos**:
   - **Laragon** (Recomendado en Windows) o **XAMPP**.

---

## 🗄️ Configuración de Base de Datos (XAMPP / Laragon)

El sistema utiliza **MySQL** como motor de persistencia relacional.

### Opción 1: Con Laragon (Recomendado)

1. Abre **Laragon** y pulsa el botón **"Start All"** (o inicia el servicio **MySQL**).
2. Haz clic derecho en Laragon > **MySQL** > **HeidiSQL** (o abre tu navegador en `http://localhost/phpmyadmin` si lo tienes habilitado).
3. Crea la base de datos ejecutando la siguiente sentencia SQL:
   ```sql
   CREATE DATABASE IF NOT EXISTS sistema_it_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE sistema_it_db;
   ```
4. Abre y ejecuta el archivo de esquema ubicado en:
   - `backend/src/models/database_schema.sql`
5. *(Opcional)* Si deseas insertar un administrador de prueba inicial o categorías base, puedes agregarlos directamente en sus respectivas tablas.

---

### Opción 2: Con XAMPP

1. Abre el **XAMPP Control Panel**.
2. En la fila **MySQL**, haz clic en el botón **Start**.
3. Abre tu navegador web e ingresa a **phpMyAdmin**:
   ```text
   http://localhost/phpmyadmin
   ```
4. En el panel izquierdo, haz clic en **"Nueva"** (New):
   - **Nombre de la base de datos**: `sistema_it_db`
   - **Cotejamiento**: `utf8mb4_unicode_ci` o `utf8mb4_general_ci`
   - Haz clic en **Crear**.
5. Con la base de datos `sistema_it_db` seleccionada, ve a la pestaña **Importar** (Import).
6. Haz clic en **Seleccionar archivo** y busca en tu proyecto el archivo:
   ```text
   backend/src/models/database_schema.sql
   ```
7. Desplázate hacia abajo y haz clic en **Importar** / **Continuar**.

> [!NOTE]
> Las credenciales por defecto en **Laragon** y **XAMPP** son:
> - **Host**: `127.0.0.1` o `localhost`
> - **Puerto**: `3306`
> - **Usuario**: `root`
> - **Contraseña**: *(vacía / sin contraseña)*

---

## 🔑 Variables de Entorno (.env)

Crea o edita el archivo `.env` dentro de la carpeta `backend/` (`backend/.env`):

```env
# Puerto donde corre el backend Express
PORT=4000

# Conexión a Base de Datos MySQL (XAMPP / Laragon)
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=sistema_it_db

# Configuración de Correos (Nodemailer vía Gmail)
EMAIL_MESSENGER=tu_correo_emisor@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion_gmail
EMAIL_ADMIN=correo_del_administrador@gmail.com

# API KEY para el Chatbot con Google Gemini
GEMINI_API_KEY=tu_api_key_de_google_ai_studio
```

> [!IMPORTANT]
> - Para el campo `EMAIL_PASS`, debes usar una **Contraseña de Aplicación** generada desde tu cuenta de Google (Seguridad > Verificación en 2 pasos > Contraseñas de aplicaciones), no tu contraseña personal de Gmail.
> - Para `GEMINI_API_KEY`, obtén una clave gratuita en [Google AI Studio](https://aistudio.google.com/).

---

## 🚀 Instalación y Ejecución con Node.js y pnpm

### 1. Clonar el Repositorio

```bash
git clone https://github.com/LuisCarranzax/Sistema-Inventario.git
cd Sistema-Inventario
```

---

### 2. Instalar Dependencias con `pnpm`

Puedes instalar las dependencias de cada subproyecto de manera independiente:

#### Instalar Backend:
```bash
cd backend
pnpm install
cd ..
```

#### Instalar Frontend:
```bash
cd frontend
pnpm install
cd ..
```

#### Instalar Dependencias de la Raíz (para ejecución concurrente):
```bash
pnpm install
```

---

### 3. Ejecución del Proyecto

#### Método A: Ejecutar todo con un solo comando desde la raíz (Recomendado)

Desde la raíz del proyecto ejecuta:

```bash
pnpm dev
```

Este comando utiliza `concurrently` para levantar simultáneamente el servidor backend en el puerto `4000` y el cliente frontend Vite en el puerto `5173`.

---

#### Método B: Ejecutar en terminales separadas

**Terminal 1 (Backend):**
```bash
cd backend
pnpm dev
```
> El servidor backend iniciará en: `http://localhost:4000`

**Terminal 2 (Frontend):**
```bash
cd frontend
pnpm dev
```
> La aplicación frontend estará disponible en: `http://localhost:5173`

---

### 4. Compilación para Producción (Frontend)

Para generar los archivos estáticos listos para producción:

```bash
cd frontend
pnpm build
```

Para previsualizar el build de producción localmente:

```bash
pnpm preview
```

---

## 📡 Endpoints de la API

La API REST responde en el prefijo base `http://localhost:4000/api`:

| Módulo | Endpoint Base | Descripción |
| :--- | :--- | :--- |
| **Autenticación** | `/api/auth` | Login, Registro, Solicitud y Validación de códigos OTP, Aprobación/Rechazo de usuarios. |
| **Inventario** | `/api/productos` | CRUD de productos, control de stock, alerta de productos agotados y movimientos. |
| **Categorías** | `/api/categorias` | Listado y creación de categorías de productos y sus prefijos. |
| **Servicios Técnicos** | `/api/servicios` | Registro de reparaciones, cambios de estado, pagos a cuenta y entregas. |
| **Ventas / POS** | `/api/ventas` | Registro de ventas con detalle transaccional y consulta de historial. |
| **Cotizaciones** | `/api/cotizaciones` | Generación y listado de cotizaciones/proformas para clientes B2C y B2B. |
| **Dashboard** | `/api/dashboard` | Métricas resumidas, ingresos diarios, productos más vendidos y servicios activos. |
| **Analíticas** | `/api/analiticas` | Métricas contables consolidadas e históricos para reportes. |
| **Administración** | `/api/admin` | Panel administrativo para gestión de accesos, auditoría y trabajadores. |
| **Usuarios** | `/api/usuarios` | Consulta de perfil, actualización de datos y cambio seguro de correo. |
| **Asistente IA** | `/api/ia` | Endpoint del chatbot (**COMPU-BOT**) con Function Calling para consultar la BD. |

---

## 🔒 Seguridad y Flujos Especiales

1. **Aprobación de Cuentas por Correo**: Cuando un nuevo trabajador se registra, su cuenta queda en estado `pendiente`. El sistema envía un correo al Administrador con botones interactivos para **Aprobar** o **Rechazar** la solicitud.
2. **Cambio de Contraseña y Correo con OTP**: Al solicitar un cambio de contraseña o actualización de correo electrónico, se genera un código de un solo uso (OTP de 6 dígitos) con validez temporal de 15 minutos.
3. **Protección de Datos en la IA**: El asistente virtual (**COMPU-BOT**) tiene reglas estrictas en su *System Instruction* para no exponer información sensible como contraseñas, hashes, usuarios o registros de auditoría.
4. **Transacciones Seguras**: Las ventas y cotizaciones se procesan bajo transacciones SQL (`connection.beginTransaction()`) garantizando consistencia total entre cabeceras y detalles.

---

## 👨‍💻 Autor y Soporte

- **Proyecto**: Sistema de Gestión IT (COMPUDOCTOR)
- **Repositorio**: [GitHub - LuisCarranzax/Sistema-Inventario](https://github.com/LuisCarranzax/Sistema-Inventario)
- **Reporte de Problemas**: [Issues en GitHub](https://github.com/LuisCarranzax/Sistema-Inventario/issues)
