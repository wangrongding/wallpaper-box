<p align="center">
  <a href="https://github.com/wangrongding/wallpaper-box" target="_blank">
    <img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021532343.svg" width="300" alt="wallpaper-box logo"/>
  </a>
</p>

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md) | [Español](./README.es.md)

🏞️ `wallpaper-box` no es solo otro descargador de fondos de pantalla. Es un cliente que hace que tu escritorio cobre vida de verdad: fondos estáticos, fondos de vídeo, fondos web, fondos generados por IA, además de un icono animado en la barra de menús estilo RunCat que reacciona al uso de CPU.

## Características

- [x] Generación de fondos de pantalla con IA a partir de texto
- [x] Explorar y buscar fondos en línea
- [x] Descargar fondos localmente
- [x] Establecer fondos estáticos
- [x] Establecer fondos de vídeo (en macOS la ventana es a pantalla completa pero no cubre toda la pantalla — ¡PRs bienvenidos!)
- [x] Descargar vídeos de YouTube / Bilibili con `yt-dlp` y usarlos directamente como fondos animados
- [x] Establecer fondos web
- [x] Generar fondos con IA mediante prompts de texto
- [x] Soporte tanto de URLs online como de archivos HTML locales como fondos web
- [x] Iconos animados en la barra de menús (estilo RunCat) que cambian de velocidad según el uso de CPU
- [x] Abrir al iniciar sesión
- [x] Soporte de proxy HTTP

## Notas de plataforma

- Los scripts de empaquetado se centran principalmente en macOS.
- Las compilaciones por defecto son `universal` (compatibles con Apple Silicon e Intel).
- También hay comandos para compilar `x64` y `arm64` por separado.
- La versión mínima soportada de macOS es `10.13`.
- La aplicación no está firmada por Apple Developer. Deberás permitirla manualmente la primera vez.

## Uso

### Lista de fondos de pantalla

Los fondos provienen de wallhaven.cc.

- Busca, filtra, previsualiza, descarga y aplica fondos directamente.
- Los fondos estáticos descargados se guardan por defecto en `~/wallpaper-box`.

<table>
  <tr>
     <td width="50%" align="center"><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021543565.png"/></td>
     <td width="50%" align="center"><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021752830.gif"/></td>
  </tr>
</table>

### Fondos animados (vídeo)

Permite usar archivos de vídeo locales como fondos de escritorio dinámicos. También puedes pegar enlaces de YouTube / Bilibili para descargarlos y usarlos directamente.

- Soporta selección con clic o arrastrar y soltar.
- Pega enlaces de `YouTube / Bilibili` para descargar vídeos.
- Formatos comunes como `MP4`, `MOV`, `WebM` son compatibles.
- En macOS la ventana del fondo animado puede no cubrir toda la pantalla — ¡contribuciones bienvenidas!

<img width="1441" height="900" alt="image" src="https://github.com/user-attachments/assets/ad7e851d-6c14-4780-87d4-bf0c4d1651da" />

Notas:

- Los vídeos descargados se guardan en `~/wallpaper-box/videos`
- El vídeo se establece automáticamente como fondo tras la descarga
- Los paquetes de lanzamiento incluyen `yt-dlp` y `Deno` — no es necesario instalar nada manualmente
- Para vídeos con flujos de audio y vídeo separados, puede que también necesites incluir `ffmpeg` y `ffprobe` en `resources/bin/`
- Usar el binario oficial `yt-dlp_macos` puede elevar el requisito mínimo efectivo de sistema a macOS 10.15+

<table>
  <tr>
      <td width="50%" align="center"><b>Windows:</b></td>
      <td width="50%" align="center"><b>macOS:</b></td>
  </tr>
  <tr>
     <td><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/images202204250101273.gif"/></td>
     <td><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/Kapture%202025-07-09%20at%2000.53.05.gif"/></td>
  </tr>
</table>

### Fondos web

Permite usar cualquier página web como fondo de escritorio. Soporta tanto URLs online como archivos HTML locales.

- **URLs online**: Solo introduce la dirección.
  - Ejemplo: `https://wangrongding.github.io/jellyfish/`
  - `google.com` o `localhost:3000` añadirán automáticamente el protocolo.
- **Archivos locales**: Selecciona o arrastra archivos locales `HTML/HTM/SVG`.
  - Ejemplo macOS/Linux: `/Users/tu-nombre/Coding/jellyfish/index.html`
  - Ejemplo Windows: `C:\Users\tu-nombre\Coding\jellyfish\index.html`

### Fondos con IA

Genera fondos de pantalla directamente a partir de texto.

- La configuración de IA está en la página **AI Wallpaper**, no en Ajustes globales.
- Las imágenes generadas se guardan automáticamente en `~/wallpaper-box`.
- Tras generar puedes aplicarla como fondo o abrir su carpeta.

<img width="1441" height="900" alt="image" src="https://github.com/user-attachments/assets/cf239b2a-e9c7-4a59-9ec0-9c36689af1a6" />

Actualmente soporta dos tipos comunes de API:

- Endpoints compatibles con la API de Imágenes de OpenAI
- Zhipu `glm-image`

Ejemplos de configuración recomendados:

- OpenAI
  - `API Base URL`: `https://api.openai.com/v1`
  - `Model`: `gpt-image-1`
- Zhipu BigModel
  - `API Base URL`: `https://open.bigmodel.cn/api/paas/v4`
  - `Model`: `glm-image`

Notas:

- Si usas la URL completa de Zhipu `https://open.bigmodel.cn/api/paas/v4/images/generations`, también funciona.
- `glm-image` permite tamaño personalizado.
- Límites de tamaño personalizado: `512-2048`, y tanto el ancho como el alto deben ser múltiplos de `32`.

Consejos para los prompts:

- Estructura recomendada: `sujeto principal + estilo/textura + iluminación/hora + composición + requisitos del fondo`
- Ejemplo: `ciudad costera futurista, contraluz al atardecer, composición cinematográfica gran angular, espacio negativo limpio, ideal como fondo de escritorio panorámico, sin personas, sin texto, sin marca de agua`

### Iconos animados en la barra de menús

El icono de la barra de menús cambia la velocidad de animación según el uso de CPU en tiempo real. Puedes previsualizar y cambiar temas desde el menú de la bandeja o desde la página dedicada **Iconos Animados**.

<table>
  <tr>
     <td width="50%" align="center"><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202212301215445.gif"/></td>
     <td width="50%" align="center"><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021550728.png"/></td>
  </tr>
</table>

<img width="1390" alt="image" src="https://github.com/user-attachments/assets/470fcc81-5348-41be-9b1f-d55f0f6d07c5" />

Ya no es necesario editar manualmente [electron/tray-list.ts](./electron/tray-list.ts).

- Los iconos integrados se escanean automáticamente de las subcarpetas en [public/icons](./public/icons).
- Los iconos personalizados se pueden importar o eliminar desde la página **Iconos Animados**, o simplemente colocarlos en `~/wallpaper-box/tray-icons/<nombre-del-icono>/`.
- Los fotogramas de un mismo grupo se reproducen en orden de nombre de archivo (por ejemplo `001.png`, `002.png`...).

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301030045464.gif" width="600" />

### Ajustes

La página de Ajustes globales contiene las opciones generales:

- Abrir al iniciar sesión
- Proxy HTTP
- Prueba de conectividad del proxy
- Ubicación por defecto de almacenamiento de fondos (actualmente `~/wallpaper-box`)

Notas:

- La prueba de proxy intenta alcanzar Google.
- La configuración de la API de IA está en la página **AI Wallpaper**, no aquí.
- La previsualización, cambio e importación de iconos de la bandeja se han movido a la página independiente **Iconos Animados**.

<img width="1000" alt="531b7f4d-270e-4233-8a14-fbc2d4d4c2ff" src="https://github.com/user-attachments/assets/2987e3fa-08f5-4251-bd06-8d0a451d30f7" />

## Desarrollo

### Instalar dependencias

```sh
pnpm install
```

Notas:

- `pnpm install` ejecuta automáticamente `prepare` y descarga `yt-dlp` / `Deno` / `ffmpeg` / `ffprobe` en `resources/bin/`.
- Si los binarios ya existen, se omiten.
- Para forzar la actualización de los binarios: `pnpm prepare:video-downloader`

### Preparar binarios de descarga de vídeo (manual)

```sh
pnpm prepare:video-downloader
```

Este script descarga lo siguiente en `resources/bin/`:

- `yt-dlp_macos`
- `deno-aarch64-apple-darwin`
- `deno-x86_64-apple-darwin`
- `ffmpeg-darwin-arm64`
- `ffprobe-darwin-arm64`
- `ffmpeg-darwin-x64`
- `ffprobe-darwin-x64`

Notas:

- Estos archivos se incluyen en la app mediante `electron-builder.extraResources`.
- `yt-dlp` selecciona automáticamente el `ffmpeg`/`ffprobe` correspondiente a la arquitectura actual cuando hay flujos de audio y vídeo separados.
- En desarrollo se pueden sobrescribir las rutas con variables de entorno: `WALLPAPER_BOX_YT_DLP_PATH`, etc.

### Desarrollo local

Iniciar Web y Electron juntos:

```sh
pnpm dev
```

En terminales separados:

```sh
pnpm dev:web
pnpm dev:electron
```

Ejecutar Electron contra un bundle construido localmente:

```sh
pnpm build:web
pnpm build:electron
pnpm electron:start
```

## Empaquetado

Los artefactos de compilación se generan en el directorio `out/`.

Notas sobre arquitecturas:

- `universal`: Un solo paquete que incluye tanto Intel (x64) como Apple Silicon (arm64).
- `x64`: Para Macs Intel antiguas.
- `arm64`: Para Macs M1/M2/M3/M4.

```sh
# Recomendado por defecto (universal)
pnpm build

# Compilación explícita universal
pnpm build:mac:universal

# Solo Intel
pnpm build:mac:x64

# Solo Apple Silicon
pnpm build:mac:arm64

# Instalador DMG (universal)
pnpm build:dmg

# ZIP portátil (universal)
pnpm build:zip
```

## Preguntas frecuentes

### 1. macOS dice que no se puede abrir la aplicación

La app no está firmada por Apple Developer. Ejecuta estos comandos en Terminal:

```sh
sudo spctl --master-disable
sudo xattr -r -d com.apple.quarantine /Applications/wallpaper-box.app
```

Si la app no está en `/Applications`, reemplaza la ruta con la ubicación real del `.app` (arrastra la app desde Finder a Terminal).

### 2. "Esta aplicación no es compatible con este Mac"

- Tu versión de macOS es anterior a `10.13`
- Descargaste una compilación de arquitectura incorrecta

Prefiere el paquete `universal` por defecto. También puedes compilar `x64` o `arm64` por separado si lo necesitas.

### 3. La generación con IA devuelve `404 not found`

Si usas Zhipu BigModel, la versión actual soporta tanto:

- `https://open.bigmodel.cn/api/paas/v4`
- `https://open.bigmodel.cn/api/paas/v4/images/generations`

¿Sigue fallando? Comprueba:

- API Key
- El modelo está puesto como `glm-image`
- No hay errores evidentes de escritura en `API Base URL`

### 4. Errores con tamaño personalizado de IA

Límites de ancho/alto personalizado de `glm-image`:

- Rango: `512-2048`
- Tanto el ancho como el alto deben ser múltiplos de `32`

Ejemplos válidos:

- `2048x1152`
- `2048x1280`
- `1792x1024`

## Consejos de directorios

- Fondos estáticos y de IA: `~/wallpaper-box`
- Configuración de IA: Página **AI Wallpaper** → botón **Settings** en la esquina superior derecha

## Finalmente

Si encuentras útil este proyecto, ¡considera darle una ⭐️! Gracias.

Las contribuciones, issues y PRs son muy bienvenidos.
