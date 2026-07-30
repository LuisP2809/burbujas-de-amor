# Burbujas de Amor 💗

Experiencia web interactiva en la que cada burbuja revela un mensaje diferente.

## Funciones incluidas

- Diseño moderno tipo glassmorphism.
- Burbujas con movimiento fluido, rebote y separación automática.
- Diseño adaptable a celular, tablet y computadora.
- 25 mensajes sin repeticiones hasta completar la colección.
- Campo para personalizar el nombre de la portada.
- Generación y copia de enlace personalizado mediante `?para=Nombre`.
- Contador y barra de progreso.
- Partículas y celebración final personalizada.
- Música ambiental y efectos creados con Web Audio API, sin archivos externos.
- Controles profesionales para personalizar, compartir, instalar, sonido y reinicio.
- Aviso cuando existe una nueva versión disponible.
- Accesibilidad con botones reales, etiquetas y movimiento reducido.
- PWA con funcionamiento offline.

## Personalizar el nombre

La aplicación permite escribir el nombre desde la pantalla inicial. También se puede abrir directamente con un nombre en la dirección:

```text
https://luisp2809.github.io/burbujas-de-amor/?para=Nombre
```

Si no se indica un nombre, la experiencia utiliza **Dally**.

## Publicación con GitHub Pages

El repositorio incluye el workflow `.github/workflows/deploy-pages.yml`, que publica automáticamente cada cambio enviado a la rama `main`.

El sitio está disponible en:

```text
https://luisp2809.github.io/burbujas-de-amor/
```

## Archivos

- `index.html`: estructura de la interfaz.
- `styles.css`: diseño adaptable y animaciones visuales.
- `messages.js`: colección editable de 25 mensajes.
- `app.js`: movimiento, colisiones, personalización, sonido y progreso.
- `manifest.webmanifest`: configuración para instalarla como PWA.
- `sw.js`: caché, funcionamiento offline y actualizaciones.
- `icon.svg`: icono adaptable de la aplicación.
