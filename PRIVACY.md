# Privacidad

**Resumen: Mussify no tiene cuentas, no tiene nube y no tiene telemetría. Todo queda en tu dispositivo.**

## Qué datos guarda

| Dato | Para qué | Dónde |
|---|---|---|
| Ajustes (nomenclatura, tema, afinación, umbral, etc.) | Recordar tus preferencias | Base SQLite local (`kv` → `prefs`) |
| Progreso (conceptos dominados, tarjetas de repaso, estadísticas de aciertos por ejercicio, historial, racha, diario de práctica) | El camino de aprendizaje y el repaso espaciado | Base SQLite local (`kv` → `progress`) |
| Archivos que importás o descargás, con tus marcadores, notas y correcciones del análisis | La biblioteca | Carpeta `library/` + tabla `library` |
| Registro de red (fecha, destino, motivo, resultado) | Que puedas ver cada conexión que hizo la app | Tabla `netlog` |

Ubicación: en Linux, `~/.local/share/org.mussify.app/`; en Android, el almacenamiento interno de la app (no accesible por otras apps).

## Qué NO hace

- No envía datos a ningún servidor. No hay analytics, ni reportes de errores remotos, ni SDKs de publicidad, ni Firebase, ni Google Play Services.
- No pide micrófono, ubicación, contactos ni acceso amplio al almacenamiento. Los archivos se eligen con el selector del sistema.
- No busca actualizaciones automáticamente.
- La interfaz no puede conectarse a internet: su política de seguridad (CSP) solo permite comunicarse con el propio backend.

## La red

La **única** función que usa la red es **buscar y descargar audio con yt-dlp** (más las miniaturas de los resultados de búsqueda, que la app trae de `i.ytimg.com`, el servidor de imágenes de YouTube), y solo cuando:

1. el interruptor **Ajustes → Red → Permitir conexiones de red** está activado (viene **apagado**), y
2. vos pedís una búsqueda o una descarga y confirmás el diálogo que muestra qué se va a buscar/descargar y desde dónde.

Cada uso queda en el **registro de conexiones** (Ajustes → Red), incluida la descarga de miniaturas. Las miniaturas se piden con una dirección armada solo a partir del id del video, se descargan en el backend y se le pasan a la interfaz como datos; la interfaz sigue sin poder conectarse a nada. En Android esta función no está disponible.

Podés verificarlo vos mismo con `scripts/net-audit/run.sh`, que registra toda conexión de la app y de sus procesos hijos.

## Respaldo

**Exportar progreso** crea un archivo JSON que guardás donde quieras. Si ponés contraseña, se cifra con AES-256-GCM (clave derivada con Argon2id). El archivo nunca sale del dispositivo salvo que vos lo muevas. Al importar un respaldo, el permiso de red **no** se importa: queda apagado.

## Borrar datos

- **Ajustes → Borrar todo el progreso** elimina el progreso (no la biblioteca).
- Cada archivo de la biblioteca se puede borrar individualmente.
- Desinstalar la app (o borrar la carpeta de datos en Linux) elimina todo.
