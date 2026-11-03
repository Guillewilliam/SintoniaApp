# Sintonía — Preguntas para Parejas y Amigos (PWA)
> Aplicación web progresiva (PWA) instalable inspirada en el concepto de *Note It* y aplicaciones de preguntas para parejas y amigos, con sincronización en tiempo real y respuestas privadas protegidas.

---

## 🌟 Visión del Proyecto

**Sintonía** permite crear una cuenta personal, conectarse con diferentes personas mediante códigos de invitación de alta entropía, seleccionar categorías temáticas e intensidades de preguntas y responderlas desde diferentes dispositivos en tiempo real.

Cada conexión funciona de forma **100% independiente**: un usuario puede mantener simultáneamente conexiones con su pareja y dos amigos por separado. Cada conexión tiene sus propias preferencias, sesiones de juego, respuestas e historial privado.

### Principales características
- 📲 **Instalación desde la pantalla inicial:** Botón destacado «Instalar APP» en la primera pantalla, disponible antes de iniciar sesión o registrarse, con soporte para el evento nativo `beforeinstallprompt` y guía visual paso a paso para Safari en iOS / iPad.
- 🔒 **Respuestas con protección real (Server-Side Concealment):** La ocultación de respuestas no es solo visual. Las reglas de seguridad de Cloud Firestore (`firestore.rules`) bloquean la lectura de la respuesta del compañero en la base de datos hasta que ambos hayan respondido.
- 📧 **Unicidad de cuentas por correo electrónico:** Firebase Authentication actúa como fuente de verdad para evitar cuentas duplicadas y ataques de suplantación.
- ✉️ **Verificación obligatoria de correo:** Pantalla de bloqueo tras el registro con reenvío limitado y comprobación del estado antes de permitir el acceso a las funciones sociales.
- 🔑 **Conexiones independientes mediante códigos:** Códigos de alta entropía (`SINT-XXXXX`), de un solo uso, revocables, con caducidad configurable y prevención de auto-conexión o conexiones duplicadas.
- 🎨 **10 Categorías y 3 Niveles de Intensidad:** Pareja, Amistad, Diversión, Personalidad, Profundas, Picante (18+ consentido), Secretos, Dilemas, Cultura Pop y Aleatorias; en niveles Suave, Normal y Profunda.
- ⚡ **0 € de coste:** Diseñada íntegramente sobre las cuotas gratuitas de Firebase (Plan Spark) y Render Static Sites. Sin APIs de pago en tiempo de ejecución, sin Cloud Functions de pago ni servidores de pago.

---

## 🛠️ Tecnologías

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4.
- **Iconografía y Animaciones:** Lucide React, Canvas Confetti.
- **PWA:** `vite-plugin-pwa`, Web App Manifest, Service Worker con Workbox y caché offline para assets estáticos.
- **Backend & Datos:** Firebase Authentication, Cloud Firestore con listeners en tiempo real (`onSnapshot`).
- **Seguridad:** Cloud Firestore Security Rules restrictivas.
- **Alojamiento:** Render Static Sites con certificado SSL/HTTPS automático y archivo `_redirects` para SPA.

---

## 📁 Estructura del Código

```
conexiones-pwa/
├── public/
│   ├── icons/                 # Iconos PWA (192x192, 512x512, maskable)
│   ├── _redirects             # Regla SPA para Render Static Sites (/* /index.html 200)
│   ├── apple-touch-icon.png   # Icono para iOS Safari (180x180)
│   ├── favicon.ico            # Favicon del navegador
│   └── logo.png               # Logotipo de alta resolución
├── src/
│   ├── components/            # Componentes reutilizables
│   │   ├── InstallAppButton.tsx     # Botón y modal de instalación PWA (iOS/Android/Desktop)
│   │   ├── Navbar.tsx               # Barra superior con logo, estado de red y perfil
│   │   ├── OfflineBanner.tsx        # Aviso interactivo de pérdida de conexión
│   │   ├── FirebaseStatusBanner.tsx # Indicador y guía modal de configuración Firebase
│   │   ├── CreateInviteModal.tsx    # Generador de códigos únicos con compartir nativo
│   │   ├── EnterCodeModal.tsx       # Validador de códigos y confirmación de conexión
│   │   └── UserProfileModal.tsx     # Edición de perfil, avatares y eliminación de cuenta
│   ├── data/
│   │   └── questions.ts       # Banco inicial estructurado con 10 categorías y 3 intensidades
│   ├── firebase/
│   │   └── config.ts          # Inicialización del SDK de Firebase y modo Sandbox
│   ├── pages/
│   │   ├── AuthScreen.tsx           # Pantalla inicial con Login, Registro, Recuperación e Instalación
│   │   ├── VerifyEmailScreen.tsx    # Pantalla de verificación de correo electrónico
│   │   ├── DashboardScreen.tsx      # Panel principal con conexiones y pregunta del día
│   │   ├── SessionGameScreen.tsx    # Motor de preguntas en tiempo real y revelación
│   │   └── ConnectionProfileScreen.tsx # Historial compartido y preferencias de conexión
│   ├── services/
│   │   ├── authService.ts           # Servicios de identidad, sesión y unicidad de correo
│   │   ├── connectionService.ts     # Creación, validación y gestión de conexiones 1 a 1
│   │   └── sessionService.ts        # Motor de turnos, sincronización y guardado de respuestas
│   ├── types/
│   │   └── index.ts                 # Definiciones e interfaces de TypeScript
│   ├── App.tsx                # Enrutador principal y control de estado reactivo
│   ├── index.css              # Estilos base Tailwind v4 y clases de glassmorphism
│   └── main.tsx               # Punto de entrada de React y montaje en DOM
├── scripts/
│   ├── generate-icons.js      # Generador de iconos PWA mediante Sharp
│   └── test-flows.js          # Batería de pruebas automatizadas unitarias e integración
├── firestore.rules            # Reglas de seguridad restrictivas para Cloud Firestore
├── render.yaml                # Especificación declarativa de despliegue en Render
├── .env.example               # Plantilla de variables de entorno de Firebase
├── FIREBASE_SETUP.md          # Guía detallada paso a paso para configurar Firebase (0 €)
├── RENDER_DEPLOY.md           # Guía detallada paso a paso para publicar en Render (0 €)
└── package.json               # Dependencias y scripts de construcción
```

---

## 🚀 Cómo Ejecutar en Local

### 1. Clonar o abrir la carpeta del proyecto
```bash
cd C:\Users\Guill\.gemini\antigravity-ide\scratch\conexiones-pwa
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
```
Abre tu navegador en [http://localhost:5173/](http://localhost:5173/).

> **Nota sobre el Modo Sandbox:**
> Si aún no has introducido las claves de Firebase en el archivo `.env`, la aplicación se iniciará automáticamente en **Modo Sandbox interactivo**, permitiéndote probar la pantalla inicial, el registro, la verificación de correo, la generación de códigos de invitación y las sesiones de juego directamente en tu navegador.

---

## 🧪 Ejecutar la Batería de Pruebas Automatizadas

El proyecto incluye un script de pruebas automatizadas que valida los requisitos esenciales de la memoria:
```bash
node --experimental-strip-types scripts/test-flows.js
```

### Pruebas validadas:
1. **Banco de Preguntas:** Existencia de las 10 categorías, las 3 intensidades y función de selección/aleatorización.
2. **Archivos de Despliegue en Render y PWA:** Existencia de `public/_redirects` (`/* /index.html 200`), `render.yaml`, bundle de producción `dist/index.html`, manifest `dist/manifest.webmanifest`, service worker `dist/sw.js` e iconos en todos los tamaños.
3. **Reglas de Seguridad Firestore:** Verificación de la regla que impide leer respuestas ajenas hasta que `turnStatus == 'revealed'`, restricción por participante y prevención de auto-conexión.
4. **Entropía de Códigos:** Formato y entropía para evitar colisiones (`SINT-XXXXX`).

---

## 📖 Guías de Despliegue y Configuración

- Para conectar Firebase con coste 0 € (Plan Spark): Consulta [FIREBASE_SETUP.md](file:///C:/Users/Guill/.gemini/antigravity-ide/scratch/conexiones-pwa/FIREBASE_SETUP.md).
- Para subir a GitHub y desplegar en Render con SSL gratis: Consulta [RENDER_DEPLOY.md](file:///C:/Users/Guill/.gemini/antigravity-ide/scratch/conexiones-pwa/RENDER_DEPLOY.md).
#   S i n t o n i a A p p  
 