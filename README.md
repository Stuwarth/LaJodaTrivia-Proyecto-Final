# La Joda Trivia — App de Trivia Boliviana

[![React Native](https://img.shields.io/badge/React%20Native-0.81.x-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Realtime%20DB%20%7C%20Storage-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/docs)
[![React Navigation](https://img.shields.io/badge/React%20Navigation-7.x-CA4245?logo=react&logoColor=white)](https://reactnavigation.org/)
[![Native Stack](https://img.shields.io/badge/Native%20Stack-7.x-000000)](https://reactnavigation.org/docs/native-stack/)

Trivia móvil en tiempo real inspirada en la cultura boliviana. Incluye emparejamiento 1v1, salas por código/QR, perfiles con avatar y backend en Firebase Realtime Database.

### Principales características
- Autenticación, perfil y avatar
- Modo clásico 1v1 con emparejamiento seguro (una sola sala por match)
- Salas por código/QR, presencia online y lista de jugadores
- Flujo por rondas: pregunta → revelación → resultados → final
- Limpieza automática de salas al finalizar
- UI responsiva para pantallas pequeñas

### Stack
- React Native CLI + TypeScript
- Navegación: @react-navigation/native + native-stack
- Firebase (RN Firebase): app, auth, database, storage
- UI: react-native-vector-icons, react-native-qrcode-svg
- Media: react-native-image-picker, react-native-permissions

### Estructura
```
LaJodaTrivia/
├─ android/ ios/
├─ src/
│  ├─ screens/ (Home, Login, Matchmaking, RoomLobby, Question, Reveal, Results)
│  ├─ services/ (auth, matchmaking, rooms, game, questions)
│  ├─ navigation/  └─ ui/
├─ database.rules.json
└─ docs/
```

### Modelo de datos (RTDB)
- /questions/{category}/{id}
- /rooms/{code} (stage, rounds, players, scores)
- /presence/{code}/{uid}
- /queue/classic/{waiting|matched|creating}
- /users/{uid}

Stages: lobby → question → reveal → results → finished

### Reglas de seguridad
Archivo: `database.rules.json`
- Lectura pública de preguntas
- `users/{uid}` solo dueño
- `rooms/{code}` y `presence/{code}` solo miembros; lectura temporal si `queue/classic/matched/{uid}.code == code`
- Emparejamiento: lock `/queue/classic/creating` por UID; `matched/{uid}` legible solo por dueño y escribible por participantes

Publicación: Firebase Console → Realtime Database → Rules → pega y Publish.

### Emparejamiento (resumen)
1) A entra: marca `/queue/classic/waiting` y espera `matched/A`
2) B entra: consume `waiting` con transacción, toma lock en `creating`, crea `rooms/{code}` y escribe `matched/A` y `matched/B` con el mismo code
3) Ambos se unen a la sala; luego se limpia `matched/{uid}`
4) Al terminar y quedar vacía, la sala se borra

### Configuración y ejecución
1) Configura Firebase (google-services.json y GoogleService-Info.plist)
2) Instala deps: `npm install`
3) Arranca bundler: `npm start`
4) Android: `npm run android`  |  iOS (macOS): `npm run ios`

Notas Android
- Si usas avatar en Android 13+, requiere READ_MEDIA_IMAGES; en <13, READ_EXTERNAL_STORAGE
- Asegura fonts de vector-icons linkeadas (gradle)

### Librerías principales
- [React](https://react.dev/), [React Native](https://reactnative.dev/), [TypeScript](https://www.typescriptlang.org/)
- [React Navigation](https://reactnavigation.org/) · [Native Stack](https://reactnavigation.org/docs/native-stack/)
- RN Firebase: [App](https://rnfirebase.io/), [Auth](https://rnfirebase.io/auth/usage), [Realtime Database](https://rnfirebase.io/database/usage), [Storage](https://rnfirebase.io/storage/usage)
- UI: [react-native-vector-icons](https://github.com/oblador/react-native-vector-icons), [react-native-qrcode-svg](https://github.com/awesomejerry/react-native-qrcode-svg)
- Media/permiso: [react-native-image-picker](https://github.com/react-native-image-picker/react-native-image-picker), [react-native-permissions](https://github.com/zoontek/react-native-permissions)
- QR Scanner (opcional): [react-native-camera-kit](https://github.com/teslamotors/react-native-camera-kit)

### Scripts útiles
- `npm start` — Metro
- `npm run android` — Build y run Android
- `npm test` — Tests

### Solución de problemas
- Se crearon dos salas al tiempo: verifica reglas publicadas (creating/matched) y mismo proyecto Firebase en ambos dispositivos
- Permission denied: confirma autenticación y reglas actuales
- UI recortada: las pantallas usan ScrollView y escalado dinámico; reinstala si vienes de build anterior

### Créditos
Hecho con React Native y Firebase. “La Joda” busca ser ligera, festiva y educativa.
