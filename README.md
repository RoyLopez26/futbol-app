# ⚽ FutbolManager Pro

Sistema de gestión de torneos de fútbol amateur desarrollado con React, TypeScript y Firebase.

## 📋 Características

- 🏆 Gestión de torneos de 3 o 4 equipos
- ⚽ Sistema de enfrentamientos round-robin
- 📊 Tabla de posiciones en tiempo real
- 📈 Historial de partidos
- 🔄 Sincronización en tiempo real con Firebase
- 📱 PWA - Instalable como aplicación nativa
- 🎨 Diseño responsive con tema futbolístico

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Firebase

### Configuración Local

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd futbol-manager
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar Firebase**
   - Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilitar Firestore Database
   - Copiar `.env.example` a `.env`
   - Completar las variables de entorno con tu configuración de Firebase

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 🔧 Configuración de Firebase

### 1. Crear Proyecto Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Crear nuevo proyecto
3. Habilitar Firestore Database (modo producción)
4. Configurar reglas de seguridad (usar el archivo `firestore.rules` incluido)

### 2. Variables de Entorno

Crear archivo `.env` con:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

### 3. Reglas de Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tournaments/{tournamentId} {
      allow read, write: if true;
      
      match /matches/{matchId} {
        allow read, write: if true;
      }
      
      match /teams/{teamId} {
        allow read, write: if true;
      }
    }
  }
}
```

## 🚀 Deployment

### Firebase Hosting

1. **Instalar Firebase CLI**
```bash
npm install -g firebase-tools
```

2. **Iniciar sesión**
```bash
firebase login
```

3. **Inicializar proyecto**
```bash
firebase init
```
   - Seleccionar: Firestore, Hosting
   - Directorio público: `dist`
   - SPA: Yes
   - Configurar builds automáticos: No

4. **Build y Deploy**
```bash
npm run build
firebase deploy
```

### Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run preview      # Preview build
npm run lint         # Linting
npm run deploy       # Build y deploy a Firebase
```

## 📱 Instalación como PWA

### En Safari (Mac/iOS)

1. Abrir la aplicación en Safari
2. Tocar el botón "Compartir"
3. Seleccionar "Agregar a pantalla de inicio"
4. Confirmar instalación

### En Chrome (Android/Desktop)

1. Abrir la aplicación en Chrome
2. Buscar el ícono de instalación en la barra de direcciones
3. Hacer clic en "Instalar"
4. Confirmar instalación

## 🎮 Uso de la Aplicación

### 1. Crear Torneo

- Ingresar nombre del torneo
- Seleccionar número de equipos (3 o 4)
- Ingresar nombres de equipos únicos
- Hacer clic en "Crear Torneo"

### 2. Gestionar Partidos

- Seleccionar equipos y registrar marcadores
- Confirmar resultados
- El sistema actualiza automáticamente las estadísticas

### 3. Ver Resultados

- **Tabla**: Posiciones ordenadas por puntos
- **Historial**: Todos los partidos jugados
- **Progreso**: Estado actual del torneo

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── TournamentSetup.tsx
│   ├── MatchManager.tsx
│   ├── StandingsTable.tsx
│   ├── MatchHistory.tsx
│   └── Header.tsx
├── context/            # Context API
│   └── TournamentContext.tsx
├── services/           # Servicios Firebase
│   ├── firebase.ts
│   └── tournamentService.ts
├── types/              # Tipos TypeScript
│   └── tournament.ts
└── App.tsx
```

## 📊 Sistema de Puntuación

- **Victoria**: 3 puntos
- **Empate**: 1 punto
- **Derrota**: 0 puntos

**Criterios de desempate:**
1. Puntos totales
2. Diferencia de goles
3. Goles a favor

## 🔒 Seguridad

- Todas las operaciones son client-side
- Reglas de Firestore configuradas para acceso público
- No se almacena información sensible
- Ideal para torneos casuales entre amigos

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase Firestore
- **Hosting**: Firebase Hosting
- **PWA**: Vite PWA Plugin
- **Build**: Vite
- **Linting**: ESLint

## 📝 Notas Adicionales

### Funcionamiento Offline

- La aplicación funciona offline después de la primera carga
- Los datos se sincronizan automáticamente cuando se restaura la conexión
- Service Worker cachea los archivos estáticos

### Rendimiento

- Aplicación optimizada para dispositivos móviles
- Carga rápida gracias a Vite
- Imágenes y recursos optimizados

### Compatibilidad

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 🎯 Roadmap

- [ ] Autenticación de usuarios
- [ ] Historial de torneos
- [ ] Estadísticas avanzadas
- [ ] Exportar resultados (PDF/imagen)
- [ ] Modo oscuro
- [ ] Notificaciones push
- [ ] Múltiples formatos de torneo
- [ ] Compartir torneos en redes sociales

---

**¡Disfruta organizando tus torneos de fútbol! ⚽🏆**