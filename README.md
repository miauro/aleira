# A Leira

Web del alojamiento **A Leira**, en Becerril de la Sierra (Madrid).

Sitio estático: HTML, CSS y JavaScript sin dependencias ni paso de build. Se
despliega en Vercel tal cual.

## Estructura

```
index.html          Landing completa
css/style.css       Estilos
js/main.js          Acordeones, lightbox, scrollspy y CTA flotante
assets/
  rooms/            Fotos por espacio (redimensionadas a 1800px)
  fonts/            Supreme (fuente variable, woff2) + licencia
  hero.webp         Foto de portada
  logo.svg          Logo
  favicon.svg       Favicon
```

## Desarrollo

Al no haber build, basta con servir la carpeta:

```bash
python3 -m http.server 8123
```

## Notas

- Las fotos originales de cámara están en `Resources/` (fuera del repositorio
  por peso). Las del sitio son copias reducidas a 1800px y calidad 80.
- El botón "Reservar" apunta a `#`: falta conectarlo al sistema de reservas.
- Secciones pendientes: "La zona".
