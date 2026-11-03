# Guía de Despliegue en Render Static Sites (0 € de coste)
## Publicación de Sintonía PWA con SSL Gratuito y Dominio HTTPS

Esta guía explica cómo subir el proyecto a GitHub y publicarlo en **Render Static Sites** con coste 0 €.

---

## 1. Crear el Repositorio en GitHub

1. Entra en [github.com](https://github.com) e inicia sesión.
2. Haz clic en el botón verde **«New»** (Nuevo repositorio).
3. Configuración del repositorio:
   - **Repository name**: `sintonia-pwa` (o el nombre que prefieras).
   - **Visibility**: Elige **Public** o **Private** (Render soporta ambos gratuitamente).
   - Deja desmarcadas las opciones de inicializar con README o .gitignore (ya los tenemos creados).
4. Pulsa en **«Create repository»**.

---

## 2. Subir el Código desde tu Ordenador

Abre una terminal PowerShell en la carpeta del proyecto (`C:\Users\Guill\.gemini\antigravity-ide\scratch\conexiones-pwa`) y ejecuta los siguientes comandos:

```bash
# 1. Inicializar git si aún no está inicializado
git init

# 2. Añadir todos los archivos
git add .

# 3. Crear el primer commit
git commit -m "Initial commit: Sintonía PWA lista para producción"

# 4. Asegurar que la rama principal se llama main
git branch -M main

# 5. Vincular con tu repositorio de GitHub (sustituye TU_USUARIO y TU_REPO)
git remote add origin https://github.com/TU_USUARIO/sintonia-pwa.git

# 6. Subir el código a GitHub
git push -u origin main
```

---

## 3. Crear el Static Site en Render (render.com)

1. Entra en [render.com](https://render.com) e inicia sesión (puedes acceder directamente con tu cuenta de GitHub).
2. En tu Dashboard principal de Render, pulsa en el botón azul **«New +»** (arriba a la derecha).
3. Selecciona la opción **«Static Site»**.
4. Conecta tu cuenta de GitHub y busca el repositorio `sintonia-pwa`. Pulsa en **«Connect»**.
5. Rellena los datos de configuración:

| Campo | Valor |
| :--- | :--- |
| **Name** | `sintonia-pwa` (esto definirá tu URL gratuita: `https://sintonia-pwa.onrender.com`) |
| **Branch** | `main` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

6. En la sección **Environment Variables** (Variables de entorno), pulsa en **«Add Environment Variable»** e introduce las variables de tu archivo `.env` de Firebase:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

7. Pulsa en el botón **«Create Static Site»**.

---

## 4. Enrutamiento SPA con `_redirects`

Render detectará automáticamente el archivo [`public/_redirects`](file:///C:/Users/Guill/.gemini/antigravity-ide/scratch/conexiones-pwa/public/_redirects) que ya está incluido en el proyecto:

```
/*    /index.html   200
```

Esto garantiza que al recargar la página o acceder a cualquier ruta directa en el navegador o en la PWA instalada, la aplicación cargue limpiamente sin errores 404.

---

## 5. Vincular Dominio en Firebase Authentication

Una vez que Render termine de compilar (tarda entre 1 y 2 minutos), obtendrás tu URL pública HTTPS (por ejemplo `https://sintonia-pwa.onrender.com`).

Para que el inicio de sesión y la verificación de correo funcionen en esa URL:
1. Copia tu subdominio de Render (ej. `sintonia-pwa.onrender.com`).
2. Ve a [console.firebase.google.com](https://console.firebase.google.com/) > tu proyecto > **Authentication** > pestaña **Ajustes** > **Dominios autorizados**.
3. Pulsa **«Añadir dominio»**, pega `sintonia-pwa.onrender.com` y guarda.

---

## 6. Probar la Instalación de la PWA

1. Abre la URL pública de Render en tu móvil (Safari en iOS, Chrome en Android o Chrome/Edge en ordenador).
2. Verás el botón destacado **«📲 Instalar APP»** en la pantalla inicial:
   - En **Android / Chrome / Edge**: Al pulsar se abrirá el diálogo nativo de instalación.
   - En **iPhone / iPad**: Al pulsar se abrirá la guía visual indicando tocar Compartir y «Añadir a pantalla de inicio».
3. Una vez instalada, la app se abrirá a pantalla completa en modo `standalone`, con su icono y sin barras de navegador.
