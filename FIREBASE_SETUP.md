# Guía de Configuración de Firebase — Sintonía PWA
## 100% Gratuito en el Plan Spark (0 € de coste)

Esta guía explica detalladamente cómo configurar el backend gratuito de Firebase para **Sintonía PWA**.

---

## 1. Crear el Proyecto en Firebase

1. Entra en [console.firebase.google.com](https://console.firebase.google.com/) e inicia sesión con tu cuenta de Google.
2. Pulsa en el botón **«Añadir proyecto»** (o **«Crear un proyecto»**).
3. Introduce un nombre para el proyecto (por ejemplo: `sintonia-pwa` o `preguntas-conexiones`).
4. **Google Analytics**: Puedes desactivarlo o dejarlo activado (es gratuito).
5. Pulsa en **«Crear proyecto»** y espera unos segundos a que finalice.
6. Asegúrate de permanecer en el plan predeterminado **«Spark» (Sin coste / 0 €)**. No se requiere tarjeta de crédito ni facturación.

---

## 2. Habilitar Firebase Authentication (Cuentas únicas por correo)

1. En el menú lateral izquierdo, haz clic en **Compilación (Build)** > **Authentication**.
2. Pulsa en **«Comenzar»**.
3. En la pestaña **Método de inicio de sesión (Sign-in method)**, selecciona **«Correo electrónico/contraseña»**.
4. Activa la primera casilla: **«Habilitar»**.
5. *(Opcional)* Deja desmarcado «Vínculo del correo electrónico (acceso sin contraseña)».
6. Haz clic en **«Guardar»**.

### Configuración del Correo de Verificación:
1. En la pestaña **Plantillas (Templates)** de Authentication, selecciona **«Verificación de la dirección de correo electrónico»**.
2. Puedes personalizar el nombre del remitente (ej. *Sintonía*) y el mensaje en español si lo deseas.

---

## 3. Crear Cloud Firestore Database

1. En el menú lateral izquierdo, haz clic en **Compilación** > **Firestore Database**.
2. Pulsa en **«Crear base de datos»**.
3. Elige la **Ubicación de la base de datos** más cercana a tus usuarios (por ejemplo: `europe-west1` para Europa o `us-central1` para América).
4. Selecciona **«Iniciar en modo de producción»** y pulsa **Siguiente** / **Habilitar**.

---

## 4. Desplegar las Reglas de Seguridad (Protección de respuestas y privacidad)

1. En la consola de Firestore, entra en la pestaña **«Reglas» (Rules)**.
2. Borra el contenido que haya en el editor y pega exactamente el contenido del archivo [`firestore.rules`](file:///C:/Users/Guill/.gemini/antigravity-ide/scratch/conexiones-pwa/firestore.rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isConnectionParticipant(connectionId) {
      return isAuthenticated() && 
        request.auth.uid in get(/databases/$(database)/documents/connections/$(connectionId)).data.participants;
    }

    // 1. Perfiles de usuario
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId) && request.resource.data.uid == userId;
      allow update: if isOwner(userId) && request.resource.data.uid == userId;
      allow delete: if isOwner(userId);
    }

    // 2. Invitaciones con códigos únicos
    match /invites/{code} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                    request.resource.data.creatorUid == request.auth.uid &&
                    request.resource.data.status == 'pending' &&
                    request.resource.data.expiresAt > request.time.toMillis();

      allow update: if isAuthenticated() && (
        (resource.data.creatorUid == request.auth.uid && request.resource.data.status == 'revoked') ||
        (
          resource.data.creatorUid != request.auth.uid &&
          resource.data.status == 'pending' &&
          resource.data.expiresAt > request.time.toMillis() &&
          request.resource.data.status == 'accepted' &&
          request.resource.data.usedByUid == request.auth.uid
        )
      );
      allow delete: if isAuthenticated() && resource.data.creatorUid == request.auth.uid;
    }

    // 3. Conexiones independientes 1 a 1
    match /connections/{connectionId} {
      allow read: if isAuthenticated() && request.auth.uid in resource.data.participants;
      allow create: if isAuthenticated() && 
                    request.auth.uid in request.resource.data.participants &&
                    request.resource.data.participants.size() == 2 &&
                    request.resource.data.participants[0] != request.resource.data.participants[1];
      allow update, delete: if isAuthenticated() && request.auth.uid in resource.data.participants;

      // 4. Sesiones de juego sincronizadas
      match /sessions/{sessionId} {
        allow read: if isAuthenticated() && request.auth.uid in resource.data.participants;
        allow create: if isAuthenticated() && request.auth.uid in request.resource.data.participants;
        allow update: if isAuthenticated() && request.auth.uid in resource.data.participants;

        // 5. Respuestas protegidas (Server-Side Concealment)
        match /answers/{answerId} {
          allow create, update: if isAuthenticated() && 
            request.resource.data.uid == request.auth.uid &&
            request.auth.uid in get(/databases/$(database)/documents/connections/$(connectionId)/sessions/$(sessionId)).data.participants;

          // REGLA CRÍTICA: Solo se permite leer la respuesta de la otra persona si turnStatus == 'revealed'
          allow read: if isAuthenticated() && (
            resource.data.uid == request.auth.uid || 
            (
              request.auth.uid in get(/databases/$(database)/documents/connections/$(connectionId)/sessions/$(sessionId)).data.participants &&
              get(/databases/$(database)/documents/connections/$(connectionId)/sessions/$(sessionId)).data.turnStatus == 'revealed'
            )
          );

          allow delete: if isAuthenticated() && resource.data.uid == request.auth.uid;
        }
      }

      // 6. Historial compartido
      match /history/{historyId} {
        allow read, write: if isConnectionParticipant(connectionId);
      }
    }
  }
}
```

3. Pulsa el botón **«Publicar»** (Publish).

---

## 5. Obtener las Claves Web y Crear el Archivo `.env`

1. En la consola de Firebase, haz clic en el icono del **engranaje ⚙️** (arriba a la izquierda) > **Configuración del proyecto**.
2. En la pestaña **General**, baja hasta la sección **«Tus apps»**.
3. Pulsa en el icono de **Web** (`</>`).
4. Introduce el apodo de la app (ej. `Sintonia Web`) y pulsa **«Registrar app»**.
5. Verás un bloque de código con el objeto `firebaseConfig`. Copia cada uno de esos valores y pégalos en tu archivo `.env` dentro de la carpeta `conexiones-pwa`:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

---

## 6. Añadir los Dominios Autorizados de Render

Cuando publiques la aplicación en Render, Firebase debe autorizar el dominio gratuito de Render para permitir el inicio de sesión y la verificación:

1. En la consola de Firebase, ve a **Authentication** > pestaña **Ajustes (Settings)** > **Dominios autorizados (Authorized domains)**.
2. Pulsa en **«Añadir dominio»**.
3. Añade tu subdominio de Render (ejemplo: `sintonia-pwa.onrender.com`).
4. Haz clic en **Añadir**.

---

## 7. Cuotas Gratuitas de Firebase (Plan Spark) y Límites

El plan Spark de Firebase es 100% gratuito de por vida y no requiere tarjeta de crédito:

| Servicio | Límite diario gratuito | Consecuencia si se supera |
| :--- | :--- | :--- |
| **Firebase Authentication** | 50.000 usuarios activos mensuales | Nuevos registros pausados hasta el próximo mes |
| **Cloud Firestore (Lecturas)** | 50.000 lecturas / día | Las lecturas se pausan hasta las 00:00 PST (medianoche) |
| **Cloud Firestore (Escrituras)**| 20.000 escrituras / día | Las escrituras se pausan hasta las 00:00 PST |
| **Cloud Firestore (Almacenamiento)**| 1 GiB total | No se pueden guardar nuevos documentos si se llena |
| **Ancho de banda de red** | 10 GiB / mes | Conexiones pausadas hasta el próximo ciclo |

> [!NOTE]
> Para el uso entre parejas y grupos de amigos (e.g. 5 a 50 usuarios diarios), **estas cuotas gratuitas son más que suficientes** (consumirás menos del 1% del límite diario).
