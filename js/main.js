const mobile = window.matchMedia("(max-width: 720px)");

// Carrusel de portada (solo móvil). Cada diapositiva se coloca por su
// distancia a la activa en vez de mover una tira: así el salto de la última
// a la primera ocurre fuera de pantalla y el bucle no da tirones.
const HERO_PHOTOS = [
  "assets/hero.webp",
  "assets/rooms/piscina/1.webp",
  "assets/rooms/salon-1/1.webp",
  "assets/rooms/habitacion-1/1.webp",
  "assets/rooms/jardin/2.webp",
];

const HERO_INTERVAL = 4000;

const heroEl = document.querySelector(".hero");
const stillMotion = matchMedia("(prefers-reduced-motion: reduce)");
let carousel = null;

const buildCarousel = () => {
  if (carousel || !heroEl) return;

  const container = document.createElement("div");
  container.className = "hero-carousel";

  const slides = HERO_PHOTOS.map((src, i) => {
    const slide = document.createElement("div");
    slide.className = "hero-slide";
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.loading = i === 0 ? "eager" : "lazy";
    // Sin esto el arrastre nativo de imágenes secuestra el gesto y el
    // navegador dispara pointercancel antes de que llegue el pointerup.
    img.draggable = false;
    slide.appendChild(img);
    container.appendChild(slide);
    return slide;
  });

  heroEl.prepend(container);
  heroEl.classList.add("has-carousel");

  const n = slides.length;
  let active = 0;
  let timer = null;

  // Las laterales se solapan bajo la central (menos del 100% de su ancho)
  // y giran, como fotos encaradas en un carrete circular.
  const STEP = 42; // % del ancho de cada foto
  const ANGLE = 8; // grados por posición

  const layout = () => {
    slides.forEach((slide, i) => {
      let offset = i - active;
      if (offset > n / 2) offset -= n;
      if (offset < -n / 2) offset += n;

      const scale = offset === 0 ? 1 : 0.82;
      slide.style.transform =
        `translateX(calc(-50% + ${offset} * ${STEP}%)) rotate(${offset * ANGLE}deg) scale(${scale})`;
      slide.style.opacity = Math.abs(offset) <= 1 ? 1 : 0;
      slide.style.zIndex = String(3 - Math.abs(offset));
    });
  };

  const go = (delta) => {
    active = (active + delta + n) % n;
    layout();
  };

  const start = () => {
    if (stillMotion.matches) return;
    stop();
    timer = setInterval(() => go(1), HERO_INTERVAL);
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  // Deslizar: el paso automático se detiene mientras el dedo está encima.
  let startX = null;
  container.addEventListener("pointerdown", (event) => {
    startX = event.clientX;
    // Capturar el puntero garantiza que el pointerup vuelva aquí aunque
    // el dedo termine sobre otra diapositiva.
    container.setPointerCapture(event.pointerId);
    stop();
  });

  const endSwipe = (event) => {
    if (startX !== null) {
      const dx = event.clientX - startX;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    }
    startX = null;
    start();
  };

  container.addEventListener("pointerup", endSwipe);
  container.addEventListener("pointercancel", endSwipe);

  layout();
  start();
  carousel = { container, start, stop };
};

const destroyCarousel = () => {
  if (!carousel) return;
  carousel.stop();
  carousel.container.remove();
  heroEl.classList.remove("has-carousel");
  carousel = null;
};

const syncCarousel = () => (mobile.matches ? buildCarousel() : destroyCarousel());

syncCarousel();
mobile.addEventListener("change", syncCarousel);

// Los datos del alojamiento viven en la portada en móvil y junto al párrafo
// de "Descubre la casa" en desktop. Se mueve el mismo nodo en vez de
// duplicar el markup, para no tener dos textos que mantener en sincronía.
const heroMeta = document.querySelector(".hero-meta");
const heroContent = document.querySelector(".hero-content");
const discoverMeta = document.getElementById("discoverMeta");

if (heroMeta && discoverMeta) {
  const placeMeta = () => {
    const target = mobile.matches ? heroContent : discoverMeta;
    if (heroMeta.parentNode !== target) target.appendChild(heroMeta);
  };

  placeMeta();
  mobile.addEventListener("change", placeMeta);
}

// Menú móvil a pantalla completa
const navToggle = document.getElementById("navToggle");
const navToggleIcon = document.getElementById("navToggleIcon");
const navLinks = document.getElementById("navLinks");

const setMenu = (open) => {
  navLinks.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggleIcon.className = open ? "ph ph-x" : "ph ph-list";
  document.body.style.overflow = open ? "hidden" : "";
  document.getElementById("floatingCta").classList.toggle("visible", !open);
};

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    setMenu(!navLinks.classList.contains("open"));
  });

  // Al elegir un destino el menú se cierra y te deja verlo.
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navLinks.classList.contains("open")) setMenu(false);
  });
}

// Scrollspy del sidebar "Descubre la casa" (solo desktop: en móvil es acordeón)
const discoverNav = document.getElementById("discoverNav");
const rooms = Array.from(document.querySelectorAll(".room"));

if (discoverNav && rooms.length) {
  const navLinksByTarget = new Map(
    Array.from(discoverNav.querySelectorAll("a")).map((link) => [
      link.getAttribute("href").slice(1),
      link,
    ])
  );

  const setActive = (id) => {
    navLinksByTarget.forEach((link) => link.classList.remove("active"));
    const activeLink = navLinksByTarget.get(id);
    if (activeLink) activeLink.classList.add("active");
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
  );

  rooms.forEach((room) => observer.observe(room));
  setActive(rooms[0].id);
}

// Acordeones (espacios y servicios): uno abierto a la vez, todos cerrados al entrar
const accordions = [
  {
    items: rooms,
    button: (item) => item.querySelector(".room-toggle"),
  },
  {
    items: Array.from(document.querySelectorAll(".service-group")),
    button: (item) => item.querySelector(".service-toggle"),
  },
];

accordions.forEach(({ items, button }) => {
  const setOpen = (item, open) => {
    item.toggleAttribute("data-open", open);
    button(item).setAttribute("aria-expanded", String(open));
  };

  items.forEach((item) => {
    button(item).addEventListener("click", () => {
      if (!mobile.matches) return;
      const willOpen = !item.hasAttribute("data-open");
      items.forEach((other) => setOpen(other, false));
      setOpen(item, willOpen);
      if (willOpen) {
        item.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // En desktop el contenido siempre está visible, así que aria-expanded
  // debe reflejarlo aunque el acordeón no se use.
  const syncToViewport = () => {
    items.forEach((item) => {
      if (mobile.matches) setOpen(item, item.hasAttribute("data-open"));
      else button(item).setAttribute("aria-expanded", "true");
    });
  };

  syncToViewport();
  mobile.addEventListener("change", syncToViewport);
});

// Lightbox: una sola galería continua, encadenando un espacio con el siguiente
const lightbox = document.getElementById("lightbox");

if (lightbox) {
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxRoom = document.getElementById("lightboxRoom");
  const lightboxCount = document.getElementById("lightboxCount");
  const floatingCta = document.getElementById("floatingCta");

  const photos = [];
  document.querySelectorAll(".room-grid").forEach((grid) => {
    // Se guarda el elemento, no su texto: así el rótulo sigue al idioma activo.
    const heading = grid.closest(".room").querySelector("h3");
    const images = Array.from(grid.querySelectorAll("img"));
    const base = photos.length;
    images.forEach((img, i) => {
      img.addEventListener("click", () => open(base + i));
      photos.push({ img, heading, position: i + 1, total: images.length });
    });
  });

  let index = 0;

  const render = () => {
    const photo = photos[index];
    lightboxImg.src = photo.img.src;
    lightboxImg.alt = photo.img.alt;
    lightboxRoom.textContent = photo.heading.textContent;
    lightboxCount.textContent = `${photo.position} / ${photo.total}`;
  };

  function open(startIndex) {
    index = startIndex;
    render();
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
    if (floatingCta) floatingCta.classList.remove("visible");
  }

  const close = () => {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
    if (floatingCta) floatingCta.dispatchEvent(new Event("recheck"));
  };

  const step = (delta) => {
    index = (index + delta + photos.length) % photos.length;
    render();
  };

  document.getElementById("lightboxClose").addEventListener("click", close);
  document.getElementById("lightboxPrev").addEventListener("click", () => step(-1));
  document.getElementById("lightboxNext").addEventListener("click", () => step(1));

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("open")) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") step(-1);
    if (event.key === "ArrowRight") step(1);
  });
}

// CTA flotante: visible desde el inicio, salvo con el lightbox o el menú abiertos
const floatingCta = document.getElementById("floatingCta");

if (floatingCta) {
  const update = () => {
    const blocked =
      document.getElementById("lightbox").classList.contains("open") ||
      navLinks.classList.contains("open");
    floatingCta.classList.toggle("visible", !blocked);
  };

  floatingCta.addEventListener("recheck", update);
  update();
}

// Entrada progresiva de las secciones al aparecer en pantalla
const revealTargets = document.querySelectorAll(
  ".section-title, .discover-intro, .section-intro, .room, .service-group"
);

if (revealTargets.length && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  revealTargets.forEach((el) => el.classList.add("reveal"));

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
  );

  revealTargets.forEach((el) => revealObserver.observe(el));
}

// Idioma: por defecto el del navegador (español -> ES, resto -> EN)
const langToggle = document.getElementById("langToggle");

if (langToggle && typeof TRANSLATIONS !== "undefined") {
  const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT"]);
  const texts = [];
  const attrs = [];

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      !SKIP.has(node.parentNode.nodeName) && node.nodeValue.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const raw = node.nodeValue;
    const es = raw.trim();
    if (!TRANSLATIONS[es]) continue;
    const start = raw.indexOf(es);
    texts.push({ node, es, prefix: raw.slice(0, start), suffix: raw.slice(start + es.length) });
  }

  document.querySelectorAll("[alt], [aria-label]").forEach((el) => {
    ["alt", "aria-label"].forEach((name) => {
      const es = el.getAttribute(name);
      if (es) attrs.push({ el, name, es });
    });
  });

  const description = document.querySelector('meta[name="description"]');
  const originalTitle = document.title;

  // Los alt siguen el patrón "<espacio> de A Leira": se traducen por regla
  // en vez de meter las 38 cadenas en el diccionario.
  const translateAttr = (value) => {
    if (TRANSLATIONS[value]) return TRANSLATIONS[value];
    const room = value.match(/^(.*) de A Leira$/);
    if (room && TRANSLATIONS[room[1]]) return `${TRANSLATIONS[room[1]]} at A Leira`;
    return value;
  };

  const setLanguage = (lang) => {
    const en = lang === "en";
    texts.forEach(({ node, es, prefix, suffix }) => {
      node.nodeValue = prefix + (en ? TRANSLATIONS[es] : es) + suffix;
    });
    attrs.forEach(({ el, name, es }) => {
      el.setAttribute(name, en ? translateAttr(es) : es);
    });

    document.documentElement.lang = lang;
    document.title = en ? TRANSLATIONS[originalTitle] || originalTitle : originalTitle;
    if (description) {
      const es = description.dataset.es || description.content;
      description.dataset.es = es;
      description.content = en ? TRANSLATIONS[es] || es : es;
    }

    // El botón es solo un icono: el idioma de destino va en aria-label
    // (lectores de pantalla) y en title (tooltip para quien ve).
    const label = en ? "Cambiar a español" : "Switch to English";
    langToggle.setAttribute("aria-label", label);
    langToggle.setAttribute("title", label);
    langToggle.dataset.lang = lang;
  };

  setLanguage(navigator.language.toLowerCase().startsWith("es") ? "es" : "en");

  langToggle.addEventListener("click", () => {
    setLanguage(langToggle.dataset.lang === "es" ? "en" : "es");
  });
}
